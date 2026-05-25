import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import { baseApi } from '../../api/baseApi'
import authReducer from './authSlice'
import uiReducer from './uiSlice'
import notificationReducer from './notificationSlice'

// Import all injected endpoint slices so they register before the store is used
import '../../api/slices/employeeApi'
import '../../api/slices/attendanceApi'
import '../../api/slices/leaveApi'
import '../../api/slices/payrollApi'
import '../../api/slices/departmentApi'
import '../../api/slices/documentApi'
import '../../api/slices/notificationApi'

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    ui: uiReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export default store
