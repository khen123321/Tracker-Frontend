import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Megaphone, CheckCircle, Clock, X, Info, AlertTriangle, Calendar, MapPin, Pin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

// ─── TYPESCRIPT INTERFACES ───
interface NotificationPayload {
    title?: string;
    message?: string;
    request_id?: number | string;
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

interface ExtendedProps {
    description?: string;
    is_pinned?: boolean;
    location?: string;
}

interface EventItem {
    id: string | number;
    title: string;
    start?: string;
    end?: string;
    date?: string;
    created_at?: string;
    extendedProps?: ExtendedProps;
}

interface NotificationCenterProps {
    role?: string;
}

// Safely parse JSON data to prevent React crashes
const safeParse = (data: unknown): NotificationPayload => {
    if (!data) return {};
    if (typeof data === 'object') return data as NotificationPayload;
    try {
        return JSON.parse(data as string);
    } catch (e) {
        console.warn("Could not parse notification data:", data);
        return {};
    }
};

export default function NotificationCenter({ role = 'intern' }: NotificationCenterProps) {
    const navigate = useNavigate();
    
    // UI State
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'alerts' | 'announcements'>('alerts');

    // Data State
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [announcements, setAnnouncements] = useState<EventItem[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [itemType, setItemType] = useState<'alert' | 'announcement' | null>(null);

    // ─── FETCH DATA ENGINE ───
    useEffect(() => {
        let isMounted = true;

        const fetchAllData = async () => {
            try {
                const [notifRes, eventRes] = await Promise.all([
                    api.get('/notifications'),
                    api.get('/events')
                ]);

                if (!isMounted) return;

                // Process Notifications
                const systemNotifs: NotificationItem[] = Array.isArray(notifRes.data)
                    ? notifRes.data
                    : (notifRes.data.notifications || []);

                const sortedNotifs = [...systemNotifs].sort(
                    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
                );

                setNotifications(sortedNotifs);
                setUnreadCount(sortedNotifs.filter(n => !n.read_at).length);

                // Process Events/Announcements
                const eventData: EventItem[] = eventRes.data || [];
                const sortedEvents = [...eventData].sort((a, b) => {
                    const dateA = new Date(a.created_at || a.start || '').getTime();
                    const dateB = new Date(b.created_at || b.start || '').getTime();
                    return dateB - dateA;
                });

                setAnnouncements(sortedEvents);
                setLoading(false);

            } catch (error) {
                console.error("❌ Error fetching notification center data:", error);
            }
        };

        fetchAllData();
        const interval = setInterval(fetchAllData, 8000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    // ─── HANDLE ITEM CLICKS ───
    const handleItemClick = async (e: React.MouseEvent, item: any, type: 'alert' | 'announcement') => {
        e.preventDefault();
        e.stopPropagation();
        
        setIsOpen(false); 
        setSelectedItem(item);
        setItemType(type);

        if (type === 'alert' && !item.read_at) {
            setNotifications(prev => prev.map(n => 
                n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));

            try {
                await api.put(`/notifications/${item.id}/read`);
            } catch (err) {
                console.warn('Silent API fail on read status', err);
            }
        }
    };

    const formatTimeAgo = (dateString?: string) => {
        if (!dateString) return 'Just now';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Recently' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    const hasNotifications = unreadCount > 0;
    const pinnedAnnouncements = announcements.filter(ann => ann.extendedProps?.is_pinned === true);

    return (
        <>
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

            {/* ─── BELL ICON TRIGGER ─── */}
            <button 
                type="button" 
                onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(!isOpen);
                }}
                className="relative z-30 focus:outline-none flex items-center justify-center w-11 h-11 rounded-[10px] bg-white border border-slate-300 text-slate-500 cursor-pointer transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:bg-slate-50"
            >
                <div className={hasNotifications ? 'bell-ringing' : ''}>
                    <Bell size={22} strokeWidth={2} className="text-slate-600" />
                </div>
                {hasNotifications && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* ─── DRAWER BACKDROP ─── */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                    style={{ zIndex: 9998 }}
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* ─── SIDEBAR DRAWER ─── */}
            <div
                className={`fixed top-0 right-0 h-screen w-80 sm:w-96 bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
                style={{ zIndex: 9999 }}
            >
                {/* Drawer Header & Tabs */}
                <div className="flex flex-col bg-slate-50 border-b border-slate-200 flex-shrink-0 pt-5">
                    <div className="flex items-center justify-between px-6 pb-4">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <Bell size={20} className="text-slate-500" />
                            {role === 'hr' ? 'HR Alerts' : 'Notification Center'}
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors focus:outline-none"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 px-6 mt-1">
                        <button 
                            type="button" 
                            onClick={(e) => { e.preventDefault(); setActiveTab('alerts'); }}
                            className={`pb-3 text-[13px] font-bold border-b-[3px] transition-colors cursor-pointer bg-transparent px-1 ${activeTab === 'alerts' ? 'border-[#0B1EAE] text-[#0B1EAE]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                        >
                            Alerts 
                            {unreadCount > 0 && <span className="ml-1.5 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-[10px]">{unreadCount}</span>}
                        </button>
                        <button 
                            type="button" 
                            onClick={(e) => { e.preventDefault(); setActiveTab('announcements'); }}
                            className={`pb-3 text-[13px] font-bold border-b-[3px] transition-colors cursor-pointer bg-transparent px-1 ${activeTab === 'announcements' ? 'border-[#0B1EAE] text-[#0B1EAE]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                        >
                            Announcements 
                            {pinnedAnnouncements.length > 0 && <span className="ml-1.5 bg-amber-100 text-amber-600 py-0.5 px-2 rounded-full text-[10px]"><Pin size={8} className="inline mr-0.5" />{pinnedAnnouncements.length}</span>}
                        </button>
                    </div>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto bg-white">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center gap-3">
                            <div className="w-6 h-6 border-[2px] border-slate-200 border-t-[#0B1EAE] rounded-full animate-spin"></div>
                            <span className="text-sm font-medium">Syncing data...</span>
                        </div>
                    ) : activeTab === 'alerts' ? (
                        notifications.length > 0 ? (
                            <div className="flex flex-col pb-6">
                                {notifications.map((notif) => {
                                    const payload = safeParse(notif.data);
                                    const isUnread = !notif.read_at;
                                    const isRejection = notif.type === 'rejection' || notif.title?.toLowerCase().includes('rejected');
                                    const isApproval = notif.title?.toLowerCase().includes('approved');

                                    return (
                                        <div 
                                            key={notif.id} 
                                            onClick={(e) => handleItemClick(e, notif, 'alert')}
                                            className={`relative flex gap-4 p-5 border-b border-slate-100 transition cursor-pointer hover:bg-slate-50 ${
                                                isUnread ? 'bg-blue-50/30' : 'bg-white'
                                            }`}
                                        >
                                            {isUnread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />}
                                            
                                            <div className="flex-shrink-0 mt-1">
                                                {isRejection ? (
                                                    <div className="p-2 bg-red-100 text-red-600 rounded-full shadow-sm"><AlertTriangle size={16} /></div>
                                                ) : isApproval ? (
                                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full shadow-sm"><CheckCircle size={16} /></div>
                                                ) : (
                                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-full shadow-sm"><Info size={16} /></div>
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-sm leading-tight mb-1 ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                                    {payload.title ?? notif.title ?? 'System Notice'}
                                                </h4>
                                                <p className="text-xs text-slate-500 m-0 line-clamp-2 leading-relaxed">
                                                    {payload.message ?? notif.message}
                                                </p>
                                                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mt-2">
                                                    <Clock size={10} /> {formatTimeAgo(notif.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center gap-3">
                                <CheckCircle size={48} className="opacity-20" />
                                <p className="text-sm m-0">You're all caught up!</p>
                            </div>
                        )
                    ) : (
                        announcements.length > 0 ? (
                            <div className="flex flex-col pb-6">
                                {announcements.map((ann) => {
                                    const isPinned = ann.extendedProps?.is_pinned;
                                    return (
                                        <div 
                                            key={ann.id} 
                                            onClick={(e) => handleItemClick(e, ann, 'announcement')}
                                            className={`relative flex gap-4 p-5 border-b border-slate-100 transition cursor-pointer hover:bg-slate-50 ${isPinned ? 'bg-amber-50/40 hover:bg-amber-50' : 'bg-white'}`}
                                        >
                                            <div className={`flex-shrink-0 mt-1 ${isPinned ? 'text-amber-500' : 'text-blue-500'}`}>
                                                <Megaphone size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {isPinned && <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-wider">Pinned</span>}
                                                    <h4 className="text-sm font-bold text-slate-900 m-0 line-clamp-1">{ann.title}</h4>
                                                </div>
                                                <p className="text-xs text-slate-500 m-0 line-clamp-2 leading-relaxed">
                                                    {ann.extendedProps?.description || "Click to view event details."}
                                                </p>
                                                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mt-2">
                                                    <Calendar size={10} /> {formatTimeAgo(ann.start || ann.date || ann.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center gap-3">
                                <Megaphone size={48} className="opacity-20" />
                                <p className="text-sm m-0">No announcements posted yet.</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* ─── FULL DETAILS MODAL (Pop-up) TELEPORTED VIA PORTAL ─── */}
            {selectedItem && createPortal(
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-5 animate-in fade-in"
                    style={{ zIndex: 9999999 }}
                    onClick={() => setSelectedItem(null)}
                >
                    <div 
                        className="bg-white w-full max-w-[550px] max-h-[85vh] rounded-[20px] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className={`px-6 py-5 flex justify-between items-start border-b border-slate-100 ${itemType === 'announcement' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                            <div className="flex gap-3">
                                {itemType === 'announcement' ? (
                                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
                                        <Megaphone size={18} />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                                        <Bell size={18} />
                                    </div>
                                )}
                                <div className="mt-0.5">
                                    <h2 className="text-lg font-extrabold text-slate-900 m-0 leading-snug pr-4">
                                        {itemType === 'alert' 
                                            ? (safeParse(selectedItem.data).title ?? selectedItem.title ?? 'System Notice')
                                            : selectedItem.title
                                        }
                                    </h2>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center cursor-pointer text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
                                onClick={() => setSelectedItem(null)}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-5 overflow-y-auto bg-white flex-1">
                            {itemType === 'announcement' ? (
                                <div className="flex flex-col gap-5">
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-4">
                                        <div className="flex items-start gap-3">
                                            <Calendar className="text-blue-600 mt-0.5" size={18} />
                                            <div>
                                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider m-0 mb-0.5">Date & Time</p>
                                                <p className="text-[13px] text-slate-800 font-semibold m-0">
                                                    {selectedItem.start || selectedItem.date || selectedItem.created_at 
                                                        ? new Date(selectedItem.start || selectedItem.date || selectedItem.created_at).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                        : 'TBA'
                                                    }
                                                    {selectedItem.end && ` — ${new Date(selectedItem.end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                                                </p>
                                            </div>
                                        </div>

                                        {selectedItem.extendedProps?.location && (
                                            <div className="flex items-start gap-3">
                                                <MapPin className="text-red-500 mt-0.5" size={18} />
                                                <div>
                                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider m-0 mb-0.5">Location</p>
                                                    <p className="text-[13px] text-slate-800 font-semibold m-0">{selectedItem.extendedProps.location}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-[12px] font-bold text-slate-900 mb-2 uppercase tracking-wider">Event Details</h3>
                                        <div className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {selectedItem.extendedProps?.description || "No additional details provided by HR."}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-wrap gap-y-2 gap-x-5 mb-5 pb-5 border-b border-slate-100">
                                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[13px]">
                                            <Clock size={14} />
                                            <span>
                                                {selectedItem.created_at 
                                                    ? new Date(selectedItem.created_at).toLocaleString('en-US', { weekday: 'short', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                    : 'Recently'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {safeParse(selectedItem.data).message ?? selectedItem.message}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            {role === 'intern' && itemType === 'alert' && (selectedItem.type === 'rejection' || selectedItem.title?.toLowerCase().includes('rejected')) && (
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setSelectedItem(null);
                                        navigate('/intern-dashboard/logs');
                                    }}
                                    className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold cursor-pointer hover:bg-slate-100 transition-colors"
                                >
                                    Review Logs
                                </button>
                            )}

                            <button 
                                type="button" 
                                onClick={() => setSelectedItem(null)}
                                className="px-6 py-2.5 bg-[#0B1EAE] text-white border-none rounded-lg text-sm font-bold cursor-pointer hover:bg-[#081682] transition-colors shadow-md"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>, 
                document.body
            )}
        </>
    );
}