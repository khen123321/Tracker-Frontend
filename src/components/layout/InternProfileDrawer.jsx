import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, FileText, MapPin, School, Briefcase, Loader2, 
    User, Phone, Mail, AlertCircle 
} from 'lucide-react';
import api from '../../api/axios';
import styles from './InternProfileDrawer.module.css';

// ✨ Added 'isOpen' to props so it updates every time it opens!
export default function InternProfileDrawer({ internId, isOpen, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ hours: 0, days: 0, avgIn: '--:--', rate: '0%' });

    useEffect(() => {
        const fetchInternData = async () => {
            // Wait for an ID, and don't fetch if explicitly closed
            if (!internId || isOpen === false) return;

            try {
                setLoading(true);
                setError(null);
                
                // ✨ STEP 1: Fetch Profile using the Intern ID
                const profileRes = await api.get(`/hr/interns/${internId}?t=${Date.now()}`);
                const internData = profileRes.data.intern || profileRes.data;
                setData(internData);

                // ✨ STEP 2: The Sneaky Bug Fix! 
                // We grab the true user_id from the profile so the attendance route works perfectly.
                const correctIdForAttendance = internData.user_id || internId;

                // ✨ STEP 3: Fetch Attendance using the correct User ID
                const attendanceRes = await api.get(`/hr/interns/${correctIdForAttendance}/attendance?t=${Date.now()}`);
                
                setLogs(attendanceRes.data.logs || []);
                setStats(attendanceRes.data.stats || { hours: 0, days: 0, avgIn: '--:--', rate: '0%' });

            } catch (err) {
                console.error("Error fetching intern data:", err);
                setError("Failed to load intern profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchInternData();
    }, [internId, isOpen]);

    const displayHours = useMemo(() => {
        let totalHours = 0;
        if (logs.length > 0) {
            logs.forEach(log => {
                totalHours += parseFloat(log.total_hours || 0);
            });
            return totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1); 
        }
        return stats.hours || 0;
    }, [logs, stats]);

    if (!internId) return null;

    const formatDate = (date) => {
        return date 
            ? new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
            : 'N/A';
    };

    const handleViewDoc = async (type) => {
        try {
            const res = await api.get(`/hr/interns/${internId}/document/${type}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] }));
            window.open(url, '_blank');
        } catch { 
            alert("This document is not yet uploaded or cannot be found."); 
        }
    };

    const activeStatus = data?.user?.status || data?.status || 'Pending';
    const isActive = activeStatus.toLowerCase() === 'active';

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.drawer} onClick={e => e.stopPropagation()}>
                
                {/* ─── HEADER SECTION ─── */}
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <div className={`${styles.statusBadge} ${isActive ? styles.active : styles.inactive}`}>
                            {activeStatus.charAt(0).toUpperCase() + activeStatus.slice(1)}
                        </div>
                        <button className={styles.closeBtn} onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className={styles.profileHero}>
                        <div className={styles.avatarContainer}>
                            <img 
                                src={data?.avatar_url || data?.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data?.user?.last_name || 'intern'}`} 
                                className={styles.avatar} 
                                alt="Intern Avatar" 
                            />
                        </div>
                        <h2 className={styles.name}>
                            {data?.user?.first_name || 'Unknown'} {data?.user?.last_name || 'Intern'}
                        </h2>
                        <div className={styles.emailRow}>
                            <Mail size={12} /> <span>{data?.user?.email || 'No email provided'}</span>
                        </div>
                    </div>
                </div>

                {/* ─── CONTENT SECTION ─── */}
                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loadingState}>
                            <Loader2 size={32} className={styles.spin} />
                            <p>Accessing Secure Data...</p>
                        </div>
                    ) : error ? (
                        <div className={styles.errorState}>
                            <AlertCircle size={32} />
                            <p>{error}</p>
                        </div>
                    ) : (
                        <>
                            {/* Stats Cards */}
                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <label>Total Hours</label>
                                    <p>{displayHours} / {data?.required_hours || 486}</p>
                                </div>
                                <div className={styles.statCard}>
                                    <label>Start Date</label>
                                    <p>{formatDate(data?.date_started)}</p>
                                </div>
                            </div>

                            {/* Academic Details */}
                            <div className={styles.infoGroup}>
                                <h4 className={styles.groupLabel}>Academic Info</h4>
                                <div className={styles.dataBox}>
                                    <div className={styles.dataRow}>
                                        <School size={14}/> <strong>School:</strong> 
                                        <span>{data?.school?.name || 'N/A'}</span>
                                    </div>
                                    <div className={styles.dataRow}>
                                        <Briefcase size={14}/> <strong>Course:</strong> 
                                        <span>{data?.course || 'BS Information Technology'}</span>
                                    </div>
                                    <div className={styles.dataRow}>
                                        <MapPin size={14}/> <strong>Branch:</strong> 
                                        <span>{data?.branch?.name || 'Main Office'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <div className={styles.infoGroup}>
                                <h4 className={styles.groupLabel}>Emergency Contact</h4>
                                <div className={styles.dataBox}>
                                    <div className={styles.dataRow}>
                                        <User size={14}/> 
                                        <span>{data?.emergency_name || 'Not Provided'}</span>
                                    </div>
                                    <div className={styles.dataRow}>
                                        <Phone size={14}/> 
                                        <span>{data?.emergency_number || 'Not Provided'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Required Documents */}
                            <div className={styles.infoGroup}>
                                <h4 className={styles.groupLabel}>Required Documents</h4>
                                <div className={styles.docList}>
                                    {[
                                        { label: 'Resume / CV', key: 'resume', exists: data?.has_resume },
                                        { label: 'Memorandum of Agreement', key: 'moa', exists: data?.has_moa },
                                        { label: 'Endorsement Letter', key: 'endorsement', exists: data?.has_endorsement },
                                        { label: 'Non-Disclosure Agreement', key: 'nda', exists: data?.has_nda },
                                        { label: 'Intern Pledge', key: 'pledge', exists: data?.has_pledge }
                                    ].map(doc => (
                                        <div key={doc.key} className={styles.docItem}>
                                            <div className={styles.docMain}>
                                                <FileText size={16} className={doc.exists ? styles.iconGreen : styles.iconGray} />
                                                <span>{doc.label}</span>
                                            </div>
                                            {doc.exists ? (
                                                <button onClick={() => handleViewDoc(doc.key)} className={styles.viewLink}>
                                                    View File
                                                </button>
                                            ) : (
                                                <span className={styles.missingLabel}>Missing</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}