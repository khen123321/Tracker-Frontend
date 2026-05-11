import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import PageHeader from "../../components/layout/PageHeader";
import { MoreHorizontal, AlertCircle, Search, FileText, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// @ts-ignore - Ignore missing types if climbs.png is not declared in a global d.ts
import climbsLogo from "../../assets/climbs.png";

// ─── TYPESCRIPT INTERFACES ───
interface Log {
    id: string | number;
    date?: string;
    formatted_date?: string;
    raw_date?: string;
    created_at?: string;
    time_in_am?: string;
    time_out_am?: string;
    time_in_pm?: string;
    time_out_pm?: string;
    hours_rendered?: string | number;
    status?: string;
    day_of_week?: string;
    am_in_status?: string;
    lunch_out_status?: string;
    lunch_in_status?: string;
    pm_out_status?: string;
    appeal_status?: string | null;
}

interface DtrDay {
    day: number;
    dayName: string;
    amIn: string;
    amOut: string;
    pmIn: string;
    pmOut: string;
    hours: string;
}

// ✨ CHANGED: Added 'blue' to DotColor
type FilterValue = 'all' | 'present' | 'absent' | 'late' | 'half day';
type DotColor = 'green' | 'red' | 'orange' | 'blue' | null;

interface FilterOption {
    label: string;
    value: FilterValue;
    dot: DotColor;
}

// ✨ CHANGED: Half Day dot is now 'blue'
const FILTERS: FilterOption[] = [
    { label: 'All',      value: 'all',      dot: null },
    { label: 'Present',  value: 'present',  dot: 'green' },
    { label: 'Half Day', value: 'half day', dot: 'blue' },
    { label: 'Absent',   value: 'absent',   dot: 'red' },
    { label: 'Late',     value: 'late',     dot: 'orange' },
];

const Logs: React.FC = () => {
    // ─── ✨ EXACT LARAVEL DB SCHEMA SYNC ✨ ───────────────────────
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};

    // 1. Format Name
    const rawFirstName = user.first_name || '';
    const rawLastName = user.last_name || '';
    const internName = `${rawFirstName} ${rawLastName}`.trim().toUpperCase() || 'INTERN NAME';

    // 2. Expand School Name (No Abbreviations)
    let rawSchool = user.school || 'University of Science and Technology of Southern Philippines';
    if (rawSchool.toUpperCase() === 'USTP' || rawSchool.toUpperCase().includes('SOUTHERN PHILIPPINES')) {
        rawSchool = 'University of Science and Technology of Southern Philippines';
    }
    const school = rawSchool;

    // 3. Department (Checking assigned_department first, then assigned_branch)
    const department = user.assigned_department || user.assigned_branch || 'InsurTech';

    // 4. Expand Course Name
    let rawCourse = user.course || 'BS Information Technology';
    if (rawCourse.toUpperCase() === 'BSIT') {
        rawCourse = 'BS Information Technology';
    }
    const course = rawCourse;

    // 5. Required Hours (Using fallback if not explicitly in user table)
    const requiredHours = parseFloat(user.required_hours || 486);

    // ─── STATE ───────────────────────────────────────────────────────────────
    const [logs, setLogs]           = useState<Log[]>([]);
    const [loading, setLoading]     = useState<boolean>(true);
    const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
    const [searchDate, setSearchDate]     = useState<string>('');
    const [currentPage, setCurrentPage]   = useState<number>(1);
    
    const [showDtrPreview, setShowDtrPreview] = useState<boolean>(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

    const logsPerPage = 15;
    const navigate    = useNavigate();

    // ─── HELPERS ─────────────────────────────────────────────────────────────
    const getDailyHours = (log: Log): string | null => {
        if (log.hours_rendered && parseFloat(log.hours_rendered.toString()) > 0) {
            return parseFloat(log.hours_rendered.toString()).toFixed(2);
        }
        try {
            let total = 0;
            const dummy = '2000-01-01';
            const t = (s?: string) => {
                if (!s || s === '-' || s === 'null') return null;
                const d = new Date(`${dummy} ${s}`);
                return isNaN(d.getTime()) ? null : d.getTime();
            };
            const amIn = t(log.time_in_am), amOut = t(log.time_out_am);
            const pmIn = t(log.time_in_pm), pmOut = t(log.time_out_pm);
            if (amIn && amOut) total += (amOut - amIn) / 3_600_000;
            if (pmIn && pmOut) total += (pmOut - pmIn) / 3_600_000;
            if (total > 0) return total.toFixed(2);
        } catch { }
        return null;
    };

    // ✨ CHANGED: Half Day now returns blue styling
    const getStatusClass = (status?: string): string => {
        switch (status?.toLowerCase()) {
            case 'present':  return 'bg-green-600/10 text-green-600';
            case 'half day': return 'bg-blue-600/10 text-blue-600';
            case 'late':     return 'bg-amber-600/10 text-amber-600';
            case 'absent':   return 'bg-red-600/10 text-red-600';
            case 'leave':    return 'bg-blue-600/10 text-blue-600';
            default:         return 'bg-slate-500/10 text-slate-500';
        }
    };

    // ✨ CHANGED: Half Day dot is now blue
    const getDotClass = (status?: string): string => {
         switch (status?.toLowerCase()) {
            case 'present':  return 'bg-green-600';
            case 'half day': return 'bg-blue-600';
            case 'late':     return 'bg-amber-600';
            case 'absent':   return 'bg-red-600';
            case 'leave':    return 'bg-blue-600';
            default:         return 'bg-slate-500';
        }
    }

    const getSafeDayOfWeek = (log: Log): string => {
        if (log.day_of_week) return log.day_of_week;
        const dateString = log.date || log.formatted_date;
        if (!dateString) return '';
        try {
            const d = new Date(dateString);
            return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { weekday: 'long' });
        } catch { return ''; }
    };

    const getRejectionWarning = (log: Log): string | null => {
        let rejectedSlot = null, timeStamp = null;
        if      (log.am_in_status    === 'rejected') { rejectedSlot = 'AM IN';     timeStamp = log.time_in_am;  }
        else if (log.lunch_out_status === 'rejected') { rejectedSlot = 'LUNCH OUT'; timeStamp = log.time_out_am; }
        else if (log.lunch_in_status  === 'rejected') { rejectedSlot = 'PM IN';     timeStamp = log.time_in_pm;  }
        else if (log.pm_out_status    === 'rejected') { rejectedSlot = 'PM OUT';    timeStamp = log.time_out_pm; }
        return rejectedSlot ? `⚠️ ${rejectedSlot} Photo Rejected (${timeStamp || 'Time Unknown'})` : null;
    };

    const getHoursClass = (log: Log): string => {
        const h = parseFloat(getDailyHours(log) || '0');
        if (isNaN(h) || h === 0) return 'text-red-600';
        if (log.status?.toLowerCase() === 'leave') return 'text-blue-600';
        if (log.status?.toLowerCase() === 'half day') return 'text-blue-600'; 
        if (h < 8) return 'text-amber-600';
        return 'text-green-600';
    };

    const handleGoToForms = (log: Log) => {
        sessionStorage.setItem('appeal_logId',   log.id.toString());
        sessionStorage.setItem('appeal_logDate',  log.formatted_date || log.date || '');
        navigate('/intern-dashboard/forms');
    };

    const fetchLogs = async () => {
        try {
            const response = await api.get('/attendance/history');
            setLogs(response.data);
        } catch (err) {
            console.error('Error fetching logs:', err);
            toast.error('Could not load attendance history.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    const stats = useMemo(() => {
        const presentDays = logs.filter(l => l.status?.toLowerCase() === 'present').length;
        const absences    = logs.filter(l => l.status?.toLowerCase() === 'absent').length;
        const late        = logs.filter(l => l.status?.toLowerCase() === 'late').length;
        const halfDays    = logs.filter(l => l.status?.toLowerCase() === 'half day').length;
        const totalHours  = logs.reduce((acc, l) => acc + parseFloat(getDailyHours(l) || '0'), 0);
        return { presentDays, totalHours, absences, late, halfDays };
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const statusMatch = activeFilter === 'all' || log.status?.toLowerCase() === activeFilter;
            const dateStr = (log.formatted_date || log.date || '').toLowerCase();
            const searchMatch = dateStr.includes(searchDate.toLowerCase());
            return statusMatch && searchMatch;
        });
    }, [logs, activeFilter, searchDate]);

    useEffect(() => { setCurrentPage(1); }, [activeFilter, searchDate]);

    const totalPages     = Math.ceil(filteredLogs.length / logsPerPage);
    const indexOfFirst   = (currentPage - 1) * logsPerPage;
    const currentLogs    = filteredLogs.slice(indexOfFirst, indexOfFirst + logsPerPage);
    const paginate       = (n: number) => setCurrentPage(n);

    // ─── DTR GENERATOR ───────────────────────────────────────────────────────
    const generateDtrData = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); 
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const monthName = today.toLocaleDateString('en-US', { month: 'long' }); 
        const generationDate = today.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });

        const dtrDays: DtrDay[] = [];
        let totalMonthHours = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(currentYear, currentMonth, day);
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

            if (isWeekend) continue; // Skip weekends

            const dayOfWeekStr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const targetYMD = dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
            
            const logMatch = logs.find(l => {
                try {
                    const lDateStr = l.raw_date || l.date || l.created_at;
                    if (!lDateStr) return false;
                    const logYMD = new Date(lDateStr).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
                    return logYMD === targetYMD;
                } catch { return false; }
            });

            const dailyHours = logMatch ? parseFloat(getDailyHours(logMatch) || '0') : 0;
            totalMonthHours += dailyHours;

            dtrDays.push({
                day,
                dayName: dayOfWeekStr,
                amIn: logMatch?.time_in_am && logMatch.time_in_am !== '-' ? logMatch.time_in_am : '',
                amOut: logMatch?.time_out_am && logMatch.time_out_am !== '-' ? logMatch.time_out_am : '',
                pmIn: logMatch?.time_in_pm && logMatch.time_in_pm !== '-' ? logMatch.time_in_pm : '',
                pmOut: logMatch?.time_out_pm && logMatch.time_out_pm !== '-' ? logMatch.time_out_pm : '',
                hours: dailyHours > 0 ? dailyHours.toFixed(1) : ''
            });
        }
        
        const totalRenderedAllTime = stats.totalHours;
        const remainingHours = Math.max(0, requiredHours - totalRenderedAllTime);
        const completionPercentage = requiredHours > 0 ? ((totalRenderedAllTime / requiredHours) * 100).toFixed(1) : '0.0';

        return { dtrDays, monthName, totalMonthHours, generationDate, totalRenderedAllTime, remainingHours, completionPercentage };
    };

    const { dtrDays, monthName, totalMonthHours, generationDate, totalRenderedAllTime, remainingHours, completionPercentage } = useMemo(() => generateDtrData(), [logs, stats.totalHours, requiredHours]);

    // ─── PDF DOWNLOAD HANDLER ────────────────────────────────────────────────
    const handleDownloadPdf = async () => {
        setIsGeneratingPdf(true);
        const loadingToast = toast.loading('Generating DTR...');
        
        try {
            const element = document.getElementById('dtr-printable-area')!;
            const scrollArea = element.parentElement!; 
            
            const originalOverflow = scrollArea.style.overflow;
            const originalHeight = scrollArea.style.height;
            scrollArea.style.overflow = 'visible';
            scrollArea.style.height = 'auto';
            
            const canvas = await html2canvas(element, { 
                scale: 2, 
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            
            scrollArea.style.overflow = originalOverflow;
            scrollArea.style.height = originalHeight;
            
            const imgData = canvas.toDataURL('image/png', 1.0);
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfPageHeight = pdf.internal.pageSize.getHeight();
            
            const imgRatio = canvas.width / canvas.height;
            let finalWidth = pdfWidth;
            let finalHeight = finalWidth / imgRatio;

            if (finalHeight > pdfPageHeight) {
                finalHeight = pdfPageHeight;
                finalWidth = finalHeight * imgRatio;
            }
            
            const xOffset = (pdfWidth - finalWidth) / 2;
            
            pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);
            pdf.save(`DTR_${internName.replace(/\s+/g, '_')}_${monthName}.pdf`);
            
            toast.success('DTR downloaded successfully!', { id: loadingToast });
            setShowDtrPreview(false);
        } catch (error) {
            console.error("PDF Generation Error: ", error);
            toast.error('Failed to generate PDF.', { id: loadingToast });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const renderPageButtons = () => {
        const buttons = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                buttons.push(<button key={i} onClick={() => paginate(i)} className={`bg-transparent border border-slate-200 text-slate-500 font-semibold text-[13px] w-[34px] h-[34px] rounded-lg cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 ${currentPage === i ? '!bg-slate-900 !border-slate-900 !text-white' : ''}`}>{i}</button>);
            }
        } else {
            [1, 2, 3].forEach(i => buttons.push(<button key={i} onClick={() => paginate(i)} className={`bg-transparent border border-slate-200 text-slate-500 font-semibold text-[13px] w-[34px] h-[34px] rounded-lg cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 ${currentPage === i ? '!bg-slate-900 !border-slate-900 !text-white' : ''}`}>{i}</button>));
            buttons.push(<span key="ellipsis" className="text-slate-300 text-[14px] px-1 tracking-[2px]">...</span>);
            buttons.push(<button key={totalPages} onClick={() => paginate(totalPages)} className={`bg-transparent border border-slate-200 text-slate-500 font-semibold text-[13px] w-[34px] h-[34px] rounded-lg cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 ${currentPage === totalPages ? '!bg-slate-900 !border-slate-900 !text-white' : ''}`}>{totalPages}</button>);
        }
        return buttons;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-slate-500 font-sans">
                <div className="w-10 h-10 border-4 border-slate-700 border-t-slate-300 rounded-full animate-spin mb-4" />
                <p>Syncing your logs...</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-100 min-h-screen font-sans flex flex-col gap-[5px] p-[12px]">
            <Toaster position="top-right" />

            <style>{`
                @keyframes shine {
                    0% { left: -150%; }
                    60% { left: 200%; }
                    100% { left: 200%; }
                }
                .animate-shine {
                    position: relative;
                    overflow: hidden; 
                }
                .animate-shine::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -150%;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
                    transform: skewX(-20deg); 
                    animation: shine 5s ease-in-out infinite; 
                    pointer-events: none; 
                }
            `}</style>

            <PageHeader title="Attendance History" />

            <div 
                className="flex overflow-x-auto gap-[5px] pb-1 snap-x snap-mandatory" 
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <div className="bg-white border border-slate-200 rounded-[14px] p-4 md:p-5 md:px-6 flex flex-col gap-1 shadow-[0_1px_3px_rgba(0,0,0,0.05)] min-w-[130px] flex-1 shrink-0 snap-start">
                    <span className="text-[10px] md:text-[11px] font-semibold text-slate-400 uppercase tracking-[0.8px]">This Month</span>
                    <span className="text-[24px] md:text-[30px] font-extrabold leading-none text-green-600">{stats.presentDays}</span>
                    <span className="text-[11px] md:text-[12px] text-slate-400 mt-[2px]">days present</span>
                </div>
                
                {/* ✨ ADDED: Half Days Summary Card ✨ */}
                <div className="bg-white border border-slate-200 rounded-[14px] p-4 md:p-5 md:px-6 flex flex-col gap-1 shadow-[0_1px_3px_rgba(0,0,0,0.05)] min-w-[130px] flex-1 shrink-0 snap-start">
                    <span className="text-[10px] md:text-[11px] font-semibold text-slate-400 uppercase tracking-[0.8px]">Half Days</span>
                    <span className="text-[24px] md:text-[30px] font-extrabold leading-none text-blue-500">{stats.halfDays}</span>
                    <span className="text-[11px] md:text-[12px] text-slate-400 mt-[2px]">this month</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-[14px] p-4 md:p-5 md:px-6 flex flex-col gap-1 shadow-[0_1px_3px_rgba(0,0,0,0.05)] min-w-[130px] flex-1 shrink-0 snap-start">
                    <span className="text-[10px] md:text-[11px] font-semibold text-slate-400 uppercase tracking-[0.8px]">Total Hours</span>
                    <span className="text-[24px] md:text-[30px] font-extrabold leading-none text-blue-600">
                        {stats.totalHours.toFixed(0)}<span className="text-[14px] md:text-[16px] font-semibold">h</span>
                    </span>
                    <span className="text-[11px] md:text-[12px] text-slate-400 mt-[2px]">logged</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-[14px] p-4 md:p-5 md:px-6 flex flex-col gap-1 shadow-[0_1px_3px_rgba(0,0,0,0.05)] min-w-[130px] flex-1 shrink-0 snap-start">
                    <span className="text-[10px] md:text-[11px] font-semibold text-slate-400 uppercase tracking-[0.8px]">Absences</span>
                    <span className="text-[24px] md:text-[30px] font-extrabold leading-none text-red-600">{stats.absences}</span>
                    <span className="text-[11px] md:text-[12px] text-slate-400 mt-[2px]">this month</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-[14px] p-4 md:p-5 md:px-6 flex flex-col gap-1 shadow-[0_1px_3px_rgba(0,0,0,0.05)] min-w-[130px] flex-1 shrink-0 snap-start">
                    <span className="text-[10px] md:text-[11px] font-semibold text-slate-400 uppercase tracking-[0.8px]">Late</span>
                    <span className="text-[24px] md:text-[30px] font-extrabold leading-none text-amber-600">{stats.late}</span>
                    <span className="text-[11px] md:text-[12px] text-slate-400 mt-[2px]">this month</span>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[14px] p-4 md:px-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-2 items-center flex-wrap">
                    {FILTERS.map(f => (
                        <button
                            key={f.value}
                            className={`bg-white border-[1.5px] border-slate-200 rounded-lg text-slate-500 text-[13px] font-semibold py-[7px] px-4 cursor-pointer transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50 ${activeFilter === f.value ? '!bg-slate-900 !border-slate-900 !text-white' : ''}`}
                            onClick={() => setActiveFilter(f.value)}
                        >
                            {/* ✨ CHANGED: Half Day now maps to blue-600 in the filters */}
                            {f.dot && <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${
                                f.value === 'present' ? 'bg-green-600' :
                                f.value === 'absent' ? 'bg-red-600' :
                                f.value === 'late' ? 'bg-amber-600' :
                                f.value === 'half day' ? 'bg-blue-600' : 'bg-slate-500'
                            }`} />}
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex items-center w-full md:w-auto">
                        <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            className="bg-white border-[1.5px] border-slate-200 rounded-[10px] text-slate-700 text-[13px] py-2 pr-[14px] pl-[36px] w-full md:w-[200px] outline-none transition-colors duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:border-slate-400 focus:text-slate-900 placeholder:text-slate-300"
                            placeholder="Search date..."
                            value={searchDate}
                            onChange={e => setSearchDate(e.target.value)}
                        />
                    </div>
                    <button className="flex shrink-0 items-center gap-2 bg-yellow-500 text-white text-[13px] font-semibold px-4 h-[38px] rounded-lg border-none cursor-pointer transition-all duration-200 shadow-[0_2px_4px_rgba(234,179,8,0.3)] hover:bg-yellow-600 hover:-translate-y-px hover:shadow-[0_4px_8px_rgba(234,179,8,0.4)]" onClick={() => setShowDtrPreview(true)}>
                        <FileText size={16} /> Preview DTR
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[14px] overflow-hidden flex-1 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr 
                            className="animate-shine"
                            style={{ background: 'linear-gradient(90deg, #0B1EAE 0%, #152286 23.56%, #0D1767 63.46%, #050C48 100%)' }}
                        >
                            <th className="py-3.5 px-5 text-white font-bold text-[12px] tracking-[0.9px] uppercase relative z-10">Date</th>
                            <th className="py-3.5 px-5 text-white font-bold text-[12px] tracking-[0.9px] uppercase relative z-10">Time In</th>
                            <th className="py-3.5 px-5 text-white font-bold text-[12px] tracking-[0.9px] uppercase relative z-10">Lunch Out</th>
                            <th className="py-3.5 px-5 text-white font-bold text-[12px] tracking-[0.9px] uppercase relative z-10">Lunch In</th>
                            <th className="py-3.5 px-5 text-white font-bold text-[12px] tracking-[0.9px] uppercase relative z-10">Time Out</th>
                            <th className="py-3.5 px-5 text-white font-bold text-[12px] tracking-[0.9px] uppercase relative z-10">Hours</th>
                            <th className="py-3.5 px-5 text-white font-bold text-[12px] tracking-[0.9px] uppercase relative z-10">Status</th>
                            <th className="py-3.5 px-5 relative z-10" />
                        </tr>
                    </thead>
                    <tbody>
                        {currentLogs.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center p-[60px] text-slate-300 italic align-middle border-b border-slate-100">
                                    No attendance records found.
                                </td>
                            </tr>
                        ) : (
                            currentLogs.map((log) => {
                                const dayName          = getSafeDayOfWeek(log);
                                const rejectionWarning = getRejectionWarning(log);
                                const hoursDisplay     = getDailyHours(log);
                                const hoursClass       = getHoursClass(log);

                                return (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-5 border-b border-slate-100 align-middle text-slate-900 font-semibold text-[13.5px]">
                                            {log.formatted_date || log.date}
                                            {dayName && <span className="block text-[11px] text-slate-400 font-normal mt-[2px]">{dayName}</span>}
                                        </td>
                                        <td className="py-4 px-5 text-slate-500 text-[13.5px] border-b border-slate-100 align-middle">{log.time_in_am  || '–'}</td>
                                        <td className="py-4 px-5 text-slate-500 text-[13.5px] border-b border-slate-100 align-middle">{log.time_out_am || '–'}</td>
                                        <td className="py-4 px-5 text-slate-500 text-[13.5px] border-b border-slate-100 align-middle">{log.time_in_pm  || '–'}</td>
                                        <td className="py-4 px-5 text-slate-500 text-[13.5px] border-b border-slate-100 align-middle">{log.time_out_pm || '–'}</td>
                                        <td className={`py-4 px-5 border-b border-slate-100 align-middle font-bold text-[14px] ${hoursClass}`}>
                                            {hoursDisplay ?? '–'}
                                        </td>
                                        <td className="py-4 px-5 border-b border-slate-100 align-middle">
                                            <span className={`px-3 py-1.5 rounded-full text-[12px] font-bold inline-flex items-center gap-1.5 whitespace-nowrap ${getStatusClass(log.status)}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotClass(log.status)}`} />
                                                {log.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 border-b border-slate-100 align-middle text-right">
                                            {rejectionWarning && log.appeal_status === null ? (
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-red-500 text-[10px] font-bold leading-tight">
                                                        {rejectionWarning}
                                                    </span>
                                                    <button
                                                        onClick={() => handleGoToForms(log)}
                                                        className="mt-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] py-1 px-2 rounded shadow transition-colors cursor-pointer border-none"
                                                    >
                                                        File Appeal
                                                    </button>
                                                </div>
                                            ) : log.appeal_status === 'pending' ? (
                                                <span className="text-yellow-500 font-bold text-[10px] flex items-center justify-end gap-1">
                                                    <AlertCircle size={12} /> Appeal Pending
                                                </span>
                                            ) : log.appeal_status === 'approved' ? (
                                                <span className="text-green-500 font-bold text-[10px] text-right block">✅ Approved</span>
                                            ) : log.appeal_status === 'rejected' ? (
                                                <span className="text-red-500 font-bold text-[10px] text-right block">❌ Denied</span>
                                            ) : (
                                                <button className="bg-transparent border-none text-slate-300 cursor-pointer flex justify-end w-full p-1 rounded-md transition-colors hover:text-slate-500 hover:bg-slate-100">
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {filteredLogs.length > 0 && (
                    <div className="flex justify-between items-center p-[14px_20px] border-t border-slate-100 bg-slate-50">
                        <span className="text-[13px] text-slate-400">
                            Showing {indexOfFirst + 1}–{Math.min(indexOfFirst + logsPerPage, filteredLogs.length)} of {filteredLogs.length} records
                        </span>

                        <div className="flex items-center gap-1.5">
                            <button className="bg-transparent border-none text-[13px] font-medium text-slate-500 cursor-pointer p-[6px_10px] rounded-[7px] transition-colors hover:text-slate-900 hover:bg-slate-200 disabled:text-slate-300 disabled:cursor-not-allowed disabled:hover:bg-transparent" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>← Back</button>
                            <div className="flex gap-1 items-center">{renderPageButtons()}</div>
                            <button className="bg-transparent border-none text-[13px] font-medium text-slate-500 cursor-pointer p-[6px_10px] rounded-[7px] transition-colors hover:text-slate-900 hover:bg-slate-200 disabled:text-slate-300 disabled:cursor-not-allowed disabled:hover:bg-transparent" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>Next →</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ✨ DTR PREVIEW MODAL ✨ */}
            {showDtrPreview && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-5 animate-in fade-in duration-200">
                    <div className="bg-slate-200 w-full max-w-[850px] max-h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                        
                        <div className="flex-1 overflow-y-auto p-[30px] flex justify-center items-start bg-slate-700">
                            <div id="dtr-printable-area" className="bg-white w-[210mm] min-h-[297mm] p-[12mm_10mm] box-border shadow-[0_4px_15px_rgba(0,0,0,0.2)] font-sans text-slate-800 relative flex flex-col mx-auto shrink-0">
                                
                                <div className="flex items-center gap-[15px] mb-2.5">
                                    <div className="w-[70px] h-[70px] bg-slate-50 flex justify-center items-center border border-slate-200">
                                        <img src={climbsLogo} alt="CLIMBS Logo" className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div className="flex-1 text-center pr-[70px]">
                                        <h1 className="text-[20px] font-bold text-[#0B1EAE] m-0 mb-1">CLIMBS Life and General Insurance Cooperative</h1>
                                        <p className="text-[11px] text-slate-500 m-0">Zone 5 Highway, Bulua, Cagayan de Oro City, Misamis Oriental</p>
                                    </div>
                                </div>
                                <div className="h-[2px] bg-slate-300 my-[15px] mb-[25px]"></div>

                                <div className="text-center mb-[25px]">
                                    <h2 className="text-[18px] font-extrabold text-slate-900 m-0 mb-1">Daily Time Record</h2>
                                    <p className="text-[12px] text-slate-400 m-0">For the Month of {monthName}</p>
                                </div>

                                <div className="flex justify-between text-[12px] mb-[15px] text-slate-800">
                                    <div className="flex flex-col gap-1.5">
                                        <p className="m-0"><strong>Name:</strong> {internName}</p>
                                        <p className="m-0"><strong>School:</strong> {school}</p>
                                        <p className="m-0"><strong>Position:</strong> Intern</p>
                                    </div>
                                    <div className="text-right flex flex-col gap-1.5">
                                        <p className="m-0"><strong>Department:</strong> {department}</p>
                                        <p className="m-0"><strong>Course:</strong> {course}</p>
                                        <p className="m-0"><strong>Required Hours:</strong> {requiredHours}</p>
                                    </div>
                                </div>

                                <table className="w-full border-collapse text-[12px] mb-5 border border-slate-300 text-slate-700">
                                    <thead>
                                        <tr>
                                            <th className="border border-slate-300 p-[8px_4px] bg-[#0B1EAE] text-white font-semibold text-center"></th>
                                            <th className="border border-slate-300 p-[8px_4px] bg-[#0B1EAE] text-white font-semibold text-center">Day</th>
                                            <th className="border border-slate-300 p-[8px_4px] bg-[#0B1EAE] text-white font-semibold text-center">Time In</th>
                                            <th className="border border-slate-300 p-[8px_4px] bg-[#0B1EAE] text-white font-semibold text-center">Lunch Out</th>
                                            <th className="border border-slate-300 p-[8px_4px] bg-[#0B1EAE] text-white font-semibold text-center">Lunch In</th>
                                            <th className="border border-slate-300 p-[8px_4px] bg-[#0B1EAE] text-white font-semibold text-center">Time Out</th>
                                            <th className="border border-slate-300 p-[8px_4px] bg-[#0B1EAE] text-white font-semibold text-center">Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dtrDays.map((d) => (
                                            <tr key={d.day}>
                                                <td className="border border-slate-300 p-[8px_4px] text-center">{d.day}</td>
                                                <td className="border border-slate-300 p-[8px_4px] text-center">{d.dayName}</td>
                                                <td className="border border-slate-300 p-[8px_4px] text-center">{d.amIn}</td>
                                                <td className="border border-slate-300 p-[8px_4px] text-center">{d.amOut}</td>
                                                <td className="border border-slate-300 p-[8px_4px] text-center">{d.pmIn}</td>
                                                <td className="border border-slate-300 p-[8px_4px] text-center">{d.pmOut}</td>
                                                <td className="border border-slate-300 p-[8px_4px] text-center">{d.hours}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-100">
                                        <tr>
                                            <td colSpan={6} className="border border-slate-300 p-[8px_4px] text-right pr-[15px]">
                                                <strong>Total Hours This Month:</strong>
                                            </td>
                                            <td className="border border-slate-300 p-[8px_4px] text-center">
                                                <strong>{totalMonthHours.toFixed(1)}</strong>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>

                                <div className="text-[11px] leading-[1.6] mb-[40px] text-slate-800 flex flex-col">
                                    <p className="m-0"><strong>Total Rendered Hours:</strong> {totalRenderedAllTime.toFixed(2)} / {requiredHours} hours</p>
                                    <p className="m-0"><strong>Remaining Hours:</strong> {remainingHours.toFixed(2)} hours</p>
                                    <p className="m-0"><strong>Completion:</strong> {completionPercentage}%</p>
                                </div>

                                <div className="flex justify-between mt-[50px] p-0">
                                    <div className="text-center w-[250px]">
                                        <div className="border-b border-black mb-2"></div>
                                        <p className="text-[12px] font-bold text-slate-900 m-0">{internName}</p>
                                        <p className="text-[10px] text-slate-400 m-0 mt-0.5">OJT Intern</p>
                                    </div>
                                    <div className="text-center w-[250px]">
                                        <div className="border-b border-black mb-2"></div>
                                        <p className="text-[12px] font-bold text-slate-900 m-0">&nbsp;</p>
                                        <p className="text-[10px] text-slate-400 m-0 mt-0.5">OJT Coordinator</p>
                                    </div>
                                </div>

                                <div className="text-center text-[9px] text-slate-400 mt-auto pt-[60px] flex flex-col gap-0.5">
                                    <p className="m-0">This document was generated from the CLIMBS OJT Attendance Monitoring System.</p>
                                    <p className="m-0">Generated on: {generationDate}</p>
                                </div>

                            </div>
                        </div>

                        <div className="flex justify-center gap-4 p-4 bg-white border-t border-slate-300 z-10 shrink-0">
                            <button className="bg-slate-200 text-slate-700 border-none py-2 px-8 rounded-md font-bold cursor-pointer transition-opacity hover:bg-slate-300" onClick={() => setShowDtrPreview(false)}>
                                Cancel
                            </button>
                            <button className="bg-slate-900 text-white border-none py-2 px-8 rounded-md font-bold cursor-pointer transition-opacity hover:opacity-90 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:opacity-100" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                                {isGeneratingPdf ? 'Processing...' : 'Download DTR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Logs;