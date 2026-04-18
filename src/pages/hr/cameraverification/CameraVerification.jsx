import React, { useState, useEffect, useCallback } from 'react';
import { Camera, MapPin, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';
import api from "../../../api/axios";
import styles from './CameraVerification.module.css';
import toast, { Toaster } from 'react-hot-toast';

export default function CameraVerification() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('flagged'); // 'all' or 'flagged'
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedImage, setSelectedImage] = useState(null);

  // BASE URL for Laravel Storage
  const STORAGE_URL = "http://localhost:8000/storage/";

  /**
   * FETCH LIVE DATA ONLY
   * Removed all fallback mock data. If the request fails or is empty,
   * the UI will reflect the real state of the database.
   */
  const fetchVerificationLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/hr/attendance/verification', {
        params: { filter, date: searchDate }
      });
      
      // We only set what the database gives us
      setLogs(response.data || []);
    } catch (error) {
      console.error("Error fetching live logs:", error);
      toast.error('Failed to connect to the server. Showing empty results.');
      setLogs([]); 
    } finally {
      setLoading(false);
    }
  }, [filter, searchDate]);

  useEffect(() => {
    fetchVerificationLogs();
  }, [fetchVerificationLogs]);

  /**
   * HANDLE APPROVE / REJECT
   */
  const handleAction = async (logId, action) => {
    try {
      await api.post(`/hr/attendance/${logId}/verify`, { action });
      toast.success(`Attendance ${action === 'approve' ? 'Verified' : 'Rejected'}`);
      fetchVerificationLogs(); 
    } catch (error) {
      console.error("Status update error:", error);
      toast.error('Failed to update status on server');
    }
  };

  // Helper to resolve image paths
  const getImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${STORAGE_URL}${path}`;
  };

  return (
    <div className={styles.pageWrapper}>
      <Toaster position="top-right" />
      
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1>Camera Verification</h1>
          <p>Review attendance selfies and investigate suspicious time logs.</p>
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
            <option value="flagged">Suspicious / Flagged Only</option>
            <option value="all">All Attendance Logs</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.emptyState}>Loading live camera feeds...</div>
      ) : logs.length === 0 ? (
        <div className={styles.emptyState}>
          <Camera size={48} style={{ marginBottom: 12, opacity: 0.2 }} />
          <p>No actual records found for this date/filter.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {logs.map(log => (
            <div key={log.id} className={styles.card}>
              
              {/* Header Info */}
              <div className={styles.cardHeader}>
                <div className={styles.internInfo}>
                  <h3>{log.intern_name}</h3>
                  <p><MapPin size={14} /> {log.department}</p>
                </div>
                {log.is_flagged === 1 ? (
                  <div className={styles.flagBadge}>
                    <AlertTriangle size={14} /> Suspicious
                  </div>
                ) : (
                  <div className={styles.safeBadge}>Standard</div>
                )}
              </div>

              {/* Photos Section */}
              <div className={styles.photoSection}>
                {/* Time In Column */}
                <div className={styles.photoBox}>
                  <span className={styles.photoLabel}>Time In</span>
                  <div 
                    className={styles.imageWrapper}
                    onClick={() => log.image_in && setSelectedImage(getImageUrl(log.image_in))}
                  >
                    {log.image_in ? (
                      <img src={getImageUrl(log.image_in)} alt="Time In Selfie" />
                    ) : (
                      <div className={styles.noImage}><Camera size={24} /> No Photo</div>
                    )}
                  </div>
                  <div className={styles.timeLog}>{log.time_in || '--:--'}</div>
                </div>

                {/* Time Out Column */}
                <div className={styles.photoBox}>
                  <span className={styles.photoLabel}>Time Out</span>
                  <div 
                    className={styles.imageWrapper}
                    onClick={() => log.image_out && setSelectedImage(getImageUrl(log.image_out))}
                  >
                    {log.image_out ? (
                      <img src={getImageUrl(log.image_out)} alt="Time Out Selfie" />
                    ) : (
                      <div className={styles.noImage}><Camera size={24} /> No Photo</div>
                    )}
                  </div>
                  <div className={styles.timeLog}>{log.time_out || '--:--'}</div>
                </div>
              </div>

              {/* Flag Reason */}
              {log.is_flagged === 1 && log.flag_reason && (
                <div style={{ padding: '0 16px 12px', fontSize: '12px', color: '#ef4444', textAlign: 'center' }}>
                  <strong>System Note:</strong> {log.flag_reason}
                </div>
              )}

              {/* Action Buttons */}
              {(log.status === 'pending_review' || log.is_flagged === 1) && (
                <div className={styles.cardActions}>
                  <button className={styles.btnApprove} onClick={() => handleAction(log.id, 'approve')}>
                    <CheckCircle size={16} /> Verify OK
                  </button>
                  <button className={styles.btnReject} onClick={() => handleAction(log.id, 'reject')}>
                    <XCircle size={16} /> Reject / Fraud
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Full Size Image Modal */}
      {selectedImage && (
        <div className={styles.modalOverlay} onClick={() => setSelectedImage(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={() => setSelectedImage(null)}>
              <X size={32} />
            </button>
            <img src={selectedImage} alt="Full size selfie" />
          </div>
        </div>
      )}

    </div>
  );
}