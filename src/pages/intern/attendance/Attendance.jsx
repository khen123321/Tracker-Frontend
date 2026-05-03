import React, { useState, useRef, useEffect, useCallback } from "react";
import api from "../../../api/axios";
import styles from "./Attendance.module.css";
import { 
    MapPin, Camera, CheckCircle, RefreshCcw, Clock, X, 
    Sun, Sunset, Navigation, AlertTriangle, Scan 
} from "lucide-react";
import Webcam from "react-webcam";
import toast, { Toaster } from 'react-hot-toast';

// ✨ YOUR PAGE HEADER IMPORT ✨
import PageHeader from "../../../components/PageHeader";

// ✨ FACE-API IMPORT ✨
import * as faceapi from 'face-api.js';

const Attendance = () => {
    // ─── UI & TIME STATES (SERVER-SYNCED) ─────────────────────────────────────
    const [currentTime, setCurrentTime] = useState(new Date());
    const [timeOffset, setTimeOffset] = useState(0); 
    const [modalStep, setModalStep] = useState(0); 
    const [selectedType, setSelectedType] = useState("");

    // ─── DATA STATES ──────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(false);
    const [imgSrc, setImgSrc] = useState(null);
    const [coords, setCoords] = useState({ lat: null, lng: null });
    const [isWithinPremises, setIsWithinPremises] = useState(false);
    const [assignedBranch, setAssignedBranch] = useState(null);
    const [todayLog, setTodayLog] = useState(null);

    // ✨ FACE API STATES ✨
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [faceStatusText, setFaceStatusText] = useState("Loading AI models...");

    const webcamRef = useRef(null);
    const canvasRef = useRef(null);

    // ─── 0. LOAD FACE API MODELS ──────────────────────────────────────────────
    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
                setFaceStatusText("Position your face in the frame");
            } catch (err) {
                console.error("Failed to load Face AI models", err);
                setFaceStatusText("Error loading face recognition models.");
            }
        };
        loadModels();
    }, []);

    // ─── LIVE CLOCK (SYNCED TO SERVER) ────────────────────────────────────────
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date(Date.now() + timeOffset)), 1000);
        return () => clearInterval(timer);
    }, [timeOffset]);

    const currentHour = parseInt(
        new Date(Date.now() + timeOffset).toLocaleString('en-US', {
            timeZone: 'Asia/Manila',
            hour: 'numeric',
            hour12: false
        })
    );
    const isAfternoon = currentHour >= 12;

    // ─── 1. FETCH EXACT SERVER TIME ─────────────────────────────
    const fetchServerTime = useCallback(async () => {
        try {
            const requestTime = Date.now(); 
            const response = await api.get('/server-time');
            const responseTime = Date.now();
            const networkLatency = (responseTime - requestTime) / 2;
            const trueServerTime = response.data.timestamp + networkLatency;
            setTimeOffset(trueServerTime - Date.now());
        } catch (err) {
            console.error("Could not sync server time", err);
            toast.error("Network Error: Could not sync with Server Time."); 
        }
    }, []);

    // ─── 2. FETCH INTERN BRANCH DATA ──────────────────────────────────────────
    const fetchInternData = useCallback(async () => {
        try {
            const response = await api.get('/auth/me');
            if (response.data?.intern?.branch) {
                setAssignedBranch(response.data.intern.branch);
            }
        } catch (err) {
            console.error("Could not fetch branch data", err);
        }
    }, []);

    // ─── 3. FETCH TODAY'S ATTENDANCE LOG ──────────────────────────────────────
    const fetchHistory = useCallback(async () => {
        try {
            const response = await api.get('/attendance/history');
            const logs = response.data || [];
            const todayYMD = new Date(Date.now() + timeOffset).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

            const todayRecord = logs.find(log => {
                try {
                    const logDateStr = log.raw_date || log.date || log.created_at;
                    const logYMD = new Date(logDateStr).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
                    return logYMD === todayYMD;
                } catch  {
                    return false; 
                }
            });

            setTodayLog(todayRecord || null);
        } catch (err) {
            console.error("Failed to fetch today's log", err);
        }
    }, [timeOffset]);

    useEffect(() => {
        fetchServerTime();
        fetchInternData();
    }, [fetchServerTime, fetchInternData]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // ─── ROBUST SHIFT LOCKING ─────────────────────────────────────────────────
    const isValidPunch = (val) => val && val.trim() !== '' && val !== '-' && val !== 'null';

    const hasAmIn     = todayLog && isValidPunch(todayLog.time_in_am);
    const hasLunchOut = todayLog && isValidPunch(todayLog.time_out_am);
    const hasLunchIn  = todayLog && isValidPunch(todayLog.time_in_pm);
    const hasPmOut    = todayLog && isValidPunch(todayLog.time_out_pm);

    const amInStatus     = (todayLog?.am_in_status     || '').toLowerCase().trim();
    const lunchOutStatus = (todayLog?.lunch_out_status  || '').toLowerCase().trim();
    const lunchInStatus  = (todayLog?.lunch_in_status   || '').toLowerCase().trim();
    const pmOutStatus    = (todayLog?.pm_out_status     || '').toLowerCase().trim();

    const canAmIn     = !hasAmIn && !isAfternoon;
    const canLunchOut = hasAmIn && !hasLunchOut;
    const canLunchIn  = isAfternoon && !hasLunchIn && (!hasAmIn || hasLunchOut);
    const canPmOut    = hasLunchIn && !hasPmOut;

    const needsResubmission = [amInStatus, lunchOutStatus, lunchInStatus, pmOutStatus].includes('rejected');

    // ─── DISTANCE HELPER ──────────────────────────────────────────────────────
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R  = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a  = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c  = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // ─── STEP 1: VERIFY LOCATION ──────────────────────────────────────────────
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

                const distance = calculateDistance(userLat, userLng, assignedBranch.latitude, assignedBranch.longitude);
                const radius   = assignedBranch.radius || 100;

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

    // ✨ LIVE FACE DETECTION HANDLER ✨
    const handleVideoOnPlay = () => {
        if (!modelsLoaded) return;
        
        setInterval(async () => {
            if (webcamRef.current && webcamRef.current.video && canvasRef.current) {
                const video = webcamRef.current.video;
                if (video.readyState !== 4) return;

                const detections = await faceapi.detectAllFaces(
                    video, 
                    new faceapi.TinyFaceDetectorOptions()
                ).withFaceLandmarks();

                const canvas = canvasRef.current;
                const displaySize = { width: video.videoWidth, height: video.videoHeight };
                
                faceapi.matchDimensions(canvas, displaySize);
                const resizedDetections = faceapi.resizeResults(detections, displaySize);

                const ctx = canvas.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (detections.length === 0) {
                    setFaceDetected(false);
                    setFaceStatusText("No face detected.");
                } else if (detections.length > 1) {
                    setFaceDetected(false);
                    setFaceStatusText("Multiple faces detected! Ensure only you are in frame.");
                } else {
                    setFaceDetected(true);
                    setFaceStatusText("Face detected. Ready to capture.");
                    faceapi.draw.drawDetections(canvas, resizedDetections);
                }
            }
        }, 300);
    };

    // ─── STEP 2: CAPTURE SELFIE ───────────────────────────────────────────────
    const capture = () => {
        if (!faceDetected) {
            toast.error("Please align your face clearly in the camera before capturing.");
            return;
        }

        const image = webcamRef.current.getScreenshot();
        if (image) {
            setImgSrc(image);
            setModalStep(3);
        } else {
            toast.error("Failed to capture photo. Try again.");
        }
    };

    // ─── STEP 3: FINAL SUBMISSION ─────────────────────────────────────────────
    const handleFinalSubmit = async () => {
        if (!isWithinPremises) {
            toast.error("Cannot submit: You are outside the allowed premises.");
            return;
        }
        setLoading(true);
        const loadingToast = toast.loading("Logging attendance...");

        try {
            const payload = { type: selectedType, lat: coords.lat, lng: coords.lng, image: imgSrc };
            const response = await api.post('/attendance/log', payload);
            const msg = response.data?.message || "Attendance logged!";

            if (msg.includes('⚠️')) {
                toast(msg, { id: loadingToast, icon: '⚠️', duration: 6000, style: { background: '#FEF08A', color: '#854D0E', fontWeight: 'bold' } });
            } else {
                toast.success(msg, { id: loadingToast, duration: 6000 });
            }

            fetchHistory();
            setModalStep(0);
            setImgSrc(null);
            setIsWithinPremises(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Submission failed", { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    const videoConstraints = { width: 1280, height: 720, facingMode: "user" };

    // ─── RENDER ───────────────────────────────────────────────────────────────
    return (
        <div className={styles.pageContainer}>
            <Toaster position="top-center" />

            {/* ✨ PAGE HEADER COMPONENT ✨ */}
            <PageHeader 
                title="Clock In/Out" 
                
            />

            {needsResubmission && (
                <div className={styles.warningBanner}>
                    <AlertTriangle className={styles.warningIcon} size={30} />
                    <div className={styles.warningContent}>
                        <strong>ACTION REQUIRED: Photo Rejected!</strong>
                        <p>HR rejected one or more of your photos. Please navigate to the <b>My Logs</b> page to file a formal appeal and provide proof of presence.</p>
                    </div>
                </div>
            )}

            <div className={styles.mainCard}>
                <div className={styles.clockBanner}>
                    <p className={styles.dateDisplay}>
                        {currentTime.toLocaleDateString('en-US', { 
                            timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
                        })}
                    </p>
                    <h2 className={styles.digitalClock}>
                        {currentTime.toLocaleTimeString('en-US', { 
                            timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
                        })}
                    </h2>
                    {assignedBranch && (
                        <div className={styles.branchLabel}>
                            <Navigation size={14} />
                            Assigned to: <span className={styles.branchName}>{assignedBranch.name}</span>
                        </div>
                    )}
                </div>

                <div className={styles.verificationNotice}>
                    <div className={styles.noticeIcon}><Camera size={24} /></div>
                    <div className={styles.noticeText}>
                        <h3>Mandatory Verification</h3>
                        <p>Each attendance action requires location verification and a live AI face scan for identity confirmation.</p>
                    </div>
                </div>

                <div className={styles.shiftWrapper}>
                    <div className={styles.shiftGroup}>
                        <h4 className={styles.shiftLabel}><Sun size={16} /> Morning Shift</h4>
                        <div className={styles.actionGrid}>
                            <div className={styles.btnWrapper}>
                                {amInStatus === 'rejected' ? (
                                    <>
                                        <button className={`${styles.timeInBtn} ${styles.locked}`} disabled><Clock size={20} /> AM IN LOCKED</button>
                                        <span style={{ color: '#e11d48', fontSize: '11.5px', fontWeight: 'bold', textAlign: 'center', marginTop: '6px' }}>❌ Photo Rejected. Go to My Logs to appeal.</span>
                                    </>
                                ) : (
                                    <button className={`${styles.timeInBtn} ${!canAmIn ? styles.locked : ''}`} onClick={() => startVerification('time_in')} disabled={!canAmIn}>
                                        <Clock size={20} /> {isAfternoon && !hasAmIn ? "AM CLOSED" : "AM IN"}
                                    </button>
                                )}
                            </div>

                            <div className={styles.btnWrapper}>
                                {lunchOutStatus === 'rejected' ? (
                                    <>
                                        <button className={`${styles.timeOutBtn} ${styles.locked}`} disabled><RefreshCcw size={20} /> LUNCH OUT LOCKED</button>
                                        <span style={{ color: '#e11d48', fontSize: '11.5px', fontWeight: 'bold', textAlign: 'center', marginTop: '6px' }}>❌ Photo Rejected. Go to My Logs to appeal.</span>
                                    </>
                                ) : (
                                    <button className={`${styles.timeOutBtn} ${!canLunchOut ? styles.locked : ''}`} onClick={() => startVerification('lunch_out')} disabled={!canLunchOut}>
                                        <RefreshCcw size={20} /> LUNCH OUT
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.shiftGroup}>
                        <h4 className={styles.shiftLabel}><Sunset size={16} /> Afternoon Shift</h4>
                        <div className={styles.actionGrid}>
                            <div className={styles.btnWrapper}>
                                {lunchInStatus === 'rejected' ? (
                                    <>
                                        <button className={`${styles.timeInBtn} ${styles.locked}`} disabled><Clock size={20} /> PM IN LOCKED</button>
                                        <span style={{ color: '#e11d48', fontSize: '11.5px', fontWeight: 'bold', textAlign: 'center', marginTop: '6px' }}>❌ Photo Rejected. Go to My Logs to appeal.</span>
                                    </>
                                ) : (
                                    <button className={`${styles.timeInBtn} ${!canLunchIn ? styles.locked : ''}`} onClick={() => startVerification('lunch_in')} disabled={!canLunchIn}>
                                        <Clock size={20} /> {!isAfternoon ? "PM IN (Wait 12 PM)" : "PM IN"}
                                    </button>
                                )}
                            </div>

                            <div className={styles.btnWrapper}>
                                {pmOutStatus === 'rejected' ? (
                                    <>
                                        <button className={`${styles.timeOutBtn} ${styles.locked}`} disabled><CheckCircle size={20} /> PM OUT LOCKED</button>
                                        <span style={{ color: '#e11d48', fontSize: '11.5px', fontWeight: 'bold', textAlign: 'center', marginTop: '6px' }}>❌ Photo Rejected. Go to My Logs to appeal.</span>
                                    </>
                                ) : (
                                    <button className={`${styles.timeOutBtn} ${!canPmOut ? styles.locked : ''}`} onClick={() => startVerification('time_out')} disabled={!canPmOut}>
                                        <CheckCircle size={20} /> {!isAfternoon ? "PM OUT (Wait 12 PM)" : "PM OUT"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {modalStep > 0 && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <button className={styles.closeBtn} onClick={() => setModalStep(0)}><X size={20} /></button>

                        <h2 className={styles.modalTitle}>{selectedType.replace('_', ' ').toUpperCase()} Verification</h2>

                        <div className={styles.stepper}>
                            <div className={`${styles.step} ${modalStep >= 1 ? styles.activeStep : ''}`}>1</div>
                            <div className={styles.line}></div>
                            <div className={`${styles.step} ${modalStep >= 2 ? styles.activeStep : ''}`}>2</div>
                            <div className={styles.line}></div>
                            <div className={`${styles.step} ${modalStep >= 3 ? styles.activeStep : ''}`}>3</div>
                        </div>

                        {modalStep === 1 && (
    <div className={styles.stepBody}>
        <div className={styles.locCircle}>
            <MapPin size={40} color={isWithinPremises ? "#22C55E" : "#EF4444"} />
        </div>
        
        {/* ✂️ Removed the <p className={styles.coordsText}> from here! */}

        {loading ? (
            <p className={styles.syncText}>Syncing with satellite...</p>
        ) : isWithinPremises ? (
            <div className={styles.premisesBadge}>Validated: Within {assignedBranch?.name}</div>
        ) : (
            <div className={styles.locationError}>
                Location Mismatch: Not at {assignedBranch?.name}
            </div>
        )}
        <button className={styles.modalPrimaryBtn} disabled={loading || !isWithinPremises} onClick={() => setModalStep(2)}>
            {isWithinPremises ? "Proceed to Selfie" : "Invalid Location"}
        </button>
    </div>
)}

                        {/* ✨ MODAL STEP 2: LIVE FACE DETECTION (USING SCAN ICON) ✨ */}
                        {modalStep === 2 && (
                            <div className={styles.stepBody}>
                                <div 
                                    className={styles.webcamBox} 
                                    style={{ 
                                        position: 'relative', 
                                        borderWidth: '3px',
                                        borderStyle: 'solid',
                                        borderColor: faceDetected ? '#10b981' : '#e2e8f0',
                                        transition: 'border-color 0.3s'
                                    }}
                                >
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        className={styles.webcam}
                                        videoConstraints={videoConstraints}
                                        onPlay={handleVideoOnPlay}
                                    />
                                    <canvas 
                                        ref={canvasRef} 
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }} 
                                    />
                                </div>

                                <div style={{ 
                                    marginBottom: '20px', 
                                    color: faceDetected ? '#10b981' : '#f59e0b',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <Scan size={20} />
                                    {faceStatusText}
                                </div>

                                <button 
                                    className={styles.modalPrimaryBtn} 
                                    onClick={capture}
                                    disabled={!faceDetected}
                                    style={{ opacity: !faceDetected ? 0.5 : 1 }}
                                >
                                    Capture Photo
                                </button>
                            </div>
                        )}

                        {modalStep === 3 && (
                            <div className={styles.stepBody}>
                                <div className={styles.previewBox}>
                                    <img src={imgSrc} alt="Selfie" className={styles.imgPreview} />
                                    <div className={styles.checkOverlay}><CheckCircle size={48} color="#fff" /></div>
                                </div>
                                <div className={styles.modalFooter}>
                                    <button className={styles.retakeBtn} onClick={() => setModalStep(2)}>Retake</button>
                                    <button className={styles.confirmBtn} onClick={handleFinalSubmit} disabled={loading}>
                                        {loading ? 'Submitting...' : 'Confirm & Submit'}
                                    </button>
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