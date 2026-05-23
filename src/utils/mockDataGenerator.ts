import type { Employee, Department, PayrollRecord, LeaveRequest, AttendanceRecord } from '../types';
import { DEPARTMENTS, DESIGNATIONS } from './constants';
import { faker } from '@faker-js/faker';

// Generate mock users
export const generateMockUsers = (count: number = 50) => {
  const users: Employee[] = [];

  for (let i = 0; i < count; i++) {
    users.push({
      id: `EMP${String(i + 1).padStart(4, '0')}`,
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      phone: faker.phone.number({ style: 'national' }),
      department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
      designation: DESIGNATIONS[Math.floor(Math.random() * DESIGNATIONS.length)],
      salary: faker.number.int({ min: 300000, max: 1500000 }),
      joiningDate: faker.date.past({ years: 10 }).toISOString().split('T')[0],
      status: Math.random() > 0.1 ? 'ACTIVE' : 'INACTIVE',
      attendancePercentage: faker.number.int({ min: 70, max: 100 }),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
    });
  }

  return users;
};

// Generate mock departments
export const generateMockDepartments = (employees: Employee[]): Department[] => {
  const departments: Record<string, Department> = {};

  DEPARTMENTS.forEach((dept, index) => {
    const deptEmployees = employees.filter((e) => e.department === dept);
    departments[dept] = {
      id: `DEPT${String(index + 1).padStart(3, '0')}`,
      name: dept,
      managerId: deptEmployees[0]?.id || null,
      managerName: deptEmployees[0]?.name || null,
      employeeCount: deptEmployees.length,
      budget: Math.round(faker.number.int({ min: 10, max: 100 }) * 100000),
      description: faker.lorem.sentence(),
    };
  });

  return Object.values(departments);
};

// Generate attendance records
export const generateAttendanceRecords = (employees: Employee[]): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();

  employees.forEach((emp) => {
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const statuses: Array<'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'> = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      let checkIn: string | null = null;
      let checkOut: string | null = null;
      let totalHours = 0;

      if (status === 'PRESENT' || status === 'LATE') {
        const hour = status === 'LATE' ? faker.number.int({ min: 9, max: 11 }) : faker.number.int({ min: 8, max: 9 });
        checkIn = `${String(hour).padStart(2, '0')}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, '0')}`;
        checkOut = `${String(faker.number.int({ min: 17, max: 18 })).padStart(2, '0')}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, '0')}`;
        totalHours = 8;
      }

      records.push({
        id: `ATT${dateStr}${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.name,
        date: dateStr,
        checkIn,
        checkOut,
        status,
        totalHours,
      });
    }
  });

  return records;
};

// Generate leave requests
export const generateLeaveRequests = (employees: Employee[]): LeaveRequest[] => {
  const leaveTypes: Array<'SICK' | 'CASUAL' | 'ANNUAL'> = ['SICK', 'CASUAL', 'ANNUAL'];
  const leaveStatuses: Array<'PENDING' | 'APPROVED' | 'REJECTED'> = ['PENDING', 'APPROVED', 'REJECTED'];
  const requests: LeaveRequest[] = [];

  employees.forEach((emp, index) => {
    for (let i = 0; i < 5; i++) {
      const startDate = faker.date.future();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + faker.number.int({ min: 1, max: 5 }));

      requests.push({
        id: `LEAVE${String(index).padStart(4, '0')}${String(i).padStart(3, '0')}`,
        employeeId: emp.id,
        employeeName: emp.name,
        type: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: leaveStatuses[Math.floor(Math.random() * leaveStatuses.length)],
        reason: faker.lorem.sentence(),
        rejectionReason: Math.random() > 0.8 ? faker.lorem.sentence() : undefined,
        createdAt: faker.date.past().toISOString(),
      });
    }
  });

  return requests;
};

// Generate payroll records
export const generatePayrollRecords = (employees: Employee[]): PayrollRecord[] => {
  const payrollStatuses: Array<'PAID' | 'PROCESSING' | 'PENDING'> = ['PAID', 'PROCESSING', 'PENDING'];
  const records: PayrollRecord[] = [];

  employees.forEach((emp, index) => {
    for (let i = 0; i < 12; i++) {
      const baseSalary = emp.salary;
      const allowances = Math.floor(baseSalary * 0.3);
      const deductions = Math.floor(baseSalary * 0.15);
      const netSalary = baseSalary + allowances - deductions;

      records.push({
        id: `PAYROLL${String(index).padStart(4, '0')}${String(i).padStart(2, '0')}`,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        month: new Date(new Date().setMonth(new Date().getMonth() - i)).toISOString().substring(0, 7),
        baseSalary,
        allowances,
        deductions,
        netSalary,
        status: payrollStatuses[Math.floor(Math.random() * payrollStatuses.length)],
        paidDate: Math.random() > 0.2 ? new Date().toISOString() : null,
      });
    }
  });

  return records;
};

// Utility to parse and generate date ranges
export const getDateRange = (days: number) => {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - days);
  return { start: start.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
};

// Filter employees
export const filterEmployees = (employees: Employee[], filters: { department?: string; status?: string; search?: string }) => {
  return employees.filter((emp) => {
    if (filters.department && emp.department !== filters.department) return false;
    if (filters.status && emp.status !== filters.status) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        emp.name.toLowerCase().includes(search) ||
        emp.email.toLowerCase().includes(search) ||
        emp.id.toLowerCase().includes(search)
      );
    }
    return true;
  });
};

// Calculate attendance stats
export const calculateAttendanceStats = (records: AttendanceRecord[]) => {
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter((r) => r.date === today);

  return {
    presentCount: todayRecords.filter((r) => r.status === 'PRESENT').length,
    absentCount: todayRecords.filter((r) => r.status === 'ABSENT').length,
    lateCount: todayRecords.filter((r) => r.status === 'LATE').length,
    leaveCount: todayRecords.filter((r) => r.status === 'LEAVE').length,
  };
};
