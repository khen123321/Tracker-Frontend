import React, { useState, useEffect, useCallback } from 'react';

import {
  Calendar,
  UserCheck, UserX, UserMinus, Clock,
  PieChart as PieIcon, BarChart2 as BarIcon,
  Loader2, Check, X, Paperclip,
  Building2, GitBranch, ClipboardList,
  RefreshCw,
  ChevronRight, Search, MapPin
} from 'lucide-react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import api from '../../api/axios';
import toast, { Toaster } from 'react-hot-toast';
import PageHeader from '../../components/layout/PageHeader';

// ─── TYPES ───────────────────────────────────────────────────
interface Department {
  name: string;
  count: number;
  total?: number;
  color?: string;
  present_count?: number;
  absent_count?: number;
}

interface Branch {
  name: string;
  count: number;
  isHQ?: boolean;
  sub?: string;
}

interface AttendanceToday {
  present: number;
  absent: number;
  excused: number;
  late: number;
}

interface PendingRequest {
  id: number;
  intern_name: string;
  date: string;
  hours?: number;
  reason: string;
}

interface RequestDetail {
  id: number;
  intern_name: string;
  type: string;
  date_of_absence: string;
  reason: string;
  additional_details?: string;
  attachment_path?: string;
  status: string;
  loading?: boolean;
}

interface DashStats {
  total_interns: number;
  attendance_rate: number;
  total_hours: number;
  on_time_percentage: number;
  today: AttendanceToday;
  course_distribution: { name: string; value: number }[];
  departments: Department[];
  branches: Branch[];
  pending_requests: {
    absent: PendingRequest[];
    halfDay: PendingRequest[];
    overtime: PendingRequest[];
  };
}

interface SchoolData {
  name: string;
  value: number;
  shortName?: string;
}

// ─── CONSTANTS ───────────────────────────────────────────────
const COLORS = ['#0B1EAE', '#4F63F1', '#8A98E8', '#C2CBF5', '#64748B', '#94A3B8'];

const getSchoolAbbreviation = (schoolName: string): string => {
  if (!schoolName) return '';
  const overrides: Record<string, string> = {
    'University of Science and Technology of Southern Philippines': 'USTP',
    'Xavier University': 'XU',
    'Xavier University - Ateneo de Cagayan': 'XU',
    'Capitol University': 'CU',
    'Liceo de Cagayan University': 'LDCU',
    'Mindanao State University': 'MSU',
  };
  if (overrides[schoolName]) return overrides[schoolName];
  const stopWords = ['of', 'and', 'the', 'in', 'at', 'de'];
  const words = schoolName.split(/[\s-]+/);
  let acronym = '';
  words.forEach(word => {
    if (!stopWords.includes(word.toLowerCase()) && word.length > 0)
      acronym += word[0].toUpperCase();
  });
  return acronym.length >= 2 ? acronym : schoolName;
};

// ─── SKELETON ────────────────────────────────────────────────
function Sk({ w = '100%', h = 16, r = 6, mb = 0 }: { w?: string | number; h?: number; r?: number; mb?: number }) {
  return (
    <div
      className="block bg-gradient-to-r from-[#e8ecf2] via-[#f4f6fa] to-[#e8ecf2] bg-[length:700px_100%]"
      style={{
        width: w,
        height: h,
        borderRadius: r,
        marginBottom: mb,
        flexShrink: 0,
        animation: 'shimmer 1.5s infinite linear',
        backgroundSize: '700px 100%',
      }}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-3 bg-[#f8fafc] min-h-screen font-[Inter,system-ui,-apple-system,sans-serif] text-[#0f172a] flex flex-col gap-[5px]">
      <div className="flex justify-between px-5 py-[14px] bg-white rounded-[10px] border border-[#e8eaf0] mb-[5px]">
        <Sk w={140} h={26} r={6} />
        <div className="flex gap-3">
          <Sk w={36} h={36} r={8} />
          <Sk w={210} h={36} r={999} />
        </div>
      </div>
      <div className="grid grid-cols-[2fr_1fr_1fr] gap-[5px]">
        <div className="bg-white rounded-[10px] p-4 border border-[#e2e8f0] flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <Sk w={130} h={14} r={4} mb={14} />
          <div className="flex justify-between items-end gap-[5px]">
            <Sk w={80} h={38} r={6} />
            <div className="flex-1 max-w-[55%]">
              <Sk w={130} h={11} r={4} mb={8} />
              <Sk w="100%" h={6} r={999} mb={6} />
              <Sk w={36} h={11} r={4} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[10px] p-4 border border-[#e2e8f0] flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <Sk w={110} h={14} r={4} mb={14} /><Sk w={80} h={38} r={6} />
        </div>
        <div className="bg-white rounded-[10px] p-4 border border-[#e2e8f0] flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <Sk w={90} h={14} r={4} mb={14} /><Sk w={80} h={38} r={6} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-[5px]">
        <div className="bg-white rounded-[10px] p-4 border border-[#e2e8f0] flex flex-col min-h-[300px]">
          <Sk w={130} h={15} r={4} mb={12} />
          <div className="flex justify-center items-center flex-1 py-4">
            <div
              className="w-[150px] h-[150px] rounded-full"
              style={{
                background: 'linear-gradient(90deg, #e8ecf2 25%, #f4f6fa 50%, #e8ecf2 75%)',
                backgroundSize: '700px 100%',
                WebkitMask: 'radial-gradient(transparent 45px, black 46px)',
                mask: 'radial-gradient(transparent 45px, black 46px)',
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-[5px] col-span-1">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex p-4 flex-col items-start rounded-[10px] bg-white border border-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.02)] h-[180px]">
              <Sk w={80} h={13} r={4} mb={14} /><Sk w={55} h={30} r={6} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function angleToSVGCoords(deg: number) {
  const rad = (deg * Math.PI) / 180;
  return {
    x1: (0.5 - Math.sin(rad) / 2).toFixed(4),
    y1: (0.5 + Math.cos(rad) / 2).toFixed(4),
    x2: (0.5 + Math.sin(rad) / 2).toFixed(4),
    y2: (0.5 - Math.cos(rad) / 2).toFixed(4),
  };
}

// ─── MODAL BASE ───────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  width?: string;
}

function Modal({ isOpen, onClose, title, icon: Icon, children, width = '680px' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[rgba(15,23,42,0.5)] backdrop-blur-[4px] z-[9000] flex items-center justify-center p-5"
      style={{ animation: 'modalOverlayIn 0.2s ease' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-h-[88vh] flex flex-col shadow-[0_25px_60px_-12px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden"
        style={{ maxWidth: width, animation: 'modalSlideIn 0.28s cubic-bezier(0.16,1,0.3,1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-[#f1f5f9] bg-white flex-shrink-0">
          <div className="flex items-center gap-[10px]">
            {Icon && (
              <div className="w-[34px] h-[34px] bg-[#eff6ff] rounded-lg flex items-center justify-center text-[#0B1EAE] flex-shrink-0">
                <Icon size={18} strokeWidth={2} />
              </div>
            )}
            <h2 className="text-lg font-bold text-[#0f172a] m-0">{title}</h2>
          </div>
          <button
            className="w-8 h-8 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] cursor-pointer flex items-center justify-center transition-all duration-150 flex-shrink-0 hover:bg-[#f1f5f9] hover:text-[#0f172a] hover:border-[#cbd5e1]"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto flex flex-col gap-5 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#e2e8f0] [&::-webkit-scrollbar-thumb]:rounded">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── DEPARTMENT MODAL ─────────────────────────────────────────
function DepartmentModal({ isOpen, onClose, stats }: { isOpen: boolean; onClose: () => void; stats: DashStats }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'count' | 'name'>('count');
  const [loading, setLoading] = useState(false);
  const [deptDetails, setDeptDetails] = useState<Department[] | null>(null);

  useEffect(() => {
    if (!isOpen) { setSearch(''); setDeptDetails(null); return; }
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get('/hr/dashboard-stats');
        if (res.data?.departments) setDeptDetails(res.data.departments);
      } catch { /* fall back to props data */ }
      finally { setLoading(false); }
    };
    fetchDetails();
  }, [isOpen]);

  const departments = deptDetails || stats.departments || [];
  const maxCount = Math.max(...departments.map(d => d.count || 0), 1);
  const totalInterns = departments.reduce((sum, d) => sum + (d.count || 0), 0);

  const filtered = departments
    .filter(d => d.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'count' ? (b.count || 0) - (a.count || 0) : a.name?.localeCompare(b.name));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="All Departments" icon={Building2} width="720px">
      {/* Stats Summary */}
      <div className="flex items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-5 py-4 flex-wrap gap-0">
        {[
          { value: departments.length, label: 'Departments' },
          { value: totalInterns, label: 'Total Interns' },
          { value: departments.length > 0 ? Math.round(totalInterns / departments.length) : 0, label: 'Avg per Dept' },
        ].map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className="w-px h-9 bg-[#e2e8f0] mx-2 flex-shrink-0" />}
            <div className="flex flex-col items-center gap-1 flex-1 min-w-[80px]">
              <span className="text-[28px] font-extrabold text-[#0B1EAE] leading-none">{item.value}</span>
              <span className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-[0.5px] whitespace-nowrap">{item.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 h-[38px] transition-colors focus-within:border-[#0B1EAE] focus-within:bg-white">
          <Search size={14} className="text-[#94a3b8] flex-shrink-0" />
          <input
            className="flex-1 border-none bg-transparent text-[13px] text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
            placeholder="Search departments…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-[#f1f5f9] rounded-lg p-[3px] gap-[2px] flex-shrink-0">
          {(['count', 'name'] as const).map(s => (
            <button
              key={s}
              className={`px-3 py-[5px] text-[12px] font-semibold border-none rounded-md cursor-pointer whitespace-nowrap transition-all duration-150 ${sortBy === s ? 'bg-white text-[#0B1EAE] shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : 'bg-transparent text-[#64748b]'}`}
              onClick={() => setSortBy(s)}
            >
              {s === 'count' ? 'By Count' : 'A–Z'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-[#64748b] gap-3 text-[14px]">
          <Loader2 size={24} className="animate-spin" />
          <span>Syncing department data…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[#94a3b8] text-[14px] bg-[#f8fafc] rounded-[10px] border border-dashed border-[#cbd5e1]">
          No departments found{search ? ` for "${search}"` : ''}.
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {filtered.map((dept, i) => {
            const pct = Math.round(((dept.count || 0) / maxCount) * 100);
            const totalPct = totalInterns > 0 ? ((dept.count || 0) / totalInterns * 100).toFixed(1) : '0';
            return (
              <div
                key={i}
                className="flex items-center gap-[14px] px-4 py-[14px] bg-[#f8fafc] border border-[#f1f5f9] rounded-[10px] transition-all duration-150 hover:bg-[#f1f5f9] hover:border-[#e2e8f0] hover:-translate-y-px hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-[26px] h-[26px] bg-[#e0e7ff] text-[#0B1EAE] rounded-md flex items-center justify-center text-[12px] font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-semibold text-[#0f172a] whitespace-nowrap overflow-hidden text-ellipsis">{dept.name}</span>
                    <span className="text-[11px] text-[#94a3b8] mt-[2px]">{totalPct}% of total interns</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 w-[220px]">
                  <div className="flex-1 h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                    />
                  </div>
                  <span className="text-[16px] font-bold text-[#0f172a] min-w-[28px] text-right">{dept.count}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// ─── BRANCH MODAL ─────────────────────────────────────────────
function BranchModal({ isOpen, onClose, stats }: { isOpen: boolean; onClose: () => void; stats: DashStats }) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [branchDetails, setBranchDetails] = useState<Branch[] | null>(null);

  useEffect(() => {
    if (!isOpen) { setSearch(''); setBranchDetails(null); return; }
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get('/hr/dashboard-stats');
        if (res.data?.branches) setBranchDetails(res.data.branches);
      } catch { /* fall back */ }
      finally { setLoading(false); }
    };
    fetchDetails();
  }, [isOpen]);

  const branches = branchDetails || stats.branches || [];
  const totalInterns = branches.reduce((sum, b) => sum + (b.count || 0), 0);
  const hqBranch = branches.find(b => b.isHQ);

  const filtered = branches.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.sub?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="All Branches" icon={GitBranch} width="680px">
      {/* Stats Summary */}
      <div className="flex items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-5 py-4 flex-wrap gap-0">
        {[
          { value: branches.length, label: 'Branches' },
          { value: totalInterns, label: 'Total Interns' },
          { value: hqBranch?.name?.split(' ')[0] || '—', label: 'Headquarters' },
        ].map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className="w-px h-9 bg-[#e2e8f0] mx-2 flex-shrink-0" />}
            <div className="flex flex-col items-center gap-1 flex-1 min-w-[80px]">
              <span className="text-[28px] font-extrabold text-[#0B1EAE] leading-none">{item.value}</span>
              <span className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-[0.5px] whitespace-nowrap">{item.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 h-[38px] focus-within:border-[#0B1EAE] focus-within:bg-white transition-colors">
          <Search size={14} className="text-[#94a3b8] flex-shrink-0" />
          <input
            className="flex-1 border-none bg-transparent text-[13px] text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
            placeholder="Search branches…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-[#64748b] gap-3 text-[14px]">
          <Loader2 size={24} className="animate-spin" />
          <span>Syncing branch data…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[#94a3b8] text-[14px] bg-[#f8fafc] rounded-[10px] border border-dashed border-[#cbd5e1]">
          No branches found{search ? ` for "${search}"` : ''}.
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          {filtered.map((branch, i) => {
            const sharePct = totalInterns > 0 ? ((branch.count || 0) / totalInterns * 100).toFixed(1) : '0';
            return (
              <div
                key={i}
                className={`p-4 border rounded-xl transition-all duration-200 relative overflow-hidden hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(11,30,174,0.08)] ${branch.isHQ ? 'border-[#0B1EAE] bg-gradient-to-br from-[#f0f4ff] to-[#e8edff] hover:border-[#c7d2fe]' : 'bg-[#f8fafc] border-[#e2e8f0] hover:border-[#c7d2fe] hover:bg-[#f0f4ff]'}`}
              >
                <div className="flex items-start gap-[10px] mb-3">
                  <div className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center flex-shrink-0 ${branch.isHQ ? 'bg-[#0B1EAE] text-white' : 'bg-[#dbeafe] text-[#0B1EAE]'}`}>
                    <MapPin size={16} strokeWidth={2} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="text-[13px] font-bold text-[#0f172a] flex items-center gap-[6px] flex-wrap">
                      {branch.name}
                      {branch.isHQ && (
                        <span className="bg-[#0B1EAE] text-white text-[10px] px-[6px] py-[2px] rounded font-bold">HQ</span>
                      )}
                    </div>
                    {branch.sub && <span className="text-[11px] text-[#94a3b8] mt-[2px]">{branch.sub}</span>}
                  </div>
                </div>
                <div className="flex items-baseline gap-[5px] mb-[10px]">
                  <span className="text-[28px] font-extrabold text-[#0B1EAE] leading-none">{branch.count}</span>
                  <span className="text-[11px] text-[#94a3b8] font-medium">interns · {sharePct}%</span>
                </div>
                <div className="h-1 bg-[#e2e8f0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0B1EAE] to-[#4F63F1] rounded-full transition-all duration-500"
                    style={{ width: `${sharePct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// ─── REQUESTS MODAL ───────────────────────────────────────────
function RequestsModal({ isOpen, onClose, onRequestAction }: { isOpen: boolean; onClose: () => void; onRequestAction?: () => void }) {
  const [activeTab, setActiveTab] = useState<'absent' | 'halfDay' | 'overtime'>('absent');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<{ absent: PendingRequest[]; halfDay: PendingRequest[]; overtime: PendingRequest[] }>({ absent: [], halfDay: [], overtime: [] });
  const [activePopup, setActivePopup] = useState<RequestDetail & { loading?: boolean } | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/hr/dashboard-stats');
      if (res.data?.pending_requests) setRequests(res.data.pending_requests);
    } catch {
      toast.error('Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) { setSearch(''); setActivePopup(null); return; }
    fetchRequests();
  }, [isOpen, fetchRequests]);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      await api.post(`/hr/requests/${id}/process`, { action });
      toast.success(`Request ${action}ed!`);
      setRequests(prev => {
        const updated = { ...prev };
        (Object.keys(updated) as (keyof typeof updated)[]).forEach(key => {
          updated[key] = (updated[key] || []).filter(r => r.id !== id);
        });
        return updated;
      });
      onRequestAction?.();
    } catch {
      toast.error('Failed to process request.');
    }
  };

  const openDetail = async (reqId: number) => {
    setActivePopup({ id: reqId, loading: true } as RequestDetail & { loading: boolean });
    try {
      const res = await api.get(`/hr/requests/${reqId}`);
      setActivePopup(res.data);
    } catch {
      toast.error('Could not load request details.');
      setActivePopup(null);
    }
  };

  const currentList = (requests[activeTab] || []).filter(r =>
    r.intern_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.reason?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = Object.values(requests).reduce((s, arr) => s + (arr || []).length, 0);

  const TAB_CONFIG = [
    { key: 'absent' as const, label: 'Absent' },
    { key: 'halfDay' as const, label: 'Half-Day' },
    { key: 'overtime' as const, label: 'Overtime' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pending Requests" icon={ClipboardList} width="760px">
      {/* Summary */}
      <div className="flex items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-5 py-4 flex-wrap gap-0">
        <div className="flex flex-col items-center gap-1 flex-1 min-w-[80px]">
          <span className={`text-[28px] font-extrabold leading-none ${totalPending > 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>{totalPending}</span>
          <span className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-[0.5px] whitespace-nowrap">Total Pending</span>
        </div>
        <div className="w-px h-9 bg-[#e2e8f0] mx-2 flex-shrink-0" />
        {TAB_CONFIG.map((tab, i) => (
          <React.Fragment key={tab.key}>
            <div className="flex flex-col items-center gap-1 flex-1 min-w-[80px]">
              <span className="text-[28px] font-extrabold text-[#0B1EAE] leading-none">{requests[tab.key]?.length || 0}</span>
              <span className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-[0.5px] whitespace-nowrap">{tab.label}</span>
            </div>
            {i < TAB_CONFIG.length - 1 && <div className="w-px h-9 bg-[#e2e8f0] mx-2 flex-shrink-0" />}
          </React.Fragment>
        ))}
        <button
          className="flex items-center gap-[6px] px-[14px] py-[6px] bg-white border border-[#e2e8f0] rounded-lg text-[12px] font-semibold text-[#64748b] cursor-pointer ml-auto transition-all duration-150 flex-shrink-0 hover:bg-[#f1f5f9] hover:text-[#0f172a] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={fetchRequests}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-[6px] bg-[#f1f5f9] rounded-[10px] p-1">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.key}
              className={`flex-1 flex items-center justify-center gap-[7px] px-3 py-2 text-[13px] font-semibold border-none rounded-lg cursor-pointer transition-all duration-150 ${activeTab === tab.key ? 'bg-white text-[#0B1EAE] shadow-[0_1px_4px_rgba(0,0,0,0.1)]' : 'bg-transparent text-[#64748b] hover:bg-white/60 hover:text-[#334155]'}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className={`text-[11px] px-2 py-[2px] rounded-full font-bold ${activeTab === tab.key ? 'bg-[#dbeafe] text-[#1d4ed8]' : 'bg-[#e2e8f0] text-[#64748b]'}`}>
                {requests[tab.key]?.length || 0}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 h-[38px] focus-within:border-[#0B1EAE] focus-within:bg-white transition-colors">
          <Search size={14} className="text-[#94a3b8] flex-shrink-0" />
          <input
            className="flex-1 border-none bg-transparent text-[13px] text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
            placeholder="Search by intern name or reason…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Request List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-[#64748b] gap-3 text-[14px]">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading requests…</span>
        </div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-12 text-[#94a3b8] text-[14px] bg-[#f8fafc] rounded-[10px] border border-dashed border-[#cbd5e1]">
          {search ? `No results for "${search}"` : `No pending ${activeTab === 'halfDay' ? 'half-day' : activeTab} requests.`}
        </div>
      ) : (
        <div className="flex flex-col gap-[10px] max-h-[360px] overflow-y-auto pr-[2px] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#e2e8f0] [&::-webkit-scrollbar-thumb]:rounded">
          {currentList.map(req => (
            <div
              key={req.id}
              className="flex items-center gap-[14px] px-4 py-[14px] bg-[#f8fafc] border border-[#f1f5f9] rounded-[10px] cursor-pointer transition-all duration-150 hover:bg-[#f1f5f9] hover:border-[#e2e8f0] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              onClick={() => openDetail(req.id)}
            >
              <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#0B1EAE] to-[#4F63F1] text-white flex items-center justify-center text-[15px] font-bold flex-shrink-0">
                {req.intern_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-bold text-[#0f172a] m-0 mb-1">{req.intern_name}</h4>
                <div className="flex items-center gap-[5px] text-[11px] text-[#94a3b8] mb-1">
                  <Calendar size={11} />
                  <span>{req.date}</span>
                  {req.hours && <><span>·</span><span>{req.hours} hrs</span></>}
                </div>
                <p className="m-0 text-[12px] text-[#64748b] italic whitespace-nowrap overflow-hidden text-ellipsis max-w-[320px]">"{req.reason}"</p>
              </div>
              <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  className="flex items-center gap-[5px] px-3 py-[7px] rounded-lg text-[12px] font-semibold cursor-pointer border transition-all duration-150 whitespace-nowrap bg-[#ecfdf5] text-[#10b981] border-[#d1fae5] hover:bg-[#d1fae5]"
                  onClick={() => handleAction(req.id, 'approve')}
                  title="Approve"
                >
                  <Check size={15} strokeWidth={2.5} />
                  Approve
                </button>
                <button
                  className="flex items-center gap-[5px] px-3 py-[7px] rounded-lg text-[12px] font-semibold cursor-pointer border transition-all duration-150 whitespace-nowrap bg-[#fef2f2] text-[#ef4444] border-[#fee2e2] hover:bg-[#fee2e2]"
                  onClick={() => handleAction(req.id, 'reject')}
                  title="Reject"
                >
                  <X size={15} strokeWidth={2.5} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline detail panel */}
      {activePopup && (
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl overflow-hidden" style={{ animation: 'modalSlideIn 0.2s ease' }}>
          <div className="flex justify-between items-center px-4 py-3 bg-[#0B1EAE] text-white text-[13px] font-semibold">
            <span>Request Details</span>
            <button
              className="w-6 h-6 rounded-full bg-white/20 border-none text-white cursor-pointer flex items-center justify-center transition-colors hover:bg-white/35"
              onClick={() => setActivePopup(null)}
            >
              <X size={15} />
            </button>
          </div>
          {activePopup.loading ? (
            <div className="flex flex-col items-center justify-center py-5 text-[#64748b] gap-3 text-[14px]">
              <Loader2 size={20} className="animate-spin" />
              <span>Loading…</span>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-[14px]">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-[3px]">
                  <span className="text-[10px] uppercase tracking-[0.5px] text-[#94a3b8] font-bold">Intern</span>
                  <span className="text-[14px] text-[#0B1EAE] font-bold">{activePopup.intern_name}</span>
                </div>
                <div className="flex flex-col gap-[3px]">
                  <span className="text-[10px] uppercase tracking-[0.5px] text-[#94a3b8] font-bold">Type</span>
                  <span className="text-[14px] text-[#0f172a] font-medium">{activePopup.type}</span>
                </div>
                <div className="flex flex-col gap-[3px]">
                  <span className="text-[10px] uppercase tracking-[0.5px] text-[#94a3b8] font-bold">Date</span>
                  <span className="text-[14px] text-[#0f172a] font-medium">{activePopup.date_of_absence}</span>
                </div>
                <div className="flex flex-col gap-[3px] col-span-2">
                  <span className="text-[10px] uppercase tracking-[0.5px] text-[#94a3b8] font-bold">Reason</span>
                  <span className="text-[14px] text-[#0f172a] font-medium">{activePopup.reason}</span>
                </div>
                {activePopup.additional_details && (
                  <div className="flex flex-col gap-[3px] col-span-2">
                    <span className="text-[10px] uppercase tracking-[0.5px] text-[#94a3b8] font-bold">Additional Details</span>
                    <span className="text-[13px] text-[#0f172a] font-medium leading-relaxed">{activePopup.additional_details}</span>
                  </div>
                )}
              </div>
              {activePopup.attachment_path && (
                <div className="flex items-center gap-[10px] bg-white border border-dashed border-[#cbd5e1] rounded-lg px-[14px] py-[10px]">
                  <Paperclip size={16} color="#64748b" />
                  <a
                    href={`http://localhost:8000/storage/${activePopup.attachment_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0B1EAE] font-semibold text-[13px] no-underline hover:underline"
                  >
                    View Attached Document
                  </a>
                </div>
              )}
              {activePopup.status === 'Pending' && (
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-[9px] rounded-lg text-[13px] font-bold cursor-pointer border-none bg-[#ef4444] text-white transition-opacity hover:opacity-[0.88]"
                    onClick={() => { handleAction(activePopup.id, 'reject'); setActivePopup(null); }}
                  >
                    Reject
                  </button>
                  <button
                    className="flex-1 py-[9px] rounded-lg text-[13px] font-bold cursor-pointer border-none bg-[#10b981] text-white transition-opacity hover:opacity-[0.88]"
                    onClick={() => { handleAction(activePopup.id, 'approve'); setActivePopup(null); }}
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<'pie' | 'bar'>('pie');
  const [isHovered, setIsHovered] = useState(false);
  const [activeTab, setActiveTab] = useState<'absent' | 'halfDay' | 'overtime'>('absent');

  // Modal states
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [requestsModalOpen, setRequestsModalOpen] = useState(false);

  const initialCourseData = [
    { name: 'Computer Science', value: 20 },
    { name: 'Information Technology', value: 15 },
    { name: 'Computer Engineering', value: 10 },
    { name: 'Mechanical Engineering', value: 5 },
  ];

  const [stats, setStats] = useState<DashStats>({
    total_interns: 50,
    attendance_rate: 0,
    total_hours: 0,
    on_time_percentage: 0,
    today: { present: 0, absent: 0, excused: 0, late: 0 },
    course_distribution: initialCourseData,
    departments: [],
    branches: [],
    pending_requests: { absent: [], halfDay: [], overtime: [] },
  });

  const [schoolData, setSchoolData] = useState<SchoolData[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [activePopup, setActivePopup] = useState<(RequestDetail & { loading?: boolean }) | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const res = await api.get('/hr/dashboard-stats');
      if (res.data)
        setStats(prev => ({
          ...prev,
          ...res.data,
          // ✨ SAFETY: Always fallback to empty arrays if PHP sends empty data
          pending_requests: res.data.pending_requests || { absent: [], halfDay: [], overtime: [] },
        }));
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try { await refreshStats(); }
      finally { setLoading(false); }
    };
    const fetchSchoolData = async () => {
      try {
        const res = await api.get('/hr/dashboard/schools');
        setSchoolData(res.data);
      } catch (err) {
        console.error('Failed to fetch school stats:', err);
      } finally {
        setLoadingSchools(false);
      }
    };
    fetchStats();
    fetchSchoolData();
  }, [refreshStats]);

  const handleRequestAction = async (id: number, action: 'approve' | 'reject', type: 'absent' | 'halfDay' | 'overtime') => {
    try {
      await api.post(`/hr/requests/${id}/process`, { action });
      toast.success(`Request ${action}ed successfully!`);
      setStats(prev => ({
        ...prev,
        pending_requests: {
          ...prev.pending_requests,
          [type]: (prev.pending_requests[type] || []).filter(req => req.id !== id),
        },
      }));
    } catch {
      toast.error('Failed to process request.');
    }
  };

  const handlePopupAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      await api.post(`/hr/requests/${id}/process`, { action });
      toast.success(`Request ${action}ed successfully!`);
      setActivePopup(null);
      setStats(prev => {
        const updatedPending = { ...prev.pending_requests };
        (Object.keys(updatedPending) as (keyof typeof updatedPending)[]).forEach(key => {
          updatedPending[key] = (updatedPending[key] || []).filter(req => req.id !== id);
        });
        return { ...prev, pending_requests: updatedPending };
      });
      const res = await api.get('/hr/dashboard-stats');
      if (res.data?.pending_requests) {
        setStats(prev => ({ ...prev, pending_requests: res.data.pending_requests }));
      }
    } catch {
      toast.error('Failed to process request.');
    }
  };

  const openRequestPopup = async (requestId: number) => {
    // ✨ THE SAFETY GUARD
    if (!requestId || requestId === 0) {
      console.warn("Invalid Request ID. Aborting API call.");
      return; 
    }

    setActivePopup({ id: requestId, loading: true } as RequestDetail & { loading: boolean });
    try {
      const res = await api.get(`/hr/requests/${requestId}`);
      setActivePopup(res.data);
    } catch (err) {
      console.error('Failed to load request details', err);
      toast.error('Could not load request details from the server.');
      setActivePopup(null);
    }
  };

  const deptAttendanceData = stats.departments?.length > 0
    ? stats.departments.map(d => ({
        name: d.name.length > 10 ? d.name.substring(0, 10) + '...' : d.name,
        present: d.present_count || Math.floor(d.count * 0.8),
        absent: d.absent_count || Math.floor(d.count * 0.2),
      }))
    : [];

  const activeRequestsList = stats.pending_requests[activeTab] || [];

  const g1 = angleToSVGCoords(120);
  const g2 = angleToSVGCoords(265);
  const g3 = angleToSVGCoords(230);
  const g4 = angleToSVGCoords(143);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-3 bg-[#f8fafc] min-h-screen font-[Inter,system-ui,-apple-system,sans-serif] text-[#0f172a] flex flex-col gap-[5px]">
      <style>{`
        @keyframes shimmer { 0% { background-position: -700px 0; } 100% { background-position: 700px 0; } }
        @keyframes modalOverlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideIn { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes slideUpFade { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <Toaster position="top-right" />

      <PageHeader title="Dashboard" onNotificationClick={() => openRequestPopup(0)} />

      {/* TOP METRIC CARDS */}
      <div className="grid grid-cols-[2fr_1fr_1fr] gap-[5px]">
        {/* Wide card */}
        <div className="bg-white rounded-[10px] px-6 py-4 border border-[#e2e8f0] flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.02)] col-span-1">
          <p className="text-[14px] text-[#64748b] font-semibold m-0 mb-3">Total Interns</p>
          <div className="flex items-center gap-5">
            <h2 className="text-[40px] font-extrabold text-[#0f172a] m-0 leading-none">{stats.total_interns}</h2>
            <div className="flex-grow">
              <span className="text-[12px] text-[#64748b] flex justify-between mb-2 font-medium">
                Attendance Rate Today
              </span>
              <div className="h-[10px] bg-[#f1f5f9] rounded-md overflow-hidden mb-[5px]">
                <div
                  className="h-full rounded-md transition-all duration-500"
                  style={{
                    width: `${stats.attendance_rate}%`,
                    background: 'linear-gradient(90deg, #E3BD01 0%, #FFDE3C 50%, #FFE359 75%, #FFEFA3 100%)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[10px] px-6 py-4 border border-[#e2e8f0] flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[14px] text-[#64748b] font-semibold m-0 mb-3">Total Hours</p>
          <h2 className="text-[40px] font-extrabold text-[#0f172a] m-0 leading-none">{stats.total_hours.toLocaleString()}</h2>
        </div>
        <div className="bg-white rounded-[10px] px-6 py-4 border border-[#e2e8f0] flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[14px] text-[#64748b] font-semibold m-0 mb-3">On Time</p>
          <h2 className="text-[40px] font-extrabold text-[#0f172a] m-0 leading-none">{stats.on_time_percentage}%</h2>
        </div>
      </div>

      {/* MIDDLE GRID */}
      <div className="grid grid-cols-3 gap-[5px]">
        {/* Chart card spans 2 cols */}
        <div className="bg-white rounded-[10px] px-6 py-4 border border-[#e2e8f0] flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.02)] col-span-2 relative">
          <div className="flex justify-between items-center mb-[1px] pb-3 border-b border-[#f1f5f9]">
            <h3 className="text-[16px] font-bold m-0 text-[#0f172a]">
              {chartView === 'pie' ? 'Interns by Course' : 'Attendance by Dept'}
            </h3>
            <button
              onClick={() => setChartView(prev => prev === 'pie' ? 'bar' : 'pie')}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              title={chartView === 'pie' ? 'Switch to Bar Chart' : 'Switch to Pie Chart'}
              className="p-[6px] rounded-lg border border-[#e2e8f0] cursor-pointer flex items-center justify-center transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              style={{
                backgroundColor: isHovered ? '#f8fafc' : '#ffffff',
                color: isHovered ? '#0B1EAE' : '#64748B',
              }}
            >
              {chartView === 'pie' ? <BarIcon size={18} strokeWidth={2} /> : <PieIcon size={18} strokeWidth={2} />}
            </button>
          </div>

          <div className="relative flex justify-center items-center h-[270px] z-[1] mt-[10px]">
            {chartView === 'pie' && (
              <>
                <ResponsiveContainer width="100%" height={340}>
                  <PieChart margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gradSilverShiny" x1={g1.x1} y1={g1.y1} x2={g1.x2} y2={g1.y2} gradientUnits="objectBoundingBox">
                        <stop offset="18.03%" stopColor="#8C8C8C" />
                      </linearGradient>
                      <linearGradient id="gradLavenderShiny" x1={g2.x1} y1={g2.y1} x2={g2.x2} y2={g2.y2} gradientUnits="objectBoundingBox">
                        <stop offset="18.93%" stopColor="#8188B9" />
                      </linearGradient>
                      <linearGradient id="gradBlueShiny" x1={g3.x1} y1={g3.y1} x2={g3.x2} y2={g3.y2} gradientUnits="objectBoundingBox">
                        <stop offset="16.53%" stopColor="#2238DF" />
                      </linearGradient>
                      <linearGradient id="gradSilverLightShiny" x1={g4.x1} y1={g4.y1} x2={g4.x2} y2={g4.y2} gradientUnits="objectBoundingBox">
                        <stop offset="38.03%" stopColor="#B0B0B0" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={stats.course_distribution}
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                      cy="35%"
                    >
                      {(stats.course_distribution || []).map((_, index) => {
                        const gradients = ['url(#gradBlueShiny)', 'url(#gradLavenderShiny)', 'url(#gradSilverShiny)', 'url(#gradSilverLightShiny)'];
                        return <Cell key={`cell-${index}`} fill={gradients[index % gradients.length]} />;
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={24}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px', position: 'relative', top: '280px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="block text-[36px] font-extrabold text-[#0f172a] leading-none mb-[5px]">{stats.total_interns}</span>
                  <span className="text-[14px] text-[#64748b] font-medium">Total</span>
                </div>
              </>
            )}
            {chartView === 'bar' && (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={deptAttendanceData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} iconType="circle" />
                  <Bar dataKey="present" name="Present" fill="#0B1EAE" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="absent" name="Absent" fill="#94A3B8" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Attendance Cards */}
        <div className="grid grid-cols-2 gap-[5px]">
          {/* Present */}
          <div className="flex p-4 flex-col items-start rounded-[10px] bg-white border border-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.02)] h-[180px]">
            <div className="flex items-center gap-2 text-[14px] font-semibold pb-[1px] border-b border-[#f1f5f9] text-[#5AC374]">
              <UserCheck size={18} strokeWidth={1.5} /> Present Today
            </div>
            <span className="text-[42px] font-bold text-center leading-none w-full my-auto text-[#5AC374]">{stats.today.present}</span>
          </div>
          {/* Absent */}
          <div className="flex p-4 flex-col items-start rounded-[10px] bg-white border border-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.02)] h-[180px]">
            <div className="flex items-center gap-2 text-[14px] font-semibold pb-[1px] border-b border-[#f1f5f9] text-[#757575]">
              <UserX size={18} strokeWidth={1.5} /> Absent Today
            </div>
            <span className="text-[42px] font-bold text-center leading-none w-full my-auto text-[#757575]">{stats.today.absent}</span>
          </div>
          {/* Excused */}
          <div className="flex p-4 flex-col items-start rounded-[10px] bg-white border border-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.02)] h-[180px]">
            <div className="flex items-center gap-2 text-[14px] font-semibold pb-[1px] border-b border-[#f1f5f9] text-[#C76A00]">
              <UserMinus size={18} strokeWidth={1.5} /> Excused Today
            </div>
            <span className="text-[42px] font-bold text-center leading-none w-full my-auto text-[#C76A00]">{stats.today.excused}</span>
          </div>
          {/* Late */}
          <div className="flex p-4 flex-col items-start rounded-[10px] bg-white border border-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.02)] h-[180px]">
            <div className="flex items-center gap-2 text-[14px] font-semibold pb-[1px] border-b border-[#f1f5f9] text-[#C76A00]">
              <Clock size={18} strokeWidth={1.5} /> Late Today
            </div>
            <span className="text-[42px] font-bold text-center leading-none w-full my-auto text-[#C76A00]">{stats.today.late}</span>
          </div>
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div className="grid grid-cols-2 gap-[5px]">

        {/* 1. By Department */}
        <div className="bg-white rounded-[10px] px-6 py-4 border border-[#e2e8f0] flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-[1px] pb-3 border-b border-[#f1f5f9]">
            <h3 className="text-[16px] font-bold m-0 text-[#0f172a]">By Department</h3>
            <span
              className="text-[13px] text-[#0B1EAE] cursor-pointer font-semibold transition-colors duration-200 flex items-center gap-[2px] hover:underline hover:text-[#4F63F1]"
              onClick={() => setDeptModalOpen(true)}
            >
              View all <ChevronRight size={13} className="inline align-middle" />
            </span>
          </div>
          <div className="flex flex-col gap-3 flex-grow overflow-y-auto">
            {(stats.departments || []).map((dept, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex justify-between text-[14px] font-semibold text-[#334155]">
                  <span>{dept.name}</span>
                  <span className="text-[#64748b] text-[13px] font-medium">{dept.count} interns</span>
                </div>
                <div className="h-2 bg-[#f1f5f9] rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md"
                    style={{
                      width: `${(dept.count / (dept.total || 1)) * 100}%`,
                      background: dept.color || 'linear-gradient(90deg, #E3BD01 0%, #FFDE3C 50%, #FFE359 75%, #FFEFA3 100%)',
                    }}
                  />
                </div>
              </div>
            ))}
            {(!stats.departments || stats.departments.length === 0) && (
              <div className="text-[#94a3b8] text-[14px] text-center py-5">No department data available</div>
            )}
          </div>
        </div>

        {/* 2. Branch List */}
        <div className="bg-white rounded-[10px] px-6 py-4 border border-[#e2e8f0] flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-[1px] pb-3 border-b border-[#f1f5f9]">
            <h3 className="text-[16px] font-bold m-0 text-[#0f172a]">By Branch</h3>
            <span
              className="text-[13px] text-[#0B1EAE] cursor-pointer font-semibold transition-colors duration-200 flex items-center gap-[2px] hover:underline hover:text-[#4F63F1]"
              onClick={() => setBranchModalOpen(true)}
            >
              View all <ChevronRight size={13} className="inline align-middle" />
            </span>
          </div>
          <div className="flex flex-col gap-3 flex-grow overflow-y-auto">
            {(stats.branches || []).map((branch, i) => (
              <div key={i} className="flex justify-between items-center pb-3 border-b border-[#f1f5f9] last:border-b-0 last:pb-[1px]">
                <div className="flex flex-col">
                  <div className="text-[14px] font-semibold text-[#0f172a] flex items-center gap-[6px]">
                    {branch.name}
                    {branch.isHQ && (
                      <span className="bg-[#dbeafe] text-[#1e3a8a] text-[11px] px-2 py-2 rounded font-bold">HQ</span>
                    )}
                  </div>
                  <span className="text-[12px] text-[#64748b] mt-1">{branch.sub}</span>
                </div>
                <div className="text-[16px] font-bold text-[#0f172a] bg-[#f8fafc] px-3 py-1 rounded-md border border-[#e2e8f0]">{branch.count}</div>
              </div>
            ))}
            {(!stats.branches || stats.branches.length === 0) && (
              <div className="text-[#94a3b8] text-[14px] text-center py-5">No branch data available</div>
            )}
          </div>
        </div>

        {/* 3. Schools Bar Chart */}
        <div className="bg-white rounded-[10px] px-6 py-4 border border-[#e2e8f0] flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-[1px] pb-3 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-bold m-0 text-[#0f172a]">Interns by School</h3>
            </div>
          </div>
          {loadingSchools ? (
            <div className="flex flex-col items-center justify-center h-[220px] text-[#64748b]">
              <Loader2 size={24} className="animate-spin mb-2" />
              <span className="text-[13px]">Syncing data...</span>
            </div>
          ) : schoolData.length === 0 ? (
            <div className="mt-5 py-8 text-center text-[#94a3b8] text-[14px] bg-[#f8fafc] rounded-lg border border-dashed border-[#cbd5e1]">
              No school data available
            </div>
          ) : (
            <div className="h-[220px] mt-[10px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={schoolData.map(school => ({ ...school, shortName: getSchoolAbbreviation(school.name) }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} interval={0} />
                  <YAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    labelFormatter={(label, payload) => payload?.length > 0 ? (payload[0].payload as SchoolData).name : label}
                  />
                  <Bar dataKey="value" name="Interns" radius={[4, 4, 0, 0]} barSize={20}>
                    {schoolData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 4. Pending Requests Widget */}
        <div className="bg-white rounded-[10px] px-6 py-4 border border-[#e2e8f0] flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-[1px] pb-3 border-b border-[#f1f5f9]">
            <h3 className="text-[16px] font-bold m-0 text-[#0f172a]">Pending Requests</h3>
            <span
              className="text-[13px] text-[#0B1EAE] cursor-pointer font-semibold transition-colors duration-200 flex items-center gap-[2px] hover:underline hover:text-[#4F63F1]"
              onClick={() => setRequestsModalOpen(true)}
            >
              View all <ChevronRight size={13} className="inline align-middle" />
            </span>
          </div>

          <div className="flex gap-2 mb-4 border-b border-[#e2e8f0] pb-3">
            {([
              { key: 'absent' as const, label: 'Absent' },
              { key: 'halfDay' as const, label: 'Half-Day' },
              { key: 'overtime' as const, label: 'Overtime' },
            ]).map(tab => (
              <div
                key={tab.key}
                className={`text-[14px] font-medium px-3 py-[6px] rounded-md cursor-pointer flex items-center gap-[6px] transition-colors duration-200 ${activeTab === tab.key ? 'bg-[#eff6ff] text-[#2563eb] font-semibold' : 'text-[#64748b] hover:bg-[#f8fafc]'}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span className={`text-[12px] px-2 py-[2px] rounded-xl ${activeTab === tab.key ? 'bg-[#bfdbfe] text-[#1d4ed8]' : 'bg-[#e2e8f0] text-[#475569]'}`}>
                  {/* ✨ SAFETY: Check if array exists before calling .length */}
                  {(stats.pending_requests[tab.key] || []).length}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 max-h-[200px] overflow-y-auto">
            {activeRequestsList.length === 0 ? (
              <div className="py-8 text-center text-[#94a3b8] text-[14px] bg-[#f8fafc] rounded-lg border border-dashed border-[#cbd5e1]">
                No pending requests right now.
              </div>
            ) : (
              activeRequestsList.map(req => (
                <div
                  key={req.id}
                  onClick={() => openRequestPopup(req.id)}
                  className="flex justify-between items-start p-3 bg-[#f8fafc] rounded-lg border border-[#f1f5f9] cursor-pointer transition-all duration-200 hover:bg-[#f1f5f9] hover:border-[#e2e8f0]"
                >
                  <div className="flex-1">
                    <h4 className="m-0 mb-1 text-[13px] font-bold text-[#0f172a]">{req.intern_name}</h4>
                    <p className="m-0 mb-1 text-[11px] text-[#64748b]">
                      <Calendar size={10} className="inline mr-1" />
                      {req.date} {req.hours ? `• ${req.hours} hrs` : ''}
                    </p>
                    <p className="m-0 text-[12px] text-[#475569] italic">"{req.reason}"</p>
                  </div>
                  <div className="flex gap-[6px] ml-3 z-10" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleRequestAction(req.id, 'approve', activeTab); }}
                      className="bg-[#ecfdf5] text-[#10b981] border border-[#d1fae5] p-[6px] rounded-md cursor-pointer flex items-center transition-all duration-200 hover:bg-[#d1fae5]"
                      title="Approve Request"
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleRequestAction(req.id, 'reject', activeTab); }}
                      className="bg-[#fef2f2] text-[#ef4444] border border-[#fee2e2] p-[6px] rounded-md cursor-pointer flex items-center transition-all duration-200 hover:bg-[#fee2e2]"
                      title="Reject Request"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* BOTTOM RIGHT POPUP */}
      {activePopup && (
        <div
          className="fixed bottom-6 right-6 w-[360px] bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.05)] z-[10000] flex flex-col overflow-hidden"
          style={{ animation: 'slideUpFade 0.3s cubic-bezier(0.16,1,0.3,1)' }}
        >
          <div className="bg-[#0B1EAE] text-white px-4 py-3 flex justify-between items-center font-semibold text-[14px]">
            <span>Request Details</span>
            <button
              className="bg-white/20 border-none text-white w-[26px] h-[26px] rounded-full cursor-pointer flex items-center justify-center transition-colors hover:bg-white/40"
              onClick={() => setActivePopup(null)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="px-4 py-4 max-h-[400px] overflow-y-auto text-[13px] text-[#334155] flex flex-col gap-3">
            {activePopup.loading ? (
              <div className="flex flex-col items-center py-[30px] text-[#64748b]">
                <Loader2 size={24} className="animate-spin mb-[10px]" />
                <span>Loading request...</span>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase text-[#64748b] font-bold tracking-[0.5px]">Intern Name</span>
                  <span className="text-[16px] font-bold text-[#0B1EAE]">{activePopup.intern_name || 'Unknown Intern'}</span>
                </div>
                <div className="flex gap-5">
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[11px] uppercase text-[#64748b] font-bold tracking-[0.5px]">Type</span>
                    <span className="text-[14px] text-[#0f172a] font-medium">{activePopup.type}</span>
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[11px] uppercase text-[#64748b] font-bold tracking-[0.5px]">Date Requested</span>
                    <span className="text-[14px] text-[#0f172a] font-medium">{activePopup.date_of_absence}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase text-[#64748b] font-bold tracking-[0.5px]">Reason</span>
                  <span className="text-[14px] text-[#0f172a] font-medium">{activePopup.reason}</span>
                </div>
                {activePopup.additional_details && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase text-[#64748b] font-bold tracking-[0.5px]">Additional Details</span>
                    <span className="text-[13px] text-[#0f172a] font-medium leading-relaxed">{activePopup.additional_details}</span>
                  </div>
                )}
                {activePopup.attachment_path && (
                  <div className="flex flex-col gap-1 mt-[10px]">
                    <span className="text-[11px] uppercase text-[#64748b] font-bold tracking-[0.5px]">Attached File</span>
                    <div className="bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-lg p-3 flex items-center gap-[10px] mt-1">
                      <Paperclip size={18} color="#64748b" />
                      <a
                        href={`http://localhost:8000/storage/${activePopup.attachment_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0B1EAE] font-semibold no-underline text-[13px] hover:underline"
                      >
                        View Attached Document
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          {!activePopup.loading && activePopup.status === 'Pending' && (
            <div className="px-4 py-3 bg-[#f8fafc] border-t border-[#e2e8f0] flex gap-2">
              <button
                className="flex-1 py-2 rounded-md font-semibold text-[13px] cursor-pointer border-none bg-[#ef4444] text-white transition-opacity hover:opacity-90"
                onClick={() => handlePopupAction(activePopup.id, 'reject')}
              >
                Reject
              </button>
              <button
                className="flex-1 py-2 rounded-md font-semibold text-[13px] cursor-pointer border-none bg-[#10b981] text-white transition-opacity hover:opacity-90"
                onClick={() => handlePopupAction(activePopup.id, 'approve')}
              >
                Approve
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── THE THREE MODALS ─── */}
      <DepartmentModal isOpen={deptModalOpen} onClose={() => setDeptModalOpen(false)} stats={stats} />
      <BranchModal isOpen={branchModalOpen} onClose={() => setBranchModalOpen(false)} stats={stats} />
      <RequestsModal isOpen={requestsModalOpen} onClose={() => setRequestsModalOpen(false)} onRequestAction={refreshStats} />
    </div>
  );
}