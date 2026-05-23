import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

const apiClient = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Attach the JWT on every outgoing request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('hrms_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (err: AxiosError) => Promise.reject(err)
)

// Normalize errors so every catch block gets a consistent shape
apiClient.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError) => {
    let message = 'Something went wrong. Please try again.'

    if (err.response) {
      const data = err.response.data as any
      message = data?.message || message

      // 401 means the token is gone — clear storage.
      // The redirect itself is handled by RequireAuth watching Redux state.
      if (err.response.status === 401) {
        localStorage.removeItem('hrms_token')
        localStorage.removeItem('hrms_user')
      }
    } else if (err.request) {
      message = 'No response from server — MSW may not be running.'
    } else {
      message = err.message
    }

    return Promise.reject({
      message,
      status: err.response?.status ?? 0,
      originalError: err,
    })
  }
)

export default apiClient
