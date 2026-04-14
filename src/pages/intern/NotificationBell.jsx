import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios'; // Make sure this path is correct based on your folder structure!
import { Bell, Check, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Count how many are unread
    const unreadCount = notifications.filter(n => n.read_at === null).length;

    // 1. Fetch function ONLY gets data; it does not touch state
    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            return res.data;
        } catch (error) {
            console.error("Failed to load notifications:", error); // ✅ Fixes "error is defined but never used"
            return null;
        }
    };

    // 2. Safe Effect Pattern: Resolves data, then sets state safely
    useEffect(() => {
        let isMounted = true;

        fetchNotifications().then(data => {
            if (isMounted && data) {
                setNotifications(data); // ✅ Linter is happy!
            }
        });

        return () => { isMounted = false; };
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

    const markAllAsRead = async () => {
        if (unreadCount === 0) return;
        
        try {
            await api.post('/notifications/mark-as-read');
            setNotifications(notifications.map(n => ({ ...n, read_at: new Date().toISOString() })));
            toast.success('All caught up!');
            setIsOpen(false);
        } catch (error) {
            console.error("Mark read error:", error); // ✅ Catch unused error here too
            toast.error('Failed to mark as read');
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* --- BELL BUTTON --- */}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
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
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
                            >
                                <Check size={14} /> Mark all read
                            </button>
                        )}
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
                                    className={`flex gap-3 p-4 border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer ${notif.read_at ? 'opacity-60' : 'bg-white'}`}
                                >
                                    {/* Icon based on notification type */}
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="p-2 bg-yellow-100 text-yellow-700 rounded-full">
                                            <Calendar size={16} />
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {notif.data.title || "New Update"}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                            {notif.data.message}
                                        </p>
                                        <p className="text-[10px] font-semibold text-slate-400 mt-2">
                                            {new Date(notif.created_at).toLocaleString()}
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