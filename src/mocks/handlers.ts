import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'
import { getDB, saveDB, FIXED_USERS } from './db'
import type {
  Employee,
  LeaveRequest,
  AttendanceRecord,
  Department,
  DocumentRecord,
  SystemNotification,
  UserRole,
  LeaveBalance,
} from '../types'

export const handlers = [

  // ─── Auth ────────────────────────────────────────────────────────────────

  http.post('/api/auth/login', async ({ request }) => {
    await delay(500)
    const { email, password } = (await request.json()) as any

    // Check the four hardcoded demo accounts first
    let user = FIXED_USERS.find((u) => u.email === email.toLowerCase())

    // Fall back to any seeded employee using password123
    if (!user) {
      const db = getDB()
      const emp = db.employees.find((e) => e.email === email.toLowerCase())
      if (emp && password === 'password123') {
        let role: UserRole = 'EMPLOYEE'
        if (emp.designation.includes('Manager') || emp.designation.includes('Director')) role = 'HR_MANAGER'
        else if (emp.designation.includes('Lead')) role = 'TEAM_LEAD'

        user = {
          id: emp.id,
          name: emp.name,
          email: emp.email,
          role,
          department: emp.department,
          designation: emp.designation,
          avatar: emp.avatar,
        }
      }
    }

    // Demo accounts use <username>123 as password (e.g. admin123, hr123)
    const expectedPwd = email.split('@')[0] + '123'
    const isValid = user && (password === expectedPwd || password === 'password123')

    if (user && isValid) {
      return HttpResponse.json({
        user,
        token: `mock-jwt-${user.id}-${user.role}`,
      })
    }

    return new HttpResponse(JSON.stringify({ message: 'Invalid email or password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }),

  // ─── Employees ───────────────────────────────────────────────────────────

  http.get('/api/employees', async ({ request }) => {
    await delay(400)
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const department = url.searchParams.get('department') || ''
    const status = url.searchParams.get('status') || ''
    const sortField = url.searchParams.get('sortField') || 'name'
    const sortOrder = url.searchParams.get('sortOrder') || 'asc'
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    const db = getDB()
    let rows = [...db.employees]

    if (status) rows = rows.filter((e) => e.status === status.toUpperCase())
    if (department && department !== 'All')
      rows = rows.filter((e) => e.department.toLowerCase() === department.toLowerCase())
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q)
      )
    }

    rows.sort((a: any, b: any) => {
      let va = a[sortField]
      let vb = b[sortField]
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase() }
      if (va < vb) return sortOrder === 'asc' ? -1 : 1
      if (va > vb) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    const totalCount = rows.length
    const start = (page - 1) * limit
    return HttpResponse.json({
      data: rows.slice(start, start + limit),
      pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
    })
  }),

  http.get('/api/employees/:id', async ({ params }) => {
    await delay(300)
    const db = getDB()
    const emp = db.employees.find((e) => e.id === params.id)
    if (!emp) {
      return new HttpResponse(JSON.stringify({ message: 'Employee not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return HttpResponse.json(emp)
  }),

  http.post('/api/employees', async ({ request }) => {
    await delay(500)
    const body = (await request.json()) as Partial<Employee>
    const db = getDB()

    if (!body.name || !body.email || !body.department || !body.designation) {
      return new HttpResponse(JSON.stringify({ message: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (db.employees.some((e) => e.email.toLowerCase() === body.email?.toLowerCase())) {
      return new HttpResponse(JSON.stringify({ message: 'Email already in use' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: body.name,
      email: body.email.toLowerCase(),
      phone: body.phone || '+1 (555) 000-0000',
      department: body.department,
      designation: body.designation,
      salary: Number(body.salary) || 60000,
      joiningDate: body.joiningDate || new Date().toISOString().split('T')[0],
      status: body.status || 'ACTIVE',
      attendancePercentage: 100,
      avatar:
        body.avatar ||
        `https://images.unsplash.com/photo-${faker.helpers.arrayElement([
          '1534528741775-53994a69daeb',
          '1506794778202-cad84cf45f1d',
          '1438761681033-6461ffad8d80',
        ])}?auto=format&fit=crop&q=80&w=200`,
    }

    db.employees.unshift(newEmp)

    db.leaveBalances.push({ employeeId: newEmp.id, sick: 10, casual: 12, annual: 15 })

    const dept = db.departments.find((d) => d.name === newEmp.department)
    if (dept) dept.employeeCount += 1

    const base = Math.round(newEmp.salary / 12)
    db.payroll.push({
      id: `pay-${newEmp.id}-2026-05`,
      employeeId: newEmp.id,
      employeeName: newEmp.name,
      department: newEmp.department,
      month: '2026-05',
      baseSalary: base,
      allowances: Math.round(base * 0.12),
      deductions: Math.round(base * 0.08),
      netSalary: Math.round(base * 1.04),
      status: 'PROCESSING',
      paidDate: null,
    })

    saveDB(db)
    return HttpResponse.json(newEmp, { status: 201 })
  }),

  http.put('/api/employees/:id', async ({ params, request }) => {
    await delay(500)
    const body = (await request.json()) as Partial<Employee>
    const db = getDB()

    const idx = db.employees.findIndex((e) => e.id === params.id)
    if (idx === -1) {
      return new HttpResponse(JSON.stringify({ message: 'Employee not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const prev = db.employees[idx]
    db.employees[idx] = { ...prev, ...body, id: prev.id }

    if (body.department && body.department !== prev.department) {
      const oldDept = db.departments.find((d) => d.name === prev.department)
      if (oldDept) oldDept.employeeCount = Math.max(0, oldDept.employeeCount - 1)
      const newDept = db.departments.find((d) => d.name === body.department)
      if (newDept) newDept.employeeCount += 1
    }

    saveDB(db)
    return HttpResponse.json(db.employees[idx])
  }),

  http.delete('/api/employees/:id', async ({ params }) => {
    await delay(500)
    const db = getDB()

    const idx = db.employees.findIndex((e) => e.id === params.id)
    if (idx === -1) {
      return new HttpResponse(JSON.stringify({ message: 'Employee not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const [removed] = db.employees.splice(idx, 1)
    const dept = db.departments.find((d) => d.name === removed.department)
    if (dept) dept.employeeCount = Math.max(0, dept.employeeCount - 1)

    saveDB(db)
    return HttpResponse.json({ success: true })
  }),

  // ─── Attendance ──────────────────────────────────────────────────────────

  http.get('/api/attendance', async ({ request }) => {
    await delay(400)
    const url = new URL(request.url)
    const date = url.searchParams.get('date') || ''
    const employeeId = url.searchParams.get('employeeId') || ''

    const db = getDB()
    let rows = [...db.attendance]
    if (date) rows = rows.filter((a) => a.date === date)
    if (employeeId) rows = rows.filter((a) => a.employeeId === employeeId)
    rows.sort((a, b) => b.date.localeCompare(a.date))

    return HttpResponse.json(rows)
  }),

  http.get('/api/attendance/stats', async ({ request }) => {
    await delay(400)
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId') || ''

    const db = getDB()
    let records = [...db.attendance]
    if (employeeId) records = records.filter((r) => r.employeeId === employeeId)

    const totalPresents = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length
    const totalLates = records.filter((r) => r.status === 'LATE').length
    const totalLeaves = records.filter((r) => r.status === 'LEAVE').length
    const totalAbsents = records.filter((r) => r.status === 'ABSENT').length
    const presentPercentage = Math.round((totalPresents / records.length) * 100) || 0

    const recentDates = Array.from(new Set(records.map((r) => r.date))).sort().slice(-7)
    const dailyStatsTrend = recentDates.map((date) => {
      const day = records.filter((r) => r.date === date)
      const present = day.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length
      const late = day.filter((r) => r.status === 'LATE').length
      const absent = day.filter((r) => r.status === 'ABSENT').length
      return {
        date,
        present: employeeId ? (present > 0 ? 1 : 0) : present,
        late: employeeId ? (late > 0 ? 1 : 0) : late,
        absent: employeeId ? (absent > 0 ? 1 : 0) : absent,
      }
    })

    return HttpResponse.json({ presentPercentage, totalPresents, totalLates, totalLeaves, totalAbsents, dailyStatsTrend })
  }),

  http.post('/api/attendance/punch', async ({ request }) => {
    await delay(500)
    const { employeeId, date, time, action } = (await request.json()) as {
      employeeId: string
      date: string
      time: string
      action: 'IN' | 'OUT'
    }

    const db = getDB()
    const emp = db.employees.find((e) => e.id === employeeId)
    if (!emp) {
      return new HttpResponse(JSON.stringify({ message: 'Employee not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const recordId = `att-${employeeId}-${date}`
    let recIdx = db.attendance.findIndex((a) => a.id === recordId)
    let record = recIdx !== -1 ? db.attendance[recIdx] : null

    if (action === 'IN') {
      if (record?.checkIn) {
        return new HttpResponse(JSON.stringify({ message: 'Already punched in for today' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const [h, m] = time.split(':').map(Number)
      const isLate = h > 9 || (h === 9 && m > 30)

      const newRecord: AttendanceRecord = {
        id: recordId,
        employeeId,
        employeeName: emp.name,
        date,
        checkIn: time,
        checkOut: null,
        status: isLate ? 'LATE' : 'PRESENT',
        totalHours: 0,
      }

      if (recIdx !== -1) db.attendance[recIdx] = newRecord
      else db.attendance.push(newRecord)

      if (isLate) {
        db.notifications.unshift({
          id: `notif-${Date.now()}`,
          title: 'Late Check-In',
          message: `${emp.name} clocked in late at ${time}.`,
          type: 'ATTENDANCE',
          read: false,
          date: new Date().toISOString(),
        })
      }

      record = newRecord
    } else {
      if (!record?.checkIn) {
        return new HttpResponse(JSON.stringify({ message: 'Must punch in before punching out' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      if (record.checkOut) {
        return new HttpResponse(JSON.stringify({ message: 'Already punched out for today' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const [inH, inM] = record.checkIn.split(':').map(Number)
      const [outH, outM] = time.split(':').map(Number)
      record.checkOut = time
      record.totalHours = parseFloat(((outH + outM / 60) - (inH + inM / 60)).toFixed(1))
    }

    saveDB(db)
    return HttpResponse.json(record)
  }),

  // ─── Leaves ──────────────────────────────────────────────────────────────

  http.get('/api/leaves', async ({ request }) => {
    await delay(400)
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId') || ''
    const status = url.searchParams.get('status') || ''

    const db = getDB()
    let rows = [...db.leaves]
    if (employeeId) rows = rows.filter((l) => l.employeeId === employeeId)
    if (status) rows = rows.filter((l) => l.status === status.toUpperCase())
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    return HttpResponse.json(rows)
  }),

  http.get('/api/leaves/balances/:employeeId', async ({ params }) => {
    await delay(300)
    const db = getDB()
    const balance = db.leaveBalances.find((b) => b.employeeId === params.employeeId)
    return HttpResponse.json(balance ?? { sick: 10, casual: 12, annual: 15 })
  }),

  http.post('/api/leaves', async ({ request }) => {
    await delay(500)
    const body = (await request.json()) as {
      employeeId: string
      type: 'SICK' | 'CASUAL' | 'ANNUAL'
      startDate: string
      endDate: string
      reason: string
    }

    const db = getDB()
    const emp = db.employees.find((e) => e.id === body.employeeId)
    if (!emp) {
      return new HttpResponse(JSON.stringify({ message: 'Employee not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const balance = db.leaveBalances.find((b) => b.employeeId === body.employeeId)
    if (balance) {
      const key = body.type.toLowerCase() as keyof Omit<LeaveBalance, 'employeeId'>
      const days =
        Math.ceil((new Date(body.endDate).getTime() - new Date(body.startDate).getTime()) / 86400000) + 1
      if (balance[key] < days) {
        return new HttpResponse(
          JSON.stringify({ message: `Not enough ${body.type.toLowerCase()} leave. Have ${balance[key]}, need ${days}.` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    const newLeave: LeaveRequest = {
      id: `leave-${Date.now()}`,
      employeeId: body.employeeId,
      employeeName: emp.name,
      type: body.type,
      startDate: body.startDate,
      endDate: body.endDate,
      status: 'PENDING',
      reason: body.reason,
      createdAt: new Date().toISOString(),
    }

    db.leaves.unshift(newLeave)
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'New Leave Request',
      message: `${emp.name} requested ${body.type} leave from ${body.startDate} to ${body.endDate}.`,
      type: 'LEAVE',
      read: false,
      date: new Date().toISOString(),
      senderName: emp.name,
    })

    saveDB(db)
    return HttpResponse.json(newLeave, { status: 201 })
  }),

  http.patch('/api/leaves/:id', async ({ params, request }) => {
    await delay(500)
    const body = (await request.json()) as { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }
    const db = getDB()

    const idx = db.leaves.findIndex((l) => l.id === params.id)
    if (idx === -1) {
      return new HttpResponse(JSON.stringify({ message: 'Leave request not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const leave = db.leaves[idx]
    leave.status = body.status
    if (body.rejectionReason) leave.rejectionReason = body.rejectionReason

    if (body.status === 'APPROVED') {
      const balance = db.leaveBalances.find((b) => b.employeeId === leave.employeeId)
      if (balance) {
        const key = leave.type.toLowerCase() as keyof Omit<LeaveBalance, 'employeeId'>
        const days =
          Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / 86400000) + 1
        balance[key] = Math.max(0, balance[key] - days)

        // Mark those days as LEAVE in the attendance log
        let d = new Date(leave.startDate)
        const end = new Date(leave.endDate)
        while (d <= end) {
          const dateStr = d.toISOString().split('T')[0]
          const attIdx = db.attendance.findIndex(
            (a) => a.employeeId === leave.employeeId && a.date === dateStr
          )
          const leaveEntry = {
            id: `att-${leave.employeeId}-${dateStr}`,
            employeeId: leave.employeeId,
            employeeName: leave.employeeName,
            date: dateStr,
            checkIn: null,
            checkOut: null,
            status: 'LEAVE' as const,
            totalHours: 0,
          }
          if (attIdx !== -1) Object.assign(db.attendance[attIdx], leaveEntry)
          else db.attendance.push(leaveEntry)
          d.setDate(d.getDate() + 1)
        }
      }
    }

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Leave ${body.status}`,
      message: `Your ${leave.type} leave (${leave.startDate} – ${leave.endDate}) was ${body.status.toLowerCase()}.${
        body.rejectionReason ? ` Reason: ${body.rejectionReason}` : ''
      }`,
      type: 'LEAVE',
      read: false,
      date: new Date().toISOString(),
    })

    saveDB(db)
    return HttpResponse.json(leave)
  }),

  // ─── Payroll ─────────────────────────────────────────────────────────────

  http.get('/api/payroll', async ({ request }) => {
    await delay(400)
    const url = new URL(request.url)
    const month = url.searchParams.get('month') || ''
    const department = url.searchParams.get('department') || ''

    const db = getDB()
    let rows = [...db.payroll]
    if (month) rows = rows.filter((p) => p.month === month)
    if (department && department !== 'All') rows = rows.filter((p) => p.department === department)
    rows.sort((a, b) => a.employeeName.localeCompare(b.employeeName))

    return HttpResponse.json(rows)
  }),

  http.get('/api/payroll/stats', async ({ request }) => {
    await delay(400)
    const month = new URL(request.url).searchParams.get('month') || '2026-05'
    const db = getDB()
    const records = db.payroll.filter((p) => p.month === month)

    const totalOutflow = records.reduce((s, p) => s + p.netSalary, 0)
    const avgSalary = records.length ? Math.round(totalOutflow / records.length) : 0
    const totalDeductions = records.reduce((s, p) => s + p.deductions, 0)

    const months = Array.from(new Set(db.payroll.map((p) => p.month))).sort()
    const monthlySpendTrend = months.map((m) => {
      const mr = db.payroll.filter((p) => p.month === m)
      return { month: m, totalSpend: mr.reduce((s, p) => s + p.netSalary, 0), headcount: mr.length }
    })

    return HttpResponse.json({ totalOutflow, avgSalary, totalDeductions, monthlySpendTrend })
  }),

  http.patch('/api/payroll/:id', async ({ params, request }) => {
    await delay(500)
    const { status } = (await request.json()) as { status: 'PAID' | 'PROCESSING' | 'PENDING' }
    const db = getDB()

    const idx = db.payroll.findIndex((p) => p.id === params.id)
    if (idx === -1) {
      return new HttpResponse(JSON.stringify({ message: 'Payroll record not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const record = db.payroll[idx]
    record.status = status
    if (status === 'PAID') {
      record.paidDate = new Date().toISOString().split('T')[0]
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        title: 'Payslip Ready',
        message: `Your ${record.month} payslip is available. Net: $${record.netSalary.toLocaleString()}`,
        type: 'PAYROLL',
        read: false,
        date: new Date().toISOString(),
      })
    }

    saveDB(db)
    return HttpResponse.json(record)
  }),

  // ─── Departments ─────────────────────────────────────────────────────────

  http.get('/api/departments', async () => {
    await delay(300)
    return HttpResponse.json(getDB().departments)
  }),

  http.post('/api/departments', async ({ request }) => {
    await delay(500)
    const body = (await request.json()) as Partial<Department>
    if (!body.name) {
      return new HttpResponse(JSON.stringify({ message: 'Department name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const db = getDB()
    const dept: Department = {
      id: `dept-${Date.now()}`,
      name: body.name,
      managerId: body.managerId ?? null,
      managerName: body.managerName ?? null,
      employeeCount: 0,
      budget: Number(body.budget) || 100000,
      description: body.description || '',
    }

    db.departments.push(dept)
    saveDB(db)
    return HttpResponse.json(dept, { status: 201 })
  }),

  http.put('/api/departments/:id', async ({ params, request }) => {
    await delay(500)
    const body = (await request.json()) as Partial<Department>
    const db = getDB()

    const idx = db.departments.findIndex((d) => d.id === params.id)
    if (idx === -1) {
      return new HttpResponse(JSON.stringify({ message: 'Department not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    db.departments[idx] = { ...db.departments[idx], ...body, id: db.departments[idx].id }
    saveDB(db)
    return HttpResponse.json(db.departments[idx])
  }),

  // ─── Documents ───────────────────────────────────────────────────────────

  http.get('/api/documents', async ({ request }) => {
    await delay(400)
    const url = new URL(request.url)
    const category = url.searchParams.get('category') || ''
    const employeeId = url.searchParams.get('employeeId') || ''

    const db = getDB()
    let rows = [...db.documents]
    if (category) rows = rows.filter((d) => d.category === category.toUpperCase())
    if (employeeId) rows = rows.filter((d) => d.employeeId === employeeId)
    rows.sort((a, b) => b.uploadDate.localeCompare(a.uploadDate))

    return HttpResponse.json(rows)
  }),

  http.post('/api/documents/upload', async ({ request }) => {
    await delay(800)
    const body = (await request.json()) as {
      name: string
      category: string
      employeeId?: string
      fileType: string
      size: string
    }

    const db = getDB()
    const emp = body.employeeId ? db.employees.find((e) => e.id === body.employeeId) : undefined

    const doc: DocumentRecord = {
      id: `doc-${Date.now()}`,
      name: body.name,
      category: body.category.toUpperCase() as any,
      uploadDate: new Date().toISOString().split('T')[0],
      size: body.size,
      fileType: body.fileType,
      employeeId: body.employeeId,
      employeeName: emp?.name,
      url: `/mock-files/${body.name.toLowerCase().replace(/ /g, '-')}`,
    }

    db.documents.unshift(doc)
    saveDB(db)
    return HttpResponse.json(doc, { status: 201 })
  }),

  http.delete('/api/documents/:id', async ({ params }) => {
    await delay(400)
    const db = getDB()
    const idx = db.documents.findIndex((d) => d.id === params.id)
    if (idx === -1) {
      return new HttpResponse(JSON.stringify({ message: 'Document not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    db.documents.splice(idx, 1)
    saveDB(db)
    return HttpResponse.json({ success: true })
  }),

  // ─── Notifications ───────────────────────────────────────────────────────

  http.get('/api/notifications', async () => {
    await delay(200)
    return HttpResponse.json(getDB().notifications)
  }),

  http.patch('/api/notifications/:id/read', async ({ params }) => {
    const db = getDB()
    const idx = db.notifications.findIndex((n) => n.id === params.id)
    if (idx === -1) {
      return new HttpResponse(JSON.stringify({ message: 'Notification not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    db.notifications[idx].read = true
    saveDB(db)
    return HttpResponse.json(db.notifications[idx])
  }),

  http.post('/api/notifications/announce', async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as { title: string; message: string; senderName: string }
    const db = getDB()

    const announcement: SystemNotification = {
      id: `notif-${Date.now()}`,
      title: body.title,
      message: body.message,
      type: 'ANNOUNCEMENT',
      read: false,
      date: new Date().toISOString(),
      senderName: body.senderName,
    }

    db.notifications.unshift(announcement)
    saveDB(db)
    return HttpResponse.json(announcement, { status: 201 })
  }),
]
