import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}

const getInitialTheme = (): 'light' | 'dark' => {
  const saved = localStorage.getItem('hrms_theme') as 'light' | 'dark';
  if (saved === 'light' || saved === 'dark') return saved;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

// Apply theme class to <html> — Tailwind v4 dark mode reads from html element
function applyThemeToDOM(theme: 'light' | 'dark') {
  const root = document.documentElement; // <html>
  if (theme === 'dark') {
    root.classList.add('dark');
    document.body.classList.add('dark');
  } else {
    root.classList.remove('dark');
    document.body.classList.remove('dark');
  }
}

const initialState: UIState = {
  sidebarOpen: true,
  theme: getInitialTheme()
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebar(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    toggleTheme(state) {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = nextTheme;
      localStorage.setItem('hrms_theme', nextTheme);
      applyThemeToDOM(nextTheme);
    },
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload;
      localStorage.setItem('hrms_theme', action.payload);
      applyThemeToDOM(action.payload);
    },
    initTheme(state) {
      // Called on app boot — sync DOM with persisted theme
      applyThemeToDOM(state.theme);
    }
  }
});

export const { toggleSidebar, setSidebar, toggleTheme, setTheme, initTheme } = uiSlice.actions;
export default uiSlice.reducer;
