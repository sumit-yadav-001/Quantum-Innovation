import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { AuthState, User } from '../../types'

// Rehydrate from localStorage so a page refresh doesn't log the user out
const savedToken = localStorage.getItem('hrms_token')
const savedUser = localStorage.getItem('hrms_user')

const initialState: AuthState = {
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken ?? null,
  isAuthenticated: !!savedToken,
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true
      state.error = null
    },

    loginSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      const { user, token } = action.payload
      state.loading = false
      state.isAuthenticated = true
      state.user = user
      state.token = token
      state.error = null
      localStorage.setItem('hrms_token', token)
      localStorage.setItem('hrms_user', JSON.stringify(user))
    },

    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.error = action.payload
      localStorage.removeItem('hrms_token')
      localStorage.removeItem('hrms_user')
    },

    logout(state) {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
      localStorage.removeItem('hrms_token')
      localStorage.removeItem('hrms_user')
      // Intentionally keeping hrms_mock_db so seeded data survives logout
    },
  },
})

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions
export default authSlice.reducer
