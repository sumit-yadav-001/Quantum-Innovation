import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Download, 
  Upload, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  Filter,
  UserPlus
} from 'lucide-react';
import { 
  useReactTable, 
  getCoreRowModel, 
  ColumnDef, 
  flexRender 
} from '@tanstack/react-table';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import apiClient from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import { useAppDispatch } from '../app/store';
import { addToast } from '../app/store/notificationSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Drawer } from '../components/ui/Drawer';
import { Loader } from '../components/ui/Loader';
import { ErrorState } from '../components/ui/ErrorState';
import type { Employee } from '../types';

// Zod Schema for Employee Add/Edit
const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid corporate email'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  department: z.string().min(1, 'Please select a department'),
  designation: z.string().min(2, 'Designation is required'),
  salary: z.coerce.number().min(1000, 'Salary must be at least $1,000'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  status: z.enum(['ACTIVE', 'INACTIVE'])
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const Employees: React.FC = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Fetch Employees via TanStack Query
  const { data: employeesRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['employees', { search, department, status, page, limit }],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.EMPLOYEES, {
        params: {
          search,
          department: department === 'All' ? '' : department,
          status,
          page,
          limit,
          sortField: 'name',
          sortOrder: 'asc'
        }
      });
      return res.data;
    }
  });

  const employeeData = useMemo(() => employeesRes?.data || [], [employeesRes]);
  const pagination = employeesRes?.pagination || { page: 1, limit: 10, totalCount: 0, totalPages: 1 };

  // Form Setup
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      department: '',
      designation: '',
      salary: 60000,
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    }
  });

  // Mutate: Add Employee
  const addMutation = useMutation({
    mutationFn: (values: EmployeeFormValues) => apiClient.post(ENDPOINTS.EMPLOYEES, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setDrawerOpen(false);
      reset();
      dispatch(
        addToast({
          title: 'Employee Added',
          message: 'The employee profile has been created successfully.',
          type: 'success'
        })
      );
    },
    onError: (err: any) => {
      dispatch(
        addToast({
          title: 'Action Failed',
          message: err.message || 'Unable to create employee record.',
          type: 'error'
        })
      );
    }
  });

  // Mutate: Edit Employee
  const editMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: EmployeeFormValues }) => 
      apiClient.put(`${ENDPOINTS.EMPLOYEES}/${id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setDrawerOpen(false);
      setEditingEmployee(null);
      reset();
      dispatch(
        addToast({
          title: 'Employee Updated',
          message: 'The employee profile has been modified successfully.',
          type: 'success'
        })
      );
    },
    onError: (err: any) => {
      dispatch(
        addToast({
          title: 'Action Failed',
          message: err.message || 'Unable to update employee record.',
          type: 'error'
        })
      );
    }
  });

  // Mutate: Delete Employee
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`${ENDPOINTS.EMPLOYEES}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      dispatch(
        addToast({
          title: 'Employee Removed',
          message: 'The employee record has been deleted.',
          type: 'success'
        })
      );
    },
    onError: (err: any) => {
      dispatch(
        addToast({
          title: 'Action Failed',
          message: err.message || 'Unable to remove employee record.',
          type: 'error'
        })
      );
    }
  });

  // Submit Handler
  const onSubmit = (values: EmployeeFormValues) => {
    if (editingEmployee) {
      editMutation.mutate({ id: editingEmployee.id, values });
    } else {
      addMutation.mutate(values);
    }
  };

  const openAddDrawer = () => {
    setEditingEmployee(null);
    reset({
      name: '',
      email: '',
      phone: '',
      department: '',
      designation: '',
      salary: 60000,
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    });
    setDrawerOpen(true);
  };

  const openEditDrawer = (emp: Employee) => {
    setEditingEmployee(emp);
    setValue('name', emp.name);
    setValue('email', emp.email);
    setValue('phone', emp.phone);
    setValue('department', emp.department);
    setValue('designation', emp.designation);
    setValue('salary', emp.salary);
    setValue('joiningDate', emp.joiningDate);
    setValue('status', emp.status);
    setDrawerOpen(true);
  };

  // CSV Bulk Import
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    dispatch(addToast({ title: 'Importing CSV', message: 'Parsing and loading employee rows...', type: 'info' }));

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        let successes = 0;
        let failures = 0;

        for (const row of rows) {
          try {
            // Basic Zod check or structural fit
            const validated = employeeSchema.parse({
              name: row.Name || row.name,
              email: row.Email || row.email,
              phone: row.Phone || row.phone || '+1 (555) 000-0000',
              department: row.Department || row.department,
              designation: row.Designation || row.designation,
              salary: Number(row.Salary || row.salary) || 50000,
              joiningDate: row.JoiningDate || row.joiningDate || new Date().toISOString().split('T')[0],
              status: (row.Status || row.status || 'ACTIVE').toUpperCase() as any
            });

            await apiClient.post(ENDPOINTS.EMPLOYEES, validated);
            successes++;
          } catch (err) {
            failures++;
          }
        }

        queryClient.invalidateQueries({ queryKey: ['employees'] });
        queryClient.invalidateQueries({ queryKey: ['departments'] });
        
        dispatch(
          addToast({
            title: 'CSV Import Completed',
            message: `Successfully added ${successes} employees.${failures > 0 ? ` Failed to import ${failures} rows.` : ''}`,
            type: successes > 0 ? 'success' : 'error'
          })
        );
      }
    });

    e.target.value = ''; // Reset input
  };

  // XLSX Export Roster
  const handleXLSXExport = async () => {
    try {
      dispatch(addToast({ title: 'Exporting...', message: 'Generating Excel Spreadsheet...', type: 'info' }));
      // Fetch full active list for export (omit pagination params)
      const res = await apiClient.get(ENDPOINTS.EMPLOYEES, { params: { limit: 1000 } });
      const fullList = res.data.data;

      const formatted = fullList.map((emp: Employee) => ({
        'Employee ID': emp.id,
        'Name': emp.name,
        'Email Address': emp.email,
        'Phone Number': emp.phone,
        'Department': emp.department,
        'Designation': emp.designation,
        'Joining Date': emp.joiningDate,
        'Monthly Salary ($)': Math.round(emp.salary / 12),
        'Annual Base Salary ($)': emp.salary,
        'Status': emp.status,
        'Attendance Rate (%)': emp.attendancePercentage
      }));

      const worksheet = XLSX.utils.json_to_sheet(formatted);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Active Employees');
      
      // Auto width fit
      const maxLens = Object.keys(formatted[0] || {}).map(k => k.length);
      formatted.forEach((row: any) => {
        Object.values(row).forEach((val: any, i) => {
          maxLens[i] = Math.max(maxLens[i], String(val || '').length);
        });
      });
      worksheet['!cols'] = maxLens.map(len => ({ wch: len + 3 }));

      XLSX.writeFile(workbook, `AuraHR_Employee_Roster_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      dispatch(addToast({ title: 'Export Successful', message: 'Employee roster downloaded as XLSX.', type: 'success' }));
    } catch (err) {
      dispatch(addToast({ title: 'Export Failed', message: 'Unable to build spreadsheet file.', type: 'error' }));
    }
  };

  // Column definitions for TanStack Table
  const columns = useMemo<ColumnDef<Employee>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Employee Name',
      cell: info => {
        const row = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <img 
              src={row.avatar} 
              alt={row.name} 
              className="w-8 h-8 rounded-full object-cover border border-slate-100 dark:border-slate-800"
            />
            <div className="flex flex-col text-left">
              <Link 
                to={`/employees/${row.id}`} 
                className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400 hover:underline"
              >
                {row.name}
              </Link>
              <span className="text-[10px] text-slate-400 font-medium">{row.id}</span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'email',
      header: 'Contact Details',
      cell: info => {
        const row = info.row.original;
        return (
          <div className="flex flex-col text-left text-xs gap-0.5">
            <span className="text-slate-650 dark:text-slate-350">{row.email}</span>
            <span className="text-slate-400 font-medium">{row.phone}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'department',
      header: 'Department / Role',
      cell: info => {
        const row = info.row.original;
        return (
          <div className="flex flex-col text-left text-xs gap-0.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{row.department}</span>
            <span className="text-slate-450">{row.designation}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'joiningDate',
      header: 'Joining Date',
      cell: info => <span className="text-xs font-semibold text-slate-500">{info.getValue() as string}</span>
    },
    {
      accessorKey: 'attendancePercentage',
      header: 'Attendance',
      cell: info => {
        const rate = info.getValue() as number;
        return (
          <div className="flex items-center gap-2">
            <div className="w-12 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${rate >= 90 ? 'bg-emerald-500' : rate >= 80 ? 'bg-amber-500' : 'bg-red-500'}`} 
                style={{ width: `${rate}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{rate}%</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => {
        const status = info.getValue() as string;
        return (
          <Badge variant={status === 'ACTIVE' ? 'success' : 'neutral'}>
            {status}
          </Badge>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: info => {
        const row = info.row.original;
        return (
          <div className="flex items-center gap-1.5 justify-end">
            <Link to={`/employees/${row.id}`}>
              <Button size="sm" variant="ghost" className="p-1.5 text-slate-500">
                <Eye className="w-4 h-4" />
              </Button>
            </Link>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => openEditDrawer(row)}
              className="p-1.5 text-slate-500 hover:text-violet-600"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => {
                if (confirm(`Are you sure you want to delete employee record for ${row.name}?`)) {
                  deleteMutation.mutate(row.id);
                }
              }}
              className="p-1.5 text-slate-500 hover:text-red-650"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      }
    }
  ], [dispatch]);

  const table = useReactTable({
    data: employeeData,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="space-y-6">
      {/* Directory Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100">
            Workforce Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Search, filter, edit, or import organizational employee rosters.
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex flex-wrap items-center gap-2">
          {/* CSV File Input */}
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              id="csv-import-file"
              className="hidden"
            />
            <label
              htmlFor="csv-import-file"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium border border-slate-350 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer transition-all"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Import CSV</span>
            </label>
          </div>

          <Button 
            onClick={handleXLSXExport} 
            variant="outline"
            className="gap-2 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Roster</span>
          </Button>

          <Button 
            onClick={openAddDrawer}
            className="gap-2 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee</span>
          </Button>
        </div>
      </div>

      {/* Filters card */}
      <div className="glassmorphism p-4 rounded-xl flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-1/3">
          <div className="relative">
            <Input
              placeholder="Search name, email, role..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="w-full md:w-1/4">
          <Select
            options={[
              { value: 'All', label: 'All Departments' },
              { value: 'Executive', label: 'Executive' },
              { value: 'Human Resources', label: 'Human Resources' },
              { value: 'Engineering', label: 'Engineering' },
              { value: 'Marketing', label: 'Marketing' },
              { value: 'Finance', label: 'Finance' },
              { value: 'Sales', label: 'Sales' }
            ]}
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="w-full md:w-1/4">
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active Only' },
              { value: 'INACTIVE', label: 'Inactive Only' }
            ]}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <Button 
          variant="secondary"
          onClick={() => {
            setSearch('');
            setDepartment('');
            setStatus('');
            setPage(1);
          }}
          className="w-full md:w-auto shrink-0"
        >
          Reset Filters
        </Button>
      </div>

      {/* Database Roster Table */}
      {isLoading ? (
        <Loader message="Fetching roster records..." />
      ) : isError ? (
        <ErrorState onRetry={refetch} message="Failed to connect to employee API directory." />
      ) : employeeData.length === 0 ? (
        <div className="glassmorphism rounded-xl">
          <div className="p-8 text-center text-slate-400">No employees match the selected filters.</div>
        </div>
      ) : (
        <div className="glassmorphism rounded-xl overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse text-left">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/40 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4.5 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="px-6 py-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.totalCount)} of {pagination.totalCount} employees
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-semibold px-2">Page {page} of {pagination.totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                className="p-1.5"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT DRAWER --- */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingEmployee ? `Modify Profile: ${editingEmployee.name}` : "Create New Employee Profile"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Corporate Email"
            type="email"
            placeholder="john.doe@company.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Phone Number"
            placeholder="+1 (555) 123-4567"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Select
            label="Department"
            options={[
              { value: 'Human Resources', label: 'Human Resources' },
              { value: 'Engineering', label: 'Engineering' },
              { value: 'Marketing', label: 'Marketing' },
              { value: 'Finance', label: 'Finance' },
              { value: 'Sales', label: 'Sales' }
            ]}
            error={errors.department?.message}
            placeholder="Select Department"
            {...register('department')}
          />

          <Input
            label="Job Designation"
            placeholder="Senior Software Engineer"
            error={errors.designation?.message}
            {...register('designation')}
          />

          <Input
            label="Annual Gross Salary ($)"
            type="number"
            placeholder="75000"
            error={errors.salary?.message}
            {...register('salary')}
          />

          <Input
            label="Joining Date"
            type="date"
            error={errors.joiningDate?.message}
            {...register('joiningDate')}
          />

          <Select
            label="Account Status"
            options={[
              { value: 'ACTIVE', label: 'Active Employee' },
              { value: 'INACTIVE', label: 'Inactive / On Notice' }
            ]}
            error={errors.status?.message}
            {...register('status')}
          />

          <div className="flex gap-2.5 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDrawerOpen(false)}
              className="w-1/2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={addMutation.isPending || editMutation.isPending}
              className="w-1/2"
            >
              Save Details
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
export default Employees;
