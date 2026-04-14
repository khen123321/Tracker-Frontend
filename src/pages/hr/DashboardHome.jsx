import React, { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, UserCheck, UserX, UserMinus, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../../api/axios';
import styles from './DashboardHome.module.css';

const COLORS = ['#0B1EAE', '#4F63F1', '#8A98E8', '#C2CBF5', '#64748B', '#94A3B8'];

// ─── SKELETON PRIMITIVES ───
function Sk({ w = '100%', h = 16, r = 6, mb = 0 }) {
  return (
    <div
      className={styles.skel}
      style={{ width: w, height: h, borderRadius: r, marginBottom: mb, flexShrink: 0 }}
    />
  );
}

// ─── SKELETON SCREEN ───
function DashboardSkeleton() {
  return (
    <div className={styles.pageWrapper}>

      {/* Header */}
      <div className={styles.header}>
        <Sk w={140} h={26} r={6} />
        <div style={{ display: 'flex', gap: 5 }}>
          <Sk w={36} h={36} r={8} />
          <Sk w={210} h={36} r={8} />
        </div>
      </div>

      {/* Top Grid */}
      <div className={styles.topGrid}>
        <div className={styles.card}>
          <Sk w={130} h={14} r={4} mb={14} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 5 }}>
            <Sk w={80} h={38} r={6} />
            <div style={{ flex: 1, maxWidth: '55%' }}>
              <Sk w={130} h={11} r={4} mb={8} />
              <Sk w="100%" h={6} r={999} mb={6} />
              <Sk w={36} h={11} r={4} />
            </div>
          </div>
        </div>
        <div className={styles.card}>
          <Sk w={110} h={14} r={4} mb={14} />
          <Sk w={80} h={38} r={6} />
        </div>
        <div className={styles.card}>
          <Sk w={90} h={14} r={4} mb={14} />
          <Sk w={80} h={38} r={6} />
        </div>
      </div>

      {/* Middle Grid */}
      <div className={styles.middleGrid}>

        {/* Chart card */}
        <div className={styles.card} style={{ minHeight: 300 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
            <Sk w={130} h={15} r={4} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '16px 0' }}>
            <div className={styles.skelDonut} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 8 }}>
            {[55, 45, 65, 50].map((w, i) => <Sk key={i} w={w} h={11} r={4} />)}
          </div>
        </div>

        {/* Attendance 2x2 */}
        <div className={styles.attGrid}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={styles.attCard}>
              <Sk w={80} h={13} r={4} mb={14} />
              <Sk w={55} h={30} r={6} />
            </div>
          ))}
        </div>

        {/* Departments */}
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
            <Sk w={110} h={15} r={4} />
            <Sk w={50} h={13} r={4} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Sk w={100} h={13} r={4} />
                  <Sk w={65} h={13} r={4} />
                </div>
                <Sk w="100%" h={6} r={4} />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Grid */}
      <div className={styles.bottomGrid}>

        {/* Branches */}
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
            <Sk w={80} h={15} r={4} />
            <Sk w={50} h={13} r={4} />
          </div>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px dashed #f1f5f9' }}>
              <div>
                <Sk w={110} h={13} r={4} mb={6} />
                <Sk w={80} h={11} r={4} />
              </div>
              <Sk w={32} h={22} r={4} />
            </div>
          ))}
        </div>

        {/* Schools */}
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
            <Sk w={130} h={15} r={4} />
            <Sk w={40} h={13} r={4} />
          </div>
          <div className={styles.schoolCardsGrid}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ border: '1px solid #e8ecf2', borderLeft: '4px solid #e8ecf2', borderRadius: 8, padding: 12 }}>
                <Sk w="75%" h={12} r={4} mb={10} />
                <Sk w={50} h={26} r={4} mb={6} />
                <Sk w="55%" h={11} r={4} />
              </div>
            ))}
          </div>
        </div>

        {/* Pending */}
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
            <Sk w={130} h={15} r={4} />
            <Sk w={50} h={13} r={4} />
          </div>
          <div style={{ display: 'flex', gap: 5, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
            <Sk w={85} h={30} r={6} />
            <Sk w={85} h={30} r={6} />
            <Sk w={85} h={30} r={6} />
          </div>
          <Sk w="100%" h={70} r={8} />
        </div>

      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───
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
    course_distribution: [],
    departments: [],
    branches: [],
    schools: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/hr/dashboard-stats');
        if (res.data) setStats(prev => ({ ...prev, ...res.data }));
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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

  if (loading) return <DashboardSkeleton />;

  return (
    <div className={styles.pageWrapper}>

      {/* HEADER */}
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

      {/* TOP METRIC CARDS */}
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

      {/* MIDDLE GRID */}
      <div className={styles.middleGrid}>
        <div className={`${styles.card} ${styles.chartCard}`}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Interns by Course</h3>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats.course_distribution}
                  innerRadius={55}
                  outerRadius={75}
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
            <div className={styles.donutCenter}>
              <span className={styles.donutTotal}>{stats.total_interns}</span>
              <span className={styles.donutLabel}>Total</span>
            </div>
          </div>
        </div>

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

        <div className={styles.card}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>By Department</h3>
            <span className={styles.viewAllLink}>View all</span>
          </div>
          <div className={styles.listContainer}>
            {(stats.departments || []).map((dept, i) => (
              <div key={i} className={styles.deptItem}>
                <div className={styles.deptHeader}>
                  <span>{dept.name}</span>
                  <span className={styles.deptCount}>{dept.count} interns</span>
                </div>
                <div className={styles.deptTrack}>
                  <div className={styles.deptFill} style={{ width: `${(dept.count / dept.total) * 100}%`, backgroundColor: dept.color }} />
                </div>
              </div>
            ))}
            {(!stats.departments || stats.departments.length === 0) && (
              <div className={styles.emptyState}>No department data available</div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div className={styles.bottomGrid}>
        <div className={styles.card}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>By Branch</h3>
            <span className={styles.viewAllLink}>View all</span>
          </div>
          <div className={styles.listContainer}>
            {(stats.branches || []).map((branch, i) => (
              <div key={i} className={styles.branchItem}>
                <div className={styles.branchInfo}>
                  <div className={styles.branchName}>
                    {branch.name} {branch.isHQ && <span className={styles.hqBadge}>HQ</span>}
                  </div>
                  <span className={styles.branchSub}>{branch.sub}</span>
                </div>
                <div className={styles.branchValue}>{branch.count}</div>
              </div>
            ))}
            {(!stats.branches || stats.branches.length === 0) && (
              <div className={styles.emptyState}>No branch data available</div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Interns by School</h3>
            <span className={styles.viewAllLink}>Export</span>
          </div>
          <div className={styles.schoolCardsGrid}>
            {(stats.schools || []).map((school, i) => (
              <div key={i} className={styles.schoolCard} style={{ borderLeftColor: school.color }}>
                <div className={styles.schoolCardName}>{school.name}</div>
                <div className={styles.schoolCardValue} style={{ color: school.color }}>{school.count}</div>
                <div className={styles.schoolCardSub}>{school.sub}</div>
              </div>
            ))}
            {(!stats.schools || stats.schools.length === 0) && (
              <div className={styles.emptyState}>No school data available</div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Pending Requests</h3>
            <span className={styles.viewAllLink}>View all</span>
          </div>
          <div className={styles.pendingTabs}>
            <div className={`${styles.tab} ${styles.tabActive}`}>Absent <span className={styles.tabBadge}>0</span></div>
            <div className={styles.tab}>Half-Day <span className={styles.tabBadge}>0</span></div>
            <div className={styles.tab}>Overtime <span className={styles.tabBadge}>0</span></div>
          </div>
          <div className={styles.emptyStateBox}>
            No pending requests right now.
          </div>
        </div>
      </div>

    </div>
  );
}