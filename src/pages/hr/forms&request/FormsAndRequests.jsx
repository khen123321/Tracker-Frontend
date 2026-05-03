import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import styles from './FormsAndRequests.module.css';
import { Download, Eye, Check, X, MessageSquare, FileText } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// ✨ IMPORT YOUR UNIFIED PAGE HEADER ✨
import PageHeader from '../../../components/PageHeader';

// ─── SKELETON PRIMITIVES ───
function Sk({ w = '100%', h = '16px', r = '8px', mb = '0' }) {
  return <div className={styles.skel} style={{ width: w, height: h, borderRadius: r, marginBottom: mb, flexShrink: 0 }} />;
}

function FormsSkeleton() {
  return (
    <div className={styles.pageWrapper}>
      {/* Skeleton Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', background: '#fff', borderRadius: '10px', border: '1px solid #e8eaf0', marginBottom: '24px' }}>
        <Sk w="240px" h="26px" r="6px" />
        <div style={{ display: 'flex', gap: '12px' }}>
          <Sk w="36px" h="36px" r="8px" />
          <Sk w="210px" h="36px" r="999px" />
        </div>
      </div>

      {/* Skeleton Stats */}
      <div className={styles.statsContainer} style={{ marginBottom: '20px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className={styles.statCard}>
            <Sk w="40px" h="32px" mb="8px" />
            <Sk w="80px" h="14px" />
          </div>
        ))}
      </div>

      {/* Skeleton Main Card */}
      <div className={styles.mainCard}>
        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
          <Sk w="120px" h="20px" />
          <Sk w="120px" h="20px" />
          <Sk w="120px" h="20px" />
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          {[1, 2, 3, 4].map(i => <Sk key={i} w="80px" h="34px" r="6px" />)}
        </div>
        <Sk w="100%" h="300px" r="8px" />
      </div>
    </div>
  );
}

const FormsAndRequests = () => {
  const [activeTab, setActiveTab] = useState('appeals'); // 'appeals', 'leaves', 'overtime'
  
  const [appeals, setAppeals] = useState([]);
  const [generalRequests, setGeneralRequests] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true); // Tracks first load for skeleton

  const [selectedItem, setSelectedItem] = useState(null); 
  const [showModal, setShowModal] = useState(false);
  const [hrRemarks, setHrRemarks] = useState(''); 
  const [processingId, setProcessingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); 

  useEffect(() => {
    if (activeTab === 'appeals') {
      fetchAppeals();
    } else {
      fetchGeneralRequests();
    }
  }, [activeTab]);

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const response = await api.get('/hr/appeals');
      const fetchedData = response.data.data?.data || response.data.data || [];
      setAppeals(fetchedData);
    } catch (err) {
      console.error('Error fetching appeals:', err);
      toast.error('Failed to load appeals');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchGeneralRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/hr/requests');
      setGeneralRequests(response.data.data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // ─── UNIFIED FILTERING ───
  const currentDataList = activeTab === 'appeals'
    ? appeals.filter(a => filterStatus === 'all' || a.appeal_status?.toLowerCase() === filterStatus)
    : generalRequests.filter(req => {
        const reqStatus = req.status?.toLowerCase() || 'pending';
        const matchesStatus = filterStatus === 'all' || reqStatus === filterStatus;
        if (!matchesStatus) return false;

        if (activeTab === 'leaves') return req.type === 'absent' || req.type === 'half-day';
        if (activeTab === 'overtime') return req.type === 'overtime' || req.type === 'correction';
        return false;
      });

  // Calculate stats based on current tab
  const getStatusCount = (status) => {
    const rawData = activeTab === 'appeals' ? appeals : generalRequests.filter(req => {
        if (activeTab === 'leaves') return req.type === 'absent' || req.type === 'half-day';
        if (activeTab === 'overtime') return req.type === 'overtime' || req.type === 'correction';
        return false;
    });

    if (activeTab === 'appeals') {
        return rawData.filter(item => item.appeal_status?.toLowerCase() === status).length;
    }
    return rawData.filter(item => item.status?.toLowerCase() === status).length;
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowModal(true);
    setHrRemarks('');
  };

  // ─── UNIFIED PROCESSING ───
  const handleProcessRequest = async (action) => {
    if (!selectedItem) return;
    if (action === 'rejected' && !hrRemarks.trim()) {
      toast.error('Please provide a rejection reason/remark');
      return;
    }

    try {
      setProcessingId(selectedItem.id);
      const isAppeal = activeTab === 'appeals';

      if (isAppeal) {
        const endpoint = action === 'approved' 
            ? `/hr/appeals/${selectedItem.id}/approve` 
            : `/hr/appeals/${selectedItem.id}/reject`;
        await api.post(endpoint, { rejection_reason: hrRemarks });
      } else {
        await api.post(`/hr/requests/${selectedItem.id}/process`, { 
            status: action, 
            remarks: hrRemarks 
        });
      }

      toast.success(action === 'approved' ? 'Approved successfully' : 'Rejected successfully');
      setShowModal(false);
      isAppeal ? fetchAppeals() : fetchGeneralRequests();
    } catch (err) {
      console.error('Error processing:', err);
      toast.error('Failed to process request');
    } finally {
      setProcessingId(null);
    }
  };

  // ─── SECURE DOWNLOAD ───
  const handleDownload = async (id, isAppeal) => {
    const loadingToast = toast.loading("Downloading evidence...");
    try {
        const endpoint = isAppeal ? `/appeals/${id}/download` : `/hr/requests/${id}/download`;
        const response = await api.get(endpoint, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Attachment_${id}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success("Download complete", { id: loadingToast });
    } catch {
        toast.error("File download failed. File might be missing.", { id: loadingToast });
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return styles.statusPending;
      case 'approved': return styles.statusApproved;
      case 'rejected': return styles.statusRejected;
      default: return styles.statusDefault;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (initialLoad) return <FormsSkeleton />;

  return (
    <div className={styles.pageWrapper}>
      <Toaster position="top-right" />

      {/* ✨ REPLACED HEADER WITH YOUR NEW PAGEHEADER COMPONENT ✨ */}
      <PageHeader title="Forms & Requests" />

      {/* ✨ MOVED STATS INTO A SEPARATE ROW TO MATCH DASHBOARD STYLE ✨ */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <span className={`${styles.statNumber} ${styles.textPending}`}>{getStatusCount('pending')}</span>
          <span className={styles.statLabel}>Pending Review</span>
        </div>
        <div className={styles.statCard}>
          <span className={`${styles.statNumber} ${styles.textApproved}`}>{getStatusCount('approved')}</span>
          <span className={styles.statLabel}>Approved</span>
        </div>
        <div className={styles.statCard}>
          <span className={`${styles.statNumber} ${styles.textRejected}`}>{getStatusCount('rejected')}</span>
          <span className={styles.statLabel}>Rejected</span>
        </div>
      </div>

      {/* ✨ WRAPPED TABS & TABLE IN A MAIN UNIFIED CARD ✨ */}
      <div className={styles.mainCard}>
        
        {/* ─── TABS ─── */}
        <div className={styles.tabsContainer}>
            <button 
                onClick={() => { setActiveTab('appeals'); setFilterStatus('all'); }}
                className={`${styles.tabBtn} ${activeTab === 'appeals' ? styles.tabBtnActive : ''}`}
            >
                Attendance Appeals
            </button>
            <button 
                onClick={() => { setActiveTab('leaves'); setFilterStatus('all'); }}
                className={`${styles.tabBtn} ${activeTab === 'leaves' ? styles.tabBtnActive : ''}`}
            >
                Leave & Absent Forms
            </button>
            <button 
                onClick={() => { setActiveTab('overtime'); setFilterStatus('all'); }}
                className={`${styles.tabBtn} ${activeTab === 'overtime' ? styles.tabBtnActive : ''}`}
            >
                Overtime & Corrections
            </button>
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.filterButtons}>
            {['all', 'pending', 'approved', 'rejected'].map(status => (
              <button
                key={status}
                className={`${styles.filterBtn} ${filterStatus === status ? styles.filterBtnActive : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Syncing records...</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            {currentDataList.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconWrapper}>
                  <FileText size={40} />
                </div>
                <h3>No records found</h3>
                <p>There are currently no {filterStatus !== 'all' ? filterStatus : ''} records to review in this category.</p>
              </div>
            ) : (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    {/* ✨ CHANGED TO INTERN ✨ */}
                    <th>Intern</th>
                    <th>{activeTab === 'appeals' ? 'Disputed Date' : 'Target Date'}</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDataList.map(item => {
                    const itemStatus = item.appeal_status || item.status;
                    const itemDate = item.date || item.target_date;
                    
                    return (
                      <tr key={item.id}>
                        <td className={styles.employeeCell}>
                          <div>
                            <p className={styles.employeeName}>
                              {item.intern?.user?.first_name} {item.intern?.user?.last_name}
                            </p>
                            {/* ✨ REMOVED THE ID PARAGRAPH HERE ✨ */}
                          </div>
                        </td>
                        <td>{formatDate(itemDate)}</td>
                        <td>
                          <span className={styles.typeBadge}>
                              {activeTab === 'appeals' ? 'Photo Appeal' : item.type}
                          </span>
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(itemStatus)}>
                            <span className={styles.statusDot}></span>
                            {itemStatus?.charAt(0).toUpperCase() + itemStatus?.slice(1)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className={styles.viewBtn}
                            onClick={() => handleViewDetails(item)}
                            disabled={processingId === item.id}
                          >
                            <Eye size={16} /> View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ─── MODAL ─── */}
      {showModal && selectedItem && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalDialog} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Review {activeTab === 'appeals' ? 'Appeal' : selectedItem.type.toUpperCase() + ' Request'}</h2>
              <button className={styles.closeIconBtn} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.infoSection}>
                {/* ✨ CHANGED TO INTERN INFORMATION ✨ */}
                <h3>Intern Information</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Name</span>
                    <p>{selectedItem.intern?.user?.first_name} {selectedItem.intern?.user?.last_name}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Intern ID</span>
                    <p>{selectedItem.intern?.id}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{activeTab === 'appeals' ? 'Attendance Date' : 'Target Date'}</span>
                    <p>{formatDate(selectedItem.date || selectedItem.target_date)}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Submitted</span>
                    <p>{formatDate(selectedItem.appeal_submitted_at || selectedItem.created_at)}</p>
                  </div>
                </div>
              </div>

              <div className={styles.infoSection}>
                <h3>{activeTab === 'appeals' ? 'Appeal Details' : 'Reason'}</h3>
                <div className={styles.appealText}>
                  <p>{selectedItem.appeal_text || selectedItem.reason}</p>
                  {selectedItem.additional_details && (
                      <p style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b' }}>
                          <strong>Details:</strong> {selectedItem.additional_details}
                      </p>
                  )}
                </div>
              </div>

              {(selectedItem.appeal_file_path || selectedItem.attachment_path) && (
                <div className={styles.infoSection}>
                  <h3>Attached Document</h3>
                  <button
                    onClick={() => handleDownload(selectedItem.id, activeTab === 'appeals')}
                    className={styles.downloadLink}
                  >
                    <Download size={16} /> Download Attachment
                  </button>
                </div>
              )}

              {((selectedItem.appeal_status || selectedItem.status)?.toLowerCase() === 'rejected') && (selectedItem.appeal_rejection_reason || selectedItem.hr_remarks) && (
                <div className={styles.rejectionSection}>
                  <h3>Rejection Reason / HR Remarks</h3>
                  <p>{selectedItem.appeal_rejection_reason || selectedItem.hr_remarks}</p>
                </div>
              )}

              {((selectedItem.appeal_status || selectedItem.status)?.toLowerCase() === 'pending') && (
                <div className={styles.infoSection}>
                  <h3 style={{ borderBottom: 'none' }}>HR Remarks (Sent to Intern)</h3>
                  <textarea
                    className={styles.reasonInput}
                    placeholder="Enter approval/rejection notes here..."
                    value={hrRemarks}
                    onChange={e => setHrRemarks(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setShowModal(false)}>Cancel</button>
              
              {((selectedItem.appeal_status || selectedItem.status)?.toLowerCase() === 'pending') ? (
                <>
                  <button
                    className={styles.btnReject}
                    onClick={() => handleProcessRequest('rejected')}
                    disabled={processingId === selectedItem.id}
                  >
                    <X size={16} /> Reject
                  </button>
                  <button
                    className={styles.btnApprove}
                    onClick={() => handleProcessRequest('approved')}
                    disabled={processingId === selectedItem.id}
                  >
                    <Check size={16} /> Approve
                  </button>
                </>
              ) : (
                <p className={styles.alreadyProcessed}>
                  This request has already been {(selectedItem.appeal_status || selectedItem.status)?.toLowerCase()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormsAndRequests;