import React, { useState, useEffect, useCallback } from 'react';
import { Camera, MapPin, AlertTriangle, XCircle, X, MessageSquare } from 'lucide-react';
import api from "../../../api/axios";
import styles from './CameraVerification.module.css';
import toast, { Toaster } from 'react-hot-toast';

const Sk = ({ w = '100%', h = '16px', r = '8px' }) => (
  <div className={styles.skel} style={{ width: w, height: h, borderRadius: r }} />
);

export default function CameraVerification() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); 
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedImage, setSelectedImage] = useState(null);

  // Modal State
  const [rejectModal, setRejectModal] = useState({ show: false, logId: null, reason: '' });

  const BACKEND_HOST = window.location.hostname;
  const STORAGE_URL = `http://${BACKEND_HOST}:8000/storage/`;

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
    }
  }, [filter, searchDate]);

  useEffect(() => {
    fetchVerificationLogs();
  }, [fetchVerificationLogs]);

  const handleRejectAction = async () => {
    if (!rejectModal.reason.trim()) {
      toast.error("Please enter a reason for the intern.");
      return;
    }

    try {
      await api.post(`/hr/attendance/${rejectModal.logId}/verify`, { 
        action: 'reject', 
        reason: rejectModal.reason 
      });
      toast.success(`Rejection sent to intern.`);
      setRejectModal({ show: false, logId: null, reason: '' });
      fetchVerificationLogs(); 
    } catch (error) {
      const backendError = error.response?.data?.error;
      console.error("Backend Error Details:", backendError || error);
      toast.error(backendError ? `Server Error: ${backendError}` : 'Could not process rejection.');
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    let cleanPath = path.replace(/^public\//, '');
    cleanPath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
    return `${STORAGE_URL}${cleanPath}`;
  };

  return (
    <div className={styles.pageWrapper}>
      <Toaster position="top-right" />
      
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1>Camera Verification</h1>
          <p>Inspect selfies and provide feedback for rejected logs.</p>
        </div>
        
        <div className={styles.filters}>
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

      {loading ? (
        <div className={styles.grid}>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.internCard}>
              <Sk h="320px" />
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrapper}>
            <Camera size={40} />
          </div>
          <h3>No records found</h3>
          <p>There are no verification logs for this date.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {logs.map(log => (
            <div key={log.id} className={styles.internCard}>
              <div className={styles.cardHeader}>
                <div className={styles.internInfo}>
                  <h3>{log.intern_name}</h3>
                  <p><MapPin size={14} /> {log.department}</p>
                </div>
                {/* ✨ CHANGED: Check purely for is_flagged ✨ */}
                <div className={log.is_flagged === 1 ? styles.flagBadge : styles.safeBadge}>
                  {log.is_flagged === 1 ? 'Rejected' : 'Under Review'}
                </div>
              </div>

              <div className={styles.photoSection}>
                {[
                  { label: 'AM In', photo: log.image_in },
                  { label: 'Lunch Out', photo: log.lunch_out_selfie },
                  { label: 'Lunch In', photo: log.lunch_in_selfie },
                  { label: 'PM Out', photo: log.image_out }
                ].map((slot, idx) => (
                  <div key={idx} className={styles.photoBox}>
                    <div className={styles.photoHeader}>
                      <span className={styles.photoLabel}>{slot.label}</span>
                    </div>
                    <div 
                      className={styles.imageWrapper} 
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
                  </div>
                ))}
              </div>

              {log.flag_reason && (
                <div className={styles.alertNote}>
                  <MessageSquare size={16} className={styles.alertIcon} /> 
                  <span><strong>HR Feedback:</strong> {log.flag_reason}</span>
                </div>
              )}

              {/* ✨ CHANGED: Only show the Reject button if it hasn't been flagged yet ✨ */}
              {log.is_flagged !== 1 && (
                <div className={styles.cardActions}>
                  <button 
                    className={styles.btnReject} 
                    onClick={() => setRejectModal({ show: true, logId: log.id, reason: '' })}
                  >
                    <XCircle size={16} /> Reject Log
                  </button>
                </div>
              )}
            </div>
          ))}
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
        <div className={styles.modalOverlay} onClick={() => setRejectModal({ show: false, logId: null, reason: '' })}>
          <div className={styles.modalDialog} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2><AlertTriangle size={20} /> Rejection Detail</h2>
              <button className={styles.closeIconBtn} onClick={() => setRejectModal({ show: false, logId: null, reason: '' })}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
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
                  onClick={() => setRejectModal({ show: false, logId: null, reason: '' })}
                >
                  Cancel
                </button>
                <button 
                  className={styles.btnSubmitReject}
                  onClick={handleRejectAction}
                >
                  Send & Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}