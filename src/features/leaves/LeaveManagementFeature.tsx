import React, { useState } from 'react';
import { useLeaves, useLeaveBalance, useApplyLeave, useApproveLeave, useRejectLeave } from '../../hooks';
import { useAppSelector } from '../../app/store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput, FormSelect, FormTextArea } from '../../components/forms';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Calendar, Plus, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const leaveSchema = z.object({
  type: z.enum(['SICK', 'CASUAL', 'ANNUAL']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

type LeaveFormData = z.infer<typeof leaveSchema>;

const LeaveManagementFeature: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const { user } = useAppSelector((state) => state.auth);
  const employeeId = user?.id || 'emp-emp';

  const { data: leavesData, isLoading } = useLeaves({
    employeeId,
    status: filterStatus || undefined,
  });

  const { data: leaveBalance } = useLeaveBalance(employeeId);
  const applyLeaveMutation = useApplyLeave();
  const approveLeaveMutation = useApproveLeave();
  const rejectLeaveMutation = useRejectLeave();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
  });

  const onSubmit = async (data: LeaveFormData) => {
    try {
      await applyLeaveMutation.mutateAsync({
        employeeId,
        ...data,
      });
      setIsModalOpen(false);
      reset();
    } catch (error) {
      console.error('Leave submission error:', error);
    }
  };

  const handleApprove = async (leaveId: string) => {
    await approveLeaveMutation.mutateAsync(leaveId);
  };

  const handleReject = async (leaveId: string) => {
    await rejectLeaveMutation.mutateAsync({
      id: leaveId,
      reason: 'Operational requirements',
    });
  };

  const leaves = leavesData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Leave Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Request and manage your leave</p>
        </div>
        {user?.role === 'EMPLOYEE' && (
          <Button variant="primary" size="lg" leftIcon={<Plus className="w-5 h-5" />} onClick={() => setIsModalOpen(true)}>
            Apply Leave
          </Button>
        )}
      </div>

      {/* Leave Balance */}
      {leaveBalance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
            <p className="text-sm opacity-90 mb-2">Annual Leave</p>
            <p className="text-3xl font-bold">{leaveBalance.annual}</p>
            <p className="text-xs opacity-75 mt-2">Days remaining</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl p-6">
            <p className="text-sm opacity-90 mb-2">Casual Leave</p>
            <p className="text-3xl font-bold">{leaveBalance.casual}</p>
            <p className="text-xs opacity-75 mt-2">Days remaining</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6">
            <p className="text-sm opacity-90 mb-2">Sick Leave</p>
            <p className="text-3xl font-bold">{leaveBalance.sick}</p>
            <p className="text-xs opacity-75 mt-2">Days remaining</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Leave Requests */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading leave requests...</p>
          </div>
        ) : leaves.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">No leave requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Duration</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Reason</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Status</th>
                  {(user?.role === 'ADMIN' || user?.role === 'HR_MANAGER') && (
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {leaves.map((leave: any) => (
                  <tr key={leave.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">{leave.type}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{leave.reason}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          leave.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : leave.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    {(user?.role === 'ADMIN' || user?.role === 'HR_MANAGER') && leave.status === 'PENDING' && (
                      <td className="px-6 py-4 text-sm space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<CheckCircle className="w-4 h-4" />}
                          onClick={() => handleApprove(leave.id)}
                          isLoading={approveLeaveMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          leftIcon={<XCircle className="w-4 h-4" />}
                          onClick={() => handleReject(leave.id)}
                          isLoading={rejectLeaveMutation.isPending}
                        >
                          Reject
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        title="Apply for Leave"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormSelect
            label="Leave Type"
            options={[
              { label: 'Annual Leave', value: 'ANNUAL' },
              { label: 'Sick Leave', value: 'SICK' },
              { label: 'Casual Leave', value: 'CASUAL' },
            ]}
            {...register('type')}
            error={errors.type}
          />

          <FormInput label="Start Date" type="date" {...register('startDate')} error={errors.startDate} />

          <FormInput label="End Date" type="date" {...register('endDate')} error={errors.endDate} />

          <FormTextArea
            label="Reason"
            placeholder="Explain the reason for your leave"
            {...register('reason')}
            error={errors.reason}
          />

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
            <Button variant="primary" type="submit" isLoading={applyLeaveMutation.isPending}>
              Apply
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaveManagementFeature;
