import React, { useState, useEffect } from 'react';
import {
  X, Award, IdCard, Calendar, Download, Grid, List, ArrowUpDown,
  Clock, CalendarDays, Activity, CheckCircle
} from 'lucide-react';
import api from '../../../api/axios';
import styles from './InternDetailsModal.module.css';
import GenerateIdModal from './GenerateIdModal';

export default function InternDetailsModal({ intern, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('grid');
  const [stats, setStats] = useState({ hours: 0, days: 0, avgIn: '--:--', rate: '0%' });
  const [showIdModal, setShowIdModal] = useState(false);

  useEffect(() => {
    const fetchInternAttendance = async () => {
      if (!intern?.id) { setLoading(false); return; }
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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className={styles.header}>
          <h2 className={styles.modalTitle}>Intern Details</h2>
          <div className={styles.headerActions}>
            <button className={styles.actionBtn}><Award size={13} /> Get Certificate</button>
            <button className={styles.actionBtn} onClick={() => setShowIdModal(true)}>
              <IdCard size={13} /> Generate ID
            </button>
            <div className={styles.filterDropdown}><Calendar size={13} /> This Month
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            <button className={styles.actionBtn}><Download size={13} /> Download DTR</button>
            <button className={styles.closeBtn} onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        <div className={styles.scrollableContent}>

          {/* PROFILE */}
          <div className={styles.profileSection}>
            <div className={styles.profileBasic}>
              <div className={styles.avatarLarge}>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${intern.name}`} alt="profile" />
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

          {/* STATS */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIconWrapper}><Clock size={19} /></div>
              <div><h4 className={styles.statNumber}>{stats.hours}</h4><p className={styles.statLabel}>Hours Rendered</p></div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconWrapper}><CalendarDays size={19} /></div>
              <div><h4 className={styles.statNumber}>{stats.days}</h4><p className={styles.statLabel}>Days Present</p></div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconWrapper}><Clock size={19} /></div>
              <div><h4 className={styles.statNumber}>{stats.avgIn}</h4><p className={styles.statLabel}>Avg. Time In</p></div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconWrapper}><Activity size={19} /></div>
              <div><h4 className={styles.statNumber}>{stats.rate}</h4><p className={styles.statLabel}>Completion Rate</p></div>
            </div>
          </div>

          {/* ATTENDANCE HISTORY */}
          <div className={styles.historySection}>
            <div className={styles.historyHeader}>
              <h3 className={styles.historyTitle}>Attendance History</h3>
              <div className={styles.historyControls}>
                <div className={styles.viewToggles}>
                  <button
                    className={`${styles.toggleBtn} ${activeView === 'grid' ? styles.activeToggle : ''}`}
                    onClick={() => setActiveView('grid')}
                  >
                    <Grid size={13} />
                  </button>
                  <button
                    className={`${styles.toggleBtn} ${activeView === 'list' ? styles.activeToggle : ''}`}
                    onClick={() => setActiveView('list')}
                  >
                    <List size={13} />
                  </button>
                </div>
                <button className={styles.sortBtn}><ArrowUpDown size={13} /> Sort</button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Fetching attendance records...
              </div>
            ) : logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No attendance records found for this intern.
              </div>
            ) : (
              <div className={activeView === 'grid' ? styles.cardsGrid : styles.cardsGridList}>
                {logs.map((log) => (
                  <div key={log.id} className={styles.attendanceCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardDate}><Calendar size={11} /> {log.date}</div>
                      <span className={styles.statusPill}>
                        <CheckCircle size={9} /> {log.status || 'Present'}
                      </span>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.timeRow}>
                        <div className={styles.timeCol}>
                          <span className={styles.timeLabel}>Time-In</span>
                          <span className={styles.timeValue}>{formatTime(log.am_in)}</span>
                        </div>
                        <div className={styles.timeColRight}>
                          <span className={styles.timeLabel}>Time-Out</span>
                          <span className={styles.timeValue}>{formatTime(log.am_out)}</span>
                        </div>
                      </div>
                      <div className={styles.divider} />
                      <div className={styles.timeRow}>
                        <div className={styles.timeCol}>
                          <span className={styles.timeLabel}>Time-In</span>
                          <span className={styles.timeValue}>{formatTime(log.pm_in)}</span>
                        </div>
                        <div className={styles.timeColRight}>
                          <span className={styles.timeLabel}>Time-Out</span>
                          <span className={styles.timeValue}>{formatTime(log.pm_out)}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.totalLabel}>Total Hours</span>
                      <span className={styles.totalValue}>{log.total_hours || 0} Hours</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showIdModal && (
        <GenerateIdModal intern={intern} onClose={() => setShowIdModal(false)} />
      )}
    </div>
  );
}