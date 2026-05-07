import React, { useState, useEffect, useCallback } from 'react';
import { 
  Camera, MapPin, AlertTriangle, 
  XCircle, X, MessageSquare, ChevronDown, 
  Clock, Info, Search 
} from 'lucide-react';
import api from "../../api/axios";
import toast, { Toaster } from 'react-hot-toast';
import PageHeader from '../../components/layout/PageHeader';

// ─── TYPES ───
interface SkProps {
  w?: string;
  h?: string;
  r?: string;
}

interface RejectModal {
  show: boolean;
  logId: number | null;
  slot: string | null;
  reason: string;
}

interface AttendanceLog {
  id: number;
  intern_name: string;
  department: string;
  is_flagged: number;
  image_in: string | null;
  lunch_out_selfie: string | null;
  lunch_in_selfie: string | null;
  image_out: string | null;
  am_in_status: string | null;
  lunch_out_status: string | null;
  lunch_in_status: string | null;
  pm_out_status: string | null;
  am_in_attempts: number;
  lunch_out_attempts: number;
  lunch_in_attempts: number;
  pm_out_attempts: number;
  flag_reason: string | null;
}

// ─── CUSTOM KEYFRAMES ───
const customStyles = `
  @keyframes shimmer {
    0%   { background-position: -700px 0; }
    100% { background-position:  700px 0; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .skel-shimmer {
    background: linear-gradient(90deg, #e8ecf2 25%, #f4f6fa 50%, #e8ecf2 75%);
    background-size: 700px 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    flex-shrink: 0;
  }
  .anim-fade-in  { animation: fadeIn  0.2s ease; }
  .anim-slide-up { animation: slideUp 0.2s ease-out; }
`;

// ─── SKELETON PRIMITIVES ───
const Sk = ({ w = '100%', h = '16px', r = '8px' }: SkProps) => (
  <div className="skel-shimmer" style={{ width: w, height: h, borderRadius: r }} />
);

// ─── FULL PAGE SKELETON SCREEN ───
function CameraVerificationSkeleton() {
  return (
    <div className="p-3 flex flex-col gap-[5px] bg-slate-50 min-h-screen font-sans text-slate-900">
      <style>{customStyles}</style>

      {/* Header Skeleton */}
      <div className="flex justify-between px-5 py-[14px] bg-white rounded-[10px] border border-[#e8eaf0]">
        <Sk w="240px" h="26px" r="6px" />
        <div className="flex gap-3">
          <Sk w="36px" h="36px" r="8px" />
          <Sk w="210px" h="36px" r="999px" />
        </div>
      </div>

      {/* Unified Controls Box Skeleton */}
      <div className="bg-white rounded-[10px] border border-[#e8eaf0] p-5 flex flex-col gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <Sk w="350px" h="16px" />
          <div className="flex gap-3">
            <Sk w="220px" h="36px" r="8px" />
            <Sk w="140px" h="36px" r="8px" />
            <Sk w="120px" h="36px" r="8px" />
          </div>
        </div>
        <Sk w="100%" h="46px" r="8px" />
      </div>

      {/* List Layout Skeleton */}
      <div className="flex flex-col gap-[5px] w-full">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-[10px] border border-[#e8eaf0] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5">
            <Sk h="60px" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───
export default function CameraVerification() {
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const [loading, setLoading]         = useState<boolean>(true);

  const [logs, setLogs]               = useState<AttendanceLog[]>([]);
  const [filter, setFilter]           = useState<string>('all');
  const [searchDate, setSearchDate]   = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [timeLeft, setTimeLeft]           = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const [rejectModal, setRejectModal] = useState<RejectModal>({
    show: false, logId: null, slot: null, reason: ''
  });

  const BACKEND_HOST = window.location.hostname;
  const STORAGE_URL  = `http://${BACKEND_HOST}:8000/storage/`;

  useEffect(() => {
    const calculateTime = () => {
      const [year, month, day] = searchDate.split('-');
      const targetDate = new Date(Number(year), Number(month) - 1, Number(day));
      const dayOfWeek      = targetDate.getDay();
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7;

      targetDate.setDate(targetDate.getDate() + daysUntilFriday);
      targetDate.setHours(23, 59, 59, 999);

      const now        = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft('Photos expired & permanently deleted');
        return;
      }

      const days    = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours   = Math.floor((difference / (1000 * 60 * 60)) % 24);
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
    } catch (error: any) {
      const backendError = error.response?.data?.error || error.response?.data?.message;
      toast.error(backendError ? `Server Error: ${backendError}` : 'Could not process rejection.');
    }
  };

  const getImageUrl = (path: string | null): string | null => {
    if (!path) return null;
    let cleanPath = path.replace(/^public\//, '');
    cleanPath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
    return `${STORAGE_URL}${cleanPath}`;
  };

  const toggleAccordion = (id: number) => {
    setExpandedLogId(prevId => prevId === id ? null : id);
  };

  const displayedLogs = logs.filter(log =>
    log.intern_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (initialLoad) return <CameraVerificationSkeleton />;

  return (
    <div className="p-3 flex flex-col gap-[5px] bg-slate-50 min-h-screen font-sans text-slate-900">
      <style>{customStyles}</style>
      <Toaster position="top-right" />

      {/* ✨ PAGE HEADER */}
      <PageHeader title="Camera Verification" />

      {/* ✨ UNIFIED CONTROLS & PRIVACY BOX */}
      <div className="bg-white rounded-[10px] border border-[#e8eaf0] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4">

        {/* Top Row: Subtitle & Filters */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <p className="m-0 text-slate-500 text-sm">
            Inspect individual selfies and manage 3-strike rejections.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-auto">

            {/* Search */}
            <div className="relative flex items-center w-full sm:w-auto">
              <Search size={18} className="absolute left-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search intern..."
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[13px] font-medium outline-none text-slate-800 bg-white transition-all w-full sm:w-[220px] focus:border-[#0B1EAE] focus:ring-2 focus:ring-[#0B1EAE]/10"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
            </div>

            <input
              type="date"
              className="px-3 py-2 border border-slate-200 rounded-lg text-[13px] font-medium outline-none text-slate-800 bg-white transition-all cursor-pointer w-full sm:w-auto focus:border-[#0B1EAE] focus:ring-2 focus:ring-[#0B1EAE]/10"
              value={searchDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchDate(e.target.value)}
            />

            <select
              className="px-3 py-2 border border-slate-200 rounded-lg text-[13px] font-medium outline-none text-slate-800 bg-white transition-all cursor-pointer w-full sm:w-auto focus:border-[#0B1EAE] focus:ring-2 focus:ring-[#0B1EAE]/10"
              value={filter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter(e.target.value)}
            >
              <option value="all">All Logs</option>
              <option value="flagged">Flagged Only</option>
            </select>
          </div>
        </div>

        {/* Bottom Row: Privacy Banner */}
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg text-blue-900 text-sm">
          <div className="flex items-center gap-2">
            <Info size={18} color="#3b82f6" />
            <span>
              <strong>Privacy Policy:</strong> Verification photos are automatically deleted every Friday at midnight.
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 font-semibold"
            style={{ color: timeLeft.includes('expired') ? '#dc2626' : '#0B1EAE' }}
          >
            <Clock size={16} />
            {timeLeft}
          </div>
        </div>
      </div>

      {/* ✨ LIST OR EMPTY STATE */}
      {loading ? (
        <div className="flex flex-col gap-[5px] w-full">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-[10px] border border-[#e8eaf0] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5">
              <Sk h="60px" />
            </div>
          ))}
        </div>
      ) : displayedLogs.length === 0 ? (
        <div className="bg-white rounded-[10px] border border-dashed border-slate-300 p-10 flex flex-col items-center justify-center text-center flex-1">
          <div className="bg-slate-50 text-slate-300 w-16 h-16 rounded-full flex items-center justify-center mb-3">
            {searchQuery ? <Search size={40} /> : <Camera size={40} />}
          </div>
          <h3 className="m-0 mb-1 text-slate-700 text-base font-semibold">No records found</h3>
          <p className="m-0 text-slate-400 text-[13px]">
            {searchQuery ? `No interns match "${searchQuery}"` : "There are no verification logs for this date."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-[5px] w-full">
          {displayedLogs.map(log => {
            const isExpanded = expandedLogId === log.id;

            return (
              <div
                key={log.id}
                className="bg-white rounded-[10px] border border-[#e8eaf0] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden transition-colors hover:border-slate-300 w-full"
              >
                {/* ACCORDION HEADER */}
                <div
                  onClick={() => toggleAccordion(log.id)}
                  className="px-5 py-[14px] flex justify-between items-center bg-white cursor-pointer"
                  style={{ borderBottom: isExpanded ? '1px solid #f1f5f9' : 'none' }}
                >
                  <div>
                    <h3 className="m-0 mb-0.5 text-[15px] font-bold text-slate-900">{log.intern_name}</h3>
                    <p className="m-0 text-xs text-slate-500 flex items-center gap-1">
                      <MapPin size={14} /> {log.department}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={
                      log.is_flagged === 1
                        ? "bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center tracking-[0.02em]"
                        : "bg-green-50 text-green-600 border border-green-200 px-2.5 py-1 rounded-md text-[11px] font-semibold"
                    }>
                      {log.is_flagged === 1 ? 'Needs Attention' : 'Clean'}
                    </div>
                    <ChevronDown
                      size={20}
                      className="text-slate-500 transition-transform duration-300"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </div>
                </div>

                {/* HIDDEN CONTENT */}
                {isExpanded && (
                  <div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pb-5 bg-white">

                      {[
                        { slotId: 'am_in',     label: 'AM In',     photo: log.image_in,        status: log.am_in_status,     attempts: log.am_in_attempts     },
                        { slotId: 'lunch_out', label: 'Lunch Out', photo: log.lunch_out_selfie, status: log.lunch_out_status, attempts: log.lunch_out_attempts },
                        { slotId: 'lunch_in',  label: 'Lunch In',  photo: log.lunch_in_selfie,  status: log.lunch_in_status,  attempts: log.lunch_in_attempts  },
                        { slotId: 'pm_out',    label: 'PM Out',    photo: log.image_out,        status: log.pm_out_status,    attempts: log.pm_out_attempts    }
                      ].map((slot, idx) => (
                        <div key={idx} className="flex flex-col gap-2">

                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] m-0">
                              {slot.label}
                            </span>
                            {slot.status === 'rejected' && (
                              <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded uppercase">
                                Strike {slot.attempts}/3
                              </span>
                            )}
                            {slot.status === 'failed' && (
                              <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">
                                Locked
                              </span>
                            )}
                          </div>

                          <div
                            className={`group w-full aspect-[4/3] bg-slate-50 rounded-md border border-slate-200 overflow-hidden relative cursor-zoom-in flex items-center justify-center
                              ${slot.status === 'failed' ? 'border-2 !border-red-400 grayscale opacity-70' : ''}`}
                            onClick={() => slot.photo && setSelectedImage(getImageUrl(slot.photo))}
                          >
                            {slot.photo ? (
                              <img
                                src={getImageUrl(slot.photo) ?? undefined}
                                alt={`${slot.label} Selfie`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-1.5 text-slate-300 text-[11px] font-medium">
                                <Camera size={20} />
                                <span>No Image</span>
                              </div>
                            )}
                          </div>

                          {slot.photo && (!slot.status || slot.status === 'pending' || slot.status === 'rejected') && (
                            <div className="grid grid-cols-1 gap-1 mt-1">
                              <button
                                className="bg-rose-50 text-rose-600 border border-rose-200 p-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors hover:bg-rose-100"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  setRejectModal({ show: true, logId: log.id, slot: slot.slotId, reason: '' });
                                }}
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {log.flag_reason && (
                      <div className="mx-5 mb-4 px-3 py-2.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-md flex items-start gap-2">
                        <MessageSquare size={16} className="shrink-0 text-amber-400" />
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
        <div
          className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[1000] p-6 backdrop-blur-sm anim-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden shadow-2xl"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 bg-slate-900/80 border border-white/20 rounded-full text-white cursor-pointer w-9 h-9 flex items-center justify-center transition-all hover:bg-red-500 hover:border-red-500 hover:scale-105"
              onClick={() => setSelectedImage(null)}
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage}
              alt="Full Size Verification"
              className="w-auto h-auto max-w-[90vw] max-h-[90vh] block object-contain"
            />
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModal.show && (
        <div
          className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[1000] p-6 backdrop-blur-sm anim-fade-in"
          onClick={() => setRejectModal({ show: false, logId: null, slot: null, reason: '' })}
        >
          <div
            className="w-full max-w-[440px] bg-white rounded-xl overflow-hidden shadow-lg anim-slide-up"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-[#fffbfa]">
              <h2 className="text-base font-bold text-rose-600 m-0 flex items-center gap-2">
                <AlertTriangle size={20} /> Reject Photo
              </h2>
              <button
                className="bg-transparent border-none text-slate-500 cursor-pointer flex items-center justify-center p-1 rounded-md transition-colors hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setRejectModal({ show: false, logId: null, slot: null, reason: '' })}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <div className="bg-orange-50 border border-orange-100 text-orange-700 px-3 py-2.5 rounded-md text-xs font-semibold flex items-start gap-2 mb-4 leading-snug">
                <AlertTriangle size={16} />
                <span>If an intern's photo is rejected 3 times, their shift slot will be permanently locked and marked absent.</span>
              </div>

              <label className="text-[13px] font-semibold text-slate-700 mb-1.5 block">
                Note to Intern:
              </label>
              <textarea
                className="w-full p-3 rounded-lg border border-slate-200 text-[13px] text-slate-800 resize-none outline-none transition-all bg-slate-50 box-border focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:bg-white"
                placeholder="Briefly explain why... (e.g., Incorrect uniform, blurry photo, location mismatch)"
                value={rejectModal.reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setRejectModal({ ...rejectModal, reason: e.target.value })
                }
                rows={4}
              />

              <div className="flex gap-2.5 mt-5">
                <button
                  className="flex-1 p-2.5 rounded-md border border-slate-200 bg-white text-slate-600 text-[13px] font-semibold cursor-pointer transition-colors hover:bg-slate-100"
                  onClick={() => setRejectModal({ show: false, logId: null, slot: null, reason: '' })}
                >
                  Cancel
                </button>
                <button
                  className="flex-[2] p-2.5 rounded-md border-none bg-rose-600 text-white text-[13px] font-semibold cursor-pointer transition-colors hover:bg-rose-700"
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