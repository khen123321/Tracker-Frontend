import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import styles from './TimeTracker.module.css';
import { Clock, Bell, CalendarDays, SlidersHorizontal, Search, User, AlertCircle, ChevronDown } from 'lucide-react';

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
            case 'present':   return { label: 'Present',           cls: styles.statusPresent };
            case 'late':      return { label: 'Late',              cls: styles.statusLate };
            case 'excused':   return { label: 'Excused',           cls: styles.statusExcused };
            case 'overtime':  return { label: 'Present (Overtime)',cls: styles.statusOvertime };
            case 'absent':
            default:          return { label: 'Absent',            cls: styles.statusAbsent };
        }
    };

    if (loading) {
        return (
            <div className={styles.loaderContainer}>
                <div className={styles.spinner}></div>
                <p>Synchronizing Live Logs...</p>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>

            {/* ─── PAGE HEADER ─── */}
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Time Tracker</h1>
                <div className={styles.headerRight}>
                    <button className={styles.iconBtn}>
                        <Bell size={18} />
                    </button>
                    <div className={styles.datePill}>
                        <CalendarDays size={15} />
                        <span>{todayLabel}</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className={styles.errorBanner}>
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {/* ─── STAT CARDS ─── */}
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

            {/* ─── FILTERS ─── */}
            <div className={styles.filtersRow}>
                <div className={styles.dateInput}>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                    />
                    <CalendarDays size={16} className={styles.inputIcon} />
                </div>
                <div className={styles.selectWrap}>
                    <select value={department} onChange={e => setDepartment(e.target.value)}>
                        <option value="">All Department</option>
                    </select>
                    <ChevronDown size={15} className={styles.selectIcon} />
                </div>
                <div className={styles.selectWrap}>
                    <select value={school} onChange={e => setSchool(e.target.value)}>
                        <option value="">All School</option>
                    </select>
                    <ChevronDown size={15} className={styles.selectIcon} />
                </div>
            </div>

            {/* ─── TABLE SECTION ─── */}
            <div className={styles.tableSection}>
                <div className={styles.tableSectionHeader}>
                    <h2 className={styles.tableTitle}>List Of Interns</h2>
                    <div className={styles.tableActions}>
                        <button className={styles.actionBtn}>
                            <SlidersHorizontal size={15} /> Sort
                        </button>
                        <button className={styles.actionBtn}>
                            <Search size={15} />
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
                                <th>Total Time</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {interns.length > 0 ? (
                                interns.map((user) => {
                                    const log = user.attendance_logs?.[0];
                                    const status = log?.status || 'absent';
                                    const { label, cls } = getStatusMeta(status);

                                    return (
                                        <tr key={user.id} className={styles.tableRow}>
                                            <td className={styles.internCell}>
                                                <div className={styles.avatar}>
                                                    <User size={18} />
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
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className={styles.emptyRow}>
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