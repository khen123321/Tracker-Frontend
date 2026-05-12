import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { AlertTriangle, X, CheckCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// REDUX IMPORTS 
import { useSelector } from 'react-redux';
import { RootState } from '../store';

import CustomBellIcon from './icons/CustomBellIcon';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationBellProps {
    onNotificationClick?: (id?: number | string) => void;
}

interface NotificationPayload {
    title?: string;
    message?: string;
    request_id?: number | string;
    form_id?: number | string;
    intern_request_id?: number | string;
    id?: number | string;
    [key: string]: any; // Catch-all for other Laravel notification shapes
}

interface NotificationItem {
    id: number | string;
    type?: string;
    title?: string;
    message?: string;
    data?: string | Record<string, unknown>;
    read_at?: string | null;
    created_at?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const NotificationBell: React.FC<NotificationBellProps> = ({
    onNotificationClick,
}) => {

    const { user } = useSelector((state: RootState) => state.auth);
    const role = user?.role?.toLowerCase() || 'intern'; // Default fallback
    const isHR = role === 'hr' || role === 'superadmin';

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;

        const fetchAllData = async (): Promise<void> => {
            try {
                const notifRes = await api.get('/notifications');

                if (!isMounted) return;

                const systemNotifs: NotificationItem[] = Array.isArray(notifRes.data)
                    ? notifRes.data
                    : (notifRes.data.notifications || []);

                const sortedNotifs = [...systemNotifs].sort(
                    (a, b) =>
                        new Date(b.created_at ?? 0).getTime() -
                        new Date(a.created_at ?? 0).getTime()
                );

                setNotifications(sortedNotifs);

                const unread = sortedNotifs.filter(
                    (n) => n.read_at === null || n.read_at === undefined
                ).length;
                setUnreadCount(unread);
            } catch (err: unknown) {
                const axiosErr = err as { response?: { status: number } };
                if (axiosErr.response?.status !== 404) {
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
    }, [isHR, role]); // Depend on the Redux derived values

    const handleToggle = (): void => setIsOpen(!isOpen);

    const handleItemClick = async (
        notification: NotificationItem,
        payload: NotificationPayload
    ): Promise<void> => {
        
        // 1. Mark as read in the background
        if (!notification.read_at) {
            try {
                await api.put(`/notifications/${notification.id}/read`).catch(() => {});
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === notification.id
                            ? { ...n, read_at: new Date().toISOString() }
                            : n
                    )
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch (err) {
                console.error('Failed to mark notification as read', err);
            }
        }

        // 2. Close the drawer
        setIsOpen(false);

        // 3. Handle Navigation
        if (role === 'intern') {
            const isRejection =
                notification.type === 'rejection' ||
                notification.title?.toLowerCase().includes('rejected') ||
                payload.title?.toLowerCase().includes('rejected');

            if (isRejection) {
                navigate('/intern-dashboard/logs');
            } else {
                navigate('/intern-dashboard/announcements');
            }
        } else {
            // ✨ THE FIX: Aggressively search the payload for the true Database ID
            // HR notifications often package the ID under different keys depending on the Laravel Mailout
            const targetId = payload.request_id || payload.form_id || payload.intern_request_id || payload.id;
            
            // We pass a Timestamp so React Router forces a re-render even if they are already on the page!
            navigate('/hr-dashboard/requests', { 
                state: { 
                    openRequestId: targetId,
                    _forceUpdate: Date.now() 
                } 
            }); 
            
            if (onNotificationClick) {
                onNotificationClick(targetId);
            }
        }
    };

    const hasNotifications = unreadCount > 0;

    return (
        <>
            {/* Ring animation keyframe */}
            <style>{`
                @keyframes bellRing {
                    0%,100% { transform: rotate(0deg); }
                    10%,30%  { transform: rotate(-12deg); }
                    20%,40%  { transform: rotate(12deg); }
                    50%      { transform: rotate(0deg); }
                }
                .bell-ringing {
                    animation: bellRing 1.2s ease-in-out infinite;
                    transform-origin: top center;
                }
            `}</style>

            {/* ── Bell Button ── */}
            <button
                onClick={handleToggle}
                className="relative z-30 focus:outline-none flex items-center justify-center w-11 h-11 rounded-[10px] bg-white border border-slate-300 text-slate-500 cursor-pointer transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:bg-slate-50"
            >
                <div className={hasNotifications ? 'bell-ringing' : ''}>
                    <CustomBellIcon
                        size={26}
                        strokeWidth={2}
                        color="#475569"
                        isShaking={hasNotifications}
                    />
                </div>

                {hasNotifications && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* ── Backdrop ── */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                    style={{ zIndex: 9998 }}
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* ── Sidebar Drawer ── */}
            <div
                className={`fixed top-0 right-0 h-screen w-80 sm:w-96 bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
                style={{ zIndex: 9999 }}
            >
                {/* Drawer Header */}
                <div className="flex items-center justify-between px-6 py-5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <CustomBellIcon size={18} color="#64748b" />
                        {isHR ? 'HR Alerts' : 'Notifications'}
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
                            <CustomBellIcon size={48} color="#e2e8f0" />
                            <p className="text-sm">You have no new notifications.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => {
                                const payload: NotificationPayload =
                                    typeof n.data === 'string'
                                        ? (JSON.parse(n.data) as NotificationPayload)
                                        : ((n.data as NotificationPayload) ?? {});

                                const isUnread = !n.read_at;

                                const dateSubmitted = n.created_at
                                    ? new Date(n.created_at).toLocaleString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: 'numeric',
                                          minute: '2-digit',
                                          hour12: true,
                                      })
                                    : 'Just now';

                                const isRejection =
                                    n.type === 'rejection' ||
                                    n.title?.toLowerCase().includes('rejected');
                                const isApproval =
                                    n.title?.toLowerCase().includes('approved');

                                return (
                                    <div
                                        key={n.id}
                                        onClick={() => handleItemClick(n, payload)}
                                        className={`relative flex gap-4 p-5 border-b border-slate-50 transition cursor-pointer hover:bg-slate-50 ${
                                            isUnread ? 'bg-blue-50/40' : 'bg-white'
                                        }`}
                                    >
                                        {/* Unread indicator stripe */}
                                        {isUnread && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-md" />
                                        )}

                                        {/* Icon */}
                                        <div className="flex-shrink-0 mt-1">
                                            {isRejection ? (
                                                <div className="p-2 bg-red-100 text-red-600 rounded-full shadow-sm">
                                                    <AlertTriangle size={16} />
                                                </div>
                                            ) : isApproval ? (
                                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full shadow-sm">
                                                    <CheckCircle size={16} />
                                                </div>
                                            ) : (
                                                <div className="p-2 bg-blue-100 text-blue-600 rounded-full shadow-sm">
                                                    <Info size={16} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p
                                                    className={`text-sm leading-tight text-slate-800 ${
                                                        isUnread ? 'font-extrabold' : 'font-semibold'
                                                    }`}
                                                >
                                                    {payload.title ?? n.title ?? 'System Notice'}
                                                </p>
                                                {isUnread && (
                                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold uppercase rounded-full">
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-medium text-slate-500 mb-2">
                                                Submitted: {dateSubmitted}
                                            </p>
                                            <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                                {payload.message ?? n.message}
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