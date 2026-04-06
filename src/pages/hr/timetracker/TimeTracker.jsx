import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import styles from './TimeTracker.module.css';
import { Clock, User, AlertCircle, Info } from 'lucide-react';

const TimeTracker = () => {
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * 🕒 FORMATTER 1: For Clock Times (AM/PM)
     * Fixes the "Invalid Date" bug from MySQL strings.
     */
    const formatTime = (timeString) => {
        if (!timeString) return "---";
        try {
            // Replace space with 'T' for cross-browser compatibility
            const cleanString = timeString.includes(' ') 
                ? timeString.replace(' ', 'T') 
                : timeString;

            const date = cleanString.includes('T') || cleanString.includes('-')
                ? new Date(cleanString)
                : new Date(`1970-01-01T${cleanString}`);

            if (isNaN(date.getTime())) return "---";

            return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true 
            });
        } catch  {
            return "---";
        }
    };

    /**
     * ⏳ FORMATTER 2: For Total Duration
     * Converts raw minutes (e.g., 79) into "1h 19m"
     */
    const formatDuration = (totalMinutes) => {
    // Convert to a number just in case it's a string
    const minutes = parseFloat(totalMinutes);
    
    if (!minutes || minutes <= 0) return "---";

    // If the number is very small (like 1.31), the database is still sending Decimals.
    // We need to convert that decimal back to minutes.
    let finalMinutes = minutes;
    if (minutes < 24 && !Number.isInteger(minutes)) {
        finalMinutes = Math.round(minutes * 60);
    }

    const h = Math.floor(finalMinutes / 60);
    const m = Math.round(finalMinutes % 60);
    
    if (h > 0) {
        return `${h}h ${m > 0 ? m + 'm' : ''}`;
    }
    return `${m}m`;
};

    const fetchAttendance = useCallback(async () => {
        try {
            const response = await api.get('/hr/interns');
            setInterns(response.data);
            setError(null);
        } catch (err) {
            console.error("Fetch error:", err);
            setError("Unable to sync with the attendance database.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAttendance();
        const interval = setInterval(fetchAttendance, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, [fetchAttendance]);

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
            <div className={styles.header}>
                <h1 className={styles.title}>
                    <Clock size={28} className={styles.titleIcon} /> 
                    Daily Time Tracker
                </h1>
                <div className={styles.statusIndicator}>
                    <span className={styles.pulse}></span> Live Monitoring Active
                </div>
            </div>

            {error && (
                <div className={styles.errorBanner}>
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            <div className={styles.tableContainer}>
                <table className={styles.trackerTable}>
                    <thead>
                        <tr>
                            <th><User size={16} /> Intern Information</th>
                            <th>Time In (AM)</th>
                            <th>Lunch Out</th>
                            <th>Lunch In</th>
                            <th>Time Out (PM)</th>
                            <th>Total Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {interns.length > 0 ? (
                            interns.map((user) => {
                                const log = user.attendance_logs?.[0];
                                const statusClass = log?.status || 'absent';

                                return (
                                    <tr key={user.id} className={styles.tableRow}>
                                        <td className={styles.userCell}>
                                            <div className={styles.userName}>
                                                {user.first_name} {user.last_name}
                                            </div>
                                            <div className={styles.userEmail}>{user.email}</div>
                                        </td>
                                        <td className={styles.timeInCell}>{formatTime(log?.time_in)}</td>
                                        <td>{formatTime(log?.lunch_out)}</td>
                                        <td>{formatTime(log?.lunch_in)}</td>
                                        <td className={styles.timeOutCell}>{formatTime(log?.time_out)}</td>
                                        
                                        {/* EXACT MINUTES FORMATTING */}
                                        <td className={styles.hoursCell}>
                                            <span className={styles.hourText}>
                                                {formatDuration(log?.hours_rendered)}
                                            </span>
                                        </td>

                                        <td>
                                            <span className={`${styles.badge} ${styles[statusClass]}`}>
                                                {statusClass.toUpperCase()}
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
    );
};

export default TimeTracker;