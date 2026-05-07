import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Inbox, X, Calendar as CalendarIcon, MapPin, AlignLeft, Clock } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoredUser {
    first_name?: string;
    last_name?: string;
    [key: string]: unknown;
}

interface CalendarEvent {
    id: number | string;
    title: string;
    start?: string;
    date?: string;
    end?: string;
    location?: string;
    description?: string;
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
    status?: string;
    time_in_am?: string;
    time_out_am?: string;
    time_in_pm?: string;
    time_out_pm?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const InternDashboardHome: React.FC = () => {
    const user: StoredUser = JSON.parse(localStorage.getItem('user') ?? '{}') || {};

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
                // 1. Fetch Events
                const eventsRes = await api.get('/events');
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const activePinnedEvents = eventsRes.data.filter((event: CalendarEvent) => {
                    const eventDateString = event.start || event.date;
                    if (!eventDateString) return true;
                    const eventDate = new Date(eventDateString);
                    eventDate.setHours(0, 0, 0, 0);
                    return eventDate >= today;
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

                const now = new Date();
                const dayOfWeek = now.getDay() || 7;
                const thisMonday = new Date(now);
                thisMonday.setHours(0, 0, 0, 0);
                thisMonday.setDate(now.getDate() - (dayOfWeek - 1));

                const timelineEvents: TimelineLog[] = [];
                const calLogsMap: Record<string, string> = {};

                historyRes.data.forEach((log: AttendanceLog) => {
                    const logDateStr = log.date || log.formatted_date || log.raw_date;
                    if (!logDateStr) return;

                    const logDate = new Date(logDateStr);

                    if (!isNaN(logDate.getTime())) {
                        const logYMD = logDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
                        calLogsMap[logYMD] = (log.status || 'default').toLowerCase();
                    }

                    if (logDate >= thisMonday) {
                        const baseDate = log.date || log.formatted_date || '';
                        const displayDate = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                        const getTimestamp = (timeStr: string): number => {
                            const parsed = new Date(`${baseDate} ${timeStr}`);
                            return isNaN(parsed.getTime()) ? logDate.getTime() : parsed.getTime();
                        };

                        if (log.time_in_am && log.time_in_am !== '-') {
                            timelineEvents.push({
                                id: `${log.id}-am-in`, type: 'in', title: 'AM Check-in',
                                displayTime: `${displayDate} • ${log.time_in_am}`, timestamp: getTimestamp(log.time_in_am),
                            });
                        }
                        if (log.time_out_am && log.time_out_am !== '-') {
                            timelineEvents.push({
                                id: `${log.id}-am-out`, type: 'out', title: 'Lunch Check-out',
                                displayTime: `${displayDate} • ${log.time_out_am}`, timestamp: getTimestamp(log.time_out_am),
                            });
                        }
                        if (log.time_in_pm && log.time_in_pm !== '-') {
                            timelineEvents.push({
                                id: `${log.id}-pm-in`, type: 'in', title: 'PM Check-in',
                                displayTime: `${displayDate} • ${log.time_in_pm}`, timestamp: getTimestamp(log.time_in_pm),
                            });
                        }
                        if (log.time_out_pm && log.time_out_pm !== '-') {
                            timelineEvents.push({
                                id: `${log.id}-pm-out`, type: 'out', title: 'PM Check-out',
                                displayTime: `${displayDate} • ${log.time_out_pm}`, timestamp: getTimestamp(log.time_out_pm),
                            });
                        }
                    }
                });

                setCalendarLogs(calLogsMap);
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
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
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
    const fullName = `${user.first_name || 'KHEN JOSHUA'} ${user.last_name || 'VERSON'}`.trim().toUpperCase();

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
        <div className="flex flex-col gap-[5px] w-full font-[Inter,system-ui,-apple-system,sans-serif] pb-3">

            <style>{`
                @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
            `}</style>

            <PageHeader title="Dashboard" />

            {/* ── DASHBOARD GRID ── */}
            <div className="grid grid-cols-4 gap-[5px] max-[1100px]:grid-cols-2 max-[768px]:grid-cols-1">

                {/* ── LEFT STACK (spans 2 cols) ── */}
                <div className="col-span-2 flex flex-col gap-[5px] max-[768px]:col-span-1">

                    {/* 1. GREETING CARD */}
                    <div className={`${cardCls} justify-center bg-gradient-to-br from-white to-slate-50`}>
                        <div className="flex flex-col gap-1">
                            <p className="m-0 text-[15px] text-slate-500 leading-[1.4]">
                                {greeting},<br />
                                <strong className="text-[#0B1EAE] font-extrabold text-xl">{fullName}</strong>
                            </p>
                            <span className="text-[13px] text-slate-500 font-medium">Here is your OJT overview.</span>
                        </div>
                    </div>

                    {/* 2. OJT PROGRESS CARD */}
                    <div className={`${cardCls} flex-1`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={cardHeaderCls}>OJT PROGRESS</h3>
                        </div>

                        <div className={[
                            'flex flex-row items-center justify-start gap-[70px] w-full flex-1',
                            'max-[768px]:flex-col max-[768px]:text-center max-[768px]:gap-4',
                        ].join(' ')}>

                            {/* Left: donut + text */}
                            <div className="flex items-center gap-6 max-[768px]:flex-col">
                                {/* Donut */}
                                <div className="relative w-[110px] h-[110px] flex-shrink-0 drop-shadow-sm">
                                    <svg width="120" height="120" viewBox="0 0 120 120" className="w-full h-full">
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
                                        <span className="text-2xl font-extrabold text-[#0B1EAE] leading-none">{progressPercentage}%</span>
                                        <span className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase">complete</span>
                                    </div>
                                </div>

                                {/* Progress text */}
                                <div className="flex flex-col justify-center max-[768px]:items-center">
                                    <h2 className="text-lg font-extrabold text-slate-900 m-0 mb-1.5 tracking-tight">
                                        On-the-Job Training
                                    </h2>
                                    <p className="text-sm text-slate-500 m-0 leading-relaxed">
                                        <span className="font-extrabold text-[#0B1EAE] text-base">{displayHours}</span>
                                        {' '}of {internStats.totalHoursRequired} hours logged
                                    </p>
                                </div>
                            </div>

                            {/* Right: Days left */}
                            <div className={[
                                'flex flex-col items-center justify-center',
                                'pl-6 ml-3 border-l-2 border-dashed border-slate-200 h-4/5 -mt-[35px]',
                                'max-[768px]:border-l-0 max-[768px]:border-t-2 max-[768px]:pl-0 max-[768px]:pt-4 max-[768px]:ml-0 max-[768px]:w-full max-[768px]:mt-0',
                            ].join(' ')}>
                                <span className="text-[56px] font-black text-slate-900 leading-none tracking-[-2px]">{tentativeDays}</span>
                                <span className="text-sm text-slate-500 font-extrabold uppercase mt-1">days left</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 3. DAYS PRESENT ── */}
                <div className={`${cardCls} col-span-1`}>
                    <h3 className={cardHeaderCls}>DAYS PRESENT</h3>
                    <div className="flex-1 flex flex-col justify-center mb-3">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[56px] font-extrabold leading-none tracking-[-2px] text-[#0B1EAE]">
                                {internStats.weekDaysPresent}
                            </span>
                            <span className="text-base text-slate-500 font-bold">days</span>
                        </div>
                        <p className="text-[13px] text-slate-400 mt-2 mb-0 font-semibold">this week</p>
                    </div>
                    <div className="px-3 py-2 rounded-lg text-xs font-bold text-center mt-auto w-full bg-amber-50 text-amber-700 border border-amber-100">
                        Week just started
                    </div>
                </div>

                {/* ── 4. HOURS RENDERED ── */}
                <div className={`${cardCls} col-span-1`}>
                    <h3 className={cardHeaderCls}>HOURS RENDERED</h3>
                    <div className="flex-1 flex flex-col justify-center mb-3">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[56px] font-extrabold leading-none tracking-[-2px] text-yellow-500">
                                {internStats.weekHoursRendered}
                            </span>
                            <span className="text-base text-slate-500 font-bold">h</span>
                        </div>
                        <p className="text-[13px] text-slate-400 mt-2 mb-0 font-semibold">this week</p>
                    </div>
                    <div className="px-3 py-2 rounded-lg text-xs font-bold text-center mt-auto w-full bg-blue-50 text-blue-800 border border-blue-100">
                        {displayHours}h total logged
                    </div>
                </div>

                {/* ── 5. ATTENDANCE CALENDAR ── */}
                <div className={`${cardCls} col-span-2 max-[1100px]:col-span-2 max-[768px]:col-span-1`}>
                    <h3 className={cardHeaderCls}>ATTENDANCE — THIS MONTH</h3>
                    <div className="w-full flex flex-col flex-1">
                        {/* Day labels */}
                        <div className="grid grid-cols-7 gap-1.5 mb-3 text-center">
                            {daysOfWeek.map(day => (
                                <div key={day} className="text-[12px] font-extrabold text-slate-400 uppercase max-[768px]:text-[10px]">
                                    {day}
                                </div>
                            ))}
                        </div>
                        {/* Day cells */}
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

                {/* ── 6. PINNED ANNOUNCEMENTS ── */}
                <div className={`${cardCls} col-span-1 min-h-[280px]`}>
                    <h3 className={cardHeaderCls}>PINNED ANNOUNCEMENTS</h3>
                    <div className="flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded">
                        {upcomingEvents.length > 0 ? (
                            <div className="flex flex-col gap-2.5">
                                {upcomingEvents.map(ev => (
                                    <div
                                        key={ev.id}
                                        className={[
                                            'flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer',
                                            'bg-slate-50 border border-transparent',
                                            'transition-all duration-200 ease-in-out',
                                            'hover:bg-blue-50 hover:border-blue-200 hover:-translate-y-px',
                                        ].join(' ')}
                                        onClick={() => handleOpenAnnouncement(ev)}
                                    >
                                        <div className="flex items-center justify-center pt-0.5">
                                            <span className="text-[#0B1EAE] font-extrabold text-base leading-none">•</span>
                                        </div>
                                        <span className="text-[13px] text-slate-800 font-semibold leading-relaxed line-clamp-3">
                                            {ev.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 text-sm py-10 px-5 text-center h-full">
                                <div className="mb-3 text-slate-300"><Inbox size={28} /></div>
                                <p>No pinned announcements</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── 7. RECENT TIME LOGS ── */}
                <div className={`${cardCls} col-span-1 min-h-[280px]`}>
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
                                <p>No recent logs for this week.</p>
                            </div>
                        )}
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
                                    <span>{formatEventDate(selectedAnnouncement.start || selectedAnnouncement.date)}</span>
                                </div>
                                {selectedAnnouncement.location && (
                                    <div className="flex items-center gap-2.5 text-slate-700 text-sm font-semibold">
                                        <MapPin size={16} className="text-[#0B1EAE]" />
                                        <span>{selectedAnnouncement.location}</span>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-[15px] font-extrabold text-slate-900">
                                    <AlignLeft size={16} /> Details
                                </div>
                                <div className="text-[15px] leading-[1.7] text-slate-500 [&>p]:m-0 [&>p]:mb-3 [&>p:last-child]:mb-0">
                                    {selectedAnnouncement.description ? (
                                        selectedAnnouncement.description.split('\n').map((paragraph, idx) => (
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