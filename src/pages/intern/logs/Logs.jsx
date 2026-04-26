import React, { useState, useEffect } from 'react';
import api from '../../../api/axios'; 
import styles from './Logs.module.css';
import { FileDown, MoreHorizontal } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await api.get('/attendance/history');
                setLogs(response.data);
            } catch (err) {
                console.error("Error fetching logs:", err);
                toast.error("Could not load attendance history.");
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'present': return styles.statusPresent;
            case 'late': return styles.statusLate;
            case 'absent': return styles.statusAbsent;
            default: return styles.statusDefault;
        }
    };

    // ✨ FIXED DAY CALCULATOR ✨
    // Now it perfectly handles dates that look like "April 26, 2026"
    const getSafeDayOfWeek = (log) => {
        if (log.day_of_week) return log.day_of_week; 
        
        // Grab whichever date format the backend gave us
        const dateString = log.date || log.formatted_date;
        if (!dateString) return '';
        
        try {
            // Let the browser natively read "April 26, 2026"
            const dateObj = new Date(dateString);
            
            // If it's a valid date, return 'Mon', 'Tue', 'Sun', etc.
            if (!isNaN(dateObj.getTime())) {
                return dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            }
            return '';
        } catch  {
            return ''; 
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-slate-500">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-yellow-400 rounded-full animate-spin mb-4"></div>
                <p>Syncing your logs...</p>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <Toaster position="top-right" />
            
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>Attendance History</h1>
                <div className={styles.headerActions}>
                    <button className={styles.dtrBtn} onClick={() => toast.success("Preparing DTR...")}>
                        <FileDown size={18} strokeWidth={2.5} /> DTR
                    </button>
                </div>
            </div>

            <div className={styles.cardContainer}>
                <table className={styles.logTable}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time In (AM)</th>
                            <th>Lunch Out</th>
                            <th>Time In (PM)</th>
                            <th>Time Out </th>
                            <th>Total Hours</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="8" className={styles.emptyRow}>No attendance records found yet.</td>
                            </tr>
                        ) : (
                            logs.map((log) => {
                                const dayName = getSafeDayOfWeek(log);
                                
                                return (
                                    <tr key={log.id}>
                                        <td className={styles.dateCell}>
                                            {/* ✨ The Day of the Week is rendered right here ✨ */}
                                            {dayName && (
                                                <span style={{ fontWeight: '600', color: '#64748b', marginRight: '6px' }}>
                                                    {dayName},
                                                </span>
                                            )}
                                            {log.formatted_date || log.date}
                                        </td>
                                        <td>{log.time_in_am || '--:--'}</td>
                                        <td>{log.time_out_am || '--:--'}</td>
                                        <td>{log.time_in_pm || '--:--'}</td>
                                        <td>{log.time_out_pm || '--:--'}</td>
                                        <td className={styles.hoursCell}>
                                            {log.hours_rendered && log.hours_rendered > 0 ? `${log.hours_rendered} hrs` : '-'}
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${getStatusClass(log.status)}`}>
                                                {log.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className={styles.actionCell}>
                                            <button className={styles.moreBtn}><MoreHorizontal size={18} /></button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Logs;