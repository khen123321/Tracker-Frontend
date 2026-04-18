import React from 'react';
import { X, Printer } from 'lucide-react';
import styles from './GenerateIdModal.module.css';

import idFrontTemplate from '../../../assets/id-front.png';
import idBackTemplate from '../../../assets/id-back.png';

export default function GenerateIdModal({ intern, onClose }) {
  if (!intern) return null;

  // Extract just the first name for the large text (e.g., "ALTHEA")
  const firstName = intern.name ? intern.name.split(' ')[0].toUpperCase() : 'INTERN';

  // 👇 STRICTLY DYNAMIC DATA 👇
  // This now relies 100% on the data passed from your InternsList/Database.
  // If the intern didn't fill it out, it safely shows "NOT PROVIDED".
  const emergencyName = intern.emergency_name || "NOT PROVIDED";
  const emergencyNumber = intern.emergency_number || "NOT PROVIDED";
  const emergencyAddress = intern.emergency_address || "NOT PROVIDED";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>ID Card Preview</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.modalBody}>
          <div id="printable-id-container" className={styles.cardsWrapper}>
            
            {/* ─── FRONT OF ID ─── */}
            <div 
              className={styles.idCard} 
              style={{ backgroundImage: `url(${idFrontTemplate})` }}
            >
              {/* Photo */}
              <div className={styles.photoWrapper}>
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${intern.name}`} 
                  alt="Intern" 
                  className={styles.internPhoto}
                />
              </div>
              
              {/* Front Text */}
              <div className={styles.frontTextWrapper}>
                <h1 className={styles.frontName}>{firstName}</h1>
                
                <div className={styles.frontDetails}>
                  <p className={styles.frontCourse}>{intern.course || 'N/A'}</p>
                  <p className={styles.frontSchool}>{intern.school || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* ─── BACK OF ID ─── */}
            <div 
              className={styles.idCard} 
              style={{ backgroundImage: `url(${idBackTemplate})` }}
            >
              {/* Back Text (Real Emergency Contact from Database) */}
              <div className={styles.backTextWrapper}>
                <div className={styles.backContactBlock}>
                  <p className={styles.backValue}>{emergencyName}</p>
                  <p className={styles.backValue}>{emergencyNumber}</p>
                </div>
                
                <div className={styles.backAddressBlock}>
                  <p className={styles.backValue} style={{ whiteSpace: 'pre-line' }}>
                    {emergencyAddress}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose}>Cancel</button>
          <button className={styles.primaryBtn} onClick={handlePrint}>
            <Printer size={16} /> Print ID Cards
          </button>
        </div>

      </div>
    </div>
  );
}