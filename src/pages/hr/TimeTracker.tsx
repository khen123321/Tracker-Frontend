import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/axios';
import { Search, AlertCircle, ChevronDown } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';

// ─── TYPES ───────────────────────────────────────────────────
interface AttendanceLog {
  status?: string;
  time_in?: string;
  time_out?: string;
  lunch_out?: string;
  lunch_in?: string;
  hours_rendered?: number;
}

interface Intern {
  department?: { name: string };
  school?: { name: string };
  required_hours?: number;
}

interface InternUser {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  attendance_logs?: AttendanceLog[];
  attendance_logs_sum_hours_rendered?: number;
  intern?: Intern;
  department?: { name: string };
  school?: { name: string } | string;
  assigned_department?: string;
}

interface Stats {
  present: number;
  absent: number;
  late: number;
  active: number;
}

// ─── SKELETON PRIMITIVE ───────────────────────────────────────
function Sk({ w = '100%', h = 16, r = 6, mb = 0 }: { w?: string | number; h?: number; r?: number; mb?: number }) {
  return (
    <div
      className="rounded-[10px] flex-shrink-0"
      style={{
        width: w,
        height: h,
        borderRadius: r,
        marginBottom: mb,
        background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
        backgroundSize: '700px 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
const TimeTracker: React.FC = () => {
  const [interns, setInterns] = useState<InternUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ present: 0, absent: 0, late: 0, active: 0 });
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [schoolFilter, setSchoolFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const formatTime = (timeString?: string): string => {
    if (!timeString) return '-----';
    try {
      const clean = timeString.includes(' ') ? timeString.replace(' ', 'T') : timeString;
      const date = clean.includes('T') || clean.includes('-')
        ? new Date(clean)
        : new Date(`1970-01-01T${clean}`);
      if (isNaN(date.getTime())) return '-----';
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '-----';
    }
  };

  const fetchAttendance = useCallback(async () => {
    try {
      const response = await api.get('/hr/interns', { params: { date: selectedDate } });
      const data: InternUser[] = response.data;
      setInterns(data);

      const logs = data.map(u => u.attendance_logs?.[0]);
      setStats({
        present: logs.filter(l => l?.status?.toLowerCase() === 'present').length,
        absent:  logs.filter(l => !l || l?.status?.toLowerCase() === 'absent').length,
        late:    logs.filter(l => l?.status?.toLowerCase() === 'late').length,
        active:  logs.filter(l => l?.time_in && !l?.time_out).length,
      });
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Unable to sync with the attendance database.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 30000);
    return () => clearInterval(interval);
  }, [fetchAttendance]);

  const uniqueDepartments = useMemo(() =>
    ['All', ...new Set(interns.map(i => i.intern?.department?.name || i.department?.name || i.assigned_department || 'Not Assigned'))],
    [interns]
  );

  const uniqueSchools = useMemo(() =>
    ['All', ...new Set(interns.map(i => i.intern?.school?.name || (typeof i.school === 'object' ? i.school?.name : i.school) || 'Not Assigned'))],
    [interns]
  );

  const uniqueStatuses = useMemo(() => {
    const baseStatuses = ['All', 'Present', 'Absent', 'Late'];
    const dynamicStatuses = interns.map(i => {
      const st = i.attendance_logs?.[0]?.status || 'absent';
      return st.charAt(0).toUpperCase() + st.slice(1).toLowerCase();
    });
    return [...new Set([...baseStatuses, ...dynamicStatuses])];
  }, [interns]);

  const processedInterns = useMemo(() => {
    return interns.filter(user => {
      const log = user.attendance_logs?.[0];
      const name = `${user.first_name} ${user.last_name}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      const dept = user.intern?.department?.name || user.department?.name || user.assigned_department || 'Not Assigned';
      const school = user.intern?.school?.name || (typeof user.school === 'object' ? user.school?.name : user.school) || 'Not Assigned';
      const status = (log?.status || 'absent').toLowerCase();

      const matchesSearch = name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
      const matchesDept   = deptFilter === 'All' || dept === deptFilter;
      const matchesSchool = schoolFilter === 'All' || school === schoolFilter;
      const matchesStatus = statusFilter === 'All' || status === statusFilter.toLowerCase();

      return matchesSearch && matchesDept && matchesSchool && matchesStatus;
    });
  }, [interns, searchTerm, deptFilter, schoolFilter, statusFilter]);

  const getStatusMeta = (status?: string): { label: string; cls: string } => {
    const normalized = status?.toLowerCase() || 'absent';
    switch (normalized) {
      case 'present':  return { label: 'Present',            cls: 'text-[#166534] [&_.dot]:bg-[#22c55e]' };
      case 'late':     return { label: 'Late',               cls: 'text-[#92400e] [&_.dot]:bg-[#f59e0b]' };
      case 'excused':  return { label: 'Excused',            cls: 'text-[#475569] [&_.dot]:bg-[#94a3b8]' };
      case 'overtime': return { label: 'Present (Overtime)', cls: 'text-[#1d4ed8] [&_.dot]:bg-[#3b82f6]' };
      case 'absent':
      default:         return { label: 'Absent',             cls: 'text-[#991b1b] [&_.dot]:bg-[#ef4444]' };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-[5px] p-3 bg-[#f8f9fc] min-h-full">
        <style>{`@keyframes shimmer { 0% { background-position: -700px 0; } 100% { background-position: 700px 0; } }`}</style>

        {/* Skeleton Header */}
        <div className="flex justify-between px-5 py-[14px] bg-white rounded-[10px] border border-[#e8eaf0] mb-6">
          <Sk w={160} h={26} r={6} />
          <div className="flex gap-3">
            <Sk w={36} h={36} r={8} />
            <Sk w={210} h={36} r={999} />
          </div>
        </div>

        {/* Skeleton Stats */}
        <div className="grid grid-cols-4 gap-[5px]">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-[10px] border border-[#e8eaf0] p-3 flex flex-col gap-1">
              <Sk w={90} h={13} mb={10} />
              <Sk w={55} h={38} />
            </div>
          ))}
        </div>

        {/* Skeleton Filters */}
        <div className="flex items-center gap-[5px]">
          <Sk w="33%" h={36} r={10} />
          <Sk w="33%" h={36} r={10} />
          <Sk w="33%" h={36} r={10} />
        </div>

        {/* Skeleton Table */}
        <div className="bg-white rounded-[10px] border border-[#e8eaf0] overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b border-[#f1f5f9]">
            <Sk w={130} h={18} />
            <div className="flex gap-[5px]">
              <Sk w={68} h={32} r={10} />
              <Sk w={36} h={36} r={10} />
            </div>
          </div>

          {/* Skeleton thead */}
          <div className="flex items-center gap-3 px-[14px] py-3 border-b border-[#f1f5f9] bg-[#f8fafc]">
            {[140, 80, 80, 80, 80, 70, 70, 100].map((w, i) => (
              <Sk key={i} w={w} h={11} />
            ))}
          </div>

          {/* Skeleton rows */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-[14px] py-[14px] border-b border-[#f1f5f9] last:border-b-0">
              <div className="flex items-center gap-[10px] flex-[2] min-w-[140px]">
                <Sk w={34} h={34} r={999} />
                <div className="flex flex-col gap-[5px]">
                  <Sk w={115} h={13} />
                  <Sk w={80} h={11} />
                </div>
              </div>
              {[80, 80, 80, 80].map((w, j) => (
                <Sk key={j} w={w} h={13} r={6} />
              ))}
              <Sk w={70} h={13} r={6} />
              <Sk w={90} h={26} r={10} />
              <Sk w={100} h={13} r={6} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[5px] p-3 bg-[#f8f9fc] min-h-full">
      <style>{`@keyframes shimmer { 0% { background-position: -700px 0; } 100% { background-position: 700px 0; } }`}</style>

      <PageHeader title="Time Tracker" />

      {error && (
        <div className="flex items-center gap-[5px] bg-[#fee2e2] text-[#991b1b] p-3 rounded-[10px] text-[13px] font-medium">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-[5px] max-[1024px]:grid-cols-2 max-[640px]:grid-cols-2">
        {[
          { label: 'Present Today', value: stats.present },
          { label: 'Absent Today',  value: stats.absent  },
          { label: 'Late Today',    value: stats.late    },
          { label: 'Active',        value: stats.active  },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-[10px] border border-[#e8eaf0] p-3 flex flex-col gap-1">
            <p className="text-[14px] font-medium text-[#475569] m-0">{label}</p>
            <p className="text-[36px] font-extrabold text-[#0f172a] m-0 leading-none">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-[5px] max-[640px]:flex-col max-[640px]:items-stretch">
        {/* Date input */}
        <div className="relative flex items-center flex-1">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full py-[9px] px-3 pr-9 border border-[#e2e8f0] rounded-[10px] text-[13px] text-[#334155] bg-white appearance-none cursor-pointer outline-none"
          />
        </div>

        {/* Dept filter */}
        <div className="relative flex items-center flex-1">
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="w-full py-[9px] px-3 pr-9 border border-[#e2e8f0] rounded-[10px] text-[13px] text-[#334155] bg-white appearance-none cursor-pointer outline-none"
          >
            {uniqueDepartments.map(d => (
              <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-[10px] text-[#94a3b8] pointer-events-none" />
        </div>

        {/* School filter */}
        <div className="relative flex items-center flex-1">
          <select
            value={schoolFilter}
            onChange={e => setSchoolFilter(e.target.value)}
            className="w-full py-[9px] px-3 pr-9 border border-[#e2e8f0] rounded-[10px] text-[13px] text-[#334155] bg-white appearance-none cursor-pointer outline-none"
          >
            {uniqueSchools.map(s => (
              <option key={s} value={s}>{s === 'All' ? 'All Schools' : s}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-[10px] text-[#94a3b8] pointer-events-none" />
        </div>

        {/* Status filter */}
        <div className="relative flex items-center flex-1">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full py-[9px] px-3 pr-9 border border-[#e2e8f0] rounded-[10px] text-[13px] text-[#334155] bg-white appearance-none cursor-pointer outline-none"
          >
            {uniqueStatuses.map(s => (
              <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-[10px] text-[#94a3b8] pointer-events-none" />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[10px] border border-[#e8eaf0] overflow-hidden">
        {/* Table Header */}
        <div className="flex justify-between items-center p-3 border-b border-[#f1f5f9]">
          <h2 className="text-[16px] font-bold text-[#0f172a] m-0">List Of Interns</h2>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#64748b]"
            />
            <input
              type="text"
              placeholder="Search name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 h-[34px] w-[220px] rounded-lg border border-[#e2e8f0] text-[13px] outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e8eaf0]">
                {['Interns', 'Time In (AM)', 'Lunch Out', 'Time In (PM)', 'Time Out', "Today's Hours", 'Status', 'Overall Progress'].map(h => (
                  <th
                    key={h}
                    className="px-3 py-[10px] text-[11px] font-bold text-[#64748b] uppercase tracking-[0.05em] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processedInterns.length > 0 ? (
                processedInterns.map(user => {
                  const log = user.attendance_logs?.[0];
                  const status = log?.status || 'absent';
                  const { label, cls } = getStatusMeta(status);

                  const rendered = Math.round(user.attendance_logs_sum_hours_rendered || 0);
                  const required = user.intern?.required_hours || 0;
                  const percent  = required > 0 ? Math.min(Math.round((rendered / required) * 100), 100) : 0;

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-[#f1f5f9] last:border-b-0 transition-colors duration-150 hover:bg-[#f8fafc]"
                    >
                      {/* Intern cell */}
                      <td className="px-3 py-3 text-[#334155] whitespace-nowrap">
                        <div className="flex items-center gap-[10px]">
                          <div className="w-[34px] h-[34px] rounded-full bg-[#e2e8f0] flex items-center justify-center text-[#64748b] flex-shrink-0 overflow-hidden">
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.first_name + user.id}`}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-[#0f172a] m-0 mb-[2px] text-[13px]">{user.first_name} {user.last_name}</p>
                            <p className="text-[11px] text-[#94a3b8] m-0">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Time cells */}
                      <td className="px-3 py-3 text-[#1e40af] font-medium font-mono whitespace-nowrap">{formatTime(log?.time_in)}</td>
                      <td className="px-3 py-3 text-[#1e40af] font-medium font-mono whitespace-nowrap">{formatTime(log?.lunch_out)}</td>
                      <td className="px-3 py-3 text-[#1e40af] font-medium font-mono whitespace-nowrap">{formatTime(log?.lunch_in)}</td>
                      <td className="px-3 py-3 text-[#1e40af] font-medium font-mono whitespace-nowrap">{formatTime(log?.time_out)}</td>

                      {/* Duration */}
                      <td className="px-3 py-3 font-semibold text-[#0f172a] whitespace-nowrap">
                        {log?.hours_rendered && log.hours_rendered > 0 ? `${log.hours_rendered} hrs` : '0hrs 00m'}
                      </td>

                      {/* Status badge */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-[5px] px-3 py-[5px] rounded-[10px] text-[12px] font-semibold border border-[#e2e8f0] bg-white whitespace-nowrap ${cls}`}>
                          <span className="dot w-[7px] h-[7px] rounded-full flex-shrink-0" />
                          {label}
                        </span>
                      </td>

                      {/* Overall Progress */}
                      <td className="px-3 py-3 whitespace-nowrap min-w-[110px]">
                        <div className="flex justify-between items-end text-[11px] leading-none mb-[5px]">
                          <span className="font-bold text-[#0B1EAE]">{rendered}</span>
                          <span className="text-[#94a3b8] font-medium">/ {required} hrs</span>
                        </div>
                        <div className="w-full h-[6px] bg-[#f1f5f9] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percent}%`,
                              background: 'linear-gradient(90deg, #E3BD01 0%, #FFDE3C 50%, #FFE359 75%, #FFEFA3 100%)',
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center px-8 py-8 text-[#94a3b8] text-[13px] italic">
                    No interns found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;