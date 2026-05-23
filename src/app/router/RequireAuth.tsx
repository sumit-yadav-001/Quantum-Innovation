import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '../store'

interface RequireAuthProps {
  children: React.ReactNode
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAppSelector((s) => s.auth)
  const location = useLocation()

  // Still rehydrating from localStorage — show a spinner instead of flashing /login
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-500">Authenticating...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Save where the user was trying to go so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
