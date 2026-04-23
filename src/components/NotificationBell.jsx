import React, { useState, useEffect } from 'react';
import api from '../api/axios'; // Ensure this path is correct for your project
import { Bell, AlertTriangle, X } from 'lucide-react';

// We accept a 'role' prop that defaults to 'intern'. 
// It can be passed as <NotificationBell role="hr" /> or <NotificationBell role="intern" />
const NotificationBell = ({ role = 'intern' }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [internHasViewed, setInternHasViewed] = useState(false); 

    const isHR = role === 'hr';

    // HR relies on the backend count, Intern relies on a local "has viewed" toggle
    const displayCount = isHR ? unreadCount : (internHasViewed ? 0 : notifications.length);

    useEffect(() => {
        let isMounted = true;

        const fetchNotifications = async () => {
            try {
                // 1. Pick the correct endpoint based on the role
                const endpoint = isHR ? '/notifications' : '/intern/notifications';
                const { data } = await api.get(endpoint);

                if (!isMounted) return;

                // 2. Handle the data differently based on the role's backend structure
                if (isHR) {
                    setNotifications(data.notifications || data || []);
                    setUnreadCount(data.unread_count !== undefined ? data.unread_count : (data.length || 0));
                } else {
                    const notifs = data || [];
                    setNotifications(notifs);
                    // If an intern gets a new notification, reset the viewed status so the red dot reappears
                    if (notifs.length > notifications.length) {
                        setInternHasViewed(false);
                    }
                }
            } catch (err) {
                console.error(`Error fetching ${role} notifications:`, err);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds

        return () => { 
            isMounted = false; 
            clearInterval(interval);
        };
    
    }, [isHR, role, notifications.length]);

    // Handle Escape key to close the drawer
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleToggle = async () => {
        setIsOpen(!isOpen);
        
        // When opening the drawer, clear the red dot
        if (!isOpen && displayCount > 0) {
            if (isHR) {
                try {
                    await api.post('/notifications/mark-as-read');
                    setUnreadCount(0);
                } catch (err) {
                    console.error("Failed to mark as read:", err);
                }
            } else {
                setInternHasViewed(true);
            }
        }
    };

    return (
        <>
            {/* --- BELL ICON BUTTON --- */}
            <button 
                onClick={handleToggle} 
                className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 transition focus:outline-none z-30"
            >
                <Bell size={24} />
                {displayCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 border-2 border-white rounded-full">
                        {displayCount > 9 ? '9+' : displayCount}
                    </span>
                )}
            </button>

            {/* --- DARK OVERLAY BACKGROUND --- */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                    style={{ zIndex: 9998 }}
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* --- SLIDE-OUT DRAWER PANEL --- */}
            <div 
                className={`fixed top-0 right-0 h-screen w-80 sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
                style={{ zIndex: 9999 }}
            >
                
                {/* Drawer Header */}
                <div className="flex items-center justify-between px-6 py-5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <Bell size={18} className="text-slate-500" /> 
                        {isHR ? "HR Alerts" : "Notifications"}
                    </h3>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors focus:outline-none"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center gap-3">
                            <Bell size={48} className="text-slate-200" />
                            <p className="text-sm">You have no new notifications.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => {
                                // ✨ DYNAMIC DATA MAPPING ✨
                                // We pull the right variables depending on if the HR or Intern is viewing it
                                const title = isHR ? (n.data?.intern_name || 'System Notice') : n.title;
                                const message = isHR ? (n.data?.message || 'New action recorded.') : n.message;
                                const timeText = isHR 
                                    ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                    : n.created_at; // Intern uses diffForHumans() e.g. "2 hours ago"
                                
                                return (
                                    <div 
                                        key={n.id} 
                                        className={`flex gap-4 p-5 border-b border-slate-50 transition cursor-default bg-white ${
                                            isHR ? 'hover:bg-blue-50/50' : 'hover:bg-red-50/50'
                                        }`}
                                    >
                                        {/* Icon (Only show warning triangle for Intern rejections) */}
                                        {!isHR && (
                                            <div className="flex-shrink-0 mt-1">
                                                <div className="p-2 bg-red-100 text-red-600 rounded-full shadow-sm">
                                                    <AlertTriangle size={16} />
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Content */}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className={`text-sm font-bold leading-tight ${isHR ? 'text-blue-700' : 'text-slate-800'}`}>
                                                    {title}
                                                </p>
                                                <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap ml-2 bg-slate-100 px-2 py-0.5 rounded-full">
                                                    {timeText}
                                                </span>
                                            </div>
                                            
                                            {/* Interns get an extra date label */}
                                            {!isHR && n.date && (
                                                <p className="text-[11px] font-semibold text-slate-500 mb-2">
                                                    For log on: {n.date}
                                                </p>
                                            )}
                                            
                                            <div className={`text-xs leading-relaxed p-3 rounded-lg border relative ${
                                                isHR ? 'text-slate-600 bg-transparent border-transparent p-0' : 'text-slate-700 bg-red-50/50 border-red-100/50'
                                            }`}>
                                                {!isHR && <span className="absolute top-2 left-2 text-red-300">"</span>}
                                                <span className={`${!isHR && 'pl-3 block italic'}`}>
                                                    {message}
                                                </span>
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