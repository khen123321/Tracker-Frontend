import React, { useState, useEffect } from 'react';
import api from '../../../api/axios'; 
import styles from './Forms.module.css'; // ✨ Imported the new CSS Module
import toast, { Toaster } from 'react-hot-toast';
import { 
    XCircle, Clock, Edit3, ShieldAlert, 
    Paperclip, Send, AlertTriangle, Calendar 
} from "lucide-react";

// ✨ YOUR PAGE HEADER IMPORT ✨
import PageHeader from "../../../components/PageHeader";

const Forms = () => {
    const [activeTab, setActiveTab] = useState('absent');
    const [dateOfAbsence, setDateOfAbsence] = useState('');
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [attachment, setAttachment] = useState(null);
    
    // Store the specific ID if this is an appeal
    const [logId, setLogId] = useState(null);
    const [loading, setLoading] = useState(false);

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
    const getReasonOptions = () => {
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

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
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

            if (document.getElementById('file-input')) {
                document.getElementById('file-input').value = '';
            }
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.message || 'Failed to submit form. Check your connection.';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Tab Configuration
    const tabs = [
        { id: 'absent', label: 'Absent', icon: XCircle },
        { id: 'half-day', label: 'Half Day', icon: Clock },
        { id: 'overtime', label: 'Overtime', icon: Clock },
        { id: 'correction', label: 'Correction', icon: Edit3 },
        { id: 'appeal', label: 'Appeal', icon: ShieldAlert }
    ];

    const ActiveIcon = tabs.find(t => t.id === activeTab)?.icon || XCircle;

    return (
        <div className={styles.pageContainer}>
            <Toaster position="top-right" />
            
            {/* ✨ PageHeader Component Included Here ✨ */}
            <PageHeader 
                title="Forms & Requests" 
            />

            {/* Main Form Card */}
            <div className={styles.mainCard}>
                
                {/* Icon Card Tabs */}
                <div className={styles.tabsGrid}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setReason(''); 
                                if (tab.id !== 'appeal') setLogId(null); 
                            }}
                            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ''}`}
                        >
                            <tab.icon className={styles.tabIcon} size={24} />
                            <span className={styles.tabLabel}>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Dynamic Form Header */}
                <div className={styles.formHeader}>
                    <div className={styles.iconCircle}>
                        <ActiveIcon size={28} />
                    </div>
                    <div>
                        <h2 className={styles.formTitle}>{activeTab.replace('-', ' ')} Request</h2>
                        <p className={styles.formSubtitle}>
                            {activeTab === 'appeal' 
                                ? 'File an appeal for a rejected attendance record' 
                                : `File an ${activeTab.replace('-', ' ')} and provide supporting reason`}
                        </p>
                    </div>
                </div>

                {activeTab === 'appeal' && logId && (
                    <div className={styles.alertBox}>
                        <AlertTriangle size={20} className={styles.alertIcon} />
                        <div>
                            <strong>Action Required</strong>
                            <p>You are submitting a formal appeal for the rejected record on <b>{dateOfAbsence}</b>. 
                            Please explain the situation and attach physical proof (like a logbook photo).</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Date Input */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            Date of {activeTab.replace('-', ' ')}
                        </label>
                        <div className={styles.inputWrapper}>
                            <input 
                                type="date" 
                                className={`${styles.input} ${logId ? styles.inputReadOnly : ''}`}
                                value={dateOfAbsence}
                                onChange={(e) => setDateOfAbsence(e.target.value)}
                                required
                                readOnly={!!logId} 
                            />
                        </div>
                    </div>

                    {/* Chat Box Style Reason Pills */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Reason</label>
                        <div className={styles.reasonPills}>
                            {getReasonOptions().map((opt) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setReason(opt)}
                                    className={`${styles.pillBtn} ${reason === opt ? styles.pillActive : ''}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                        <input type="hidden" required value={reason} />
                    </div>

                    {/* Additional Details Textarea */}
                    <div className={styles.inputGroup}>
                        <div className={styles.labelWrapper}>
                            <label className={styles.label}>Additional Details</label>
                            <span className={styles.optionalText}>(optional)</span>
                        </div>
                        <textarea 
                            rows="4"
                            placeholder="Provide any additional context or supporting information..."
                            className={styles.textarea}
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                        ></textarea>
                        <p className={styles.hintText}>Min. 10 characters if adding details</p>
                    </div>

                    {/* Dashed Dropzone Attachment Area */}
                    <div className={styles.inputGroup}>
                        <label 
                            htmlFor="file-input"
                            className={`${styles.dropzone} ${attachment ? styles.dropzoneActive : ''}`}
                        >
                            <Paperclip className={styles.dropIcon} size={32} />
                            <p className={styles.dropzoneText}>
                                {attachment ? attachment.name : 'Attach proof document'}
                            </p>
                            <p className={styles.dropzoneSub}>
                                PDF, JPG, PNG — max 10MB
                            </p>
                            <input id="file-input" type="file" style={{ display: 'none' }} accept=".png,.jpg,.jpeg,.pdf" onChange={handleFileChange} />
                        </label>
                    </div>

                    {/* Submit Footer (No Save Draft) */}
                    <div className={styles.submitWrapper}>
                        <button 
                            type="submit"
                            disabled={loading}
                            className={styles.submitBtn}
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