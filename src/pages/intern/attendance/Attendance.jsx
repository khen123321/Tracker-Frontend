import React, { useState, useRef } from "react";
import api from "../../../api/axios"; 
import styles from "./Attendance.module.css";
import { MapPin, Camera, CheckCircle, RefreshCcw } from "lucide-react";
import Webcam from "react-webcam";
import toast, { Toaster } from 'react-hot-toast';

const Attendance = () => {
    const [loading, setLoading] = useState(false);
    const [imgSrc, setImgSrc] = useState(null);
    const webcamRef = useRef(null);

    const capture = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImgSrc(imageSrc);
    };

    const handleLogTime = async (type) => {
        if (!imgSrc) {
            toast.error("Please capture a selfie first!");
            return;
        }

        setLoading(true);
        const loadingToast = toast.loading("Verifying location and logging time...");

        try {
            // 1. Get exact GPS coordinates
            const pos = await new Promise((res, rej) => 
                navigator.geolocation.getCurrentPosition(res, rej, { 
                    enableHighAccuracy: true,
                    timeout: 10000 
                })
            );
            
            // 2. Send the SIMPLE JSON object exactly as your Laravel Controller expects it
            const payload = {
                type: type,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                image: imgSrc // Raw Base64 string
            };

            const response = await api.post('/attendance/log', payload);

            toast.dismiss(loadingToast);
            toast.success(response.data?.message || "Attendance logged successfully!");
            setImgSrc(null); 
            
        } catch (err) {
            toast.dismiss(loadingToast);
            
            // 3. Catch custom backend messages (like "Already timed in!")
            if (err.response) {
                const serverResponse = err.response.data;
                if (serverResponse.message) {
                    toast.error(serverResponse.message); 
                } else if (serverResponse.errors) {
                    const firstError = Object.values(serverResponse.errors)[0][0];
                    toast.error(`Validation Failed: ${firstError}`);
                } else {
                    toast.error("Server Error: Action could not be completed.");
                }
            } else {
                toast.error("Error: Ensure GPS is on and allowed in your browser.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <Toaster position="top-center" toastOptions={{ duration: 4000 }} />

            <div className={styles.attendanceCard}>
                <h2 className={styles.title}>Daily Attendance</h2>
                <p className={styles.subtitle}>Verify your identity and location to log hours.</p>

                <div className={styles.cameraSection}>
                    {!imgSrc ? (
                        <div className={styles.webcamWrapper}>
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                                className={styles.webcam}
                            />
                            <button onClick={capture} className={styles.captureBtn}>
                                <Camera size={20} /> Capture Selfie
                            </button>
                        </div>
                    ) : (
                        <div className={styles.previewWrapper}>
                            <img src={imgSrc} alt="Selfie preview" className={styles.previewImg} />
                            <button onClick={() => setImgSrc(null)} className={styles.retakeBtn}>
                                <RefreshCcw size={18} /> Retake
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.actionGrid}>
                    <button disabled={loading} onClick={() => handleLogTime('time_in')} className={`${styles.logBtn} ${styles.amIn}`}>
                        <Camera size={20} /> AM IN
                    </button>
                    <button disabled={loading} onClick={() => handleLogTime('lunch_out')} className={styles.logBtn}>
                        <MapPin size={20} /> LUNCH OUT
                    </button>
                    <button disabled={loading} onClick={() => handleLogTime('lunch_in')} className={styles.logBtn}>
                        <MapPin size={20} /> LUNCH IN
                    </button>
                    <button disabled={loading} onClick={() => handleLogTime('time_out')} className={`${styles.logBtn} ${styles.pmOut}`}>
                        <CheckCircle size={20} /> PM OUT
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Attendance;