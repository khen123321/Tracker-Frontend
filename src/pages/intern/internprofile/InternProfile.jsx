import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Building2, GraduationCap, 
    FileText, CheckCircle2, XCircle, Clock, Calendar, ShieldCheck 
} from 'lucide-react';
import api from '../../../api/axios'; 
import styles from './InternProfile.module.css';

const InternProfile = () => {
    // 1. Get ID from URL (This exists when an HR Admin clicks a row in the table)
    const { id: paramId } = useParams(); 
    const navigate = useNavigate();
    
    // 2. The Smart Fetch Logic
    const targetId = paramId || 'me';
    const isViewingOwnProfile = !paramId;

    const [intern, setIntern] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInternDetails = async () => {
            try {
                const response = await api.get(`/hr/interns/${targetId}`);
                setIntern(response.data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch intern profile:", err);
                if (err.response && err.response.status === 403) {
                    setError("You do not have permission to view this profile.");
                } else {
                    setError("Unable to load profile data.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchInternDetails();
    }, [targetId]); 

    // ─── LOADING STATE ───
    if (loading) {
        return (
            <div className={styles.loaderContainer}>
                <div className={styles.skeletonGroup}>
                    <div className={styles.skelAvatar}></div>
                    <div className={styles.skelTitle}></div>
                    <div className={styles.skelSub}></div>
                </div>
            </div>
        );
    }

    // ─── ERROR STATE ───
    if (error || !intern) {
        return (
            <div className={styles.pageWrapper}>
                <button onClick={() => navigate(-1)} className={styles.backButton}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div className={styles.errorBanner}>
                    <XCircle size={20} /> {error || "Intern not found."}
                </div>
            </div>
        );
    }

    // ─── DATA EXTRACTION ───
    const profile = intern.intern || {};
    const requiredHours = profile.required_hours || 486;
    const renderedHours = Math.round(intern.attendance_logs_sum_hours_rendered || 0);
    const percent = requiredHours > 0 ? Math.min(Math.round((renderedHours / requiredHours) * 100), 100) : 0;
    
    const isActive = intern.status?.toLowerCase() === 'active';

    // ✨ DYNAMIC DATA MAPPING (No more hardcoded IDs!) ✨
    const schoolName = profile.school?.name || intern.school?.name || intern.school || profile.school_id || 'Not Assigned by HR';
    const courseName = profile.course || intern.course || 'Not Assigned by HR';
    const batchName = profile.batch || intern.batch || 'Current';
    
    const branchName = profile.branch?.name || intern.branch?.name || intern.assigned_branch || profile.branch_id || 'Not Assigned by HR';
    const departmentName = profile.department?.name || intern.department?.name || intern.assigned_department || profile.department_id || 'Not Assigned by HR';

    // ─── HELPER COMPONENT ───
    const DocCheck = ({ label, hasDoc }) => (
        <div className={styles.docItem}>
            <span className={styles.docLabel}>
                <FileText size={15} className={styles.detailIcon} /> {label}
            </span>
            {hasDoc ? (
                <span className={`${styles.docBadge} ${styles.docBadgeValid}`}>
                    <CheckCircle2 size={12} /> Yes
                </span>
            ) : (
                <span className={`${styles.docBadge} ${styles.docBadgeMissing}`}>
                    <XCircle size={12} /> Missing
                </span>
            )}
        </div>
    );

    // ─── MAIN RENDER ───
    return (
        <div className={styles.pageWrapper}>
            
            <div className={styles.headerContainer}>
                <button onClick={() => navigate(-1)} className={styles.backButton}>
                    <ArrowLeft size={16} /> Back
                </button>
                
                {!isViewingOwnProfile && (
                    <div className={styles.headerActions}>
                        <button className={styles.editBtn}>Edit Profile</button>
                        <button className={styles.exportBtn}>Export Report</button>
                    </div>
                )}
            </div>

            <div className={styles.mainGrid}>
                
                {/* ─── LEFT COLUMN ─── */}
                <div className={styles.leftColumn}>
                    
                    <div className={`${styles.card} ${styles.identityCard}`}>
                        <div className={styles.identityBg}></div>
                        
                        <div className={styles.avatarWrapper}>
                            <img 
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${intern.first_name + intern.id}`} 
                                alt="avatar" 
                                className={styles.avatarImg}
                            />
                        </div>
                        
                        <h2 className={styles.profileName}>{intern.first_name} {intern.last_name}</h2>
                        <p className={styles.profileEmail}>{intern.email}</p>
                        
                        <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
                            {intern.status || 'Active'}
                        </span>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.progressTitleWrap}>
                            <Clock size={18} color="#0B1EAE" />
                            <h3 className={styles.progressTitle}>OJT Progress</h3>
                        </div>
                        
                        <div className={styles.progressStatsWrap}>
                            <div>
                                <span className={styles.renderedHours}>{renderedHours}</span>
                                <span className={styles.requiredHours}>/ {requiredHours} hrs</span>
                            </div>
                            <span className={styles.percentText}>{percent}%</span>
                        </div>
                        
                        <div className={styles.progressTrack}>
                            <div className={styles.progressFill} style={{ width: `${percent}%` }}></div>
                        </div>

                        <div className={styles.completionBox}>
                            <span className={styles.completionLabel}>Estimated Completion</span>
                            <span className={styles.completionDate}>
                                {profile.date_started ? new Date(new Date(profile.date_started).getTime() + (90 * 24 * 60 * 60 * 1000)).toLocaleDateString() : 'TBD'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ─── RIGHT COLUMN ─── */}
                <div className={styles.rightColumn}>
                    
                    <div className={styles.card}>
                        <h3 className={styles.cardHeader}>
                            <GraduationCap size={18} color="#0B1EAE" /> Academic & Placement Details
                        </h3>
                        
                        <div className={styles.detailsGrid}>
                            <div className={styles.detailItem}>
                                <label className={styles.detailLabel}>School / University</label>
                                <p className={styles.detailValue}>
                                    {schoolName}
                                </p>
                            </div>
                            <div className={styles.detailItem}>
                                <label className={styles.detailLabel}>Course & Batch</label>
                                <p className={styles.detailValue}>
                                    {courseName}
                                    {courseName !== 'Not Assigned by HR' && (
                                        <span className={styles.detailValueLight}> ({batchName})</span>
                                    )}
                                </p>
                            </div>
                            <div className={styles.detailItem}>
                                <label className={styles.detailLabel}>Assigned Branch</label>
                                <div className={styles.detailValueFlex}>
                                    <Building2 size={16} className={styles.detailIcon} /> 
                                    {branchName}
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <label className={styles.detailLabel}>Department</label>
                                <p className={styles.detailValue}>
                                    {departmentName}
                                </p>
                            </div>
                            <div className={styles.detailItem}>
                                <label className={styles.detailLabel}>Start Date</label>
                                <div className={styles.detailValueFlex}>
                                    <Calendar size={16} className={styles.detailIcon} />
                                    {profile.date_started ? new Date(profile.date_started).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'}) : 'Pending'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.bottomGrid}>
                        
                        <div className={styles.card}>
                            <h3 className={styles.cardHeader}>
                                <ShieldCheck size={18} color="#ef4444" /> Emergency Contact
                            </h3>
                            <div className={styles.emergencyList}>
                                <div className={styles.detailItem}>
                                    <label className={styles.detailLabel}>Contact Name</label>
                                    <p className={styles.detailValue}>{profile.emergency_name || 'Not Provided'}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <label className={styles.detailLabel}>Phone Number</label>
                                    <p className={styles.detailValue}>{profile.emergency_number || 'Not Provided'}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <label className={styles.detailLabel}>Address</label>
                                    <p className={styles.emergencyValue}>{profile.emergency_address || 'Not Provided'}</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.card}>
                            <h3 className={styles.cardHeader}>
                                <FileText size={18} color="#10b981" /> Onboarding Documents
                            </h3>
                            <div className={styles.docsList}>
                                <DocCheck label="Memorandum of Agreement (MOA)" hasDoc={profile.has_moa} />
                                <DocCheck label="School Endorsement Letter" hasDoc={profile.has_endorsement} />
                                <DocCheck label="Non-Disclosure Agreement (NDA)" hasDoc={profile.has_nda} />
                                <DocCheck label="Intern Pledge" hasDoc={profile.has_pledge} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default InternProfile;