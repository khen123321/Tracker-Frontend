import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Award, IdCard, Calendar, Download, Grid, List, Filter,
  Clock, CalendarDays, Activity, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import api from '../../../../api/axios';
import GenerateIdModal from './GenerateIdModal';
import CertificateTemplate from '../components/CertificateTemplate'; 
import html2canvas from 'html2canvas'; 
import { jsPDF } from 'jspdf'; 

interface Intern {
  id: string | number;
  name: string;
  email: string;
  avatar_url?: string | null;
  department?: string;
  school?: string;
  course?: string;
  rawData?: {
    intern?: {
      avatar_url?: string;
      date_started?: string;
      gender?: string;
    };
    date_started?: string;
    created_at?: string;
  };
}

interface AttendanceLog {
  id: string;
  date: string;
  day_of_week?: string;
  status?: string;
  am_in?: string;
  am_out?: string;
  pm_in?: string;
  pm_out?: string;
  total_hours?: number;
}

interface Stats {
  hours: number | string;
  days: number;
  avgIn: string;
  rate: string;
}

interface InternDetailsModalProps {
  intern: Intern;
  onClose: () => void;
}

export default function InternDetailsModal({ intern, onClose }: InternDetailsModalProps) {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [stats, setStats] = useState<Stats>({ hours: 0, days: 0, avgIn: '--:--', rate: '0%' });
  
  const [showIdModal, setShowIdModal] = useState(false);
  
  const [showCertPreview, setShowCertPreview] = useState(false);
  const [isCertLoading, setIsCertLoading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const [base64Avatar, setBase64Avatar] = useState<string | null>(null);

  const [filterPeriod, setFilterPeriod] = useState('This Month');
  const [statusFilter, setStatusFilter] = useState('All'); 

  useEffect(() => {
    const fetchInternAttendance = async () => {
      if (!intern?.id) { 
        setLoading(false); 
        return; 
      }
      try {
        setLoading(true);
        const response = await api.get(`/hr/interns/${intern.id}/attendance`);
        setLogs(response.data.logs || []);
        setStats(response.data.stats || { hours: 0, days: 0, avgIn: '--:--', rate: '0%' });
      } catch (err) {
        console.error("Failed to sync attendance:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInternAttendance();
  }, [intern]);

  if (!intern) return null;

  const formatTime = (time: string | undefined): string => {
    if (!time || time === '00:00:00') return '--:--';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const getSafeDayOfWeek = (log: AttendanceLog): string => {
    if (log.day_of_week) return log.day_of_week; 
    if (!log.date) return '';
    try {
        if (log.date.includes('-')) {
            const [year, month, day] = log.date.split('-');
            const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        }
        const dateObj = new Date(log.date);
        if (!isNaN(dateObj.getTime())) return dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        return '';
    } catch (e) {
        return '';
    }
  };

  const getGridColumnStart = (dateString: string): number => {
    try {
      const parts = dateString.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const day = d.getDay(); 
      if (day === 0 || day === 6) return 1; 
      return day;
    } catch {
      return 1;
    }
  };

  const profilePhotoUrl = intern.avatar_url || intern.rawData?.intern?.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${intern.name || 'default'}`;

  useEffect(() => {
    const convertImageToBase64 = async () => {
      try {
        const response = await fetch(profilePhotoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setBase64Avatar(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Failed to convert profile picture:", err);
        setBase64Avatar(profilePhotoUrl);
      }
    };
    
    if (profilePhotoUrl) {
      convertImageToBase64();
    }
  }, [profilePhotoUrl]);

  const isSameDate = (d1: string | Date, d2: string | Date): boolean => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getFullYear() === date2.getFullYear() && 
           date1.getMonth() === date2.getMonth() && 
           date1.getDate() === date2.getDate();
  };

  const parseSafeDate = (dateString: string | undefined): Date | null => {
    if (!dateString) return null;
    let cleanDate = dateString.split('T')[0].split(' ')[0];
    if (cleanDate.includes('-')) {
        const [year, month, day] = cleanDate.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    const d = new Date(cleanDate);
    return isNaN(d.getTime()) ? null : d;
  };

  const displayLogs = useMemo(() => {
    if (!logs) return [];

    const now = new Date();
    
    const profileStart = intern.rawData?.intern?.date_started || intern.rawData?.date_started || intern.rawData?.created_at;
    let trueStartDate: Date | null = parseSafeDate(profileStart);

    if (logs.length > 0) {
      const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const firstLogDate = parseSafeDate(sortedLogs[0].date);
      if (!trueStartDate || (firstLogDate && trueStartDate && firstLogDate < trueStartDate)) {
         trueStartDate = firstLogDate;
      }
    }

    if (!trueStartDate) {
        trueStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    let startDate = new Date();
    let endDate = new Date(now); 

    if (filterPeriod === 'This Month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filterPeriod === 'Last Month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0); 
    } else {
      startDate = new Date(trueStartDate);
    }

    if (startDate < trueStartDate) {
      startDate = new Date(trueStartDate);
    }

    if (endDate > now) {
      endDate = new Date(now);
    }

    const workingDays: Date[] = [];
    let curr = new Date(startDate);
    curr.setHours(0,0,0,0);
    endDate.setHours(0,0,0,0);

    while (curr <= endDate) {
      const dayOfWeek = curr.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { 
        workingDays.push(new Date(curr));
      }
      curr.setDate(curr.getDate() + 1);
    }

    let completeLogs: AttendanceLog[] = workingDays.map(calendarDate => {
      const existingLog = logs.find(l => isSameDate(l.date, calendarDate));
      if (existingLog) return existingLog;

      const formattedDate = calendarDate.toLocaleDateString('en-CA'); 
      return {
        id: `absent-${formattedDate}`,
        date: formattedDate,
        status: 'Absent',
        am_in: undefined, am_out: undefined, pm_in: undefined, pm_out: undefined,
        total_hours: 0
      };
    });

    logs.forEach(log => {
      const isAlreadyIncluded = completeLogs.some(cl => isSameDate(cl.date, log.date));
      if (!isAlreadyIncluded) completeLogs.push(log);
    });

    completeLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return completeLogs.filter(log => {
      if (statusFilter === 'All') return true;
      const logStatus = (log.status || 'Present').toLowerCase();
      return logStatus === statusFilter.toLowerCase();
    });

  }, [logs, filterPeriod, statusFilter, intern]);

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, AttendanceLog[]> = {};
    displayLogs.forEach(log => {
      const [year, month, day] = log.date.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const monthName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!groups[monthName]) groups[monthName] = [];
      groups[monthName].push(log);
    });
    return groups;
  }, [displayLogs]);

  const displayStats = useMemo(() => {
    let totalHours = 0;
    let daysPresent = 0;

    displayLogs.forEach(log => {
      totalHours += parseFloat(String(log.total_hours || 0));
      if (log.status && log.status.toLowerCase() !== 'absent') daysPresent += 1;
    });

    return {
      hours: totalHours.toFixed(1),
      days: daysPresent,
      avgIn: stats.avgIn, 
      rate: stats.rate 
    };
  }, [displayLogs, stats]);

  const handleDownloadDTR = () => {
    if (displayLogs.length === 0) {
      alert("No attendance records to download for this period.");
      return;
    }

    const csvRows: string[] = [];
    csvRows.push(`"DAILY TIME RECORD"`);
    csvRows.push(`"Name:","${intern.name}"`);
    csvRows.push(`"School:","${intern.school || 'N/A'}"`);
    csvRows.push(`"Course:","${intern.course || 'N/A'}"`);
    csvRows.push(`"Department:","${intern.department || 'N/A'}"`);
    csvRows.push(`"Period:","${filterPeriod}"`);
    csvRows.push(""); 

    const headers = ["Date", "Day", "Status", "AM In", "AM Out", "PM In", "PM Out", "Total Hours"];
    csvRows.push(headers.map(h => `"${h}"`).join(","));

    displayLogs.forEach(log => {
      const row = [
        log.date,
        getSafeDayOfWeek(log), 
        log.status || 'Present',
        formatTime(log.am_in),
        formatTime(log.am_out),
        formatTime(log.pm_in),
        formatTime(log.pm_out),
        log.total_hours || 0
      ];
      csvRows.push(row.map(cell => `"${cell}"`).join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${intern.name.replace(/ /g, '_')}_DTR_${filterPeriod.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCertificate = async () => {
    setIsCertLoading(true);
    try {
      // Give the DOM a tiny bit more time to ensure all fonts and avatars load
      await new Promise(resolve => setTimeout(resolve, 800)); 
      
      const element = certRef.current;
      if (!element) throw new Error("Certificate element not found");
      
      // ✨ THE FIX: Let html2canvas use natural dimensions, but reset the scroll axis
      const canvas = await html2canvas(element, { 
        scale: 3, // Increased to 3 for super crisp high-res text
        useCORS: true, 
        backgroundColor: '#ffffff',
        scrollX: 0, // Prevents the zoomed/cut-off shift
        scrollY: 0  // Prevents the zoomed/cut-off shift
      });
      
      const dataImage = canvas.toDataURL('image/png', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      }); 

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // ✨ THE FIX: Force the image to perfectly snap to the A4 landscape corners
      pdf.addImage(dataImage, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const safeName = intern.name ? intern.name.replace(/ /g, '_') : 'Intern';
      pdf.save(`${safeName}_Certificate.pdf`);
      
    } catch (error) {
      console.error("Error generating certificate:", error);
      alert("Failed to generate certificate.");
    } finally {
      setIsCertLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-lg flex items-center justify-center z-[999999] p-5 font-['Poppins',sans-serif]" onClick={onClose}>
        <div className="bg-slate-100 w-full max-w-[1100px] max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>

          <div className="bg-white p-3 flex justify-between items-center flex-wrap gap-1 m-3 rounded-xl border border-slate-200">
            <h2 className="text-base font-black text-slate-900 m-0">Intern Details</h2>
            <div className="flex items-center gap-1 flex-wrap relative z-10">
              
              {/* ✨ Added type="button" to stop silent errors */}
              <button type="button" className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 cursor-pointer whitespace-nowrap transition-all duration-200 hover:bg-slate-50 hover:border-amber-500" onClick={() => setShowCertPreview(true)}>
                <Award size={13} /> Get Certificate
              </button>

              <button type="button" className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 cursor-pointer whitespace-nowrap transition-all duration-200 hover:bg-slate-50 hover:border-amber-500" onClick={() => setShowIdModal(true)}>
                <IdCard size={13} /> Generate ID
              </button>
              
              <div className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 cursor-pointer whitespace-nowrap relative overflow-hidden">
                <Calendar size={13} className="z-10" /> 
                <span className="z-10 pointer-events-none">{filterPeriod}</span>
                <select 
                  value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="All Time">All Time</option>
                </select>
              </div>

              <button type="button" className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 cursor-pointer whitespace-nowrap transition-all duration-200 hover:bg-slate-50 hover:border-amber-500" onClick={handleDownloadDTR}>
                <Download size={13} /> Download DTR
              </button>

              <button type="button" className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer text-slate-500 flex-shrink-0 transition-all duration-200 hover:bg-red-100 hover:text-red-500 hover:border-red-300" onClick={onClose}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="p-3 overflow-y-auto flex flex-col gap-1">
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-center gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-slate-100 flex-shrink-0">
                  <img src={profilePhotoUrl} alt="profile" className="w-full h-full object-cover rounded-full" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 m-0 mb-0.5">{intern.name}</h3>
                  <p className="text-xs text-slate-500 font-medium m-0">{intern.email}</p>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 text-center min-w-[110px]">
                  <span className="block font-bold text-xs text-slate-900">{intern.department || 'N/A'}</span>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Department</span>
                </div>
                <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 text-center min-w-[110px]">
                  <span className="block font-bold text-xs text-slate-900">{intern.school || 'N/A'}</span>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">School</span>
                </div>
                <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 text-center min-w-[110px]">
                  <span className="block font-bold text-xs text-slate-900">{intern.course || 'N/A'}</span>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Course</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
                <div className="text-amber-500 p-2 bg-slate-900 rounded-xl flex-shrink-0 flex"><Clock size={19} /></div>
                <div>
                  <h4 className="m-0 mb-1 text-xl font-black text-slate-900 leading-tight">{displayStats.hours}</h4>
                  <p className="m-0 text-xs text-slate-500 font-medium">Filtered Hours</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
                <div className="text-amber-500 p-2 bg-slate-900 rounded-xl flex-shrink-0 flex"><CalendarDays size={19} /></div>
                <div>
                  <h4 className="m-0 mb-1 text-xl font-black text-slate-900 leading-tight">{displayStats.days}</h4>
                  <p className="m-0 text-xs text-slate-500 font-medium">Days Present</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
                <div className="text-amber-500 p-2 bg-slate-900 rounded-xl flex-shrink-0 flex"><Clock size={19} /></div>
                <div>
                  <h4 className="m-0 mb-1 text-xl font-black text-slate-900 leading-tight">{displayStats.avgIn}</h4>
                  <p className="m-0 text-xs text-slate-500 font-medium">Avg. Time In</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
                <div className="text-amber-500 p-2 bg-slate-900 rounded-xl flex-shrink-0 flex"><Activity size={19} /></div>
                <div>
                  <h4 className="m-0 mb-1 text-xl font-black text-slate-900 leading-tight">{displayStats.rate}</h4>
                  <p className="m-0 text-xs text-slate-500 font-medium">Completion Rate</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col gap-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 m-0">Attendance History</h3>
                <div className="flex items-center gap-1">
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                    <button className={`p-1.5 bg-transparent border-none cursor-pointer text-slate-400 flex items-center transition-all duration-150 ${activeView === 'grid' ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 hover:text-slate-900'}`} onClick={() => setActiveView('grid')}><Grid size={13} /></button>
                    <button className={`p-1.5 bg-transparent border-none cursor-pointer text-slate-400 flex items-center transition-all duration-150 ${activeView === 'list' ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 hover:text-slate-900'}`} onClick={() => setActiveView('list')}><List size={13} /></button>
                  </div>
                  
                  <div className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer whitespace-nowrap relative overflow-hidden">
                    <Filter size={13} className="z-10 mr-1" /> 
                    <span className="z-10 pointer-events-none">
                      {statusFilter}
                    </span>
                    <select 
                      value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    >
                      <option value="All">All Logs</option>
                      <option value="Present">Present</option>
                      <option value="Late">Late</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center p-10 text-slate-500">Fetching attendance records...</div>
              ) : displayLogs.length === 0 ? (
                <div className="text-center p-10 text-slate-500">
                  No attendance records found.
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {Object.entries(groupedByMonth).map(([monthName, monthLogs]) => (
                    <div key={monthName} className="bg-white">
                      
                      <h4 className="text-base font-black text-slate-900 mt-0 mb-3 pb-2 border-b-2 border-slate-100">{monthName}</h4>
                      
                      {activeView === 'grid' && (
                        <div className="grid grid-cols-5 gap-1 mb-2 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                           <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span>
                        </div>
                      )}

                      <div className={activeView === 'grid' ? 'grid grid-cols-5 gap-1' : 'flex flex-col gap-1'}>
                        {monthLogs.map((log, index) => {
                          const isAbsent = (log.status || '').toLowerCase() === 'absent';
                          const isLate = (log.status || '').toLowerCase() === 'late';
                          const dayName = getSafeDayOfWeek(log);
                          
                          return (
                            <div 
                              key={log.id} 
                              className="rounded-xl overflow-hidden border border-slate-200 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                              style={{ 
                                opacity: isAbsent ? 0.7 : 1, 
                                borderLeft: isAbsent ? '3px solid #ef4444' : isLate ? '3px solid #f59e0b' : '3px solid #10b981',
                                gridColumnStart: (activeView === 'grid' && index === 0) ? getGridColumnStart(log.date) : 'auto'
                              }}
                            >
                              <div className="bg-gradient-to-r from-[#0B1EAE]  via-[#0D1767] to-[#050C48] text-white p-2 flex justify-between items-center gap-1">
                                <div className="flex items-center gap-1 text-xs font-semibold">
                                  <Calendar size={11} /> 
                                  {dayName && <span className="font-semibold mr-1">{dayName},</span>}
                                  {log.date.split('-')[2]}
                                </div>
                                <span className="flex items-center gap-1 bg-white text-xs font-bold px-2 py-0.5 rounded-full" style={{ 
                                  backgroundColor: isAbsent ? '#fef2f2' : isLate ? '#fffbeb' : '#ecfdf5',
                                  color: isAbsent ? '#ef4444' : isLate ? '#f59e0b' : '#10b981'
                                }}>
                                  {isAbsent ? <AlertCircle size={9} /> : <CheckCircle size={9} />} 
                                  {log.status || 'Present'}
                                </span>
                              </div>
                              
                              <div className="p-3 bg-slate-50">
                                <div className="flex justify-between gap-1">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-xs text-slate-500 font-semibold">In</span>
                                    <span className="text-xs font-bold" style={{ color: isAbsent ? '#94a3b8' : '#0f172a' }}>{isAbsent ? '--:--' : formatTime(log.am_in)}</span>
                                  </div>
                                  <div className="flex flex-col gap-1 text-right">
                                    <span className="text-xs text-slate-500 font-semibold">Out</span>
                                    <span className="text-xs font-bold" style={{ color: isAbsent ? '#94a3b8' : '#0f172a' }}>{isAbsent ? '--:--' : formatTime(log.pm_out)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* ✨ WRAPPED IN A RELATIVE DIV WITH Z-INDEX SO IT STEPS IN FRONT OF THE PARENT MODAL */}
      {showIdModal && (
        <div style={{ position: 'relative', zIndex: 9999999 }}>
            <GenerateIdModal intern={{...intern, avatar_url: profilePhotoUrl}} onClose={() => setShowIdModal(false)} />
        </div>
      )}
      
      {/* ✨ CHANGED TAILWIND z-[9999999] TO STRICT INLINE style={{zIndex: 9999999}} TO PREVENT COMPILER FAILURE */}
      {showCertPreview && (
        <div 
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-lg flex items-center justify-center p-5"
          style={{ zIndex: 9999999 }}
          onClick={() => setShowCertPreview(false)} 
        >
          <div 
            className="bg-white w-auto max-w-[95vw] max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="flex-shrink-0 p-5 flex justify-between items-center border-b border-slate-200 bg-white">
              <h2 className="text-base font-black text-slate-900 m-0">Certificate Preview</h2>
              <button type="button" className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer text-slate-500 transition-all duration-200 hover:bg-red-100 hover:text-red-500 hover:border-red-300" onClick={() => setShowCertPreview(false)}>
                <X size={20} />
              </button>
            </div>

            {/* ✨ THE FIX: Added "min-h-0" right here! This forces Flexbox to allow scrolling. */}
            <div className="flex-1 min-h-0 p-4 md:p-8 bg-slate-50 overflow-y-auto flex justify-center">
              <div ref={certRef} className="shadow-md h-max">
                <CertificateTemplate 
                    intern={{
                        ...intern,
                        avatar_url: base64Avatar || profilePhotoUrl,
                        hours: Number(stats.hours), 
                        gender: intern.rawData?.intern?.gender || 'female',
                        dateStarted: intern.rawData?.intern?.date_started || intern.rawData?.created_at,
                        dateCompleted: new Date().toISOString().split('T')[0]
                    } as any}
                />
              </div>
            </div>

            {/* Footer (Now safely glued to the bottom) */}
            <div className="flex-shrink-0 p-4 md:p-5 flex justify-end items-center gap-3 border-t border-slate-200 bg-white">
              
              {/* ✨ Added an explicit Cancel button at the bottom for you! */}
              <button 
                type="button"
                onClick={() => setShowCertPreview(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button 
                type="button"
                onClick={handleDownloadCertificate} 
                disabled={isCertLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white border-none rounded-lg font-medium cursor-pointer transition-opacity duration-200 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCertLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
                {isCertLoading ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
            
          </div>
        </div>
      )}

    </>
  );
  
}