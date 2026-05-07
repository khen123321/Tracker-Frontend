import React, { useRef, useState } from 'react';
import { X, Download, FileText, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import CertificateTemplate from './CertificateTemplate';

// Define the shape of your intern data based on how it's used
interface InternData {
  name?: string;
  course?: string;
  school?: string;
  department?: string;
  rawData?: {
    course?: string;
    school?: string;
    total_hours?: number;
    assigned_department?: string;
    gender?: string;
    intern?: {
      date_started?: string;
    };
  };
}

interface GenerateCertificateModalProps {
  intern?: InternData | null;
  onClose: () => void;
}

export default function GenerateCertificateModal({ intern, onClose }: GenerateCertificateModalProps) {
  const scaleWrapperRef = useRef<HTMLDivElement>(null);
  const certRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!intern) return null;

  // Map the raw data to fit what your CertificateTemplate is looking for
  const certificateData = {
    name: intern.name ? intern.name.toUpperCase() : 'INTERN NAME',
    course: intern.course || intern.rawData?.course || 'Bachelor of Science in Information Technology',
    school: intern.school || intern.rawData?.school || 'University of Science and Technology of Southern Philippines',
    hours: intern.rawData?.total_hours || 600,
    dateStarted: intern.rawData?.intern?.date_started 
      ? new Date(intern.rawData.intern.date_started).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
      : 'Start Date',
    dateCompleted: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    department: intern.department || intern.rawData?.assigned_department || 'Information Technology Department',
    gender: intern.rawData?.gender || 'male'
  };

  // The HD Flash Trick
  const captureAndDownload = async (type: 'png' | 'pdf') => {
    try {
      setIsProcessing(true);
      const wrapper = scaleWrapperRef.current;
      
      if (!wrapper || !certRef.current) return;

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
        link.download = `${certificateData.name.replace(/ /g, '_')}_Certificate.png`;
        link.click();
      } else if (type === 'pdf') {
        const pdf = new jsPDF('landscape', 'px', [1123, 794]);
        pdf.addImage(dataImage, 'PNG', 0, 0, 1123, 794);
        pdf.save(`${certificateData.name.replace(/ /g, '_')}_Certificate.pdf`);
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[900px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Certificate Preview</h2>
          <button 
            className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50" 
            onClick={onClose} 
            disabled={isProcessing}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex justify-center bg-slate-300 p-6 rounded-lg overflow-hidden m-6">
          
          <div 
            ref={scaleWrapperRef} 
            className="origin-top mb-[-300px] transition-transform duration-0"
            style={{ transform: 'scale(0.60)' }} // Kept as inline style so the JS screenshot trick overrides it cleanly
          >
            
            {/* HD Target (Hidden) */}
            <div className="absolute top-[-9999px] left-[-9999px] -z-10">
              <CertificateTemplate intern={certificateData} forwardRef={certRef} />
            </div>

            {/* Visual Preview */}
            <CertificateTemplate intern={certificateData} />

          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button 
            className="px-4 py-2 font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={onClose} 
            disabled={isProcessing}
          >
            Cancel
          </button>
          
          <div className="flex gap-3">
            <button 
              className="flex items-center gap-2 px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={() => captureAndDownload('png')} 
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {isProcessing ? 'Generating...' : 'Download PNG'}
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={() => captureAndDownload('pdf')} 
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