import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
    MapPin, Camera, CheckCircle, RefreshCcw, Clock, X, 
    Sun, Sunset, Navigation, AlertTriangle, Scan 
} from "lucide-react";
import Webcam from "react-webcam";
import toast, { Toaster } from 'react-hot-toast';
import * as faceapi from 'face-api.js';

// ✨ PAGE HEADER IMPORT ✨
import PageHeader from "../../components/layout/PageHeader";

// ✨ REDUX IMPORTS ✨
import { RootState } from "../../store";
import { 
    syncServerTimeRequest, 
    fetchAssignedBranchRequest, 
    fetchTodayLogRequest, 
    submitAttendanceRequest 
} from "../../store/attendance/actions";

const Attendance: React.FC = () => {
    const dispatch = useDispatch();

    // ─── 1. PULL GLOBAL STATE FROM REDUX ─────────────────────────────────────
    const { 
        todayLog, 
        assignedBranch, 
        serverTimeOffset, 
        loading, 
        isSubmitting 
    } = useSelector((state: RootState) => state.attendance);

    // ─── 2. LOCAL UI STATES ──────────────────────────────────────────────────
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [modalStep, setModalStep] = useState<number>(0); 
    const [selectedType, setSelectedType] = useState<string>("");
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [coords, setCoords] = useState<{ lat: number | null, lng: number | null }>({ lat: null, lng: null });
    const [isWithinPremises, setIsWithinPremises] = useState<boolean>(false);

    // ✨ FACE API STATES ✨
    const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
    const [faceDetected, setFaceDetected] = useState<boolean>(false);
    const [faceStatusText, setFaceStatusText] = useState<string>("Loading AI models...");

    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // ─── 3. FETCH REDUX DATA ON MOUNT ─────────────────────────────────────────
    useEffect(() => {
        dispatch(syncServerTimeRequest());
        dispatch(fetchAssignedBranchRequest());
        dispatch(fetchTodayLogRequest());
    }, [dispatch]);

    // ─── 4. LIVE CLOCK (SYNCED VIA REDUX OFFSET) ──────────────────────────────
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date(Date.now() + serverTimeOffset)), 1000);
        return () => clearInterval(timer);
    }, [serverTimeOffset]);

    const currentHour = parseInt(
        new Date(Date.now() + serverTimeOffset).toLocaleString('en-US', {
            timeZone: 'Asia/Manila',
            hour: 'numeric',
            hour12: false
        })
    );
    const isAfternoon = currentHour >= 12;

    // ─── ROBUST SHIFT LOCKING ─────────────────────────────────────────────────
    const isValidPunch = (val?: string | null) => val && val.trim() !== '' && val !== '-' && val !== 'null';

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
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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
    const startVerification = (type: string) => {
        if (!assignedBranch) {
            toast.error("Assigned branch not found. Please contact HR.");
            return;
        }
        setSelectedType(type);
        setModalStep(1);

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
            },
            () => {
                toast.error("Location access denied. Please enable GPS.");
                setModalStep(0);
            },
            { enableHighAccuracy: true }
        );
    };

    // ✨ LIVE FACE DETECTION HANDLER ✨
    const handleVideoOnPlay = () => {
        if (!modelsLoaded) return;
        
        setInterval(async () => {
            if (webcamRef.current && webcamRef.current.video && canvasRef.current) {
                const video = webcamRef.current.video as HTMLVideoElement;
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

        const image = webcamRef.current?.getScreenshot();
        if (image) {
            setImgSrc(image);
            setModalStep(3);
        } else {
            toast.error("Failed to capture photo. Try again.");
        }
    };

    // ─── STEP 3: FINAL SUBMISSION ─────────────────────────────────────────────
    const handleFinalSubmit = () => {
        if (!isWithinPremises) {
            toast.error("Cannot submit: You are outside the allowed premises.");
            return;
        }
        
        // ✨ FIRE THE ACTION TO REDUX SAGA! ✨
        dispatch(submitAttendanceRequest({ 
            type: selectedType, 
            lat: coords.lat, 
            lng: coords.lng, 
            image: imgSrc 
        }));

        // Reset the UI immediately (Saga handles the success/error toasts and the data fetching automatically!)
        setModalStep(0);
        setImgSrc(null);
        setIsWithinPremises(false);
    };

    const videoConstraints = { 
        facingMode: "user"
    };

    // ─── SHARED BUTTON STYLES ───
    const baseBtnStyle = "w-full h-[55px] md:h-[65px] rounded-lg border-none text-[18px] md:text-[20px] font-extrabold text-white flex items-center justify-center gap-1.5 transition-all duration-200";
    const activeTimeInStyle = "bg-yellow-500 hover:bg-yellow-600 hover:-translate-y-0.5 cursor-pointer";
    const activeTimeOutStyle = "bg-red-400 hover:bg-red-500 hover:-translate-y-0.5 cursor-pointer";
    const lockedBtnStyle = "bg-slate-400 opacity-60 cursor-not-allowed";

    // ─── RENDER ───────────────────────────────────────────────────────────────
    return (
        <div className="p-[12px] bg-slate-100 min-h-screen flex flex-col gap-[5px] font-sans">
            <Toaster position="top-center" />

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

            <PageHeader title="Clock In/Out" />

            {needsResubmission && (
                <div className="flex items-center gap-4 bg-rose-50 border-2 border-rose-200 p-4 md:px-5 rounded-xl animate-in slide-in-from-top-2">
                    <AlertTriangle className="text-rose-600 shrink-0" size={30} />
                    <div>
                        <strong className="block text-rose-800 text-[15px] font-bold mb-1">ACTION REQUIRED: Photo Rejected!</strong>
                        <p className="m-0 text-rose-700 text-[13px] leading-relaxed">HR rejected one or more of your photos. Please navigate to the <b>My Logs</b> page to file a formal appeal and provide proof of presence.</p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
                <div 
                    className="animate-shine m-4 md:m-5 p-[30px_20px] md:p-11 rounded-xl text-center text-white"
                    style={{ background: 'linear-gradient(90deg, #0B1EAE 0%, #152286 23.56%, #0D1767 63.46%, #050C48 100%)' }}
                >
                    <div className="relative z-10 flex flex-col items-center">
                        <p className="text-[16px] md:text-[18px] mb-2 font-medium opacity-90 mt-0">
                            {currentTime.toLocaleDateString('en-US', { 
                                timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
                            })}
                        </p>
                        <h2 className="text-[38px] md:text-[48px] lg:text-[82px] font-black text-white tracking-[2px] m-0 leading-tight">
                            {currentTime.toLocaleTimeString('en-US', { 
                                timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
                            })}
                        </h2>
                        {assignedBranch && (
                            <div className="flex items-center justify-center gap-1.5 mt-2.5 text-white/80 text-[14px]">
                                <Navigation size={14} />
                                Assigned to: <span className="font-bold underline">{assignedBranch.name}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-4 items-start md:items-center bg-blue-50 border border-blue-200 mx-4 md:mx-5 mb-4 md:mb-5 p-3.5 md:p-4.5 rounded-xl">
                    <div className="text-blue-700 shrink-0"><Camera size={24} /></div>
                    <div>
                        <h3 className="text-[16px] font-bold text-slate-800 m-0 mb-1">Mandatory Verification</h3>
                        <p className="text-[13px] text-slate-500 m-0">Each attendance action requires location verification and a live AI face scan for identity confirmation.</p>
                    </div>
                </div>

                <div className="px-4 pb-4 md:px-5 md:pb-5 flex flex-col gap-5">
                    
                    {/* Morning Shift */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <h4 className="flex items-center gap-2 font-bold text-slate-600 m-0 mb-3 text-[14px] uppercase"><Sun size={16} /> Morning Shift</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[5px]">
                            <div className="flex flex-col items-center gap-[5px] w-full">
                                {amInStatus === 'rejected' ? (
                                    <>
                                        <button className={`${baseBtnStyle} ${lockedBtnStyle}`} disabled><Clock size={20} /> AM IN LOCKED</button>
                                        <span className="text-rose-600 text-[11.5px] font-bold text-center mt-1.5">❌ Photo Rejected. Go to My Logs to appeal.</span>
                                    </>
                                ) : (
                                    <button className={`${baseBtnStyle} ${!canAmIn ? lockedBtnStyle : activeTimeInStyle}`} onClick={() => startVerification('time_in')} disabled={!canAmIn || loading}>
                                        <Clock size={20} /> {isAfternoon && !hasAmIn ? "AM CLOSED" : "AM IN"}
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col items-center gap-[5px] w-full">
                                {lunchOutStatus === 'rejected' ? (
                                    <>
                                        <button className={`${baseBtnStyle} ${lockedBtnStyle}`} disabled><RefreshCcw size={20} /> LUNCH OUT LOCKED</button>
                                        <span className="text-rose-600 text-[11.5px] font-bold text-center mt-1.5">❌ Photo Rejected. Go to My Logs to appeal.</span>
                                    </>
                                ) : (
                                    <button className={`${baseBtnStyle} ${!canLunchOut ? lockedBtnStyle : activeTimeOutStyle}`} onClick={() => startVerification('lunch_out')} disabled={!canLunchOut || loading}>
                                        <RefreshCcw size={20} /> LUNCH OUT
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Afternoon Shift */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <h4 className="flex items-center gap-2 font-bold text-slate-600 m-0 mb-3 text-[14px] uppercase"><Sunset size={16} /> Afternoon Shift</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[5px]">
                            <div className="flex flex-col items-center gap-[5px] w-full">
                                {lunchInStatus === 'rejected' ? (
                                    <>
                                        <button className={`${baseBtnStyle} ${lockedBtnStyle}`} disabled><Clock size={20} /> PM IN LOCKED</button>
                                        <span className="text-rose-600 text-[11.5px] font-bold text-center mt-1.5">❌ Photo Rejected. Go to My Logs to appeal.</span>
                                    </>
                                ) : (
                                    <button className={`${baseBtnStyle} ${!canLunchIn ? lockedBtnStyle : activeTimeInStyle}`} onClick={() => startVerification('lunch_in')} disabled={!canLunchIn || loading}>
                                        <Clock size={20} /> {!isAfternoon ? "PM IN (Wait 12 PM)" : "PM IN"}
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col items-center gap-[5px] w-full">
                                {pmOutStatus === 'rejected' ? (
                                    <>
                                        <button className={`${baseBtnStyle} ${lockedBtnStyle}`} disabled><CheckCircle size={20} /> PM OUT LOCKED</button>
                                        <span className="text-rose-600 text-[11.5px] font-bold text-center mt-1.5">❌ Photo Rejected. Go to My Logs to appeal.</span>
                                    </>
                                ) : (
                                    <button className={`${baseBtnStyle} ${!canPmOut ? lockedBtnStyle : activeTimeOutStyle}`} onClick={() => startVerification('time_out')} disabled={!canPmOut || loading}>
                                        <CheckCircle size={20} /> {!isAfternoon ? "PM OUT (Wait 12 PM)" : "PM OUT"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ✨ RESPONSIVE MODAL ✨ */}
            {modalStep > 0 && (
                <div className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[1000] p-4 md:p-6 backdrop-blur-sm animate-in fade-in duration-200">
                    
                    <div className={`bg-white w-full max-w-[480px] max-h-[90vh] flex flex-col rounded-[24px] relative shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden ${modalStep > 1 ? 'h-full' : 'h-auto'}`}>
                        
                        {/* Header */}
                        <div className="p-4 md:p-5 pb-2 shrink-0 relative text-center">
                            <button 
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 cursor-pointer hover:bg-slate-200 hover:text-slate-800 transition-colors border-none" 
                                onClick={() => setModalStep(0)}
                            >
                                <X size={18} />
                            </button>

                            <h2 className="text-[18px] md:text-[20px] font-extrabold m-0 mb-3 text-slate-900">
    {selectedType === 'lunch_in' 
        ? 'PM IN' 
        : selectedType === 'time_in' 
            ? 'AM IN' 
            : selectedType === 'time_out' 
                ? 'PM OUT' 
                : selectedType.replace('_', ' ').toUpperCase()} VERIFICATION
</h2>

                            <div className="flex items-center justify-center gap-2.5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold ${modalStep >= 1 ? 'bg-[#0B1EAE] text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                                <div className="w-8 h-[2px] bg-slate-200"></div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold ${modalStep >= 2 ? 'bg-[#0B1EAE] text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                                <div className="w-8 h-[2px] bg-slate-200"></div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold ${modalStep >= 3 ? 'bg-[#0B1EAE] text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-4 md:p-5 pt-2 flex-1 flex flex-col items-center min-h-0">
                            
                            {/* STEP 1: LOCATION (FIXED SPACING) */}
                            {modalStep === 1 && (
                                <div className="flex flex-col items-center justify-center w-full my-auto py-8">
                                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shrink-0 ${isWithinPremises ? 'bg-green-100' : 'bg-rose-100'}`}>
                                        <MapPin size={48} className={isWithinPremises ? "text-green-500" : "text-rose-500"} />
                                    </div>
                                    
                                    {isWithinPremises ? (
                                        <div className="border-2 border-green-500 text-green-700 bg-green-50 px-6 py-3 rounded-full font-bold text-[14px] md:text-[15px] mb-8 text-center w-full max-w-[300px]">
                                            Validated: Within {assignedBranch?.name}
                                        </div>
                                    ) : (
                                        <div className="bg-rose-50 text-rose-600 px-6 py-3 rounded-full font-bold text-[14px] border border-rose-200 mb-8 text-center w-full max-w-[300px]">
                                            Location Mismatch: Not at {assignedBranch?.name}
                                        </div>
                                    )}
                                    <button 
                                        className="w-full max-w-[300px] shrink-0 bg-[linear-gradient(270deg,#0B1EAE_0%,#152286_23.56%,#0D1767_63.46%,#050C48_100%)] text-white border-none py-4 px-5 rounded-xl font-bold cursor-pointer transition-colors hover:bg-[#081685] disabled:opacity-50 disabled:cursor-not-allowed" 
                                        disabled={!isWithinPremises} 
                                        onClick={() => setModalStep(2)}
                                    >
                                        {isWithinPremises ? "Proceed to Selfie" : "Invalid Location"}
                                    </button>
                                </div>
                            )}

                            {/* STEP 2: LIVE FACE DETECTION */}
                            {modalStep === 2 && (
                                <div className="flex flex-col items-center w-full h-full justify-between min-h-0">
                                    
                                    <div className="bg-blue-50 text-blue-800 p-2.5 rounded-lg text-[12px] md:text-[13px] leading-tight mb-3 border border-blue-200 flex gap-2 items-start text-left w-full shrink-0">
                                        <Camera size={16} className="shrink-0 mt-0.5 text-blue-600" />
                                        <div>
                                            <strong className="block mb-0.5 text-blue-900">Photo Guidelines:</strong>
                                            Take a clear selfie showing your surroundings inside CLIMBS premises.
                                        </div>
                                    </div>

                                    <div className={`w-full flex-1 min-h-0 flex justify-center items-center rounded-xl overflow-hidden mb-3 border-[3px] relative bg-slate-900 transition-colors duration-300 ${faceDetected ? 'border-emerald-500' : 'border-slate-200'}`}>
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            className="w-full h-full object-cover block scale-x-[-1]"
                                            videoConstraints={videoConstraints}
                                            onPlay={handleVideoOnPlay}
                                        />
                                        <canvas 
                                            ref={canvasRef} 
                                            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                                        />
                                    </div>

                                    <div className={`mb-3 text-sm font-bold flex items-center gap-2 shrink-0 ${faceDetected ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        <Scan size={18} />
                                        {faceStatusText}
                                    </div>

                                    <button 
                                        className="w-full shrink-0 bg-[linear-gradient(270deg,#0B1EAE_0%,#152286_23.56%,#0D1767_63.46%,#050C48_100%)] text-white border-none py-3.5 px-5 rounded-xl font-bold transition-all hover:bg-[#081685] disabled:opacity-50 disabled:cursor-not-allowed" 
                                        onClick={capture}
                                        disabled={!faceDetected}
                                    >
                                        Capture Photo
                                    </button>
                                </div>
                            )}

                            {/* STEP 3: SUBMISSION */}
                            {modalStep === 3 && (
                                <div className="flex flex-col items-center w-full h-full min-h-0">
                                    <div className="w-full flex-1 min-h-0 flex justify-center items-center relative rounded-xl overflow-hidden mb-4 border-[3px] border-slate-200 bg-slate-900">
                                        {imgSrc && <img src={imgSrc} alt="Selfie" className="w-full h-full object-cover block scale-x-[-1]" />}
                                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                            <CheckCircle size={48} className="text-white drop-shadow-lg" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full shrink-0">
                                        <button 
                                            className="w-full sm:flex-1 py-3.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors" 
                                            onClick={() => setModalStep(2)}
                                        >
                                            Retake
                                        </button>
                                        <button 
                                            className="w-full sm:flex-[2] py-3.5 rounded-xl border-none bg-[linear-gradient(270deg,#0B1EAE_0%,#152286_23.56%,#0D1767_63.46%,#050C48_100%)] text-white font-bold cursor-pointer hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all" 
                                            onClick={handleFinalSubmit} 
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Attendance;