import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import styles from './Logs.module.css';
import PageHeader from "../../../components/PageHeader"; // ← imported from your component path
import { MoreHorizontal, AlertCircle, Search } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// ─── FILTER OPTIONS ──────────────────────────────────────────────────────────
const FILTERS = [
    { label: 'All',     value: 'all',     dot: null },
    { label: 'Present', value: 'present', dot: 'green' },
    { label: 'Absent',  value: 'absent',  dot: 'red' },
    { label: 'Late',    value: 'late',    dot: 'orange' },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────
const Logs = () => {
    const [logs, setLogs]           = useState([]);
    const [loading, setLoading]     = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchDate, setSearchDate]     = useState('');
    const [currentPage, setCurrentPage]   = useState(1);

    const logsPerPage = 15;
    const navigate    = useNavigate();

    // ─── FETCH ───────────────────────────────────────────────────────────────
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

    // ─── STATS (computed from full log list) ─────────────────────────────────
    const stats = useMemo(() => {
        const presentDays = logs.filter(l => l.status?.toLowerCase() === 'present').length;
        const absences    = logs.filter(l => l.status?.toLowerCase() === 'absent').length;
        const late        = logs.filter(l => l.status?.toLowerCase() === 'late').length;
        const totalHours  = logs.reduce((acc, l) => {
            const h = parseFloat(l.hours_rendered);
            return acc + (isNaN(h) ? 0 : h);
        }, 0);
        return { presentDays, totalHours: totalHours.toFixed(0), absences, late };
    }, [logs]);

    // ─── FILTER + SEARCH ─────────────────────────────────────────────────────
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const statusMatch =
                activeFilter === 'all' ||
                log.status?.toLowerCase() === activeFilter;

            const dateStr = (log.formatted_date || log.date || '').toLowerCase();
            const searchMatch = dateStr.includes(searchDate.toLowerCase());

            return statusMatch && searchMatch;
        });
    }, [logs, activeFilter, searchDate]);

    // Reset to page 1 when filters change
    useEffect(() => { setCurrentPage(1); }, [activeFilter, searchDate]);

    // ─── PAGINATION ──────────────────────────────────────────────────────────
    const totalPages     = Math.ceil(filteredLogs.length / logsPerPage);
    const indexOfFirst   = (currentPage - 1) * logsPerPage;
    const currentLogs    = filteredLogs.slice(indexOfFirst, indexOfFirst + logsPerPage);
    const paginate       = (n) => setCurrentPage(n);

    // ─── HELPERS ─────────────────────────────────────────────────────────────
    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'present': return styles.statusPresent;
            case 'late':    return styles.statusLate;
            case 'absent':  return styles.statusAbsent;
            case 'leave':   return styles.statusLeave;
            default:        return styles.statusDefault;
        }
    };

    const getSafeDayOfWeek = (log) => {
        if (log.day_of_week) return log.day_of_week;
        const dateString = log.date || log.formatted_date;
        if (!dateString) return '';
        try {
            const d = new Date(dateString);
            return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { weekday: 'long' });
        } catch { return ''; }
    };

    const getRejectionWarning = (log) => {
        let rejectedSlot = null, timeStamp = null;
        if      (log.am_in_status    === 'rejected') { rejectedSlot = 'AM IN';      timeStamp = log.time_in_am;  }
        else if (log.lunch_out_status === 'rejected') { rejectedSlot = 'LUNCH OUT'; timeStamp = log.time_out_am; }
        else if (log.lunch_in_status  === 'rejected') { rejectedSlot = 'PM IN';     timeStamp = log.time_in_pm;  }
        else if (log.pm_out_status    === 'rejected') { rejectedSlot = 'PM OUT';    timeStamp = log.time_out_pm; }
        return rejectedSlot ? `⚠️ ${rejectedSlot} Photo Rejected (${timeStamp || 'Time Unknown'})` : null;
    };

    const getDailyHours = (log) => {
        if (log.hours_rendered && parseFloat(log.hours_rendered) > 0) {
            return parseFloat(log.hours_rendered).toFixed(2);
        }
        try {
            let total = 0;
            const dummy = '2000-01-01';
            const t = (s) => {
                if (!s || s === '-') return null;
                const d = new Date(`${dummy} ${s}`);
                return isNaN(d.getTime()) ? null : d.getTime();
            };
            const amIn = t(log.time_in_am), amOut = t(log.time_out_am);
            const pmIn = t(log.time_in_pm), pmOut = t(log.time_out_pm);
            if (amIn && amOut) total += (amOut - amIn) / 3_600_000;
            if (pmIn && pmOut) total += (pmOut - pmIn) / 3_600_000;
            if (total > 0) return total.toFixed(2);
        } catch { /* fall through */ }
        return null;
    };

    const getHoursClass = (log) => {
        const h = parseFloat(getDailyHours(log));
        if (isNaN(h) || h === 0) return styles.hours0;
        if (log.status?.toLowerCase() === 'leave') return styles.hoursLeave;
        if (h < 8) return styles.hoursLow;
        return styles.hoursNorm;
    };

    const handleGoToForms = (log) => {
        sessionStorage.setItem('appeal_logId',   log.id);
        sessionStorage.setItem('appeal_logDate',  log.formatted_date || log.date);
        navigate('/intern-dashboard/forms');
    };

    // ─── RENDER PAGINATION BUTTONS ───────────────────────────────────────────
    const renderPageButtons = () => {
        const buttons = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                buttons.push(
                    <button
                        key={i}
                        onClick={() => paginate(i)}
                        className={`${styles.pageNumBtn} ${currentPage === i ? styles.activePage : ''}`}
                    >
                        {i}
                    </button>
                );
            }
        } else {
            [1, 2, 3].forEach(i =>
                buttons.push(
                    <button
                        key={i}
                        onClick={() => paginate(i)}
                        className={`${styles.pageNumBtn} ${currentPage === i ? styles.activePage : ''}`}
                    >
                        {i}
                    </button>
                )
            );
            buttons.push(<span key="ellipsis" className={styles.pageEllipsis}>...</span>);
            buttons.push(
                <button
                    key={totalPages}
                    onClick={() => paginate(totalPages)}
                    className={`${styles.pageNumBtn} ${currentPage === totalPages ? styles.activePage : ''}`}
                >
                    {totalPages}
                </button>
            );
        }
        return buttons;
    };

    // ─── LOADING STATE ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-slate-500">
                <div className="w-10 h-10 border-4 border-slate-700 border-t-slate-300 rounded-full animate-spin mb-4" />
                <p>Syncing your logs...</p>
            </div>
        );
    }

    // ─── MAIN RENDER ─────────────────────────────────────────────────────────
    return (
        <div className={styles.pageWrapper}>
            <Toaster position="top-right" />

            {/* ── HEADER ──────────────────────────────────────────────────── */}
            <PageHeader
                title="Attendance History"
                onExportDTR={() => toast.success('Preparing DTR...')}
            />

            {/* ── STATS CARDS ─────────────────────────────────────────────── */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>This Month</span>
                    <span className={`${styles.statValue} ${styles.green}`}>{stats.presentDays}</span>
                    <span className={styles.statSub}>days present</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Total Hours</span>
                    <span className={`${styles.statValue} ${styles.blue}`}>
                        {stats.totalHours}<span style={{ fontSize: 16, fontWeight: 600 }}>h</span>
                    </span>
                    <span className={styles.statSub}>logged</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Absences</span>
                    <span className={`${styles.statValue} ${styles.red}`}>{stats.absences}</span>
                    <span className={styles.statSub}>this month</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Late</span>
                    <span className={`${styles.statValue} ${styles.orange}`}>{stats.late}</span>
                    <span className={styles.statSub}>this month</span>
                </div>
            </div>

            {/* ── FILTER BAR ──────────────────────────────────────────────── */}
            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    {FILTERS.map(f => (
                        <button
                            key={f.value}
                            className={`${styles.filterBtn} ${activeFilter === f.value ? styles.active : ''}`}
                            onClick={() => setActiveFilter(f.value)}
                        >
                            {f.dot && <span className={`${styles.dot} ${styles[f.dot]}`} />}
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className={styles.searchWrapper}>
                    <Search size={15} className={styles.searchIcon} />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search date..."
                        value={searchDate}
                        onChange={e => setSearchDate(e.target.value)}
                    />
                </div>
            </div>

            {/* ── TABLE ───────────────────────────────────────────────────── */}
            <div className={styles.cardContainer}>
                <table className={styles.logTable}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time In</th>
                            <th>Lunch Out</th>
                            <th>Lunch In</th>
                            <th>Time Out</th>
                            <th>Hours</th>
                            <th>Status</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {currentLogs.length === 0 ? (
                            <tr>
                                <td colSpan="8" className={styles.emptyRow}>
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
                                    <tr key={log.id}>
                                        {/* DATE */}
                                        <td className={styles.dateCell}>
                                            {log.formatted_date || log.date}
                                            {dayName && (
                                                <span className={styles.dateSub}>{dayName}</span>
                                            )}
                                        </td>

                                        {/* TIME PUNCHES */}
                                        <td>{log.time_in_am  || '–'}</td>
                                        <td>{log.time_out_am || '–'}</td>
                                        <td>{log.time_in_pm  || '–'}</td>
                                        <td>{log.time_out_pm || '–'}</td>

                                        {/* HOURS */}
                                        <td className={`${styles.hoursCell} ${hoursClass}`}>
                                            {hoursDisplay ?? '–'}
                                        </td>

                                        {/* STATUS */}
                                        <td>
                                            <span className={`${styles.badge} ${getStatusClass(log.status)}`}>
                                                {log.status || 'Pending'}
                                            </span>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className={styles.actionCell}>
                                            {rejectionWarning && log.appeal_status === null ? (
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-red-500 text-[10px] font-bold leading-tight">
                                                        {rejectionWarning}
                                                    </span>
                                                    <button
                                                        onClick={() => handleGoToForms(log)}
                                                        className="mt-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] py-1 px-2 rounded shadow transition-colors"
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
                                                <button className={styles.moreBtn}>
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

                {/* ── TABLE FOOTER (count + pagination) ────────────────────── */}
                {filteredLogs.length > 0 && (
                    <div className={styles.tableFooter}>
                        <span className={styles.recordCount}>
                            Showing {indexOfFirst + 1}–{Math.min(indexOfFirst + logsPerPage, filteredLogs.length)} of {filteredLogs.length} records
                        </span>

                        <div className={styles.paginationContainer}>
                            <button
                                className={styles.pageNavBtn}
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                ← Back
                            </button>

                            <div className={styles.pageNumbers}>
                                {renderPageButtons()}
                            </div>

                            <button
                                className={styles.pageNavBtn}
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Logs;