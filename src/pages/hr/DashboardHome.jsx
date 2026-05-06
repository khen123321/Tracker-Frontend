import React, { useState, useEffect, useCallback } from 'react';

import { 
  Calendar,
  UserCheck, UserX, UserMinus, Clock, 
  PieChart as PieIcon, BarChart2 as BarIcon, 
  School, Loader2, Check, X, Paperclip,
  Building2, GitBranch, ClipboardList,
  TrendingUp, Users, MapPin, RefreshCw,
  ChevronRight, Search
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, 
  ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import api from '../../api/axios';
import styles from './DashboardHome.module.css';
import toast, { Toaster } from 'react-hot-toast';
import PageHeader from '../../components/PageHeader'; 

const COLORS = ['#0B1EAE', '#4F63F1', '#8A98E8', '#C2CBF5', '#64748B', '#94A3B8'];

const getSchoolAbbreviation = (schoolName) => {
  if (!schoolName) return '';
  const overrides = {
    "University of Science and Technology of Southern Philippines": "USTP",
    "Xavier University": "XU",
    "Xavier University - Ateneo de Cagayan": "XU",
    "Capitol University": "CU",
    "Liceo de Cagayan University": "LDCU",
    "Mindanao State University": "MSU"
  };
  if (overrides[schoolName]) return overrides[schoolName];
  const stopWords = ['of', 'and', 'the', 'in', 'at', 'de'];
  const words = schoolName.split(/[\s-]+/);
  let acronym = '';
  words.forEach(word => {
    if (!stopWords.includes(word.toLowerCase()) && word.length > 0) acronym += word[0].toUpperCase();
  });
  return acronym.length >= 2 ? acronym : schoolName;
};

// ─── SKELETON PRIMITIVES ───
function Sk({ w = '100%', h = 16, r = 6, mb = 0 }) {
  return <div className={styles.skel} style={{ width: w, height: h, borderRadius: r, marginBottom: mb, flexShrink: 0 }} />;
}

function DashboardSkeleton() {
  return (
    <div className={styles.pageWrapper}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', background: '#fff', borderRadius: '10px', border: '1px solid #e8eaf0', marginBottom: '5px' }}>
        <Sk w={140} h={26} r={6} />
        <div style={{ display: 'flex', gap: '12px' }}>
          <Sk w={36} h={36} r={8} />
          <Sk w={210} h={36} r={999} />
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

function angleToSVGCoords(deg) {
  const rad = (deg * Math.PI) / 180;
  return {
    x1: (0.5 - Math.sin(rad) / 2).toFixed(4),
    y1: (0.5 + Math.cos(rad) / 2).toFixed(4),
    x2: (0.5 + Math.sin(rad) / 2).toFixed(4),
    y2: (0.5 - Math.cos(rad) / 2).toFixed(4),
  };
}

// ─── MODAL BASE COMPONENT ───
function Modal({ isOpen, onClose, title, icon: Icon, children, width = '680px' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={styles.modalContainer} 
        style={{ maxWidth: width }}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            {Icon && <div className={styles.modalIconWrap}><Icon size={18} strokeWidth={2} /></div>}
            <h2 className={styles.modalTitle}>{title}</h2>
          </div>
          <button className={styles.modalClose} onClick={onClose}><X size={18} /></button>
        </div>
        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── DEPARTMENT MODAL ───
function DepartmentModal({ isOpen, onClose, stats }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('count');
  const [loading, setLoading] = useState(false);
  const [deptDetails, setDeptDetails] = useState(null);

  useEffect(() => {
    if (!isOpen) { setSearch(''); setDeptDetails(null); return; }
    // Use stats.departments as primary data; optionally fetch richer details
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get('/hr/dashboard-stats');
        if (res.data?.departments) setDeptDetails(res.data.departments);
      } catch {
        // fall back to props data
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [isOpen]);

  const departments = deptDetails || stats.departments || [];
  const maxCount = Math.max(...departments.map(d => d.count || 0), 1);
  const totalInterns = departments.reduce((sum, d) => sum + (d.count || 0), 0);

  const filtered = departments
    .filter(d => d.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'count' ? (b.count || 0) - (a.count || 0) : a.name?.localeCompare(b.name));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="All Departments" icon={Building2} width="720px">
      {/* Stats Summary */}
      <div className={styles.modalStats}>
        <div className={styles.modalStatItem}>
          <span className={styles.modalStatValue}>{departments.length}</span>
          <span className={styles.modalStatLabel}>Departments</span>
        </div>
        <div className={styles.modalStatDivider} />
        <div className={styles.modalStatItem}>
          <span className={styles.modalStatValue}>{totalInterns}</span>
          <span className={styles.modalStatLabel}>Total Interns</span>
        </div>
        <div className={styles.modalStatDivider} />
        <div className={styles.modalStatItem}>
          <span className={styles.modalStatValue}>
            {departments.length > 0 ? Math.round(totalInterns / departments.length) : 0}
          </span>
          <span className={styles.modalStatLabel}>Avg per Dept</span>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.modalControls}>
        <div className={styles.modalSearch}>
          <Search size={14} className={styles.modalSearchIcon} />
          <input 
            className={styles.modalSearchInput}
            placeholder="Search departments…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.modalSortGroup}>
          <button 
            className={`${styles.modalSortBtn} ${sortBy === 'count' ? styles.modalSortActive : ''}`}
            onClick={() => setSortBy('count')}
          >By Count</button>
          <button 
            className={`${styles.modalSortBtn} ${sortBy === 'name' ? styles.modalSortActive : ''}`}
            onClick={() => setSortBy('name')}
          >A–Z</button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className={styles.modalLoading}>
          <Loader2 size={24} className={styles.spinIcon} />
          <span>Syncing department data…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.modalEmpty}>No departments found{search ? ` for "${search}"` : ''}.</div>
      ) : (
        <div className={styles.deptModalList}>
          {filtered.map((dept, i) => {
            const pct = Math.round(((dept.count || 0) / maxCount) * 100);
            const totalPct = totalInterns > 0 ? ((dept.count || 0) / totalInterns * 100).toFixed(1) : '0';
            return (
              <div key={i} className={styles.deptModalItem}>
                <div className={styles.deptModalLeft}>
                  <div className={styles.deptModalRank}>{i + 1}</div>
                  <div className={styles.deptModalInfo}>
                    <span className={styles.deptModalName}>{dept.name}</span>
                    <span className={styles.deptModalShare}>{totalPct}% of total interns</span>
                  </div>
                </div>
                <div className={styles.deptModalRight}>
                  <div className={styles.deptModalBar}>
                    <div 
                      className={styles.deptModalFill} 
                      style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} 
                    />
                  </div>
                  <span className={styles.deptModalCount}>{dept.count}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// ─── BRANCH MODAL ───
function BranchModal({ isOpen, onClose, stats }) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [branchDetails, setBranchDetails] = useState(null);

  useEffect(() => {
    if (!isOpen) { setSearch(''); setBranchDetails(null); return; }
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get('/hr/dashboard-stats');
        if (res.data?.branches) setBranchDetails(res.data.branches);
      } catch {
        // fall back to props data
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [isOpen]);

  const branches = branchDetails || stats.branches || [];
  const totalInterns = branches.reduce((sum, b) => sum + (b.count || 0), 0);
  const hqBranch = branches.find(b => b.isHQ);

  const filtered = branches.filter(b => 
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.sub?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="All Branches" icon={GitBranch} width="680px">
      {/* Stats Summary */}
      <div className={styles.modalStats}>
        <div className={styles.modalStatItem}>
          <span className={styles.modalStatValue}>{branches.length}</span>
          <span className={styles.modalStatLabel}>Branches</span>
        </div>
        <div className={styles.modalStatDivider} />
        <div className={styles.modalStatItem}>
          <span className={styles.modalStatValue}>{totalInterns}</span>
          <span className={styles.modalStatLabel}>Total Interns</span>
        </div>
        <div className={styles.modalStatDivider} />
        <div className={styles.modalStatItem}>
          <span className={styles.modalStatValue}>{hqBranch?.name?.split(' ')[0] || '—'}</span>
          <span className={styles.modalStatLabel}>Headquarters</span>
        </div>
      </div>

      {/* Search */}
      <div className={styles.modalControls}>
        <div className={styles.modalSearch} style={{ flex: 1 }}>
          <Search size={14} className={styles.modalSearchIcon} />
          <input 
            className={styles.modalSearchInput}
            placeholder="Search branches…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.modalLoading}>
          <Loader2 size={24} className={styles.spinIcon} />
          <span>Syncing branch data…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.modalEmpty}>No branches found{search ? ` for "${search}"` : ''}.</div>
      ) : (
        <div className={styles.branchModalGrid}>
          {filtered.map((branch, i) => {
            const sharePct = totalInterns > 0 ? ((branch.count || 0) / totalInterns * 100).toFixed(1) : '0';
            return (
              <div key={i} className={`${styles.branchModalCard} ${branch.isHQ ? styles.branchHQCard : ''}`}>
                <div className={styles.branchModalCardTop}>
                  <div className={styles.branchModalIcon}>
                    <MapPin size={16} strokeWidth={2} />
                  </div>
                  <div className={styles.branchModalCardInfo}>
                    <div className={styles.branchModalCardName}>
                      {branch.name}
                      {branch.isHQ && <span className={styles.modalHqBadge}>HQ</span>}
                    </div>
                    {branch.sub && <span className={styles.branchModalCardSub}>{branch.sub}</span>}
                  </div>
                </div>
                <div className={styles.branchModalCardBottom}>
                  <span className={styles.branchModalCardCount}>{branch.count}</span>
                  <span className={styles.branchModalCardLabel}>interns · {sharePct}%</span>
                </div>
                <div className={styles.branchModalProgress}>
                  <div 
                    className={styles.branchModalProgressFill}
                    style={{ width: `${sharePct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// ─── PENDING REQUESTS MODAL ───
function RequestsModal({ isOpen, onClose, onRequestAction }) {
  const [activeTab, setActiveTab] = useState('absent');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState({ absent: [], halfDay: [], overtime: [] });
  const [activePopup, setActivePopup] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/hr/dashboard-stats');
      if (res.data?.pending_requests) {
        setRequests(res.data.pending_requests);
      }
    } catch {
      toast.error('Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) { setSearch(''); setActivePopup(null); return; }
    fetchRequests();
  }, [isOpen, fetchRequests]);

  const handleAction = async (id, action) => {
    try {
      await api.post(`/hr/requests/${id}/process`, { action });
      toast.success(`Request ${action}ed!`);
      setRequests(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = updated[key].filter(r => r.id !== id);
        });
        return updated;
      });
      onRequestAction?.();
    } catch {
      toast.error('Failed to process request.');
    }
  };

  const openDetail = async (reqId) => {
    setActivePopup({ id: reqId, loading: true });
    try {
      const res = await api.get(`/hr/requests/${reqId}`);
      setActivePopup(res.data);
    } catch {
      toast.error('Could not load request details.');
      setActivePopup(null);
    }
  };

  const currentList = (requests[activeTab] || []).filter(r =>
    r.intern_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.reason?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = Object.values(requests).reduce((s, arr) => s + arr.length, 0);

  const TAB_CONFIG = [
    { key: 'absent', label: 'Absent' },
    { key: 'halfDay', label: 'Half-Day' },
    { key: 'overtime', label: 'Overtime' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pending Requests" icon={ClipboardList} width="760px">
      {/* Summary */}
      <div className={styles.modalStats}>
        <div className={styles.modalStatItem}>
          <span className={styles.modalStatValue} style={{ color: totalPending > 0 ? '#ef4444' : '#10b981' }}>
            {totalPending}
          </span>
          <span className={styles.modalStatLabel}>Total Pending</span>
        </div>
        <div className={styles.modalStatDivider} />
        {TAB_CONFIG.map(tab => (
          <React.Fragment key={tab.key}>
            <div className={styles.modalStatItem}>
              <span className={styles.modalStatValue}>{requests[tab.key]?.length || 0}</span>
              <span className={styles.modalStatLabel}>{tab.label}</span>
            </div>
            {tab.key !== 'overtime' && <div className={styles.modalStatDivider} />}
          </React.Fragment>
        ))}
        <button className={styles.modalRefreshBtn} onClick={fetchRequests} disabled={loading}>
          <RefreshCw size={14} className={loading ? styles.spinIcon : ''} />
          Refresh
        </button>
      </div>

      {/* Tabs + Search */}
      <div className={styles.modalControls} style={{ flexDirection: 'column', gap: '12px' }}>
        <div className={styles.reqModalTabs}>
          {TAB_CONFIG.map(tab => (
            <button 
              key={tab.key}
              className={`${styles.reqModalTab} ${activeTab === tab.key ? styles.reqModalTabActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className={`${styles.reqModalBadge} ${activeTab === tab.key ? styles.reqModalBadgeActive : ''}`}>
                {requests[tab.key]?.length || 0}
              </span>
            </button>
          ))}
        </div>
        <div className={styles.modalSearch}>
          <Search size={14} className={styles.modalSearchIcon} />
          <input 
            className={styles.modalSearchInput}
            placeholder="Search by intern name or reason…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Request List */}
      {loading ? (
        <div className={styles.modalLoading}>
          <Loader2 size={24} className={styles.spinIcon} />
          <span>Loading requests…</span>
        </div>
      ) : currentList.length === 0 ? (
        <div className={styles.modalEmpty}>
          {search ? `No results for "${search}"` : `No pending ${activeTab === 'halfDay' ? 'half-day' : activeTab} requests.`}
        </div>
      ) : (
        <div className={styles.reqModalList}>
          {currentList.map(req => (
            <div 
              key={req.id} 
              className={styles.reqModalItem}
              onClick={() => openDetail(req.id)}
            >
              <div className={styles.reqModalAvatar}>
                {req.intern_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className={styles.reqModalInfo}>
                <h4 className={styles.reqModalName}>{req.intern_name}</h4>
                <div className={styles.reqModalMeta}>
                  <Calendar size={11} />
                  <span>{req.date}</span>
                  {req.hours && <><span>·</span><span>{req.hours} hrs</span></>}
                </div>
                <p className={styles.reqModalReason}>"{req.reason}"</p>
              </div>
              <div className={styles.reqModalActions} onClick={e => e.stopPropagation()}>
                <button 
                  className={`${styles.reqActionBtn} ${styles.reqApprove}`}
                  onClick={() => handleAction(req.id, 'approve')}
                  title="Approve"
                >
                  <Check size={15} strokeWidth={2.5} />
                  Approve
                </button>
                <button 
                  className={`${styles.reqActionBtn} ${styles.reqReject}`}
                  onClick={() => handleAction(req.id, 'reject')}
                  title="Reject"
                >
                  <X size={15} strokeWidth={2.5} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline detail panel */}
      {activePopup && (
        <div className={styles.reqDetailPanel}>
          <div className={styles.reqDetailHeader}>
            <span>Request Details</span>
            <button className={styles.reqDetailClose} onClick={() => setActivePopup(null)}><X size={15} /></button>
          </div>
          {activePopup.loading ? (
            <div className={styles.modalLoading} style={{ padding: '20px 0' }}>
              <Loader2 size={20} className={styles.spinIcon} />
              <span>Loading…</span>
            </div>
          ) : (
            <div className={styles.reqDetailBody}>
              <div className={styles.reqDetailGrid}>
                <div className={styles.reqDetailField}>
                  <span className={styles.reqDetailLabel}>Intern</span>
                  <span className={styles.reqDetailValue} style={{ color: '#0B1EAE', fontWeight: 700 }}>{activePopup.intern_name}</span>
                </div>
                <div className={styles.reqDetailField}>
                  <span className={styles.reqDetailLabel}>Type</span>
                  <span className={styles.reqDetailValue}>{activePopup.type}</span>
                </div>
                <div className={styles.reqDetailField}>
                  <span className={styles.reqDetailLabel}>Date</span>
                  <span className={styles.reqDetailValue}>{activePopup.date_of_absence}</span>
                </div>
                <div className={styles.reqDetailField} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.reqDetailLabel}>Reason</span>
                  <span className={styles.reqDetailValue}>{activePopup.reason}</span>
                </div>
                {activePopup.additional_details && (
                  <div className={styles.reqDetailField} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.reqDetailLabel}>Additional Details</span>
                    <span className={styles.reqDetailValue} style={{ fontSize: '13px', lineHeight: 1.5 }}>{activePopup.additional_details}</span>
                  </div>
                )}
              </div>
              {activePopup.attachment_path && (
                <div className={styles.reqDetailAttachment}>
                  <Paperclip size={16} color="#64748b" />
                  <a href={`http://localhost:8000/storage/${activePopup.attachment_path}`} target="_blank" rel="noopener noreferrer">
                    View Attached Document
                  </a>
                </div>
              )}
              {activePopup.status === 'Pending' && (
                <div className={styles.reqDetailFooter}>
                  <button className={styles.reqDetailReject} onClick={() => { handleAction(activePopup.id, 'reject'); setActivePopup(null); }}>Reject</button>
                  <button className={styles.reqDetailApprove} onClick={() => { handleAction(activePopup.id, 'approve'); setActivePopup(null); }}>Approve</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── MAIN COMPONENT ───
export default function DashboardHome() {

  
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('pie');
  const [isHovered, setIsHovered] = useState(false);
  const [activeTab, setActiveTab] = useState('absent');

  // Modal states
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [requestsModalOpen, setRequestsModalOpen] = useState(false);

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

  const refreshStats = useCallback(async () => {
    try {
      const res = await api.get('/hr/dashboard-stats');
      if (res.data) setStats(prev => ({ 
        ...prev, 
        ...res.data,
        pending_requests: res.data.pending_requests || prev.pending_requests 
      }));
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        await refreshStats();
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
  }, [refreshStats]);

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
      if (res.data?.pending_requests) {
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

  const deptAttendanceData = stats.departments?.length > 0 
    ? stats.departments.map(d => ({
        name: d.name.length > 10 ? d.name.substring(0, 10) + '...' : d.name, 
        present: d.present_count || Math.floor(d.count * 0.8), 
        absent: d.absent_count || Math.floor(d.count * 0.2),
      }))
    : [];

  const activeRequestsList = stats.pending_requests[activeTab] || [];

  const g1 = angleToSVGCoords(120); 
  const g2 = angleToSVGCoords(265); 
  const g3 = angleToSVGCoords(230); 
  const g4 = angleToSVGCoords(143); 

  if (loading) return <DashboardSkeleton />;

  return (
    <div className={styles.pageWrapper}>
      <Toaster position="top-right" />

      <PageHeader title="Dashboard" onNotificationClick={openRequestPopup} />

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
                <ResponsiveContainer width="100%" height={340}> 
                  <PieChart margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gradSilverShiny" x1={g1.x1} y1={g1.y1} x2={g1.x2} y2={g1.y2} gradientUnits="objectBoundingBox">
                        <stop offset="18.03%" stopColor="#8C8C8C" />
                      </linearGradient>
                      <linearGradient id="gradLavenderShiny" x1={g2.x1} y1={g2.y1} x2={g2.x2} y2={g2.y2} gradientUnits="objectBoundingBox">
                        <stop offset="18.93%" stopColor="#8188B9" />
                      </linearGradient>
                      <linearGradient id="gradBlueShiny" x1={g3.x1} y1={g3.y1} x2={g3.x2} y2={g3.y2} gradientUnits="objectBoundingBox">
                        <stop offset="16.53%" stopColor="#2238DF" />
                      </linearGradient>
                      <linearGradient id="gradSilverLightShiny" x1={g4.x1} y1={g4.y1} x2={g4.x2} y2={g4.y2} gradientUnits="objectBoundingBox">
                        <stop offset="38.03%" stopColor="#B0B0B0" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={stats.course_distribution}
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                      cy="35%"
                    >
                      {stats.course_distribution.map((entry, index) => {
                        const gradients = ['url(#gradBlueShiny)', 'url(#gradLavenderShiny)', 'url(#gradSilverShiny)', 'url(#gradSilverLightShiny)'];
                        return <Cell key={`cell-${index}`} fill={gradients[index % gradients.length]} />;
                      })}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#0f172a', fontWeight: 600 }} />
                    <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px', position: 'relative', top: '280px'}} />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.donutCenter}>
                  <span className={styles.donutTotal} style={{ color: '#0f172a' }}>{stats.total_interns}</span>
                  <span className={styles.donutLabel} style={{ color: '#94a3b8' }}>Total</span>
                </div>
              </>
            )}
            {chartView === 'bar' && (
              <ResponsiveContainer width="100%" height={340}> 
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
            <div className={`${styles.attLabel} ${styles.present}`}><UserCheck size={18} strokeWidth={1.5} /> Present Today</div>
            <span className={`${styles.attValue} ${styles.present}`}>{stats.today.present}</span>
          </div>
          <div className={styles.attCard}>
            <div className={`${styles.attLabel} ${styles.absent}`}><UserX size={18} strokeWidth={1.5} /> Absent Today</div>
            <span className={`${styles.attValue} ${styles.absent}`}>{stats.today.absent}</span>
          </div>
          <div className={styles.attCard}>
            <div className={`${styles.attLabel} ${styles.excused}`}><UserMinus size={18} strokeWidth={1.5} /> Excused Today</div>
            <span className={`${styles.attValue} ${styles.excused}`}>{stats.today.excused}</span>
          </div>
          <div className={styles.attCard}>
            <div className={`${styles.attLabel} ${styles.late}`}><Clock size={18} strokeWidth={1.5} /> Late Today</div>
            <span className={`${styles.attValue} ${styles.late}`}>{stats.today.late}</span>
          </div>
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div className={styles.bottomGrid}>
        
        {/* 1. By Department List */}
        <div className={styles.card}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>By Department</h3>
            <span 
              className={styles.viewAllLink} 
              onClick={() => setDeptModalOpen(true)}
            >
              View all <ChevronRight size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </span>
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
            <span 
              className={styles.viewAllLink} 
              onClick={() => setBranchModalOpen(true)}
            >
              View all <ChevronRight size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </span>
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

        {/* 3. Schools Bar Chart */}
        <div className={styles.card}>
          <div className={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                <BarChart 
                  data={schoolData.map(school => ({ ...school, shortName: getSchoolAbbreviation(school.name) }))} 
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} interval={0} />
                  <YAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                    itemStyle={{ color: '#0f172a', fontWeight: 'bold' }} 
                    labelFormatter={(label, payload) => payload?.length > 0 ? payload[0].payload.name : label}
                  />
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

        {/* 4. Pending Requests Widget */}
        <div className={styles.card}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Pending Requests</h3>
            <span 
              className={styles.viewAllLink} 
              onClick={() => setRequestsModalOpen(true)} 
              style={{ cursor: 'pointer' }}
            >
              View all <ChevronRight size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </span>
          </div>
          
          <div className={styles.pendingTabs}>
            {[
              { key: 'absent', label: 'Absent' },
              { key: 'halfDay', label: 'Half-Day' },
              { key: 'overtime', label: 'Overtime' },
            ].map(tab => (
              <div 
                key={tab.key}
                className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label} <span className={styles.tabBadge}>{stats.pending_requests[tab.key].length}</span>
              </div>
            ))}
          </div>

          <div className={styles.requestsContainer} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto' }}>
            {activeRequestsList.length === 0 ? (
              <div className={styles.emptyStateBox} style={{ marginTop: '0' }}>No pending requests right now.</div>
            ) : (
              activeRequestsList.map((req) => (
                <div 
                  key={req.id} 
                  onClick={() => openRequestPopup(req.id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s ease' }}
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
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleRequestAction(req.id, 'approve', activeTab); }} style={{ background: '#ecfdf5', color: '#10b981', border: '1px solid #d1fae5', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }} title="Approve Request"><Check size={14} strokeWidth={2.5} /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleRequestAction(req.id, 'reject', activeTab); }} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }} title="Reject Request"><X size={14} strokeWidth={2.5} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* BOTTOM RIGHT POPUP */}
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

      {/* ─── THE THREE MODALS ─── */}
      <DepartmentModal 
        isOpen={deptModalOpen} 
        onClose={() => setDeptModalOpen(false)} 
        stats={stats} 
      />
      <BranchModal 
        isOpen={branchModalOpen} 
        onClose={() => setBranchModalOpen(false)} 
        stats={stats} 
      />
      <RequestsModal 
        isOpen={requestsModalOpen} 
        onClose={() => setRequestsModalOpen(false)}
        onRequestAction={refreshStats}
      />
    </div>
  );
}