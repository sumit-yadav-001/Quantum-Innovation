import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store';
import type { UserRole } from '../../types';
import { addToast } from '../store/notificationSlice';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const hasAccess = user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!hasAccess && user) {
      dispatch(
        addToast({
          title: 'Access Denied',
          message: `Your account role (${user.role.replace('_', ' ')}) is not authorized to access that section.`,
          type: 'warning'
        })
      );
    }
  }, [hasAccess, user, dispatch]);

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
