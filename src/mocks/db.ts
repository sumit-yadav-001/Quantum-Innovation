import { faker } from '@faker-js/faker'
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
  LeaveStatus,
} from '../types'

const DB_KEY = 'hrms_mock_db'

interface DBState {
  employees: Employee[]
  attendance: AttendanceRecord[]
  leaves: LeaveRequest[]
  leaveBalances: LeaveBalance[]
  payroll: PayrollRecord[]
  departments: Department[]
  documents: DocumentRecord[]
  notifications: SystemNotification[]
}

// The four demo login accounts — these always exist regardless of DB resets
export const FIXED_USERS = [
  {
    id: 'emp-admin',
    name: 'Admin User',
    email: 'admin@hrms.com',
    role: 'ADMIN' as UserRole,
    department: 'Executive',
    designation: 'CEO',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'emp-hr',
    name: 'Sarah Jenkins',
    email: 'hr@hrms.com',
    role: 'HR_MANAGER' as UserRole,
    department: 'Human Resources',
    designation: 'HR Director',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'emp-lead',
    name: 'David Chen',
    email: 'lead@hrms.com',
    role: 'TEAM_LEAD' as UserRole,
    department: 'Engineering',
    designation: 'Lead Engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'emp-emp',
    name: 'Alex River',
    email: 'employee@hrms.com',
    role: 'EMPLOYEE' as UserRole,
    department: 'Engineering',
    designation: 'Software Engineer',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
  },
]

function seed(): DBState {
  faker.seed(123) // fixed seed keeps data consistent across resets

  const departments: Department[] = [
    { id: 'dept-exec',  name: 'Executive',       managerId: 'emp-admin', managerName: 'Admin User',    employeeCount: 1,  budget: 1500000, description: 'Executive leadership team' },
    { id: 'dept-hr',    name: 'Human Resources', managerId: 'emp-hr',    managerName: 'Sarah Jenkins', employeeCount: 4,  budget: 500000,  description: 'Talent acquisition, payroll, and employee relations' },
    { id: 'dept-eng',   name: 'Engineering',     managerId: 'emp-lead',  managerName: 'David Chen',    employeeCount: 12, budget: 3500000, description: 'Software design and systems development' },
    { id: 'dept-mkt',   name: 'Marketing',       managerId: null,        managerName: null,            employeeCount: 4,  budget: 600000,  description: 'Brand strategy, design, and outbound marketing' },
    { id: 'dept-fin',   name: 'Finance',         managerId: null,        managerName: null,            employeeCount: 3,  budget: 800000,  description: 'Corporate accounting, financial planning, and taxes' },
    { id: 'dept-sales', name: 'Sales',           managerId: null,        managerName: null,            employeeCount: 5,  budget: 750000,  description: 'Client acquisition and partnership management' },
  ]

  // Start with the four fixed accounts so they always appear in the directory
  const employees: Employee[] = [
    { id: 'emp-admin', name: 'Admin User',    email: 'admin@hrms.com',    phone: '+1 (555) 019-9000', department: 'Executive',       designation: 'CEO',               salary: 180000, joiningDate: '2020-01-15', status: 'ACTIVE', attendancePercentage: 99, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200' },
    { id: 'emp-hr',    name: 'Sarah Jenkins', email: 'hr@hrms.com',       phone: '+1 (555) 019-9001', department: 'Human Resources', designation: 'HR Director',       salary: 110000, joiningDate: '2021-03-10', status: 'ACTIVE', attendancePercentage: 96, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
    { id: 'emp-lead',  name: 'David Chen',    email: 'lead@hrms.com',     phone: '+1 (555) 019-9002', department: 'Engineering',     designation: 'Lead Engineer',     salary: 140000, joiningDate: '2021-06-01', status: 'ACTIVE', attendancePercentage: 95, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
    { id: 'emp-emp',   name: 'Alex River',    email: 'employee@hrms.com', phone: '+1 (555) 019-9003', department: 'Engineering',     designation: 'Software Engineer', salary: 95000,  joiningDate: '2023-02-15', status: 'ACTIVE', attendancePercentage: 94, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200' },
  ]

  const deptNames = ['Engineering', 'Marketing', 'Finance', 'Sales', 'Human Resources']
  const rolesByDept: Record<string, string[]> = {
    Engineering:     ['Senior Developer', 'Frontend Developer', 'Backend Developer', 'QA Engineer', 'DevOps Specialist'],
    Marketing:       ['Content Creator', 'SEO Specialist', 'Growth Marketer', 'Marketing Coordinator'],
    Finance:         ['Financial Analyst', 'Senior Accountant', 'Junior Accountant'],
    Sales:           ['Account Executive', 'Business Development Manager', 'Sales Specialist'],
    'Human Resources': ['HR Generalist', 'Recruiter', 'Compensation Analyst'],
  }

  const avatarPool = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=200',
  ]

  // Generate 22 more employees to bring the total to 26
  for (let i = 0; i < 22; i++) {
    const dept = faker.helpers.arrayElement(deptNames)
    const title = faker.helpers.arrayElement(rolesByDept[dept])
    const fullName = faker.person.fullName()
    const [first, last] = fullName.split(' ')

    employees.push({
      id: `emp-${i + 1}`,
      name: fullName,
      email: faker.internet.email({ firstName: first, lastName: last }).toLowerCase(),
      phone: faker.phone.number({ style: 'national' }),
      department: dept,
      designation: title,
      salary: faker.number.int({ min: 50000, max: 130000 }),
      joiningDate: faker.date.between({ from: '2021-01-01', to: '2025-12-31' }).toISOString().split('T')[0],
      status: faker.helpers.arrayElement(['ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE']) as 'ACTIVE' | 'INACTIVE',
      attendancePercentage: faker.number.int({ min: 85, max: 100 }),
      avatar: avatarPool[i % avatarPool.length],
    })
  }

  // Sync department headcounts with the generated employee list
  departments.forEach((d) => {
    d.employeeCount = employees.filter((e) => e.department === d.name).length
  })

  const leaveBalances: LeaveBalance[] = employees.map((emp) => ({
    employeeId: emp.id,
    sick: faker.number.int({ min: 3, max: 10 }),
    casual: faker.number.int({ min: 5, max: 12 }),
    annual: faker.number.int({ min: 10, max: 20 }),
  }))

  // A handful of leave requests spread across statuses
  const leaveTypes: LeaveType[] = ['SICK', 'CASUAL', 'ANNUAL']
  const leaveStatuses: LeaveStatus[] = ['APPROVED', 'REJECTED', 'PENDING']
  const leaves: LeaveRequest[] = employees.slice(1, 10).map((emp, i) => {
    const status = leaveStatuses[i % 3]
    return {
      id: `leave-${i + 1}`,
      employeeId: emp.id,
      employeeName: emp.name,
      type: leaveTypes[i % 3],
      startDate: `2026-05-${10 + i}`,
      endDate: `2026-05-${12 + i}`,
      status,
      reason: faker.lorem.sentence(),
      rejectionReason: status === 'REJECTED' ? 'High workload during sprint delivery.' : undefined,
      createdAt: '2026-05-01T09:15:00Z',
    }
  })

  // Build working-day dates from March 1 to May 22, 2026
  const workdays: string[] = []
  const cursor = new Date('2026-03-01')
  const cutoff = new Date('2026-05-22')
  while (cursor <= cutoff) {
    if (cursor.getDay() >= 1 && cursor.getDay() <= 5) {
      workdays.push(cursor.toISOString().split('T')[0])
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  const activeStaff = employees.filter((e) => e.status === 'ACTIVE')
  const attendance: AttendanceRecord[] = []

  workdays.forEach((date) => {
    activeStaff.forEach((emp) => {
      const present = faker.number.float({ min: 0, max: 1 }) < 0.95
      const onLeave = !present && faker.number.float({ min: 0, max: 1 }) < 0.6

      let status: AttendanceRecord['status'] = 'ABSENT'
      let checkIn: string | null = null
      let checkOut: string | null = null
      let totalHours = 0

      if (onLeave) {
        status = 'LEAVE'
      } else if (present) {
        const late = faker.number.float({ min: 0, max: 1 }) < 0.1
        status = late ? 'LATE' : 'PRESENT'
        const inH = late ? 9 : 8
        const inM = late
          ? faker.number.int({ min: 31, max: 59 })
          : faker.number.int({ min: 15, max: 59 })
        checkIn = `${String(inH).padStart(2, '0')}:${String(inM).padStart(2, '0')}:00`

        // Today's records don't have a checkout yet
        if (date !== '2026-05-22') {
          const outH = faker.number.int({ min: 17, max: 19 })
          const outM = faker.number.int({ min: 0, max: 59 })
          checkOut = `${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}:00`
          totalHours = parseFloat(((outH + outM / 60) - (inH + inM / 60)).toFixed(1))
        }
      }

      attendance.push({
        id: `att-${emp.id}-${date}`,
        employeeId: emp.id,
        employeeName: emp.name,
        date,
        checkIn,
        checkOut,
        status,
        totalHours,
      })
    })
  })

  // Recalculate each employee's attendance percentage from the generated records
  employees.forEach((emp) => {
    if (emp.status !== 'ACTIVE') { emp.attendancePercentage = 0; return }
    const recs = attendance.filter((a) => a.employeeId === emp.id)
    const present = recs.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length
    emp.attendancePercentage = recs.length ? Math.round((present / recs.length) * 100) : 100
  })

  // Six months of paid history + current month still processing
  const paidMonths = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04']
  const payroll: PayrollRecord[] = []

  paidMonths.forEach((month) => {
    employees.forEach((emp) => {
      const base = Math.round(emp.salary / 12)
      const allowances = Math.round(base * 0.12)
      const deductions = Math.round(base * 0.08)
      payroll.push({
        id: `pay-${emp.id}-${month}`,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        month,
        baseSalary: base,
        allowances,
        deductions,
        netSalary: base + allowances - deductions,
        status: 'PAID',
        paidDate: `${month}-28`,
      })
    })
  })

  employees.forEach((emp) => {
    const base = Math.round(emp.salary / 12)
    const allowances = Math.round(base * 0.12)
    const deductions = Math.round(base * 0.08)
    payroll.push({
      id: `pay-${emp.id}-2026-05`,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      month: '2026-05',
      baseSalary: base,
      allowances,
      deductions,
      netSalary: base + allowances - deductions,
      status: 'PROCESSING',
      paidDate: null,
    })
  })

  const documents: DocumentRecord[] = [
    { id: 'doc-1', name: 'Corporate Policy Handbook 2026.pdf',    category: 'POLICY',   uploadDate: '2026-01-01', size: '2.4 MB', fileType: 'pdf',  url: '/mock-files/policy-handbook-2026.pdf' },
    { id: 'doc-2', name: 'Information Security Guidelines.docx',  category: 'POLICY',   uploadDate: '2026-01-10', size: '1.1 MB', fileType: 'docx', url: '/mock-files/info-sec-guidelines.docx' },
    { id: 'doc-3', name: 'Employment Contract - David Chen.pdf',  category: 'CONTRACT', uploadDate: '2021-06-01', size: '1.8 MB', fileType: 'pdf',  employeeId: 'emp-lead', employeeName: 'David Chen', url: '/mock-files/contract-david-chen.pdf' },
    { id: 'doc-4', name: 'ID Card Scan - Alex River.png',         category: 'ID_PROOF', uploadDate: '2023-02-15', size: '850 KB', fileType: 'png',  employeeId: 'emp-emp',  employeeName: 'Alex River', url: '/mock-files/id-alex-river.png' },
    { id: 'doc-5', name: 'Q1 Payroll Summary Spreadsheet.xlsx',   category: 'PAYROLL',  uploadDate: '2026-04-05', size: '3.6 MB', fileType: 'xlsx', url: '/mock-files/q1-payroll-2026.xlsx' },
  ]

  const notifications: SystemNotification[] = [
    { id: 'notif-1', title: 'Leave Request Submitted',    message: 'Alex River has requested Casual Leave from May 25 to May 27, 2026.',          type: 'LEAVE',        read: false, date: '2026-05-22T10:30:00Z', senderName: 'Alex River' },
    { id: 'notif-2', title: 'Payroll Processing Started', message: 'Salary disbursements for May 2026 have entered the processing phase.',         type: 'PAYROLL',      read: false, date: '2026-05-22T08:00:00Z', senderName: 'System' },
    { id: 'notif-3', title: 'Late Clock-in Registered',   message: 'Marcus Cole clocked in late today at 09:48 AM.',                              type: 'ATTENDANCE',   read: true,  date: '2026-05-22T09:50:00Z', senderName: 'Marcus Cole' },
    { id: 'notif-4', title: 'Q2 Townhall Announcement',   message: 'All employees are invited to the Q2 Townhall on June 1 at 3:00 PM via Zoom.', type: 'ANNOUNCEMENT', read: false, date: '2026-05-20T14:00:00Z', senderName: 'Sarah Jenkins' },
  ]

  return { employees, attendance, leaves, leaveBalances, payroll, departments, documents, notifications }
}

export function getDB(): DBState {
  const raw = localStorage.getItem(DB_KEY)
  if (!raw) {
    const fresh = seed()
    saveDB(fresh)
    return fresh
  }
  return JSON.parse(raw)
}

export function saveDB(db: DBState) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

export function resetDB() {
  const fresh = seed()
  saveDB(fresh)
  return fresh
}
