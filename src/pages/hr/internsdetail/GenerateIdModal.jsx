import React, { useRef, useState, useEffect } from 'react';
import { X, Download, FileText, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import styles from './GenerateIdModal.module.css';

import idFrontTemplate from '../../../assets/id-front.png';
import idBackTemplate from '../../../assets/id-back.png';

export default function GenerateIdModal({ intern, onClose }) {
  const captureRef = useRef(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  
  // ✨ The ultimate safe image state
  const [safeImage, setSafeImage] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    // 1. Get the image URL (from parent's Base64, or database, or DiceBear PNG)
    const url = intern?.avatar_url || intern?.rawData?.intern?.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${intern?.name || 'default'}`;

    // 2. If it's already a safe Base64 string from the parent, use it immediately!
    if (url.startsWith('data:')) {
      setSafeImage(url);
      return;
    }

    // 3. The "Bulletproof Canvas Trick": Forces the image to become a secure Base64 string
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      if (isMounted) {
        setSafeImage(canvas.toDataURL("image/png"));
      }
    };
    img.onerror = () => {
      console.warn("Backend CORS blocked the secure conversion. Falling back to raw URL.");
      // If XAMPP blocks it, fallback so it at least displays in the preview
      if (isMounted) setSafeImage(url);
    };
    img.src = url;

    return () => { isMounted = false; };
  }, [intern]);

  if (!intern) return null;

  const fullName = intern.name ? intern.name.toUpperCase() : 'INTERN NAME';
  const emergencyName = intern.emergency_name || "NOT PROVIDED";
  const emergencyNumber = intern.emergency_number || "NOT PROVIDED";
  const emergencyAddress = intern.emergency_address || "NOT PROVIDED";

  const handleDownload = async (type) => {
    try {
      setIsProcessing(true);
      
      // Give React 300ms to ensure the Base64 image is fully painted
      await new Promise(resolve => setTimeout(resolve, 300)); 

      const element = captureRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: null 
      });
      
      const dataImage = canvas.toDataURL('image/png');

      if (type === 'png') {
        const link = document.createElement('a');
        link.href = dataImage;
        link.download = `${intern.name.replace(/ /g, '_')}_ID_Card.png`;
        link.click();
      } else if (type === 'pdf') {
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
        
        {/* ✨ THE FIX: Explicit Image Tag sitting cleanly on top of the background */}
        {safeImage && (
          <img 
            src={safeImage}
            alt="Intern Profile"
            // If it's Base64, we drop the crossOrigin rule so the browser doesn't hide it!
            crossOrigin={safeImage.startsWith('data:') ? undefined : "anonymous"}
            style={{
              position: 'absolute',
              top: '210px',   
              left: '141px',  
              width: '318px',
              height: '318px',
              borderRadius: '50%',
              backgroundColor: '#f8fafc',
              objectFit: 'cover',
              zIndex: 10 // Forces it to stay above the template
            }}
          />
        )}

        <h2 style={{ position: 'absolute', top: '585px', left: '0', width: '100%', textAlign: 'center', fontSize: '34px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px', color: '#000000', padding: '0 20px', boxSizing: 'border-box', zIndex: 20 }}>
          {fullName}
        </h2>
        <p style={{ position: 'absolute', top: '725px', left: '230px', width: '330px', fontSize: '24px', fontWeight: '500', margin: 0, color: '#000000', zIndex: 20 }}>
          {intern.course || 'Information Technology'}
        </p>
        <p style={{ position: 'absolute', top: '775px', left: '230px', width: '330px', fontSize: '24px', fontWeight: '500', margin: 0, lineHeight: '1.3', color: '#000000', zIndex: 20 }}>
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
          
          <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -1 }}>
            {renderIdCards(captureRef)}
          </div>

          <div style={{ transform: 'scale(0.45)', transformOrigin: 'top center', marginBottom: '-550px' }}>
            {renderIdCards(null)}
          </div>

        </div>

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