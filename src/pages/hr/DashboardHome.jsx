import React, { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, UserCheck, UserX, UserMinus, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../../api/axios';
import styles from './DashboardHome.module.css';

// Professional CLIMBS color palette for the chart
const COLORS = ['#0B1EAE', '#4F63F1', '#8A98E8', '#C2CBF5', '#64748B', '#94A3B8'];

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const [stats, setStats] = useState({
    total_interns: 0,
    attendance_rate: 0,
    total_hours: 0,
    on_time_percentage: 0,
    today: { present: 0, absent: 0, excused: 0, late: 0 },
    course_distribution: [], // Will hold dynamic course data
  });

  // ─── Fetch Stats ───
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/hr/dashboard-stats');
        if (res.data) setStats(res.data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // ─── Fetch Notifications ───
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    fetchNotifs();
  }, []);

  // ─── Close dropdown on outside click ───
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>Loading Dashboard Data...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* ─── PAGE HEADER ─── */}
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Dashboard</h1>

        <div className={styles.headerActions}>
          <div className={styles.notifContainer} ref={dropdownRef}>
            <button
              className={styles.iconButton}
              onClick={() => setShowNotifications(prev => !prev)}
            >
              <Bell size={18} strokeWidth={1.5} />
              {notifications.length > 0 && <span className={styles.notifDot} />}
            </button>

            {showNotifications && (
              <div className={styles.notifDropdown}>
                <div className={styles.notifDropdownHeader}>
                  <span>Notifications</span>
                  {notifications.length > 0 && (
                    <span className={styles.notifCount}>{notifications.length}</span>
                  )}
                </div>
                <div className={styles.notifList}>
                  {notifications.length === 0 ? (
                    <p className={styles.notifEmpty}>No pending requests</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={styles.notifItem}>
                        <p>
                          <strong>{n.data?.intern_name || 'Intern'}</strong> {n.data?.message}
                        </p>
                        <span className={styles.notifTime}>{n.data?.date_submitted}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={styles.dateBadge}>
            <Calendar size={15} strokeWidth={1.5} />
            <span>{todayStr}</span>
          </div>
        </div>
      </div>

      {/* ─── METRIC CARDS ─── */}
      <div className={styles.topGrid}>
        <div className={`${styles.card} ${styles.cardWide}`}>
          <p className={styles.cardTitle}>Total Interns</p>
          <div className={styles.cardRow}>
            <h2 className={styles.cardValue}>{stats.total_interns}</h2>
            <div className={styles.progressBlock}>
              <span className={styles.progressLabel}>Attendance Rate Today</span>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${stats.attendance_rate}%` }} />
              </div>
              <span className={styles.progressPercent}>{stats.attendance_rate}%</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <p className={styles.cardTitle}>Total Hours</p>
          <h2 className={styles.cardValue}>{stats.total_hours.toLocaleString()}</h2>
        </div>

        <div className={styles.card}>
          <p className={styles.cardTitle}>On Time</p>
          <h2 className={styles.cardValue}>{stats.on_time_percentage}%</h2>
        </div>
      </div>

      {/* ─── MIDDLE GRID: PIE CHART & ATTENDANCE ─── */}
      <div className={styles.middleGrid}>
        
        {/* RECHARTS PIE CHART */}
        <div className={`${styles.card} ${styles.chartCard}`}>
          <p className={styles.cardTitle}>Interns by Course</p>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.course_distribution}
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.course_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label for the Donut */}
            <div className={styles.donutCenter}>
              <span className={styles.donutTotal}>{stats.total_interns}</span>
              <span className={styles.donutLabel}>Total</span>
            </div>
          </div>
        </div>

        {/* 2x2 ATTENDANCE GRID */}
        <div className={styles.attGrid}>
          <div className={styles.attCard}>
            <div className={`${styles.attLabel} ${styles.present}`}><UserCheck size={16} /> Present</div>
            <span className={`${styles.attValue} ${styles.present}`}>{stats.today.present}</span>
          </div>
          <div className={styles.attCard}>
            <div className={`${styles.attLabel} ${styles.absent}`}><UserX size={16} /> Absent</div>
            <span className={`${styles.attValue} ${styles.absent}`}>{stats.today.absent}</span>
          </div>
          <div className={styles.attCard}>
            <div className={`${styles.attLabel} ${styles.late}`}><Clock size={16} /> Late</div>
            <span className={`${styles.attValue} ${styles.late}`}>{stats.today.late}</span>
          </div>
          <div className={styles.attCard}>
            <div className={`${styles.attLabel} ${styles.excused}`}><UserMinus size={16} /> Excused</div>
            <span className={`${styles.attValue} ${styles.excused}`}>{stats.today.excused}</span>
          </div>
        </div>
        
      </div>
    </div>
  );
}