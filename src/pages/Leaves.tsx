import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CalendarDays, 
  Plus, 
  Check, 
  X
} from 'lucide-react';
import apiClient from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import { useAppSelector, useAppDispatch } from '../app/store';
import { addToast } from '../app/store/notificationSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Loader } from '../components/ui/Loader';
import { Modal } from '../components/ui/Modal';
import { safeArray } from '../utils/helpers';
import type { LeaveRequest, LeaveBalance } from '../types';

export const Leaves: React.FC = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);


  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectReasonModalOpen, setRejectReasonModalOpen] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [activeQueueTab, setActiveQueueTab] = useState<'my' | 'approvals'>('my');


  const [leaveType, setLeaveType] = useState<'SICK' | 'CASUAL' | 'ANNUAL'>('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER' || user?.role === 'TEAM_LEAD';


  const { data: allLeaves = [], isLoading: allLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['leaves'],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.LEAVES);
      return safeArray<LeaveRequest>(res.data);
    }
  });


  const { data: myLeaves = [], isLoading: myLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['leaves', { employeeId: user?.id }],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.LEAVES, { params: { employeeId: user?.id } });
      return safeArray<LeaveRequest>(res.data);
    },
    enabled: !!user?.id
  });


  const { data: myBalance } = useQuery<LeaveBalance>({
    queryKey: ['leaveBalances', user?.id],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.LEAVE_BALANCES(user!.id));
      return res.data;
    },
    enabled: !!user?.id
  });


  const applyMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(ENDPOINTS.LEAVES, {
        employeeId: user?.id,
        type: leaveType,
        startDate,
        endDate,
        reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalances', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setApplyModalOpen(false);
      setReason('');
      setStartDate('');
      setEndDate('');
      dispatch(
        addToast({
          title: 'Leave Request Logged',
          message: 'Leave request submitted successfully.',
          type: 'success'
        })
      );
    },
    onError: (err: any) => {
      dispatch(addToast({ title: 'Application Rejected', message: err.message, type: 'error' }));
    }
  });


  const processMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: string; status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) => {
      await apiClient.patch(`${ENDPOINTS.LEAVES}/${id}`, { status, rejectionReason });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSelectedRequest(null);
      setRejectReasonModalOpen(false);
      setRejectionReasonText('');
      dispatch(
        addToast({
          title: `Request ${variables.status}`,
          message: `Leave request has been successfully ${variables.status.toLowerCase()}.`,
          type: variables.status === 'APPROVED' ? 'success' : 'info'
        })
      );
    },
    onError: (err: any) => {
      dispatch(addToast({ title: 'Action Failed', message: err.message, type: 'error' }));
    }
  });

  const handleApprove = (req: LeaveRequest) => {
    processMutation.mutate({ id: req.id, status: 'APPROVED' });
  };

  const triggerRejectFlow = (req: LeaveRequest) => {
    setSelectedRequest(req);
    setRejectReasonModalOpen(true);
  };

  const handleRejectSubmit = () => {
    if (!rejectionReasonText) {
      alert("Please provide a reason for rejecting the leave request.");
      return;
    }
    processMutation.mutate({ 
      id: selectedRequest!.id, 
      status: 'REJECTED', 
      rejectionReason: rejectionReasonText 
    });
  };

  const getBadgeColor = (status: string) => {
    if (status === 'APPROVED') return 'success';
    if (status === 'REJECTED') return 'danger';
    return 'warning';
  };

  if (allLoading || myLoading) {
    return <Loader message="Accessing leave balances and registry..." />;
  }


  const safeAllLeaves = Array.isArray(allLeaves) ? allLeaves : [];
  const safeMyLeaves = Array.isArray(myLeaves) ? myLeaves : [];


  const pendingApprovals = safeAllLeaves.filter(l => l.status === 'PENDING');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100">
            Leave Workflows
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Submit leave applications, track pending credits, and manage authorization queues.
          </p>
        </div>

        <Button 
          onClick={() => setApplyModalOpen(true)}
          className="gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </Button>
      </div>

      {myBalance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="glassmorphism p-5 rounded-xl border-l-4 border-violet-500 flex justify-between items-center">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Sick Leaves Available</span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-display mt-1 block">{myBalance.sick} Days</span>
            </div>
            <div className="p-3 bg-violet-50 dark:bg-violet-950/20 text-violet-600 rounded-lg">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>
          <div className="glassmorphism p-5 rounded-xl border-l-4 border-emerald-500 flex justify-between items-center">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Casual Leaves Available</span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-display mt-1 block">{myBalance.casual} Days</span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-lg">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>
          <div className="glassmorphism p-5 rounded-xl border-l-4 border-amber-500 flex justify-between items-center">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Annual Leaves Available</span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-display mt-1 block">{myBalance.annual} Days</span>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-lg">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {isAdminOrHR && (
        <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveQueueTab('my')}
            className={`pb-2 text-sm font-semibold border-b-2 px-1 transition-all cursor-pointer ${
              activeQueueTab === 'my' 
                ? 'border-violet-600 text-violet-650 dark:text-violet-400' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            My Requests ({safeMyLeaves.length})
          </button>
          <button
            onClick={() => setActiveQueueTab('approvals')}
            className={`pb-2 text-sm font-semibold border-b-2 px-1 transition-all cursor-pointer ${
              activeQueueTab === 'approvals' 
                ? 'border-violet-600 text-violet-650 dark:text-violet-400' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Approvals Queue ({pendingApprovals.length})
          </button>
        </div>
      )}

      {(!isAdminOrHR || activeQueueTab === 'my') ? (
        
        <div className="glassmorphism rounded-xl overflow-hidden text-left">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">My Personal Leave History</span>
          </div>
          {safeMyLeaves.length === 0 ? (
            <div className="p-8 text-center text-slate-400">You haven't submitted any leave requests yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Leave Type</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Start Date</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">End Date</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Reason</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                  {safeMyLeaves.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/30">
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-350">{l.type}</td>
                      <td className="px-6 py-4">{l.startDate}</td>
                      <td className="px-6 py-4">{l.endDate}</td>
                      <td className="px-6 py-4 text-slate-650 dark:text-slate-450 max-w-sm truncate">{l.reason}</td>
                      <td className="px-6 py-4">
                        <Badge variant={getBadgeColor(l.status)}>
                          {l.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="glassmorphism rounded-xl overflow-hidden text-left">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Incoming Leave Requests (Pending Queue)</span>
          </div>
          {pendingApprovals.length === 0 ? (
            <div className="p-8 text-center text-slate-400">All leave requests have been processed. Clean slate!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Reason</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-550 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                  {pendingApprovals.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/30">
                      <td className="px-6 py-4 font-semibold text-slate-850 dark:text-slate-200">{l.employeeName}</td>
                      <td className="px-6 py-4">{l.type}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {l.startDate} to {l.endDate}
                      </td>
                      <td className="px-6 py-4 text-slate-650 dark:text-slate-450 max-w-xs truncate">{l.reason}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            onClick={() => handleApprove(l)}
                            variant="secondary"
                            size="sm"
                            className="p-1 hover:bg-emerald-500 hover:text-white cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => triggerRejectFlow(l)}
                            variant="secondary"
                            size="sm"
                            className="p-1 hover:bg-red-500 hover:text-white cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title="Apply for Leave"
      >
        <div className="space-y-4">
          <Select
            label="Leave Type"
            options={[
              { value: 'CASUAL', label: 'Casual Leave' },
              { value: 'SICK', label: 'Sick Leave' },
              { value: 'ANNUAL', label: 'Annual Paid Leave' }
            ]}
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as any)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Reason for request
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-800 dark:text-slate-100 placeholder-slate-400"
              placeholder="Explain context for approval..."
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              onClick={() => setApplyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => applyMutation.mutate()}
              isLoading={applyMutation.isPending}
            >
              Submit Application
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={rejectReasonModalOpen}
        onClose={() => setRejectReasonModalOpen(false)}
        title="Rejection Feedback"
      >
        <div className="space-y-4 text-left">
          <p className="text-sm text-slate-500">
            Please provide a brief explanation detailing why the request submitted by <strong>{selectedRequest?.employeeName}</strong> is rejected.
          </p>
          <Input
            label="Reason for Rejection"
            placeholder="e.g. Inadequate cover within engineering sprints this week"
            value={rejectionReasonText}
            onChange={(e) => setRejectionReasonText(e.target.value)}
          />
          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              onClick={() => setRejectReasonModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectSubmit}
              isLoading={processMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default Leaves;
