import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Inbox, X, Calendar as CalendarIcon, MapPin, AlignLeft, Clock } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';

// ✨ REDUX IMPORTS ✨
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtendedProps {
    description?: string;
    is_pinned?: boolean | number;
    location?: string;
}

interface CalendarEvent {
    id: number | string;
    title: string;
    start?: string;
    date?: string;
    end?: string;
    created_at?: string;
    location?: string;
    description?: string;
    is_pinned?: boolean | number; 
    pinned?: boolean | number;
    extendedProps?: ExtendedProps;
}

interface TimelineLog {
    id: string;
    type: 'in' | 'out';
    title: string;
    displayTime: string;
    timestamp: number;
}

interface CalendarDay {
    day: number;
    state: string;
}

interface InternStats {
    totalHoursRequired: number;
    hoursRendered: number;
    weekDaysPresent: number;
    weekHoursRendered: number;
    tentativeDays: number;
}

interface AttendanceLog {
    id: number | string;
    date?: string;
    formatted_date?: string;
    raw_date?: string;
    created_at?: string;
    status?: string;
    time_in_am?: string;
    time_out_am?: string;
    time_in_pm?: string;
    time_out_pm?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const InternDashboardHome: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);

    const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
    const [timeLogs, setTimeLogs] = useState<TimelineLog[]>([]);
    const [calendarLogs, setCalendarLogs] = useState<Record<string, string>>({});

    // Modal States
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<CalendarEvent | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const [internStats, setInternStats] = useState<InternStats>({
        totalHoursRequired: 500,
        hoursRendered: 0,
        weekDaysPresent: 0,
        weekHoursRendered: 0,
        tentativeDays: 0,
    });

    useEffect(() => {
        const fetchDashboardData = async (): Promise<void> => {
            try {
                // 1. Fetch Events / Announcements
                const eventsRes = await api.get('/events');
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const activePinnedEvents = eventsRes.data.filter((event: CalendarEvent) => {
                    const isPinned = event.is_pinned || event.pinned || event.extendedProps?.is_pinned;
                    if (isPinned) return true; // ALWAYS show pinned items

                    const eventDateString = event.start || event.date || event.created_at;
                    if (!eventDateString) return true;
                    
                    const eventDate = new Date(eventDateString.replace(/-/g, '/'));
                    eventDate.setHours(0, 0, 0, 0);
                    
                    return eventDate >= today;
                });

                activePinnedEvents.sort((a: CalendarEvent, b: CalendarEvent) => {
                    const aPinned = a.is_pinned || a.pinned || a.extendedProps?.is_pinned ? 1 : 0;
                    const bPinned = b.is_pinned || b.pinned || b.extendedProps?.is_pinned ? 1 : 0;
                    
                    if (aPinned !== bPinned) {
                        return bPinned - aPinned;
                    }

                    const dateA = new Date(a.created_at || a.start || a.date || '').getTime();
                    const dateB = new Date(b.created_at || b.start || b.date || '').getTime();
                    return dateB - dateA;
                });

                setUpcomingEvents(activePinnedEvents.slice(0, 4));

                // 2. Fetch Stats
                const statsRes = await api.get('/intern/dashboard-stats');
                const data = statsRes.data;

                setInternStats({
                    ...data,
                    totalHoursRequired: data.totalHoursRequired || 500,
                    hoursRendered: data.hoursRendered || 0,
                    weekDaysPresent: data.weekDaysPresent || 0,
                    weekHoursRendered: data.weekHoursRendered || 0,
                    tentativeDays: data.tentativeDays || 0,
                });

                // 3. Fetch History Logs
                const historyRes = await api.get('/attendance/history');

                const timelineEvents: TimelineLog[] = [];
                const calLogsMap: Record<string, string> = {};

                historyRes.data.forEach((log: AttendanceLog) => {
                    // ✨ THE FIX: Bulletproof date extraction
                    const logDateStr = log.raw_date || log.date || log.formatted_date || log.created_at;
                    if (!logDateStr) return;

                    const logDate = new Date(logDateStr);
                    if (isNaN(logDate.getTime())) return;

                    // Light up the calendar
                    const logYMD = logDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
                    calLogsMap[logYMD] = (log.status || 'default').toLowerCase();

                    // Process Recent Logs safely
                    const displayDate = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const dateOnlyForParsing = logDate.toLocaleDateString('en-US'); // "5/12/2026"

                    const getTimestamp = (timeStr: string): number => {
                        const parsed = new Date(`${dateOnlyForParsing} ${timeStr}`);
                        return isNaN(parsed.getTime()) ? logDate.getTime() : parsed.getTime();
                    };

                    const addTimelineEvent = (timeVal: string | undefined | null, idSuffix: string, type: 'in' | 'out', title: string) => {
                        if (timeVal && timeVal !== '-' && timeVal !== 'null') {
                            timelineEvents.push({
                                id: `${log.id}-${idSuffix}`,
                                type,
                                title,
                                displayTime: `${displayDate} • ${timeVal}`,
                                timestamp: getTimestamp(timeVal),
                            });
                        }
                    };

                    addTimelineEvent(log.time_in_am, 'am-in', 'in', 'AM Check-in');
                    addTimelineEvent(log.time_out_am, 'am-out', 'out', 'Lunch Check-out');
                    addTimelineEvent(log.time_in_pm, 'pm-in', 'in', 'PM Check-in');
                    addTimelineEvent(log.time_out_pm, 'pm-out', 'out', 'PM Check-out');
                });

                setCalendarLogs(calLogsMap);
                
                // Sort exactly from newest to oldest
                timelineEvents.sort((a, b) => b.timestamp - a.timestamp);
                setTimeLogs(timelineEvents.slice(0, 4));

            } catch {
                console.error('Dashboard sync failed');
            }
        };
        fetchDashboardData();
    }, []);

    const handleOpenAnnouncement = (event: CalendarEvent): void => {
        setSelectedAnnouncement(event);
        setIsModalOpen(true);
    };

    const handleCloseModal = (): void => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedAnnouncement(null), 200);
    };

    const formatEventDate = (dateString?: string): string => {
        if (!dateString) return 'No date specified';
        return new Date(dateString.replace(/-/g, '/')).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    // ─── Derived Values ────────────────────────────────────────────────────────

    const totalRequired = internStats.totalHoursRequired > 0 ? internStats.totalHoursRequired : 1;
    const safeHoursRendered = Math.max(0, internStats.hoursRendered);
    const progressPercentage = Math.min(100, Math.round((safeHoursRendered / totalRequired) * 100));

    const displayHours = internStats.hoursRendered;
    const remainingHours = Math.max(0, totalRequired - safeHoursRendered);
    const tentativeDays = internStats.tentativeDays || Math.ceil(remainingHours / 8);

    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const progressLength = (safeHoursRendered / totalRequired) * circumference;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    
    const firstName = user?.first_name || user?.name?.split(' ')[0] || 'KHEN JOSHUA';
    const lastName = user?.last_name || user?.name?.split(' ').slice(1).join(' ') || 'VERSON';
    const fullName = `${firstName} ${lastName}`.trim().toUpperCase();

    // ─── Calendar Grid ─────────────────────────────────────────────────────────

    const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    const manilaToday = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const currentYear = manilaToday.getFullYear();
    const currentMonth = manilaToday.getMonth();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const startOffset = (firstDayOfMonth + 6) % 7;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const calendarDays: (CalendarDay | null)[] = [];
    for (let i = 0; i < startOffset; i++) calendarDays.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
        const mm = String(currentMonth + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        const ymd = `${currentYear}-${mm}-${dd}`;
        let dayStatus = calendarLogs[ymd] || 'default';
        if (dayStatus === 'pending') dayStatus = 'default';
        calendarDays.push({ day: d, state: dayStatus });
    }
    const totalSlotsNeeded = Math.ceil(calendarDays.length / 7) * 7;
    while (calendarDays.length < totalSlotsNeeded) calendarDays.push(null);

    // ─── Cal Cell State → Tailwind class map ──────────────────────────────────

    const calStateClasses: Record<string, string> = {
        default: 'bg-slate-50 text-slate-500',
        present: 'bg-blue-50 text-[#0B1EAE] border border-blue-200',
        'half day': 'bg-cyan-50 text-cyan-700 border border-cyan-200',
        late:    'bg-amber-50 text-amber-700 border border-amber-200',
        absent:  'bg-red-50 text-red-700 border border-red-200',
    };

    // ─── Shared card classes ───────────────────────────────────────────────────

    const cardCls = [
        'bg-white rounded-2xl p-5 flex flex-col',
        'shadow-[0_2px_10px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)]',
        'border border-slate-200/80',
        'transition-[box-shadow,transform] duration-200',
        'hover:shadow-[0_4px_20px_rgba(15,23,42,0.06),0_2px_4px_rgba(15,23,42,0.03)]',
    ].join(' ');

    const cardHeaderCls = 'text-[13px] font-extrabold text-slate-500 uppercase tracking-[0.05em] m-0 mb-4';

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-[5px] w-full font-[Inter,system-ui,-apple-system,sans-serif] p-3">

            <style>{`
                @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                
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

            <PageHeader title="Dashboard" />

            <div className="grid grid-cols-4 gap-[5px] max-[1100px]:grid-cols-2 max-[768px]:flex max-[768px]:flex-col">

                {/* ── LEFT COLUMN ── */}
                <div className="col-span-2 flex flex-col gap-[5px] w-full h-full max-[768px]:contents">

                    {/* 1. GREETING CARD -> MOBILE POSITION: 1 */}
                    <div 
                        className={`${cardCls} justify-center !p-3 !border-transparent animate-shine max-[768px]:order-1`}
                        style={{ background: 'linear-gradient(90deg, #0B1EAE 0%, #152286 23.56%, #0D1767 63.46%, #050C48 100%)' }}
                    >
                        <div className="flex flex-col gap-1 relative z-10">
                            <p className="m-0 text-[15px] text-white leading-[1.4]">
                                {greeting},<br />
                                <strong className="text-white font-extrabold text-xl">{fullName}</strong>
                            </p>
                            <span className="text-[13px] text-blue-200 font-medium">Here is your OJT overview.</span>
                        </div>
                    </div>

                    {/* 2. OJT PROGRESS CARD -> MOBILE POSITION: 2 */}
                    <div className={`${cardCls} flex-none max-[768px]:order-2`}>
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h3 className={cardHeaderCls}>OJT PROGRESS</h3>
                        </div>

                        <div className="flex flex-row items-center justify-start w-full flex-1 gap-6 sm:gap-12">
                            <div className="flex flex-row items-center gap-4 sm:gap-6">
                                <div className="relative w-[150px] h-[150px] sm:w-[140px] sm:h-[140px] flex-shrink-0 drop-shadow-sm">
                                    <svg width="100%" height="100%" viewBox="0 0 120 120" className="w-full h-full">
                                        <circle cx="60" cy="60" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
                                        <g transform="rotate(-90 60 60)">
                                            <circle
                                                cx="60" cy="60" r={radius} fill="none"
                                                stroke="#0B1EAE" strokeWidth="10"
                                                strokeDasharray={`${progressLength} ${circumference}`}
                                                strokeDashoffset={0} strokeLinecap="round"
                                            />
                                        </g>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-xl sm:text-xl font-extrabold text-[#0B1EAE] leading-none">{progressPercentage}%</span>
                                        <span className="text-[9px] sm:text-xs text-slate-500 font-bold mt-0.5 uppercase">complete</span>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center">
                                    <h2 className="text-[18px] sm:text-lg font-extrabold text-slate-900 m-0 mb-0.5 sm:mb-1 tracking-tight leading-tight">
                                        On-the-Job Training
                                    </h2>
                                    <p className="text-[16px] sm:text-sm text-slate-500 m-0 leading-tight">
                                        <span className="font-extrabold text-[#0B1EAE] text-[16px] sm:text-base">{displayHours}</span>
                                        <span className="hidden sm:inline">{' '}of {internStats.totalHoursRequired} {internStats.totalHoursRequired === 1 ? 'hour' : 'hours'} logged</span>
                                        <span className="sm:hidden"><br/>of {internStats.totalHoursRequired} {internStats.totalHoursRequired === 1 ? 'hr' : 'hrs'}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center pl-9 sm:pl-6 ml-2 sm:ml-3 border-l-2 border-dashed border-slate-200">
                                <span className="text-[36px] sm:text-[56px] font-black text-slate-900 leading-none tracking-tight">{tentativeDays}</span>
                                <span className="text-[10px] sm:text-sm text-slate-500 font-extrabold uppercase mt-1 text-center leading-tight">
                                    {tentativeDays === 1 ? 'day' : 'days'}<br className="sm:hidden" /> left
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3. ATTENDANCE CALENDAR -> MOBILE POSITION: 4 */}
                    <div className={`${cardCls} w-full flex-1 max-[768px]:order-4 max-[768px]:flex-none`}>
                        <h3 className={cardHeaderCls}>ATTENDANCE — THIS MONTH</h3>
                        <div className="w-full flex flex-col flex-1">
                            <div className="grid grid-cols-7 gap-1.5 mb-3 text-center">
                                {daysOfWeek.map(day => (
                                    <div key={day} className="text-[12px] font-extrabold text-slate-400 uppercase max-[768px]:text-[10px]">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1.5">
                                {calendarDays.map((date, index) => (
                                    <div
                                        key={index}
                                        className={[
                                            'aspect-square flex items-center justify-center rounded-lg',
                                            'text-[13px] font-bold transition-transform duration-100 cursor-default',
                                            'max-[768px]:text-xs',
                                            date
                                                ? `hover:scale-105 ${calStateClasses[date.state] ?? calStateClasses.default}`
                                                : 'bg-transparent',
                                        ].join(' ')}
                                    >
                                        {date ? date.day : ''}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="col-span-2 flex flex-col gap-[5px] w-full h-full max-[768px]:contents">
                    
                    {/* Top Row: Days Present & Hours Rendered -> MOBILE POSITION: 3 */}
                    <div className="grid grid-cols-2 gap-[5px] max-[768px]:order-3">
                        {/* 4. DAYS PRESENT */}
                        <div className={`${cardCls} !p-4 h-fit`}>
                            <h3 className={`${cardHeaderCls} !mb-2`}>DAYS PRESENT</h3>
                            <div className="flex flex-col justify-center mb-2">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-[42px] sm:text-[46px] font-extrabold leading-none tracking-[-2px] text-[#0B1EAE]">
                                        {internStats.weekDaysPresent}
                                    </span>
                                    <span className="text-sm text-slate-500 font-bold">{internStats.weekDaysPresent === 1 ? 'day' : 'days'}</span>
                                </div>
                                <p className="text-[11px] sm:text-[12px] text-slate-400 mt-1 mb-0 font-semibold">this week</p>
                            </div>
                            <div className="px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold text-center mt-2 w-full bg-amber-50 text-amber-700 border border-amber-100 truncate">
                                <span className="hidden sm:inline">Week just started</span>
                                <span className="sm:hidden">Week started</span>
                            </div>
                        </div>

                        {/* 5. HOURS RENDERED */}
                        <div className={`${cardCls} !p-4 h-fit`}>
                            <h3 className={`${cardHeaderCls} !mb-2`}>HOURS RENDERED</h3>
                            <div className="flex flex-col justify-center mb-2">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-[42px] sm:text-[46px] font-extrabold leading-none tracking-[-2px] text-yellow-500">
                                        {internStats.weekHoursRendered}
                                    </span>
                                    <span className="text-sm text-slate-500 font-bold">h</span>
                                </div>
                                <p className="text-[11px] sm:text-[12px] text-slate-400 mt-1 mb-0 font-semibold">this week</p>
                            </div>
                            <div className="px-2 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold text-center mt-2 w-full bg-blue-50 text-blue-800 border border-blue-100 truncate">
                                <span className="hidden sm:inline">{displayHours} {displayHours === 1 ? 'hour' : 'hours'} total logged</span>
                                <span className="sm:hidden">{displayHours} {displayHours === 1 ? 'hour' : 'hours'} logged</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Pinned Announcements & Recent Time Logs -> MOBILE POSITION: 5 */}
                    <div className="grid grid-cols-2 gap-[5px] max-[768px]:grid-cols-1 flex-1 max-[768px]:order-5 max-[768px]:flex-none">
                        
                        {/* 6. PINNED ANNOUNCEMENTS */}
                        <div className={`${cardCls} min-h-[280px] w-full h-full`}>
                            <h3 className={cardHeaderCls}>PINNED ANNOUNCEMENTS</h3>
                            <div className="flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded">
                                {upcomingEvents.length > 0 ? (
                                    <div className="flex flex-col gap-2.5">
                                        {upcomingEvents.map(ev => {
                                            const isPinned = ev.is_pinned || ev.pinned || ev.extendedProps?.is_pinned;

                                            return (
                                                <div
                                                    key={ev.id}
                                                    className={[
                                                        'flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer',
                                                        isPinned ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50 border border-transparent',
                                                        'transition-all duration-200 ease-in-out',
                                                        isPinned ? 'hover:bg-amber-100' : 'hover:bg-blue-50 hover:border-blue-200',
                                                        'hover:-translate-y-px',
                                                    ].join(' ')}
                                                    onClick={() => handleOpenAnnouncement(ev)}
                                                >
                                                    <div className="flex items-center justify-center pt-0.5">
                                                        <span className={`${isPinned ? 'text-amber-500' : 'text-[#0B1EAE]'} font-extrabold text-base leading-none`}>•</span>
                                                    </div>
                                                    <span className="text-[13px] text-slate-800 font-semibold leading-relaxed line-clamp-3">
                                                        {isPinned && <span className="text-[9px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded uppercase mr-1">Pinned</span>}
                                                        {ev.title}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-slate-400 text-sm py-10 px-5 text-center h-full">
                                        <div className="mb-3 text-slate-300"><Inbox size={28} /></div>
                                        <p>No pinned announcements</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 7. RECENT TIME LOGS */}
                        <div className={`${cardCls} min-h-[280px] w-full h-full`}>
                            <h3 className={cardHeaderCls}>RECENT TIME LOGS</h3>
                            <div className="flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded">
                                {timeLogs.length > 0 ? (
                                    <div className="flex flex-col relative pl-1.5">
                                        {timeLogs.map((log, index) => (
                                            <div key={log.id} className="flex gap-4 relative pb-5 last:pb-0">
                                                {/* Visuals */}
                                                <div className="flex flex-col items-center w-3">
                                                    <div className={[
                                                        'w-3 h-3 rounded-full z-[2] flex-shrink-0 border-2 border-white mt-1',
                                                        log.type === 'in'
                                                            ? 'bg-[#0B1EAE] shadow-[0_0_0_2px_#bfdbfe]'
                                                            : 'bg-slate-400 shadow-[0_0_0_2px_#cbd5e1]',
                                                    ].join(' ')} />
                                                    {index !== timeLogs.length - 1 && (
                                                        <div className="w-0.5 bg-slate-200 flex-1 mt-1" />
                                                    )}
                                                </div>
                                                {/* Content */}
                                                <div className="flex flex-col gap-1">
                                                    <h4 className="m-0 text-sm font-bold text-slate-900">{log.title}</h4>
                                                    <p className="m-0 text-xs text-slate-500 font-medium">{log.displayTime}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-slate-400 text-sm py-10 px-5 text-center h-full">
                                        <div className="mb-3 text-slate-300"><Clock size={28} /></div>
                                        <p>No recent logs available.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* ── ANNOUNCEMENT MODAL ── */}
            {isModalOpen && selectedAnnouncement && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-[4px] flex items-center justify-center z-[9999] p-4"
                    style={{ animation: 'fadeIn 0.2s ease-out' }}
                    onClick={handleCloseModal}
                >
                    <div
                        className="bg-white w-full max-w-[500px] max-h-[90vh] rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden"
                        style={{ animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-start px-6 pt-6 pb-4 border-b border-slate-100">
                            <h2 className="m-0 text-xl font-extrabold text-slate-900 leading-snug pr-4">
                                {selectedAnnouncement.title}
                            </h2>
                            <button
                                className="bg-slate-100 border-none text-slate-500 cursor-pointer p-1.5 rounded-full flex items-center justify-center transition-all hover:bg-slate-200 hover:text-slate-900 flex-shrink-0"
                                onClick={handleCloseModal}
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-6 flex flex-col gap-6 overflow-y-auto">
                            {/* Meta row */}
                            <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2.5 text-slate-700 text-sm font-semibold">
                                    <CalendarIcon size={16} className="text-[#0B1EAE]" />
                                    <span>{formatEventDate(selectedAnnouncement.start || selectedAnnouncement.date || selectedAnnouncement.created_at)}</span>
                                </div>
                                
                                {(selectedAnnouncement.location || selectedAnnouncement.extendedProps?.location) && (
                                    <div className="flex items-center gap-2.5 text-slate-700 text-sm font-semibold">
                                        <MapPin size={16} className="text-[#0B1EAE]" />
                                        <span>{selectedAnnouncement.location || selectedAnnouncement.extendedProps?.location}</span>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-[15px] font-extrabold text-slate-900">
                                    <AlignLeft size={16} /> Details
                                </div>
                                <div className="text-[15px] leading-[1.7] text-slate-500 [&>p]:m-0 [&>p]:mb-3 [&>p:last-child]:mb-0">
                                    {(selectedAnnouncement.description || selectedAnnouncement.extendedProps?.description) ? (
                                        (selectedAnnouncement.description || selectedAnnouncement.extendedProps?.description || "").split('\n').map((paragraph, idx) => (
                                            <p key={idx}>{paragraph}</p>
                                        ))
                                    ) : (
                                        <p className="text-slate-400 italic">No additional details provided.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-slate-50 flex justify-end border-t border-slate-100">
                            <button
                                className="bg-[#0B1EAE] text-white border-none px-7 py-3 rounded-lg text-sm font-bold cursor-pointer transition-colors hover:bg-[#081682] w-full sm:w-auto"
                                onClick={handleCloseModal}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InternDashboardHome;