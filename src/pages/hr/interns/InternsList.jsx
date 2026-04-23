import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar, Search, SlidersHorizontal, MoreHorizontal, 
  UserMinus, Download, Clock, AlertCircle, X, FileText, Activity, File, CheckCircle2, Award 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import api from '../../../api/axios';
import styles from './InternsList.module.css';
import InternDetailsModal from '../internsdetail/InternDetailsModal';

// ✨ IMPORT YOUR UNIFIED NOTIFICATION BELL ✨
// ✅ CORRECT IMPORT (3 dots-and-slashes)
import NotificationBell from '../../../components/NotificationBell';
// ✨ PDF SNAPSHOT TOOLS ✨
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import CertificateTemplate from './CertificateTemplate';

// ─── SKELETON PRIMITIVE ───
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
  
  const [selectedInternModal, setSelectedInternModal] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // ✨ CERTIFICATE STATE & REF ✨
  const certificateRef = useRef(null);
  const [certData, setCertData] = useState({ 
    name: '', course: '', school: '', hours: 0, department: '', dateStarted: '', dateCompleted: '' 
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const [selectedInterns, setSelectedInterns] = useState([]); 
  const [activeBulkModal, setActiveBulkModal] = useState(null); 
  const [isProcessing, setIsProcessing] = useState(false); 

  const [confirmRemoveText, setConfirmRemoveText] = useState("");
  const [exportType, setExportType] = useState('info');
  const [exportFormat, setExportFormat] = useState('Excel');
  const [eventType, setEventType] = useState('Regular Day');
  
  const [addHoursForm, setAddHoursForm] = useState({
    date: '', timeIn: '', timeOut: '', reason: '', notes: ''
  });

  // ✨ SEARCH & 4 DROPDOWN FILTERS STATES ✨
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [schoolFilter, setSchoolFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [presentFilter, setPresentFilter] = useState('All');

  const fetchInterns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hr/interns');
      setInterns(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching interns:", err);
      setError("Failed to load interns list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInterns(); }, []);

  // ✨ DYNAMIC FILTER OPTIONS ✨
  const uniqueDepartments = useMemo(() => ['All', ...new Set(interns.map(i => i.intern?.department?.name || i.department?.name || i.assigned_department || 'Not Assigned'))], [interns]);
  const uniqueSchools = useMemo(() => ['All', ...new Set(interns.map(i => i.intern?.school?.name || i.school?.name || i.school || 'Not Assigned'))], [interns]);
  const uniqueStatuses = useMemo(() => ['All', ...new Set(interns.map(i => i.status || 'Unknown'))], [interns]);

  // ✨ COMBINED SEARCH & 4 FILTERS LOGIC ✨
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
    setConfirmRemoveText("");
    setAddHoursForm({ date: '', timeIn: '', timeOut: '', reason: '', notes: '' });
  };

  const isAllSelected = processedInterns.length > 0 && selectedInterns.length === processedInterns.length;
  const isSelected = (id) => selectedInterns.some(intern => intern.id === id);

  const handleBulkRemove = async () => {
    try {
      setIsProcessing(true);
      const internIds = selectedInterns.map(i => i.id);
      await api.post('/hr/interns/bulk-remove', { ids: internIds });
      fetchInterns(); 
      clearSelection(); 
      showNotification(`${internIds.length} interns successfully removed.`); 
    } catch  {
      showNotification("Error removing interns.", "error"); 
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
    if (!addHoursForm.date || !addHoursForm.timeIn || !addHoursForm.timeOut) {
      showNotification("Please fill in Date, Time In, and Time Out.", "error");
      return;
    }

    try {
      setIsProcessing(true);
      const payload = {
        intern_ids: selectedInterns.map(i => i.id),
        event_type: eventType,
        date: addHoursForm.date,
        time_in: addHoursForm.timeIn,
        time_out: addHoursForm.timeOut,
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

  const handleGenerateCertificate = async (user) => {
    try {
      showNotification('Generating high-quality certificate...', 'success');
      
      setCertData({
        name: `${user.last_name}, ${user.first_name}`.toUpperCase(),
        course: user.intern?.course || user.course || 'Bachelor of Science in Business Administration Major in Financial Management',
        school: user.intern?.school?.name || user.school?.name || user.school || 'PHINMA Cagayan de Oro College',
        hours: Math.floor(user.attendance_logs_sum_hours_rendered || 0),
        department: user.intern?.department?.name || user.assigned_department || 'business administration',
        gender: user.gender || 'female', 
        dateStarted: new Date(user.intern?.date_started || user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        dateCompleted: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      });

      setTimeout(async () => {
        const element = certificateRef.current;
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: null }); 
        const dataImage = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape', 'px', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(dataImage, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${user.last_name}_Certificate.pdf`);
        showNotification('Certificate downloaded successfully!', 'success');
      }, 500);

    } catch (error) {
      console.error("Error generating certificate:", error);
      showNotification("Failed to generate certificate.", "error");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.header}>
          <Sk w={160} h={26} />
          <div className={styles.flexRow}>
            <Sk w={36} h={36} r={8} />
            <Sk w={180} h={36} r={8} />
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
      
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Interns Overview</h1>
        
        {/* ✨ REPLACED DUMMY BUTTON WITH REAL NOTIFICATION COMPONENT ✨ */}
        <div className={styles.flexRow}>
          <NotificationBell role="hr" />
          <div className={styles.dateBadge}>
            <Calendar size={15} />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.sectionHeader} style={{ alignItems: 'flex-end' }}>
          <div className={styles.flexCol}>
            <h3 className={styles.sectionTitle}>Active Interns</h3>
            <p className={styles.subText}>Click and drag the chart left or right to view historical data.</p>
          </div>
          <div className={styles.flexColEnd} style={{ textAlign: 'right' }}>
            <p className={styles.statValue}>{interns.length}</p>
            <p className={styles.label} style={{ color: '#16a34a' }}>Total Active</p>
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
                  <stop offset="5%" stopColor="#0B1EAE" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#0B1EAE" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e8eaf0', boxShadow: 'none' }}
                labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                itemStyle={{ color: '#0B1EAE', fontWeight: 'bold' }}
                formatter={(value) => [`${value} Interns`, 'Active']}
              />
              <Area type="monotone" dataKey="interns" stroke="#0B1EAE" strokeWidth={2} fillOpacity={1} fill="url(#colorInterns)" isAnimationActive={!isDragging} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ✨ 4 DROPDOWN FILTERS ✨ */}
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
        <select className={styles.select} value={presentFilter} onChange={e => setPresentFilter(e.target.value)}>
          <option value="All">All Attendance</option>
          <option value="Present">Present Today</option>
          <option value="Absent">Absent Today</option>
        </select>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.card} style={{ padding: '16px 18px' }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>List Of Interns</h2>
          
          {/* ✨ SEARCH BAR ✨ */}
          <div className={styles.flexRow}>
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
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              {/* ✨ NO MORE CLICKABLE ARROWS HERE ✨ */}
              <tr>
                <th className={styles.checkboxCell}>
                  <input type="checkbox" className={styles.checkbox} checked={isAllSelected} onChange={toggleAllSelection}/>
                </th>
                <th>Interns</th>
                <th>Department</th>
                <th>School</th>
                <th>Date Started</th>
                <th>Status</th>
                <th>Certificate</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {processedInterns.length === 0 ? (
                <tr><td colSpan="8" className={styles.emptyRow}>No interns found matching filters.</td></tr>
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
                        <div className={styles.internProfile}>
                          <div className={styles.avatar}>
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.first_name + user.id}`} alt="avatar" style={{ width: '100%', height: '100%' }} />
                          </div>
                          <div className={styles.flexCol} style={{ gap: '2px' }}>
                            <p className={styles.internName}>{user.first_name} {user.last_name}</p>
                            <p className={styles.internEmail}>{user.email}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td>{departmentName}</td>
                      <td>{schoolName}</td>
                      <td>{formatDate(user.intern?.date_started || user.date_started || user.created_at)}</td>
                      
                      <td>
                        <span className={user.status?.toLowerCase() === 'active' ? styles.statusActive : styles.statusInactive}>
                          {user.status || 'Unknown'}
                        </span>
                      </td>

                      <td>
                        <button 
                          onClick={() => handleGenerateCertificate(user)}
                          className={styles.btnPrimary}
                          style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: '#0B1EAE', color: 'white' }}
                          title={`Generate Certificate for ${user.first_name}`}
                        >
                          <Award size={14} /> Get Certificate
                        </button>
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

      {selectedInternModal && <InternDetailsModal intern={selectedInternModal} onClose={() => setSelectedInternModal(null)} />}

      {selectedInterns.length > 0 && (
        <div className={styles.floatingBar}>
          <div className={styles.flexRow}>
            <span className={styles.badgeCircle}>{selectedInterns.length}</span>
            <span className={styles.sectionTitle} style={{ fontSize: '13px' }}>Selected</span>
          </div>
          <div className={styles.dividerY}></div>
          <div className={styles.flexRow}>
            <button onClick={() => setActiveBulkModal('remove')} className={`${styles.btn} ${styles.btnDanger}`}>
              <UserMinus size={14} /> Remove
            </button>
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

      {/* ─── MODALS ─── */}
      {activeBulkModal === 'remove' && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.flexRow}>
              <UserMinus size={18} className={styles.sectionTitle} />
              <h2 className={styles.sectionTitle}>Remove - Selected Interns</h2>
            </div>
            
            <div className={styles.nestedCard} style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
              <div className={styles.flexRow} style={{ color: '#dc2626' }}>
                <AlertCircle size={14} />
                <span style={{ fontSize: '13px', fontWeight: '700' }}>This action cannot be undone</span>
              </div>
              <p className={styles.subText} style={{ paddingLeft: '19px' }}>Removing these interns will permanently delete their profiles, attendance records, time logs, and all associated data from the system.</p>
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
              <label className={styles.label}>Type <span style={{ color: '#dc2626' }}>REMOVE</span> to confirm</label>
              <input 
                type="text" 
                placeholder="Type REMOVE here ...." 
                value={confirmRemoveText}
                onChange={(e) => setConfirmRemoveText(e.target.value)}
                className={styles.input}
              />
            </div>
            
            <div className={styles.flexRowEnd} style={{ marginTop: '5px' }}>
              <button onClick={() => setActiveBulkModal(null)} className={styles.btn}>Cancel</button>
              <button 
                onClick={handleBulkRemove}
                disabled={confirmRemoveText !== 'REMOVE' || isProcessing}
                className={`${styles.btn} ${styles.btnDangerFill}`}
              >
                {isProcessing ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <label className={styles.label}>Assign To date</label>
              <input type="date" value={addHoursForm.date} onChange={e => setAddHoursForm({...addHoursForm, date: e.target.value})} className={styles.input} />
            </div>

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

      {/* ✨ HIDDEN TEMPLATE COMPONENT ✨ */}
      <CertificateTemplate intern={certData} forwardRef={certificateRef} />
      
    </div>
  );
}