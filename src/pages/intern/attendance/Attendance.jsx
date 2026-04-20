import React, { useState, useRef, useEffect, useCallback } from "react";
import api from "../../../api/axios";
import styles from "./Attendance.module.css";
import { MapPin, Camera, CheckCircle, RefreshCcw, Clock, X, Sun, Sunset, Navigation } from "lucide-react";
import Webcam from "react-webcam";
import toast, { Toaster } from 'react-hot-toast';

const Attendance = () => {
    // UI & Time States
    const [currentTime, setCurrentTime] = useState(new Date());
    const [modalStep, setModalStep] = useState(0); // 0: Closed, 1: Location, 2: Selfie, 3: Confirm
    const [selectedType, setSelectedType] = useState(""); 

    // Data States
    const [loading, setLoading] = useState(false);
    const [imgSrc, setImgSrc] = useState(null);
    const [coords, setCoords] = useState({ lat: null, lng: null });
    const [isWithinPremises, setIsWithinPremises] = useState(false);
    const [assignedBranch, setAssignedBranch] = useState(null);
    
    const webcamRef = useRef(null);

    // ─── LIVE CLOCK ───
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const currentHour = currentTime.getHours();
    const isAfternoon = currentHour >= 12;

    // ─── FETCH INTERN BRANCH DATA ───
    const fetchInternData = useCallback(async () => {
        try {
            const response = await api.get('/auth/me'); // Or your specific profile endpoint
            // Accessing branch through the intern profile relation
            if (response.data?.intern?.branch) {
                setAssignedBranch(response.data.intern.branch);
            }
        } catch (err) {
            console.error("Could not fetch branch data", err);
        }
    }, []);

    useEffect(() => {
        fetchInternData();
    }, [fetchInternData]);

    // ─── DISTANCE HELPER (Haversine Formula) ───
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // in meters
    };

    // ─── STEP 1: VERIFY LOCATION ───
    const startVerification = (type) => {
        if (!assignedBranch) {
            toast.error("Assigned branch not found. Please contact HR.");
            return;
        }

        setSelectedType(type);
        setModalStep(1);
        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const userLat = pos.coords.latitude;
                const userLng = pos.coords.longitude;
                setCoords({ lat: userLat, lng: userLng });

                // REAL CHECK: Compare current GPS to Branch GPS
                const distance = calculateDistance(
                    userLat, userLng, 
                    assignedBranch.latitude, assignedBranch.longitude
                );

                const radius = assignedBranch.radius || 100;
                
                if (distance <= radius) {
                    setIsWithinPremises(true);
                } else {
                    setIsWithinPremises(false);
                    toast.error(`You are too far from ${assignedBranch.name}`);
                }
                setLoading(false);
            },
            () => {
                toast.error("Location access denied. Please enable GPS.");
                setModalStep(0);
                setLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    // ─── STEP 2: CAPTURE SELFIE ───
    const capture = () => {
        const image = webcamRef.current.getScreenshot();
        if (image) {
            setImgSrc(image);
            setModalStep(3);
        } else {
            toast.error("Failed to capture photo. Try again.");
        }
    };

    // ─── STEP 3: FINAL SUBMISSION ───
    const handleFinalSubmit = async () => {
        if (!isWithinPremises) {
            toast.error("Cannot submit: You are outside the allowed premises.");
            return;
        }

        setLoading(true);
        const loadingToast = toast.loading("Logging attendance...");

        try {
            const payload = {
                type: selectedType,
                lat: coords.lat,
                lng: coords.lng,
                image: imgSrc
            };

            const response = await api.post('/attendance/log', payload);
            toast.success(response.data?.message || "Attendance logged!", { id: loadingToast });
            
            // Success Reset
            setModalStep(0);
            setImgSrc(null);
            setIsWithinPremises(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Submission failed", { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: "user"
    };

    return (
        <div className={styles.pageContainer}>
            <Toaster position="top-center" />

            {/* ─── MAIN DASHBOARD ─── */}
            <div className={styles.mainCard}>
                <div className={styles.cardHeader}>
                    <h1 className={styles.mainTitle}>Clock In/Out</h1>
                </div>

                <div className={styles.clockBanner}>
                    <p className={styles.dateDisplay}>
                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <h2 className={styles.digitalClock}>
                        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </h2>
                    {assignedBranch && (
                        <div className="flex items-center justify-center gap-2 mt-2 text-blue-100/80 text-sm">
                            <Navigation size={14} /> Assigned to: <span className="font-bold underline">{assignedBranch.name}</span>
                        </div>
                    )}
                </div>

                <div className={styles.verificationNotice}>
                    <div className={styles.noticeIcon}><Camera size={24} /></div>
                    <div className={styles.noticeText}>
                        <h3>Mandatory Verification</h3>
                        <p>Each attendance action requires location verification and a selfie photo for identity confirmation.</p>
                    </div>
                </div>

                <div className={styles.shiftWrapper}>
                    {/* Morning Shift */}
                    <div className={styles.shiftGroup}>
                        <h4 className={styles.shiftLabel}><Sun size={16} /> Morning Shift</h4>
                        <div className={styles.actionGrid}>
                            <button className={styles.timeInBtn} onClick={() => startVerification('time_in')}>
                                <Clock size={20} /> AM IN
                            </button>
                            <button className={styles.timeOutBtn} onClick={() => startVerification('lunch_out')}>
                                <RefreshCcw size={20} /> LUNCH OUT
                            </button>
                        </div>
                    </div>

                    {/* Afternoon Shift (Locked until 12:00 PM) */}
                    <div className={styles.shiftGroup}>
                        <h4 className={styles.shiftLabel}><Sunset size={16} /> Afternoon Shift</h4>
                        <div className={styles.actionGrid}>
                            <button 
                                className={`${styles.timeInBtn} ${!isAfternoon ? styles.locked : ''}`}
                                onClick={() => startVerification('lunch_in')}
                                disabled={!isAfternoon}
                            >
                                <Clock size={20} /> {!isAfternoon ? "PM IN (Locked)" : "PM IN"}
                            </button>
                            <button 
                                className={`${styles.timeOutBtn} ${!isAfternoon ? styles.locked : ''}`}
                                onClick={() => startVerification('time_out')}
                                disabled={!isAfternoon}
                            >
                                <CheckCircle size={20} /> {!isAfternoon ? "PM OUT (Locked)" : "PM OUT"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── VERIFICATION MODAL ─── */}
            {modalStep > 0 && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <button className={styles.closeBtn} onClick={() => setModalStep(0)}><X size={20}/></button>
                        
                        <h2 className={styles.modalTitle}>
                            {selectedType.replace('_', ' ').toUpperCase()} Verification
                        </h2>

                        <div className={styles.stepper}>
                            <div className={`${styles.step} ${modalStep >= 1 ? styles.activeStep : ''}`}>1</div>
                            <div className={styles.line}></div>
                            <div className={`${styles.step} ${modalStep >= 2 ? styles.activeStep : ''}`}>2</div>
                            <div className={styles.line}></div>
                            <div className={`${styles.step} ${modalStep >= 3 ? styles.activeStep : ''}`}>3</div>
                        </div>

                        {/* Step 1: Location */}
                        {modalStep === 1 && (
                            <div className={styles.stepBody}>
                                <div className={styles.locCircle}>
                                    <MapPin size={40} color={isWithinPremises ? "#22C55E" : "#EF4444"} />
                                </div>
                                <p className={styles.coordsText}>
                                    {loading ? "Detecting GPS..." : `${coords.lat?.toFixed(6)}, ${coords.lng?.toFixed(6)}`}
                                </p>
                                
                                {loading ? (
                                    <p className="text-slate-400 animate-pulse">Syncing with satellite...</p>
                                ) : isWithinPremises ? (
                                    <div className={styles.premisesBadge}>Validated: Within {assignedBranch?.name}</div>
                                ) : (
                                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-xs font-bold border border-red-100">
                                        Location Mismatch: Not at {assignedBranch?.name}
                                    </div>
                                )}

                                <button 
                                    className={styles.modalPrimaryBtn} 
                                    disabled={loading || !isWithinPremises} 
                                    onClick={() => setModalStep(2)}
                                >
                                    {isWithinPremises ? "Proceed to Selfie" : "Invalid Location"}
                                </button>
                            </div>
                        )}

                        {/* Step 2: Camera */}
                        {modalStep === 2 && (
                            <div className={styles.stepBody}>
                                <div className={styles.webcamBox}>
                                    <Webcam 
                                        audio={false} 
                                        ref={webcamRef} 
                                        screenshotFormat="image/jpeg" 
                                        className={styles.webcam}
                                        videoConstraints={videoConstraints}
                                    />
                                </div>
                                <button className={styles.modalPrimaryBtn} onClick={capture}>Capture Photo</button>
                            </div>
                        )}

                        {/* Step 3: Confirm */}
                        {modalStep === 3 && (
                            <div className={styles.stepBody}>
                                <div className={styles.previewBox}>
                                    <img src={imgSrc} alt="Selfie" className={styles.imgPreview} />
                                    <div className={styles.checkOverlay}><CheckCircle size={48} color="#fff" /></div>
                                </div>
                                <div className={styles.modalFooter}>
                                    <button className={styles.retakeBtn} onClick={() => setModalStep(2)}>Retake</button>
                                    <button className={styles.confirmBtn} onClick={handleFinalSubmit} disabled={loading}>Confirm & Submit</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Attendance;