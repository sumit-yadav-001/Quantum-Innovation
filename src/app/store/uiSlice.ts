import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}

const getInitialTheme = (): 'light' | 'dark' => {
  const saved = localStorage.getItem('hrms_theme') as 'light' | 'dark';
  if (saved === 'light' || saved === 'dark') return saved;
  
  // Media query check
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

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
      
      // Update DOM class list on document body
      if (nextTheme === 'dark') {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    },
    initTheme(state) {
      // Sync on load
      if (state.theme === 'dark') {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    }
  }
});

export const { toggleSidebar, setSidebar, toggleTheme, initTheme } = uiSlice.actions;
export default uiSlice.reducer;
