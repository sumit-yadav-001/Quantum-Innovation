import { faker } from '@faker-js/faker';
import type { 
  Employee, 
  AttendanceRecord, 
  LeaveRequest, 
  LeaveBalance, 
  PayrollRecord, 
  Department, 
  DocumentRecord, 
  SystemNotification,
  UserRole,
  LeaveType,
  LeaveStatus
} from '../types';

const DB_KEY = 'hrms_mock_db';

interface DBState {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  leaveBalances: LeaveBalance[];
  payroll: PayrollRecord[];
  departments: Department[];
  documents: DocumentRecord[];
  notifications: SystemNotification[];
}

// Fixed login users details
export const FIXED_USERS = [
  {
    id: 'emp-admin',
    name: 'Admin User',
    email: 'admin@hrms.com',
    role: 'ADMIN' as UserRole,
    department: 'Executive',
    designation: 'CEO',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'emp-hr',
    name: 'Sarah Jenkins',
    email: 'hr@hrms.com',
    role: 'HR_MANAGER' as UserRole,
    department: 'Human Resources',
    designation: 'HR Director',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'emp-lead',
    name: 'David Chen',
    email: 'lead@hrms.com',
    role: 'TEAM_LEAD' as UserRole,
    department: 'Engineering',
    designation: 'Lead Engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'emp-emp',
    name: 'Alex River',
    email: 'employee@hrms.com',
    role: 'EMPLOYEE' as UserRole,
    department: 'Engineering',
    designation: 'Software Engineer',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'
  }
];

// Helper to seed data
function seed(): DBState {
  faker.seed(123); // Make seeds reproducible
  
  // 1. Departments
  const departments: Department[] = [
    { id: 'dept-exec', name: 'Executive', managerId: 'emp-admin', managerName: 'Admin User', employeeCount: 1, budget: 1500000, description: 'Executive leadership team' },
    { id: 'dept-hr', name: 'Human Resources', managerId: 'emp-hr', managerName: 'Sarah Jenkins', employeeCount: 4, budget: 500000, description: 'Talent acquisition, payroll processing, and employee relations' },
    { id: 'dept-eng', name: 'Engineering', managerId: 'emp-lead', managerName: 'David Chen', employeeCount: 12, budget: 3500000, description: 'Software design and systems development' },
    { id: 'dept-mkt', name: 'Marketing', managerId: null, managerName: null, employeeCount: 4, budget: 600000, description: 'Brand strategy, design, and outbound marketing' },
    { id: 'dept-fin', name: 'Finance', managerId: null, managerName: null, employeeCount: 3, budget: 800000, description: 'Corporate accounting, financial planning, and taxes' },
    { id: 'dept-sales', name: 'Sales', managerId: null, managerName: null, employeeCount: 5, budget: 750000, description: 'Client acquisition and corporate partnership management' },
  ];

  // 2. Employees (include fixed login users first)
  const employees: Employee[] = [
    {
      id: 'emp-admin',
      name: 'Admin User',
      email: 'admin@hrms.com',
      phone: '+1 (555) 019-9000',
      department: 'Executive',
      designation: 'CEO',
      salary: 180000,
      joiningDate: '2020-01-15',
      status: 'ACTIVE',
      attendancePercentage: 99,
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200'
    },
    {
      id: 'emp-hr',
      name: 'Sarah Jenkins',
      email: 'hr@hrms.com',
      phone: '+1 (555) 019-9001',
      department: 'Human Resources',
      designation: 'HR Director',
      salary: 110000,
      joiningDate: '2021-03-10',
      status: 'ACTIVE',
      attendancePercentage: 96,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
    },
    {
      id: 'emp-lead',
      name: 'David Chen',
      email: 'lead@hrms.com',
      phone: '+1 (555) 019-9002',
      department: 'Engineering',
      designation: 'Lead Engineer',
      salary: 140000,
      joiningDate: '2021-06-01',
      status: 'ACTIVE',
      attendancePercentage: 95,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
    },
    {
      id: 'emp-emp',
      name: 'Alex River',
      email: 'employee@hrms.com',
      phone: '+1 (555) 019-9003',
      department: 'Engineering',
      designation: 'Software Engineer',
      salary: 95000,
      joiningDate: '2023-02-15',
      status: 'ACTIVE',
      attendancePercentage: 94,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'
    }
  ];

  const deptNames = ['Engineering', 'Marketing', 'Finance', 'Sales', 'Human Resources'];
  const designations: Record<string, string[]> = {
    'Engineering': ['Senior Developer', 'Frontend Developer', 'Backend Developer', 'QA Engineer', 'DevOps Specialist'],
    'Marketing': ['Content Creator', 'SEO Specialist', 'Growth Marketer', 'Marketing Coordinator'],
    'Finance': ['Financial Analyst', 'Senior Accountant', 'Junior Accountant'],
    'Sales': ['Account Executive', 'Business Development Manager', 'Sales Specialist'],
    'Human Resources': ['HR Generalist', 'Recruiter', 'Compensation Analyst']
  };

  const images = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=200'
  ];

  // Generate 22 more employees to total 26
  for (let i = 0; i < 22; i++) {
    const dept = faker.helpers.arrayElement(deptNames);
    const desg = faker.helpers.arrayElement(designations[dept]);
    const name = faker.person.fullName();
    const email = faker.internet.email({ firstName: name.split(' ')[0], lastName: name.split(' ')[1] }).toLowerCase();
    
    employees.push({
      id: `emp-${i + 1}`,
      name,
      email,
      phone: faker.phone.number({ style: 'national' }),
      department: dept,
      designation: desg,
      salary: faker.number.int({ min: 50000, max: 130000 }),
      joiningDate: faker.date.between({ from: '2021-01-01', to: '2025-12-31' }).toISOString().split('T')[0],
      status: faker.helpers.arrayElement(['ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE']) as 'ACTIVE' | 'INACTIVE',
      attendancePercentage: faker.number.int({ min: 85, max: 100 }),
      avatar: images[i % images.length]
    });
  }

  // Update employee counts in departments
  departments.forEach(dept => {
    dept.employeeCount = employees.filter(e => e.department === dept.name).length;
  });

  // 3. Leave Balances for all employees
  const leaveBalances: LeaveBalance[] = employees.map(emp => ({
    employeeId: emp.id,
    sick: faker.number.int({ min: 3, max: 10 }),
    casual: faker.number.int({ min: 5, max: 12 }),
    annual: faker.number.int({ min: 10, max: 20 })
  }));

  // 4. Leave Requests
  const leaves: LeaveRequest[] = [];
  const leaveTypes: LeaveType[] = ['SICK', 'CASUAL', 'ANNUAL'];
  const leaveStatuses: LeaveStatus[] = ['APPROVED', 'REJECTED', 'PENDING'];

  // Add some specific leave requests
  employees.slice(1, 10).forEach((emp, index) => {
    const status = leaveStatuses[index % 3];
    const startDate = `2026-05-${10 + index}`;
    const endDate = `2026-05-${12 + index}`;
    leaves.push({
      id: `leave-${index + 1}`,
      employeeId: emp.id,
      employeeName: emp.name,
      type: leaveTypes[index % 3],
      startDate,
      endDate,
      status,
      reason: faker.lorem.sentence(),
      rejectionReason: status === 'REJECTED' ? 'High project delivery workload during this week.' : undefined,
      createdAt: `2026-05-01T09:15:00Z`
    });
  });

  // 5. Attendance (3 months: March, April, May 2026)
  const attendance: AttendanceRecord[] = [];
  const workDays = [1, 2, 3, 4, 5]; // Mon - Fri
  const dates: string[] = [];
  
  // Build workdates
  let currentDate = new Date('2026-03-01');
  const endDate = new Date('2026-05-22'); // Current local time is May 22, 2026
  
  while (currentDate <= endDate) {
    if (workDays.includes(currentDate.getDay())) {
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Generate attendance logs for active employees
  const activeEmployees = employees.filter(e => e.status === 'ACTIVE');
  
  dates.forEach(date => {
    activeEmployees.forEach(emp => {
      // 95% attendance probability
      const isPresent = faker.number.float({ min: 0, max: 1 }) < 0.95;
      const isLeave = !isPresent && faker.number.float({ min: 0, max: 1 }) < 0.6; // some are leaves, others absent
      
      let status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' = 'ABSENT';
      let checkIn: string | null = null;
      let checkOut: string | null = null;
      let totalHours = 0;

      if (isLeave) {
        status = 'LEAVE';
      } else if (isPresent) {
        // Late probability (10%)
        const isLate = faker.number.float({ min: 0, max: 1 }) < 0.10;
        status = isLate ? 'LATE' : 'PRESENT';
        
        const inHour = isLate ? 9 : 8;
        const inMin = isLate ? faker.number.int({ min: 31, max: 59 }) : faker.number.int({ min: 15, max: 59 });
        checkIn = `${String(inHour).padStart(2, '0')}:${String(inMin).padStart(2, '0')}:00`;
        
        const outHour = faker.number.int({ min: 17, max: 19 });
        const outMin = faker.number.int({ min: 0, max: 59 });
        checkOut = `${String(outHour).padStart(2, '0')}:${String(outMin).padStart(2, '0')}:00`;
        
        const checkInDec = inHour + inMin / 60;
        const checkOutDec = outHour + outMin / 60;
        totalHours = parseFloat((checkOutDec - checkInDec).toFixed(1));
      }

      // Special check: do not punch out if the date is today (May 22, 2026) and check-in occurred
      if (date === '2026-05-22' && status !== 'ABSENT' && status !== 'LEAVE') {
        // Assume check-in happened in morning, but user hasn't checked out yet if they are checking out now.
        // For general employees, we simulate that they have checked in at 8:45 AM, checkOut remains null.
        checkOut = null;
        totalHours = 0;
      }

      attendance.push({
        id: `att-${emp.id}-${date}`,
        employeeId: emp.id,
        employeeName: emp.name,
        date,
        checkIn,
        checkOut,
        status,
        totalHours
      });
    });
  });

  // Calculate actual attendance percentages based on seeded records
  employees.forEach(emp => {
    if (emp.status === 'ACTIVE') {
      const records = attendance.filter(a => a.employeeId === emp.id);
      const attended = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
      emp.attendancePercentage = records.length > 0 ? Math.round((attended / records.length) * 100) : 100;
    } else {
      emp.attendancePercentage = 0;
    }
  });

  // 6. Payroll History (6 months: Nov 2025 to Apr 2026)
  const payroll: PayrollRecord[] = [];
  const payrollMonths = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04'];
  
  payrollMonths.forEach(month => {
    employees.forEach(emp => {
      const baseSalary = Math.round(emp.salary / 12);
      const allowances = Math.round(baseSalary * 0.12);
      const deductions = Math.round(baseSalary * 0.08);
      const netSalary = baseSalary + allowances - deductions;

      payroll.push({
        id: `pay-${emp.id}-${month}`,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        month,
        baseSalary,
        allowances,
        deductions,
        netSalary,
        status: 'PAID',
        paidDate: `${month}-28`
      });
    });
  });

  // Add the current month's processing payroll (May 2026)
  employees.forEach(emp => {
    const baseSalary = Math.round(emp.salary / 12);
    const allowances = Math.round(baseSalary * 0.12);
    const deductions = Math.round(baseSalary * 0.08);
    const netSalary = baseSalary + allowances - deductions;

    payroll.push({
      id: `pay-${emp.id}-2026-05`,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      month: '2026-05',
      baseSalary,
      allowances,
      deductions,
      netSalary,
      status: 'PROCESSING',
      paidDate: null
    });
  });

  // 7. Documents
  const documents: DocumentRecord[] = [
    {
      id: 'doc-1',
      name: 'Corporate Policy Handbook 2026.pdf',
      category: 'POLICY',
      uploadDate: '2026-01-01',
      size: '2.4 MB',
      fileType: 'pdf',
      url: '/mock-files/policy-handbook-2026.pdf'
    },
    {
      id: 'doc-2',
      name: 'Information Security Guidelines.docx',
      category: 'POLICY',
      uploadDate: '2026-01-10',
      size: '1.1 MB',
      fileType: 'docx',
      url: '/mock-files/info-sec-guidelines.docx'
    },
    {
      id: 'doc-3',
      name: 'Employment Contract - David Chen.pdf',
      category: 'CONTRACT',
      uploadDate: '2021-06-01',
      size: '1.8 MB',
      fileType: 'pdf',
      employeeId: 'emp-lead',
      employeeName: 'David Chen',
      url: '/mock-files/contract-david-chen.pdf'
    },
    {
      id: 'doc-4',
      name: 'ID Card Scan - Alex River.png',
      category: 'ID_PROOF',
      uploadDate: '2023-02-15',
      size: '850 KB',
      fileType: 'png',
      employeeId: 'emp-emp',
      employeeName: 'Alex River',
      url: '/mock-files/id-alex-river.png'
    },
    {
      id: 'doc-5',
      name: 'Q1 Payroll Summary Spreadsheet.xlsx',
      category: 'PAYROLL',
      uploadDate: '2026-04-05',
      size: '3.6 MB',
      fileType: 'xlsx',
      url: '/mock-files/q1-payroll-2026.xlsx'
    }
  ];

  // 8. System Notifications
  const notifications: SystemNotification[] = [
    {
      id: 'notif-1',
      title: 'Leave Request Submitted',
      message: 'Alex River has requested Casual Leave from May 25 to May 27, 2026.',
      type: 'LEAVE',
      read: false,
      date: '2026-05-22T10:30:00Z',
      senderName: 'Alex River'
    },
    {
      id: 'notif-2',
      title: 'Payroll Processing Started',
      message: 'Salary disbursements for May 2026 have entered the processing phase.',
      type: 'PAYROLL',
      read: false,
      date: '2026-05-22T08:00:00Z',
      senderName: 'System Auditor'
    },
    {
      id: 'notif-3',
      title: 'Late Clock-in Registered',
      message: 'Marcus Cole clocked in late today at 09:48 AM.',
      type: 'ATTENDANCE',
      read: true,
      date: '2026-05-22T09:50:00Z',
      senderName: 'Marcus Cole'
    },
    {
      id: 'notif-4',
      title: 'Company Townhall Announcement',
      message: 'All employees are invited to the Q2 Townhall on June 1 at 3:00 PM via Zoom.',
      type: 'ANNOUNCEMENT',
      read: false,
      date: '2026-05-20T14:00:00Z',
      senderName: 'Sarah Jenkins'
    }
  ];

  return {
    employees,
    attendance,
    leaves,
    leaveBalances,
    payroll,
    departments,
    documents,
    notifications
  };
}

// Global functions to read/write state
export function getDB(): DBState {
  const data = localStorage.getItem(DB_KEY);
  if (!data) {
    const initialDB = seed();
    saveDB(initialDB);
    return initialDB;
  }
  return JSON.parse(data);
}

export function saveDB(db: DBState) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function resetDB() {
  const freshDB = seed();
  saveDB(freshDB);
  return freshDB;
}
