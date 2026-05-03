import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Award, IdCard, Calendar, Download, Grid, List, Filter,
  Clock, CalendarDays, Activity, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import api from '../../../api/axios';
import styles from './InternDetailsModal.module.css';
import GenerateIdModal from './GenerateIdModal';
import CertificateTemplate from '../interns/CertificateTemplate'; 
import html2canvas from 'html2canvas'; 
import { jsPDF } from 'jspdf'; 

export default function InternDetailsModal({ intern, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('grid');
  const [stats, setStats] = useState({ hours: 0, days: 0, avgIn: '--:--', rate: '0%' });
  
  const [showIdModal, setShowIdModal] = useState(false);
  
  // State for the Certificate Preview Modal
  const [showCertPreview, setShowCertPreview] = useState(false);
  const [isCertLoading, setIsCertLoading] = useState(false);
  const certRef = useRef(null);

  // ✨ NEW: State to hold the Base64 image
  const [base64Avatar, setBase64Avatar] = useState(null);

  const [filterPeriod, setFilterPeriod] = useState('This Month');
  const [statusFilter, setStatusFilter] = useState('All'); 

  useEffect(() => {
    const fetchInternAttendance = async () => {
      if (!intern?.id) { 
        setLoading(false); 
        return; 
      }
      try {
        setLoading(true);
        const response = await api.get(`/hr/interns/${intern.id}/attendance`);
        setLogs(response.data.logs || []);
        setStats(response.data.stats || { hours: 0, days: 0, avgIn: '--:--', rate: '0%' });
      } catch (err) {
        console.error("Failed to sync attendance:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInternAttendance();
  }, [intern]);

  if (!intern) return null;

  const formatTime = (time) => {
    if (!time || time === '00:00:00') return '--:--';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const getSafeDayOfWeek = (log) => {
    if (log.day_of_week) return log.day_of_week; 
    if (!log.date) return '';
    try {
        if (log.date.includes('-')) {
            const [year, month, day] = log.date.split('-');
            const dateObj = new Date(year, month - 1, day);
            return dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        }
        const dateObj = new Date(log.date);
        if (!isNaN(dateObj.getTime())) return dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        return '';
    } catch (e) {
        return '';
    }
  };

  const getGridColumnStart = (dateString) => {
    try {
      const parts = dateString.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const day = d.getDay(); 
      if (day === 0 || day === 6) return 1; 
      return day;
    } catch {
      return 1;
    }
  };

  // Define the image URL (Using PNG instead of SVG)
  const profilePhotoUrl = intern.avatar_url || intern.rawData?.intern?.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${intern.name || 'default'}`;

  // ✨ NEW: Convert the external image to a safe Base64 string silently in the background
  useEffect(() => {
    const convertImageToBase64 = async () => {
      try {
        const response = await fetch(profilePhotoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setBase64Avatar(reader.result); // Saves the image as raw text!
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Failed to convert profile picture:", err);
        setBase64Avatar(profilePhotoUrl); // Fallback just in case
      }
    };
    
    if (profilePhotoUrl) {
      convertImageToBase64();
    }
  }, [profilePhotoUrl]);

  const isSameDate = (d1, d2) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getFullYear() === date2.getFullYear() && 
           date1.getMonth() === date2.getMonth() && 
           date1.getDate() === date2.getDate();
  };

  const parseSafeDate = (dateString) => {
    if (!dateString) return null;
    let cleanDate = dateString.split('T')[0].split(' ')[0];
    if (cleanDate.includes('-')) {
        const [year, month, day] = cleanDate.split('-');
        return new Date(year, month - 1, day);
    }
    const d = new Date(cleanDate);
    return isNaN(d.getTime()) ? null : d;
  };

  const displayLogs = useMemo(() => {
    if (!logs) return [];

    const now = new Date();
    
    const profileStart = intern.rawData?.intern?.date_started || intern.rawData?.date_started || intern.rawData?.created_at;
    let trueStartDate = parseSafeDate(profileStart);

    if (logs.length > 0) {
      const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
      const firstLogDate = parseSafeDate(sortedLogs[0].date);
      if (!trueStartDate || firstLogDate < trueStartDate) {
         trueStartDate = firstLogDate;
      }
    }

    if (!trueStartDate) {
        trueStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    let startDate = new Date();
    let endDate = new Date(now); 

    if (filterPeriod === 'This Month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filterPeriod === 'Last Month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0); 
    } else {
      startDate = new Date(trueStartDate);
    }

    if (startDate < trueStartDate) {
      startDate = new Date(trueStartDate);
    }

    if (endDate > now) {
      endDate = new Date(now);
    }

    const workingDays = [];
    let curr = new Date(startDate);
    curr.setHours(0,0,0,0);
    endDate.setHours(0,0,0,0);

    while (curr <= endDate) {
      const dayOfWeek = curr.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { 
        workingDays.push(new Date(curr));
      }
      curr.setDate(curr.getDate() + 1);
    }

    let completeLogs = workingDays.map(calendarDate => {
      const existingLog = logs.find(l => isSameDate(l.date, calendarDate));
      if (existingLog) return existingLog;

      const formattedDate = calendarDate.toLocaleDateString('en-CA'); 
      return {
        id: `absent-${formattedDate}`,
        date: formattedDate,
        status: 'Absent',
        am_in: null, am_out: null, pm_in: null, pm_out: null,
        total_hours: 0
      };
    });

    logs.forEach(log => {
      const isAlreadyIncluded = completeLogs.some(cl => isSameDate(cl.date, log.date));
      if (!isAlreadyIncluded) completeLogs.push(log);
    });

    completeLogs.sort((a, b) => new Date(a.date) - new Date(b.date));

    return completeLogs.filter(log => {
      if (statusFilter === 'All') return true;
      const logStatus = (log.status || 'Present').toLowerCase();
      return logStatus === statusFilter.toLowerCase();
    });

  }, [logs, filterPeriod, statusFilter, intern]);

  const groupedByMonth = useMemo(() => {
    const groups = {};
    displayLogs.forEach(log => {
      const [year, month, day] = log.date.split('-');
      const d = new Date(year, month - 1, day);
      const monthName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!groups[monthName]) groups[monthName] = [];
      groups[monthName].push(log);
    });
    return groups;
  }, [displayLogs]);

  const displayStats = useMemo(() => {
    let totalHours = 0;
    let daysPresent = 0;

    displayLogs.forEach(log => {
      totalHours += parseFloat(log.total_hours || 0);
      if (log.status && log.status.toLowerCase() !== 'absent') daysPresent += 1;
    });

    return {
      hours: totalHours.toFixed(1),
      days: daysPresent,
      avgIn: stats.avgIn, 
      rate: stats.rate 
    };
  }, [displayLogs, stats]);

  const handleDownloadDTR = () => {
    if (displayLogs.length === 0) {
      alert("No attendance records to download for this period.");
      return;
    }

    const csvRows = [];
    csvRows.push(`"DAILY TIME RECORD"`);
    csvRows.push(`"Name:","${intern.name}"`);
    csvRows.push(`"School:","${intern.school || 'N/A'}"`);
    csvRows.push(`"Course:","${intern.course || 'N/A'}"`);
    csvRows.push(`"Department:","${intern.department || 'N/A'}"`);
    csvRows.push(`"Period:","${filterPeriod}"`);
    csvRows.push(""); 

    const headers = ["Date", "Day", "Status", "AM In", "AM Out", "PM In", "PM Out", "Total Hours"];
    csvRows.push(headers.map(h => `"${h}"`).join(","));

    displayLogs.forEach(log => {
      const row = [
        log.date,
        getSafeDayOfWeek(log), 
        log.status || 'Present',
        formatTime(log.am_in),
        formatTime(log.am_out),
        formatTime(log.pm_in),
        formatTime(log.pm_out),
        log.total_hours || 0
      ];
      csvRows.push(row.map(cell => `"${cell}"`).join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${intern.name.replace(/ /g, '_')}_DTR_${filterPeriod.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCertificate = async () => {
    setIsCertLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); 
      
      const element = certRef.current;
      
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth, 
        windowHeight: element.scrollHeight
      });
      
      const dataImage = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('landscape', 'mm', 'a4'); 
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(dataImage, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const safeName = intern.name ? intern.name.replace(/ /g, '_') : 'Intern';
      pdf.save(`${safeName}_Certificate.pdf`);
      
    } catch (error) {
      console.error("Error generating certificate:", error);
      alert("Failed to generate certificate.");
    } finally {
      setIsCertLoading(false);
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>

          <div className={styles.header}>
            <h2 className={styles.modalTitle}>Intern Details</h2>
            <div className={styles.headerActions} style={{ position: 'relative', zIndex: 10 }}>
              
              <button className={styles.actionBtn} onClick={() => setShowCertPreview(true)}>
                <Award size={13} /> Get Certificate
              </button>

              <button className={styles.actionBtn} onClick={() => setShowIdModal(true)}>
                <IdCard size={13} /> Generate ID
              </button>
              
              <div className={styles.filterDropdown} style={{ position: 'relative', overflow: 'hidden' }}>
                <Calendar size={13} style={{ zIndex: 1 }} /> 
                <span style={{ zIndex: 1, pointerEvents: 'none' }}>{filterPeriod}</span>
                <select 
                  value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                >
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="All Time">All Time</option>
                </select>
              </div>

              <button className={styles.actionBtn} onClick={handleDownloadDTR}>
                <Download size={13} /> Download DTR
              </button>

              <button className={styles.closeBtn} onClick={onClose}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div className={styles.scrollableContent}>
            <div className={styles.profileSection}>
              <div className={styles.profileBasic}>
                <div className={styles.avatarLarge}>
                  <img src={profilePhotoUrl} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                </div>
                <div>
                  <h3 className={styles.internName}>{intern.name}</h3>
                  <p className={styles.internEmail}>{intern.email}</p>
                </div>
              </div>
              <div className={styles.infoBadges}>
                <div className={styles.badgeBox}>
                  <span className={styles.badgeValue}>{intern.department || 'N/A'}</span>
                  <span className={styles.badgeLabel}>Department</span>
                </div>
                <div className={styles.badgeBox}>
                  <span className={styles.badgeValue}>{intern.school || 'N/A'}</span>
                  <span className={styles.badgeLabel}>School</span>
                </div>
                <div className={styles.badgeBox}>
                  <span className={styles.badgeValue}>{intern.course || 'N/A'}</span>
                  <span className={styles.badgeLabel}>Course</span>
                </div>
              </div>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIconWrapper}><Clock size={19} /></div>
                <div>
                  <h4 className={styles.statNumber}>{displayStats.hours}</h4>
                  <p className={styles.statLabel}>Filtered Hours</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIconWrapper}><CalendarDays size={19} /></div>
                <div>
                  <h4 className={styles.statNumber}>{displayStats.days}</h4>
                  <p className={styles.statLabel}>Days Present</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIconWrapper}><Clock size={19} /></div>
                <div>
                  <h4 className={styles.statNumber}>{displayStats.avgIn}</h4>
                  <p className={styles.statLabel}>Avg. Time In</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIconWrapper}><Activity size={19} /></div>
                <div>
                  <h4 className={styles.statNumber}>{displayStats.rate}</h4>
                  <p className={styles.statLabel}>Completion Rate</p>
                </div>
              </div>
            </div>

            <div className={styles.historySection}>
              <div className={styles.historyHeader}>
                <h3 className={styles.historyTitle}>Attendance History</h3>
                <div className={styles.historyControls}>
                  <div className={styles.viewToggles}>
                    <button className={`${styles.toggleBtn} ${activeView === 'grid' ? styles.activeToggle : ''}`} onClick={() => setActiveView('grid')}><Grid size={13} /></button>
                    <button className={`${styles.toggleBtn} ${activeView === 'list' ? styles.activeToggle : ''}`} onClick={() => setActiveView('list')}><List size={13} /></button>
                  </div>
                  
                  <div className={styles.filterDropdown} style={{ position: 'relative', overflow: 'hidden', padding: '6px 12px', background: '#f1f5f9', borderRadius: '6px' }}>
                    <Filter size={13} style={{ zIndex: 1, marginRight: '6px' }} /> 
                    <span style={{ zIndex: 1, pointerEvents: 'none', fontSize: '13px', fontWeight: '500', color: '#334155' }}>
                      {statusFilter}
                    </span>
                    <select 
                      value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    >
                      <option value="All">All Logs</option>
                      <option value="Present">Present</option>
                      <option value="Late">Late</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Fetching attendance records...</div>
              ) : displayLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No attendance records found.
                </div>
              ) : (
                <div className={styles.calendarContainer}>
                  {Object.entries(groupedByMonth).map(([monthName, monthLogs]) => (
                    <div key={monthName} className={styles.monthBlock}>
                      
                      <h4 className={styles.monthTitle}>{monthName}</h4>
                      
                      {activeView === 'grid' && (
                        <div className={styles.daysHeaderRow}>
                           <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span>
                        </div>
                      )}

                      <div className={activeView === 'grid' ? styles.calendarGrid : styles.cardsGridList}>
                        {monthLogs.map((log, index) => {
                          const isAbsent = (log.status || '').toLowerCase() === 'absent';
                          const isLate = (log.status || '').toLowerCase() === 'late';
                          const dayName = getSafeDayOfWeek(log);
                          
                          return (
                            <div 
                              key={log.id} 
                              className={styles.attendanceCard} 
                              style={{ 
                                opacity: isAbsent ? 0.7 : 1, 
                                borderLeft: isAbsent ? '3px solid #ef4444' : isLate ? '3px solid #f59e0b' : '3px solid #10b981',
                                gridColumnStart: (activeView === 'grid' && index === 0) ? getGridColumnStart(log.date) : 'auto'
                              }}
                            >
                              <div className={styles.cardHeader}>
                                <div className={styles.cardDate}>
                                  <Calendar size={11} /> 
                                  {dayName && <span style={{ fontWeight: '600', marginRight: '4px' }}>{dayName},</span>}
                                  {log.date.split('-')[2]}
                                </div>
                                <span className={styles.statusPill} style={{ 
                                  backgroundColor: isAbsent ? '#fef2f2' : isLate ? '#fffbeb' : '#ecfdf5',
                                  color: isAbsent ? '#ef4444' : isLate ? '#f59e0b' : '#10b981'
                                }}>
                                  {isAbsent ? <AlertCircle size={9} /> : <CheckCircle size={9} />} 
                                  {log.status || 'Present'}
                                </span>
                              </div>
                              
                              <div className={styles.cardBody}>
                                <div className={styles.timeRow}>
                                  <div className={styles.timeCol}>
                                    <span className={styles.timeLabel}>In</span>
                                    <span className={styles.timeValue} style={{ color: isAbsent ? '#94a3b8' : '#0f172a' }}>{isAbsent ? '--:--' : formatTime(log.am_in)}</span>
                                  </div>
                                  <div className={styles.timeColRight}>
                                    <span className={styles.timeLabel}>Out</span>
                                    <span className={styles.timeValue} style={{ color: isAbsent ? '#94a3b8' : '#0f172a' }}>{isAbsent ? '--:--' : formatTime(log.pm_out)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showIdModal && <GenerateIdModal intern={{...intern, avatar_url: profilePhotoUrl}} onClose={() => setShowIdModal(false)} />}
      
      {/* The Certificate Preview Modal */}
      {showCertPreview && (
        <div 
          className={styles.overlay} 
          onClick={() => setShowCertPreview(false)} 
          style={{ zIndex: 9999999 }}
        >
          <div 
            className={styles.modalContainer} 
            style={{ width: 'auto', maxWidth: '95vw', padding: 0, overflow: 'hidden' }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={styles.header} style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', margin: 0, borderRadius: 0 }}>
              <h2 className={styles.modalTitle}>Certificate Preview</h2>
              <button className={styles.closeBtn} onClick={() => setShowCertPreview(false)}>
                <X size={20} />
              </button>
            </div>

            {/* The actual visible Certificate */}
            <div style={{ padding: '30px', backgroundColor: '#f8fafc', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
              <div ref={certRef} style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <CertificateTemplate 
                  intern={{
                    ...intern,
                    avatar_url: base64Avatar || profilePhotoUrl, /* ✨ FIXED: Feed the safe Base64 image directly to the component! */
                    hours: stats.hours, 
                    gender: intern.rawData?.intern?.gender || 'female',
                    dateStarted: intern.rawData?.intern?.date_started || intern.rawData?.created_at,
                    dateCompleted: new Date().toISOString().split('T')[0]
                  }} 
                />
              </div>
            </div>

            {/* Modal Footer with Download Button */}
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
              <button 
                onClick={handleDownloadCertificate} 
                disabled={isCertLoading}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', backgroundColor: '#0B1EAE', color: '#fff',
                  border: 'none', borderRadius: '6px', fontWeight: '500', cursor: isCertLoading ? 'not-allowed' : 'pointer',
                  opacity: isCertLoading ? 0.7 : 1
                }}
              >
                {isCertLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
                {isCertLoading ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}