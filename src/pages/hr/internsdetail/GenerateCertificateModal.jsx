import React, { useRef, useState } from 'react';
import { X, Download, FileText, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import styles from './GenerateIdModal.module.css'; // Reusing the ID modal styles for consistency!

import CertificateTemplate from '../../../pages/hr/interns/CertificateTemplate'; 

export default function GenerateCertificateModal({ intern, onClose }) {
  const scaleWrapperRef = useRef(null);
  const certRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!intern) return null;

  // Map the raw data to fit what your CertificateTemplate is looking for
  const certificateData = {
    name: intern.name ? intern.name.toUpperCase() : 'INTERN NAME',
    course: intern.course || intern.rawData?.course || 'Bachelor of Science in Information Technology',
    school: intern.school || intern.rawData?.school || 'University of Science and Technology of Southern Philippines',
    hours: intern.rawData?.total_hours || 600,
    dateStarted: intern.rawData?.intern?.date_started ? new Date(intern.rawData.intern.date_started).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Start Date',
    dateCompleted: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    department: intern.department || intern.rawData?.assigned_department || 'Information Technology Department',
    gender: intern.rawData?.gender || 'male'
  };

  // The HD Flash Trick
  const captureAndDownload = async (type) => {
    try {
      setIsProcessing(true);
      const wrapper = scaleWrapperRef.current;
      const originalTransform = wrapper.style.transform;
      
      // Expand to 100% for the screenshot
      wrapper.style.transform = 'scale(1)';
      await new Promise(resolve => setTimeout(resolve, 300)); 

      const element = certRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff' 
      });
      
      const dataImage = canvas.toDataURL('image/png');

      if (type === 'png') {
        const link = document.createElement('a');
        link.href = dataImage;
        link.download = `${intern.name.replace(/ /g, '_')}_Certificate.png`;
        link.click();
      } else if (type === 'pdf') {
        const pdf = new jsPDF('landscape', 'px', [1123, 794]);
        pdf.addImage(dataImage, 'PNG', 0, 0, 1123, 794);
        pdf.save(`${intern.name.replace(/ /g, '_')}_Certificate.pdf`);
      }

      // Shrink back instantly
      wrapper.style.transform = originalTransform;

    } catch (error) {
      console.error("Error generating capture:", error);
      alert("Failed to generate certificate. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Certificate Preview</h2>
          <button className={styles.closeBtn} onClick={onClose} disabled={isProcessing}><X size={18} /></button>
        </div>

        <div className={styles.modalBody} style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#cbd5e1', padding: '24px', borderRadius: '8px', overflow: 'hidden' }}>
          
          <div ref={scaleWrapperRef} style={{ transform: 'scale(0.60)', transformOrigin: 'top center', marginBottom: '-300px', transition: 'transform 0s' }}>
            
            {/* HD Target (Hidden) */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -1 }}>
              <CertificateTemplate intern={certificateData} forwardRef={certRef} />
            </div>

            {/* Visual Preview */}
            <CertificateTemplate intern={certificateData} />

          </div>
        </div>

        <div className={styles.modalFooter} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className={styles.secondaryBtn} onClick={onClose} disabled={isProcessing}>Cancel</button>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={styles.primaryBtn} onClick={() => captureAndDownload('png')} disabled={isProcessing} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isProcessing ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
              {isProcessing ? 'Generating...' : 'Download PNG'}
            </button>
            <button className={styles.primaryBtn} onClick={() => captureAndDownload('pdf')} disabled={isProcessing} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isProcessing ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={16} />}
              {isProcessing ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}