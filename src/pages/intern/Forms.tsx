import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; 
import toast, { Toaster } from 'react-hot-toast';
import { 
    XCircle, Clock, Edit3, ShieldAlert, 
    Paperclip, Send, AlertTriangle 
} from "lucide-react";

// ✨ YOUR PAGE HEADER IMPORT ✨
import PageHeader from "../../components/layout/PageHeader";

// ─── TYPESCRIPT INTERFACES ───
interface TabItem {
    id: string;
    label: string;
    icon: React.ElementType;
}

const Forms: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('absent');
    const [dateOfAbsence, setDateOfAbsence] = useState<string>('');
    const [reason, setReason] = useState<string>('');
    const [details, setDetails] = useState<string>('');
    const [attachment, setAttachment] = useState<File | null>(null);
    
    // Store the specific ID if this is an appeal
    const [logId, setLogId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // ─── ✨ BULLETPROOF AUTO-FILL LOGIC ✨ ───
    useEffect(() => {
        const savedLogId = sessionStorage.getItem('appeal_logId');
        const savedLogDate = sessionStorage.getItem('appeal_logDate');

        if (savedLogId) {
            setActiveTab('appeal'); 
            setLogId(savedLogId);
            
            if (savedLogDate) {
                const d = new Date(savedLogDate);
                if (!isNaN(d.getTime())) {
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    setDateOfAbsence(`${year}-${month}-${day}`);
                }
            }
            
            sessionStorage.removeItem('appeal_logId');
            sessionStorage.removeItem('appeal_logDate');
        }
    }, []);

    // ─── DYNAMIC REASON PILLS (Chat Box Style) ───
    const getReasonOptions = (): string[] => {
        switch (activeTab) {
            case 'overtime':
                return ['Extra workload', 'Project deadline', 'Covering shift', 'Other'];
            case 'correction':
                return ['Forgot to clock in', 'System error', 'Network issue', 'Other'];
            case 'appeal':
                return ['Location error', 'Camera blurry', 'Wrong branch', 'Other'];
            default: // absent & half-day
                return ['Illness', 'Family emergency', 'Medical appointment', 'Personal matter', 'Other'];
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            
            //  THE FIX: Strictly enforce the 10MB limit
            const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Megabytes in bytes
            if (file.size > MAX_FILE_SIZE) {
                toast.error("File is too large! Please upload a file under 10MB.");
                e.target.value = ''; // Reset the input
                setAttachment(null);
                return;
            }
            
            setAttachment(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!reason) {
            toast.error("Please select a reason.");
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();

            if (activeTab === 'appeal' && logId) {
                const combinedText = details ? `${reason}\n\nAdditional Details: ${details}` : reason;
                formData.append('appeal_text', combinedText);
                if (attachment) formData.append('appeal_file', attachment);

                await api.post(`/attendance/logs/${logId}/appeal`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                formData.append('type', activeTab);
                formData.append('date_of_absence', dateOfAbsence); 
                formData.append('reason', reason);
                formData.append('additional_details', details);
                if (attachment) formData.append('attachment', attachment);

                await api.post('/intern/forms/submit', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            toast.success("Request submitted successfully!");
            
            setDateOfAbsence('');
            setReason('');
            setDetails('');
            setAttachment(null);
            setLogId(null); 

            const fileInput = document.getElementById('file-input') as HTMLInputElement;
            if (fileInput) {
                fileInput.value = '';
            }
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.message || 'Failed to submit form. Check your connection.';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Tab Configuration
    const tabs: TabItem[] = [
        { id: 'absent', label: 'Absent', icon: XCircle },
        { id: 'half-day', label: 'Half Day', icon: Clock },
        { id: 'overtime', label: 'Overtime', icon: Clock },
        { id: 'correction', label: 'Correction', icon: Edit3 },
        { id: 'appeal', label: 'Appeal', icon: ShieldAlert }
    ];

    const ActiveIcon = tabs.find(t => t.id === activeTab)?.icon || XCircle;

    return (
        // ✨ Added p-[12px] padding to the main wrapper
        <div className="bg-slate-100 min-h-screen font-sans flex flex-col gap-[5px] p-[12px]">
            <Toaster position="top-right" />
            
            {/* ✨ Animation styles for the shiny tabs */}
            <style>{`
                @keyframes shine {
                    0% { left: -150%; }
                    60% { left: 200%; }
                    100% { left: 200%; }
                }
                .animate-shine {
                    position: relative;
                    overflow: hidden; 
                }
                .animate-shine::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -150%;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
                    transform: skewX(-20deg); 
                    animation: shine 5s ease-in-out infinite; 
                    pointer-events: none; 
                }
            `}</style>

            {/* ✨ PageHeader Component Included Here ✨ */}
            <PageHeader title="Forms & Requests" />

            {/* Main Form Card */}
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 md:p-8 border border-slate-200">
                
                {/* ✨ Icon Card Tabs (Now with Blue Gradient and Shine) ✨ */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                setActiveTab(tab.id);
                                setReason(''); 
                                if (tab.id !== 'appeal') setLogId(null); 
                            }}
                            className={`flex flex-col items-center justify-center p-4 rounded-[14px] border-2 cursor-pointer transition-all duration-200 last:col-span-2 md:last:col-span-1 ${
                                activeTab === tab.id 
                                    ? 'border-transparent text-white animate-shine shadow-md' 
                                    : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-500'
                            }`}
                            style={activeTab === tab.id ? { background: 'linear-gradient(90deg, #0B1EAE 0%, #152286 23.56%, #0D1767 63.46%, #050C48 100%)' } : {}}
                        >
                            <tab.icon className={`mb-2 relative z-10 transition-colors duration-200 ${activeTab === tab.id ? 'text-white' : ''}`} size={24} />
                            <span className="text-[12px] font-bold uppercase tracking-[0.5px] relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Dynamic Form Header */}
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100 mb-6">
                    {/* Updated this icon background to match the blue theme */}
                    <div className="p-3 bg-blue-50 text-[#0B1EAE] rounded-full flex items-center justify-center shrink-0">
                        <ActiveIcon size={28} />
                    </div>
                    <div>
                        <h2 className="text-[20px] font-extrabold text-slate-900 capitalize m-0 mb-1">
                            {activeTab.replace('-', ' ')} Request
                        </h2>
                        <p className="text-[13px] text-slate-500 m-0">
                            {activeTab === 'appeal' 
                                ? 'File an appeal for a rejected attendance record' 
                                : `File an ${activeTab.replace('-', ' ')} and provide supporting reason`}
                        </p>
                    </div>
                </div>

                {activeTab === 'appeal' && logId && (
                    <div className="flex gap-3 items-start p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 mb-6 text-[14px] leading-relaxed">
                        <AlertTriangle size={20} className="shrink-0 text-blue-500 mt-0.5" />
                        <div>
                            <strong className="block text-[15px] mb-1 text-blue-900">Action Required</strong>
                            <p className="m-0">
                                You are submitting a formal appeal for the rejected record on <b>{dateOfAbsence}</b>. 
                                Please explain the situation and attach physical proof (like a logbook photo).
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Date Input */}
                    <div className="flex flex-col gap-2 mb-6">
                        <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.8px]">
                            Date of {activeTab.replace('-', ' ')}
                        </label>
                        <div className="w-full max-w-[300px]">
                            <input 
                                type="date" 
                                className={`w-full p-3 border border-slate-300 rounded-xl text-[14px] text-slate-700 outline-none transition-all focus:border-yellow-500 focus:ring-[3px] focus:ring-yellow-500/15 ${logId ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'}`}
                                value={dateOfAbsence}
                                onChange={(e) => setDateOfAbsence(e.target.value)}
                                required
                                readOnly={!!logId} 
                            />
                        </div>
                    </div>

                    {/* Chat Box Style Reason Pills */}
                    <div className="flex flex-col gap-2 mb-6">
                        <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.8px]">Reason</label>
                        <div className="flex flex-wrap gap-2">
                            {getReasonOptions().map((opt) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setReason(opt)}
                                    className={`px-[18px] py-2 border rounded-full text-[14px] font-medium cursor-pointer transition-all duration-200 ${
                                        reason === opt 
                                            ? 'border-yellow-500 bg-yellow-50 text-yellow-800' 
                                            : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                        <input type="hidden" required value={reason} />
                    </div>

                    {/* Additional Details Textarea */}
                    <div className="flex flex-col gap-2 mb-6">
                        <div className="flex items-center gap-1.5">
                            <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.8px]">Additional Details</label>
                            <span className="text-[12px] italic text-slate-400">(optional)</span>
                        </div>
                        <textarea 
                            rows={4}
                            placeholder="Provide any additional context or supporting information..."
                            className="w-full p-4 border border-slate-300 rounded-xl text-[14px] text-slate-700 outline-none resize-none min-h-[100px] transition-all focus:border-yellow-500 focus:ring-[3px] focus:ring-yellow-500/15 placeholder:text-slate-400"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                        ></textarea>
                        <p className="text-[11px] text-slate-400 font-mono m-0">Min. 10 characters if adding details</p>
                    </div>

                    {/* Dashed Dropzone Attachment Area */}
                    <div className="flex flex-col gap-2 mb-6">
                        <label 
                            htmlFor="file-input"
                            className={`flex flex-col items-center justify-center h-[130px] border-2 border-dashed rounded-[14px] cursor-pointer transition-all duration-200 ${
                                attachment 
                                    ? 'border-yellow-400 bg-yellow-50' 
                                    : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                            }`}
                        >
                            <Paperclip className={`mb-2 transition-colors duration-200 ${attachment ? 'text-yellow-500' : 'text-slate-400'}`} size={32} />
                            <p className="text-[14px] font-semibold text-slate-700 m-0 mb-1">
                                {attachment ? attachment.name : 'Attach proof document'}
                            </p>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.5px] m-0">
                                PDF, JPG, PNG — max 10MB
                            </p>
                            <input id="file-input" type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf" onChange={handleFileChange} />
                        </label>
                    </div>

                    {/* Submit Footer */}
                    <div className="flex justify-end pt-6 border-t border-slate-100 mt-8">
                        <button 
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-7 py-3.5 bg-yellow-500 text-white font-bold text-[14px] rounded-xl cursor-pointer transition-all duration-200 shadow-[0_2px_4px_rgba(234,179,8,0.2)] hover:bg-yellow-600 hover:-translate-y-px hover:shadow-[0_4px_6px_rgba(234,179,8,0.3)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_2px_4px_rgba(234,179,8,0.2)]"
                        >
                            <Send size={18} />
                            {loading ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Forms;