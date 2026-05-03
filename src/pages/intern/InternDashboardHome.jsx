import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Inbox, X, Calendar as CalendarIcon, MapPin, AlignLeft, Clock } from 'lucide-react';
import styles from './InternDashboardHome.module.css';
import PageHeader from '../../components/PageHeader';

const InternDashboardHome = () => {
    const user = JSON.parse(localStorage.getItem('user')) || {};

    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [timeLogs, setTimeLogs] = useState([]); 
    const [calendarLogs, setCalendarLogs] = useState({});
    
    // Modal States
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [internStats, setInternStats] = useState({
        totalHoursRequired: 500,
        hoursRendered: 0,
        weekDaysPresent: 0,
        weekHoursRendered: 0,
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Fetch Events
                const eventsRes = await api.get('/events');
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const activePinnedEvents = eventsRes.data.filter(event => {
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
                });

                // 3. Fetch History Logs
                const historyRes = await api.get('/attendance/history'); 
                
                const now = new Date();
                const dayOfWeek = now.getDay() || 7; 
                const thisMonday = new Date(now);
                thisMonday.setHours(0, 0, 0, 0);
                thisMonday.setDate(now.getDate() - (dayOfWeek - 1)); 

                let timelineEvents = [];
                let calLogsMap = {}; 

                historyRes.data.forEach(log => {
                    const logDateStr = log.date || log.formatted_date || log.raw_date;
                    if (!logDateStr) return;

                    const logDate = new Date(logDateStr);
                    
                    if (!isNaN(logDate.getTime())) {
                        const logYMD = logDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }); 
                        calLogsMap[logYMD] = (log.status || 'default').toLowerCase();
                    }

                    if (logDate >= thisMonday) {
                        const baseDate = log.date || log.formatted_date;
                        const displayDate = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        
                        const getTimestamp = (timeStr) => {
                            const parsed = new Date(`${baseDate} ${timeStr}`);
                            return isNaN(parsed.getTime()) ? logDate.getTime() : parsed.getTime();
                        };

                        if (log.time_in_am && log.time_in_am !== '-') {
                            timelineEvents.push({ 
                                id: `${log.id}-am-in`, type: 'in', title: 'AM Check-in', 
                                displayTime: `${displayDate} • ${log.time_in_am}`, timestamp: getTimestamp(log.time_in_am)
                            });
                        }
                        if (log.time_out_am && log.time_out_am !== '-') {
                            timelineEvents.push({ 
                                id: `${log.id}-am-out`, type: 'out', title: 'Lunch Check-out', 
                                displayTime: `${displayDate} • ${log.time_out_am}`, timestamp: getTimestamp(log.time_out_am)
                            });
                        }
                        if (log.time_in_pm && log.time_in_pm !== '-') {
                            timelineEvents.push({ 
                                id: `${log.id}-pm-in`, type: 'in', title: 'PM Check-in', 
                                displayTime: `${displayDate} • ${log.time_in_pm}`, timestamp: getTimestamp(log.time_in_pm)
                            });
                        }
                        if (log.time_out_pm && log.time_out_pm !== '-') {
                            timelineEvents.push({ 
                                id: `${log.id}-pm-out`, type: 'out', title: 'PM Check-out', 
                                displayTime: `${displayDate} • ${log.time_out_pm}`, timestamp: getTimestamp(log.time_out_pm)
                            });
                        }
                    }
                });

                setCalendarLogs(calLogsMap);
                timelineEvents.sort((a, b) => b.timestamp - a.timestamp);
                setTimeLogs(timelineEvents.slice(0, 4)); 
                
            } catch {
                console.error("Dashboard sync failed");
            }
        };
        fetchDashboardData();
    }, []);

    const handleOpenAnnouncement = (event) => {
        setSelectedAnnouncement(event);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedAnnouncement(null), 200);
    };

    const formatEventDate = (dateString) => {
        if (!dateString) return "No date specified";
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const totalRequired = internStats.totalHoursRequired > 0 ? internStats.totalHoursRequired : 1;
    const progressPercentage = Math.round((internStats.hoursRendered / totalRequired) * 100);
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const progressLength = (internStats.hoursRendered / totalRequired) * circumference;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const fullName = `${user.first_name || 'KHEN JOSHUA'} ${user.last_name || 'VERSON'}`.trim().toUpperCase();

    const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    const manilaToday = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const currentYear = manilaToday.getFullYear();
    const currentMonth = manilaToday.getMonth(); 
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const startOffset = (firstDayOfMonth + 6) % 7; 
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const calendarDays = [];
    for (let i = 0; i < startOffset; i++) {
        calendarDays.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const mm = String(currentMonth + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        const ymd = `${currentYear}-${mm}-${dd}`; 

        let dayStatus = calendarLogs[ymd] || 'default';
        if (dayStatus === 'pending') dayStatus = 'default';

        calendarDays.push({ day: d, state: dayStatus });
    }
    const totalSlotsNeeded = Math.ceil(calendarDays.length / 7) * 7;
    while (calendarDays.length < totalSlotsNeeded) {
        calendarDays.push(null);
    }

    return (
        <div className={styles.pageWrapper}>
            <PageHeader title="Dashboard" />

            <div className={styles.dashboardGrid}>
                
                {/* ── THE LEFT STACK ── */}
                <div className={styles.leftStack}>
                    
                    {/* 1. GREETING CARD */}
                    <div className={`${styles.card} ${styles.greetingCard}`}>
                        <div className={styles.greetingContent}>
                            <p className={styles.cardGreeting}>
                                {greeting},<br />
                                <strong>{fullName}</strong>
                            </p>
                            <span className={styles.greetingSub}>Here is your OJT overview.</span>
                        </div>
                    </div>

                    {/* 2. OJT PROGRESS CARD */}
                    <div className={`${styles.card} ${styles.progressCard}`}>
                        <div className={styles.cardHeaderWrapper}>
                            <h3 className={styles.cardHeader}>OJT PROGRESS</h3>
                        </div>
                        
                        <div className={styles.progressContent}>
                            <div className={styles.donutWrapper}>
                                <svg width="120" height="120" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
                                    <g transform="rotate(-90 60 60)">
                                        <circle cx="60" cy="60" r={radius} fill="none" stroke="#0B1EAE" strokeWidth="10" 
                                            strokeDasharray={`${progressLength} ${circumference}`} 
                                            strokeDashoffset={0} strokeLinecap="round" />
                                    </g>
                                </svg>
                                <div className={styles.donutText}>
                                    <span className={styles.donutPercentage}>{progressPercentage}%</span>
                                    <span className={styles.donutSubText}>complete</span>
                                </div>
                            </div>

                            <div className={styles.progressDetails}>
                                <h2 className={styles.progressTitle}>On-the-Job Training</h2>
                                <p className={styles.progressLog}>
                                    <span className={styles.highlightText}>{internStats.hoursRendered}</span> of {internStats.totalHoursRequired} hours logged
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 3. DAYS PRESENT STAT ── */}
                <div className={`${styles.card} ${styles.statCard}`}>
                    <h3 className={styles.cardHeader}>DAYS PRESENT</h3>
                    <div className={styles.statContent}>
                        <div className={styles.bigStatWrapper}>
                            <span className={styles.bigStatNumber} style={{color: '#0B1EAE'}}>{internStats.weekDaysPresent}</span>
                            <span className={styles.statLabel}>days</span>
                        </div>
                        <p className={styles.statSubtitle}>this week</p>
                    </div>
                    <div className={styles.pillBadge} style={{backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fef3c7'}}>
                        Week just started
                    </div>
                </div>

                {/* ── 4. HOURS RENDERED STAT ── */}
                <div className={`${styles.card} ${styles.statCard}`}>
                    <h3 className={styles.cardHeader}>HOURS RENDERED</h3>
                    <div className={styles.statContent}>
                        <div className={styles.bigStatWrapper}>
                            <span className={styles.bigStatNumber} style={{color: '#eab308'}}>{internStats.weekHoursRendered}</span>
                            <span className={styles.statLabel}>h</span>
                        </div>
                        <p className={styles.statSubtitle}>this week</p>
                    </div>
                    <div className={styles.pillBadge} style={{backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #dbeafe'}}>
                        {internStats.hoursRendered}h total logged
                    </div>
                </div>

                {/* 5. ATTENDANCE CALENDAR */}
                <div className={`${styles.card} ${styles.calendarGridCard}`}>
                    <h3 className={styles.cardHeader}>ATTENDANCE — THIS MONTH</h3>
                    <div className={styles.calendarContainer}>
                        <div className={styles.calendarHeaderRow}>
                            {daysOfWeek.map(day => (
                                <div key={day} className={styles.calDayLabel}>{day}</div>
                            ))}
                        </div>
                        <div className={styles.calendarGrid}>
                            {calendarDays.map((date, index) => (
                                <div 
                                    key={index} 
                                    className={`${styles.calCell} ${date ? styles[`calState_${date.state}`] : styles.calEmpty}`}
                                >
                                    {date ? date.day : ''}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 6. PINNED ANNOUNCEMENTS */}
                <div className={`${styles.card} ${styles.announcementCard}`}>
                    <h3 className={styles.cardHeader}>PINNED ANNOUNCEMENTS</h3>
                    <div className={styles.cardScrollArea}>
                        {upcomingEvents.length > 0 ? (
                            <div className={styles.simpleAnnouncementList}>
                                {upcomingEvents.map(ev => (
                                    <div 
                                        key={ev.id} 
                                        className={styles.clickableAnnouncement}
                                        onClick={() => handleOpenAnnouncement(ev)}
                                    >
                                        <div className={styles.bulletPointWrapper}>
                                            <span className={styles.bulletPoint}>•</span>
                                        </div>
                                        <span className={styles.announcementTitleText}>{ev.title}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}><Inbox size={28}/></div>
                                <p>No pinned announcements</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 7. RECENT TIME LOGS */}
                <div className={`${styles.card} ${styles.timeLogCard}`}>
                    <h3 className={styles.cardHeader}>RECENT TIME LOGS</h3>
                    <div className={styles.cardScrollArea}>
                        {timeLogs.length > 0 ? (
                            <div className={styles.timeline}>
                                {timeLogs.map((log, index) => (
                                    <div key={log.id} className={styles.timelineItem}>
                                        <div className={styles.timelineVisuals}>
                                            <div className={`${styles.timelineNode} ${log.type === 'in' ? styles.nodeIn : styles.nodeOut}`}></div>
                                            {index !== timeLogs.length - 1 && <div className={styles.timelineLine}></div>}
                                        </div>
                                        <div className={styles.timelineContent}>
                                            <h4 className={styles.timelineTitle}>{log.title}</h4>
                                            <p className={styles.timelineTime}>{log.displayTime}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}><Clock size={28}/></div>
                                <p>No recent logs for this week.</p>
                            </div>
                        )}
                    </div>
                </div>
                
            </div>

            {/* ANNOUNCEMENT DETAILS MODAL */}
            {isModalOpen && selectedAnnouncement && (
                <div className={styles.modalOverlay} onClick={handleCloseModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>{selectedAnnouncement.title}</h2>
                            <button className={styles.closeBtn} onClick={handleCloseModal} aria-label="Close modal">
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.modalBodyScrollable}>
                            <div className={styles.modalMetaRow}>
                                <div className={styles.metaItem}>
                                    <CalendarIcon size={16} className={styles.metaIcon} />
                                    <span>{formatEventDate(selectedAnnouncement.start || selectedAnnouncement.date)}</span>
                                </div>
                                {selectedAnnouncement.location && (
                                    <div className={styles.metaItem}>
                                        <MapPin size={16} className={styles.metaIcon} />
                                        <span>{selectedAnnouncement.location}</span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.modalDescriptionSection}>
                                <div className={styles.descHeader}>
                                    <AlignLeft size={16} /> Details
                                </div>
                                <div className={styles.descContent}>
                                    {selectedAnnouncement.description ? (
                                        selectedAnnouncement.description.split('\n').map((paragraph, idx) => (
                                            <p key={idx}>{paragraph}</p>
                                        ))
                                    ) : (
                                        <p className={styles.noDescription}>No additional details provided.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.acknowledgeBtn} onClick={handleCloseModal}>
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