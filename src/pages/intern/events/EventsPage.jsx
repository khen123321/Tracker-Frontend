import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import toast, { Toaster } from 'react-hot-toast';
import { 
    Calendar as CalendarIcon, X, MapPin, Clock, 
    GraduationCap, BookOpen, Bell, Pin, ChevronRight, 
    AlertCircle, Info, CalendarDays
} from 'lucide-react';
import PageHeader from '../../../components/PageHeader';

// ─── SKELETON LOADER FOR FEED LAYOUT ───
function EventsSkeleton() {
    return (
        <div className="p-4 md:p-6 bg-[#f1f5f9] min-h-screen font-sans flex flex-col gap-5">
            {/* Header Skeleton */}
            <div className="flex justify-between p-4 bg-white rounded-xl border border-slate-200 mb-4">
                <div className="w-60 h-8 bg-slate-200 rounded animate-pulse" />
                <div className="w-32 h-8 bg-slate-200 rounded-full animate-pulse" />
            </div>

            {/* Pinned Skeleton */}
            <div className="w-32 h-4 bg-slate-200 rounded mb-2 animate-pulse" />
            <div className="w-full h-32 bg-white border border-slate-200 rounded-xl mb-8 animate-pulse" />

            {/* Recent Skeleton */}
            <div className="w-32 h-4 bg-slate-200 rounded mb-2 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-48 bg-white border border-slate-200 rounded-xl animate-pulse" />
                <div className="h-48 bg-white border border-slate-200 rounded-xl animate-pulse" />
                <div className="h-48 bg-white border border-slate-200 rounded-xl animate-pulse" />
                <div className="h-48 bg-white border border-slate-200 rounded-xl animate-pulse" />
            </div>
        </div>
    );
}

// ─── MAIN COMPONENT ───
const EventsPage = () => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const loadData = useCallback(async () => {
        try {
            // The backend automatically filters these based on the logged-in Intern's school/course
            const response = await api.get('/events');
            
            // Sort by date descending
            const sortedEvents = response.data.sort((a, b) => new Date(b.start) - new Date(a.start));
            return sortedEvents;
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Failed to load your events.");
            return [];
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        loadData().then(data => {
            if (isMounted) {
                setEvents(data);
                setIsLoading(false);
            }
        });
        return () => { isMounted = false; };
    }, [loadData]);

    const handleEventClick = (ev) => {
        setSelectedEvent({ 
            id: ev.id, 
            title: ev.title, 
            start: ev.start, 
            ...ev.extendedProps 
        });
        setIsModalOpen(true);
    };

    // ─── DATA SPLITTING & HELPERS ───
    const pinnedEvents = events.filter(ev => ev.extendedProps?.is_pinned === true || ev.extendedProps?.is_pinned === 1);
    const recentEvents = events.filter(ev => !ev.extendedProps?.is_pinned);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric' 
        });
    };

    // Dynamic Color Mapping based on Event Type
    const getTypeStyles = (type) => {
        switch(type?.toLowerCase()) {
            case 'holiday':
                return { border: 'border-l-blue-500', badge: 'bg-blue-100 text-blue-700', iconBg: 'bg-blue-50 text-blue-500' };
            case 'reminder':
                return { border: 'border-l-green-500', badge: 'bg-green-100 text-green-700', iconBg: 'bg-green-50 text-green-500' };
            case 'event':
            default:
                return { border: 'border-l-yellow-500', badge: 'bg-yellow-100 text-yellow-700', iconBg: 'bg-yellow-50 text-yellow-500' };
        }
    };

    if (isLoading) return <EventsSkeleton />;

    return (
        <div className="p-4 md:p-6 bg-[#f1f5f9] min-h-screen font-sans flex flex-col gap-5">
            <Toaster position="top-right" />
            
            {/* ✨ PAGE HEADER ✨ */}
            <PageHeader title="Events Feed" subtitle="Your schedule and company activities" />

            <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
                
                {/* ─── PINNED SECTION (FULL WIDTH CARDS) ─── */}
                {pinnedEvents.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-4 px-2">
                            <Pin size={14} /> <span>Pinned</span>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            {pinnedEvents.map(ev => {
                                const styles = getTypeStyles(ev.extendedProps?.type);
                                
                                return (
                                    <div 
                                        key={ev.id} 
                                        onClick={() => handleEventClick(ev)}
                                        className={`bg-white border-l-4 ${styles.border} border-y border-r border-slate-200 rounded-xl p-5 flex items-center gap-5 cursor-pointer hover:shadow-lg hover:border-slate-300 transition-all duration-200 group`}
                                    >
                                        <div className={`p-3 rounded-xl shrink-0 ${styles.iconBg}`}>
                                            <AlertCircle size={24} />
                                        </div>
                                        
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}>
                                                    {ev.extendedProps?.type || 'EVENT'}
                                                </span>
                                                <span className="text-xs text-slate-400 font-medium font-mono">
                                                    {formatDate(ev.start)}
                                                </span>
                                                {/* Optional "New" tag if created recently */}
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Pinned
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight group-hover:text-blue-700 transition-colors">
                                                {ev.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 line-clamp-2">
                                                {ev.extendedProps?.description || 'No additional details provided.'}
                                            </p>
                                        </div>
                                        
                                        <ChevronRight className="text-slate-300 group-hover:text-slate-600 transition-transform group-hover:translate-x-1 shrink-0" />
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ─── RECENT SECTION (GRID CARDS) ─── */}
                <section>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-4 px-2">
                        <CalendarDays size={14} /> <span>Recent & Upcoming</span>
                    </div>

                    {recentEvents.length === 0 ? (
                        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl text-slate-400">
                            <CalendarIcon size={48} className="mx-auto mb-3 opacity-50" />
                            <p>No events found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recentEvents.map(ev => {
                                const styles = getTypeStyles(ev.extendedProps?.type);

                                return (
                                    <div 
                                        key={ev.id} 
                                        onClick={() => handleEventClick(ev)}
                                        className={`bg-white border-l-4 ${styles.border} border-y border-r border-slate-200 rounded-xl p-6 flex flex-col cursor-pointer hover:shadow-lg hover:border-slate-300 transition-all duration-200 group`}
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}>
                                                {ev.extendedProps?.type || 'EVENT'}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium font-mono">
                                                {formatDate(ev.start)}
                                            </span>
                                        </div>
                                        
                                        <h3 className="text-base font-bold text-slate-800 mb-2 leading-tight group-hover:text-blue-700 transition-colors">
                                            {ev.title}
                                        </h3>
                                        
                                        <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-grow">
                                            {ev.extendedProps?.description || 'No additional details provided.'}
                                        </p>
                                        
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 group-hover:text-slate-700 transition-colors mt-auto pt-4 border-t border-slate-100">
                                            READ MORE <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            {/* ─── VIEW DETAILS MODAL ─── */}
            {isModalOpen && selectedEvent && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        
                        <div className="flex justify-between items-start p-6 border-b border-slate-100">
                            <h2 className="font-bold text-lg text-slate-800">Event Details</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="p-8">
                            <div className="mb-4">
                                <span className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase text-white ${
                                    selectedEvent.type === 'holiday' ? 'bg-[#152286]' : 
                                    selectedEvent.type === 'reminder' ? 'bg-green-500' : 'bg-yellow-500'
                                }`}>
                                    {selectedEvent.type || 'EVENT'}
                                </span>
                            </div>
                            
                            <h1 className="text-3xl font-black mb-6 text-slate-900 leading-tight">
                                {selectedEvent.title}
                            </h1>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-8 p-6 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-600">
                                <div className="flex items-center gap-3">
                                    <Clock size={18} className="text-slate-400"/> 
                                    <span className="font-medium">{selectedEvent.time || 'All Day'} • {formatDate(selectedEvent.start)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin size={18} className="text-slate-400"/> 
                                    <span className="font-medium">{selectedEvent.location || 'No Location Set'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <GraduationCap size={18} className="text-blue-500"/> 
                                    <span className="font-semibold text-slate-700">{selectedEvent.school || 'All Universities'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <BookOpen size={18} className="text-blue-500"/> 
                                    <span className="font-semibold text-slate-700">{selectedEvent.course || 'All Courses'}</span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Description</h4>
                                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {selectedEvent.description || "No description provided for this event."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="px-8 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsPage;