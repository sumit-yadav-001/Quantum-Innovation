import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Login from '../../pages/Login';
import Dashboard from '../../pages/Dashboard';
import Employees from '../../pages/Employees';
import EmployeeProfile from '../../pages/EmployeeProfile';
import Attendance from '../../pages/Attendance';
import Leaves from '../../pages/Leaves';
import Payroll from '../../pages/Payroll';
import Departments from '../../pages/Departments';
import Documents from '../../pages/Documents';
import Settings from '../../pages/Settings';
import MainLayout from '../../components/layouts/MainLayout';
import { RequireAuth } from './RequireAuth';
import { RoleGuard } from './RoleGuard';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      {
        path: 'employees',
        element: (
          <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER']}>
            <Employees />
          </RoleGuard>
        ),
      },
      { path: 'employees/:id', element: <EmployeeProfile /> },
      { path: 'attendance', element: <Attendance /> },
      { path: 'leaves', element: <Leaves /> },
      { path: 'payroll', element: <Payroll /> },
      {
        path: 'departments',
        element: (
          <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER', 'TEAM_LEAD']}>
            <Departments />
          </RoleGuard>
        ),
      },
      { path: 'documents', element: <Documents /> },
      { path: 'settings', element: <Settings /> },
      { path: '*', element: <Navigate to="/dashboard" replace /> }
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
export default AppRouter;
