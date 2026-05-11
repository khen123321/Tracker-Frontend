import React, { useState, useEffect } from 'react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [safeImage, setSafeImage] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setImageReady(false);

    const loadAvatar = async () => {
      // ── Pull avatar from whichever shape the intern object comes in ──
      const dbAvatar =
        intern?.avatar_url ||
        intern?.intern?.avatar_url ||
        intern?.rawData?.intern?.avatar_url ||
        intern?.rawData?.profile_picture;

      const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
      const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${intern?.name || 'default'}`;

      if (!dbAvatar) {
        if (isMounted) { setSafeImage(fallbackUrl); setImageReady(true); }
        return;
      }

      try {
        // Build the proxy URL — avoids canvas taint
        let fetchUrl: string;

        if (dbAvatar.includes('/storage/')) {
          const cleanPath = dbAvatar.split('/storage/')[1];
          fetchUrl = `${baseUrl}/get-avatar?path=${cleanPath}&t=${Date.now()}`;
        } else if (dbAvatar.startsWith('http')) {
          // External URL (e.g. dicebear fallback already resolved upstream)
          fetchUrl = dbAvatar;
        } else {
          // Raw filename like "avatars/xyz.png"
          fetchUrl = `${baseUrl}/get-avatar?path=${dbAvatar}&t=${Date.now()}`;
        }

        const response = await fetch(fetchUrl, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();

        await new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (isMounted) {
              setSafeImage(reader.result as string);
              setImageReady(true);
            }
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

      } catch (error) {
        console.error("Failed to load profile picture for ID:", error);
        if (isMounted) { setSafeImage(fallbackUrl); setImageReady(true); }
      }
    };

    loadAvatar();
    return () => { isMounted = false; };
  }, [intern]);

  if (!intern) return null;

  // ── Field resolution ─────────────────────────────────────────────────────
  const fullName        = intern.name        ? intern.name.toUpperCase() : 'INTERN NAME';
  const course          = intern.course          || intern.intern?.course          || 'Information Technology';
  const schoolName      = intern.school          || intern.intern?.school?.name    || 'University of Science and Technology of Southern Philippines';

  // Emergency contact — flat fields (from InternsList shape) with nested fallback
  const emergencyName   = intern.emergency_name    || intern.intern?.emergency_name    || 'NOT PROVIDED';
  const emergencyNumber = intern.emergency_number  || intern.intern?.emergency_number  || 'NOT PROVIDED';
  const emergencyAddress= intern.emergency_address || intern.intern?.emergency_address || 'NOT PROVIDED';

  // ── Programmatic DOM build for html2canvas capture ───────────────────────
  const buildIdCardElement = (): HTMLDivElement => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex; gap: 20px; background-color: #fff; padding: 10px;
      border-radius: 24px; font-family: Arial, sans-serif;
      width: max-content; position: fixed; top: -10000px; left: -10000px;
    `;

    // ── Front ──────────────────────────────────────────────────────────────
    const front = document.createElement('div');
    front.style.cssText = `
      width: 600px; height: 1024px;
      background-image: url(${idFrontTemplate}); background-size: cover;
      background-position: center; position: relative;
      box-shadow: 0 4px 15px rgba(0,0,0,0.15); border-radius: 16px;
      overflow: hidden; background-color: #fff;
    `;

    if (safeImage) {
      const img = document.createElement('img');
      img.src = safeImage;
      img.crossOrigin = 'anonymous';
      img.style.cssText = `
        position: absolute; top: 210px; left: 141px;
        width: 318px; height: 318px; border-radius: 50%;
        background-color: #f8fafc; object-fit: cover; z-index: 10;
      `;
      front.appendChild(img);
    }

    const nameEl = document.createElement('h2');
    nameEl.style.cssText = `
      position: absolute; top: 585px; left: 0; width: 100%; text-align: center;
      font-size: 34px; font-weight: 900; margin: 0; letter-spacing: -0.5px;
      color: #000; padding: 0 20px; box-sizing: border-box; z-index: 20;
    `;
    nameEl.textContent = fullName;

    const courseEl = document.createElement('p');
    courseEl.style.cssText = `
      position: absolute; top: 725px; left: 230px; width: 330px;
      font-size: 24px; font-weight: 500; margin: 0; color: #000; z-index: 20;
    `;
    courseEl.textContent = course;

    const schoolEl = document.createElement('p');
    schoolEl.style.cssText = `
      position: absolute; top: 775px; left: 230px; width: 330px;
      font-size: 24px; font-weight: 500; margin: 0; line-height: 1.3;
      color: #000; z-index: 20;
    `;
    schoolEl.textContent = schoolName;

    front.append(nameEl, courseEl, schoolEl);

    // ── Back ───────────────────────────────────────────────────────────────
    const back = document.createElement('div');
    back.style.cssText = `
      width: 600px; height: 1024px;
      background-image: url(${idBackTemplate}); background-size: cover;
      background-position: center; position: relative;
      box-shadow: 0 4px 15px rgba(0,0,0,0.15); border-radius: 16px;
      overflow: hidden; background-color: #fff;
    `;

    const makePara = (top: string, text: string, extra = '') => {
      const p = document.createElement('p');
      p.style.cssText = `
        position: absolute; top: ${top}; left: 180px; width: 380px;
        font-size: 26px; font-weight: 800; margin: 0; color: #000; ${extra}
      `;
      p.textContent = text;
      return p;
    };

    back.append(
      makePara('237px', emergencyName,    'white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'),
      makePara('298px', emergencyAddress, 'font-size: 22px; line-height: 1.2;'),
      makePara('390px', emergencyNumber),
    );

    wrapper.append(front, back);
    return wrapper;
  };

  // ── Download handler ─────────────────────────────────────────────────────
  const handleDownload = async (type: 'png' | 'pdf') => {
    if (!imageReady) return;

    try {
      setIsProcessing(true);

      const element = buildIdCardElement();
      document.body.appendChild(element);

      await new Promise(resolve => requestAnimationFrame(resolve));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(element);

      const dataImage = canvas.toDataURL('image/png');

      if (type === 'png') {
        const link = document.createElement('a');
        link.href = dataImage;
        link.download = `${intern.name.replace(/ /g, '_')}_ID_Card.png`;
        link.click();
      } else {
        const pdf = new jsPDF('landscape', 'px', [1240, 1044]);
        pdf.addImage(dataImage, 'PNG', 0, 0, 1240, 1044);
        pdf.save(`${intern.name.replace(/ /g, '_')}_ID_Card.pdf`);
      }

    } catch (error) {
      console.error("Error generating ID card:", error);
      alert("Failed to generate file. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Screen preview (not captured) ────────────────────────────────────────
  const IdCardPreview = () => (
    <div style={{
      display: 'flex', gap: '20px', backgroundColor: '#fff', padding: '10px',
      borderRadius: '24px', fontFamily: "'Arial', sans-serif", width: 'max-content',
    }}>
      {/* Front */}
      <div style={{
        width: '600px', height: '1024px',
        backgroundImage: `url(${idFrontTemplate})`, backgroundSize: 'cover',
        backgroundPosition: 'center', position: 'relative',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)', borderRadius: '16px',
        overflow: 'hidden', backgroundColor: '#fff',
      }}>
        {safeImage && (
          <img
            src={safeImage}
            alt="Profile"
            crossOrigin="anonymous"
            style={{
              position: 'absolute', top: '210px', left: '141px',
              width: '318px', height: '318px', borderRadius: '50%',
              backgroundColor: '#f8fafc', objectFit: 'cover', zIndex: 10,
            }}
          />
        )}
        <h2 style={{ position: 'absolute', top: '585px', left: 0, width: '100%', textAlign: 'center', fontSize: '34px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px', color: '#000', padding: '0 20px', boxSizing: 'border-box', zIndex: 20 }}>
          {fullName}
        </h2>
        <p style={{ position: 'absolute', top: '725px', left: '230px', width: '330px', fontSize: '24px', fontWeight: 500, margin: 0, color: '#000', zIndex: 20 }}>
          {course}
        </p>
        <p style={{ position: 'absolute', top: '775px', left: '230px', width: '330px', fontSize: '24px', fontWeight: 500, margin: 0, lineHeight: 1.3, color: '#000', zIndex: 20 }}>
          {schoolName}
        </p>
      </div>

      {/* Back */}
      <div style={{
        width: '600px', height: '1024px',
        backgroundImage: `url(${idBackTemplate})`, backgroundSize: 'cover',
        backgroundPosition: 'center', position: 'relative',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)', borderRadius: '16px',
        overflow: 'hidden', backgroundColor: '#fff',
      }}>
        <p style={{ position: 'absolute', top: '237px', left: '180px', width: '380px', fontSize: '26px', fontWeight: 800, margin: 0, color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {emergencyName}
        </p>
        <p style={{ position: 'absolute', top: '298px', left: '180px', width: '380px', fontSize: '22px', fontWeight: 800, margin: 0, lineHeight: 1.2, color: '#000' }}>
          {emergencyAddress}
        </p>
        <p style={{ position: 'absolute', top: '390px', left: '180px', width: '380px', fontSize: '26px', fontWeight: 800, margin: 0, color: '#000' }}>
          {emergencyNumber}
        </p>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-[4px] flex justify-center items-center z-[9999] p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[750px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-slate-800 m-0">ID Card Preview</h2>
          <button
            className="bg-transparent border-none text-slate-500 cursor-pointer p-1.5 rounded-md transition-colors hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            disabled={isProcessing}
          >
            <X size={20} />
          </button>
        </div>

        {/* Preview */}
        <div className="max-h-[70vh] overflow-y-auto flex justify-center bg-slate-300 p-6">
          <div style={{ transform: 'scale(0.45)', transformOrigin: 'top center', marginBottom: '-550px' }}>
            <IdCardPreview />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <button
            className="bg-white text-slate-600 border border-slate-200 px-5 py-2.5 rounded-lg font-semibold text-sm cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>

          <div className="flex gap-3">
            {(['png', 'pdf'] as const).map((type) => (
              <button
                key={type}
                className="bg-[#0B1EAE] text-white border-none px-5 py-2.5 rounded-lg font-semibold text-sm cursor-pointer transition-all hover:bg-[#081682] hover:-translate-y-[1px] disabled:bg-slate-400 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                onClick={() => handleDownload(type)}
                disabled={isProcessing || !imageReady}
              >
                {isProcessing
                  ? <Loader2 size={16} className="animate-spin" />
                  : type === 'png' ? <Download size={16} /> : <FileText size={16} />
                }
                {isProcessing ? 'Generating...' : `Download ${type.toUpperCase()}`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}