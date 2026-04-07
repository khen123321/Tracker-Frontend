import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import api from '../../api/axios'; // Use our standardized axios instance
import { Calendar, Clock, MapPin, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './InternDashboardHome.module.css';

const InternDashboardHome = () => {
    const webcamRef = useRef(null);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
    const [upcomingEvents, setUpcomingEvents] = useState([]);

    // Fetch a few upcoming events to show on the dashboard
    useEffect(() => {
        const fetchBriefEvents = async () => {
            try {
                const { data } = await api.get('/events');
                setUpcomingEvents(data.slice(0, 2)); // Just show the next 2
            } catch {
                console.error("Dashboard event sync failed");
            }
        };
        fetchBriefEvents();
    }, []);

    const captureAttendance = async (clockType) => {
        setLoading(true);
        setStatusMsg({ type: 'info', text: 'Validating location and identity...' });

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const imageSrc = webcamRef.current.getScreenshot();

                try {
                    // Use the 'api' instance - it already knows the Base URL and Token!
                    const response = await api.post('/attendance/log', {
                        type: clockType,
                        lat: latitude,
                        lng: longitude,
                        image: imageSrc
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
                setStatusMsg({ type: 'error', text: 'GPS Required. Please enable location.' });
                setLoading(false);
            }
        );
    };

    return (
        <div className={styles.container}>
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className={styles.title}>Welcome back, Intern!</h1>
                    <p className="text-slate-500 flex items-center gap-2">
                        <MapPin size={16} /> CLIMBS HQ - Cagayan de Oro
                    </p>
                </div>
                
                {/* QUICK CALENDAR ACCESS */}
                <button 
                    onClick={() => navigate('/intern-dashboard/events')}
                    className="flex items-center gap-2 text-sm bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                >
                    <Calendar size={18} className="text-[#0B1EAE]" />
                    View Full Calendar
                </button>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* CAMERA SECTION */}
                <div className="lg:col-span-2">
                    <div className={styles.cameraWrapper}>
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className={styles.webcamView}
                            videoConstraints={{ facingMode: "user" }}
                        />
                        <div className={styles.overlay}>
                            <Camera size={20} className="animate-pulse" />
                            Live Verification
                        </div>
                    </div>

                    {statusMsg.text && (
                        <div className={`${styles.alert} ${styles[statusMsg.type]} mt-4`}>
                            {statusMsg.text}
                        </div>
                    )}

                    <div className={styles.actionGrid}>
                        <button onClick={() => captureAttendance('time_in')} disabled={loading} className={styles.btnIn}>
                            TIME IN
                        </button>
                        <button onClick={() => captureAttendance('lunch_out')} disabled={loading} className={styles.btnLunch}>
                            LUNCH OUT
                        </button>
                        <button onClick={() => captureAttendance('lunch_in')} disabled={loading} className={styles.btnLunch}>
                            LUNCH IN
                        </button>
                        <button onClick={() => captureAttendance('time_out')} disabled={loading} className={styles.btnOut}>
                            TIME OUT
                        </button>
                    </div>
                </div>

                {/* INFO SIDEBAR */}
                <div className="space-y-6">
                    {/* UPCOMING EVENTS PREVIEW */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Calendar size={18} /> Upcoming
                        </h3>
                        {upcomingEvents.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingEvents.map(event => (
                                    <div key={event.id} className="border-l-4 border-[#0B1EAE] bg-blue-50 p-3 rounded-r-lg">
                                        <p className="text-xs font-bold text-[#0B1EAE] uppercase">{event.start}</p>
                                        <p className="text-sm font-medium text-slate-700">{event.title}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">No scheduled events.</p>
                        )}
                    </div>

                    <div className="bg-[#0B1EAE] p-5 rounded-2xl text-white shadow-lg">
                        <h3 className="font-bold mb-2 flex items-center gap-2">
                            <Clock size={18} /> Duty Reminder
                        </h3>
                        <p className="text-sm opacity-90 leading-relaxed">
                            Ensure your face is clearly visible in the camera before clicking "Time In". 
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InternDashboardHome;