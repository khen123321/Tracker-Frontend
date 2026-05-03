import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Camera, MapPin, AlertTriangle, 
  XCircle, X, MessageSquare, ChevronDown, 
  Clock, Info, Search 
} from 'lucide-react';
import api from "../../../api/axios";
import styles from './CameraVerification.module.css';
import toast, { Toaster } from 'react-hot-toast';

// ✨ IMPORT YOUR UNIFIED PAGE HEADER ✨
import PageHeader from '../../../components/PageHeader';

// ─── SKELETON PRIMITIVES ───
const Sk = ({ w = '100%', h = '16px', r = '8px' }) => (
  <div className={styles.skel} style={{ width: w, height: h, borderRadius: r }} />
);

// ─── FULL PAGE SKELETON SCREEN ───
function CameraVerificationSkeleton() {
  return (
    <div className={styles.pageWrapper}>
      
      {/* ✨ UPDATED SKELETON HEADER TO MATCH PAGEHEADER ✨ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', background: '#fff', borderRadius: '10px', border: '1px solid #e8eaf0' }}>
        <Sk w="240px" h="26px" r="6px" />
        <div style={{ display: 'flex', gap: '12px' }}>
          <Sk w="36px" h="36px" r="8px" />
          <Sk w="210px" h="36px" r="999px" />
        </div>
      </div>

      {/* Unified Controls Box Skeleton */}
      <div style={{
        background: '#ffffff', borderRadius: '10px', border: '1px solid #e8eaf0',
        padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <Sk w="350px" h="16px" />
          <div style={{ display: 'flex', gap: '12px' }}>
            <Sk w="220px" h="36px" r="8px" />
            <Sk w="140px" h="36px" r="8px" />
            <Sk w="120px" h="36px" r="8px" />
          </div>
        </div>
        <Sk w="100%" h="46px" r="8px" />
      </div>

      {/* List Layout Skeleton */}
      <div className={styles.listLayout}>
        {[1, 2, 3].map(i => (
          <div key={i} className={styles.internCard} style={{ padding: '20px' }}>
            <Sk h="60px" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───
export default function CameraVerification() {
  const [initialLoad, setInitialLoad] = useState(true); 
  const [loading, setLoading] = useState(true); 
  
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all'); 
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [selectedImage, setSelectedImage] = useState(null);
  
  const [timeLeft, setTimeLeft] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const [rejectModal, setRejectModal] = useState({ show: false, logId: null, slot: null, reason: '' });

  const BACKEND_HOST = window.location.hostname;
  const STORAGE_URL = `http://${BACKEND_HOST}:8000/storage/`;

  useEffect(() => {
    const calculateTime = () => {
      const [year, month, day] = searchDate.split('-');
      const targetDate = new Date(year, month - 1, day);
      const dayOfWeek = targetDate.getDay();
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7; 
      
      targetDate.setDate(targetDate.getDate() + daysUntilFriday);
      targetDate.setHours(23, 59, 59, 999);

      const now = new Date();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft('Photos expired & permanently deleted');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m remaining`);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000); 
    return () => clearInterval(timer);
  }, [searchDate]);

  const fetchVerificationLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/hr/attendance/verification', {
        params: { filter, date: searchDate }
      });
      setLogs(response.data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error('Failed to load camera feeds.');
      setLogs([]); 
    } finally {
      setLoading(false);
      setInitialLoad(false); 
    }
  }, [filter, searchDate]);

  useEffect(() => {
    fetchVerificationLogs();
  }, [fetchVerificationLogs]);

  const handleRejectSubmit = async () => {
    if (!rejectModal.reason.trim()) {
      toast.error("Please enter a reason for the intern.");
      return;
    }

    try {
      await api.post(`/hr/attendance/${rejectModal.logId}/verify`, { 
        action: 'reject', 
        image_slot: rejectModal.slot, 
        reason: rejectModal.reason 
      });
      
      toast.success(`Rejection sent. Intern notified.`);
      setRejectModal({ show: false, logId: null, slot: null, reason: '' });
      fetchVerificationLogs(); 
    } catch (error) {
      const backendError = error.response?.data?.error || error.response?.data?.message;
      toast.error(backendError ? `Server Error: ${backendError}` : 'Could not process rejection.');
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    let cleanPath = path.replace(/^public\//, '');
    cleanPath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
    return `${STORAGE_URL}${cleanPath}`;
  };

  const toggleAccordion = (id) => {
    setExpandedLogId(prevId => prevId === id ? null : id);
  };

  const displayedLogs = logs.filter(log => 
    log.intern_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    log.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (initialLoad) return <CameraVerificationSkeleton />;

  return (
    <div className={styles.pageWrapper}>
      <Toaster position="top-right" />
      
      {/* ✨ REPLACED HEADER WITH YOUR NEW PAGEHEADER COMPONENT ✨ */}
      <PageHeader title="Camera Verification" />

      {/* ✨ UNIFIED CONTROLS & PRIVACY BOX */}
      <div style={{
        background: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e8eaf0',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        
        {/* Top Row: Subtitle & Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Inspect individual selfies and manage 3-strike rejections.</p>
          
          <div className={styles.filters} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className={styles.searchWrapper}>
              <Search size={18} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search intern..." 
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <input 
              type="date" 
              className={styles.filterInput} 
              value={searchDate} 
              onChange={(e) => setSearchDate(e.target.value)} 
            />
            <select 
              className={styles.filterSelect} 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Logs</option>
              <option value="flagged">Flagged Only</option>
            </select>
          </div>
        </div>

        {/* Bottom Row: Privacy Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 16px',
          borderRadius: '8px', color: '#1e3a8a', fontSize: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={18} color="#3b82f6" />
            <span><strong>Privacy Policy:</strong> Verification photos are automatically deleted every Friday at midnight.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: timeLeft.includes('expired') ? '#dc2626' : '#0B1EAE' }}>
            <Clock size={16} />
            {timeLeft}
          </div>
        </div>
      </div>

      {/* ✨ LIST OR EMPTY STATE */}
      {loading ? (
        <div className={styles.listLayout}>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.internCard} style={{ padding: '20px' }}>
              <Sk h="60px" />
            </div>
          ))}
        </div>
      ) : displayedLogs.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrapper}>
            {searchQuery ? <Search size={40} /> : <Camera size={40} />}
          </div>
          <h3>No records found</h3>
          <p>{searchQuery ? `No interns match "${searchQuery}"` : "There are no verification logs for this date."}</p>
        </div>
      ) : (
        <div className={styles.listLayout}>
          {displayedLogs.map(log => {
            const isExpanded = expandedLogId === log.id;

            return (
              <div key={log.id} className={styles.internCard}>
                
                {/* ACCORDION HEADER */}
                <div 
                  onClick={() => toggleAccordion(log.id)}
                  className={styles.cardHeader}
                  style={{ cursor: 'pointer', borderBottom: isExpanded ? '1px solid #f1f5f9' : 'none' }}
                >
                  <div className={styles.internInfo}>
                    <h3>{log.intern_name}</h3>
                    <p><MapPin size={14} /> {log.department}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className={log.is_flagged === 1 ? styles.flagBadge : styles.safeBadge}>
                      {log.is_flagged === 1 ? 'Needs Attention' : 'Clean'}
                    </div>
                    <ChevronDown 
                      size={20} 
                      style={{ 
                        color: '#64748b', 
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }} 
                    />
                  </div>
                </div>

                {/* HIDDEN CONTENT (Individual Photos & Actions) */}
                {isExpanded && (
                  <div>
                    <div className={styles.photoSection}>
                      
                      {/* DYNAMIC PHOTO MAPPER WITH STRIKES */}
                      {[
                        { slotId: 'am_in', label: 'AM In', photo: log.image_in, status: log.am_in_status, attempts: log.am_in_attempts },
                        { slotId: 'lunch_out', label: 'Lunch Out', photo: log.lunch_out_selfie, status: log.lunch_out_status, attempts: log.lunch_out_attempts },
                        { slotId: 'lunch_in', label: 'Lunch In', photo: log.lunch_in_selfie, status: log.lunch_in_status, attempts: log.lunch_in_attempts },
                        { slotId: 'pm_out', label: 'PM Out', photo: log.image_out, status: log.pm_out_status, attempts: log.pm_out_attempts }
                      ].map((slot, idx) => (
                        <div key={idx} className={styles.photoBox}>
                          
                          <div className={styles.photoHeader}>
                            <span className={styles.photoLabel}>{slot.label}</span>
                            {/* Visual Status Badge */}
                            {slot.status === 'rejected' && <span className={styles.statusBadgeOrange}>Strike {slot.attempts}/3</span>}
                            {slot.status === 'failed' && <span className={styles.statusBadgeRed}>Locked</span>}
                          </div>

                          <div 
                            className={`${styles.imageWrapper} ${slot.status === 'failed' ? styles.lockedImage : ''}`} 
                            onClick={() => slot.photo && setSelectedImage(getImageUrl(slot.photo))}
                          >
                            {slot.photo ? (
                              <img src={getImageUrl(slot.photo)} alt={`${slot.label} Selfie`} />
                            ) : (
                              <div className={styles.noImage}>
                                <Camera size={20} />
                                <span>No Image</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons for this specific photo */}
                          {slot.photo && (!slot.status || slot.status === 'pending' || slot.status === 'rejected') && (
                            <div className={styles.photoActionRow}>
                              <button 
                                className={styles.btnRejectSmall} 
                                onClick={(e) => { e.stopPropagation(); setRejectModal({ show: true, logId: log.id, slot: slot.slotId, reason: '' }); }}
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </div>
                          )}

                        </div>
                      ))}
                    </div>

                    {/* Show HR's general flag reason if it exists */}
                    {log.flag_reason && (
                      <div className={styles.alertNote}>
                        <MessageSquare size={16} className={styles.alertIcon} /> 
                        <span><strong>Recent Note:</strong> {log.flag_reason}</span>
                      </div>
                    )}

                  </div>
                )}
                
              </div>
            );
          })}
        </div>
      )}

      {/* FULL IMAGE MODAL */}
      {selectedImage && (
        <div className={styles.modalOverlay} onClick={() => setSelectedImage(null)}>
          <div className={styles.modalContentFullImage} onClick={e => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={() => setSelectedImage(null)}>
              <X size={24} />
            </button>
            <img src={selectedImage} alt="Full Size Verification" />
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModal.show && (
        <div className={styles.modalOverlay} onClick={() => setRejectModal({ show: false, logId: null, slot: null, reason: '' })}>
          <div className={styles.modalDialog} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2><AlertTriangle size={20} /> Reject Photo</h2>
              <button className={styles.closeIconBtn} onClick={() => setRejectModal({ show: false, logId: null, slot: null, reason: '' })}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.strikeWarning}>
                <AlertTriangle size={16} /> 
                <span>If an intern's photo is rejected 3 times, their shift slot will be permanently locked and marked absent.</span>
              </div>

              <label className={styles.inputLabel}>Note to Intern:</label>
              <textarea 
                className={styles.modalTextarea}
                placeholder="Briefly explain why... (e.g., Incorrect uniform, blurry photo, location mismatch)"
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                rows={4}
              />
              <div className={styles.modalFooter}>
                <button 
                  className={styles.btnCancel}
                  onClick={() => setRejectModal({ show: false, logId: null, slot: null, reason: '' })}
                >
                  Cancel
                </button>
                <button 
                  className={styles.btnSubmitReject}
                  onClick={handleRejectSubmit}
                >
                  Send Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}