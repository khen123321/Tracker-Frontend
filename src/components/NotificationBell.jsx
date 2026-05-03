import React, { useState, useEffect } from 'react';
import api from '../api/axios'; 
import { AlertTriangle, X, CheckCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import CustomBellIcon from './icons/CustomBellIcon'; 
import styles from './NotificationBell.module.css';

const NotificationBell = ({ role = 'intern', onNotificationClick }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    
    const navigate = useNavigate();
    const isHR = role === 'hr';

    useEffect(() => {
        let isMounted = true;

        const fetchAllData = async () => {
            try {
                // Fetch REAL System Notifications ONLY
                const notifEndpoint = '/notifications'; // We consolidated this in api.php!
                const notifRes = await api.get(notifEndpoint);

                if (!isMounted) return;

                // Process System Notifications
                const systemNotifs = Array.isArray(notifRes.data) 
                    ? notifRes.data 
                    : (notifRes.data.notifications || []);

                // Sort Newest at the top
                const sortedNotifs = [...systemNotifs].sort((a, b) => 
                    new Date(b.created_at) - new Date(a.created_at)
                );
                
                setNotifications(sortedNotifs);
                
                const unread = sortedNotifs.filter(n => n.read_at === null || n.read_at === undefined).length;
                setUnreadCount(unread);

            } catch (err) {
                if (err.response?.status !== 404) {
                    console.error(`❌ Error fetching ${role} notifications:`, err);
                }
            }
        };

        fetchAllData();
        const interval = setInterval(fetchAllData, 8000);

        return () => { 
            isMounted = false; 
            clearInterval(interval);
        };
    }, [isHR, role]);

    const handleToggle = () => setIsOpen(!isOpen);

    const handleItemClick = async (notification, payload) => {
        if (!notification.read_at) {
            try {
                await api.put(`/notifications/${notification.id}/read`).catch(() => {}); // Changed to PUT to match api.php
                setNotifications(prev => prev.map(n => 
                    n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (err) {
                console.error("Failed to mark notification as read", err);
            }
        }

        setIsOpen(false); 

        // Route to the correct place based on role and type
        if (role === 'intern') {
            const isRejection = notification.type === 'rejection' || 
                                (notification.title && notification.title.toLowerCase().includes('rejected')) ||
                                (payload && payload.title && payload.title.toLowerCase().includes('rejected'));

            if (isRejection) {
                navigate('/intern-dashboard/logs'); 
            } else {
                navigate('/intern-dashboard/attendance'); 
            }
        } 
        else if (onNotificationClick) {
            onNotificationClick(payload?.request_id || notification.id);
        }
    };

    const hasNotifications = unreadCount > 0;

    return (
        <>
            {/* The Bell Button */}
            <button 
                onClick={handleToggle} 
                style={{
                    background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px',
                    width: '44px', height: '44px', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#475569',
                    transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    position: 'relative'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                className="z-30 focus:outline-none"
            >
                <div className={hasNotifications ? styles.ringingIcon : ''}>
                    <CustomBellIcon 
                        size={26} 
                        strokeWidth={2} 
                        color="#475569" 
                        isShaking={hasNotifications} 
                    />
                </div>

                {hasNotifications && (
                    <span style={{
                        position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', 
                        color: '#ffffff', fontSize: '10px', fontWeight: 'bold', width: '20px', height: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                        border: '2px solid #ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
                    style={{ zIndex: 9998 }} 
                    onClick={() => setIsOpen(false)} 
                />
            )}

            {/* Sidebar Drawer */}
            <div 
                className={`fixed top-0 right-0 h-screen w-80 sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} 
                style={{ zIndex: 9999 }}
            >
                <div className="flex items-center justify-between px-6 py-5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <CustomBellIcon size={18} color="#64748b" /> 
                        {isHR ? "HR Alerts" : "Notifications"}
                    </h3>
                    <button 
                        onClick={() => setIsOpen(false)} 
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors focus:outline-none"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center gap-3">
                            <CustomBellIcon size={48} color="#e2e8f0" />
                            <p className="text-sm">You have no new notifications.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => {
                                const payload = typeof n.data === 'string' ? JSON.parse(n.data) : (n.data || {});
                                const isUnread = !n.read_at;
                                const dateStr = n.created_at; 
                                const dateSubmitted = dateStr 
                                    ? new Date(dateStr).toLocaleString('en-US', { 
                                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
                                    }) 
                                    : 'Just now';

                                return (
                                    <div 
                                        key={n.id} 
                                        onClick={() => handleItemClick(n, payload)}
                                        className={`relative flex gap-4 p-5 border-b border-slate-50 transition cursor-pointer hover:bg-slate-50 ${isUnread ? 'bg-blue-50/40' : 'bg-white'}`}
                                    >
                                        {isUnread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-md"></div>}

                                        <div className="flex-shrink-0 mt-1">
                                            {n.type === 'rejection' || n.title?.toLowerCase().includes('rejected') ? (
                                                <div className="p-2 bg-red-100 text-red-600 rounded-full shadow-sm"><AlertTriangle size={16} /></div>
                                            ) : n.title?.toLowerCase().includes('approved') ? (
                                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full shadow-sm"><CheckCircle size={16} /></div>
                                            ) : (
                                                <div className="p-2 bg-blue-100 text-blue-600 rounded-full shadow-sm"><Info size={16} /></div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className={`text-sm leading-tight text-slate-800 ${isUnread ? 'font-extrabold' : 'font-semibold'}`}>
                                                    {payload.title || n.title || 'System Notice'}
                                                </p>
                                                {isUnread && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold uppercase rounded-full">New</span>}
                                            </div>
                                            <p className="text-[10px] font-medium text-slate-500 mb-2">Submitted: {dateSubmitted}</p>
                                            <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                                {payload.message || n.message}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationBell;