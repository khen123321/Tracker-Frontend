import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, FileText, MapPin, School, Briefcase, Loader2, 
    User, Phone, Mail, AlertCircle 
} from 'lucide-react';
import api from '../api/axios';

// Define the expected props for TypeScript
interface InternProfileDrawerProps {
    internId: string | number | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function InternProfileDrawer({ internId, isOpen, onClose }: InternProfileDrawerProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [logs, setLogs] = useState<any[]>([]);
    const [stats, setStats] = useState({ hours: 0, days: 0, avgIn: '--:--', rate: '0%' });

    useEffect(() => {
        const fetchInternData = async () => {
            // Wait for an ID, and don't fetch if explicitly closed
            if (!internId || isOpen === false) return;

            try {
                setLoading(true);
                setError(null);
                
                // ✨ STEP 1: Fetch Profile using the Intern ID
                const profileRes = await api.get(`/hr/interns/${internId}?t=${Date.now()}`);
                const internData = profileRes.data.intern || profileRes.data;
                setData(internData);

                // ✨ STEP 2: The Sneaky Bug Fix! 
                // We grab the true user_id from the profile so the attendance route works perfectly.
                const correctIdForAttendance = internData.user_id || internId;

                // ✨ STEP 3: Fetch Attendance using the correct User ID
                const attendanceRes = await api.get(`/hr/interns/${correctIdForAttendance}/attendance?t=${Date.now()}`);
                
                setLogs(attendanceRes.data.logs || []);
                setStats(attendanceRes.data.stats || { hours: 0, days: 0, avgIn: '--:--', rate: '0%' });

            } catch (err) {
                console.error("Error fetching intern data:", err);
                setError("Failed to load intern profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchInternData();
    }, [internId, isOpen]);

    const displayHours = useMemo(() => {
        let totalHours = 0;
        if (logs.length > 0) {
            logs.forEach(log => {
                totalHours += parseFloat(log.total_hours || 0);
            });
            return totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1); 
        }
        return stats.hours || 0;
    }, [logs, stats]);

    if (!internId) return null;

    const formatDate = (date: string | null | undefined) => {
        return date 
            ? new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
            : 'N/A';
    };

    const handleViewDoc = async (type: string) => {
        try {
            const res = await api.get(`/hr/interns/${internId}/document/${type}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] }));
            window.open(url, '_blank');
        } catch { 
            alert("This document is not yet uploaded or cannot be found."); 
        }
    };

    const activeStatus = data?.user?.status || data?.status || 'Pending';
    const isActive = activeStatus.toLowerCase() === 'active';

    return (
        <>
            {/* Inline keyframes to match your custom cubic-bezier animation exactly */}
            <style>
                {`
                    @keyframes slideInDrawer {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                    }
                    .animate-slide-in-drawer {
                        animation: slideInDrawer 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                `}
            </style>

            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[8px] z-[9999] flex justify-end" onClick={onClose}>
                <div className="w-[440px] bg-white h-screen flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.1)] animate-slide-in-drawer" onClick={e => e.stopPropagation()}>
                    
                    {/* ─── HEADER SECTION ─── */}
                    <div className="p-[30px_24px] bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_100%)] border-b border-slate-100">
                        <div className="flex justify-between mb-5">
                            <div className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase ${isActive ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                {activeStatus.charAt(0).toUpperCase() + activeStatus.slice(1)}
                            </div>
                            <button className="border-none bg-white p-2 rounded-full cursor-pointer shadow-[0_2px_5px_rgba(0,0,0,0.05)] hover:bg-slate-50 transition-colors" onClick={onClose}>
                                <X size={20} className="text-slate-700" />
                            </button>
                        </div>
                        
                        <div className="flex flex-col items-center">
                            <div>
                                <img 
                                    src={data?.avatar_url || data?.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data?.user?.last_name || 'intern'}`} 
                                    className="w-[90px] h-[90px] rounded-[24px] border-[4px] border-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] object-cover bg-white" 
                                    alt="Intern Avatar" 
                                />
                            </div>
                            <h2 className="text-[22px] font-extrabold text-slate-800 mt-[15px] mb-[5px]">
                                {data?.user?.first_name || 'Unknown'} {data?.user?.last_name || 'Intern'}
                            </h2>
                            <div className="flex items-center gap-[5px] text-[13px] text-slate-500">
                                <Mail size={12} /> <span>{data?.user?.email || 'No email provided'}</span>
                            </div>
                        </div>
                    </div>

                    {/* ─── CONTENT SECTION ─── */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <Loader2 size={32} className="animate-spin mb-2.5" />
                                <p>Accessing Secure Data...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full text-red-500 gap-2">
                                <AlertCircle size={32} />
                                <p>{error}</p>
                            </div>
                        ) : (
                            <>
                                {/* Stats Cards */}
                                <div className="grid grid-cols-2 gap-3 mb-[30px]">
                                    <div className="bg-[#0B1EAE] p-[15px] rounded-[12px] text-white">
                                        <label className="text-[10px] uppercase opacity-80 block">Total Hours</label>
                                        <p className="text-[15px] font-bold mt-[5px]">{displayHours} / {data?.required_hours || 486}</p>
                                    </div>
                                    <div className="bg-[#0B1EAE] p-[15px] rounded-[12px] text-white">
                                        <label className="text-[10px] uppercase opacity-80 block">Start Date</label>
                                        <p className="text-[15px] font-bold mt-[5px] truncate">{formatDate(data?.date_started)}</p>
                                    </div>
                                </div>

                                {/* Academic Details */}
                                <div className="mb-[25px]">
                                    <h4 className="text-[12px] font-bold text-slate-400 uppercase mb-3">Academic Info</h4>
                                    <div className="bg-slate-50 rounded-[12px] p-[15px] border border-slate-100">
                                        <div className="flex items-center gap-[10px] text-[13px] mb-2.5 text-slate-700 last:mb-0">
                                            <School size={14} className="flex-shrink-0" /> <strong>School:</strong> 
                                            <span className="truncate">{data?.school?.name || data?.school || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-[10px] text-[13px] mb-2.5 text-slate-700 last:mb-0">
                                            <Briefcase size={14} className="flex-shrink-0" /> <strong>Course:</strong> 
                                            <span className="truncate">{data?.course || 'BS Information Technology'}</span>
                                        </div>
                                        <div className="flex items-center gap-[10px] text-[13px] mb-2.5 text-slate-700 last:mb-0">
                                            <MapPin size={14} className="flex-shrink-0" /> <strong>Branch:</strong> 
                                            <span className="truncate">{data?.branch?.name || data?.assigned_branch || 'Main Office'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Emergency Contact */}
                                <div className="mb-[25px]">
                                    <h4 className="text-[12px] font-bold text-slate-400 uppercase mb-3">Emergency Contact</h4>
                                    <div className="bg-slate-50 rounded-[12px] p-[15px] border border-slate-100">
                                        <div className="flex items-center gap-[10px] text-[13px] mb-2.5 text-slate-700 last:mb-0">
                                            <User size={14} className="flex-shrink-0" /> 
                                            <span className="truncate">{data?.emergency_name || 'Not Provided'}</span>
                                        </div>
                                        <div className="flex items-center gap-[10px] text-[13px] mb-2.5 text-slate-700 last:mb-0">
                                            <Phone size={14} className="flex-shrink-0" /> 
                                            <span className="truncate">{data?.emergency_number || 'Not Provided'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Required Documents */}
                                <div className="mb-[25px]">
                                    <h4 className="text-[12px] font-bold text-slate-400 uppercase mb-3">Required Documents</h4>
                                    <div className="flex flex-col gap-2">
                                        {[
                                            { label: 'Resume / CV', key: 'resume', exists: data?.has_resume },
                                            { label: 'Memorandum of Agreement', key: 'moa', exists: data?.has_moa },
                                            { label: 'Endorsement Letter', key: 'endorsement', exists: data?.has_endorsement },
                                            { label: 'Non-Disclosure Agreement', key: 'nda', exists: data?.has_nda },
                                            { label: 'Intern Pledge', key: 'pledge', exists: data?.has_pledge }
                                        ].map(doc => (
                                            <div key={doc.key} className="flex justify-between items-center p-3 border border-slate-200 rounded-lg bg-white">
                                                <div className="flex items-center gap-[10px] text-[13px] font-semibold text-slate-700">
                                                    <FileText size={16} className={doc.exists ? 'text-green-600' : 'text-slate-300'} />
                                                    <span>{doc.label}</span>
                                                </div>
                                                {doc.exists ? (
                                                    <button onClick={() => handleViewDoc(doc.key)} className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border-none cursor-pointer hover:bg-blue-100 transition-colors">
                                                        View File
                                                    </button>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400">Missing</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}