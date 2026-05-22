import { http, HttpResponse, delay } from 'msw';
import { faker } from '@faker-js/faker';
import { getDB, saveDB, FIXED_USERS } from './db';
import type { 
  Employee, 
  LeaveRequest, 
  AttendanceRecord, 
  Department, 
  DocumentRecord, 
  SystemNotification,
  UserRole,
  LeaveBalance
} from '../types';

export const handlers = [
  // 1. AUTHENTICATION
  http.post('/api/auth/login', async ({ request }) => {
    await delay(500);
    const body = await request.json() as any;
    const { email, password } = body;

    // Check fixed credentials
    let foundUser = FIXED_USERS.find(u => u.email === email.toLowerCase());
    
    // If not in fixed users, check if the email exists in employee list
    if (!foundUser) {
      const db = getDB();
      const emp = db.employees.find(e => e.email === email.toLowerCase());
      if (emp && password === 'password123') {
        // Create user profile
        let role: UserRole = 'EMPLOYEE';
        if (emp.designation.includes('Manager') || emp.designation.includes('Director')) {
          role = 'HR_MANAGER';
        } else if (emp.designation.includes('Lead')) {
          role = 'TEAM_LEAD';
        }
        
        foundUser = {
          id: emp.id,
          name: emp.name,
          email: emp.email,
          role,
          department: emp.department,
          designation: emp.designation,
          avatar: emp.avatar
        };
      }
    }

    // Default password matching check (either exact match like admin123/hr123/lead123/employee123, or password123 for others)
    const expectedPassword = email.split('@')[0] + '123';
    const isFixedMatch = foundUser && (password === expectedPassword || password === 'password123');

    if (foundUser && isFixedMatch) {
      return HttpResponse.json({
        user: foundUser,
        token: `mock-jwt-token-for-${foundUser.id}-${foundUser.role}`
      });
    }

    return new HttpResponse(
      JSON.stringify({ message: 'Invalid email or password' }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }),

  // 2. EMPLOYEES
  http.get('/api/employees', async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const department = url.searchParams.get('department') || '';
    const status = url.searchParams.get('status') || '';
    const sortField = url.searchParams.get('sortField') || 'name';
    const sortOrder = url.searchParams.get('sortOrder') || 'asc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const db = getDB();
    let result = [...db.employees];

    // Filter status
    if (status) {
      result = result.filter(e => e.status === status.toUpperCase());
    }

    // Filter department
    if (department && department !== 'All') {
      result = result.filter(e => e.department.toLowerCase() === department.toLowerCase());
    }

    // Search query
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e => 
        e.name.toLowerCase().includes(q) || 
        e.email.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination
    const totalCount = result.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = result.slice(startIndex, startIndex + limit);

    return HttpResponse.json({
      data: paginatedItems,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  }),

  http.get('/api/employees/:id', async ({ params }) => {
    await delay(300);
    const { id } = params;
    const db = getDB();
    const emp = db.employees.find(e => e.id === id);
    if (!emp) {
      return new HttpResponse(
        JSON.stringify({ message: 'Employee not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return HttpResponse.json(emp);
  }),

  http.post('/api/employees', async ({ request }) => {
    await delay(500);
    const body = await request.json() as Partial<Employee>;
    const db = getDB();
    
    if (!body.name || !body.email || !body.department || !body.designation) {
      return new HttpResponse(
        JSON.stringify({ message: 'Missing required employee fields' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check duplicate email
    if (db.employees.some(e => e.email.toLowerCase() === body.email?.toLowerCase())) {
      return new HttpResponse(
        JSON.stringify({ message: 'An employee with this email already exists' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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
      avatar: body.avatar || `https://images.unsplash.com/photo-${faker.helpers.arrayElement([
        '1534528741775-53994a69daeb', '1506794778202-cad84cf45f1d', '1438761681033-6461ffad8d80'
      ])}?auto=format&fit=crop&q=80&w=200`
    };

    db.employees.unshift(newEmp);

    // Create leave balances
    db.leaveBalances.push({
      employeeId: newEmp.id,
      sick: 10,
      casual: 12,
      annual: 15
    });

    // Update department counts
    const dept = db.departments.find(d => d.name === newEmp.department);
    if (dept) {
      dept.employeeCount += 1;
    }

    // Create current month's payroll record
    db.payroll.push({
      id: `pay-${newEmp.id}-2026-05`,
      employeeId: newEmp.id,
      employeeName: newEmp.name,
      department: newEmp.department,
      month: '2026-05',
      baseSalary: Math.round(newEmp.salary / 12),
      allowances: Math.round(newEmp.salary / 12 * 0.12),
      deductions: Math.round(newEmp.salary / 12 * 0.08),
      netSalary: Math.round(newEmp.salary / 12 * 1.04),
      status: 'PROCESSING',
      paidDate: null
    });

    saveDB(db);
    return HttpResponse.json(newEmp, { status: 201 });
  }),

  http.put('/api/employees/:id', async ({ params, request }) => {
    await delay(500);
    const { id } = params;
    const body = await request.json() as Partial<Employee>;
    const db = getDB();
    
    const index = db.employees.findIndex(e => e.id === id);
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({ message: 'Employee not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const currentEmp = db.employees[index];
    const prevDept = currentEmp.department;

    db.employees[index] = {
      ...currentEmp,
      ...body,
      id: currentEmp.id // safety lock
    };

    // Update departments counts if department changed
    if (body.department && body.department !== prevDept) {
      const pDept = db.departments.find(d => d.name === prevDept);
      if (pDept) pDept.employeeCount = Math.max(0, pDept.employeeCount - 1);
      
      const nDept = db.departments.find(d => d.name === body.department);
      if (nDept) nDept.employeeCount += 1;
    }

    saveDB(db);
    return HttpResponse.json(db.employees[index]);
  }),

  http.delete('/api/employees/:id', async ({ params }) => {
    await delay(500);
    const { id } = params;
    const db = getDB();

    const empIndex = db.employees.findIndex(e => e.id === id);
    if (empIndex === -1) {
      return new HttpResponse(
        JSON.stringify({ message: 'Employee not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emp = db.employees[empIndex];
    db.employees.splice(empIndex, 1);

    // Update department counts
    const dept = db.departments.find(d => d.name === emp.department);
    if (dept) {
      dept.employeeCount = Math.max(0, dept.employeeCount - 1);
    }

    saveDB(db);
    return HttpResponse.json({ success: true, message: 'Employee deleted' });
  }),

  // 3. ATTENDANCE
  http.get('/api/attendance', async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const date = url.searchParams.get('date') || '';
    const employeeId = url.searchParams.get('employeeId') || '';

    const db = getDB();
    let result = [...db.attendance];

    if (date) {
      result = result.filter(a => a.date === date);
    }
    if (employeeId) {
      result = result.filter(a => a.employeeId === employeeId);
    }

    // Sort by date desc
    result.sort((a, b) => b.date.localeCompare(a.date));

    return HttpResponse.json(result);
  }),

  http.get('/api/attendance/stats', async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId') || '';
    
    const db = getDB();
    let records = [...db.attendance];
    
    if (employeeId) {
      records = records.filter(r => r.employeeId === employeeId);
    }

    // For single employee or company stats
    const totalPresents = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const totalLates = records.filter(r => r.status === 'LATE').length;
    const totalLeaves = records.filter(r => r.status === 'LEAVE').length;
    const totalAbsents = records.filter(r => r.status === 'ABSENT').length;
    
    const presentPercentage = Math.round((totalPresents / records.length) * 100) || 0;
    
    // Last 7 days chart trends
    const recentDates = Array.from(new Set(records.map(r => r.date))).sort().slice(-7);
    const dailyStatsTrend = recentDates.map(date => {
      const dateRecords = records.filter(r => r.date === date);
      const present = dateRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
      const late = dateRecords.filter(r => r.status === 'LATE').length;
      const absent = dateRecords.filter(r => r.status === 'ABSENT').length;
      
      return {
        date,
        present: employeeId ? (present > 0 ? 1 : 0) : present,
        late: employeeId ? (late > 0 ? 1 : 0) : late,
        absent: employeeId ? (absent > 0 ? 1 : 0) : absent
      };
    });

    return HttpResponse.json({
      presentPercentage,
      totalPresents,
      totalLates,
      totalLeaves,
      totalAbsents,
      dailyStatsTrend
    });
  }),

  http.post('/api/attendance/punch', async ({ request }) => {
    await delay(500);
    const body = await request.json() as { employeeId: string; date: string; time: string; action: 'IN' | 'OUT' };
    const { employeeId, date, time, action } = body;
    
    const db = getDB();
    const emp = db.employees.find(e => e.id === employeeId);
    if (!emp) {
      return new HttpResponse(
        JSON.stringify({ message: 'Employee not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const key = `att-${employeeId}-${date}`;
    let recordIndex = db.attendance.findIndex(a => a.id === key);
    let record = recordIndex !== -1 ? db.attendance[recordIndex] : null;

    if (action === 'IN') {
      if (record && record.checkIn) {
        return new HttpResponse(
          JSON.stringify({ message: 'Already punched in for today' }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check-in limits (late after 09:30 AM)
      const parsedTime = time.split(':');
      const hour = parseInt(parsedTime[0]);
      const min = parseInt(parsedTime[1]);
      const isLate = (hour > 9) || (hour === 9 && min > 30);
      
      const newRecord: AttendanceRecord = {
        id: key,
        employeeId,
        employeeName: emp.name,
        date,
        checkIn: time,
        checkOut: null,
        status: isLate ? 'LATE' : 'PRESENT',
        totalHours: 0
      };

      if (recordIndex !== -1) {
        db.attendance[recordIndex] = newRecord;
      } else {
        db.attendance.push(newRecord);
      }
      
      // Post notification for late punch-ins
      if (isLate) {
        db.notifications.unshift({
          id: `notif-${Date.now()}`,
          title: 'Late Attendance Check-In',
          message: `${emp.name} checked in late at ${time} today.`,
          type: 'ATTENDANCE',
          read: false,
          date: new Date().toISOString()
        });
      }
      
      record = newRecord;
    } else {
      // Punch OUT
      if (!record || !record.checkIn) {
        return new HttpResponse(
          JSON.stringify({ message: 'Must punch in before punching out' }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (record.checkOut) {
        return new HttpResponse(
          JSON.stringify({ message: 'Already punched out for today' }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Calculate total hours
      const inTime = record.checkIn.split(':');
      const outTime = time.split(':');
      const inDec = parseInt(inTime[0]) + parseInt(inTime[1]) / 60;
      const outDec = parseInt(outTime[0]) + parseInt(outTime[1]) / 60;
      const hours = parseFloat((outDec - inDec).toFixed(1));

      record.checkOut = time;
      record.totalHours = hours;
    }

    saveDB(db);
    return HttpResponse.json(record);
  }),

  // 4. LEAVES
  http.get('/api/leaves', async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId') || '';
    const status = url.searchParams.get('status') || '';

    const db = getDB();
    let result = [...db.leaves];

    if (employeeId) {
      result = result.filter(l => l.employeeId === employeeId);
    }
    if (status) {
      result = result.filter(l => l.status === status.toUpperCase());
    }

    // Sort by creation date desc
    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return HttpResponse.json(result);
  }),

  http.get('/api/leaves/balances/:employeeId', async ({ params }) => {
    await delay(300);
    const { employeeId } = params;
    const db = getDB();
    const balance = db.leaveBalances.find(b => b.employeeId === employeeId);
    
    if (!balance) {
      return HttpResponse.json({ sick: 10, casual: 12, annual: 15 }); // default safe return
    }

    return HttpResponse.json(balance);
  }),

  http.post('/api/leaves', async ({ request }) => {
    await delay(500);
    const body = await request.json() as { employeeId: string; type: 'SICK' | 'CASUAL' | 'ANNUAL'; startDate: string; endDate: string; reason: string };
    const db = getDB();
    
    const emp = db.employees.find(e => e.id === body.employeeId);
    if (!emp) {
      return new HttpResponse(
        JSON.stringify({ message: 'Employee not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check balances
    const balance = db.leaveBalances.find(b => b.employeeId === body.employeeId);
    if (balance) {
      const typeKey = body.type.toLowerCase() as keyof Omit<LeaveBalance, 'employeeId'>;
      const start = new Date(body.startDate);
      const end = new Date(body.endDate);
      const daysNeeded = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

      if (balance[typeKey] < daysNeeded) {
        return new HttpResponse(
          JSON.stringify({ message: `Insufficient leave balance. You have ${balance[typeKey]} days, but requested ${daysNeeded} days.` }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const newRequest: LeaveRequest = {
      id: `leave-${Date.now()}`,
      employeeId: body.employeeId,
      employeeName: emp.name,
      type: body.type,
      startDate: body.startDate,
      endDate: body.endDate,
      status: 'PENDING',
      reason: body.reason,
      createdAt: new Date().toISOString()
    };

    db.leaves.unshift(newRequest);
    
    // Add manager notification
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'New Leave Request',
      message: `${emp.name} has requested ${body.type} leave from ${body.startDate} to ${body.endDate}.`,
      type: 'LEAVE',
      read: false,
      date: new Date().toISOString(),
      senderName: emp.name
    });

    saveDB(db);
    return HttpResponse.json(newRequest, { status: 201 });
  }),

  http.patch('/api/leaves/:id', async ({ params, request }) => {
    await delay(500);
    const { id } = params;
    const body = await request.json() as { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string };
    const db = getDB();

    const leaveIdx = db.leaves.findIndex(l => l.id === id);
    if (leaveIdx === -1) {
      return new HttpResponse(
        JSON.stringify({ message: 'Leave request not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const leave = db.leaves[leaveIdx];
    leave.status = body.status;
    if (body.rejectionReason) {
      leave.rejectionReason = body.rejectionReason;
    }

    // Deduct leave balances if approved
    if (body.status === 'APPROVED') {
      const balance = db.leaveBalances.find(b => b.employeeId === leave.employeeId);
      if (balance) {
        const typeKey = leave.type.toLowerCase() as keyof Omit<LeaveBalance, 'employeeId'>;
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
        balance[typeKey] = Math.max(0, balance[typeKey] - days);
        
        // Add attendance logs for those days to mark as LEAVE status
        let d = new Date(leave.startDate);
        const dEnd = new Date(leave.endDate);
        while (d <= dEnd) {
          const dateStr = d.toISOString().split('T')[0];
          const attIdx = db.attendance.findIndex(a => a.employeeId === leave.employeeId && a.date === dateStr);
          if (attIdx !== -1) {
            db.attendance[attIdx].status = 'LEAVE';
            db.attendance[attIdx].checkIn = null;
            db.attendance[attIdx].checkOut = null;
            db.attendance[attIdx].totalHours = 0;
          } else {
            db.attendance.push({
              id: `att-${leave.employeeId}-${dateStr}`,
              employeeId: leave.employeeId,
              employeeName: leave.employeeName,
              date: dateStr,
              checkIn: null,
              checkOut: null,
              status: 'LEAVE',
              totalHours: 0
            });
          }
          d.setDate(d.getDate() + 1);
        }
      }
    }

    // Create user notification
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Leave Request ${body.status}`,
      message: `Your request for ${leave.type} leave (${leave.startDate} to ${leave.endDate}) has been ${body.status.toLowerCase()}.${
        body.rejectionReason ? ` Reason: ${body.rejectionReason}` : ''
      }`,
      type: 'LEAVE',
      read: false,
      date: new Date().toISOString()
    });

    saveDB(db);
    return HttpResponse.json(leave);
  }),

  // 5. PAYROLL
  http.get('/api/payroll', async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const month = url.searchParams.get('month') || '';
    const department = url.searchParams.get('department') || '';

    const db = getDB();
    let result = [...db.payroll];

    if (month) {
      result = result.filter(p => p.month === month);
    }
    if (department && department !== 'All') {
      result = result.filter(p => p.department === department);
    }

    // Sort by name
    result.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

    return HttpResponse.json(result);
  }),

  http.get('/api/payroll/stats', async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const month = url.searchParams.get('month') || '2026-05';
    
    const db = getDB();
    const records = db.payroll.filter(p => p.month === month);
    
    const totalOutflow = records.reduce((sum, p) => sum + p.netSalary, 0);
    const avgSalary = records.length > 0 ? Math.round(totalOutflow / records.length) : 0;
    const totalDeductions = records.reduce((sum, p) => sum + p.deductions, 0);
    
    // Month-wise trends for the past 6 months
    const allMonths = Array.from(new Set(db.payroll.map(p => p.month))).sort();
    const monthlySpendTrend = allMonths.map(m => {
      const mRecords = db.payroll.filter(p => p.month === m);
      return {
        month: m,
        totalSpend: mRecords.reduce((sum, p) => sum + p.netSalary, 0),
        headcount: mRecords.length
      };
    });

    return HttpResponse.json({
      totalOutflow,
      avgSalary,
      totalDeductions,
      monthlySpendTrend
    });
  }),

  http.patch('/api/payroll/:id', async ({ params, request }) => {
    await delay(500);
    const { id } = params;
    const body = await request.json() as { status: 'PAID' | 'PROCESSING' | 'PENDING' };
    const db = getDB();

    const payIdx = db.payroll.findIndex(p => p.id === id);
    if (payIdx === -1) {
      return new HttpResponse(
        JSON.stringify({ message: 'Payroll record not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const pay = db.payroll[payIdx];
    pay.status = body.status;
    if (body.status === 'PAID') {
      pay.paidDate = new Date().toISOString().split('T')[0];
      
      // Notify employee
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        title: 'Payslip Released',
        message: `Your payslip for ${pay.month} is ready. Net credit: $${pay.netSalary.toLocaleString()}`,
        type: 'PAYROLL',
        read: false,
        date: new Date().toISOString()
      });
    }

    saveDB(db);
    return HttpResponse.json(pay);
  }),

  // 6. DEPARTMENTS
  http.get('/api/departments', async () => {
    await delay(300);
    const db = getDB();
    return HttpResponse.json(db.departments);
  }),

  http.post('/api/departments', async ({ request }) => {
    await delay(500);
    const body = await request.json() as Partial<Department>;
    const db = getDB();

    if (!body.name) {
      return new HttpResponse(
        JSON.stringify({ message: 'Department name is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name: body.name,
      managerId: body.managerId || null,
      managerName: body.managerName || null,
      employeeCount: 0,
      budget: Number(body.budget) || 100000,
      description: body.description || ''
    };

    db.departments.push(newDept);
    saveDB(db);
    return HttpResponse.json(newDept, { status: 201 });
  }),

  http.put('/api/departments/:id', async ({ params, request }) => {
    await delay(500);
    const { id } = params;
    const body = await request.json() as Partial<Department>;
    const db = getDB();

    const idx = db.departments.findIndex(d => d.id === id);
    if (idx === -1) {
      return new HttpResponse(
        JSON.stringify({ message: 'Department not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    db.departments[idx] = {
      ...db.departments[idx],
      ...body,
      id: db.departments[idx].id // safety lock
    };

    saveDB(db);
    return HttpResponse.json(db.departments[idx]);
  }),

  // 7. DOCUMENTS
  http.get('/api/documents', async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || '';
    const employeeId = url.searchParams.get('employeeId') || '';

    const db = getDB();
    let result = [...db.documents];

    if (category) {
      result = result.filter(d => d.category === category.toUpperCase());
    }
    
    if (employeeId) {
      result = result.filter(d => d.employeeId === employeeId);
    }

    // Sort by upload date desc
    result.sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));

    return HttpResponse.json(result);
  }),

  http.post('/api/documents/upload', async ({ request }) => {
    await delay(800); // simulate upload progress
    const body = await request.json() as { name: string; category: string; employeeId?: string; fileType: string; size: string };
    const db = getDB();

    let empName: string | undefined = undefined;
    if (body.employeeId) {
      const emp = db.employees.find(e => e.id === body.employeeId);
      empName = emp?.name;
    }

    const newDoc: DocumentRecord = {
      id: `doc-${Date.now()}`,
      name: body.name,
      category: body.category.toUpperCase() as any,
      uploadDate: new Date().toISOString().split('T')[0],
      size: body.size,
      fileType: body.fileType,
      employeeId: body.employeeId,
      employeeName: empName,
      url: `/mock-files/${body.name.toLowerCase().replace(/ /g, '-')}`
    };

    db.documents.unshift(newDoc);
    saveDB(db);
    return HttpResponse.json(newDoc, { status: 201 });
  }),

  http.delete('/api/documents/:id', async ({ params }) => {
    await delay(400);
    const { id } = params;
    const db = getDB();

    const idx = db.documents.findIndex(d => d.id === id);
    if (idx === -1) {
      return new HttpResponse(
        JSON.stringify({ message: 'Document not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    db.documents.splice(idx, 1);
    saveDB(db);
    return HttpResponse.json({ success: true, message: 'Document deleted' });
  }),

  // 8. NOTIFICATIONS
  http.get('/api/notifications', async () => {
    await delay(200);
    const db = getDB();
    return HttpResponse.json(db.notifications);
  }),

  http.patch('/api/notifications/:id/read', async ({ params }) => {
    const { id } = params;
    const db = getDB();

    const idx = db.notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      db.notifications[idx].read = true;
      saveDB(db);
      return HttpResponse.json(db.notifications[idx]);
    }

    return new HttpResponse(
      JSON.stringify({ message: 'Notification not found' }), 
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }),

  http.post('/api/notifications/announce', async ({ request }) => {
    await delay(400);
    const body = await request.json() as { title: string; message: string; senderName: string };
    const db = getDB();

    const newAnnouncement: SystemNotification = {
      id: `notif-${Date.now()}`,
      title: body.title,
      message: body.message,
      type: 'ANNOUNCEMENT',
      read: false,
      date: new Date().toISOString(),
      senderName: body.senderName
    };

    db.notifications.unshift(newAnnouncement);
    saveDB(db);
    return HttpResponse.json(newAnnouncement, { status: 201 });
  }),
];
