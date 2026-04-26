import React, { useState, useEffect } from 'react';
import api from '../api/axios'; 
import { Bell, AlertTriangle, X, CheckCircle, Info } from 'lucide-react';

const NotificationBell = ({ role = 'intern', onNotificationClick }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const isHR = role === 'hr';

    useEffect(() => {
        let isMounted = true;

        const fetchNotifications = async () => {
            try {
                const { data } = await api.get('/notifications');

                if (!isMounted) return;

                const notifs = isHR ? (data.notifications || data || []) : (typeof data === 'string' ? JSON.parse(data) : data);
                setNotifications(notifs);
                
                // ✨ Persistent Count: Filter and count ONLY items that have no read_at timestamp
                const unread = notifs.filter(n => n.read_at === null).length;
                setUnreadCount(unread);

            } catch (err) {
                console.error(`❌ Error fetching ${role} notifications:`, err);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 8000); // Sync every 8 seconds

        return () => { 
            isMounted = false; 
            clearInterval(interval);
        };
    }, [isHR, role]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        // 🛑 BULK MARK AS READ REMOVED: Opening the bell no longer clears the badge.
    };

    // ✨ NEW: Mark only the clicked item as read
    const handleItemClick = async (notification, payload) => {
        // If it's already unread, tell the backend to mark THIS specific one as read
        if (!notification.read_at) {
            try {
                // We assume your backend has a route to mark a specific ID as read
                // If not, we can just update the local state for immediate feedback
                await api.post(`/notifications/${notification.id}/read`); 
                
                // Update local state so the badge and highlight disappear instantly
                setNotifications(prev => prev.map(n => 
                    n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (err) {
                console.error("Failed to mark single notification as read", err);
            }
        }

        // Trigger the popup if it's a request
        if (payload.request_id && onNotificationClick) {
            onNotificationClick(payload.request_id);
            setIsOpen(false); 
        }
    };

    return (
        <>
            <button onClick={handleToggle} className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 transition focus:outline-none z-30">
                <Bell size={24} />
                {/* Badge stays until individual items are clicked */}
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 border-2 border-white rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" style={{ zIndex: 9998 }} onClick={() => setIsOpen(false)} />
            )}

            <div className={`fixed top-0 right-0 h-screen w-80 sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ zIndex: 9999 }}>
                <div className="flex items-center justify-between px-6 py-5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <Bell size={18} className="text-slate-500" /> 
                        {isHR ? "HR Alerts" : "Notifications"}
                    </h3>
                    <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors focus:outline-none"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center gap-3">
                            <Bell size={48} className="text-slate-200" />
                            <p className="text-sm">You have no new notifications.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => {
                                const payload = typeof n.data === 'string' ? JSON.parse(n.data) : (n.data || {});
                                const isUnread = !n.read_at;
                                const dateSubmitted = new Date(n.created_at).toLocaleString('en-US', { 
                                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
                                });

                                return (
                                    <div 
                                        key={n.id} 
                                        onClick={() => handleItemClick(n, payload)}
                                        className={`relative flex gap-4 p-5 border-b border-slate-50 transition cursor-pointer hover:bg-slate-50 ${isUnread ? 'bg-blue-50/40' : 'bg-white'}`}
                                    >
                                        {isUnread && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-md"></div>
                                        )}

                                        <div className="flex-shrink-0 mt-1">
                                            {n.title?.toLowerCase().includes('approved') ? (
                                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full shadow-sm"><CheckCircle size={16} /></div>
                                            ) : n.title?.toLowerCase().includes('rejected') ? (
                                                <div className="p-2 bg-red-100 text-red-600 rounded-full shadow-sm"><AlertTriangle size={16} /></div>
                                            ) : (
                                                <div className="p-2 bg-blue-100 text-blue-600 rounded-full shadow-sm"><Info size={16} /></div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className={`text-sm leading-tight text-slate-800 ${isUnread ? 'font-extrabold' : 'font-semibold'}`}>
                                                    {payload.title || n.title || 'System Notice'}
                                                </p>
                                                {isUnread && (
                                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold uppercase rounded-full">New</span>
                                                )}
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