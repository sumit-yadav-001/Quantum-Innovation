import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'


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
