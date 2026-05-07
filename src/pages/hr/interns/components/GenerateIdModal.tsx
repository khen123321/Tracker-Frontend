import React, { useRef, useState, useEffect } from 'react';
import { X, Download, FileText, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import idFrontTemplate from "../../../../assets/id-front.png";
import idBackTemplate from "../../../../assets/id-back.png";

interface GenerateIdModalProps {
  intern: any;
  onClose: () => void;
}

export default function GenerateIdModal({ intern, onClose }: GenerateIdModalProps) {
  const captureRef = useRef<HTMLDivElement>(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [safeImage, setSafeImage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const url = intern?.avatar_url || intern?.rawData?.intern?.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${intern?.name || 'default'}`;

    if (typeof url === 'string' && url.startsWith('data:')) {
      setSafeImage(url);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) return; 

      ctx.drawImage(img, 0, 0);
      if (isMounted) {
        setSafeImage(canvas.toDataURL("image/png"));
      }
    };
    img.onerror = () => {
      console.warn("Backend CORS blocked the secure conversion. Falling back to raw URL.");
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

  const handleDownload = async (type: 'png' | 'pdf') => {
    try {
      setIsProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 300)); 

      const element = captureRef.current;
      if (!element) return;

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

  const renderIdCards = (refTarget: React.RefObject<HTMLDivElement | null> | null) => (
    <div ref={refTarget as React.LegacyRef<HTMLDivElement>} style={{ 
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
        
        {safeImage && (
          <img 
            src={safeImage}
            alt="Intern Profile"
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
              zIndex: 10 
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
        <p style={{ position: 'absolute', top: '237px', left: '180px', width: '380px', fontSize: '26px', fontWeight: '800', margin: 0, color: '#000000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emergencyName}</p>
        <p style={{ position: 'absolute', top: '298px', left: '180px', width: '380px', fontSize: '22px', fontWeight: '800', margin: 0, lineHeight: '1.2', color: '#000000' }}>{emergencyAddress}</p>
        <p style={{ position: 'absolute', top: '390px', left: '180px', width: '380px', fontSize: '26px', fontWeight: '800', margin: 0, color: '#000000' }}>{emergencyNumber}</p>
      </div>

    </div>
  );

  return (
    // ✨ Overlay
    <div 
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-[4px] flex justify-center items-center z-[9999] p-5 animate-in fade-in duration-200" 
      onClick={onClose}
    >
      {/* ✨ Modal Container */}
      <div 
        className="bg-white w-full max-w-[750px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300" 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ✨ Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-slate-800 m-0">ID Card Preview</h2>
          <button 
            className="bg-transparent border-none text-slate-500 cursor-pointer p-1.5 rounded-md transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900" 
            onClick={onClose} 
            disabled={isProcessing}
          >
            <X size={20} />
          </button>
        </div>

        {/* ✨ Modal Body (With Custom Tailwind Scrollbar!) */}
        <div 
          className="max-h-[70vh] overflow-y-auto relative flex justify-center bg-slate-300 p-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
        >
          
          <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -1 }}>
            {renderIdCards(captureRef)}
          </div>

          <div style={{ transform: 'scale(0.45)', transformOrigin: 'top center', marginBottom: '-550px' }}>
            {renderIdCards(null)}
          </div>

        </div>

        {/* ✨ Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <button 
            className="bg-white text-slate-600 border border-slate-200 px-5 py-2.5 rounded-lg font-semibold text-sm cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={onClose} 
            disabled={isProcessing}
          >
            Cancel
          </button>
          
          <div className="flex gap-3">
            <button 
              className="bg-[#0B1EAE] text-white border-none px-5 py-2.5 rounded-lg font-semibold text-sm cursor-pointer transition-all duration-200 hover:bg-[#081682] hover:-translate-y-[1px] disabled:bg-slate-400 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2" 
              onClick={() => handleDownload('png')} 
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {isProcessing ? 'Generating...' : 'Download PNG'}
            </button>
            <button 
              className="bg-[#0B1EAE] text-white border-none px-5 py-2.5 rounded-lg font-semibold text-sm cursor-pointer transition-all duration-200 hover:bg-[#081682] hover:-translate-y-[1px] disabled:bg-slate-400 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2" 
              onClick={() => handleDownload('pdf')} 
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              {isProcessing ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}