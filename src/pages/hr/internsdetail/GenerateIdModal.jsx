import React, { useRef, useState, useEffect } from 'react';
import { X, Download, FileText, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import styles from './GenerateIdModal.module.css';

import idFrontTemplate from '../../../assets/id-front.png';
import idBackTemplate from '../../../assets/id-back.png';

export default function GenerateIdModal({ intern, onClose }) {
  // We use this ref to point to the invisible, 100% scale version of the ID card
  const captureRef = useRef(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  
  // ✨ Store the image as raw Base64 data to bypass browser security blocks
  const [base64Photo, setBase64Photo] = useState(null);

  const profilePhotoUrl = intern?.avatar_url || intern?.rawData?.intern?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${intern?.name || 'default'}`;

  // ✨ Pre-fetch the image the second the modal opens
  useEffect(() => {
    let isMounted = true;
    
    const fetchImageAsBase64 = async () => {
      try {
        const response = await fetch(profilePhotoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isMounted) setBase64Photo(reader.result);
        };
        reader.readAsDataURL(blob);
      } catch  {
        console.error("CORS blocked the image fetch. Falling back to URL.");
        if (isMounted) setBase64Photo(profilePhotoUrl); 
      }
    };
    
    if (profilePhotoUrl) {
      fetchImageAsBase64();
    }
    
    return () => { isMounted = false; };
  }, [profilePhotoUrl]);

  if (!intern) return null;

  const fullName = intern.name ? intern.name.toUpperCase() : 'INTERN NAME';
  const emergencyName = intern.emergency_name || "NOT PROVIDED";
  const emergencyNumber = intern.emergency_number || "NOT PROVIDED";
  const emergencyAddress = intern.emergency_address || "NOT PROVIDED";

  // ✨ Universal Download Handler for both PNG and PDF
  const handleDownload = async (type) => {
    try {
      setIsProcessing(true);
      
      // Give React 300ms to ensure the Base64 image is fully rendered in the hidden div
      await new Promise(resolve => setTimeout(resolve, 300)); 

      // Take a picture of the HIDDEN ref, which is sitting at 100% pristine scale
      const element = captureRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true,
        backgroundColor: null 
      });
      
      const dataImage = canvas.toDataURL('image/png');

      if (type === 'png') {
        const link = document.createElement('a');
        link.href = dataImage;
        link.download = `${intern.name.replace(/ /g, '_')}_ID_Card.png`;
        link.click();
      } else if (type === 'pdf') {
        // Dimensions perfectly match the two 600x1024 cards side-by-side with gaps
        const pdf = new jsPDF('landscape', 'px', [1240, 1044]);
        pdf.addImage(dataImage, 'PNG', 0, 0, 1240, 1044);
        pdf.save(`${intern.name.replace(/ /g, '_')}_ID_Card.pdf`);
      }

    } catch (error) {
      console.error("Error generating capture:", error);
      alert("Failed to generate file. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 📦 Reusable component that renders both the Front and Back cards
  const renderIdCards = (refTarget) => (
    <div ref={refTarget || undefined} style={{ 
      display: 'flex', 
      gap: '20px', 
      backgroundColor: '#fff', 
      padding: '10px', 
      borderRadius: '24px',
      fontFamily: "'Arial', sans-serif",
      width: 'max-content' 
    }}>
      
      {/* ════ FRONT OF ID ════ */}
      <div style={{
        width: '600px', height: '1024px', backgroundImage: `url(${idFrontTemplate})`,
        backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#fff'
      }}>
        
        {/* Profile Picture rendered via CSS Background to appease html2canvas */}
        <div 
          style={{
            position: 'absolute',
            top: '210px',   
            left: '141px',  
            width: '318px',
            height: '318px',
            borderRadius: '50%',
            backgroundColor: '#f8fafc',
            backgroundImage: `url('${base64Photo || profilePhotoUrl}')`, 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />

        <h2 style={{ position: 'absolute', top: '585px', left: '0', width: '100%', textAlign: 'center', fontSize: '34px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px', color: '#000000', padding: '0 20px', boxSizing: 'border-box' }}>
          {fullName}
        </h2>
        <p style={{ position: 'absolute', top: '725px', left: '230px', width: '330px', fontSize: '24px', fontWeight: '500', margin: 0, color: '#000000' }}>
          {intern.course || 'Information Technology'}
        </p>
        <p style={{ position: 'absolute', top: '775px', left: '230px', width: '330px', fontSize: '24px', fontWeight: '500', margin: 0, lineHeight: '1.3', color: '#000000' }}>
          {intern.school || 'University of Science and Technology of Southern Philippines'}
        </p>
      </div>

      {/* ════ BACK OF ID ════ */}
      <div style={{
        width: '600px', height: '1024px', backgroundImage: `url(${idBackTemplate})`,
        backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#fff'
      }}>
        <p style={{ position: 'absolute', top: '237px', left: '220px', width: '340px', fontSize: '26px', fontWeight: '800', margin: 0, color: '#000000' }}>{emergencyName}</p>
        <p style={{ position: 'absolute', top: '298px', left: '220px', width: '340px', fontSize: '26px', fontWeight: '800', margin: 0, lineHeight: '1.3', color: '#000000' }}>{emergencyAddress}</p>
        <p style={{ position: 'absolute', top: '390px', left: '220px', width: '340px', fontSize: '26px', fontWeight: '800', margin: 0, color: '#000000' }}>{emergencyNumber}</p>
      </div>

    </div>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>ID Card Preview</h2>
          <button className={styles.closeBtn} onClick={onClose} disabled={isProcessing}><X size={18} /></button>
        </div>

        <div className={styles.modalBody} style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          backgroundColor: '#cbd5e1', 
          padding: '24px',
          borderRadius: '8px',
          overflow: 'hidden' 
        }}>
          
          {/* ✨ 1. THE HIDDEN CAPTURE TARGET (100% scale, off-screen, perfect quality) ✨ */}
          <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -1 }}>
            {renderIdCards(captureRef)}
          </div>

          {/* ✨ 2. THE VISIBLE PREVIEW (Scaled down to fit screen) ✨ */}
          <div style={{ transform: 'scale(0.45)', transformOrigin: 'top center', marginBottom: '-550px' }}>
            {renderIdCards(null)}
          </div>

        </div>

        {/* ════ FOOTER BUTTONS ════ */}
        <div className={styles.modalFooter} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className={styles.secondaryBtn} onClick={onClose} disabled={isProcessing}>Cancel</button>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={styles.primaryBtn} onClick={() => handleDownload('png')} disabled={isProcessing} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isProcessing ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
              {isProcessing ? 'Generating...' : 'Download PNG'}
            </button>
            <button className={styles.primaryBtn} onClick={() => handleDownload('pdf')} disabled={isProcessing} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isProcessing ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={16} />}
              {isProcessing ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}