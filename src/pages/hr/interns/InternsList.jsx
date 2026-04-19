import React, { useState, useEffect } from 'react';
import { 
  Bell, Calendar, Search, SlidersHorizontal, MoreHorizontal, 
  UserMinus, Download, Clock, AlertCircle, X, FileText, Activity, File, CheckCircle2 
} from 'lucide-react';
import api from '../../../api/axios';
import styles from './InternsList.module.css';
import InternDetailsModal from '../internsdetail/InternDetailsModal';

export default function InternsList() {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for individual intern view
  const [selectedInternModal, setSelectedInternModal] = useState(null);

  // ─── NOTIFICATION STATE (THE NEW FEATURE) ───
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Helper function to trigger notifications
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // ─── BULK ACTION STATES ───
  const [selectedInterns, setSelectedInterns] = useState([]); 
  const [activeBulkModal, setActiveBulkModal] = useState(null); 
  const [isProcessing, setIsProcessing] = useState(false); 

  // Modal Specific States
  const [confirmRemoveText, setConfirmRemoveText] = useState("");
  const [exportType, setExportType] = useState('info');
  const [exportFormat, setExportFormat] = useState('Excel');
  const [eventType, setEventType] = useState('Regular Day');
  
  const [addHoursForm, setAddHoursForm] = useState({
    date: '', timeIn: '', timeOut: '', reason: '', notes: ''
  });

  // ─── API FETCH ───
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

  // ─── CHECKBOX LOGIC ───
  const toggleInternSelection = (intern) => {
    setSelectedInterns(prev => 
      prev.some(i => i.id === intern.id) 
      ? prev.filter(i => i.id !== intern.id)
      : [...prev, intern]
    );
  };

  const toggleAllSelection = () => {
    if (selectedInterns.length === interns.length) {
      setSelectedInterns([]); 
    } else {
      setSelectedInterns([...interns]); 
    }
  };

  const clearSelection = () => {
    setSelectedInterns([]);
    setActiveBulkModal(null);
    setConfirmRemoveText("");
    setAddHoursForm({ date: '', timeIn: '', timeOut: '', reason: '', notes: '' });
  };

  const isAllSelected = interns.length > 0 && selectedInterns.length === interns.length;
  const isSelected = (id) => selectedInterns.some(intern => intern.id === id);

  // ─── BULK ACTION API CALLS ───

  const handleBulkRemove = async () => {
    try {
      setIsProcessing(true);
      const internIds = selectedInterns.map(i => i.id);
      
      await api.post('/hr/interns/bulk-remove', { ids: internIds });
      
      fetchInterns(); 
      clearSelection(); 
      showNotification(`${internIds.length} interns successfully removed.`); // 👈 TRIGGER NOTIFICATION
    } catch (err) {
      console.error("Failed to remove interns:", err);
      showNotification("Error removing interns. Please check the console.", "error"); // 👈 TRIGGER ERROR
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
      showNotification("Export downloaded successfully!"); // 👈 TRIGGER NOTIFICATION
    } catch (err) {
      console.error("Failed to export:", err);
      showNotification("Export failed. Please try again.", "error"); // 👈 TRIGGER ERROR
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
      showNotification("Hours successfully assigned to selected interns!"); // 👈 TRIGGER NOTIFICATION
    } catch (err) {
      console.error("Failed to add hours:", err);
      // Try to extract exact error from Laravel, otherwise show generic
      const errorMsg = err.response?.data?.message || "Failed to add hours. Check console.";
      showNotification(errorMsg, "error"); // 👈 TRIGGER ERROR
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── DATA FORMATTING HELPERS ───
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const getDepartmentName = (id) => {
    if (!id) return 'N/A';
    const departments = { "1": "Insurtech - Business Analyst & System Development", "2": "CARES", "3": "EDP", "4": "CESLA", "5": "Finance", "6": "HR" };
    return departments[String(id)] || id; 
  };

  const getSchoolName = (id, fallbackName) => {
    if (!id && !fallbackName) return 'N/A';
    const schools = { "1": "USTP", "2": "Xavier University (XU)", "3": "Capitol University (CU)", "4": "Liceo de Cagayan" };
    return schools[String(id)] || fallbackName || id; 
  };

  const stats = [
    { label: 'Total Interns', value: interns.length },
    { label: 'Absent', value: 0 },
    { label: 'Avg. Hours Rendered', value: 0 },
    { label: 'Active', value: interns.filter(i => i.status?.toLowerCase() === 'active').length },
  ];

  if (loading) return <div className={styles.pageWrapper}>Loading interns...</div>;

  return (
    <div className={`relative min-h-screen pb-24 ${styles.pageWrapper}`}>

      {/* ─── TOAST NOTIFICATION UI ─── */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-slide-down border transition-all ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={20} className="text-green-600" /> : <AlertCircle size={20} className="text-red-600" />}
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification({ show: false, message: '', type: 'success' })} className="ml-2 opacity-50 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* ─── HEADER & STATS ─── */}
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Interns</h1>
        <div className={styles.headerActions}>
          <button className={styles.iconButton} onClick={fetchInterns}><Bell size={16} /></button>
          <div className={styles.dateBadge}>
            <Calendar size={15} />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat, idx) => (
          <div key={idx} className={styles.statCard}>
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className={styles.filterGrid}>
        {['All Department', 'All School', 'All Status', 'Present'].map((filter, idx) => (
          <div key={idx} className={styles.selectWrapper}>
            <select className={styles.filterSelect} defaultValue={filter}><option>{filter}</option></select>
          </div>
        ))}
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* ─── MAIN TABLE ─── */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>List Of Interns</h2>
          <div className={styles.tableControls}>
            <button className={styles.sortButton}>Sort <SlidersHorizontal size={14} /></button>
            <button className={styles.iconButton}><Search size={16} /></button>
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
                <th>Date Started</th>
                <th>Status</th>
                <th className={styles.actionCell}></th>
              </tr>
            </thead>
            <tbody>
              {interns.length === 0 ? (
                <tr><td colSpan="7" className={styles.emptyRow}>No interns found.</td></tr>
              ) : (
                interns.map((user) => {
                  return (
                    <tr key={user.id} className={isSelected(user.id) ? "bg-blue-50/50" : ""}>
                      <td className={styles.checkboxCell}>
                        <input type="checkbox" className={styles.checkbox} checked={isSelected(user.id)} onChange={() => toggleInternSelection(user)}/>
                      </td>
                      <td>
                        <div className={styles.internProfile}>
                          <div className={styles.avatar}>
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.first_name + user.id}`} alt="avatar" />
                          </div>
                          <div>
                            <p className={styles.internName}>{user.first_name} {user.last_name}</p>
                            <p className={styles.internEmail}>{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className={styles.cellText}>{getDepartmentName(user.intern?.department_id)}</td>
                      <td className={styles.cellText}>{getSchoolName(user.intern?.school_id, user.intern?.school)}</td>
                      <td className={styles.cellText}>{formatDate(user.intern?.date_started || user.created_at)}</td>
                      <td>
                        <span className={user.status?.toLowerCase() === 'active' ? styles.statusActive : styles.statusInactive}>
                          {user.status || 'Unknown'}
                        </span>
                      </td>
                      <td className={styles.actionCell}>
                        <button 
                          className={styles.actionButton} 
                          onClick={() => {
                            setSelectedInternModal({
                              id: user.id, 
                              name: `${user.first_name} ${user.last_name}`,
                              email: user.email,
                              department: getDepartmentName(user.intern?.department_id),
                              school: getSchoolName(user.intern?.school_id, user.intern?.school),
                              course: user.intern?.course || 'N/A',
                              emergency_name: user.intern?.emergency_name || 'NOT PROVIDED',
                              emergency_number: user.intern?.emergency_number || 'NOT PROVIDED',
                              emergency_address: user.intern?.emergency_address || 'NOT PROVIDED',
                            });
                          }}
                        >
                          <MoreHorizontal size={18} />
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

      {/* Single Intern Details Modal */}
      {selectedInternModal && <InternDetailsModal intern={selectedInternModal} onClose={() => setSelectedInternModal(null)} />}

      {/* ─── FLOATING BULK ACTION BAR ─── */}
      {selectedInterns.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 px-6 py-3 flex items-center gap-6 animate-slide-up z-40">
          <div className="flex items-center gap-2">
            <span className="bg-[#0B1EAE] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{selectedInterns.length}</span>
            <span className="font-semibold text-slate-700 text-sm">Selected</span>
          </div>
          <div className="w-px h-6 bg-slate-300"></div>
          <div className="flex gap-2">
            <button onClick={() => setActiveBulkModal('remove')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <UserMinus size={16} /> Remove
            </button>
            <button onClick={() => setActiveBulkModal('export')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <Download size={16} /> Export
            </button>
            <button onClick={() => setActiveBulkModal('addHours')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#0B1EAE] hover:bg-blue-50 rounded-lg transition-colors">
              <Clock size={16} /> Add Hours
            </button>
          </div>
          <button onClick={clearSelection} className="ml-4 text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
      )}

      {/* ─── 1. REMOVE INTERNS MODAL ─── */}
      {activeBulkModal === 'remove' && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6 text-slate-800">
                <UserMinus size={24} />
                <h2 className="text-xl font-semibold">Remove - Selected Interns</h2>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-red-600 font-medium mb-1">
                  <AlertCircle size={18} /><span>This action cannot be undone</span>
                </div>
                <p className="text-sm text-slate-500 pl-6">Removing these interns will permanently delete their profiles, attendance records, time logs, and all associated data from the system.</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-slate-700">Selected Interns</h3>
                  <span className="bg-white border border-red-200 text-red-600 rounded-full px-2 py-0.5 text-sm font-medium">{selectedInterns.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedInterns.map((intern, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm text-slate-600 shadow-sm">
                      <Search size={14} className="text-slate-400" />{intern.first_name} {intern.last_name}
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl p-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Type <span className="text-red-600">REMOVE</span> to confirm</label>
                <input 
                  type="text" 
                  placeholder="Type REMOVE here ...." 
                  value={confirmRemoveText}
                  onChange={(e) => setConfirmRemoveText(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:border-red-500"
                />
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
              <button onClick={() => setActiveBulkModal(null)} className="px-5 py-2 text-sm font-medium text-white bg-slate-400 rounded-lg">Cancel</button>
              <button 
                onClick={handleBulkRemove}
                disabled={confirmRemoveText !== 'REMOVE' || isProcessing}
                className="px-5 py-2 text-sm font-medium text-white bg-[#991B1B] hover:bg-red-900 rounded-lg disabled:opacity-50"
              >
                {isProcessing ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. EXPORT MODAL ─── */}
      {activeBulkModal === 'export' && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6 text-slate-800"><Clock size={24} /><h2 className="text-xl font-semibold">Export - Selected Interns</h2></div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <h3 className="font-medium text-slate-700 mb-3 text-sm">Selected Interns</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedInterns.map((intern, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm text-slate-600 shadow-sm">
                      <Search size={14} className="text-slate-400" />{intern.first_name} {intern.last_name}
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="font-medium text-slate-700 mb-3 text-sm">What to Export?</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { id: 'info', icon: <Search size={24}/>, title: 'Intern Info', desc: 'Name, School, Department, Contacts...' },
                  { id: 'log', icon: <Clock size={24}/>, title: 'Attendance Log', desc: 'Full time -in/out history' },
                  { id: 'progress', icon: <Activity size={24}/>, title: 'Hours Progress', desc: 'Rendered vs. Required hrs' },
                  { id: 'full', icon: <File size={24}/>, title: 'Full Report', desc: 'All data combined' }
                ].map((opt) => (
                  <div key={opt.id} onClick={() => setExportType(opt.id)} className={`border rounded-xl p-4 cursor-pointer flex items-start gap-4 ${exportType === opt.id ? 'border-[#0B1EAE] ring-1 ring-[#0B1EAE] bg-blue-50/30' : 'border-slate-200'}`}>
                    <div className="mt-1 text-slate-700">{opt.icon}</div>
                    <div><h4 className="font-semibold text-slate-800">{opt.title}</h4><p className="text-xs text-slate-500 mt-1">{opt.desc}</p></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-slate-700 mb-3 text-sm">Data Range</h3>
                  <select className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none focus:border-[#0B1EAE] text-sm text-slate-700">
                    <option>This Month</option>
                    <option>Last Month</option>
                    <option>All Time</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-2">Rendered vs. Required hrs</p>
                </div>
                <div>
                  <h3 className="font-medium text-slate-700 mb-3 text-sm">File Format</h3>
                  <div className="flex gap-2">
                    {['Excel', 'CSV', 'PDF'].map(fmt => (
                      <button key={fmt} onClick={() => setExportFormat(fmt)} className={`px-4 py-2 text-sm rounded-lg border transition-all ${exportFormat === fmt ? 'border-[#0B1EAE] text-[#0B1EAE] font-medium' : 'border-slate-200'}`}>{fmt}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-center gap-3 border-t border-slate-100">
              <button onClick={handleBulkExport} disabled={isProcessing} className="px-8 py-2 text-sm font-medium text-white bg-[#0A114A] hover:bg-[#0B1EAE] rounded-lg disabled:opacity-50">
                {isProcessing ? 'Exporting...' : 'Export'}
              </button>
              <button onClick={() => setActiveBulkModal(null)} className="px-8 py-2 text-sm font-medium text-white bg-slate-400 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. ADD HOURS MODAL ─── */}
      {activeBulkModal === 'addHours' && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh] shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6 text-slate-800"><Clock size={24} /><h2 className="text-xl font-semibold">Add Hours - Selected Interns</h2></div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <h3 className="font-medium text-slate-700 mb-3 text-sm">Selected Interns</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedInterns.map((intern, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm text-slate-600 shadow-sm">
                      <Search size={14} className="text-slate-400" />{intern.first_name} {intern.last_name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium text-slate-700 mb-3 text-sm">Event Type</h3>
                <div className="flex flex-wrap gap-2">
                  {['Regular Day', 'Event/ Activity', 'Makeup Hours'].map(type => (
                    <button key={type} onClick={() => setEventType(type)} className={`px-4 py-1.5 text-sm rounded-lg border transition-all ${eventType === type ? 'border-slate-800 bg-slate-50 font-medium' : 'border-slate-200'}`}>{type}</button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Assign To date</label>
                <input type="date" value={addHoursForm.date} onChange={e => setAddHoursForm({...addHoursForm, date: e.target.value})} className="w-full bg-[#1e2b85] text-white rounded-lg px-4 py-2 outline-none [color-scheme:dark]" />
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Time In</label>
                  <input type="time" value={addHoursForm.timeIn} onChange={e => setAddHoursForm({...addHoursForm, timeIn: e.target.value})} className="w-full bg-[#1e2b85] text-white rounded-lg px-4 py-2 outline-none [color-scheme:dark]" />
                </div>
                <span className="text-slate-500 mt-4">To</span>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Time Out</label>
                  <input type="time" value={addHoursForm.timeOut} onChange={e => setAddHoursForm({...addHoursForm, timeOut: e.target.value})} className="w-full bg-[#1e2b85] text-white rounded-lg px-4 py-2 outline-none [color-scheme:dark]" />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Event/ Reason</label>
                <input type="text" placeholder="Input Reason" value={addHoursForm.reason} onChange={e => setAddHoursForm({...addHoursForm, reason: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#0B1EAE]" />
              </div>

              <div className="mb-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Admin Notes</label>
                <textarea rows="4" placeholder="Add Notes" value={addHoursForm.notes} onChange={e => setAddHoursForm({...addHoursForm, notes: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none resize-none"></textarea>
              </div>
            </div>
            <div className="bg-white px-6 py-4 flex justify-center gap-3 border-t border-slate-100 pb-8">
              <button onClick={handleBulkAddHours} disabled={isProcessing} className="px-8 py-2.5 text-sm font-medium text-white bg-[#0A114A] hover:bg-[#0B1EAE] rounded-lg disabled:opacity-50">
                {isProcessing ? 'Saving...' : 'Save & Add to All'}
              </button>
              <button onClick={() => setActiveBulkModal(null)} className="px-8 py-2.5 text-sm font-medium text-white bg-slate-400 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}