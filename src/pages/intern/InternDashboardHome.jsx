import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Calendar, Pin, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './InternDashboardHome.module.css';

// ✨ UNIFIED NOTIFICATION BELL ✨
import NotificationBell from '../../components/NotificationBell';

const InternDashboardHome = () => {
    const navigate = useNavigate();
    const [upcomingEvents, setUpcomingEvents] = useState([]);

    const user = JSON.parse(localStorage.getItem('user')) || {};

    const [internStats, setInternStats] = useState({
        totalHoursRequired: 500,
        hoursRendered: 0,
        completionDate: 'Calculating...',
        todayStatus: 'Loading...',
        todayClockIn: '--:--',
        todayOfficial: '08:30 AM',
        todayHours: 0,
        weekDaysPresent: 0,
        weekHoursRendered: 0,
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 🔒 READ-ONLY FETCH: We only GET events, we never POST here.
                const eventsRes = await api.get('/events');
                
                // --- DATE FILTERING LOGIC ---
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const activePinnedEvents = eventsRes.data.filter(event => {
                    const eventDateString = event.start || event.date;
                    if (!eventDateString) return true; 

                    const eventDate = new Date(eventDateString);
                    eventDate.setHours(0, 0, 0, 0);
                    
                    return eventDate >= today;
                });

                // Take the top 3 ACTIVE events to display as read-only cards
                setUpcomingEvents(activePinnedEvents.slice(0, 3));

                // Fetch stats
                const statsRes = await api.get('/intern/dashboard-stats');
                setInternStats(statsRes.data);
            } catch {
                console.error("Dashboard sync failed");
            }
        };
        fetchDashboardData();
    }, []);

    const progressPercentage = internStats.totalHoursRequired > 0
        ? Math.round((internStats.hoursRendered / internStats.totalHoursRequired) * 100)
        : 0;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    const todayDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });

    return (
        <div className={styles.pageWrapper}>

            {/* ─── TOP HEADER ─── */}
            <div className={styles.topHeader}>
                <h1 className={styles.headerTitle}>Dashboard</h1>
                <div className={styles.headerActions}>
                    
                    {/* 🔒 SAFE NAVIGATION: This routes to the locked-down Calendar page */}
                    <button
                        onClick={() => navigate('/intern-dashboard/events')}
                        className="flex items-center gap-2 text-sm bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all shadow-sm h-[36px]"
                    >
                        <Calendar size={16} className="text-[#0B1EAE]" />
                        <span className="hidden sm:inline font-semibold text-slate-700">Full Calendar</span>
                    </button>
                    
                    {/* Notification Bell */}
                    <NotificationBell role="intern" />
                    
                    <div className={styles.dateBadge}>
                        <Calendar size={15} />
                        <span>{todayDate}</span>
                    </div>
                </div>
            </div>

            {/* ─── WELCOME SECTION ─── */}
            <div className={styles.welcomeSection}>
                <h2 className={styles.greetingText}>
                    {greeting}, <span className={styles.highlightName}>{user.first_name || 'Intern'}!</span>
                </h2>
                <p className={styles.dateText}>{todayDate}</p> 
            </div>

            {/* ─── PINNED ANNOUNCEMENTS (READ-ONLY) ─── */}
            <div className={styles.announcementsSection}>
                <div className={styles.sectionHeader}>
                    <Pin size={18} className={styles.pinIcon} />
                    <h3>Pinned Announcements</h3>
                </div>
                <div className={styles.announcementList}>
                    {/* 🔒 We map over the data and only display text. No edit/delete buttons exist here. */}
                    {upcomingEvents.length > 0 ? (
                        upcomingEvents.map(event => (
                            <div key={event.id} className={styles.announcementCard}>
                                <div className={styles.announcementHeader}>
                                    <h4>{event.title}</h4>
                                    <span className={styles.badge} style={{ backgroundColor: '#bfdbfe', color: '#1e3a8a' }}>Event</span>
                                </div>
                                <p className={styles.announcementDesc}>
                                    Scheduled: <span className="font-bold">{event.start}</span>
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-slate-500 italic px-2">No pinned announcements.</p>
                    )}
                </div>
            </div>

            {/* ─── STATS GRID ─── */}
            <div className={styles.statsGrid}>

                {/* OJT Progress */}
                <div className={styles.statCard}>
                    <div className={styles.cardHeaderSplit}>
                        <h3 className={styles.cardTitle}>OJT Progress</h3>
                        <div className={styles.progressCircle}>
                            <span>{progressPercentage}%</span>
                        </div>
                    </div>
                    <div className={styles.progressBarContainer}>
                        <div className={styles.progressLabels}>
                            <span className={styles.hiddenLabel}>Progress</span>
                            <span className={styles.fractionLabel}>{internStats.hoursRendered}/{internStats.totalHoursRequired} hours</span>
                        </div>
                        <div className={styles.progressTrack}>
                            <div className={styles.progressFill} style={{ width: `${progressPercentage}%` }} />
                        </div>
                        <p className={styles.estCompletion}>Est. completion: {internStats.completionDate}</p>
                    </div>
                </div>

                {/* Today's Status */}
                <div className={styles.statCard}>
                    <h3 className={styles.cardTitle}>Today's Status</h3>
                    <div className={styles.statusRow}>
                        <div className={styles.statusInfo}>
                            <div className={styles.statusBadge}>
                                <CheckCircle2 size={16} />
                                <span>{internStats.todayStatus}</span>
                            </div>
                            <div className={styles.timeDetails}>
                                <p>Clock-in: {internStats.todayClockIn}</p>
                                <p>Official: {internStats.todayOfficial}</p>
                            </div>
                        </div>
                        <div className={styles.hoursToday}>
                            <span className={styles.hoursBig}>{internStats.todayHours}h</span>
                            <span className={styles.hoursLabel}>hours today</span>
                        </div>
                    </div>
                </div>

                {/* This Week */}
                <div className={styles.weeklySummary}>
                    <h2 className={styles.cardTitle}>This Week</h2>
                    <div className={styles.weeklyBoxes}>
                        <div className={styles.weeklyBox}>
                            <span className={styles.weeklyValueGreen}>{internStats.weekDaysPresent}</span>
                            <span className={styles.weeklyLabel}>Days Present</span>
                        </div>
                        <div className={styles.weeklyBox}>
                            <span className={styles.weeklyValueYellow}>{internStats.weekHoursRendered}h</span>
                            <span className={styles.weeklyLabel}>Hours Rendered</span>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default InternDashboardHome;