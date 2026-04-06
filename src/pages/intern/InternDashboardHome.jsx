import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import styles from './InternDashboardHome.module.css';

const InternDashboardHome = () => {
    const webcamRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    const captureAttendance = async (clockType) => {
        setLoading(true);
        setStatusMsg({ type: 'info', text: 'Capturing GPS and Photo...' });

        // Get Location
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const imageSrc = webcamRef.current.getScreenshot();

                try {
                    const token = localStorage.getItem('cims_token');
                    const response = await axios.post('http://192.168.100.10:8000/api/attendance/log', {
                        type: clockType,
                        lat: latitude,
                        lng: longitude,
                        image: imageSrc
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    setStatusMsg({ type: 'success', text: response.data.message });
                } catch (error) {
                    setStatusMsg({ 
                        type: 'error', 
                        text: error.response?.data?.message || 'Server connection failed.' 
                    });
                } finally {
                    setLoading(false);
                }
            },
            () => {
                setStatusMsg({ type: 'error', text: 'Please enable GPS to time in.' });
                setLoading(false);
            }
        );
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Intern Portal</h1>
            
            <div className={styles.cameraWrapper}>
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className={styles.webcamView}
                />
                <div className={styles.overlay}>Scanning Active...</div>
            </div>

            {statusMsg.text && (
                <div className={`${styles.alert} ${styles[statusMsg.type]}`}>
                    {statusMsg.text}
                </div>
            )}

            <div className={styles.actionGrid}>
                <button onClick={() => captureAttendance('time_in')} disabled={loading} className={styles.btnIn}>
                    TIME IN (AM)
                </button>
                <button onClick={() => captureAttendance('lunch_out')} disabled={loading} className={styles.btnLunch}>
                    LUNCH OUT
                </button>
                <button onClick={() => captureAttendance('lunch_in')} disabled={loading} className={styles.btnLunch}>
                    LUNCH IN
                </button>
                <button onClick={() => captureAttendance('time_out')} disabled={loading} className={styles.btnOut}>
                    TIME OUT (PM)
                </button>
            </div>
        </div>
    );
};

export default InternDashboardHome;