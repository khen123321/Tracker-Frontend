import React, { useState, useEffect, useMemo } from 'react';
import { 
  Filter, Building2, GraduationCap, 
  MapPin, Calendar, BarChart3, Users, FileSpreadsheet
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../../api/axios';
import toast, { Toaster } from 'react-hot-toast';

// ✨ IMPORT YOUR UNIFIED PAGE HEADER ✨
import PageHeader from '../../components/layout/PageHeader';

// ─── TYPES & INTERFACES ───
interface InternRecord {
  id: string | number;
  first_name?: string;
  last_name?: string;
  school?: string | { name?: string };
  department?: string | { name?: string };
  branch?: { name?: string };
  created_at?: string;
  attendance_logs_sum_hours_rendered?: string | number;
  intern?: {
    school?: { name?: string };
    department?: { name?: string };
    branch?: { name?: string };
    required_hours?: string | number;
    hours_rendered?: string | number;
    date_started?: string;
  };
  rawData?: {
    intern?: {
      school?: { name?: string };
      department?: { name?: string };
    }
  };
  [key: string]: any; // Catch-all for dynamic Laravel data
}

interface FilterState {
  department: string;
  school: string;
  branch: string;
  completionRange: string;
  monthYear: string;
}

interface SchoolAnalytics {
  name: string;
  totalInterns: number;
  totalReq: number;
  totalRen: number;
  completed: number;
  avgProgress: string | number;
  active: number;
}

// ─── SKELETON PRIMITIVES ───
interface SkProps {
  w?: string;
  h?: string;
  r?: string;
  mb?: string;
}

function Sk({ w = '100%', h = '16px', r = '8px', mb = '0' }: SkProps) {
  return (
    <div 
      className="shrink-0 bg-gradient-to-r from-[#e8ecf2] via-[#f4f6fa] to-[#e8ecf2] bg-[length:700px_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" 
      style={{ width: w, height: h, borderRadius: r, marginBottom: mb }} 
    />
  );
}

// ─── FULL PAGE SKELETON SCREEN ───
function ExportReportsSkeleton() {
  return (
    <div className="flex flex-col gap-[5px] p-3 bg-[#f8f9fc] min-h-screen font-sans text-slate-900">
      {/* Skeleton Header */}
      <div className="flex justify-between items-center py-3.5 px-5 bg-white rounded-[10px] border border-slate-200">
        <Sk w="200px" h="26px" r="6px" />
        <div className="flex gap-3">
          <Sk w="36px" h="36px" r="8px" />
          <Sk w="210px" h="36px" r="999px" />
        </div>
      </div>

      {/* Skeleton Toolbar */}
      <div className="flex justify-between items-center bg-white py-3 px-5 rounded-[10px] border border-slate-200">
        <div className="flex items-center gap-2">
          <Sk w="180px" h="36px" r="8px" />
          <Sk w="180px" h="36px" r="8px" />
        </div>
        <Sk w="140px" h="36px" r="8px" />
      </div>

      {/* Skeleton Filters */}
      <div className="bg-white rounded-[10px] border border-slate-200 p-5 flex flex-col">
        <Sk w="140px" h="16px" mb="16px" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex flex-col gap-1.5">
              <Sk w="90px" h="14px" mb="6px" />
              <Sk w="100%" h="38px" r="8px" />
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton Table Card */}
      <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 px-5 border-b border-slate-100 bg-white">
          <Sk w="220px" h="20px" r="4px" />
        </div>
        <div className="p-5">
          <Sk w="100%" h="40px" mb="12px" r="6px" />
          <Sk w="100%" h="40px" mb="12px" r="6px" />
          <Sk w="100%" h="40px" mb="12px" r="6px" />
          <Sk w="100%" h="40px" mb="12px" r="6px" />
          <Sk w="100%" h="40px" r="6px" />
        </div>
      </div>
    </div>
  );
}

export default function ExportReports() {
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const [interns, setInterns] = useState<InternRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'ojt' | 'school'>('ojt');

  // ─── FILTER STATES ───
  const [filters, setFilters] = useState<FilterState>({
    department: 'All',
    school: 'All',
    branch: 'All',
    completionRange: 'All',
    monthYear: '' 
  });

  // ─── FETCH DATA ───
  const fetchReportData = async () => {
    try {
      const response = await api.get('/hr/interns');
      setInterns(response.data || []);
    } catch (err) {
      console.error("Error fetching report data", err);
      toast.error("Failed to load report data.");
    } finally {
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // ✨ HELPER FUNCTION: BULLETPROOF SCHOOL EXTRACTION ✨
  const extractSchoolName = (intern: InternRecord): string => {
    return (typeof intern.school === 'string' ? intern.school : intern.school?.name) || 
           intern.intern?.school?.name || 
           intern?.rawData?.intern?.school?.name || 
           'Unassigned';
  };

  // ✨ HELPER FUNCTION: BULLETPROOF DEPT EXTRACTION ✨
  const extractDeptName = (intern: InternRecord): string => {
    return (typeof intern.department === 'string' ? intern.department : intern.department?.name) || 
           intern.intern?.department?.name || 
           intern?.rawData?.intern?.department?.name || 
           'Unassigned';
  };

  // ─── DYNAMIC UNIQUE VALUES FOR DROPDOWNS ───
  const uniqueDepts = useMemo(() => ['All', ...new Set(interns.map(extractDeptName).filter(Boolean))], [interns]);
  const uniqueSchools = useMemo(() => ['All', ...new Set(interns.map(extractSchoolName).filter(Boolean))], [interns]);
  const uniqueBranches = useMemo(() => ['All', ...new Set(interns.map(i => i.intern?.branch?.name || i.branch?.name || 'Unassigned').filter(Boolean))], [interns]);

  // ─── FILTER & PROGRESS LOGIC ───
  const filteredInterns = useMemo(() => {
    return interns.filter(intern => {
      const dept = extractDeptName(intern);
      const school = extractSchoolName(intern);
      const branch = intern.intern?.branch?.name || intern.branch?.name || 'Unassigned';
      
      const reqHours = parseFloat((intern.intern?.required_hours as string) || '486');
      const renHours = parseFloat((intern.attendance_logs_sum_hours_rendered as string) || (intern.intern?.hours_rendered as string) || '0');
      
      let progress = 0;
      if (reqHours > 0 && renHours > 0) {
          progress = (renHours / reqHours) * 100;
      }
      if (progress > 100) progress = 100;
      if (isNaN(progress)) progress = 0;

      const dateStarted = intern.intern?.date_started || intern.created_at;
      const startMonthYear = dateStarted ? dateStarted.substring(0, 7) : '';

      let matchesRange = true;
      if (filters.completionRange === 'Below 25%') matchesRange = progress < 25;
      else if (filters.completionRange === '25-50%') matchesRange = progress >= 25 && progress < 50;
      else if (filters.completionRange === '50-75%') matchesRange = progress >= 50 && progress < 75;
      else if (filters.completionRange === '75-99%') matchesRange = progress >= 75 && progress < 100;
      else if (filters.completionRange === 'Completed') matchesRange = progress >= 100;

      const matchesDept = filters.department === 'All' || dept === filters.department;
      const matchesSchool = filters.school === 'All' || school === filters.school;
      const matchesBranch = filters.branch === 'All' || branch === filters.branch;
      const matchesMonth = !filters.monthYear || startMonthYear === filters.monthYear;

      return matchesDept && matchesSchool && matchesBranch && matchesRange && matchesMonth;
    });
  }, [interns, filters]);

  // ─── SCHOOL ANALYTICS AGGREGATION ───
  const schoolAnalyticsData = useMemo(() => {
    const dataMap: Record<string, SchoolAnalytics> = {};
    
    filteredInterns.forEach(intern => {
      const school = extractSchoolName(intern);
      
      if (!dataMap[school]) {
        dataMap[school] = { name: school, totalInterns: 0, totalReq: 0, totalRen: 0, completed: 0, avgProgress: 0, active: 0 };
      }
      
      dataMap[school].totalInterns += 1;
      
      const req = parseFloat((intern.intern?.required_hours as string) || '486');
      const ren = parseFloat((intern.attendance_logs_sum_hours_rendered as string) || (intern.intern?.hours_rendered as string) || '0');
      
      dataMap[school].totalReq += req;
      dataMap[school].totalRen += ren;
      
      if (ren >= req && req > 0) {
        dataMap[school].completed += 1;
      }
    });

    return Object.values(dataMap).map(school => ({
      ...school,
      avgProgress: school.totalReq > 0 ? ((school.totalRen / school.totalReq) * 100).toFixed(1) : 0,
      active: school.totalInterns - school.completed
    })).sort((a, b) => b.totalInterns - a.totalInterns);
  }, [filteredInterns]);

  // ─── HELPER COMPONENTS ───
  const getProgressColor = (percent: number): string => {
    if (percent >= 100) return '#22C55E'; 
    if (percent >= 75) return '#3B82F6';  
    if (percent >= 50) return '#EAB308';  
    if (percent >= 25) return '#F97316';  
    return '#EF4444'; 
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // ─── EXPORT LOGIC ───
  const handleExport = async () => {
    const loadingToast = toast.loading(`Preparing ${activeTab === 'ojt' ? 'OJT Completion' : 'School Analytics'} export...`);
    
    try {
      const payload = {
        report_type: activeTab,
        filters: filters
      };

      const response = await api.post('/hr/reports/export', payload, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CLIMBS_${activeTab.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Export downloaded successfully!", { id: loadingToast });
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to generate export file.", { id: loadingToast });
    }
  };

  if (initialLoad) return <ExportReportsSkeleton />;

  return (
    <div className="flex flex-col gap-[5px] p-3 bg-[#f8f9fc] min-h-screen font-sans text-slate-900">
      
      {/* Required for the skeleton shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -700px 0; }
          100% { background-position: 700px 0; }
        }
      `}</style>

      <Toaster position="top-right" />
      
      {/* ✨ UNIFIED PAGE HEADER ✨ */}
      <PageHeader title="Reports" />

      {/* ✨ TOOLBAR: TABS + EXPORT BUTTON ✨ */}
      <div className="flex justify-between items-center bg-white py-3 px-5 rounded-[10px] border border-slate-200">
        <div className="flex items-center gap-2">
          <button 
            className={`flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg py-2 px-4 text-[13px] font-semibold text-slate-500 cursor-pointer transition-all hover:bg-slate-100 ${activeTab === 'ojt' ? '!bg-[#0B1EAE] !text-white !border-[#0B1EAE]' : ''}`}
            onClick={() => setActiveTab('ojt')}
          >
            <Users size={16} /> OJT Completion Report
          </button>
          <button 
            className={`flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg py-2 px-4 text-[13px] font-semibold text-slate-500 cursor-pointer transition-all hover:bg-slate-100 ${activeTab === 'school' ? '!bg-[#0B1EAE] !text-white !border-[#0B1EAE]' : ''}`}
            onClick={() => setActiveTab('school')}
          >
            <BarChart3 size={16} /> School Analytics Report
          </button>
        </div>
        
        <button onClick={handleExport} className="flex items-center gap-1.5 bg-green-600 text-white border-none py-2 px-4 rounded-lg font-semibold text-[13px] transition-colors hover:bg-green-700">
          <FileSpreadsheet size={16} /> Export {activeTab === 'ojt' ? 'Data' : 'Analytics'}
        </button>
      </div>

      {/* ─── MASTER FILTER PANEL ─── */}
      <div className="bg-white rounded-[10px] border border-slate-200 p-5 flex flex-col">
        <div className="flex items-center gap-2 text-[13px] font-bold text-slate-600 uppercase tracking-[0.5px] mb-4">
          <Filter size={16} /> <span>Report Filters</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
          
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Building2 size={14}/> Department</label>
            <select name="department" value={filters.department} onChange={handleFilterChange} className="w-full py-[9px] pr-9 pl-3 border border-slate-200 rounded-lg text-[13px] text-slate-700 bg-white outline-none transition-colors focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10">
              {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><GraduationCap size={14}/> School / University</label>
            <select name="school" value={filters.school} onChange={handleFilterChange} className="w-full py-[9px] pr-9 pl-3 border border-slate-200 rounded-lg text-[13px] text-slate-700 bg-white outline-none transition-colors focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10">
              {uniqueSchools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><MapPin size={14}/> Branch</label>
            <select name="branch" value={filters.branch} onChange={handleFilterChange} className="w-full py-[9px] pr-9 pl-3 border border-slate-200 rounded-lg text-[13px] text-slate-700 bg-white outline-none transition-colors focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10">
              {uniqueBranches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {activeTab === 'ojt' && (
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><BarChart3 size={14}/> Completion Range</label>
              <select name="completionRange" value={filters.completionRange} onChange={handleFilterChange} className="w-full py-[9px] pr-9 pl-3 border border-slate-200 rounded-lg text-[13px] text-slate-700 bg-white outline-none transition-colors focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10">
                <option value="All">All Progress</option>
                <option value="Below 25%">Below 25%</option>
                <option value="25-50%">25% – 50%</option>
                <option value="50-75%">50% – 75%</option>
                <option value="75-99%">75% – 99%</option>
                <option value="Completed">Completed (100%)</option>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Calendar size={14}/> Intake Month</label>
            <input 
              type="month" 
              name="monthYear" 
              value={filters.monthYear} 
              onChange={handleFilterChange} 
              className="w-full py-[9px] pr-9 pl-3 border border-slate-200 rounded-lg text-[13px] text-slate-700 bg-white outline-none transition-colors focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10"
            />
          </div>

        </div>
      </div>

      {/* ─── TAB 1: OJT COMPLETION REPORT ─── */}
      {activeTab === 'ojt' && (
        <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-4 px-5 border-b border-slate-100 bg-white">
            <h3 className="text-[15px] font-bold text-slate-900 m-0">Intern Progress Tracking ({filteredInterns.length})</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr>
                  <th className="bg-slate-50 p-3 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap border-b border-slate-200">Intern Name</th>
                  <th className="bg-slate-50 p-3 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap border-b border-slate-200">School</th>
                  <th className="bg-slate-50 p-3 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap border-b border-slate-200">Department</th>
                  <th className="bg-slate-50 p-3 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap border-b border-slate-200">Required</th>
                  <th className="bg-slate-50 p-3 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap border-b border-slate-200">Rendered</th>
                  <th className="bg-slate-50 p-3 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap border-b border-slate-200" style={{ width: '250px' }}>Progress</th>
                  <th className="bg-slate-50 p-3 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap border-b border-slate-200">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterns.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-[60px] px-5 text-slate-400 text-[13px] italic border-b border-slate-100">No interns match the current filters.</td></tr>
                ) : (
                  filteredInterns.map(intern => {
                    const req = parseFloat((intern.intern?.required_hours as string) || '486');
                    const ren = parseFloat((intern.attendance_logs_sum_hours_rendered as string) || (intern.intern?.hours_rendered as string) || '0');
                    
                    const displaySchool = extractSchoolName(intern);
                    const displayDept = extractDeptName(intern);

                    let percent = 0;
                    if (req > 0 && ren > 0) {
                        percent = (ren / req) * 100;
                    }
                    
                    if (percent > 100) percent = 100;
                    if (isNaN(percent)) percent = 0;

                    const color = getProgressColor(percent);

                    return (
                      <tr key={intern.id} className="transition-colors hover:bg-slate-50">
                        <td className="p-4 px-5 whitespace-nowrap border-b border-slate-100 font-semibold text-slate-900">{intern.first_name} {intern.last_name}</td>
                        <td className="p-4 px-5 whitespace-nowrap border-b border-slate-100 text-slate-500 text-xs">{displaySchool}</td>
                        <td className="p-4 px-5 whitespace-nowrap border-b border-slate-100 text-slate-500 text-xs">{displayDept}</td>
                        <td className="p-4 px-5 whitespace-nowrap border-b border-slate-100 font-mono text-[13px] font-semibold text-blue-800">{req} hrs</td>
                        <td className="p-4 px-5 whitespace-nowrap border-b border-slate-100 font-mono text-[13px] font-semibold text-blue-800">{ren.toFixed(1)} hrs</td>
                        
                        <td className="p-4 px-5 whitespace-nowrap border-b border-slate-100">
                          <div className="flex flex-col gap-1.5 w-full">
                            <div className="text-[11px] font-bold text-slate-600 text-right">
                              <span>{percent.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-[400ms] ease-in-out" 
                                style={{ width: `${percent}%`, backgroundColor: color }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 px-5 whitespace-nowrap border-b border-slate-100">
                          {percent >= 100 ? (
                            <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-[10px] text-[11px] font-bold border whitespace-nowrap text-green-800 border-green-500 bg-green-50">Completed</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-[10px] text-[11px] font-bold border whitespace-nowrap text-blue-700 border-blue-500 bg-blue-50">On-going</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SCHOOL ANALYTICS REPORT ─── */}
      {activeTab === 'school' && (
        <div className="flex flex-col gap-[5px]">
          
          <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden flex flex-col" style={{ flex: '1 1 100%' }}>
            <div className="flex justify-between items-center p-4 px-5 border-b border-slate-100 bg-white">
              <h3 className="text-[15px] font-bold text-slate-900 m-0">Intern Distribution by School</h3>
            </div>
            <div className="h-[350px] p-5">
              {schoolAnalyticsData.length === 0 ? (
                <div className="text-center py-[60px] px-5 text-slate-400 text-[13px] italic">No data to chart.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={schoolAnalyticsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="active" name="Active Interns" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden flex flex-col" style={{ flex: '1 1 100%' }}>
            <div className="flex justify-between items-center p-4 px-5 border-b border-slate-100 bg-white">
              <h3 className="text-[15px] font-bold text-slate-900 m-0">Institutional Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr>
                    <th className="bg-slate-50 p-3 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap border-b border-slate-200">School / University</th>
                    <th className="bg-slate-50 p-3 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap border-b border-slate-200" style={{ textAlign: 'center' }}>Total Interns</th>
                    <th className="bg-slate-50 p-3 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap border-b border-slate-200" style={{ textAlign: 'center' }}>Active</th>
                    <th className="bg-slate-50 p-3 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap border-b border-slate-200" style={{ textAlign: 'center' }}>Completed</th>
                    <th className="bg-slate-50 p-3 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap border-b border-slate-200" style={{ textAlign: 'right' }}>Avg. Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolAnalyticsData.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-[60px] px-5 text-slate-400 text-[13px] italic border-b border-slate-100">No data matches filters.</td></tr>
                  ) : (
                    schoolAnalyticsData.map((school, index) => (
                      <tr key={index} className="transition-colors hover:bg-slate-50">
                        <td className="p-4 px-5 whitespace-nowrap border-b border-slate-100 font-semibold text-slate-900">{school.name}</td>
                        <td className="p-4 px-5 whitespace-nowrap border-b border-slate-100 font-mono text-[13px] font-semibold text-blue-800" style={{ textAlign: 'center', fontWeight: '800' }}>{school.totalInterns}</td>
                        <td className="p-4 px-5 whitespace-nowrap border-b border-slate-100 font-mono text-[13px] font-semibold text-blue-800" style={{ textAlign: 'center', color: '#3B82F6' }}>{school.active}</td>
                        <td className="p-4 px-5 whitespace-nowrap border-b border-slate-100 font-mono text-[13px] font-semibold text-blue-800" style={{ textAlign: 'center', color: '#22C55E' }}>{school.completed}</td>
                        <td className="p-4 px-5 whitespace-nowrap border-b border-slate-100" style={{ textAlign: 'right' }}>
                           <span className="inline-block py-1 px-2.5 rounded-md font-bold text-xs" style={{ backgroundColor: getProgressColor(school.avgProgress as number) + '20', color: getProgressColor(school.avgProgress as number) }}>
                             {school.avgProgress}%
                           </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}