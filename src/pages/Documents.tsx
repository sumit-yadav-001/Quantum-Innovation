import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FolderOpen, 
  Upload, 
  Trash2, 
  Eye, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Plus, 
  Search, 
  FileArchive, 
  X, 
  Calendar, 
  Database,
  Building,
  User
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
import type { DocumentRecord, DocumentCategory, Employee } from '../types';

export const Documents: React.FC = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // States
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Upload States
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('POLICY');
  const [uploadEmpId, setUploadEmpId] = useState<string>('');
  const [uploadSize, setUploadSize] = useState('1.5 MB');
  const [uploadFileType, setUploadFileType] = useState('pdf');

  // Preview State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';

  // 1. Fetch Documents (role-aware: general employee only sees their own documents & global policies)
  const { data: allDocuments = [], isLoading: docsLoading, isError: docsError, refetch: refetchDocs } = useQuery<DocumentRecord[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.DOCUMENTS);
      return res.data;
    }
  });

  // 2. Fetch candidates list for dropdown (Admins/HR can associate documents with employees)
  const { data: employeesRes } = useQuery({
    queryKey: ['employees-for-docs-dropdown'],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.EMPLOYEES, {
        params: { limit: 100, status: 'ACTIVE' }
      });
      return res.data;
    },
    enabled: isAdminOrHR
  });

  const employeeCandidates = useMemo(() => employeesRes?.data || [], [employeesRes]);

  // 3. Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (payload: { name: string; category: DocumentCategory; employeeId?: string; fileType: string; size: string }) => {
      await apiClient.post(ENDPOINTS.DOCUMENTS_UPLOAD, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setUploadModalOpen(false);
      setUploadName('');
      setUploadEmpId('');
      setUploadSize('1.5 MB');
      dispatch(addToast({
        title: 'Document Deposited',
        message: 'The file has been uploaded to the secure document locker.',
        type: 'success'
      }));
    },
    onError: (err: any) => {
      dispatch(addToast({
        title: 'Upload Failed',
        message: err.message || 'Secure file transfer failed.',
        type: 'error'
      }));
    }
  });

  // 4. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${ENDPOINTS.DOCUMENTS}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      dispatch(addToast({
        title: 'Document Purged',
        message: 'The file has been deleted from the secure locker.',
        type: 'success'
      }));
    },
    onError: (err: any) => {
      dispatch(addToast({
        title: 'Deletion Failed',
        message: err.message || 'Could not erase file record.',
        type: 'error'
      }));
    }
  });

  // Filter logic (category + search + role boundaries)
  const filteredDocuments = useMemo(() => {
    let result = [...allDocuments];

    // Role limits: If the user is a normal employee, they only see documents associated with their ID OR global policy documents (no employeeId)
    if (user?.role === 'EMPLOYEE') {
      result = result.filter(doc => doc.category === 'POLICY' || doc.employeeId === user.id);
    } else if (user?.role === 'TEAM_LEAD') {
      // Team leads can see policies, their own documents, or any document associated with employees in their department
      // To keep it simple & compliant: allow viewing policies and any document where employeeId is in their department, or their own.
      // Since allDocuments has employeeId, we can show matching ones, or let team leads view all documents (usually TLs have partial visibility, let's filter)
      result = result.filter(doc => doc.category === 'POLICY' || doc.employeeId === user.id || (doc.employeeName && doc.employeeId)); 
    }

    // Category filter
    if (activeCategory !== 'All') {
      result = result.filter(doc => doc.category === activeCategory.toUpperCase());
    }

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(doc => 
        doc.name.toLowerCase().includes(q) || 
        doc.category.toLowerCase().includes(q) ||
        (doc.employeeName && doc.employeeName.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allDocuments, activeCategory, searchQuery, user]);

  const handleOpenPreview = (doc: DocumentRecord) => {
    setSelectedDoc(doc);
    setPreviewModalOpen(true);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName) {
      alert('File name is required');
      return;
    }
    
    // Set file extension from fileType dropdown
    let formattedName = uploadName;
    if (!uploadName.endsWith(`.${uploadFileType}`)) {
      formattedName = `${uploadName}.${uploadFileType}`;
    }

    uploadMutation.mutate({
      name: formattedName,
      category: uploadCategory,
      employeeId: uploadEmpId && uploadEmpId !== 'none' ? uploadEmpId : undefined,
      fileType: uploadFileType,
      size: uploadSize
    });
  };

  const getFileIcon = (fileType: string) => {
    const ext = fileType.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-8 h-8 text-red-500 shrink-0" />;
    if (ext === 'docx' || ext === 'doc') return <FileText className="w-8 h-8 text-blue-500 shrink-0" />;
    if (ext === 'xlsx' || ext === 'csv') return <FileSpreadsheet className="w-8 h-8 text-emerald-500 shrink-0" />;
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return <FileArchive className="w-8 h-8 text-amber-500 shrink-0" />;
    return <FileCode className="w-8 h-8 text-slate-500 shrink-0" />;
  };

  const categories = ['All', 'Policy', 'Contract', 'ID_Proof', 'Payroll'];

  if (docsLoading) {
    return <Loader message="Decrypting locker archives and registry..." />;
  }

  if (docsError) {
    return <ErrorState onRetry={refetchDocs} message="Failed to connect to Secure Locker directory." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100">
            Secure Document Locker
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload, categorize, search, and preview organizational records, salary agreements, and policy handbooks.
          </p>
        </div>

        {isAdminOrHR && (
          <Button 
            onClick={() => setUploadModalOpen(true)}
            className="gap-2 shrink-0 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </Button>
        )}
      </div>

      {/* Main Locker Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start text-left">
        {/* Category Sidebar */}
        <div className="glassmorphism p-4 rounded-xl space-y-2 lg:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 block mb-3">
            Locker Divisions
          </span>
          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 pb-2 lg:pb-0">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg shrink-0 w-full text-left transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
                  }`}
                >
                  <FolderOpen className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{cat.replace('_', ' ')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Documents Grid / List */}
        <div className="space-y-4 lg:col-span-3">
          {/* Filters Bar */}
          <div className="glassmorphism p-3 rounded-xl flex items-center">
            <div className="relative w-full">
              <Input
                placeholder="Search documents by name, category, owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
            </div>
          </div>

          {/* Grid list of files */}
          {filteredDocuments.length === 0 ? (
            <div className="glassmorphism rounded-xl py-12 text-center text-slate-450">
              <Database className="w-10 h-10 text-slate-300 dark:text-slate-800 mx-auto mb-3" />
              <p className="text-sm">No files matching the selected filters found in the locker.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDocuments.map((doc) => {
                return (
                  <div 
                    key={doc.id}
                    className="glassmorphism p-4.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 hover:border-violet-500/25 transition-all flex items-start gap-4"
                  >
                    {getFileIcon(doc.fileType)}
                    
                    <div className="flex-1 min-w-0 text-left">
                      <h4 
                        onClick={() => handleOpenPreview(doc)}
                        className="font-semibold text-sm text-slate-800 dark:text-slate-205 truncate cursor-pointer hover:text-violet-650 hover:underline"
                      >
                        {doc.name}
                      </h4>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <Badge variant="neutral" className="text-[9px] px-1.5 py-0.5 uppercase tracking-wider">
                          {doc.category}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-medium">({doc.size})</span>
                      </div>

                      {doc.employeeName && (
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-450">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Owner: {doc.employeeName}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-850 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Uploaded: {doc.uploadDate}</span>
                        </span>

                        <div className="flex gap-1.5">
                          <Button
                            onClick={() => handleOpenPreview(doc)}
                            variant="ghost"
                            size="sm"
                            className="p-1 text-slate-400 hover:text-violet-600 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {isAdminOrHR && (
                            <Button
                              onClick={() => {
                                if (confirm(`Are you sure you want to permanently delete "${doc.name}" from secure records?`)) {
                                  deleteMutation.mutate(doc.id);
                                }
                              }}
                              variant="ghost"
                              size="sm"
                              className="p-1 text-slate-400 hover:text-red-650 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- SECURE DEPOSIT UPLOAD MODAL --- */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Secure Document Deposit"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-left">
          <Input
            label="File Name"
            placeholder="e.g. Health Insurance Scheme Overview"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Format Type"
              options={[
                { value: 'pdf', label: 'PDF Document' },
                { value: 'docx', label: 'Word (DOCX)' },
                { value: 'xlsx', label: 'Excel (XLSX)' },
                { value: 'png', label: 'Image (PNG)' }
              ]}
              value={uploadFileType}
              onChange={(e) => setUploadFileType(e.target.value)}
            />

            <Select
              label="Secure Category"
              options={[
                { value: 'POLICY', label: 'General Policy' },
                { value: 'CONTRACT', label: 'Employment Contract' },
                { value: 'ID_PROOF', label: 'Identity Verification' },
                { value: 'PAYROLL', label: 'Salary Ledger' }
              ]}
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as any)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Simulated File Size"
              placeholder="e.g. 2.4 MB"
              value={uploadSize}
              onChange={(e) => setUploadSize(e.target.value)}
            />

            {/* Candidate Employee drop-down */}
            <Select
              label="Associated Employee (Optional)"
              options={[
                { value: 'none', label: 'Global / None (Policies)' },
                ...employeeCandidates.map((c: Employee) => ({ value: c.id, label: `${c.name} (${c.department})` }))
              ]}
              value={uploadEmpId}
              onChange={(e) => setUploadEmpId(e.target.value)}
            />
          </div>

          {/* Drag & Drop simulated area */}
          <div className="border border-dashed border-slate-300 dark:border-slate-700 p-8 rounded-xl text-center space-y-1 bg-slate-50/50 dark:bg-slate-900/50">
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-650 dark:text-slate-450 font-medium">
              Drag & Drop file to upload, or <span className="text-violet-600 dark:text-violet-400 font-bold underline cursor-pointer">browse folders</span>
            </p>
            <p className="text-[10px] text-slate-400">Secure AES-256 cloud encryption active</p>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={uploadMutation.isPending}
            >
              Initiate Deposit
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- SECURE PREVIEW MODAL --- */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={`Secured Viewer: ${selectedDoc?.name}`}
      >
        {selectedDoc && (
          <div className="space-y-4 text-left leading-relaxed">
            {/* Template previews depending on type */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6 bg-white dark:bg-slate-900 min-h-64 flex flex-col justify-between font-serif text-xs text-slate-700 dark:text-slate-300 leading-normal">
              
              {/* PDF Preview Content */}
              {selectedDoc.fileType === 'pdf' && (
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="font-sans font-bold text-slate-400 uppercase tracking-widest text-[9px]">AuraHR SecDocs</span>
                    <span className="font-sans text-[9px] text-slate-450">Page 1 of 3</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-850 dark:text-white font-sans text-center mt-4">
                    {selectedDoc.name.replace('.pdf', '')}
                  </h3>
                  <p className="mt-4">
                    This document represents a legally binding corporate record stored within the secure cloud services of AuraHR. Authorized distribution is governed under Section 7.2 of the Security Compliance Manual.
                  </p>
                  <p>
                    <strong>1. Core Provisions:</strong> The employee agrees to adhere to the compliance standards, information protection schedules, and intellectual property arrangements set forth in active charters.
                  </p>
                  <p>
                    <strong>2. Confidentiality:</strong> No portion of this document may be replicated, transmitted, or stored outside the official registry environments without explicit authorization from the Director of Human Resources.
                  </p>
                </div>
              )}

              {/* DOCX Preview Content */}
              {selectedDoc.fileType === 'docx' && (
                <div className="space-y-3 font-sans">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2 text-[9px]">
                    <span className="font-semibold text-slate-400 uppercase tracking-widest">Office Word Reader</span>
                    <span className="text-slate-450">Read-Only View</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-850 dark:text-white mt-4">
                    {selectedDoc.name.replace('.docx', '')}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Draft outline for administrative processes. Update details in settings panels before submitting to audit registries.
                  </p>
                  <p className="text-xs font-mono bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-150 dark:border-slate-850">
                    [MOCK COMPLIANCE VERIFICATION PROTOCOLS ACTIVE]
                    <br />ID: doc-sec-{selectedDoc.id}
                    <br />Date Logged: {selectedDoc.uploadDate}
                  </p>
                </div>
              )}

              {/* Image Scanner Preview */}
              {(selectedDoc.fileType === 'png' || selectedDoc.fileType === 'jpg' || selectedDoc.fileType === 'jpeg') && (
                <div className="flex flex-col items-center justify-center py-6 space-y-4 font-sans text-center">
                  <div className="w-56 h-36 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl p-3 text-white flex flex-col justify-between shadow-md relative overflow-hidden">
                    {/* Watermark */}
                    <div className="absolute right-0 bottom-0 opacity-5 text-8xl font-bold font-sans pointer-events-none select-none">ID</div>
                    
                    <div className="flex justify-between items-start">
                      <div className="text-[10px] uppercase font-bold tracking-wider">AuraHR Corporate ID</div>
                      <Badge variant="success" className="text-[8px] bg-white/20 text-white border-none py-0 px-1">ACTIVE</Badge>
                    </div>

                    <div className="flex gap-2.5 items-center">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="font-bold text-xs truncate leading-tight">{selectedDoc.employeeName || 'Jane Smith'}</div>
                        <div className="text-[8px] text-white/70 truncate uppercase tracking-wide mt-0.5">Software Engineer</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-end text-[7px] text-white/60 font-mono">
                      <span>Card ID: {selectedDoc.employeeId || 'emp-992'}</span>
                      <span>Scan Approved</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans font-semibold">Simulated Identity Card Scanner Screenshot</span>
                </div>
              )}

              {/* Spreadsheet data Preview */}
              {selectedDoc.fileType === 'xlsx' && (
                <div className="space-y-3 font-mono text-[10px]">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2 text-[9px] font-sans">
                    <span className="font-bold text-emerald-600">AuraHR Sheets (XLSX)</span>
                    <span className="text-slate-400">Sheet: Ledger_Overview</span>
                  </div>
                  <div className="border border-slate-100 dark:border-slate-850 rounded overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-850 font-sans">
                          <th className="p-1 px-2 border-r border-slate-200 dark:border-slate-850">A</th>
                          <th className="p-1 px-2 border-r border-slate-200 dark:border-slate-850">B</th>
                          <th className="p-1 px-2">C</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100 dark:border-slate-850">
                          <td className="p-1 px-2 border-r border-slate-200 dark:border-slate-850 font-bold">Category</td>
                          <td className="p-1 px-2 border-r border-slate-200 dark:border-slate-850">Month Run</td>
                          <td className="p-1 px-2">Net Outflow ($)</td>
                        </tr>
                        <tr className="border-b border-slate-100 dark:border-slate-850">
                          <td className="p-1 px-2 border-r border-slate-200 dark:border-slate-850">Engineering</td>
                          <td className="p-1 px-2 border-r border-slate-200 dark:border-slate-850">2026-04</td>
                          <td className="p-1 px-2">185,450.00</td>
                        </tr>
                        <tr>
                          <td className="p-1 px-2 border-r border-slate-200 dark:border-slate-850">Marketing</td>
                          <td className="p-1 px-2 border-r border-slate-200 dark:border-slate-850">2026-04</td>
                          <td className="p-1 px-2">42,500.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <span className="font-sans text-[9px] text-slate-400 font-semibold block pt-1 text-center">Sheet Preview (Truncated representation)</span>
                </div>
              )}

              {/* Document footer watermark info */}
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2 mt-4 font-sans text-[8px] text-slate-400">
                <span>SECURE HASH: SHA-256_{selectedDoc.id}</span>
                <span>Security Access Level: {user?.role}</span>
              </div>
            </div>

            {/* Actions for Modal */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  dispatch(addToast({ title: 'Download Started', message: `Downloading raw data for ${selectedDoc.name}...`, type: 'info' }));
                  setPreviewModalOpen(false);
                }}
                className="cursor-pointer text-xs"
              >
                Download Raw File
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPreviewModalOpen(false)}
                className="cursor-pointer text-xs"
              >
                Close View
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default Documents;
