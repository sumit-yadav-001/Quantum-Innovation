import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Boot MSW before mounting React so the first API call is already intercepted.
// If the service worker fails (e.g. first load, incognito), the app still works
// via the inline fallback auth in Login.tsx.
async function startApp() {
  try {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
    })
    console.log('[MSW] worker running — all /api/* requests are intercepted')
  } catch (err) {
    console.warn('[MSW] worker failed to start, falling back to inline mock auth', err)
  }
}

startApp().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})
