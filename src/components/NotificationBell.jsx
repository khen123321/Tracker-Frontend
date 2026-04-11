import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // We define the function INSIDE the effect to satisfy the linter
        const getNotifications = async () => {
            try {
                // Destructure { data } to avoid the 'unused response' error
                const { data } = await api.get('/notifications');
                setNotifications(data.notifications || []);
                setUnreadCount(data.unread_count || 0);
            } catch (err) {
                console.error("Error fetching notifications:", err);
            }
        };

        // 1. Initial Call
        getNotifications();

        // 2. Set up Polling (30 seconds)
        const interval = setInterval(getNotifications, 30000);

        // 3. Cleanup to prevent memory leaks
        return () => clearInterval(interval);
    }, []); // Empty array is now safe because getNotifications is local to the effect

    const handleToggle = async () => {
        setIsOpen((prev) => !prev);
        
        if (!isOpen && unreadCount > 0) {
            try {
                await api.post('/notifications/mark-as-read');
                setUnreadCount(0);
            } catch (err) {
                console.error("Failed to mark as read:", err);
            }
        }
    };

    return (
        <div className="relative inline-block">
            {/* The Bell Icon */}
            <button 
                onClick={handleToggle}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors relative focus:outline-none"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] items-center justify-center font-bold">
                            {unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-20 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                            Notifications
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm italic">No notifications yet.</div>
                            ) : (
                                notifications.map((n) => (
                                    <div key={n.id} className="p-4 border-b border-gray-50 hover:bg-yellow-50 transition cursor-default">
                                        <p className="text-sm text-gray-800 font-semibold">{n.data.intern_name}</p>
                                        <p className="text-xs text-gray-600 leading-tight">{n.data.message}</p>
                                        <p className="text-[10px] text-gray-400 mt-2 italic text-right">
                                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;