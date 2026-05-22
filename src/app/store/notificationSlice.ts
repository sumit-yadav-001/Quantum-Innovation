import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface NotificationState {
  toasts: ToastMessage[];
}

const initialState: NotificationState = {
  toasts: []
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addToast(state, action: PayloadAction<Omit<ToastMessage, 'id'>>) {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      state.toasts.push({
        ...action.payload,
        id
      });
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    }
  }
});

export const { addToast, removeToast } = notificationSlice.actions;
export default notificationSlice.reducer;
