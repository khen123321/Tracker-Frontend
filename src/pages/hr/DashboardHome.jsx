import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, UserCheck, UserX, UserMinus, Clock, 
  PieChart as PieIcon, BarChart2 as BarIcon, 
  School, Loader2, Check, X, Paperclip 
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, 
  ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import api from '../../api/axios';
import styles from './DashboardHome.module.css';
import NotificationBell from '../../components/NotificationBell';
import toast, { Toaster } from 'react-hot-toast';

// Colors for the bottom Bar Charts
const COLORS = ['#0B1EAE', '#4F63F1', '#8A98E8', '#C2CBF5', '#64748B', '#94A3B8'];

// ─── SKELETON PRIMITIVES ───
function Sk({ w = '100%', h = 16, r = 6, mb = 0 }) {
  return <div className={styles.skel} style={{ width: w, height: h, borderRadius: r, marginBottom: mb, flexShrink: 0 }} />;
}

// ─── SKELETON SCREEN ───
function DashboardSkeleton() {
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.header}>
        <Sk w={140} h={26} r={6} />
        <div style={{ display: 'flex', gap: 5 }}>
          <Sk w={36} h={36} r={8} />
          <Sk w={210} h={36} r={8} />
        </div>
      </div>

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
        <div className={styles.card}><Sk w={110} h={14} r={4} mb={14} /><Sk w={80} h={38} r={6} /></div>
        <div className={styles.card}><Sk w={90} h={14} r={4} mb={14} /><Sk w={80} h={38} r={6} /></div>
      </div>

      <div className={styles.middleGrid}>
        <div className={styles.card} style={{ minHeight: 300 }}>
          <Sk w={130} h={15} r={4} mb={12} />
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '16px 0' }}><div className={styles.skelDonut} /></div>
        </div>
        <div className={styles.attGrid}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={styles.attCard}><Sk w={80} h={13} r={4} mb={14} /><Sk w={55} h={30} r={6} /></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CSS angle → SVG linearGradient coords ───
// Formula: x1=0.5-sin(a)/2, y1=0.5+cos(a)/2, x2=0.5+sin(a)/2, y2=0.5-cos(a)/2
function angleToSVGCoords(deg) {
  const rad = (deg * Math.PI) / 180;
  return {
    x1: (0.5 - Math.sin(rad) / 2).toFixed(4),
    y1: (0.5 + Math.cos(rad) / 2).toFixed(4),
    x2: (0.5 + Math.sin(rad) / 2).toFixed(4),
    y2: (0.5 - Math.cos(rad) / 2).toFixed(4),
  };
}

// ─── MAIN COMPONENT ───
export default function DashboardHome() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('pie');
  const [isHovered, setIsHovered] = useState(false);

  const [activeTab, setActiveTab] = useState('absent');

  const initialCourseData = [
    { name: 'Computer Science', value: 20 },
    { name: 'Information Technology', value: 15 },
    { name: 'Computer Engineering', value: 10 },
    { name: 'Mechanical Engineering', value: 5 },
  ];

  const [stats, setStats] = useState({
    total_interns: 50, 
    attendance_rate: 0,
    total_hours: 0,
    on_time_percentage: 0,
    today: { present: 0, absent: 0, excused: 0, late: 0 },
    course_distribution: initialCourseData,
    departments: [],
    branches: [],
    pending_requests: { absent: [], halfDay: [], overtime: [] }
  });

  const [schoolData, setSchoolData] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);

  const [activePopup, setActivePopup] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/hr/dashboard-stats');
        if (res.data) setStats(prev => ({ 
          ...prev, 
          ...res.data,
          pending_requests: res.data.pending_requests || prev.pending_requests 
        }));
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSchoolData = async () => {
      try {
        const res = await api.get('/hr/dashboard/schools');
        setSchoolData(res.data);
      } catch (err) {
        console.error("Failed to fetch school stats:", err);
      } finally {
        setLoadingSchools(false);
      }
    };

    fetchStats();
    fetchSchoolData();
  }, []);

  const handleRequestAction = async (id, action, type) => {
    try {
      await api.post(`/hr/requests/${id}/process`, { action });
      toast.success(`Request ${action}ed successfully!`);
      
      setStats(prev => ({
        ...prev,
        pending_requests: {
          ...prev.pending_requests,
          [type]: prev.pending_requests[type].filter(req => req.id !== id)
        }
      }));
    } catch {
      toast.error(`Failed to process request.`);
    }
  };

  const handlePopupAction = async (id, action) => {
    try {
      await api.post(`/hr/requests/${id}/process`, { action });
      toast.success(`Request ${action}ed successfully!`);
      setActivePopup(null); 
      
      setStats(prev => {
        const updatedPending = { ...prev.pending_requests };
        Object.keys(updatedPending).forEach(key => {
          updatedPending[key] = updatedPending[key].filter(req => req.id !== id);
        });
        return { ...prev, pending_requests: updatedPending };
      });

      const res = await api.get('/hr/dashboard-stats');
      if (res.data && res.data.pending_requests) {
        setStats(prev => ({ ...prev, pending_requests: res.data.pending_requests }));
      }
    } catch {
      toast.error(`Failed to process request.`);
    }
  };

  const openRequestPopup = async (requestId) => {
    setActivePopup({ id: requestId, loading: true }); 

    try {
      const res = await api.get(`/hr/requests/${requestId}`); 
      setActivePopup(res.data);
    } catch (err) {
      console.error("Failed to load request details", err);
      toast.error("Could not load request details from the server.");
      setActivePopup(null); 
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const deptAttendanceData = stats.departments?.length > 0 
    ? stats.departments.map(d => ({
        name: d.name.length > 10 ? d.name.substring(0, 10) + '...' : d.name, 
        present: d.present_count || Math.floor(d.count * 0.8), 
        absent: d.absent_count || Math.floor(d.count * 0.2),
      }))
    : [];

  const activeRequestsList = stats.pending_requests[activeTab] || [];

  // Pre-compute SVG gradient coordinates from exact CSS angles
  const g1 = angleToSVGCoords(120); // Silver:   143deg
  const g2 = angleToSVGCoords(265); // Lavender: 224deg
  const g3 = angleToSVGCoords(230); // Blue:     271deg
  const g4 = angleToSVGCoords(143); // 4th slice reuses silver angle, lighter stops

  if (loading) return <DashboardSkeleton />;

  return (
    <div className={styles.pageWrapper}>
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <div className={styles.headerActions}>
          <NotificationBell role="hr" onNotificationClick={openRequestPopup} />
          <div 
            className={styles.dateBadge}
            onClick={() => navigate('/dashboard/events')}
            style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            title="Go to Events Calendar"
          >
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

      {/* MIDDLE GRID (Chart + 4 Small Cards) */}
      <div className={styles.middleGrid}>
        <div className={`${styles.card} ${styles.chartCard}`}>
          <div className={styles.sectionHeader} style={{ alignItems: 'center' }}>
            <h3 className={styles.sectionTitle}>
              {chartView === 'pie' ? 'Interns by Course' : 'Attendance by Dept'}
            </h3>
            <button 
              onClick={() => setChartView(prev => prev === 'pie' ? 'bar' : 'pie')}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              title={chartView === 'pie' ? "Switch to Bar Chart" : "Switch to Pie Chart"}
              style={{
                padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0',
                backgroundColor: isHovered ? '#f8fafc' : '#ffffff',
                color: isHovered ? '#0B1EAE' : '#64748B',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              {chartView === 'pie' ? <BarIcon size={18} strokeWidth={2} /> : <PieIcon size={18} strokeWidth={2} />}
            </button>
          </div>

          <div className={styles.chartWrapper} style={{ marginTop: '10px' }}>
            {chartView === 'pie' && (
              <>
                <ResponsiveContainer width="100%" height={440}>
                  <PieChart>
                    <defs>
                      {/* ✨ SHINY SILVER */}
                      <linearGradient id="gradSilverShiny" x1={g1.x1} y1={g1.y1} x2={g1.x2} y2={g1.y2} gradientUnits="objectBoundingBox">
                        <stop offset="18.03%" stopColor="#8C8C8C" />
                        <stop offset="51.68%" stopColor="#FFFFFF" />
                        <stop offset="95.34%" stopColor="#8C8C8C" />
                      </linearGradient>

                      {/* ✨ SHINY LAVENDER */}
                      <linearGradient id="gradLavenderShiny" x1={g2.x1} y1={g2.y1} x2={g2.x2} y2={g2.y2} gradientUnits="objectBoundingBox">
                        <stop offset="18.93%" stopColor="#5B65B2" />
                        <stop offset="56.72%" stopColor="#FFFFFF" />
                        <stop offset="90.52%" stopColor="#5B65B2" />
                      </linearGradient>

                      {/* ✨ SHINY BLUE */}
                      <linearGradient id="gradBlueShiny" x1={g3.x1} y1={g3.y1} x2={g3.x2} y2={g3.y2} gradientUnits="objectBoundingBox">
                        <stop offset="16.53%" stopColor="#0B1EAE" />
                        <stop offset="56.42%" stopColor="#FFFFFF" />
                        <stop offset="90.60%" stopColor="#0B1EAE" />
                      </linearGradient>

                      {/* ✨ SHINY LIGHT SILVER (4th segment) */}
                      <linearGradient id="gradSilverLightShiny" x1={g4.x1} y1={g4.y1} x2={g4.x2} y2={g4.y2} gradientUnits="objectBoundingBox">
                        <stop offset="38.03%" stopColor="#B0B0B0" />
                        <stop offset="51.68%" stopColor="#FFFFFF" />
                        <stop offset="65.34%" stopColor="#B0B0B0" />
                      </linearGradient>
                    </defs>

                    <Pie
                      data={stats.course_distribution}
                      innerRadius={90}
                      outerRadius={170}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      {stats.course_distribution.map((entry, index) => {
                        const gradients = [
                          'url(#gradBlueShiny)',
                          'url(#gradLavenderShiny)',
                          'url(#gradSilverShiny)',
                          'url(#gradSilverLightShiny)',
                        ];
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={gradients[index % gradients.length]}
                          />
                        );
                      })}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={24}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className={styles.donutCenter}>
                  <span className={styles.donutTotal} style={{ color: '#0f172a' }}>
                    {stats.total_interns}
                  </span>
                  <span className={styles.donutLabel} style={{ color: '#94a3b8' }}>Total</span>
                </div>
              </>
            )}

            {chartView === 'bar' && (
              <ResponsiveContainer width="100%" height={440}> 
                <BarChart data={deptAttendanceData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} iconType="circle" />
                  <Bar dataKey="present" name="Present" fill="#0B1EAE" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="absent"  name="Absent"  fill="#94A3B8" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Attendance Cards */}
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

      {/* BOTTOM GRID */}
      <div className={styles.bottomGrid}>
        
        {/* 1. By Department List */}
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
                  <div className={styles.deptFill} style={{ width: `${(dept.count / dept.total) * 100}%`, backgroundColor: dept.color || COLORS[i % COLORS.length] }} />
                </div>
              </div>
            ))}
            {(!stats.departments || stats.departments.length === 0) && (
              <div className={styles.emptyState}>No department data available</div>
            )}
          </div>
        </div>

        {/* 2. Branch List */}
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

        {/* 3. STANDING BAR CHART FOR SCHOOLS */}
        <div className={styles.card}>
          <div className={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <School size={16} color="#0B1EAE" />
              <h3 className={styles.sectionTitle}>Interns by School</h3>
            </div>
          </div>
          
          {loadingSchools ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', color: '#64748b' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
              <span style={{ fontSize: '13px' }}>Syncing data...</span>
            </div>
          ) : schoolData.length === 0 ? (
            <div className={styles.emptyStateBox} style={{ marginTop: '20px' }}>No school data available</div>
          ) : (
            <div style={{ height: '220px', marginTop: '10px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={schoolData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569', fontWeight: 500 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} itemStyle={{ color: '#0f172a', fontWeight: 'bold' }} />
                  <Bar dataKey="value" name="Interns" radius={[4, 4, 0, 0]} barSize={20}>
                    {schoolData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 4. PENDING REQUESTS WIDGET */}
        <div className={styles.card}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Pending Requests</h3>
            <span className={styles.viewAllLink} onClick={() => navigate('/dashboard/requests')} style={{ cursor: 'pointer' }}>View all</span>
          </div>
          
          <div className={styles.pendingTabs}>
            <div 
              className={`${styles.tab} ${activeTab === 'absent' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('absent')}
            >
              Absent <span className={styles.tabBadge}>{stats.pending_requests.absent.length}</span>
            </div>
            <div 
              className={`${styles.tab} ${activeTab === 'halfDay' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('halfDay')}
            >
              Half-Day <span className={styles.tabBadge}>{stats.pending_requests.halfDay.length}</span>
            </div>
            <div 
              className={`${styles.tab} ${activeTab === 'overtime' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('overtime')}
            >
              Overtime <span className={styles.tabBadge}>{stats.pending_requests.overtime.length}</span>
            </div>
          </div>

          <div className={styles.requestsContainer} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto' }}>
            {activeRequestsList.length === 0 ? (
              <div className={styles.emptyStateBox} style={{ marginTop: '0' }}>
                No pending requests right now.
              </div>
            ) : (
              activeRequestsList.map((req) => (
                <div 
                  key={req.id} 
                  onClick={() => openRequestPopup(req.id)}
                  style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', 
                    padding: '12px', background: '#f8fafc', borderRadius: '8px', 
                    border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s ease' 
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
                >
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{req.intern_name}</h4>
                    <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b' }}>
                      <Calendar size={10} style={{ display: 'inline', marginRight: '4px' }} /> 
                      {req.date} {req.hours ? `• ${req.hours} hrs` : ''}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#475569', fontStyle: 'italic' }}>"{req.reason}"</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginLeft: '12px', zIndex: 10 }}>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRequestAction(req.id, 'approve', activeTab); }}
                      style={{ background: '#ecfdf5', color: '#10b981', border: '1px solid #d1fae5', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                      title="Approve Request"
                    ><Check size={14} strokeWidth={2.5} /></button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRequestAction(req.id, 'reject', activeTab); }}
                      style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                      title="Reject Request"
                    ><X size={14} strokeWidth={2.5} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div> {/* END OF BOTTOM GRID */}

      {/* BOTTOM RIGHT FACEBOOK-STYLE POPUP */}
      {activePopup && (
        <div className={styles.quickViewPopup}>
          <div className={styles.popupHeader}>
            <span>Request Details</span>
            <button className={styles.popupCloseBtn} onClick={() => setActivePopup(null)}><X size={16} /></button>
          </div>
          <div className={styles.popupBody}>
            {activePopup.loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0', color: '#64748b' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '10px' }} />
                <span>Loading request...</span>
              </div>
            ) : (
              <>
                <div className={styles.popupRow}>
                  <span className={styles.popupLabel}>Intern Name</span>
                  <span className={styles.popupValue} style={{ fontSize: '16px', fontWeight: '700', color: '#0B1EAE' }}>{activePopup.intern_name || 'Unknown Intern'}</span>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div className={styles.popupRow} style={{ flex: 1 }}>
                    <span className={styles.popupLabel}>Type</span>
                    <span className={styles.popupValue}>{activePopup.type}</span>
                  </div>
                  <div className={styles.popupRow} style={{ flex: 1 }}>
                    <span className={styles.popupLabel}>Date Requested</span>
                    <span className={styles.popupValue}>{activePopup.date_of_absence}</span>
                  </div>
                </div>
                <div className={styles.popupRow}>
                  <span className={styles.popupLabel}>Reason</span>
                  <span className={styles.popupValue}>{activePopup.reason}</span>
                </div>
                {activePopup.additional_details && (
                  <div className={styles.popupRow}>
                    <span className={styles.popupLabel}>Additional Details</span>
                    <span className={styles.popupValue} style={{ fontSize: '13px', lineHeight: '1.5' }}>{activePopup.additional_details}</span>
                  </div>
                )}
                {activePopup.attachment_path && (
                  <div className={styles.popupRow} style={{ marginTop: '10px' }}>
                    <span className={styles.popupLabel}>Attached File</span>
                    <div className={styles.attachmentBox}>
                      <Paperclip size={18} color="#64748b" />
                      <a href={`http://localhost:8000/storage/${activePopup.attachment_path}`} target="_blank" rel="noopener noreferrer" className={styles.attachmentLink}>View Attached Document</a>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          {!activePopup.loading && activePopup.status === 'Pending' && (
            <div className={styles.popupFooter}>
              <button className={styles.btnReject} onClick={() => handlePopupAction(activePopup.id, 'reject')}>Reject</button>
              <button className={styles.btnApprove} onClick={() => handlePopupAction(activePopup.id, 'approve')}>Approve</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}