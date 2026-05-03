import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
    Building2, GraduationCap, 
    FileText, CheckCircle2, XCircle, Clock, Calendar, ShieldCheck,
    Camera, UploadCloud, Loader2, User, Phone, MapPin, AlertCircle, Check, Eye, RefreshCw
} from 'lucide-react';
import api from '../../../api/axios'; 
import toast, { Toaster } from 'react-hot-toast';

import PageHeader from "../../../components/PageHeader";
import styles from './InternProfile.module.css';

const InternProfile = () => {
    const { id: paramId } = useParams(); 

    const targetId = paramId || 'me';
    const isViewingOwnProfile = !paramId;

    const [intern, setIntern] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [progressStats, setProgressStats] = useState({
        renderedHours: 0,
        requiredHours: 486,
        percent: 0,
        completionDate: 'Calculating...'
    });

    const [weeklyStats, setWeeklyStats] = useState([
        { label: 'M', status: 'present', hours: 8 },
        { label: 'T', status: 'absent', hours: 0 },
        { label: 'W', status: 'present', hours: 7.5 },
        { label: 'T', status: 'present', hours: 8 },
        { label: 'F', status: 'future', hours: 0 } 
    ]);

    const [isPresentToday, setIsPresentToday] = useState(true); 

    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(null); 
    const avatarInputRef = useRef(null);

    useEffect(() => {
        let isMounted = true; 

        const fetchInternDetails = async () => {
            try {
                const response = await api.get(`/hr/interns/${targetId}`);
                const profileData = response.data;
                
                if (isMounted) setIntern(profileData);

                let rendered = 0;
                let required = profileData.intern?.required_hours || 486;
                let completion = 'TBD';

                if (isViewingOwnProfile) {
                    const statsRes = await api.get('/intern/dashboard-stats');
                    rendered = statsRes.data.hoursRendered;
                    required = statsRes.data.totalHoursRequired;
                    completion = statsRes.data.completionDate;
                    
                    if (isMounted) {
                        if (statsRes.data.weeklyStats) setWeeklyStats(statsRes.data.weeklyStats);
                        if (statsRes.data.isPresentToday !== undefined) setIsPresentToday(statsRes.data.isPresentToday);
                    }

                } else {
                    const hrStatsRes = await api.get(`/hr/interns/${targetId}/attendance`);
                    rendered = hrStatsRes.data.stats?.hours || 0;
                    
                    const dateStarted = profileData.intern?.date_started;
                    if (dateStarted) {
                        const start = new Date(dateStarted);
                        start.setDate(start.getDate() + 90); 
                        completion = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    }

                    if (isMounted) {
                        if (hrStatsRes.data.weeklyStats) setWeeklyStats(hrStatsRes.data.weeklyStats);
                        if (hrStatsRes.data.isPresentToday !== undefined) setIsPresentToday(hrStatsRes.data.isPresentToday);
                    }
                }

                const pct = required > 0 ? Math.min(Math.round((rendered / required) * 100), 100) : 0;
                
                if (isMounted) {
                    setProgressStats({
                        renderedHours: rendered,
                        requiredHours: required,
                        percent: pct,
                        completionDate: completion
                    });
                    setError(null);
                }
            } catch (err) {
                console.error("Failed to fetch intern profile:", err);
                if (isMounted) {
                    if (err.response && err.response.status === 403) {
                        setError("You do not have permission to view this profile.");
                    } else {
                        setError("Unable to load profile data.");
                    }
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchInternDetails();

        return () => {
            isMounted = false;
        };
    }, [targetId, isViewingOwnProfile]); 

    const handleAvatarUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            setUploadingAvatar(true);
            const response = await api.post('/intern/upload-avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success("Profile picture updated!");
            
            setIntern(prev => ({
                ...prev,
                intern: { ...prev.intern, avatar_url: response.data.avatar_url }
            }));
        } catch (err) {
            console.error("Avatar upload error:", err);
            toast.error("Failed to upload profile picture.");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleDocumentUpload = async (docKey, event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('document', file);
        formData.append('document_type', docKey);

        try {
            setUploadingDoc(docKey);
            const response = await api.post('/intern/upload-document', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success(`${docKey.replace('_', ' ').toUpperCase()} updated successfully!`);
            
            setIntern(prev => ({
                ...prev,
                intern: { 
                    ...prev.intern, 
                    [`has_${docKey}`]: true,
                    [`${docKey}_url`]: response.data.document_url 
                }
            }));
        } catch (err) {
            console.error("Doc upload error:", err);
            toast.error("Failed to upload document.");
        } finally {
            setUploadingDoc(null);
        }
    };

    const handleViewDocument = (docKey) => {
        const url = intern?.intern?.[`${docKey}_url`];
        if (url) {
            window.open(url, '_blank');
        } else {
            toast.error("Document URL not found. Try re-uploading.");
        }
    };

    if (loading) {
        return (
            <div className={styles.loaderContainer}>
                <Loader2 size={40} className={styles.spinIcon} />
                <p>Loading Profile...</p>
            </div>
        );
    }

    if (error || !intern) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.errorBanner}>
                    <XCircle size={20} /> {error || "Intern not found."}
                </div>
            </div>
        );
    }

    const profile = intern.intern || {};
    
    const schoolName = profile.school?.name || intern.school?.name || intern.school || profile.school_id || 'Not Assigned';
    const courseName = profile.course || intern.course || 'Not Assigned';
    const batchName = profile.batch || intern.batch || 'Current';
    const branchName = profile.branch?.name || intern.branch?.name || intern.assigned_branch || profile.branch_id || 'Not Assigned';
    const departmentName = profile.department?.name || intern.department?.name || intern.assigned_department || profile.department_id || 'Not Assigned';

    const DocCheck = ({ label, docKey, hasDoc, subtext }) => {
        const isUploading = uploadingDoc === docKey;

        return (
            <div className={`${styles.docRow} ${hasDoc ? styles.docRowSuccess : styles.docRowPending}`}>
                <div className={styles.docIconBox}>
                    {hasDoc ? <Check size={18} /> : <AlertCircle size={18} />}
                </div>
                
                <div className={styles.docInfo}>
                    <h4 className={styles.docTitle}>{label}</h4>
                    <p className={styles.docSubtext}>{subtext || (hasDoc ? 'File uploaded' : 'Missing file')}</p>
                </div>

                <div className={styles.docActions}>
                    {hasDoc && (
                        <button 
                            className={styles.viewDocBtn} 
                            onClick={() => handleViewDocument(docKey)}
                            title="View uploaded document"
                        >
                            <Eye size={16} /> <span>View</span>
                        </button>
                    )}

                    {isViewingOwnProfile && (
                        <label className={hasDoc ? styles.reuploadBtnLabel : styles.uploadBtnLabel}>
                            {isUploading ? (
                                <Loader2 size={14} className={styles.spinIcon} />
                            ) : (
                                hasDoc ? <><RefreshCw size={14} /> Re-upload</> : <><UploadCloud size={14} /> Upload</>
                            )}
                            <input 
                                type="file" 
                                className={styles.hiddenInput} 
                                accept=".pdf, .jpg, .jpeg, .png, .doc, .docx" 
                                onChange={(e) => handleDocumentUpload(docKey, e)}
                                disabled={isUploading}
                            />
                        </label>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.pageWrapper}>
            <Toaster position="top-right" />
            
            <PageHeader 
                title="Intern Profile" 
                subtitle="View and manage intern information and documents." 
            />

            <div className={styles.profileLayout}>
                
                {!isViewingOwnProfile && (
                    <div className={styles.hrActionsRow}>
                        <button className={styles.exportBtn}>Export Report</button>
                    </div>
                )}

                {/* ─── TOP ROW: IDENTITY BANNER ─── */}
                <div className={styles.identityBanner}>
                    <div className={styles.bannerBackground}></div>
                    
                    <div className={styles.bannerContent}>
                        <div className={styles.avatarWrapper}>
                            {uploadingAvatar && (
                                <div className={styles.avatarLoadingOverlay}>
                                    <Loader2 className={styles.spinIcon} size={24} color="white" />
                                </div>
                            )}
                            <img 
                                src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${intern.first_name + intern.id}`} 
                                alt="avatar" 
                                className={styles.avatarImg}
                            />
                            {isViewingOwnProfile && (
                                <div className={styles.avatarHoverOverlay} onClick={() => avatarInputRef.current.click()}>
                                    <Camera size={20} color="white" />
                                </div>
                            )}
                            <input 
                                type="file" 
                                accept="image/*" 
                                className={styles.hiddenInput}
                                ref={avatarInputRef}
                                onChange={handleAvatarUpload}
                            />
                        </div>

                        <div className={styles.identityInfo}>
                            <h2 className={styles.profileName}>{intern.first_name} {intern.last_name}</h2>
                            <p className={styles.profileRole}>
                                OJT Trainee <span className={styles.dot}>•</span> {departmentName}
                            </p>
                            
                            <div className={styles.identityBadges}>
                                <span className={`${styles.statusBadge} ${isPresentToday ? styles.statusActive : styles.statusAbsent}`}>
                                    <div className={styles.statusDot}></div> {isPresentToday ? 'PRESENT' : 'ABSENT'}
                                </span>
                                <span className={styles.courseBadge}>
                                    {courseName}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── MIDDLE ROW: PROGRESS & ACADEMICS ─── */}
                <div className={styles.middleGrid}>
                    
                    {/* Progress Card */}
                    <div className={`${styles.card} ${styles.progressCard}`}>
                        <div className={styles.cardHeader}>
                            <Clock size={16} className={styles.headerIcon} /> OJT PROGRESS
                        </div>
                        
                        <div className={styles.progressMain}>
                            <div className={styles.hoursDisplay}>
                                <span className={styles.hoursRendered}>{progressStats.renderedHours}</span>
                                <span className={styles.hoursRequired}>/ {progressStats.requiredHours} hrs</span>
                            </div>
                            <span className={styles.percentText}>{progressStats.percent}%</span>
                        </div>
                        
                        <div className={styles.progressTrack}>
                            <div className={styles.progressFill} style={{ width: `${progressStats.percent}%` }}></div>
                        </div>
                        
                        <div className={styles.completionText}>
                            Est. completion <span className={styles.highlightDate}>{progressStats.completionDate}</span>
                        </div>

                        {/* M-F Dynamic Chart */}
                        <div className={styles.weeklyChart}>
                            {weeklyStats.map((day, idx) => {
                                let barClass = styles.dayInactive; 
                                if (day.status === 'present') barClass = styles.dayActive; 
                                if (day.status === 'absent') barClass = styles.dayAbsent; 

                                let height = '20%'; 
                                if (day.status === 'present') {
                                    height = `${Math.min((day.hours / 8) * 100, 100)}%`;
                                }

                                return (
                                    <div key={idx} className={styles.dayColumn}>
                                        <div className={`${styles.dayBar} ${barClass}`} style={{ height: height }}></div>
                                        <span className={styles.dayLabel}>{day.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Academics Card */}
                    <div className={`${styles.card} ${styles.academicCard}`}>
                        <div className={styles.cardHeader}>
                            <GraduationCap size={16} className={styles.headerIcon} /> ACADEMIC & PLACEMENT
                        </div>

                        <div className={styles.academicGrid}>
                            <div className={styles.detailItemFull}>
                                <label>SCHOOL / UNIVERSITY</label>
                                <p>{schoolName}</p>
                            </div>
                            
                            <div className={styles.detailItem}>
                                <label>COURSE & BATCH</label>
                                <p>{courseName}</p>
                                <span className={styles.subtext}>Current • {batchName}</span>
                            </div>
                            
                            <div className={styles.detailItem}>
                                <label>DEPARTMENT</label>
                                <p>{departmentName}</p>
                                <span className={styles.subtext}>Technology Division</span>
                            </div>
                            
                            <div className={styles.detailItem}>
                                <label>ASSIGNED BRANCH</label>
                                <p className={styles.flexVal}><Building2 size={14}/> {branchName}</p>
                            </div>
                            
                            <div className={styles.detailItem}>
                                <label>START DATE</label>
                                <p className={styles.flexVal}><Calendar size={14}/> {profile.date_started ? new Date(profile.date_started).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'}) : 'Pending'}</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ─── BOTTOM ROW: EMERGENCY & DOCUMENTS ─── */}
                <div className={styles.bottomGrid}>
                    
                    {/* Emergency Contact Card */}
                    <div className={`${styles.card} ${styles.emergencyCard}`}>
                        <div className={styles.cardHeader}>
                            <ShieldCheck size={16} className={styles.headerIconAlert} /> EMERGENCY CONTACT
                        </div>

                        <div className={styles.emergencyGrid}>
                            <div className={styles.contactMainBlock}>
                                <User size={16} className={styles.contactIcon} />
                                <div>
                                    <label>CONTACT NAME</label>
                                    <p>{profile.emergency_name || 'Not Provided'}</p>
                                </div>
                            </div>
                            
                            <div className={styles.contactSubBlocks}>
                                <div className={styles.contactBlock}>
                                    <Phone size={16} className={styles.contactIcon} />
                                    <div>
                                        <label>PHONE</label>
                                        <p>{profile.emergency_number || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className={styles.contactBlock}>
                                    <MapPin size={16} className={styles.contactIcon} />
                                    <div>
                                        <label>ADDRESS</label>
                                        <p>{profile.emergency_address || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Documents Card */}
                    <div className={`${styles.card} ${styles.documentsCard}`}>
                        <div className={styles.cardHeader}>
                            <FileText size={16} className={styles.headerIcon} /> ONBOARDING DOCUMENTS
                        </div>

                        <div className={styles.documentsList}>
                            <DocCheck label="Resume / CV" docKey="resume" hasDoc={profile.has_resume} subtext="Standard job application format" />
                            <DocCheck label="Memorandum of Agreement" docKey="moa" hasDoc={profile.has_moa} subtext="MOA • Signed by school" />
                            <DocCheck label="School Endorsement Letter" docKey="endorsement" hasDoc={profile.has_endorsement} subtext="Required before Day 5" />
                            <DocCheck label="Non-Disclosure Agreement" docKey="nda" hasDoc={profile.has_nda} subtext="NDA • Company legal form" />
                            <DocCheck label="Intern Pledge" docKey="pledge" hasDoc={profile.has_pledge} subtext="Commitment to excellence" />
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default InternProfile;