import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
    Building2, GraduationCap,
    FileText, XCircle, Clock, Calendar, ShieldCheck,
    Camera, UploadCloud, Loader2, User, Phone, MapPin, AlertCircle, Check, Eye, RefreshCw
} from 'lucide-react';
import api from '../../api/axios';
import toast, { Toaster } from 'react-hot-toast';
import PageHeader from "../../components/layout/PageHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InternData {
    id: number;
    first_name: string;
    last_name: string;
    school?: string | { name: string };
    course?: string;
    batch?: string;
    branch?: string | { name: string };
    department?: string | { name: string };
    assigned_branch?: string;
    assigned_department?: string;
    intern?: InternProfile;
}

interface InternProfile {
    avatar_url?: string;
    school?: string | { name: string };
    school_id?: string;
    course?: string;
    batch?: string;
    branch?: string | { name: string };
    branch_id?: string;
    department?: string | { name: string };
    department_id?: string;
    date_started?: string;
    required_hours?: number;
    emergency_name?: string;
    emergency_number?: string;
    emergency_address?: string;
    has_resume?: boolean;
    has_moa?: boolean;
    has_endorsement?: boolean;
    has_nda?: boolean;
    has_pledge?: boolean;
    [key: string]: unknown;
}

interface ProgressStats {
    renderedHours: number;
    requiredHours: number;
    percent: number;
    completionDate: string;
}

interface WeeklyDay {
    label: string;
    status: 'present' | 'absent' | 'future';
    hours: number;
}

interface DocCheckProps {
    label: string;
    docKey: string;
    hasDoc: boolean | undefined;
    subtext?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface InternProfileProps {
  isHrView?: boolean;
}

const InternProfile: React.FC<InternProfileProps> = ({ isHrView }) => {
    const { id: paramId } = useParams<{ id?: string }>();

    const targetId = paramId || 'me';
    const isViewingOwnProfile = !paramId;

    const [intern, setIntern] = useState<InternData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [progressStats, setProgressStats] = useState<ProgressStats>({
        renderedHours: 0,
        requiredHours: 486,
        percent: 0,
        completionDate: 'Calculating...'
    });

    const [weeklyStats, setWeeklyStats] = useState<WeeklyDay[]>([
        { label: 'M', status: 'present', hours: 8 },
        { label: 'T', status: 'absent', hours: 0 },
        { label: 'W', status: 'present', hours: 7.5 },
        { label: 'T', status: 'present', hours: 8 },
        { label: 'F', status: 'future', hours: 0 }
    ]);

    const [isPresentToday, setIsPresentToday] = useState<boolean>(true);
    const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchInternDetails = async () => {
            try {
                const response = await api.get(`/hr/interns/${targetId}`);
                const profileData: InternData = response.data;

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
            } catch (err: unknown) {
                console.error("Failed to fetch intern profile:", err);
                if (isMounted) {
                    const axiosErr = err as { response?: { status: number } };
                    if (axiosErr.response?.status === 403) {
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

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            setUploadingAvatar(true);
            const response = await api.post('/intern/upload-avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success("Profile picture updated!");

            setIntern(prev => prev ? ({
                ...prev,
                intern: { ...prev.intern, avatar_url: response.data.avatar_url }
            }) : null);
        } catch (err) {
            console.error("Avatar upload error:", err);
            toast.error("Failed to upload profile picture.");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleDocumentUpload = async (docKey: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
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

            setIntern(prev => prev ? ({
                ...prev,
                intern: {
                    ...prev.intern,
                    [`has_${docKey}`]: true,
                    [`${docKey}_url`]: response.data.document_url
                }
            }) : null);
        } catch (err) {
            console.error("Doc upload error:", err);
            toast.error("Failed to upload document.");
        } finally {
            setUploadingDoc(null);
        }
    };

    const handleViewDocument = (docKey: string) => {
        const url = intern?.intern?.[`${docKey}_url`] as string | undefined;
        if (url) {
            window.open(url, '_blank');
        } else {
            toast.error("Document URL not found. Try re-uploading.");
        }
    };

    // ─── Loading State ─────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500 gap-4 font-[Poppins,system-ui,sans-serif]">
                <Loader2 size={40} className="animate-spin" />
                <p>Loading Profile...</p>
            </div>
        );
    }

    // ─── Error State ───────────────────────────────────────────────────────────

    if (error || !intern) {
        return (
            <div className="flex flex-col gap-[5px] font-[Poppins,system-ui,sans-serif] text-slate-900 p-0 min-h-screen bg-slate-100">
                <div className="flex items-center gap-2 bg-red-50 text-red-500 p-4 rounded-xl font-semibold border border-red-200 mt-5">
                    <XCircle size={20} /> {error || "Intern not found."}
                </div>
            </div>
        );
    }

    // ─── Derived Values ────────────────────────────────────────────────────────

    const profile = intern.intern ?? ({} as InternProfile);

    const getName = (val: string | { name: string } | undefined): string | undefined =>
        typeof val === 'object' && val !== null ? val.name : val;

    const schoolName     = getName(profile.school) ?? getName(intern.school as string | { name: string }) ?? profile.school_id ?? 'Not Assigned';
    const courseName     = profile.course ?? intern.course ?? 'Not Assigned';
    const batchName      = profile.batch  ?? intern.batch  ?? 'Current';
    const branchName     = getName(profile.branch as string | { name: string }) ?? getName(intern.branch as string | { name: string }) ?? intern.assigned_branch ?? profile.branch_id ?? 'Not Assigned';
    const departmentName = getName(profile.department as string | { name: string }) ?? getName(intern.department as string | { name: string }) ?? intern.assigned_department ?? profile.department_id ?? 'Not Assigned';

    // ─── DocCheck Sub-component ────────────────────────────────────────────────

    const DocCheck: React.FC<DocCheckProps> = ({ label, docKey, hasDoc, subtext }) => {
        const isUploading = uploadingDoc === docKey;

        return (
            <div
                className={[
                    'flex items-center gap-4 border rounded-xl px-4 py-3.5 transition-all',
                    'max-[768px]:flex-wrap max-[768px]:gap-3',
                    hasDoc
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-white border-slate-100 hover:border-slate-300',
                ].join(' ')}
            >
                {/* Icon box */}
                <div
                    className={[
                        'flex items-center justify-center w-[38px] h-[38px] rounded-[10px] flex-shrink-0',
                        hasDoc ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500',
                    ].join(' ')}
                >
                    {hasDoc ? <Check size={18} /> : <AlertCircle size={18} />}
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0">
                    <h4
                        className={[
                            'mb-[3px] text-[0.92rem] font-bold text-slate-900 m-0',
                            'whitespace-nowrap overflow-hidden text-ellipsis',
                            'max-[768px]:whitespace-normal',
                        ].join(' ')}
                    >
                        {label}
                    </h4>
                    <p className="m-0 text-xs text-slate-500">
                        {subtext ?? (hasDoc ? 'File uploaded' : 'Missing file')}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 flex-shrink-0 max-[768px]:w-full max-[768px]:justify-end max-[768px]:mt-1">
                    {hasDoc && (
                        <button
                            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 text-slate-500 px-3.5 py-[7px] rounded-lg text-xs font-bold cursor-pointer transition-all uppercase tracking-[0.4px] hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900"
                            onClick={() => handleViewDocument(docKey)}
                            title="View uploaded document"
                        >
                            <Eye size={16} />
                            <span>View</span>
                        </button>
                    )}

                    {isViewingOwnProfile && (
                        <label
                            className={[
                                'inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg text-xs font-bold cursor-pointer transition-all uppercase tracking-[0.4px]',
                                hasDoc
                                    ? 'bg-white border border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900'
                                    : 'bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700',
                            ].join(' ')}
                        >
                            {isUploading ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : hasDoc ? (
                                <><RefreshCw size={14} /> Re-upload</>
                            ) : (
                                <><UploadCloud size={14} /> Upload</>
                            )}
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => handleDocumentUpload(docKey, e)}
                                disabled={isUploading}
                            />
                        </label>
                    )}
                </div>
            </div>
        );
    };

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-[5px] font-[Poppins,system-ui,sans-serif] text-slate-900 p-0 min-h-screen bg-slate-100">
            <Toaster position="top-right" />

            <PageHeader
                title="Intern Profile"
                subtitle="View and manage intern information and documents."
            />

            <div className="flex flex-col gap-[5px]">

                {/* HR Actions */}
                {!isViewingOwnProfile && (
                    <div className="flex justify-end">
                        <button className="bg-white border border-slate-300 text-slate-500 px-4 py-2 rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900">
                            Export Report
                        </button>
                    </div>
                )}

                {/* ─── IDENTITY BANNER ─── */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    {/* Gradient strip */}
                    <div className="h-20 bg-gradient-to-br from-[#0B1EAE] to-blue-500" />

                    <div
                        className={[
                            'flex items-start gap-6 px-8 pb-8 -mt-9',
                            'max-[768px]:flex-col max-[768px]:items-center max-[768px]:text-center',
                            'max-[768px]:px-5 max-[768px]:pb-5 max-[768px]:-mt-[50px]',
                        ].join(' ')}
                    >
                        {/* Avatar */}
                        <div className="group relative w-[100px] h-[100px] rounded-full border-4 border-white bg-white flex-shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
                            {uploadingAvatar && (
                                <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center z-10">
                                    <Loader2 className="animate-spin" size={24} color="white" />
                                </div>
                            )}
                            <img
                                src={
                                    profile.avatar_url ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${intern.first_name}${intern.id}`
                                }
                                alt="avatar"
                                className="w-full h-full rounded-full object-cover"
                            />
                            {isViewingOwnProfile && (
                                <div
                                    className="absolute inset-0 bg-slate-900/60 rounded-full flex items-center justify-center opacity-0 cursor-pointer transition-opacity group-hover:opacity-100"
                                    onClick={() => avatarInputRef.current?.click()}
                                >
                                    <Camera size={20} color="white" />
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={avatarInputRef}
                                onChange={handleAvatarUpload}
                            />
                        </div>

                        {/* Identity info */}
                        <div className="mt-11 flex flex-col gap-1.5 max-[768px]:mt-4 max-[768px]:items-center">
                            <h2 className="text-[1.6rem] font-extrabold text-slate-900 m-0 leading-tight">
                                {intern.first_name} {intern.last_name}
                            </h2>
                            <p className="text-[0.95rem] text-slate-500 m-0 font-semibold flex items-center gap-2">
                                OJT Trainee <span className="text-slate-300">•</span> {departmentName}
                            </p>

                            <div className="flex items-center gap-3 mt-2">
                                {/* Present/Absent badge */}
                                <span
                                    className={[
                                        'px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 uppercase tracking-[0.5px] border',
                                        isPresentToday
                                            ? 'bg-green-100 text-green-700 border-green-200'
                                            : 'bg-red-50 text-red-500 border-red-200',
                                    ].join(' ')}
                                >
                                    <div
                                        className={[
                                            'w-1.5 h-1.5 rounded-full',
                                            isPresentToday ? 'bg-green-700' : 'bg-red-500',
                                        ].join(' ')}
                                    />
                                    {isPresentToday ? 'PRESENT' : 'ABSENT'}
                                </span>

                                {/* Course badge */}
                                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-extrabold border border-blue-200 tracking-[0.5px]">
                                    {courseName}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── MIDDLE ROW: PROGRESS & ACADEMICS ─── */}
                <div className="grid grid-cols-[360px_1fr] gap-[5px] max-[1100px]:grid-cols-1">

                    {/* Progress Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 tracking-widest uppercase mb-4">
                            <Clock size={16} className="text-slate-400" />
                            OJT PROGRESS
                        </div>

                        {/* Hours */}
                        <div className="flex justify-between items-end mb-3">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-5xl font-extrabold text-emerald-500 leading-none">
                                    {progressStats.renderedHours}
                                </span>
                                <span className="text-base text-slate-400 font-bold">
                                    / {progressStats.requiredHours} hrs
                                </span>
                            </div>
                            <span className="text-xl font-extrabold text-emerald-500">
                                {progressStats.percent}%
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-[width] duration-[800ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                                style={{ width: `${progressStats.percent}%` }}
                            />
                        </div>

                        <div className="text-sm text-slate-500">
                            Est. completion{' '}
                            <span className="font-bold text-slate-900">{progressStats.completionDate}</span>
                        </div>

                        {/* M–F Weekly Chart */}
                        <div className="flex gap-2 mt-auto pt-8 h-20 items-end justify-between max-[1100px]:max-w-[360px]">
                            {weeklyStats.map((day, idx) => {
                                const barColor =
                                    day.status === 'present'
                                        ? 'bg-emerald-500 opacity-85'
                                        : day.status === 'absent'
                                        ? 'bg-red-300 opacity-85'
                                        : 'bg-slate-100';

                                const height =
                                    day.status === 'present'
                                        ? `${Math.min((day.hours / 8) * 100, 100)}%`
                                        : '20%';

                                return (
                                    <div
                                        key={idx}
                                        className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                                    >
                                        <div
                                            className={`w-full max-w-[24px] rounded-t-[4px] transition-[height] duration-500 ease-in-out ${barColor}`}
                                            style={{ height }}
                                        />
                                        <span className="text-[0.65rem] font-extrabold text-slate-400">
                                            {day.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Academics Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 tracking-widest uppercase mb-4">
                            <GraduationCap size={16} className="text-slate-400" />
                            ACADEMIC & PLACEMENT
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-7 max-[1100px]:grid-cols-1">
                            {/* School – full width */}
                            <div className="col-span-2 max-[1100px]:col-span-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.5px] block mb-1.5">
                                    SCHOOL / UNIVERSITY
                                </label>
                                <p className="text-[1.05rem] font-bold text-slate-900 m-0">{schoolName}</p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.5px] block mb-1.5">
                                    COURSE & BATCH
                                </label>
                                <p className="text-[1.05rem] font-bold text-slate-900 m-0">{courseName}</p>
                                <span className="text-sm text-slate-500 block mt-1 font-medium">
                                    Current • {batchName}
                                </span>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.5px] block mb-1.5">
                                    DEPARTMENT
                                </label>
                                <p className="text-[1.05rem] font-bold text-slate-900 m-0">{departmentName}</p>
                                <span className="text-sm text-slate-500 block mt-1 font-medium">
                                    Technology Division
                                </span>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.5px] block mb-1.5">
                                    ASSIGNED BRANCH
                                </label>
                                <p className="text-[1.05rem] font-bold text-slate-900 m-0 flex items-center gap-2">
                                    <Building2 size={14} /> {branchName}
                                </p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.5px] block mb-1.5">
                                    START DATE
                                </label>
                                <p className="text-[1.05rem] font-bold text-slate-900 m-0 flex items-center gap-2">
                                    <Calendar size={14} />
                                    {profile.date_started
                                        ? new Date(profile.date_started).toLocaleDateString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                              year: 'numeric',
                                          })
                                        : 'Pending'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── BOTTOM ROW: EMERGENCY & DOCUMENTS ─── */}
                <div className="grid grid-cols-[360px_1fr] gap-[5px] max-[1100px]:grid-cols-1">

                    {/* Emergency Contact Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 tracking-widest uppercase mb-4">
                            <ShieldCheck size={16} className="text-red-500" />
                            EMERGENCY CONTACT
                        </div>

                        <div className="flex flex-col gap-4">
                            {/* Contact Name */}
                            <div className="border border-slate-200 rounded-xl p-4 flex items-start gap-4 bg-stone-50">
                                <User size={16} className="text-slate-400 mt-0.5" />
                                <div>
                                    <label className="text-[0.7rem] font-extrabold text-slate-400 uppercase tracking-[0.5px] mb-1 block">
                                        CONTACT NAME
                                    </label>
                                    <p className="text-[0.95rem] font-bold text-slate-900 m-0 break-words">
                                        {profile.emergency_name || 'Not Provided'}
                                    </p>
                                </div>
                            </div>

                            {/* Phone & Address */}
                            <div className="flex flex-col gap-4">
                                <div className="border border-slate-200 rounded-xl p-4 flex items-start gap-4">
                                    <Phone size={16} className="text-slate-400 mt-0.5" />
                                    <div>
                                        <label className="text-[0.7rem] font-extrabold text-slate-400 uppercase tracking-[0.5px] mb-1 block">
                                            PHONE
                                        </label>
                                        <p className="text-[0.95rem] font-bold text-slate-900 m-0 break-words">
                                            {profile.emergency_number || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="border border-slate-200 rounded-xl p-4 flex items-start gap-4">
                                    <MapPin size={16} className="text-slate-400 mt-0.5" />
                                    <div>
                                        <label className="text-[0.7rem] font-extrabold text-slate-400 uppercase tracking-[0.5px] mb-1 block">
                                            ADDRESS
                                        </label>
                                        <p className="text-[0.95rem] font-bold text-slate-900 m-0 break-words">
                                            {profile.emergency_address || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Documents Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 tracking-widest uppercase mb-4">
                            <FileText size={16} className="text-slate-400" />
                            ONBOARDING DOCUMENTS
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <DocCheck
                                label="Resume / CV"
                                docKey="resume"
                                hasDoc={profile.has_resume}
                                subtext="Standard job application format"
                            />
                            <DocCheck
                                label="Memorandum of Agreement"
                                docKey="moa"
                                hasDoc={profile.has_moa}
                                subtext="MOA • Signed by school"
                            />
                            <DocCheck
                                label="School Endorsement Letter"
                                docKey="endorsement"
                                hasDoc={profile.has_endorsement}
                                subtext="Required before Day 5"
                            />
                            <DocCheck
                                label="Non-Disclosure Agreement"
                                docKey="nda"
                                hasDoc={profile.has_nda}
                                subtext="NDA • Company legal form"
                            />
                            <DocCheck
                                label="Intern Pledge"
                                docKey="pledge"
                                hasDoc={profile.has_pledge}
                                subtext="Commitment to excellence"
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default InternProfile;