import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Network, 
  Plus, 
  Users, 
  DollarSign, 
  UserCheck, 
  FolderEdit, 
  AlertCircle
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
import { ErrorState } from '../components/ui/ErrorState';
import { Modal } from '../components/ui/Modal';
import type { Department, Employee } from '../types';

export const Departments: React.FC = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Modal / Drawer states
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  // Create form states
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Edit form states
  const [editBudget, setEditBudget] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editManagerId, setEditManagerId] = useState('');

  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';

  // 1. Fetch Departments
  const { data: departments = [], isLoading: deptsLoading, isError: deptsError, refetch: refetchDepts } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.DEPARTMENTS);
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw?.data ?? []);
    }
  });

  // 2. Fetch Candidates for Department Head (all active employees)
  const { data: employeesRes } = useQuery({
    queryKey: ['employees-all-candidates'],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.EMPLOYEES, {
        params: { limit: 100, status: 'ACTIVE' }
      });
      return res.data;
    }
  });

  const candidatesList = useMemo(() => employeesRes?.data || [], [employeesRes]);

  // 3. Create Department Mutation
  const createDeptMutation = useMutation({
    mutationFn: async (payload: Partial<Department>) => {
      await apiClient.post(ENDPOINTS.DEPARTMENTS, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setCreateModalOpen(false);
      setNewName('');
      setNewBudget('');
      setNewDesc('');
      dispatch(addToast({
        title: 'Department Created',
        message: 'The new department division has been initialized.',
        type: 'success'
      }));
    },
    onError: (err: any) => {
      dispatch(addToast({
        title: 'Initialization Failed',
        message: err.message || 'Could not instantiate new department.',
        type: 'error'
      }));
    }
  });

  // 4. Update Department Mutation (budget, manager, description)
  const updateDeptMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Department> }) => {
      await apiClient.put(`${ENDPOINTS.DEPARTMENTS}/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      // We also invalidate employees because employee designations/details might be linked or fetched
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setManageModalOpen(false);
      setSelectedDept(null);
      dispatch(addToast({
        title: 'Department Updated',
        message: 'Division configurations have been successfully updated.',
        type: 'success'
      }));
    },
    onError: (err: any) => {
      dispatch(addToast({
        title: 'Update Failed',
        message: err.message || 'Could not commit department changes.',
        type: 'error'
      }));
    }
  });

  const handleOpenManage = (dept: Department) => {
    setSelectedDept(dept);
    setEditBudget(String(dept.budget));
    setEditDesc(dept.description || '');
    setEditManagerId(dept.managerId || 'none');
    setManageModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) {
      alert('Department name is required');
      return;
    }
    createDeptMutation.mutate({
      name: newName,
      budget: Number(newBudget) || 100000,
      description: newDesc
    });
  };

  const handleManageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;

    let managerName: string | null = null;
    let managerId: string | null = null;

    if (editManagerId && editManagerId !== 'none') {
      const selectedManager = candidatesList.find((c: Employee) => c.id === editManagerId);
      if (selectedManager) {
        managerName = selectedManager.name;
        managerId = selectedManager.id;
      }
    }

    updateDeptMutation.mutate({
      id: selectedDept.id,
      payload: {
        budget: Number(editBudget) || 0,
        description: editDesc,
        managerId,
        managerName
      }
    });
  };

  if (deptsLoading) {
    return <Loader message="Accessing division records and allocations..." />;
  }

  if (deptsError) {
    return <ErrorState onRetry={refetchDepts} message="Failed to load departments configuration." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100">
            Departments Division
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track headcount distributions, division financial allotments, and promote organizational managers.
          </p>
        </div>

        {isAdminOrHR && (
          <Button 
            onClick={() => setCreateModalOpen(true)}
            className="gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Department</span>
          </Button>
        )}
      </div>

      {/* Grid of Departments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          return (
            <div 
              key={dept.id} 
              className="glassmorphism p-6 rounded-xl flex flex-col justify-between text-left hover:border-violet-500/30 transition-all shadow-sm group"
            >
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950/20 text-violet-600 flex items-center justify-center">
                      <Network className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-850 dark:text-white leading-tight">
                        {dept.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium">Div ID: {dept.id}</span>
                    </div>
                  </div>
                  
                  <Badge variant="info" className="flex items-center gap-1 shrink-0">
                    <Users className="w-3 h-3" />
                    <span>{dept.employeeCount} Members</span>
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed min-h-12 line-clamp-3">
                  {dept.description || 'No division description available at this time.'}
                </p>

                <hr className="border-slate-100 dark:border-slate-850" />

                {/* Info Fields */}
                <div className="space-y-2.5 text-xs">
                  {/* Budget Allocation */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <DollarSign className="w-4.5 h-4.5" />
                      <span>Annual Budget</span>
                    </div>
                    <span className="font-bold text-slate-750 dark:text-slate-205">
                      ${dept.budget.toLocaleString()}
                    </span>
                  </div>

                  {/* Department Manager */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <UserCheck className="w-4.5 h-4.5" />
                      <span>Division Head</span>
                    </div>
                    {dept.managerName ? (
                      <span className="font-semibold text-violet-650 dark:text-violet-400">
                        {dept.managerName}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/10">
                        <AlertCircle className="w-3 h-3" />
                        <span>Unassigned</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {isAdminOrHR && (
                <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-850">
                  <Button
                    onClick={() => handleOpenManage(dept)}
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 cursor-pointer text-xs group-hover:bg-violet-600 group-hover:text-white transition-all duration-200"
                  >
                    <FolderEdit className="w-3.5 h-3.5" />
                    <span>Configure Division</span>
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- CREATE DEPARTMENT MODAL --- */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Initialize New Department Division"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-left">
          <Input
            label="Department Name"
            placeholder="e.g. Product Design"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />

          <Input
            label="Annual Budget Allocation ($)"
            type="number"
            placeholder="e.g. 750000"
            value={newBudget}
            onChange={(e) => setNewBudget(e.target.value)}
          />

          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Division Description
            </label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-800 dark:text-slate-100 placeholder-slate-400"
              placeholder="Detail the scope of responsibilities for this division..."
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createDeptMutation.isPending}
            >
              Instantiate Division
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- EDIT / MANAGE DEPARTMENT MODAL --- */}
      <Modal
        isOpen={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        title={`Configure Division: ${selectedDept?.name}`}
      >
        <form onSubmit={handleManageSubmit} className="space-y-4 text-left">
          <Input
            label="Annual Budget Allocation ($)"
            type="number"
            value={editBudget}
            onChange={(e) => setEditBudget(e.target.value)}
            required
          />

          <Select
            label="Division Manager / Head"
            options={[
              { value: 'none', label: 'Unassigned / Vacant' },
              ...candidatesList
                .filter((c: Employee) => c.department === selectedDept?.name) // ideally same department
                .map((c: Employee) => ({ value: c.id, label: `${c.name} (${c.designation})` })),
              // fallback to show other candidates as well in a separate section if needed
              ...candidatesList
                .filter((c: Employee) => c.department !== selectedDept?.name)
                .map((c: Employee) => ({ value: c.id, label: `${c.name} (Other - ${c.department})` }))
            ]}
            value={editManagerId}
            onChange={(e) => setEditManagerId(e.target.value)}
          />

          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Division Description
            </label>
            <textarea
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setManageModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={updateDeptMutation.isPending}
            >
              Commit Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Departments;
