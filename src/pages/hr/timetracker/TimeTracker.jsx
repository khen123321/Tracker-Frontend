import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import styles from './TimeTracker.module.css';
import { Bell, CalendarDays, SlidersHorizontal, Search, User, AlertCircle, ChevronDown } from 'lucide-react';

const TimeTracker = () => {
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, active: 0 });
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [department, setDepartment] = useState('');
    const [school, setSchool] = useState('');

    const todayLabel = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

    const formatTime = (timeString) => {
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

    const formatDuration = (totalMinutes) => {
        const minutes = parseFloat(totalMinutes);
        if (!minutes || minutes <= 0) return '0hrs 00m';
        let final = minutes;
        if (minutes < 24 && !Number.isInteger(minutes)) final = Math.round(minutes * 60);
        const h = Math.floor(final / 60);
        const m = Math.round(final % 60);
        return `${h}hrs ${String(m).padStart(2, '0')}m`;
    };

    const fetchAttendance = useCallback(async () => {
        try {
            const response = await api.get('/hr/interns');
            const data = response.data;
            setInterns(data);
            const logs = data.map(u => u.attendance_logs?.[0]);
            setStats({
                present: logs.filter(l => l?.status === 'present').length,
                absent:  logs.filter(l => !l || l?.status === 'absent').length,
                late:    logs.filter(l => l?.status === 'late').length,
                active:  logs.filter(l => l?.time_in && !l?.time_out).length,
            });
            setError(null);
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Unable to sync with the attendance database.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAttendance();
        const interval = setInterval(fetchAttendance, 30000);
        return () => clearInterval(interval);
    }, [fetchAttendance]);

    const getStatusMeta = (status) => {
        switch (status) {
            case 'present':   return { label: 'Present',            cls: styles.statusPresent };
            case 'late':      return { label: 'Late',               cls: styles.statusLate };
            case 'excused':   return { label: 'Excused',            cls: styles.statusExcused };
            case 'overtime':  return { label: 'Present (Overtime)', cls: styles.statusOvertime };
            case 'absent':
            default:          return { label: 'Absent',             cls: styles.statusAbsent };
        }
    };

    if (loading) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.pageHeader}>
                    <div className={`${styles.skel} ${styles.skelTitle}`} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className={`${styles.skel} ${styles.skelIconBtn}`} />
                        <div className={`${styles.skel} ${styles.skelDatePill}`} />
                    </div>
                </div>

                <div className={styles.statsRow}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={styles.statCard}>
                            <div className={`${styles.skel} ${styles.skelStatLabel}`} />
                            <div className={`${styles.skel} ${styles.skelStatValue}`} />
                        </div>
                    ))}
                </div>

                <div className={styles.filtersRow}>
                    <div className={`${styles.skel} ${styles.skelFilter}`} />
                    <div className={`${styles.skel} ${styles.skelFilter}`} style={{ flex: 1 }} />
                    <div className={`${styles.skel} ${styles.skelFilter}`} style={{ flex: 1 }} />
                </div>

                <div className={styles.tableSection}>
                    <div className={styles.tableSectionHeader}>
                        <div className={`${styles.skel} ${styles.skelTableTitle}`} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div className={`${styles.skel} ${styles.skelActionBtn}`} />
                            <div className={`${styles.skel} ${styles.skelIconBtn}`} />
                        </div>
                    </div>

                    <div className={styles.skelTheadRow}>
                        {[140, 80, 80, 80, 80, 70, 70, 100].map((w, i) => (
                            <div key={i} className={`${styles.skel} ${styles.skelTh}`} style={{ width: `${w}px` }} />
                        ))}
                    </div>

                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={styles.skelTbodyRow}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '2', minWidth: '140px' }}>
                                <div className={`${styles.skel} ${styles.skelAvatar}`} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <div className={`${styles.skel} ${styles.skelName}`} />
                                    <div className={`${styles.skel} ${styles.skelEmail}`} />
                                </div>
                            </div>
                            {[80, 80, 80, 80].map((w, j) => (
                                <div key={j} className={`${styles.skel} ${styles.skelCell}`} style={{ width: `${w}px`, flex: '1' }} />
                            ))}
                            <div className={`${styles.skel} ${styles.skelCell}`} style={{ width: '70px', flex: '1' }} />
                            <div className={`${styles.skel} ${styles.skelBadge}`} style={{ flex: '1' }} />
                            <div className={`${styles.skel} ${styles.skelCell}`} style={{ width: '100px', flex: '1.5' }} /> 
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>

            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Time Tracker</h1>
                <div className={styles.headerRight}>
                    <button className={styles.iconBtn}>
                        <Bell size={16} />
                    </button>
                    <div className={styles.datePill}>
                        <CalendarDays size={14} />
                        <span>{todayLabel}</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className={styles.errorBanner}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <p className={styles.statLabel}>Present Today</p>
                    <p className={styles.statValue}>{stats.present}</p>
                </div>
                <div className={styles.statCard}>
                    <p className={styles.statLabel}>Absent Today</p>
                    <p className={styles.statValue}>{stats.absent}</p>
                </div>
                <div className={styles.statCard}>
                    <p className={styles.statLabel}>Late Today</p>
                    <p className={styles.statValue}>{stats.late}</p>
                </div>
                <div className={styles.statCard}>
                    <p className={styles.statLabel}>Active</p>
                    <p className={styles.statValue}>{stats.active}</p>
                </div>
            </div>

            <div className={styles.filtersRow}>
                <div className={styles.dateInput}>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                    />
                    <CalendarDays size={14} className={styles.inputIcon} />
                </div>
                <div className={styles.selectWrap}>
                    <select value={department} onChange={e => setDepartment(e.target.value)}>
                        <option value="">All Department</option>
                    </select>
                    <ChevronDown size={13} className={styles.selectIcon} />
                </div>
                <div className={styles.selectWrap}>
                    <select value={school} onChange={e => setSchool(e.target.value)}>
                        <option value="">All School</option>
                    </select>
                    <ChevronDown size={13} className={styles.selectIcon} />
                </div>
            </div>

            <div className={styles.tableSection}>
                <div className={styles.tableSectionHeader}>
                    <h2 className={styles.tableTitle}>List Of Interns</h2>
                    <div className={styles.tableActions}>
                        <button className={styles.actionBtn}>
                            <SlidersHorizontal size={13} /> Sort
                        </button>
                        <button className={styles.actionBtn}>
                            <Search size={13} />
                        </button>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.trackerTable}>
                        <thead>
                            <tr>
                                <th>Interns</th>
                                <th>Time In (AM)</th>
                                <th>Time Out (AM)</th>
                                <th>Time In (PM)</th>
                                <th>Time Out (PM)</th>
                                <th>Today's Hours</th>
                                <th>Status</th>
                                <th>Overall Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {interns.length > 0 ? (
                                interns.map((user) => {
                                    const log = user.attendance_logs?.[0];
                                    const status = log?.status || 'absent';
                                    const { label, cls } = getStatusMeta(status);
                                    
                                    const rendered = Math.round(user.attendance_logs_sum_hours_rendered || 0);
                                    const required = user.intern?.required_hours || 0;
                                    const percent = required > 0 ? Math.min(Math.round((rendered / required) * 100), 100) : 0;

                                    return (
                                        <tr key={user.id} className={styles.tableRow}>
                                            <td className={styles.internCell}>
                                                {/* ✨ HERE IS THE AUTO-GENERATED AVATAR UPDATE ✨ */}
                                                <div className={styles.avatar}>
                                                    <img 
                                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.first_name + user.id}`} 
                                                        alt="avatar" 
                                                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                                                    />
                                                </div>
                                                <div>
                                                    <p className={styles.internName}>{user.first_name} {user.last_name}</p>
                                                    <p className={styles.internEmail}>{user.email}</p>
                                                </div>
                                            </td>
                                            <td className={styles.timeCell}>{formatTime(log?.time_in)}</td>
                                            <td className={styles.timeCell}>{formatTime(log?.lunch_out)}</td>
                                            <td className={styles.timeCell}>{formatTime(log?.lunch_in)}</td>
                                            <td className={styles.timeCell}>{formatTime(log?.time_out)}</td>
                                            <td className={styles.durationCell}>{formatDuration(log?.hours_rendered)}</td>
                                            
                                            <td>
                                                <span className={`${styles.statusBadge} ${cls}`}>
                                                    <span className={styles.statusDot}></span>
                                                    {label}
                                                </span>
                                            </td>

                                            <td className={styles.timeCell}>
                                                <div className="flex flex-col gap-1.5 min-w-[110px] pr-4">
                                                    <div className="flex items-end justify-between text-[11px] leading-none">
                                                        <span className="font-bold text-[#0B1EAE]">{rendered}</span>
                                                        <span className="text-slate-400 font-medium tracking-tight">/ {required} hrs</span>
                                                    </div>
                                                    
                                                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                                        <div 
                                                            className="h-full transition-all duration-500" 
                                                            style={{ 
                                                                width: `${percent}%`,
                                                                borderRadius: '30px',
                                                                background: 'linear-gradient(90deg, #E3BD01 0%, #FFDE3C 50%, #FFE359 75%, #FFEFA3 100%)'
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" className={styles.emptyRow}>
                                        No interns found in the system.
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