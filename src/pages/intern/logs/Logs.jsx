import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import styles from './Logs.module.css';
import PageHeader from "../../../components/PageHeader";
import { MoreHorizontal, AlertCircle, Search, FileText, X, Download } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import climbsLogo from '../../../assets/climbs.png';

const FILTERS = [
    { label: 'All',     value: 'all',     dot: null },
    { label: 'Present', value: 'present', dot: 'green' },
    { label: 'Absent',  value: 'absent',  dot: 'red' },
    { label: 'Late',    value: 'late',    dot: 'orange' },
];

const Logs = () => {
    // ─── ✨ EXACT LARAVEL DB SCHEMA SYNC ✨ ───────────────────────
    const user = JSON.parse(localStorage.getItem('user')) || {};

    // 1. Format Name
    const rawFirstName = user.first_name || '';
    const rawLastName = user.last_name || '';
    const internName = `${rawFirstName} ${rawLastName}`.trim().toUpperCase() || 'INTERN NAME';

    // 2. Expand School Name (No Abbreviations)
    let rawSchool = user.school || 'University of Science and Technology of Southern Philippines';
    if (rawSchool.toUpperCase() === 'USTP' || rawSchool.toUpperCase().includes('SOUTHERN PHILIPPINES')) {
        rawSchool = 'University of Science and Technology of Southern Philippines';
    }
    const school = rawSchool;

    // 3. Department (Checking assigned_department first, then assigned_branch)
    const department = user.assigned_department || user.assigned_branch || 'InsurTech';

    // 4. Expand Course Name
    let rawCourse = user.course || 'BS Information Technology';
    if (rawCourse.toUpperCase() === 'BSIT') {
        rawCourse = 'BS Information Technology';
    }
    const course = rawCourse;

    // 5. Required Hours (Using fallback if not explicitly in user table)
    const requiredHours = parseFloat(user.required_hours || 486);

    // ─── STATE ───────────────────────────────────────────────────────────────
    const [logs, setLogs]           = useState([]);
    const [loading, setLoading]     = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchDate, setSearchDate]     = useState('');
    const [currentPage, setCurrentPage]   = useState(1);
    
    const [showDtrPreview, setShowDtrPreview] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const logsPerPage = 15;
    const navigate    = useNavigate();

    // ─── HELPERS ─────────────────────────────────────────────────────────────
    const getDailyHours = (log) => {
        if (log.hours_rendered && parseFloat(log.hours_rendered) > 0) {
            return parseFloat(log.hours_rendered).toFixed(2);
        }
        try {
            let total = 0;
            const dummy = '2000-01-01';
            const t = (s) => {
                if (!s || s === '-' || s === 'null') return null;
                const d = new Date(`${dummy} ${s}`);
                return isNaN(d.getTime()) ? null : d.getTime();
            };
            const amIn = t(log.time_in_am), amOut = t(log.time_out_am);
            const pmIn = t(log.time_in_pm), pmOut = t(log.time_out_pm);
            if (amIn && amOut) total += (amOut - amIn) / 3_600_000;
            if (pmIn && pmOut) total += (pmOut - pmIn) / 3_600_000;
            if (total > 0) return total.toFixed(2);
        } catch { }
        return null;
    };

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

    const stats = useMemo(() => {
        const presentDays = logs.filter(l => l.status?.toLowerCase() === 'present').length;
        const absences    = logs.filter(l => l.status?.toLowerCase() === 'absent').length;
        const late        = logs.filter(l => l.status?.toLowerCase() === 'late').length;
        const totalHours  = logs.reduce((acc, l) => acc + parseFloat(getDailyHours(l) || 0), 0);
        return { presentDays, totalHours, absences, late };
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const statusMatch = activeFilter === 'all' || log.status?.toLowerCase() === activeFilter;
            const dateStr = (log.formatted_date || log.date || '').toLowerCase();
            const searchMatch = dateStr.includes(searchDate.toLowerCase());
            return statusMatch && searchMatch;
        });
    }, [logs, activeFilter, searchDate]);

    useEffect(() => { setCurrentPage(1); }, [activeFilter, searchDate]);

    const totalPages     = Math.ceil(filteredLogs.length / logsPerPage);
    const indexOfFirst   = (currentPage - 1) * logsPerPage;
    const currentLogs    = filteredLogs.slice(indexOfFirst, indexOfFirst + logsPerPage);
    const paginate       = (n) => setCurrentPage(n);

    // ─── DTR GENERATOR ───────────────────────────────────────────────────────
    const generateDtrData = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); 
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const monthName = today.toLocaleDateString('en-US', { month: 'long' }); 
        const generationDate = today.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });

        const dtrDays = [];
        let totalMonthHours = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(currentYear, currentMonth, day);
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

            if (isWeekend) continue; // Skip weekends

            const dayOfWeekStr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const targetYMD = dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
            
            const logMatch = logs.find(l => {
                try {
                    const lDateStr = l.raw_date || l.date || l.created_at;
                    if (!lDateStr) return false;
                    const logYMD = new Date(lDateStr).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
                    return logYMD === targetYMD;
                } catch { return false; }
            });

            const dailyHours = logMatch ? parseFloat(getDailyHours(logMatch)) || 0 : 0;
            totalMonthHours += dailyHours;

            dtrDays.push({
                day,
                dayName: dayOfWeekStr,
                amIn: logMatch?.time_in_am && logMatch.time_in_am !== '-' ? logMatch.time_in_am : '',
                amOut: logMatch?.time_out_am && logMatch.time_out_am !== '-' ? logMatch.time_out_am : '',
                pmIn: logMatch?.time_in_pm && logMatch.time_in_pm !== '-' ? logMatch.time_in_pm : '',
                pmOut: logMatch?.time_out_pm && logMatch.time_out_pm !== '-' ? logMatch.time_out_pm : '',
                hours: dailyHours > 0 ? dailyHours.toFixed(1) : ''
            });
        }
        
        const totalRenderedAllTime = stats.totalHours;
        const remainingHours = Math.max(0, requiredHours - totalRenderedAllTime);
        const completionPercentage = requiredHours > 0 ? ((totalRenderedAllTime / requiredHours) * 100).toFixed(1) : 0;

        return { dtrDays, monthName, totalMonthHours, generationDate, totalRenderedAllTime, remainingHours, completionPercentage };
    };

    const { dtrDays, monthName, totalMonthHours, generationDate, totalRenderedAllTime, remainingHours, completionPercentage } = useMemo(() => generateDtrData(), [logs, stats.totalHours, requiredHours]);

    // ─── PDF DOWNLOAD HANDLER ────────────────────────────────────────────────
    const handleDownloadPdf = async () => {
        setIsGeneratingPdf(true);
        const loadingToast = toast.loading('Generating DTR...');
        
        try {
            const element = document.getElementById('dtr-printable-area');
            const scrollArea = element.parentElement; 
            
            const originalOverflow = scrollArea.style.overflow;
            const originalHeight = scrollArea.style.height;
            scrollArea.style.overflow = 'visible';
            scrollArea.style.height = 'auto';
            
            const canvas = await html2canvas(element, { 
                scale: 2, 
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            
            scrollArea.style.overflow = originalOverflow;
            scrollArea.style.height = originalHeight;
            
            const imgData = canvas.toDataURL('image/png', 1.0);
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfPageHeight = pdf.internal.pageSize.getHeight();
            
            const imgRatio = canvas.width / canvas.height;
            let finalWidth = pdfWidth;
            let finalHeight = finalWidth / imgRatio;

            if (finalHeight > pdfPageHeight) {
                finalHeight = pdfPageHeight;
                finalWidth = finalHeight * imgRatio;
            }
            
            const xOffset = (pdfWidth - finalWidth) / 2;
            
            pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);
            pdf.save(`DTR_${internName.replace(/\s+/g, '_')}_${monthName}.pdf`);
            
            toast.success('DTR downloaded successfully!', { id: loadingToast });
            setShowDtrPreview(false);
        } catch (error) {
            console.error("PDF Generation Error: ", error);
            toast.error('Failed to generate PDF.', { id: loadingToast });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const renderPageButtons = () => {
        const buttons = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                buttons.push(<button key={i} onClick={() => paginate(i)} className={`${styles.pageNumBtn} ${currentPage === i ? styles.activePage : ''}`}>{i}</button>);
            }
        } else {
            [1, 2, 3].forEach(i => buttons.push(<button key={i} onClick={() => paginate(i)} className={`${styles.pageNumBtn} ${currentPage === i ? styles.activePage : ''}`}>{i}</button>));
            buttons.push(<span key="ellipsis" className={styles.pageEllipsis}>...</span>);
            buttons.push(<button key={totalPages} onClick={() => paginate(totalPages)} className={`${styles.pageNumBtn} ${currentPage === totalPages ? styles.activePage : ''}`}>{totalPages}</button>);
        }
        return buttons;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-slate-500">
                <div className="w-10 h-10 border-4 border-slate-700 border-t-slate-300 rounded-full animate-spin mb-4" />
                <p>Syncing your logs...</p>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <Toaster position="top-right" />

            <PageHeader title="Attendance History" onExportDTR={() => setShowDtrPreview(true)} />

            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>This Month</span>
                    <span className={`${styles.statValue} ${styles.green}`}>{stats.presentDays}</span>
                    <span className={styles.statSub}>days present</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Total Hours</span>
                    <span className={`${styles.statValue} ${styles.blue}`}>
                        {stats.totalHours.toFixed(0)}<span style={{ fontSize: 16, fontWeight: 600 }}>h</span>
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

                <div className={styles.actionGroup}>
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
                    <button className={styles.dtrBtn} onClick={() => setShowDtrPreview(true)}>
                        <FileText size={16} /> Preview DTR
                    </button>
                </div>
            </div>

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
                                        <td className={styles.dateCell}>
                                            {log.formatted_date || log.date}
                                            {dayName && <span className={styles.dateSub}>{dayName}</span>}
                                        </td>
                                        <td>{log.time_in_am  || '–'}</td>
                                        <td>{log.time_out_am || '–'}</td>
                                        <td>{log.time_in_pm  || '–'}</td>
                                        <td>{log.time_out_pm || '–'}</td>
                                        <td className={`${styles.hoursCell} ${hoursClass}`}>
                                            {hoursDisplay ?? '–'}
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${getStatusClass(log.status)}`}>
                                                {log.status || 'Pending'}
                                            </span>
                                        </td>
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

                {filteredLogs.length > 0 && (
                    <div className={styles.tableFooter}>
                        <span className={styles.recordCount}>
                            Showing {indexOfFirst + 1}–{Math.min(indexOfFirst + logsPerPage, filteredLogs.length)} of {filteredLogs.length} records
                        </span>

                        <div className={styles.paginationContainer}>
                            <button className={styles.pageNavBtn} onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>← Back</button>
                            <div className={styles.pageNumbers}>{renderPageButtons()}</div>
                            <button className={styles.pageNavBtn} onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>Next →</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ✨ DTR PREVIEW MODAL ✨ */}
            {showDtrPreview && (
                <div className={styles.modalOverlay}>
                    <div className={styles.dtrModalContent}>
                        
                        <div className={styles.dtrScrollArea}>
                            <div id="dtr-printable-area" className={styles.dtrPaper}>
                                
                                <div className={styles.dtrHeaderBlock}>
                                    <div className={styles.dtrLogoBox}>
                                        <img src={climbsLogo} alt="CLIMBS Logo" className={styles.dtrLogo} />
                                    </div>
                                    <div className={styles.dtrHeaderText}>
                                        <h1 className={styles.dtrCoopName}>CLIMBS Life and General Insurance Cooperative</h1>
                                        <p className={styles.dtrAddress}>Zone 5 Highway, Bulua, Cagayan de Oro City, Misamis Oriental</p>
                                    </div>
                                </div>
                                <div className={styles.dtrSeparator}></div>

                                <div className={styles.dtrTitleBlock}>
                                    <h2 className={styles.dtrDocTitle}>Daily Time Record</h2>
                                    <p className={styles.dtrMonthSub}>For the Month of {monthName}</p>
                                </div>

                                <div className={styles.dtrDetailsGrid}>
                                    <div className={styles.detailColLeft}>
                                        <p><strong>Name:</strong> {internName}</p>
                                        <p><strong>School:</strong> {school}</p>
                                        <p><strong>Position:</strong> Intern</p>
                                    </div>
                                    <div className={styles.detailColRight}>
                                        <p><strong>Department:</strong> {department}</p>
                                        <p><strong>Course:</strong> {course}</p>
                                        <p><strong>Required Hours:</strong> {requiredHours}</p>
                                    </div>
                                </div>

                                <table className={styles.dtrMainTable}>
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Day</th>
                                            <th>Time In</th>
                                            <th>Lunch Out</th>
                                            <th>Lunch In</th>
                                            <th>Time Out</th>
                                            <th>Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dtrDays.map((d) => (
                                            <tr key={d.day}>
                                                <td className={styles.textCenter}>{d.day}</td>
                                                <td className={styles.textCenter}>{d.dayName}</td>
                                                <td className={styles.textCenter}>{d.amIn}</td>
                                                <td className={styles.textCenter}>{d.amOut}</td>
                                                <td className={styles.textCenter}>{d.pmIn}</td>
                                                <td className={styles.textCenter}>{d.pmOut}</td>
                                                <td className={styles.textCenter}>{d.hours}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="6" className={styles.textRight} style={{ paddingRight: '15px' }}>
                                                <strong>Total Hours This Month:</strong>
                                            </td>
                                            <td className={styles.textCenter}>
                                                <strong>{totalMonthHours.toFixed(1)}</strong>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>

                                <div className={styles.dtrSummaryStats}>
                                    <p><strong>Total Rendered Hours:</strong> {totalRenderedAllTime.toFixed(2)} / {requiredHours} hours</p>
                                    <p><strong>Remaining Hours:</strong> {remainingHours.toFixed(2)} hours</p>
                                    <p><strong>Completion:</strong> {completionPercentage}%</p>
                                </div>

                                <div className={styles.dtrSignatureSection}>
                                    <div className={styles.sigBlock}>
                                        <div className={styles.sigLine}></div>
                                        <p className={styles.sigName}>{internName}</p>
                                        <p className={styles.sigTitle}>OJT Intern</p>
                                    </div>
                                    <div className={styles.sigBlock}>
                                        <div className={styles.sigLine}></div>
                                        <p className={styles.sigName}>&nbsp;</p>
                                        <p className={styles.sigTitle}>OJT Coordinator</p>
                                    </div>
                                </div>

                                <div className={styles.dtrFooterNote}>
                                    <p>This document was generated from the CLIMBS OJT Attendance Monitoring System.</p>
                                    <p>Generated on: {generationDate}</p>
                                </div>

                            </div>
                        </div>

                        <div className={styles.dtrModalActions}>
                            <button className={styles.cancelBtn} onClick={() => setShowDtrPreview(false)}>
                                Cancel
                            </button>
                            <button className={styles.printBtn} onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                                {isGeneratingPdf ? 'Processing...' : 'Download DTR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Logs;