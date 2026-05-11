import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Archive,
  ArchiveRestore,
  Download,
  Clock,
  AlertCircle,
  X,
  File,
  Activity,
  CheckCircle2,
  MoreHorizontal,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../../../api/axios';
import InternDetailsModal from './components/InternDetailsModal';
import PageHeader from '../../../components/layout/PageHeader';

// ✨ REDUX IMPORTS
import { useAppDispatch } from '../../../store/hooks';
import { openProfile } from '../../../store/ui/drawerReducer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InternRecord {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status?: string;
  is_present_today?: boolean;
  deleted_at?: string;
  created_at?: string;
  date_started?: string;
  school?: string;
  course?: string;
  assigned_department?: string;
  intern?: {
    avatar_url?: string;
    date_started?: string;
    start_date?: string;
    created_at?: string;
    department?: { name: string };
    school?: { name: string };
    course?: string;
    emergency_name?: string;
    emergency_number?: string;
    emergency_address?: string;
  };
  department?: { name: string };
  profile_picture?: string;
  profile?: { avatar_url?: string };
  updated_at?: string;
}

interface SelectedInternModal {
  id: number;
  name: string;
  email: string;
  department: string;
  school: string;
  course: string;
  emergency_name: string;
  emergency_number: string;
  emergency_address: string;
  avatar_url: string | null;
  rawData: InternRecord;
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

interface AddHoursForm {
  date: string;
  timeIn: string;
  timeOut: string;
  reason: string;
  notes: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  words.forEach((word) => {
    if (!stopWords.includes(word.toLowerCase()) && word.length > 0) {
      acronym += word[0].toUpperCase();
    }
  });

  return acronym.length >= 2 ? acronym : schoolName;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

interface SkProps {
  w?: string | number;
  h?: number;
  r?: number;
  mb?: number;
}

function Sk({ w = '100%', h = 16, r = 6, mb = 0 }: SkProps) {
  return (
    <div
      className="skel-shimmer block flex-shrink-0"
      style={{
        width: w,
        height: h,
        borderRadius: r,
        marginBottom: mb,
      }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InternsList() {
  const [interns, setInterns] = useState<InternRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');

  const [selectedInternModal, setSelectedInternModal] =
    useState<SelectedInternModal | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'success',
  });

  // ✨ INITIALIZE DISPATCH FOR REDUX
  const dispatch = useAppDispatch();

  const showNotification = (
    message: string,
    type: 'success' | 'error' = 'success'
  ) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const [selectedInterns, setSelectedInterns] = useState<InternRecord[]>([]);
  const [activeBulkModal, setActiveBulkModal] = useState<
    'archive' | 'restore' | 'export' | 'addHours' | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [confirmArchiveText, setConfirmArchiveText] = useState('');
  
  // ✨ EXPORT STATE
  const [exportType, setExportType] = useState('info');
  const [exportFormat, setExportFormat] = useState('Excel');
  const [dateRange, setDateRange] = useState('This Month');

  // ✨ FIX: Added the new half day types to the state
  const [hoursInputType, setHoursInputType] = useState<'time' | 'full_day' | 'half_day_am' | 'half_day_pm'>(
    'time'
  );
  const [eventType, setEventType] = useState('Regular Day');
  const [addHoursForm, setAddHoursForm] = useState<AddHoursForm>({
    date: '',
    timeIn: '',
    timeOut: '',
    reason: '',
    notes: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [schoolFilter, setSchoolFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [presentFilter, setPresentFilter] = useState('All');

  const fetchInterns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hr/interns', {
        params: { view: viewMode },
      });
      setInterns(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching interns:', err);
      setError('Failed to load interns list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterns();
    clearSelection();
  }, [viewMode]);

  const uniqueDepartments = useMemo(
    () => [
      'All',
      ...new Set(
        interns.map(
          (i) =>
            i.intern?.department?.name ||
            i.department?.name ||
            i.assigned_department ||
            'Not Assigned'
        )
      ),
    ],
    [interns]
  );

  const uniqueSchools = useMemo(
    () => [
      'All',
      ...new Set(
        interns.map(
          (i) =>
            i.intern?.school?.name ||
            (i as any).school?.name ||
            i.school ||
            'Not Assigned'
        )
      ),
    ],
    [interns]
  );

  const uniqueStatuses = useMemo(
    () => ['All', ...new Set(interns.map((i) => i.status || 'Unknown'))],
    [interns]
  );

  const processedInterns = useMemo(() => {
    return interns.filter((user) => {
      const name =
        `${user.first_name} ${user.last_name}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      const dept =
        user.intern?.department?.name ||
        user.department?.name ||
        user.assigned_department ||
        'Not Assigned';
      const school =
        user.intern?.school?.name ||
        (user as any).school?.name ||
        user.school ||
        'Not Assigned';
      const status = user.status || 'Unknown';

      const matchesSearch =
        name.includes(searchTerm.toLowerCase()) ||
        email.includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === 'All' || dept === deptFilter;
      const matchesSchool =
        schoolFilter === 'All' || school === schoolFilter;
      const matchesStatus =
        statusFilter === 'All' || status === statusFilter;
      const matchesPresent =
        presentFilter === 'All' ||
        (presentFilter === 'Present' && user.is_present_today) ||
        (presentFilter === 'Absent' && !user.is_present_today);

      return (
        matchesSearch &&
        matchesDept &&
        matchesSchool &&
        matchesStatus &&
        matchesPresent
      );
    });
  }, [
    interns,
    searchTerm,
    deptFilter,
    schoolFilter,
    statusFilter,
    presentFilter,
  ]);

  const fullChartData = useMemo(() => {
    const months = [
      'Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec',
    ];
    const dataObj: Record<string, number> = {};

    const today = new Date();
    for (let i = 59; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      dataObj[`${months[d.getMonth()]} ${d.getFullYear()}`] = 0;
    }

    interns.forEach((intern) => {
      const dateStr =
        intern.intern?.date_started ||
        intern.date_started ||
        intern.created_at;
      if (dateStr) {
        const d = new Date(dateStr);
        const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
        if (dataObj[key] !== undefined) {
          dataObj[key] += 1;
        }
      }
    });

    return Object.keys(dataObj).map((key) => ({
      name: key,
      rawMonth: key.split(' ')[0],
      rawYear: key.split(' ')[1],
      interns: dataObj[key],
    }));
  }, [interns]);

  const windowSize = 12;
  const [startIndex, setStartIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartIndex, setDragStartIndex] = useState(0);

  useEffect(() => {
    if (fullChartData.length > windowSize) {
      setStartIndex(fullChartData.length - windowSize);
    }
  }, [fullChartData.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartIndex(startIndex);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX;
    const shift = Math.round(deltaX / 25);
    let newIndex = dragStartIndex - shift;
    newIndex = Math.max(
      0,
      Math.min(newIndex, fullChartData.length - windowSize)
    );
    setStartIndex(newIndex);
  };

  const handleMouseUp = () => setIsDragging(false);
  const visibleData = fullChartData.slice(startIndex, startIndex + windowSize);

  const toggleInternSelection = (intern: InternRecord) => {
    setSelectedInterns((prev) =>
      prev.some((i) => i.id === intern.id)
        ? prev.filter((i) => i.id !== intern.id)
        : [...prev, intern]
    );
  };

  const toggleAllSelection = () => {
    if (selectedInterns.length === processedInterns.length) {
      setSelectedInterns([]);
    } else {
      setSelectedInterns([...processedInterns]);
    }
  };

  const clearSelection = () => {
    setSelectedInterns([]);
    setActiveBulkModal(null);
    setConfirmArchiveText('');
    setAddHoursForm({ date: '', timeIn: '', timeOut: '', reason: '', notes: '' });
  };

  const isAllSelected =
    processedInterns.length > 0 &&
    selectedInterns.length === processedInterns.length;
  const isSelected = (id: number) =>
    selectedInterns.some((intern) => intern.id === id);

  const handleBulkArchive = async () => {
    try {
      setIsProcessing(true);
      const internIds = selectedInterns.map((i) => i.id);
      await api.post('/hr/interns/bulk-archive', { ids: internIds });
      fetchInterns();
      clearSelection();
      showNotification(`${internIds.length} interns successfully archived.`);
    } catch {
      showNotification('Error archiving interns.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkRestore = async () => {
    try {
      setIsProcessing(true);
      const internIds = selectedInterns.map((i) => i.id);
      await api.post('/hr/interns/bulk-restore', { ids: internIds });
      fetchInterns();
      clearSelection();
      showNotification(`${internIds.length} interns successfully restored.`);
    } catch {
      showNotification('Error restoring interns.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // ✨ BULLETPROOF EXPORT FIX
  const handleBulkExport = async () => {
    try {
      setIsProcessing(true);
      const internIds = selectedInterns.map((i) => i.id);
      
      const response = await api.post(
        '/hr/interns/bulk-export',
        { 
          ids: internIds, 
          type: exportType, 
          format: exportFormat,
          date_range: dateRange // ✨ Sends the Date Range!
        },
        { responseType: 'blob' }
      );

      // ✨ SAFETY CHECK: Did Laravel send an error instead of a file?
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        showNotification(`Export Error: ${errorData.message || 'Server error'}`, 'error');
        setIsProcessing(false);
        return;
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `Intern_Export_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      clearSelection();
      showNotification('Export downloaded successfully!');
    } catch (err: any) {
      console.error('Export exception:', err);
      showNotification('Export failed to process.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAddHours = async () => {
    if (!addHoursForm.date) {
      showNotification('Please select a Date.', 'error');
      return;
    }

    if (
      hoursInputType === 'time' &&
      (!addHoursForm.timeIn || !addHoursForm.timeOut)
    ) {
      showNotification('Please fill in Time In and Time Out.', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      const payload = {
        intern_ids: selectedInterns.map((i) => i.id),
        event_type: eventType,
        date: addHoursForm.date,
        input_type: hoursInputType,
        time_in: hoursInputType === 'time' ? addHoursForm.timeIn : null,
        time_out: hoursInputType === 'time' ? addHoursForm.timeOut : null,
        reason: addHoursForm.reason,
        notes: addHoursForm.notes,
      };

      await api.post('/hr/interns/bulk-add-hours', payload);
      fetchInterns();
      clearSelection();
      showNotification('Hours assigned successfully!');
    } catch {
      showNotification('Failed to add hours.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // ✨ THE AGGRESSIVE DATE HUNTER ✨
  const formatDate = (user: any, viewMode: string) => {
    // 1. First, try to grab the exact target dates
    let targetDate = viewMode === 'archived' 
      ? user?.deleted_at 
      : user?.intern?.date_started || user?.date_started || user?.intern?.start_date || user?.start_date;

    // 2. If those are blank (null), aggressively hunt for standard Laravel timestamps
    if (!targetDate) {
      targetDate = user?.created_at || user?.intern?.created_at || user?.updated_at;
    }

    // 3. If Laravel sent literally zero dates, then we show N/A
    if (!targetDate) return 'N/A';

    try {
      // Safely format the date (also fixes the classic Safari 'Invalid Date' bug by replacing spaces with 'T')
      const safeDate = targetDate.replace(' ', 'T'); 
      return new Date(safeDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return 'N/A';
    }
  };

  // ─── Skeleton Loading State ──────────────────────────────────────────────────

  if (loading && interns.length === 0) {
    return (
      <div className="p-3 bg-slate-50 min-h-screen flex flex-col gap-1.5 pb-24 font-[Inter,system-ui,-apple-system,sans-serif] text-slate-900">
        <style>{`
          @keyframes shimmer {
            0%   { background-position: -700px 0; }
            100% { background-position:  700px 0; }
          }
          .skel-shimmer {
            background: linear-gradient(90deg, #e8ecf2 25%, #f4f6fa 50%, #e8ecf2 75%);
            background-size: 700px 100%;
            animation: shimmer 1.4s ease-in-out infinite;
            border-radius: 10px;
          }
        `}</style>

        <div className="flex justify-between p-3.5 px-5 bg-white rounded-xl border border-slate-200 mb-6">
          <Sk w={160} h={26} r={6} />
          <div className="flex gap-3">
            <Sk w={36} h={36} r={8} />
            <Sk w={210} h={36} r={999} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 px-[18px] border border-slate-200 flex flex-col">
          <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-slate-100">
            <Sk w={120} h={18} />
            <Sk w={40} h={18} />
          </div>
          <Sk w="100%" h={220} />
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {[...Array(4)].map((_, i) => (
            <Sk key={i} w="100%" h={36} r={8} />
          ))}
        </div>

        <div className="bg-white rounded-xl p-4 px-[18px] border border-slate-200 flex flex-col">
          <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-slate-100">
            <Sk w={100} h={18} />
            <div className="flex gap-1.5">
              <Sk w={70} h={30} r={8} />
              <Sk w={36} h={30} r={8} />
            </div>
          </div>
          <div className="flex flex-col mt-2.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 py-3 border-b border-slate-50"
              >
                <Sk w={14} h={14} r={4} />
                <Sk w={32} h={32} r={999} />
                <div className="flex flex-col flex-1 gap-1.5">
                  <Sk w={120} h={13} />
                  <Sk w={80} h={10} />
                </div>
                <Sk w={60} h={13} />
                <Sk w={60} h={13} />
                <Sk w={60} h={13} />
                <Sk w={24} h={24} r={6} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-3 bg-slate-50 min-h-screen flex flex-col gap-1.5 pb-24 font-[Inter,system-ui,-apple-system,sans-serif] text-slate-900">
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -700px 0; }
          100% { background-position:  700px 0; }
        }
        .skel-shimmer {
          background: linear-gradient(90deg, #e8ecf2 25%, #f4f6fa 50%, #e8ecf2 75%);
          background-size: 700px 100%;
          animation: shimmer 1.4s ease-in-out infinite;
          border-radius: 10px;
        }
      `}</style>

      {/* Toast Notification */}
      {notification.show && (
        <div
          className={`fixed top-3 right-3 bg-white rounded-xl border p-3 px-4 flex items-center gap-2 z-[100] shadow-sm ${
            notification.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span className="text-[12px] text-inherit font-semibold">
            {notification.message}
          </span>
          <button
            onClick={() =>
              setNotification({ show: false, message: '', type: 'success' })
            }
            className="bg-transparent border-none p-1 rounded-xl text-slate-400 cursor-pointer flex items-center justify-center hover:bg-slate-100 hover:text-[#0B1EAE]"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader title="Interns Overview" />

      {/* Chart Card */}
      <div
        className="bg-white rounded-xl p-4 px-[18px] border border-slate-200 flex flex-col"
        style={{
          maxHeight: '200px',
          opacity: viewMode === 'archived' ? 0.5 : 1,
          transition: 'opacity 0.3s',
        }}
      >
        <div className="flex justify-between items-end mb-3 pb-2.5 border-b border-slate-100">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-[15px] font-bold m-0 text-slate-900">
              {viewMode === 'active'
                ? 'Active Interns'
                : 'Archived Interns History'}
            </h3>
            <p className="text-[12px] text-slate-500 m-0">
              Click and drag the chart left or right to view historical data.
            </p>
          </div>
          <div className="flex flex-col text-right">
            <p className="text-2xl font-bold text-[#0B1EAE] m-0 leading-none">
              {interns.length}
            </p>
            <p
              className="text-[11px] font-bold text-slate-500 uppercase mb-0.5 block"
              style={{
                color: viewMode === 'active' ? '#16a34a' : '#64748b',
              }}
            >
              Total {viewMode === 'active' ? 'Active' : 'Archived'}
            </p>
          </div>
        </div>

        <div
          className="h-[220px] w-full mt-2.5"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            style={{ pointerEvents: 'none' }}
          >
            <AreaChart
              data={visibleData}
              margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="colorInterns"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={
                      viewMode === 'active' ? '#0B1EAE' : '#64748b'
                    }
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor={
                      viewMode === 'active' ? '#0B1EAE' : '#64748b'
                    }
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e8eaf0',
                  boxShadow: 'none',
                }}
                labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                itemStyle={{
                  color: viewMode === 'active' ? '#0B1EAE' : '#64748b',
                  fontWeight: 'bold',
                }}
                formatter={(value: any) => {
                  const safeValue = value ?? 0; 
                  return [
                    `${safeValue} Interns`,
                    viewMode === 'active' ? 'Active' : 'Archived',
                  ] as any;
                }}
              />
              <Area
                type="monotone"
                dataKey="interns"
                stroke={viewMode === 'active' ? '#0B1EAE' : '#64748b'}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorInterns)"
                isAnimationActive={!isDragging}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                dy={10}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-1.5">
        <select
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-900 outline-none bg-white box-border focus:border-[#0B1EAE]"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          {uniqueDepartments.map((d) => (
            <option key={d} value={d}>
              {d === 'All' ? 'All Departments' : d}
            </option>
          ))}
        </select>
        <select
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-900 outline-none bg-white box-border focus:border-[#0B1EAE]"
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
        >
          {uniqueSchools.map((s) => (
            <option key={s} value={s}>
              {s === 'All' ? 'All Schools' : s}
            </option>
          ))}
        </select>
        <select
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-900 outline-none bg-white box-border focus:border-[#0B1EAE]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {uniqueStatuses.map((s) => (
            <option key={s} value={s}>
              {s === 'All' ? 'All Status' : s}
            </option>
          ))}
        </select>
        <select
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-900 outline-none bg-white box-border focus:border-[#0B1EAE] disabled:opacity-50"
          value={presentFilter}
          onChange={(e) => setPresentFilter(e.target.value)}
          disabled={viewMode === 'archived'}
        >
          <option value="All">All Attendance</option>
          <option value="Present">Present Today</option>
          <option value="Absent">Absent Today</option>
        </select>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-2.5 rounded-xl text-[13px]">
          {error}
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-xl p-4 px-[18px] border border-slate-200 flex flex-col">
        <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-slate-100">
          <h2 className="text-[15px] font-bold m-0 text-slate-900">
            {viewMode === 'active' ? 'List Of Interns' : 'Archived Records'}
          </h2>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-900 outline-none bg-white focus:border-[#0B1EAE]"
                style={{ height: '34px', width: '220px' }}
              />
            </div>

            {/* View Toggle */}
            <button
              onClick={() =>
                setViewMode((prev) =>
                  prev === 'active' ? 'archived' : 'active'
                )
              }
              className={`border rounded-xl px-3 text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 ${
                viewMode === 'archived'
                  ? 'bg-[#0B1EAE] text-white border-[#0B1EAE] hover:bg-[#050C48] hover:border-[#050C48]'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
              }`}
              style={{ height: '34px' }}
            >
              {viewMode === 'active' ? (
                <>
                  <Archive size={14} /> View Archives
                </>
              ) : (
                <>
                  <Search size={14} /> View Active
                </>
              )}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto mt-2.5">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-50 border-t border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] w-10">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 cursor-pointer m-0 accent-[#0B1EAE]"
                    checked={isAllSelected}
                    onChange={toggleAllSelection}
                  />
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em]">
                  Interns
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em]">
                  Department
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em]">
                  School
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em]">
                  Date {viewMode === 'archived' ? 'Archived' : 'Started'}
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em]">
                  Status
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em]"></th>
              </tr>
            </thead>
            <tbody>
              {processedInterns.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center text-slate-400 py-8 italic px-4 text-[13px] border-b border-slate-100"
                  >
                    {viewMode === 'archived'
                      ? 'No archived records found.'
                      : 'No active interns found.'}
                  </td>
                </tr>
              ) : (
                processedInterns.map((user) => {
                  const departmentName =
                    user.intern?.department?.name ||
                    user.department?.name ||
                    user.assigned_department ||
                    'Not Assigned';
                  const schoolName =
                    user.intern?.school?.name ||
                    (user as any).school?.name ||
                    user.school ||
                    'Not Assigned';

                  const dbAvatar = user.profile?.avatar_url || user.profile_picture || user.intern?.avatar_url;
                  const finalAvatarSrc = dbAvatar 
                    ? (dbAvatar.startsWith('http') ? dbAvatar : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${dbAvatar}`)
                    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.first_name + user.id}`;

                  return (
                    <tr
                      key={user.id}
                      className={`transition-colors duration-150 ${
                        isSelected(user.id)
                          ? 'bg-blue-50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-4 px-4 border-b border-slate-100 text-[13px] text-slate-500 align-middle w-10">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 cursor-pointer m-0 accent-[#0B1EAE]"
                          checked={isSelected(user.id)}
                          onChange={() => toggleInternSelection(user)}
                        />
                      </td>

                      <td className="py-4 px-4 border-b border-slate-100 text-[13px] text-slate-500 align-middle">
                        <div
                          className="flex items-center gap-[10px] cursor-pointer group"
                          onClick={() => {
                            if (user.id) {
                              dispatch(openProfile(user.id));
                            } else {
                              alert('Sync Error: Account ID missing.');
                            }
                          }}
                          title="View Full Profile"
                        >
                          <div className="w-[34px] h-[34px] rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:ring-[2.5px] group-hover:ring-[#0B1EAE] group-hover:ring-offset-2 transition-all duration-300">
                            <img
                              src={finalAvatarSrc}
                              alt={`${user.first_name}'s avatar`}
                              className="w-full h-full object-cover"
                              style={{
                                filter:
                                  viewMode === 'archived'
                                    ? 'grayscale(100%)'
                                    : 'none',
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.first_name + user.id}`;
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <p
                              className="text-[13px] font-semibold m-0 mb-0.5 transition-colors group-hover:text-[#0B1EAE]"
                              style={{
                                color:
                                  viewMode === 'archived'
                                    ? '#64748b'
                                    : '#0f172a',
                              }}
                            >
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-[11px] text-slate-500 m-0">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 border-b border-slate-100 text-[13px] text-slate-500 align-middle">
                        {departmentName}
                      </td>

                      <td
                        className="py-4 px-4 border-b border-slate-100 text-[13px] text-slate-500 align-middle"
                        title={
                          schoolName !== 'Not Assigned' ? schoolName : ''
                        }
                      >
                        {schoolName !== 'Not Assigned'
                          ? getSchoolAbbreviation(schoolName)
                          : 'Not Assigned'}
                      </td>

                      <td className="py-4 px-4 border-b border-slate-100 text-[13px] text-slate-500 align-middle">
                        {formatDate(user, viewMode)}
                      </td>

                      <td className="py-4 px-4 border-b border-slate-100 text-[13px] text-slate-500 align-middle">
                        <span
                          className={`px-2 py-1 rounded-xl text-[11px] font-bold ${
                            user.status?.toLowerCase() === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {viewMode === 'archived'
                            ? 'Archived'
                            : user.status || 'Unknown'}
                        </span>
                      </td>

                      <td className="py-4 px-4 border-b border-slate-100 text-[13px] text-slate-500 align-middle text-right">
                        <button
                          className="bg-transparent border-none p-1 rounded-xl text-slate-400 cursor-pointer flex items-center justify-center hover:bg-slate-100 hover:text-[#0B1EAE]"
                          onClick={() => {
                            setSelectedInternModal({
                              id: user.id,
                              name: `${user.first_name} ${user.last_name}`,
                              email: user.email,
                              department: departmentName,
                              school: schoolName,
                              course:
                                user.intern?.course ||
                                user.course ||
                                'Not Assigned',
                              emergency_name:
                                user.intern?.emergency_name || 'NOT PROVIDED',
                              emergency_number:
                                user.intern?.emergency_number ||
                                'NOT PROVIDED',
                              emergency_address:
                                user.intern?.emergency_address ||
                                'NOT PROVIDED',
                              avatar_url: finalAvatarSrc,
                              rawData: user,
                            });
                          }}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intern Details Modal */}
      {selectedInternModal && (
        <InternDetailsModal
          intern={selectedInternModal}
          onClose={() => setSelectedInternModal(null)}
        />
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedInterns.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-xl border border-slate-200 p-2.5 px-3.5 flex items-center gap-1.5 z-40 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="bg-[#0B1EAE] text-white min-w-[20px] h-5 rounded-xl inline-flex items-center justify-center text-[11px] font-bold px-1.5">
              {selectedInterns.length}
            </span>
            <span className="text-[13px] font-bold text-slate-900">
              Selected
            </span>
          </div>
          <div className="w-px h-5 bg-slate-200 mx-1.5" />
          <div className="flex items-center gap-1.5">
            {viewMode === 'active' ? (
              <button
                onClick={() => setActiveBulkModal('archive')}
                className="border border-red-200 rounded-xl px-3 py-[7px] text-[13px] font-semibold bg-white text-red-600 cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 hover:bg-red-50"
              >
                <Archive size={14} /> Archive
              </button>
            ) : (
              <button
                onClick={() => setActiveBulkModal('restore')}
                className="border rounded-xl px-3 py-[7px] text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200"
                style={{
                  backgroundColor: '#16a34a',
                  borderColor: '#16a34a',
                  color: 'white',
                }}
              >
                <ArchiveRestore size={14} /> Restore
              </button>
            )}

            <button
              onClick={() => setActiveBulkModal('export')}
              className="border border-slate-200 rounded-xl px-3 py-[7px] text-[13px] font-semibold bg-white text-slate-500 cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 hover:bg-slate-50"
            >
              <Download size={14} /> Export
            </button>
            <button
              onClick={() => setActiveBulkModal('addHours')}
              className="border rounded-xl px-3 py-[7px] text-[13px] font-semibold bg-[#0B1EAE] text-white border-[#0B1EAE] cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 hover:bg-[#050C48] hover:border-[#050C48]"
            >
              <Clock size={14} /> Add Hours
            </button>
          </div>
          <button
            onClick={clearSelection}
            className="bg-transparent border-none p-1 rounded-xl text-slate-400 cursor-pointer flex items-center justify-center hover:bg-slate-100 hover:text-[#0B1EAE] ml-1.5"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Archive Modal */}
      {activeBulkModal === 'archive' && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 px-[18px] w-full max-w-[500px] max-h-[90vh] overflow-y-auto flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5">
              <Archive size={18} className="text-slate-900 font-bold" />
              <h2 className="text-[15px] font-bold m-0 text-slate-900">
                Archive - Selected Interns
              </h2>
            </div>

            <div className="bg-red-50 rounded-xl p-3 border border-red-200 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-red-600">
                <AlertCircle size={14} />
                <span className="text-[13px] font-bold">
                  Confirm Archiving
                </span>
              </div>
              <p className="text-[12px] text-slate-500 m-0 pl-[19px]">
                Archiving these interns will hide them from the active lists
                and reports. Their data is kept safe, and they can be
                restored at any time.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-1.5">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase mb-0.5">
                  Selected Interns
                </h3>
                <span className="bg-red-600 text-white min-w-[20px] h-5 rounded-xl inline-flex items-center justify-center text-[11px] font-bold px-1.5">
                  {selectedInterns.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedInterns.map((intern, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-[12px] text-slate-500 flex items-center gap-1.5"
                  >
                    <Search size={12} /> {intern.first_name}{' '}
                    {intern.last_name}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase mb-0.5 block">
                Type <span className="text-red-600">ARCHIVE</span> to confirm
              </label>
              <input
                type="text"
                placeholder="Type ARCHIVE here ...."
                value={confirmArchiveText}
                onChange={(e) => setConfirmArchiveText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-900 outline-none bg-white focus:border-[#0B1EAE]"
              />
            </div>

            <div className="flex items-center justify-end gap-1.5 mt-1.5">
              <button
                onClick={() => setActiveBulkModal(null)}
                className="border border-slate-200 rounded-xl px-3 py-[7px] text-[13px] font-semibold bg-white text-slate-500 cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkArchive}
                disabled={
                  confirmArchiveText !== 'ARCHIVE' || isProcessing
                }
                className="border rounded-xl px-3 py-[7px] text-[13px] font-semibold bg-red-600 text-white border-red-600 cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {activeBulkModal === 'restore' && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 px-[18px] w-full max-w-[500px] max-h-[90vh] overflow-y-auto flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5">
              <ArchiveRestore size={18} className="text-slate-900 font-bold" />
              <h2 className="text-[15px] font-bold m-0 text-slate-900">
                Restore - Selected Interns
              </h2>
            </div>

            <div className="bg-green-50 rounded-xl p-3 border border-green-200 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle2 size={14} />
                <span className="text-[13px] font-bold">
                  Confirm Restoration
                </span>
              </div>
              <p className="text-[12px] text-slate-500 m-0 pl-[19px]">
                This will bring the selected interns back to "Active" status,
                making them visible in regular lists and reports again.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-1.5">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase mb-0.5">
                  Selected Interns
                </h3>
                <span
                  className="text-white min-w-[20px] h-5 rounded-xl inline-flex items-center justify-center text-[11px] font-bold px-1.5"
                  style={{ background: '#16a34a' }}
                >
                  {selectedInterns.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedInterns.map((intern, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-[12px] text-slate-500 flex items-center gap-1.5"
                  >
                    <Search size={12} /> {intern.first_name}{' '}
                    {intern.last_name}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 mt-[15px]">
              <button
                onClick={() => setActiveBulkModal(null)}
                className="border border-slate-200 rounded-xl px-3 py-[7px] text-[13px] font-semibold bg-white text-slate-500 cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkRestore}
                disabled={isProcessing}
                className="border rounded-xl px-3 py-[7px] text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#16a34a',
                  borderColor: '#16a34a',
                  color: 'white',
                }}
              >
                {isProcessing ? 'Restoring...' : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {activeBulkModal === 'export' && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 px-[18px] w-full max-w-[500px] max-h-[90vh] overflow-y-auto flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5">
              <Clock size={18} className="text-slate-900 font-bold" />
              <h2 className="text-[15px] font-bold m-0 text-slate-900">
                Export - Selected Interns
              </h2>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col gap-1.5">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase mb-0.5">
                Selected Interns
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedInterns.map((intern, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-[12px] text-slate-500 flex items-center gap-1.5"
                  >
                    <Search size={12} /> {intern.first_name}{' '}
                    {intern.last_name}
                  </div>
                ))}
              </div>
            </div>

            <h3 className="text-[11px] font-bold text-slate-500 uppercase mb-0.5">
              What to Export?
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                {
                  id: 'info',
                  icon: <Search size={18} />,
                  title: 'Intern Info',
                  desc: 'Name, School, Dept...',
                },
                {
                  id: 'log',
                  icon: <Clock size={18} />,
                  title: 'Attendance Log',
                  desc: 'Time-in/out history',
                },
                {
                  id: 'progress',
                  icon: <Activity size={18} />,
                  title: 'Hours Progress',
                  desc: 'Rendered vs Required',
                },
                {
                  id: 'full',
                  icon: <File size={18} />,
                  title: 'Full Report',
                  desc: 'All data combined',
                },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setExportType(opt.id)}
                  className={`border rounded-xl p-2.5 cursor-pointer flex items-start gap-2 bg-white ${
                    exportType === opt.id
                      ? 'border-[#0B1EAE] bg-slate-50'
                      : 'border-slate-200'
                  }`}
                >
                  <div
                    style={{
                      color: exportType === opt.id ? '#0B1EAE' : '#64748b',
                    }}
                  >
                    {opt.icon}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-[13px] font-bold m-0 text-slate-900">
                      {opt.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 m-0">
                      {opt.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
              <div className="flex flex-col gap-1.5">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase mb-0.5">
                  Data Range
                </h3>
                <select 
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-900 outline-none bg-white focus:border-[#0B1EAE]"
                >
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="All Time">All Time</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase mb-0.5">
                  File Format
                </h3>
                <div className="flex items-center gap-1.5">
                  {['Excel', 'CSV', 'PDF'].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      className={`flex-1 border rounded-xl px-3 py-[7px] text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 ${
                        exportFormat === fmt
                          ? 'bg-[#0B1EAE] text-white border-[#0B1EAE] hover:bg-[#050C48]'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 mt-1.5">
              <button
                onClick={() => setActiveBulkModal(null)}
                className="border border-slate-200 rounded-xl px-3 py-[7px] text-[13px] font-semibold bg-white text-slate-500 cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkExport}
                disabled={isProcessing}
                className="border rounded-xl px-3 py-[7px] text-[13px] font-semibold bg-[#0B1EAE] text-white border-[#0B1EAE] cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 hover:bg-[#050C48] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Hours Modal */}
      {activeBulkModal === 'addHours' && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 px-[18px] w-full max-w-[500px] max-h-[90vh] overflow-y-auto flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5">
              <Clock size={18} className="text-slate-900 font-bold" />
              <h2 className="text-[15px] font-bold m-0 text-slate-900">
                Add Hours - Selected Interns
              </h2>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col gap-1.5">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase mb-0.5">
                Selected Interns
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedInterns.map((intern, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-[12px] text-slate-500 flex items-center gap-1.5"
                  >
                    <Search size={12} /> {intern.first_name}{' '}
                    {intern.last_name}
                  </div>
                ))}
              </div>
            </div>

            {/* ✨ UPDATED EVENT TYPES (Added Late and Half Day) */}
            <div className="flex flex-col gap-1.5">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase mb-0.5">
                Event Type / Status
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['Regular Day', 'Late', 'Half Day', 'Event/ Activity', 'Makeup Hours'].map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => setEventType(type)}
                      className={`border rounded-xl px-3 py-[7px] text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 ${
                        eventType === type
                          ? 'bg-[#0B1EAE] text-white border-[#0B1EAE] hover:bg-[#050C48]'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* ✨ UPDATED INPUT METHODS (Added AM/PM Half Days) */}
            <div className="flex flex-col gap-1.5">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase mb-0.5">
                Input Method
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setHoursInputType('time')}
                  className={`border rounded-xl px-3 py-[7px] text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    hoursInputType === 'time'
                      ? 'bg-[#0B1EAE] text-white border-[#0B1EAE] hover:bg-[#050C48]'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Exact Time
                </button>
                <button
                  onClick={() => setHoursInputType('full_day')}
                  className={`border rounded-xl px-3 py-[7px] text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    hoursInputType === 'full_day'
                      ? 'bg-[#0B1EAE] text-white border-[#0B1EAE] hover:bg-[#050C48]'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Full Day (8 hrs)
                </button>
                <button
                  onClick={() => setHoursInputType('half_day_am')}
                  className={`border rounded-xl px-3 py-[7px] text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    hoursInputType === 'half_day_am'
                      ? 'bg-[#0B1EAE] text-white border-[#0B1EAE] hover:bg-[#050C48]'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Half Day AM
                </button>
                <button
                  onClick={() => setHoursInputType('half_day_pm')}
                  className={`border rounded-xl px-3 py-[7px] text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    hoursInputType === 'half_day_pm'
                      ? 'bg-[#0B1EAE] text-white border-[#0B1EAE] hover:bg-[#050C48]'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Half Day PM
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase mb-0.5 block">
                Assign To Date
              </label>
              <input
                type="date"
                value={addHoursForm.date}
                onChange={(e) =>
                  setAddHoursForm({ ...addHoursForm, date: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-900 outline-none bg-white focus:border-[#0B1EAE]"
              />
            </div>

            {hoursInputType === 'time' && (
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase mb-0.5 block">
                    Time In
                  </label>
                  <input
                    type="time"
                    value={addHoursForm.timeIn}
                    onChange={(e) =>
                      setAddHoursForm({
                        ...addHoursForm,
                        timeIn: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-900 outline-none bg-white focus:border-[#0B1EAE]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase mb-0.5 block">
                    Time Out
                  </label>
                  <input
                    type="time"
                    value={addHoursForm.timeOut}
                    onChange={(e) =>
                      setAddHoursForm({
                        ...addHoursForm,
                        timeOut: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-900 outline-none bg-white focus:border-[#0B1EAE]"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase mb-0.5 block">
                Event / Reason
              </label>
              <input
                type="text"
                placeholder="Input Reason"
                value={addHoursForm.reason}
                onChange={(e) =>
                  setAddHoursForm({
                    ...addHoursForm,
                    reason: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-900 outline-none bg-white focus:border-[#0B1EAE]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase mb-0.5 block">
                Admin Notes
              </label>
              <textarea
                rows={3}
                placeholder="Add Notes"
                value={addHoursForm.notes}
                onChange={(e) =>
                  setAddHoursForm({
                    ...addHoursForm,
                    notes: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-900 outline-none bg-white focus:border-[#0B1EAE] resize-none font-[inherit]"
              />
            </div>

            <div className="flex items-center justify-end gap-1.5 mt-1.5">
              <button
                onClick={() => setActiveBulkModal(null)}
                className="border border-slate-200 rounded-xl px-3 py-[7px] text-[13px] font-semibold bg-white text-slate-500 cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAddHours}
                disabled={isProcessing}
                className="border rounded-xl px-3 py-[7px] text-[13px] font-semibold bg-[#0B1EAE] text-white border-[#0B1EAE] cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 hover:bg-[#050C48] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}