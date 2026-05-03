import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Search, SlidersHorizontal, MoreHorizontal, 
  Archive, ArchiveRestore, Download, Clock, AlertCircle, X, FileText, Activity, File, CheckCircle2, Award, Loader2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import api from '../../../api/axios';
import styles from './InternsList.module.css';
import InternDetailsModal from '../internsdetail/InternDetailsModal';
import { useProfileDrawer } from '../../../context/ProfileDrawerContext';

// ✨ IMPORT YOUR NEW UNIFORM HEADER ✨
import PageHeader from '../../../components/PageHeader';

// ✨ ABBREVIATION HELPER FUNCTION ✨
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

  if (overrides[schoolName]) {
    return overrides[schoolName];
  }

  const stopWords = ['of', 'and', 'the', 'in', 'at', 'de'];
  const words = schoolName.split(/[\s-]+/); 
  
  let acronym = '';
  words.forEach(word => {
    if (!stopWords.includes(word.toLowerCase()) && word.length > 0) {
      acronym += word[0].toUpperCase();
    }
  });

  return acronym.length >= 2 ? acronym : schoolName;
};

function Sk({ w = '100%', h = 16, r = 6, mb = 0 }) {
  return (
    <div
      className={styles.skel}
      style={{ width: w, height: h, borderRadius: r, marginBottom: mb, flexShrink: 0 }}
    />
  );
}

export default function InternsList() {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State to track if we are viewing Active or Archived interns
  const [viewMode, setViewMode] = useState('active'); 

  const [selectedInternModal, setSelectedInternModal] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const { openProfile } = useProfileDrawer();

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const [selectedInterns, setSelectedInterns] = useState([]); 
  const [activeBulkModal, setActiveBulkModal] = useState(null); 
  const [isProcessing, setIsProcessing] = useState(false); 

  const [confirmArchiveText, setConfirmArchiveText] = useState("");
  const [exportType, setExportType] = useState('info');
  const [exportFormat, setExportFormat] = useState('Excel');
  
  // ✨ State for the Hours Input Mode
  const [hoursInputType, setHoursInputType] = useState('time'); // 'time' or 'full_day'
  
  const [eventType, setEventType] = useState('Regular Day');
  const [addHoursForm, setAddHoursForm] = useState({
    date: '', timeIn: '', timeOut: '', reason: '', notes: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [schoolFilter, setSchoolFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [presentFilter, setPresentFilter] = useState('All');

  const fetchInterns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hr/interns', {
        params: { view: viewMode } 
      });
      setInterns(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching interns:", err);
      setError("Failed to load interns list.");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetches the list AND clears checkboxes whenever the view changes
  useEffect(() => { 
    fetchInterns(); 
    clearSelection();
  }, [viewMode]);

  const uniqueDepartments = useMemo(() => ['All', ...new Set(interns.map(i => i.intern?.department?.name || i.department?.name || i.assigned_department || 'Not Assigned'))], [interns]);
  const uniqueSchools = useMemo(() => ['All', ...new Set(interns.map(i => i.intern?.school?.name || i.school?.name || i.school || 'Not Assigned'))], [interns]);
  const uniqueStatuses = useMemo(() => ['All', ...new Set(interns.map(i => i.status || 'Unknown'))], [interns]);

  const processedInterns = useMemo(() => {
    return interns.filter(user => {
      const name = `${user.first_name} ${user.last_name}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      const dept = user.intern?.department?.name || user.department?.name || user.assigned_department || 'Not Assigned';
      const school = user.intern?.school?.name || user.school?.name || user.school || 'Not Assigned';
      const status = user.status || 'Unknown';

      const matchesSearch = name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === 'All' || dept === deptFilter;
      const matchesSchool = schoolFilter === 'All' || school === schoolFilter;
      const matchesStatus = statusFilter === 'All' || status === statusFilter;
      const matchesPresent = presentFilter === 'All' || 
                             (presentFilter === 'Present' && user.is_present_today) || 
                             (presentFilter === 'Absent' && !user.is_present_today);

      return matchesSearch && matchesDept && matchesSchool && matchesStatus && matchesPresent;
    });
  }, [interns, searchTerm, deptFilter, schoolFilter, statusFilter, presentFilter]);

  const fullChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dataObj = {};
    
    const today = new Date();
    for (let i = 59; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      dataObj[`${months[d.getMonth()]} ${d.getFullYear()}`] = 0;
    }

    interns.forEach(intern => {
      const dateStr = intern.intern?.date_started || intern.date_started || intern.created_at;
      if (dateStr) {
         const d = new Date(dateStr);
         const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
         if (dataObj[key] !== undefined) {
             dataObj[key] += 1;
         }
      }
    });

    return Object.keys(dataObj).map(key => ({
      name: key, 
      rawMonth: key.split(' ')[0], 
      rawYear: key.split(' ')[1],  
      interns: dataObj[key]
    }));
  }, [interns]);

  const windowSize = 12;
  const [startIndex, setStartIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartIndex, setDragStartIndex] = useState(0);

  useEffect(() => {
    if (fullChartData.length > windowSize) {
      setStartIndex(fullChartData.length - windowSize);
    }
  }, [fullChartData.length]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartIndex(startIndex);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX;
    const shift = Math.round(deltaX / 25); 
    let newIndex = dragStartIndex - shift;
    newIndex = Math.max(0, Math.min(newIndex, fullChartData.length - windowSize));
    setStartIndex(newIndex);
  };

  const handleMouseUp = () => setIsDragging(false);
  const visibleData = fullChartData.slice(startIndex, startIndex + windowSize);

  const toggleInternSelection = (intern) => {
    setSelectedInterns(prev => 
      prev.some(i => i.id === intern.id) 
      ? prev.filter(i => i.id !== intern.id)
      : [...prev, intern]
    );
  };

  const toggleAllSelection = () => {
    if (selectedInterns.length === processedInterns.length) {
      setSelectedInterns([]); 
    } else {
      setSelectedInterns([...processedInterns]); 
    }
  };

  const clearSelection = () => {
    setSelectedInterns([]);
    setActiveBulkModal(null);
    setConfirmArchiveText("");
    setAddHoursForm({ date: '', timeIn: '', timeOut: '', reason: '', notes: '' });
  };

  const isAllSelected = processedInterns.length > 0 && selectedInterns.length === processedInterns.length;
  const isSelected = (id) => selectedInterns.some(intern => intern.id === id);

  const handleBulkArchive = async () => {
    try {
      setIsProcessing(true);
      const internIds = selectedInterns.map(i => i.id);
      await api.post('/hr/interns/bulk-archive', { ids: internIds });
      fetchInterns(); 
      clearSelection(); 
      showNotification(`${internIds.length} interns successfully archived.`); 
    } catch  {
      showNotification("Error archiving interns.", "error"); 
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkRestore = async () => {
    try {
      setIsProcessing(true);
      const internIds = selectedInterns.map(i => i.id);
      await api.post('/hr/interns/bulk-restore', { ids: internIds });
      fetchInterns(); 
      clearSelection(); 
      showNotification(`${internIds.length} interns successfully restored.`); 
    } catch  {
      showNotification("Error restoring interns.", "error"); 
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkExport = async () => {
    try {
      setIsProcessing(true);
      const internIds = selectedInterns.map(i => i.id);
      const response = await api.post('/hr/interns/bulk-export', {
        ids: internIds, type: exportType, format: exportFormat
      }, { responseType: 'blob' }); 

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Intern_Export_${new Date().toISOString().split('T')[0]}.${exportFormat.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      
      clearSelection();
      showNotification("Export downloaded successfully!"); 
    } catch  {
      showNotification("Export failed.", "error"); 
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAddHours = async () => {
    if (!addHoursForm.date) {
      showNotification("Please select a Date.", "error");
      return;
    }
    
    // If they choose Exact Time, ensure both times are filled
    if (hoursInputType === 'time' && (!addHoursForm.timeIn || !addHoursForm.timeOut)) {
      showNotification("Please fill in Time In and Time Out.", "error");
      return;
    }

    try {
      setIsProcessing(true);
      const payload = {
        intern_ids: selectedInterns.map(i => i.id),
        event_type: eventType,
        date: addHoursForm.date,
        input_type: hoursInputType, 
        time_in: hoursInputType === 'time' ? addHoursForm.timeIn : null,
        time_out: hoursInputType === 'time' ? addHoursForm.timeOut : null,
        reason: addHoursForm.reason,
        notes: addHoursForm.notes
      };

      await api.post('/hr/interns/bulk-add-hours', payload);
      fetchInterns();
      clearSelection();
      showNotification("Hours assigned successfully!"); 
    } catch  {
      showNotification("Failed to add hours.", "error"); 
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading && interns.length === 0) {
    return (
      <div className={styles.pageWrapper}>
        {/* ✨ UPDATED SKELETON HEADER TO MATCH PAGEHEADER ✨ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', background: '#fff', borderRadius: '10px', border: '1px solid #e8eaf0', marginBottom: '24px' }}>
          <Sk w={160} h={26} r={6} />
          <div style={{ display: 'flex', gap: '12px' }}>
            <Sk w={36} h={36} r={8} />
            <Sk w={210} h={36} r={999} />
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.sectionHeader}>
            <Sk w={120} h={18} />
            <Sk w={40} h={18} />
          </div>
          <Sk w="100%" h={220} />
        </div>

        <div className={styles.grid4}>
          {[...Array(4)].map((_, i) => <Sk key={i} w="100%" h={36} r={8} />)}
        </div>

        <div className={styles.card}>
          <div className={styles.sectionHeader}>
            <Sk w={100} h={18} />
            <div className={styles.flexRow}>
              <Sk w={70} h={30} r={8} />
              <Sk w={36} h={30} r={8} />
            </div>
          </div>
          <div className={styles.flexCol} style={{ marginTop: '10px' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={styles.flexRow} style={{ padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
                <Sk w={14} h={14} r={4} />
                <Sk w={32} h={32} r={999} />
                <div className={styles.flexCol} style={{ flex: 1 }}>
                  <Sk w={120} h={13} />
                  <Sk w={80} h={10} />
                </div>
                <Sk w={60} h={13} />
                <Sk w={60} h={13} />
                <Sk w={60} h={13} />
                <Sk w={24} h={24} r={6} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>

      {notification.show && (
        <div className={`${styles.toast} ${notification.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span className={styles.subText} style={{ color: 'inherit', fontWeight: '600' }}>{notification.message}</span>
          <button onClick={() => setNotification({ show: false, message: '', type: 'success' })} className={styles.actionBtn}>
            <X size={14} />
          </button>
        </div>
      )}
      
      {/* ✨ REPLACED HEADER WITH YOUR NEW PAGEHEADER COMPONENT ✨ */}
      <PageHeader title="Interns Overview" />

      <div className={styles.card} style={{ maxHeight: '200px', opacity: viewMode === 'archived' ? 0.5 : 1, transition: 'opacity 0.3s' }}>
        <div className={styles.sectionHeader} style={{ alignItems: 'flex-end' }}>
          <div className={styles.flexCol}>
            <h3 className={styles.sectionTitle}>
              {viewMode === 'active' ? 'Active Interns' : 'Archived Interns History'}
            </h3>
            <p className={styles.subText}>Click and drag the chart left or right to view historical data.</p>
          </div>
          <div className={styles.flexColEnd} style={{ textAlign: 'right' }}>
            <p className={styles.statValue}>{interns.length}</p>
            <p className={styles.label} style={{ color: viewMode === 'active' ? '#16a34a' : '#64748b' }}>
              Total {viewMode === 'active' ? 'Active' : 'Archived'}
            </p>
          </div>
        </div>

        <div 
          className={styles.chartWrapper} 
          style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <ResponsiveContainer width="100%" height="100%" style={{ pointerEvents: 'none' }}>
            <AreaChart data={visibleData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInterns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={viewMode === 'active' ? '#0B1EAE' : '#64748b'} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={viewMode === 'active' ? '#0B1EAE' : '#64748b'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e8eaf0', boxShadow: 'none' }}
                labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                itemStyle={{ color: viewMode === 'active' ? '#0B1EAE' : '#64748b', fontWeight: 'bold' }}
                formatter={(value) => [`${value} Interns`, viewMode === 'active' ? 'Active' : 'Archived']}
              />
              <Area type="monotone" dataKey="interns" stroke={viewMode === 'active' ? '#0B1EAE' : '#64748b'} strokeWidth={2} fillOpacity={1} fill="url(#colorInterns)" isAnimationActive={!isDragging} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.grid4}>
        <select className={styles.select} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          {uniqueDepartments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
        </select>
        <select className={styles.select} value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)}>
          {uniqueSchools.map(s => <option key={s} value={s}>{s === 'All' ? 'All Schools' : s}</option>)}
        </select>
        <select className={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {uniqueStatuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
        </select>
        <select className={styles.select} value={presentFilter} onChange={e => setPresentFilter(e.target.value)} disabled={viewMode === 'archived'}>
          <option value="All">All Attendance</option>
          <option value="Present">Present Today</option>
          <option value="Absent">Absent Today</option>
        </select>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.card} style={{ padding: '16px 18px' }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {viewMode === 'active' ? 'List Of Interns' : 'Archived Records'}
          </h2>
          
          <div className={styles.flexRow} style={{ gap: '12px' }}>
            {/* Search Bar */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="text" 
                placeholder="Search name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.input}
                style={{ paddingLeft: '32px', height: '34px', width: '220px' }}
              />
            </div>

            {/* VIEW TOGGLE BUTTON BESIDE SEARCH */}
            <button 
              onClick={() => setViewMode(prev => prev === 'active' ? 'archived' : 'active')}
              className={`${styles.btn} ${viewMode === 'archived' ? styles.btnPrimary : ''}`}
              style={{ height: '34px' }}
            >
              {viewMode === 'active' ? (
                <><Archive size={14} /> View Archives</>
              ) : (
                <><Search size={14} /> View Active</>
              )}
            </button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th className={styles.checkboxCell}>
                  <input type="checkbox" className={styles.checkbox} checked={isAllSelected} onChange={toggleAllSelection}/>
                </th>
                <th>Interns</th>
                <th>Department</th>
                <th>School</th>
                <th>Date {viewMode === 'archived' ? 'Archived' : 'Started'}</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {processedInterns.length === 0 ? (
                <tr>
                  <td colSpan="7" className={styles.emptyRow}>
                    {viewMode === 'archived' ? 'No archived records found.' : 'No active interns found.'}
                  </td>
                </tr>
              ) : (
                processedInterns.map((user) => {
                  const departmentName = user.intern?.department?.name || user.department?.name || user.assigned_department || 'Not Assigned';
                  const schoolName = user.intern?.school?.name || user.school?.name || user.school || 'Not Assigned';
                  
                  return (
                    <tr key={user.id} className={isSelected(user.id) ? styles.selectedRow : ""}>
                      <td className={styles.checkboxCell}>
                        <input type="checkbox" className={styles.checkbox} checked={isSelected(user.id)} onChange={() => toggleInternSelection(user)}/>
                      </td>
                      
                      <td>
                        <div 
                          className={styles.internProfile} 
                          onClick={() => {
                            if (user.id) {
                                openProfile(user.id);
                            } else {
                                alert(`Sync Error: Account ID missing.`);
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                          title="View Full Profile"
                        >
                          <div className={styles.avatar}>
                            <img 
                              src={user.intern?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                              alt="avatar" 
                              style={{ filter: viewMode === 'archived' ? 'grayscale(100%)' : 'none' }}
                            />
                          </div>
                          <div className={styles.flexCol} style={{ gap: '2px' }}>
                            <p className={styles.internName} style={{ color: viewMode === 'archived' ? '#64748b' : '#0B1EAE' }}>
                              {user.first_name} {user.last_name}
                            </p>
                            <p className={styles.internEmail}>{user.email}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td>{departmentName}</td>
                      
                      <td title={schoolName !== 'Not Assigned' ? schoolName : ''}>
                        {schoolName !== 'Not Assigned' ? getSchoolAbbreviation(schoolName) : 'Not Assigned'}
                      </td>
                      
                      <td>{formatDate(viewMode === 'archived' ? user.deleted_at : (user.intern?.date_started || user.date_started || user.created_at))}</td>
                      
                      <td>
                        <span className={user.status?.toLowerCase() === 'active' ? styles.statusActive : styles.statusInactive}>
                          {viewMode === 'archived' ? 'Archived' : (user.status || 'Unknown')}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className={styles.actionBtn} 
                          onClick={() => {
                            setSelectedInternModal({
                              id: user.id, 
                              name: `${user.first_name} ${user.last_name}`,
                              email: user.email,
                              department: departmentName,
                              school: schoolName, 
                              course: user.intern?.course || user.course || 'Not Assigned',
                              emergency_name: user.intern?.emergency_name || 'NOT PROVIDED',
                              emergency_number: user.intern?.emergency_number || 'NOT PROVIDED',
                              emergency_address: user.intern?.emergency_address || 'NOT PROVIDED',
                              avatar_url: user.intern?.avatar_url || null, 
                              rawData: user 
                            });
                          }}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInternModal && (
        <InternDetailsModal 
          intern={selectedInternModal} 
          onClose={() => setSelectedInternModal(null)} 
        />
      )}

      {/* FLOATING BULK ACTIONS BAR */}
      {selectedInterns.length > 0 && (
        <div className={styles.floatingBar}>
          <div className={styles.flexRow}>
            <span className={styles.badgeCircle}>{selectedInterns.length}</span>
            <span className={styles.sectionTitle} style={{ fontSize: '13px' }}>Selected</span>
          </div>
          <div className={styles.dividerY}></div>
          <div className={styles.flexRow}>
            
            {/* CONDITIONALLY RENDER ARCHIVE OR RESTORE BASED ON VIEW MODE */}
            {viewMode === 'active' ? (
              <button onClick={() => setActiveBulkModal('archive')} className={`${styles.btn} ${styles.btnDanger}`}>
                <Archive size={14} /> Archive
              </button>
            ) : (
              <button onClick={() => setActiveBulkModal('restore')} className={`${styles.btn} ${styles.btnPrimary}`} style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
                <ArchiveRestore size={14} /> Restore
              </button>
            )}
            
            <button onClick={() => setActiveBulkModal('export')} className={styles.btn}>
              <Download size={14} /> Export
            </button>
            <button onClick={() => setActiveBulkModal('addHours')} className={`${styles.btn} ${styles.btnPrimary}`}>
              <Clock size={14} /> Add Hours
            </button>
          </div>
          <button onClick={clearSelection} className={styles.actionBtn} style={{ marginLeft: '5px' }}><X size={16} /></button>
        </div>
      )}

      {/* ARCHIVE MODAL */}
      {activeBulkModal === 'archive' && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.flexRow}>
              <Archive size={18} className={styles.sectionTitle} />
              <h2 className={styles.sectionTitle}>Archive - Selected Interns</h2>
            </div>
            
            <div className={styles.nestedCard} style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
              <div className={styles.flexRow} style={{ color: '#dc2626' }}>
                <AlertCircle size={14} />
                <span style={{ fontSize: '13px', fontWeight: '700' }}>Confirm Archiving</span>
              </div>
              <p className={styles.subText} style={{ paddingLeft: '19px' }}>
                Archiving these interns will hide them from the active lists and reports. Their data is kept safe, and they can be restored at any time.
              </p>
            </div>

            <div className={styles.nestedCard}>
              <div className={styles.flexRowBetween}>
                <h3 className={styles.label}>Selected Interns</h3>
                <span className={styles.badgeCircle} style={{ background: '#dc2626', width: 'auto', padding: '0 6px' }}>{selectedInterns.length}</span>
              </div>
              <div className={styles.flexRow} style={{ flexWrap: 'wrap' }}>
                {selectedInterns.map((intern, idx) => (
                  <div key={idx} className={styles.chip}>
                    <Search size={12} /> {intern.first_name} {intern.last_name}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.nestedCard}>
              <label className={styles.label}>Type <span style={{ color: '#dc2626' }}>ARCHIVE</span> to confirm</label>
              <input 
                type="text" 
                placeholder="Type ARCHIVE here ...." 
                value={confirmArchiveText}
                onChange={(e) => setConfirmArchiveText(e.target.value)}
                className={styles.input}
              />
            </div>
            
            <div className={styles.flexRowEnd} style={{ marginTop: '5px' }}>
              <button onClick={() => setActiveBulkModal(null)} className={styles.btn}>Cancel</button>
              <button 
                onClick={handleBulkArchive}
                disabled={confirmArchiveText !== 'ARCHIVE' || isProcessing}
                className={`${styles.btn} ${styles.btnDangerFill}`}
              >
                {isProcessing ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE MODAL */}
      {activeBulkModal === 'restore' && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.flexRow}>
              <ArchiveRestore size={18} className={styles.sectionTitle} />
              <h2 className={styles.sectionTitle}>Restore - Selected Interns</h2>
            </div>
            
            <div className={styles.nestedCard} style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <div className={styles.flexRow} style={{ color: '#16a34a' }}>
                <CheckCircle2 size={14} />
                <span style={{ fontSize: '13px', fontWeight: '700' }}>Confirm Restoration</span>
              </div>
              <p className={styles.subText} style={{ paddingLeft: '19px' }}>
                This will bring the selected interns back to "Active" status, making them visible in regular lists and reports again.
              </p>
            </div>

            <div className={styles.nestedCard}>
              <div className={styles.flexRowBetween}>
                <h3 className={styles.label}>Selected Interns</h3>
                <span className={styles.badgeCircle} style={{ background: '#16a34a', width: 'auto', padding: '0 6px' }}>{selectedInterns.length}</span>
              </div>
              <div className={styles.flexRow} style={{ flexWrap: 'wrap' }}>
                {selectedInterns.map((intern, idx) => (
                  <div key={idx} className={styles.chip}>
                    <Search size={12} /> {intern.first_name} {intern.last_name}
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.flexRowEnd} style={{ marginTop: '15px' }}>
              <button onClick={() => setActiveBulkModal(null)} className={styles.btn}>Cancel</button>
              <button 
                onClick={handleBulkRestore}
                disabled={isProcessing}
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', color: 'white' }}
              >
                {isProcessing ? 'Restoring...' : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT MODAL */}
      {activeBulkModal === 'export' && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.flexRow}>
              <Clock size={18} className={styles.sectionTitle} />
              <h2 className={styles.sectionTitle}>Export - Selected Interns</h2>
            </div>
            
            <div className={styles.nestedCard}>
              <h3 className={styles.label}>Selected Interns</h3>
              <div className={styles.flexRow} style={{ flexWrap: 'wrap' }}>
                {selectedInterns.map((intern, idx) => (
                  <div key={idx} className={styles.chip}>
                    <Search size={12} /> {intern.first_name} {intern.last_name}
                  </div>
                ))}
              </div>
            </div>

            <h3 className={styles.label}>What to Export?</h3>
            <div className={styles.grid2}>
              {[
                { id: 'info', icon: <Search size={18}/>, title: 'Intern Info', desc: 'Name, School, Dept...' },
                { id: 'log', icon: <Clock size={18}/>, title: 'Attendance Log', desc: 'Time-in/out history' },
                { id: 'progress', icon: <Activity size={18}/>, title: 'Hours Progress', desc: 'Rendered vs Required' },
                { id: 'full', icon: <File size={18}/>, title: 'Full Report', desc: 'All data combined' }
              ].map((opt) => (
                <div key={opt.id} onClick={() => setExportType(opt.id)} className={`${styles.exportOption} ${exportType === opt.id ? styles.exportOptionActive : ''}`}>
                  <div style={{ color: exportType === opt.id ? '#0B1EAE' : '#64748b' }}>{opt.icon}</div>
                  <div className={styles.flexCol}>
                    <h4 className={styles.sectionTitle} style={{ fontSize: '13px' }}>{opt.title}</h4>
                    <p className={styles.subText} style={{ fontSize: '11px' }}>{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.grid2} style={{ marginTop: '5px' }}>
              <div className={styles.flexCol}>
                <h3 className={styles.label}>Data Range</h3>
                <select className={styles.select}>
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>All Time</option>
                </select>
              </div>
              <div className={styles.flexCol}>
                <h3 className={styles.label}>File Format</h3>
                <div className={styles.flexRow}>
                  {['Excel', 'CSV', 'PDF'].map(fmt => (
                    <button key={fmt} onClick={() => setExportFormat(fmt)} className={`${styles.btn} ${exportFormat === fmt ? styles.btnPrimary : ''}`} style={{ flex: 1 }}>{fmt}</button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className={styles.flexRowEnd} style={{ marginTop: '5px' }}>
              <button onClick={() => setActiveBulkModal(null)} className={styles.btn}>Cancel</button>
              <button onClick={handleBulkExport} disabled={isProcessing} className={`${styles.btn} ${styles.btnPrimary}`}>
                {isProcessing ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD HOURS MODAL */}
      {activeBulkModal === 'addHours' && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.flexRow}>
              <Clock size={18} className={styles.sectionTitle} />
              <h2 className={styles.sectionTitle}>Add Hours - Selected Interns</h2>
            </div>

            <div className={styles.nestedCard}>
              <h3 className={styles.label}>Selected Interns</h3>
              <div className={styles.flexRow} style={{ flexWrap: 'wrap' }}>
                {selectedInterns.map((intern, idx) => (
                  <div key={idx} className={styles.chip}>
                    <Search size={12} /> {intern.first_name} {intern.last_name}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.flexCol}>
              <h3 className={styles.label}>Event Type</h3>
              <div className={styles.flexRow} style={{ flexWrap: 'wrap' }}>
                {['Regular Day', 'Event/ Activity', 'Makeup Hours'].map(type => (
                  <button key={type} onClick={() => setEventType(type)} className={`${styles.btn} ${eventType === type ? styles.btnPrimary : ''}`}>{type}</button>
                ))}
              </div>
            </div>

            <div className={styles.flexCol}>
              <h3 className={styles.label}>Input Method</h3>
              <div className={styles.flexRow}>
                <button 
                  onClick={() => setHoursInputType('time')} 
                  className={`${styles.btn} ${hoursInputType === 'time' ? styles.btnPrimary : ''}`}
                >
                  Exact Time
                </button>
                <button 
                  onClick={() => setHoursInputType('full_day')} 
                  className={`${styles.btn} ${hoursInputType === 'full_day' ? styles.btnPrimary : ''}`}
                >
                  Full Day (8 hrs)
                </button>
              </div>
            </div>

            <div className={styles.flexCol}>
              <label className={styles.label}>Assign To Date</label>
              <input type="date" value={addHoursForm.date} onChange={e => setAddHoursForm({...addHoursForm, date: e.target.value})} className={styles.input} />
            </div>

            {hoursInputType === 'time' && (
              <div className={styles.grid2}>
                <div className={styles.flexCol}>
                  <label className={styles.label}>Time In</label>
                  <input type="time" value={addHoursForm.timeIn} onChange={e => setAddHoursForm({...addHoursForm, timeIn: e.target.value})} className={styles.input} />
                </div>
                <div className={styles.flexCol}>
                  <label className={styles.label}>Time Out</label>
                  <input type="time" value={addHoursForm.timeOut} onChange={e => setAddHoursForm({...addHoursForm, timeOut: e.target.value})} className={styles.input} />
                </div>
              </div>
            )}

            <div className={styles.flexCol}>
              <label className={styles.label}>Event / Reason</label>
              <input type="text" placeholder="Input Reason" value={addHoursForm.reason} onChange={e => setAddHoursForm({...addHoursForm, reason: e.target.value})} className={styles.input} />
            </div>

            <div className={styles.flexCol}>
              <label className={styles.label}>Admin Notes</label>
              <textarea rows="3" placeholder="Add Notes" value={addHoursForm.notes} onChange={e => setAddHoursForm({...addHoursForm, notes: e.target.value})} className={styles.textarea}></textarea>
            </div>

            <div className={styles.flexRowEnd} style={{ marginTop: '5px' }}>
              <button onClick={() => setActiveBulkModal(null)} className={styles.btn}>Cancel</button>
              <button onClick={handleBulkAddHours} disabled={isProcessing} className={`${styles.btn} ${styles.btnPrimary}`}>
                {isProcessing ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}