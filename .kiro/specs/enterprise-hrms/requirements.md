# Requirements Document

## Introduction

AuraHR is a fully functional enterprise-grade Human Resource Management System (HRMS) frontend built with React 19, TypeScript, Vite, Tailwind CSS v4, Redux Toolkit, TanStack Query, React Hook Form, Zod, Recharts, TanStack Table, MSW (Mock Service Worker), and related libraries. The application simulates a real-world HR platform used by organizations to manage employees, attendance, payroll, leave workflows, departments, notifications, analytics, and administrative operations. All backend data is served by MSW interceptors backed by a seeded localStorage mock database. The system supports four roles — ADMIN, HR_MANAGER, TEAM_LEAD, and EMPLOYEE — each with distinct access scopes.

The existing codebase has a partial foundation: Axios client, MSW handlers, mock database, Redux store slices, React Query hooks, routing with role guards, and page/feature stubs. The goal of this spec is to define the complete requirements for implementing all modules to production-quality standards.

---

## Glossary

- **System**: The AuraHR HRMS frontend application.
- **User**: Any authenticated person interacting with the System.
- **ADMIN**: A User with full system access, including all employee, payroll, department, and system management capabilities.
- **HR_MANAGER**: A User with access to employee management, payroll, leave approvals, and department configuration.
- **TEAM_LEAD**: A User with access to team attendance, leave approval queues, and department views.
- **EMPLOYEE**: A User with self-service access to their own attendance, leaves, payslips, and documents.
- **MSW**: Mock Service Worker — the browser-based API interceptor that simulates backend responses using a seeded localStorage database.
- **Mock_DB**: The in-memory localStorage database seeded with 26 employees, 3 months of attendance, payroll history, leave requests, departments, documents, and notifications.
- **Auth_Guard**: The RequireAuth component that redirects unauthenticated Users to the login page.
- **Role_Guard**: The RoleGuard component that restricts route access based on User role.
- **Toast**: A transient notification message displayed in the bottom-right corner of the screen.
- **Punch**: A check-in or check-out attendance event recorded for a specific employee and date.
- **Payslip**: A detailed salary statement for a specific employee and month.
- **Leave_Balance**: The remaining days available for each leave type (SICK, CASUAL, ANNUAL) for an employee.
- **Drawer**: A side-panel overlay component used for add/edit forms.
- **Modal**: A centered overlay dialog component used for confirmations, forms, and detail views.
- **KPI_Card**: A dashboard metric card displaying a key performance indicator value with optional trend indicator.
- **Glassmorphism**: The frosted-glass visual style applied to cards and panels using Tailwind utility classes.
- **Dark_Mode**: The dark color scheme toggled via the UI slice and persisted to localStorage.
- **TanStack_Table**: The headless table library used for sortable, filterable, paginated data grids.
- **React_Query**: TanStack Query — the server-state management library used for all API data fetching, caching, and mutation.
- **Redux**: Redux Toolkit — the client-state management library used for auth, UI, and toast notification state.
- **Zod**: The schema validation library used with React Hook Form for form validation.
- **RBAC**: Role-Based Access Control — the permission model governing which roles can access which features.
- **CSV_Parser**: The PapaParse library instance used to parse and serialize CSV data.
- **XLSX_Exporter**: The XLSX library instance used to generate Excel workbook files from in-memory data arrays.

---

## Requirements

### Requirement 1: Authentication and Session Management

**User Story:** As a User, I want to log in with my email and password so that I can access the HRMS system with my role-specific permissions.

#### Acceptance Criteria

1. THE System SHALL render a login page at the `/login` route that is accessible without authentication.
2. WHEN a User submits valid credentials matching the Mock_DB fixed users (admin@hrms.com/admin123, hr@hrms.com/hr123, lead@hrms.com/lead123, employee@hrms.com/employee123) or any seeded employee email with password `password123`, THE System SHALL authenticate the User, store the JWT token and user object in localStorage under keys `hrms_token` and `hrms_user`, dispatch `loginSuccess` to the Redux auth slice, and redirect to `/dashboard`.
3. WHEN a User submits invalid credentials, THE System SHALL display an inline error message on the login form and dispatch a Toast notification of type `error`.
4. THE Login_Page SHALL display four quick-fill demo credential buttons (Administrator, HR Manager, Team Lead, Employee) that populate the email and password fields without submitting the form.
5. WHEN an unauthenticated User navigates to any protected route, THE Auth_Guard SHALL redirect the User to `/login` and preserve the attempted URL in router state for post-login redirect.
6. WHEN an authenticated User's token is cleared due to a 401 response or logout action, THE System SHALL remove `hrms_token` and `hrms_user` from localStorage, clear the Redux auth state, and redirect to `/login`.
7. THE System SHALL persist authentication state across page refreshes by rehydrating the Redux auth slice from localStorage on application initialization.
8. WHEN a User clicks the logout action in the navigation header, THE System SHALL dispatch the `logout` action, display a Toast notification of type `info`, and navigate to `/login`.

---

### Requirement 2: Role-Based Access Control and Navigation

**User Story:** As a User, I want to see only the navigation items and pages relevant to my role so that I am not exposed to features outside my access scope.

#### Acceptance Criteria

1. THE MainLayout SHALL render a sidebar navigation that filters nav items based on the authenticated User's role, showing only routes the role is permitted to access.
2. WHEN a User with role EMPLOYEE navigates to `/employees`, THE Role_Guard SHALL redirect the User to `/dashboard`.
3. WHEN a User with role EMPLOYEE navigates to `/departments`, THE Role_Guard SHALL redirect the User to `/dashboard`.
4. THE System SHALL enforce the following route-to-role access mapping: Dashboard (all roles), Employees (ADMIN, HR_MANAGER), Employee Profile (all roles), Attendance (all roles), Leaves (all roles), Payroll (all roles), Departments (ADMIN, HR_MANAGER, TEAM_LEAD), Documents (all roles), Settings (all roles).
5. WHEN a User with role EMPLOYEE or TEAM_LEAD accesses the Payroll page, THE System SHALL display only that User's personal payroll records and hide the bulk payroll management controls.
6. WHEN a User with role EMPLOYEE accesses the Leaves page, THE System SHALL display only that User's personal leave history and hide the approvals queue tab.
7. THE MainLayout sidebar SHALL collapse to icon-only mode when the sidebar toggle is activated, and expand back to full-label mode when toggled again, persisting the collapsed state in the Redux UI slice.

---

### Requirement 3: Application Layout and Navigation Shell

**User Story:** As a User, I want a consistent application shell with a sidebar, header, and content area so that I can navigate the system efficiently on both desktop and mobile.

#### Acceptance Criteria

1. THE MainLayout SHALL render a persistent sidebar on desktop viewports (width ≥ 768px) and a slide-in mobile menu triggered by a hamburger button on viewports narrower than 768px.
2. THE MainLayout header SHALL display the current page title, a dark/light mode toggle button, a notification bell with unread count indicator, and a user profile dropdown.
3. WHEN the User clicks the notification bell, THE System SHALL display a dropdown panel listing the most recent notifications with title, message, timestamp, and read/unread visual distinction.
4. WHEN the User clicks an unread notification in the dropdown, THE System SHALL call the PATCH `/api/notifications/:id/read` endpoint and update the notification's visual state to read.
5. THE MainLayout SHALL render a ToastContainer component in the bottom-right corner that displays active Toast messages with auto-dismiss after 5 seconds.
6. WHEN the application initializes, THE System SHALL dispatch the `initTheme` action from the Redux UI slice to apply the persisted theme class (`dark` or `light`) to the document body.
7. WHEN the User toggles the theme, THE System SHALL update the Redux UI slice, persist the selection to localStorage under key `hrms_theme`, and apply or remove the `dark` class on the document body immediately.

---

### Requirement 4: Dashboard and Analytics

**User Story:** As a User, I want a role-aware dashboard with KPI metrics and charts so that I can quickly understand the current state of the organization.

#### Acceptance Criteria

1. THE Dashboard SHALL display four KPI_Cards showing: active employee headcount, present employees today, pending leave approvals count, and monthly payroll outflow for the current cycle.
2. THE Dashboard SHALL render an area chart showing the workforce attendance trend for the last 7 active working days using data from the `/api/attendance/stats` endpoint.
3. THE Dashboard SHALL render a donut chart showing the employee distribution across departments using data derived from the employees API response.
4. THE Dashboard SHALL render a bar chart showing the monthly payroll expenditure trend for the last 6 months using data from the `/api/payroll/stats` endpoint.
5. THE Dashboard SHALL render a recent activity feed showing the last 5 attendance check-in events and leave requests for the current day.
6. THE Dashboard SHALL display a quick punch widget that reflects the authenticated User's current punch status for today (not clocked in / working / shift done) and provides a check-in or check-out button accordingly.
7. WHEN the User submits a punch action from the dashboard widget, THE System SHALL call the POST `/api/attendance/punch` endpoint, invalidate the attendance and notification query caches, and display a Toast notification confirming the action.
8. THE Dashboard SHALL display an "Apply Leave" button that opens a Modal containing a leave request form with type, start date, end date, and reason fields.
9. WHEN the User submits a valid leave application from the dashboard Modal, THE System SHALL call the POST `/api/leaves` endpoint, close the Modal, invalidate the leaves and notifications query caches, and display a Toast notification confirming submission.
10. IF the dashboard data fetch fails, THE System SHALL display an ErrorState component with a retry action button.

---

### Requirement 5: Employee Management

**User Story:** As an ADMIN or HR_MANAGER, I want to manage the employee roster so that I can add, edit, view, and remove employee records.

#### Acceptance Criteria

1. THE Employees_Page SHALL render a TanStack_Table displaying employee records with columns for name/avatar, contact details (email and phone), department/designation, joining date, attendance percentage bar, status badge, and action buttons.
2. THE Employees_Page SHALL support server-side search by name, email, or designation via a debounced text input with a minimum 300ms delay that appends a `search` query parameter to the API request.
3. THE Employees_Page SHALL support filtering by department and status via dropdown selects that append `department` and `status` query parameters to the API request.
4. THE Employees_Page SHALL support pagination with previous/next controls and a display of the current page range and total record count.
5. WHEN the User clicks "Add Employee", THE System SHALL open a Drawer containing a React Hook Form validated with a Zod schema requiring name, email, phone, department, designation, salary, joining date, and status fields.
6. WHEN the User submits a valid add-employee form, THE System SHALL call the POST `/api/employees` endpoint, close the Drawer, invalidate the employees and departments query caches, and display a success Toast.
7. WHEN the User clicks the edit icon on an employee row, THE System SHALL open the Drawer pre-populated with that employee's current data.
8. WHEN the User submits a valid edit-employee form, THE System SHALL call the PUT `/api/employees/:id` endpoint, close the Drawer, invalidate the employees and departments query caches, and display a success Toast.
9. WHEN the User clicks the delete icon on an employee row and confirms the action in a confirmation Modal, THE System SHALL call the DELETE `/api/employees/:id` endpoint, invalidate the employees and departments query caches, and display a success Toast.
10. THE Employees_Page SHALL provide an "Export Roster" button that generates and downloads an XLSX file containing all employee records using the XLSX_Exporter.
11. THE Employees_Page SHALL provide an "Import CSV" file input that uses the CSV_Parser to parse an uploaded CSV file, validates each row against the employee Zod schema, and calls the POST `/api/employees` endpoint for each valid row, then displays a Toast reporting the count of successful imports and the count of validation failures.
12. WHEN the CSV_Parser parses an employee CSV file and the XLSX_Exporter serializes employee records to XLSX, THE System SHALL preserve all field values without data loss or type coercion errors (round-trip integrity).
13. WHEN the User clicks an employee row's name, THE System SHALL navigate to the `/employees/:id` profile page.
14. IF the employees API fetch fails, THE System SHALL display an ErrorState component with a retry action button.

---

### Requirement 6: Employee Profile Page

**User Story:** As a User, I want to view a detailed profile page for any employee so that I can see their employment details, attendance history, leave history, and payslips in one place.

#### Acceptance Criteria

1. THE Employee_Profile_Page SHALL display a profile header card containing the employee's avatar, name, status badge, designation, department, email, phone, joining date, and annual salary.
2. THE Employee_Profile_Page SHALL render four tabs: Personal Details, Attendance History, Leave History, and Payslips, each showing the count of records in the tab label.
3. WHEN the Personal Details tab is active, THE System SHALL display employment details (ID, designation, department, joining date, status) and a salary breakdown (monthly base, allowances, deductions, net monthly credit).
4. WHEN the Attendance History tab is active, THE System SHALL display a table of all attendance records for the employee with date, check-in time, check-out time, logged hours, and status badge columns.
5. WHEN the Leave History tab is active, THE System SHALL display a table of all leave requests for the employee with type, duration, reason, and status badge columns.
6. WHEN the Payslips tab is active, THE System SHALL display a table of all payroll records for the employee with month, gross salary, net salary, status badge, paid date, and a "View Payslip" action button.
7. WHEN the User clicks "View Payslip", THE System SHALL open a Modal displaying a formatted payslip with company header, employee details, earnings breakdown, deductions breakdown, and net salary total.
8. THE Employee_Profile_Page SHALL display a back navigation button that returns the User to the `/employees` listing page.
9. IF the employee record is not found, THE System SHALL display an ErrorState component with a "Employee record not found" message and a link back to the employees listing page.

---

### Requirement 7: Attendance Management

**User Story:** As a User, I want to track attendance records so that I can monitor check-in/check-out times, view statistics, and manage my own punch events.

#### Acceptance Criteria

1. THE Attendance_Page SHALL display five stat cards showing: overall attendance rate percentage, total present days, total late arrivals, total approved leave days, and total absences.
2. THE Attendance_Page SHALL display a quick punch widget that reflects the authenticated User's current punch status for today and provides a check-in or check-out button accordingly.
3. WHEN the User submits a punch action from the Attendance_Page widget, THE System SHALL call the POST `/api/attendance/punch` endpoint with the employee ID, today's date, current time, and action (IN or OUT), invalidate the attendance and stats query caches, and display a Toast notification confirming the action.
4. IF the User attempts to punch in when already punched in for today, THE System SHALL display an error Toast with the server's error message without making a duplicate API call.
5. IF the User attempts to punch out when not yet punched in for today, THE System SHALL display an error Toast with the server's error message without making a duplicate API call.
6. WHEN the authenticated User has role ADMIN, HR_MANAGER, or TEAM_LEAD, THE Attendance_Page SHALL display a date filter input and an employee name search input, and render a table of all attendance records for the selected date filtered by the search query.
7. WHEN the authenticated User has role EMPLOYEE, THE Attendance_Page SHALL display only that User's personal attendance history in a table with date, check-in time, check-out time, logged hours, and status badge columns.
8. THE Attendance_Page SHALL provide a "Download CSV" button that exports the currently visible attendance records as a CSV file using the CSV_Parser.
9. THE Attendance_Page attendance table SHALL display status badges using the Badge component with variant `success` for PRESENT, `warning` for LATE, `info` for LEAVE, and `danger` for ABSENT.

---

### Requirement 8: Leave Management

**User Story:** As a User, I want to apply for leave and track my leave balance, and as a manager I want to approve or reject pending leave requests.

#### Acceptance Criteria

1. THE Leaves_Page SHALL display three leave balance cards showing the remaining days for SICK, CASUAL, and ANNUAL leave types for the authenticated User, fetched from the `/api/leaves/balances/:employeeId` endpoint.
2. THE Leaves_Page SHALL display an "Apply for Leave" button that opens a Modal containing a form with leave type select, start date input, end date input, and reason textarea fields.
3. WHEN the User submits a valid leave application, THE System SHALL call the POST `/api/leaves` endpoint, close the Modal, invalidate the leaves and leave balance query caches, and display a success Toast.
4. IF the leave application is rejected by the server due to insufficient balance, THE System SHALL display an error Toast containing the server's error message.
5. THE Leaves_Page SHALL display the authenticated User's personal leave history in a table with leave type, start date, end date, reason, and status badge columns.
6. WHEN the authenticated User has role ADMIN, HR_MANAGER, or TEAM_LEAD, THE Leaves_Page SHALL display a second tab labeled "Approvals Queue" showing the count of pending requests, containing a table of all PENDING leave requests with employee name, type, duration, reason, and approve/reject action buttons.
7. WHEN the User clicks the approve button on a pending leave request, THE System SHALL call the PATCH `/api/leaves/:id` endpoint with status `APPROVED`, invalidate the leaves and leave balance query caches, and display a success Toast.
8. WHEN the User clicks the reject button on a pending leave request, THE System SHALL open a Modal prompting for a rejection reason text input, and WHEN the User confirms, THE System SHALL call the PATCH `/api/leaves/:id` endpoint with status `REJECTED` and the rejection reason, then display a success Toast.
9. THE Leaves_Page status badges SHALL use variant `success` for APPROVED, `danger` for REJECTED, and `warning` for PENDING.

---

### Requirement 9: Payroll Management

**User Story:** As an ADMIN or HR_MANAGER, I want to manage payroll records and process salary disbursements, and as an EMPLOYEE I want to view my personal payslips.

#### Acceptance Criteria

1. WHEN the authenticated User has role ADMIN or HR_MANAGER, THE Payroll_Page SHALL display four KPI_Cards showing: total monthly spend, average net salary, total deductions, and active employee cycle count for the selected month.
2. WHEN the authenticated User has role ADMIN or HR_MANAGER, THE Payroll_Page SHALL render a bar chart showing the monthly net salary spend trend for the last 6 months using data from the `/api/payroll/stats` endpoint.
3. WHEN the authenticated User has role ADMIN or HR_MANAGER, THE Payroll_Page SHALL provide month and department filter controls that update the payroll records table query parameters.
4. THE Payroll_Page SHALL display a table of payroll records with columns for employee name and department (ADMIN/HR_MANAGER view), month period, base salary, allowances, deductions, net pay, status badge, and action buttons.
5. WHEN the authenticated User has role ADMIN or HR_MANAGER and a payroll record has status other than PAID, THE System SHALL display a "Pay" action button for that record.
6. WHEN the User clicks the "Pay" button for a payroll record, THE System SHALL call the PATCH `/api/payroll/:id` endpoint with status `PAID`, invalidate the payroll and payroll stats query caches, and display a success Toast.
7. WHEN the authenticated User has role ADMIN or HR_MANAGER and there are unpaid records for the selected month, THE Payroll_Page SHALL display a "Process N Pending Salaries" button that bulk-pays all unpaid records for that month by calling the PATCH `/api/payroll/:id` endpoint for each unpaid record.
8. WHEN the authenticated User has role ADMIN or HR_MANAGER and there are unpaid records for the selected month, THE Payroll_Page SHALL display an amber warning alert indicating the count of outstanding payment cycles.
9. THE Payroll_Page SHALL provide an "Export sheet" button that generates and downloads a CSV file of the currently displayed payroll records using the CSV_Parser.
10. WHEN the User clicks the "Payslip" button for any record, THE System SHALL open a Modal displaying a formatted payslip with company header, employee details, earnings breakdown, deductions breakdown, net salary total, and payment status.
11. WHEN the authenticated User has role EMPLOYEE or TEAM_LEAD, THE Payroll_Page SHALL display only that User's personal payroll records and three personal KPI_Cards showing YTD net earnings, average net monthly pay, and last salary payout date.

---

### Requirement 10: Department Management

**User Story:** As an ADMIN or HR_MANAGER, I want to manage organizational departments so that I can track headcount, budgets, and assign department managers.

#### Acceptance Criteria

1. THE Departments_Page SHALL display all departments as a grid of cards, each showing the department name, division ID, employee count badge, description, annual budget, and assigned manager name (or an "Unassigned" warning badge when no manager is set).
2. WHEN the authenticated User has role ADMIN or HR_MANAGER, THE Departments_Page SHALL display a "Create Department" button that opens a Modal containing a form with department name (required), annual budget, and description fields.
3. WHEN the User submits a valid create-department form, THE System SHALL call the POST `/api/departments` endpoint, close the Modal, invalidate the departments query cache, and display a success Toast.
4. WHEN the authenticated User has role ADMIN or HR_MANAGER, each department card SHALL display a "Configure Division" button that opens a Modal pre-populated with the department's current budget, description, and manager.
5. WHEN the User submits the configure-department form, THE System SHALL call the PUT `/api/departments/:id` endpoint with the updated budget, description, manager ID, and manager name, close the Modal, invalidate the departments and employees query caches, and display a success Toast.
6. THE configure-department Modal manager dropdown SHALL list all active employees fetched from the employees API, with an "Unassigned / Vacant" option as the first entry.
7. IF the departments API fetch fails, THE System SHALL display an ErrorState component with a retry action button.

---

### Requirement 11: Document Management

**User Story:** As a User, I want to manage organizational documents so that I can upload, categorize, search, preview, and delete files in a secure document locker.

#### Acceptance Criteria

1. THE Documents_Page SHALL display a category sidebar with filter options: All, Policy, Contract, ID_Proof, and Payroll, and a search input that filters documents by name, category, or associated employee name.
2. THE Documents_Page SHALL display filtered documents as a grid of file cards, each showing the file type icon, document name, category badge, file size, associated employee name (when applicable), upload date, a preview button, and a delete button visible only to ADMIN and HR_MANAGER roles.
3. WHEN the authenticated User has role EMPLOYEE, THE Documents_Page SHALL display only documents with category POLICY or documents associated with that User's employee ID.
4. WHEN the authenticated User has role ADMIN or HR_MANAGER, THE Documents_Page SHALL display an "Upload Document" button that opens a Modal containing a form with file name, format type select, secure category select, simulated file size input, and an optional associated employee dropdown.
5. WHEN the User submits a valid upload form, THE System SHALL call the POST `/api/documents/upload` endpoint, close the Modal, invalidate the documents query cache, and display a success Toast.
6. WHEN the User clicks the preview button on a document card, THE System SHALL open a Modal displaying a simulated document preview appropriate to the file type: a text content preview for PDF, an outline view for DOCX, a table grid for XLSX, and an image card mock for image types.
7. WHEN the User clicks the delete button on a document card and confirms the action in a confirmation Modal, THE System SHALL call the DELETE `/api/documents/:id` endpoint, invalidate the documents query cache, and display a success Toast.
8. IF the documents API fetch fails, THE System SHALL display an ErrorState component with a retry action button.

---

### Requirement 12: Notification System

**User Story:** As a User, I want to receive and manage system notifications so that I am informed of leave approvals, payroll updates, attendance alerts, and announcements.

#### Acceptance Criteria

1. THE MainLayout header notification bell SHALL display an animated pulse indicator when there are unread notifications.
2. WHEN the User clicks the notification bell, THE System SHALL display a dropdown panel listing all notifications with title, message, timestamp, and a visual distinction between read (normal background) and unread (highlighted background) notifications.
3. WHEN the User clicks an unread notification in the dropdown, THE System SHALL call the PATCH `/api/notifications/:id/read` endpoint, invalidate the notifications query cache, and update the notification's visual state to read.
4. THE System SHALL poll the `/api/notifications` endpoint every 15 seconds to simulate real-time notification delivery.
5. THE notification dropdown SHALL display an unread count badge when there are unread notifications.
6. WHEN the System performs an action that generates a server-side notification (punch-in, leave application, leave approval, leave rejection, or payroll disbursement), THE System SHALL invalidate the notifications query cache to reflect the new notification.

---

### Requirement 13: System Settings

**User Story:** As a User, I want to configure my profile, notification preferences, and system appearance so that the application matches my personal and organizational needs.

#### Acceptance Criteria

1. THE Settings_Page SHALL render three tabs: Personal Profile, Preferences, and System Console.
2. WHEN the Personal Profile tab is active, THE System SHALL display a form pre-populated with the User's name, email, phone, avatar URL, role (read-only), department (read-only), and designation (read-only).
3. WHEN the User submits a valid profile update form, THE System SHALL call the PUT `/api/employees/:id` endpoint, update the Redux auth slice with the new name, email, and avatar values, invalidate the employees query cache, and display a success Toast.
4. WHEN the Preferences tab is active, THE System SHALL display toggle checkboxes for email system alerts, weekly performance summaries, SMS punch reminders, and compact table layout, with values loaded from and persisted to localStorage under key `hrms_user_preferences`.
5. WHEN the User saves preferences, THE System SHALL write the preference object to localStorage under key `hrms_user_preferences` and display a success Toast.
6. WHEN the System Console tab is active, THE System SHALL display a danger zone section containing a "Reset & Re-Seed Local Database" button and a mock credentials reference guide.
7. WHEN the User confirms the database reset action, THE System SHALL call the `resetDB` function from the mock database module, then reload the page to restore the original seeded dataset.
8. THE Settings_Page sidebar SHALL display a theme selection panel with Light Mode and Dark Mode buttons that toggle the application theme via the Redux UI slice.

---

### Requirement 14: UI Component System

**User Story:** As a developer, I want a consistent set of reusable UI components so that all pages share a unified visual language and interaction pattern.

#### Acceptance Criteria

1. THE Button component SHALL support variants: `primary`, `secondary`, `outline`, `danger`, and `ghost`, sizes: `sm`, `md`, and `lg`, and props: `isLoading` (shows spinner and disables the button), `leftIcon`, `rightIcon`, and all standard HTML button attributes.
2. THE Input component SHALL support a `label` prop rendered as an uppercase tracking-wide label, an `error` prop that applies red border styling and displays the error message below the input, and a `helperText` prop for supplementary guidance.
3. THE Select component SHALL support a `label` prop, an `options` array of `{ value, label }` objects, a `placeholder` option, and an `error` prop with the same styling behavior as the Input component.
4. THE Badge component SHALL support variants: `success` (emerald), `warning` (amber), `danger` (rose), `info` (violet), and `neutral` (slate), and render as a small pill-shaped inline element.
5. THE Modal component SHALL trap body scroll when open, close on Escape key press, close when the backdrop is clicked, support sizes `sm`, `md`, `lg`, and `xl`, and render via a React portal to `document.body`.
6. THE Drawer component SHALL slide in from the right side of the viewport, trap body scroll when open, close on Escape key press, close when the backdrop is clicked, and render via a React portal to `document.body`.
7. THE Loader component SHALL display a centered spinning icon with an optional message, and support a `fullPage` prop that renders it as a fixed full-screen overlay.
8. THE EmptyState component SHALL display a centered icon, title, description, and an optional action button.
9. THE ErrorState component SHALL display a centered error icon, title, message, and an optional retry button.
10. THE DashboardCard component SHALL display a title, value, optional icon in a colored badge, and an optional trend indicator with directional arrow and percentage.
11. THE ToastContainer component SHALL render Toast messages in the bottom-right corner, auto-dismiss each Toast after 5 seconds (or a custom duration), and support types: `success`, `error`, `warning`, and `info` with distinct color schemes and icons.

---

### Requirement 15: Performance and Code Quality

**User Story:** As a developer, I want the application to follow modern frontend engineering practices so that it is maintainable, performant, and production-ready.

#### Acceptance Criteria

1. THE System SHALL implement route-based code splitting using React.lazy and Suspense for all page components to reduce the initial bundle size.
2. THE System SHALL use `useMemo` to memoize expensive derived data computations (filtered lists, chart data transformations, column definitions) in components that re-render frequently.
3. THE System SHALL use `useCallback` to memoize event handler functions passed as props to child components in components that re-render frequently.
4. THE System SHALL implement debounced search inputs with a minimum 300ms delay before triggering API query parameter updates to reduce unnecessary API calls.
5. THE React_Query client SHALL be configured with `refetchOnWindowFocus: false`, `retry: 1`, and a default `staleTime` of 5 minutes to minimize redundant network requests.
6. THE System SHALL use `React.memo` on pure presentational components (KPI_Cards, table row cells, chart wrappers) that receive stable props to prevent unnecessary re-renders.
7. THE System SHALL define all TypeScript interfaces and types in `src/types/index.ts` and import them using `import type` syntax where the `verbatimModuleSyntax` TypeScript compiler option is enabled.
8. THE System SHALL not introduce any new third-party dependencies beyond those already listed in `package.json`.

---

### Requirement 16: Testing

**User Story:** As a developer, I want automated tests for critical UI components and user flows so that regressions are caught before deployment.

#### Acceptance Criteria

1. THE System SHALL include Vitest and React Testing Library test suites configured via `vite.config.ts` with jsdom as the test environment.
2. THE Button component test suite SHALL verify that the button renders with the correct text, applies the correct variant class, shows a loading spinner when `isLoading` is true, and is disabled when `disabled` is true.
3. THE Badge component test suite SHALL verify that the badge renders with the correct text and applies the correct variant color class for each of the five variants.
4. THE Login_Page test suite SHALL verify that the form renders email and password inputs, displays a validation error when an invalid email is submitted, and calls the login mutation when valid credentials are submitted.
5. THE Employees_Page test suite SHALL verify that the employee table renders with the correct column headers, displays a Loader while data is fetching, and renders employee rows when data is loaded.
6. THE Auth_Guard test suite SHALL verify that unauthenticated users are redirected to `/login` and authenticated users are rendered the protected children component.
7. WHEN a form component using React Hook Form and Zod is submitted with all required fields empty, THE System SHALL display a validation error message for each required field.
