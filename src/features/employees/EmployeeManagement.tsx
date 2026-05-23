import React, { useState } from 'react';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '../../hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Resolver } from 'react-hook-form';
import { FormInput, FormSelect } from '../../components/forms';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Search, Plus, Edit2, Trash2, User } from 'lucide-react';
import type { Employee } from '../../types';
import { DEPARTMENTS, DESIGNATIONS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  salary: z.number().positive('Salary must be positive'),
  joiningDate: z.string().min(1, 'Joining date is required'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

const EmployeeManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);

  const { data: employeesData, isLoading } = useEmployees({
    search,
    department: department || undefined,
    page,
    limit: 10,
  });

  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee(selectedEmployee?.id || '');
  const deleteEmployeeMutation = useDeleteEmployee();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema) as Resolver<EmployeeFormData>,
    defaultValues: selectedEmployee || {},
  });

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      if (selectedEmployee) {
        await updateEmployeeMutation.mutateAsync(data);
      } else {
        await createEmployeeMutation.mutateAsync(data);
      }
      setIsModalOpen(false);
      reset();
      setSelectedEmployee(null);
    } catch (error: any) {
      console.error('Form submission error:', error);
    }
  };

  const handleEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (selectedEmployee?.id) {
      await deleteEmployeeMutation.mutateAsync(selectedEmployee.id);
      setIsDeleteConfirm(false);
      setSelectedEmployee(null);
    }
  };

  const handleAddNew = () => {
    setSelectedEmployee(null);
    reset();
    setIsModalOpen(true);
  };

  const employees = employeesData?.data || [];
  const pagination = employeesData?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Employee Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage all employees and their information</p>
        </div>
        <Button variant="primary" size="lg" leftIcon={<Plus className="w-5 h-5" />} onClick={handleAddNew}>
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <div className="text-sm text-slate-600 dark:text-slate-400 py-2">
            {pagination && (
              <p>
                Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, pagination.totalCount)} of {pagination.totalCount}{' '}
                employees
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading employees...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
          <User className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No employees found</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Add your first employee to get started</p>
          <Button variant="primary" onClick={handleAddNew}>
            Add Employee
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Department</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Designation</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Joining Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {employees.map((emp: Employee) => (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">{emp.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{emp.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{emp.department}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{emp.designation}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{formatDate(emp.joiningDate)}</td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(emp)}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setIsDeleteConfirm(true);
                        }}
                        className="text-red-600 dark:text-red-400 hover:underline"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEmployee(null);
          reset();
        }}
        title={selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            label="Full Name"
            placeholder="John Doe"
            {...register('name')}
            error={errors.name}
          />

          <FormInput
            label="Email"
            type="email"
            placeholder="john@example.com"
            {...register('email')}
            error={errors.email}
          />

          <FormInput label="Phone" placeholder="+91-9000000000" {...register('phone')} />

          <FormSelect
            label="Department"
            options={DEPARTMENTS.map((d) => ({ label: d, value: d }))}
            {...register('department')}
            error={errors.department}
          />

          <FormSelect
            label="Designation"
            options={DESIGNATIONS.map((d) => ({ label: d, value: d }))}
            {...register('designation')}
            error={errors.designation}
          />

          <FormInput
            label="Salary"
            type="number"
            placeholder="50000"
            {...register('salary')}
            error={errors.salary}
          />

          <FormInput label="Joining Date" type="date" {...register('joiningDate')} error={errors.joiningDate} />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
            >
              {selectedEmployee ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={isDeleteConfirm}
        onClose={() => setIsDeleteConfirm(false)}
        title="Delete Employee"
      >
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Are you sure you want to delete {selectedEmployee?.name}? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            isLoading={deleteEmployeeMutation.isPending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeManagement;
