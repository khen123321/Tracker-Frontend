import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios'; // Make sure this path is correct based on your folder structure!
import { Bell, AlertTriangle } from 'lucide-react';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasViewed, setHasViewed] = useState(false); // Locally tracks if they've seen the alerts
    const dropdownRef = useRef(null);

    // If there are notifications and they haven't viewed them yet, show the count
    const unreadCount = hasViewed ? 0 : notifications.length;

    // 1. Fetch function ONLY gets data; it does not touch state
    const fetchNotifications = async () => {
        try {
            // ✨ Hitting the new endpoint from our AttendanceController
            const res = await api.get('/intern/notifications');
            return res.data;
        } catch (error) {
            console.error("Failed to load notifications:", error);
            return null;
        }
    };

    // 2. Safe Effect Pattern: Resolves data, then sets state safely
    useEffect(() => {
        let isMounted = true;

        const loadData = () => {
            fetchNotifications().then(data => {
                if (isMounted && data) {
                    setNotifications(data);
                    // If new notifications come in, we reset the view state so the red dot comes back
                    if (data.length > notifications.length) {
                        setHasViewed(false);
                    }
                }
            });
        };

        // Initial load
        loadData();

        // Polling every 5 minutes (300000ms)
        const interval = setInterval(loadData, 300000);

        return () => { 
            isMounted = false; 
            clearInterval(interval);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Toggle dropdown and clear the red badge
    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            setHasViewed(true); // Clears the visual red dot when opened
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* --- BELL BUTTON --- */}
            <button 
                onClick={handleToggle} 
                className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 transition focus:outline-none"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 border-2 border-white rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* --- DROPDOWN MENU --- */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 transform origin-top-right transition-all">
                    
                    {/* Dropdown Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">Notifications</h3>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                You have no notifications right now.
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div 
                                    key={notif.id} 
                                    className="flex gap-3 p-4 border-b border-slate-50 hover:bg-red-50 transition cursor-default bg-white"
                                >
                                    {/* Alert Icon */}
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="p-2 bg-red-100 text-red-600 rounded-full">
                                            <AlertTriangle size={16} />
                                        </div>
                                    </div>
                                    
                                    {/* Content mapped from the backend array */}
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {notif.title}
                                        </p>
                                        <p className="text-[11px] font-semibold text-slate-500 mb-1">
                                            For log on: {notif.date}
                                        </p>
                                        <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                                            "{notif.message}"
                                        </p>
                                        <p className="text-[10px] font-semibold text-slate-400 mt-2 italic">
                                            {notif.created_at} {/* "2 hours ago" from diffForHumans() */}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;