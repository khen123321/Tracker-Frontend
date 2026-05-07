import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Megaphone, Search, Pin, Calendar, MapPin, Clock, X, ChevronRight, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// ✨ PAGE HEADER IMPORT ✨
import PageHeader from "../../components/layout/PageHeader";

// ─── TYPESCRIPT INTERFACES ───
interface ExtendedProps {
    description?: string;
    is_pinned?: boolean;
    location?: string;
}

interface AnnouncementItem {
    id: string | number;
    title: string;
    start?: string;
    date?: string;
    created_at?: string;
    extendedProps?: ExtendedProps;
}

const Announcement: React.FC = () => {
    const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await api.get<AnnouncementItem[]>('/events');
            
            // Sort by newest first
            // ✅ Fixed Code
            const sortedData = response.data.sort((a: AnnouncementItem, b: AnnouncementItem) => {
               const dateA = new Date(a.created_at || a.start || '').getTime();
                const dateB = new Date(b.created_at || b.start || '').getTime();
                 return dateB - dateA;
            });
            
            setAnnouncements(sortedData);
        } catch (error) {
            console.error("Error fetching announcements:", error);
            toast.error("Failed to load announcements.");
        } finally {
            setLoading(false);
        }
    };

    // Filter logic based on the search bar
    const filteredAnnouncements = announcements.filter(ann => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            ann.title?.toLowerCase().includes(query) || 
            ann.extendedProps?.description?.toLowerCase().includes(query)
        );
    });

    // ─── SPLIT LOGIC LOOKING AT EXTENDEDPROPS ───
    const pinnedAnnouncements = filteredAnnouncements.filter(ann => ann.extendedProps?.is_pinned === true);
    const recentAnnouncements = filteredAnnouncements.filter(ann => !ann.extendedProps?.is_pinned);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
                <div className="w-8 h-8 border-[3px] border-[#0B1EAE]/10 border-t-[#0B1EAE] rounded-full animate-spin mb-3"></div>
                <p>Loading announcements...</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-100 min-h-screen flex flex-col gap-1.5 p-0 font-sans">
            <Toaster position="top-right" />
            
            <PageHeader title="Announcements" />

            {/* Main Content Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col gap-5 flex-grow">
                
                {/* Search Bar Row */}
                <div className="flex justify-end border-b border-slate-100 pb-3 md:justify-start">
                    <div className="relative w-full max-w-[300px] flex items-center md:max-w-full">
                        <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
                        <input 
                            type="text" 
                            placeholder="Search announcements..." 
                            className="w-full py-2.5 pr-4 pl-9 border border-slate-300 rounded-lg outline-none transition-all duration-200 text-sm text-slate-900 bg-white shadow-sm focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10 placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {filteredAnnouncements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-15 px-5 text-slate-500 text-center">
                        <Megaphone size={48} className="text-slate-300 mb-4" />
                        <h3 className="m-0 mb-1.5 text-slate-700 text-lg font-semibold">No announcements found</h3>
                        <p className="text-sm">We couldn't find anything matching your search.</p>
                    </div>
                ) : (
                    <>
                        {/* ─── PINNED SECTION ─── */}
                        {pinnedAnnouncements.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold tracking-wider uppercase pl-1">
                                    <Pin size={14} className="text-slate-400" />
                                    <span>PINNED</span>
                                </div>
                                
                                <div className="flex flex-col gap-3">
                                    {pinnedAnnouncements.map((announcement) => {
                                        const dateObj = new Date(announcement.start || announcement.date || announcement.created_at || '');
                                        
                                        return (
                                            <div 
                                                key={announcement.id} 
                                                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 cursor-pointer transition-all duration-200 relative overflow-hidden shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-red-500 group"
                                                onClick={() => setSelectedAnnouncement(announcement)}
                                            >
                                                <div className="bg-red-50 text-red-500 p-2.5 md:p-3 rounded-lg flex items-center justify-center shrink-0">
                                                    <AlertCircle size={20} />
                                                </div>
                                                
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2.5 mb-1.5">
                                                        <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-[3px] rounded-md text-[11px] font-extrabold tracking-wide">PINNED</span>
                                                        <span className="text-slate-400 text-xs font-semibold font-mono">
                                                            {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-base md:text-[1.05rem] font-bold text-slate-900 m-0 mb-1">{announcement.title}</h3>
                                                    <p className="text-slate-500 text-[0.85rem] m-0 line-clamp-2 leading-relaxed">
                                                        {announcement.extendedProps?.description || "Click to view full details."}
                                                    </p>
                                                </div>
                                                
                                                <div className="hidden md:flex items-center gap-2">
                                                    <ChevronRight size={20} className="text-slate-300 transition-all duration-200 group-hover:text-slate-900 group-hover:translate-x-1" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ─── RECENT SECTION ─── */}
                        {recentAnnouncements.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold tracking-wider uppercase pl-1">
                                    <Calendar size={14} className="text-slate-400" />
                                    <span>RECENT</span>
                                </div>
                                
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                                    {recentAnnouncements.map((announcement) => {
                                        const dateObj = new Date(announcement.start || announcement.date || announcement.created_at || '');
                                        
                                        return (
                                            <div 
                                                key={announcement.id} 
                                                className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer transition-all duration-200 flex flex-col relative overflow-hidden shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-500 group"
                                                onClick={() => setSelectedAnnouncement(announcement)}
                                            >
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-[3px] rounded-md text-[11px] font-extrabold tracking-wide">NOTICE</span>
                                                    <span className="text-slate-400 text-xs font-semibold font-mono">
                                                        {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                
                                                <h3 className="text-base font-bold text-slate-900 m-0 mb-2 leading-snug">{announcement.title}</h3>
                                                
                                                <p className="text-slate-500 text-[0.85rem] leading-relaxed m-0 mb-4 flex-grow line-clamp-3">
                                                    {announcement.extendedProps?.description || "Click to view full details."}
                                                </p>

                                                <div className="flex items-center gap-1 text-slate-400 text-xs font-bold mt-auto transition-colors duration-200 group-hover:text-slate-900">
                                                    <span>READ MORE</span>
                                                    <ChevronRight size={14} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ─── DETAILS MODAL (READ-ONLY) ─── */}
            {selectedAnnouncement && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-[4px] flex justify-center items-center z-[9999] p-5" 
                    onClick={() => setSelectedAnnouncement(null)}
                >
                    <div 
                        className="bg-white rounded-[20px] w-full max-w-[600px] max-h-[85vh] md:max-h-[95vh] flex flex-col shadow-2xl transform scale-100 transition-transform animate-in fade-in zoom-in-95 duration-200" 
                        onClick={e => e.stopPropagation()}
                    >
                        
                        <div className="flex justify-between items-start px-6 pt-6 pb-4 border-b border-slate-100">
                            <h2 className="text-xl font-extrabold text-slate-900 m-0 pr-5 leading-snug">{selectedAnnouncement.title}</h2>
                            <button 
                                onClick={() => setSelectedAnnouncement(null)} 
                                className="bg-slate-100 border-none text-slate-500 cursor-pointer p-1.5 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-slate-200 hover:text-slate-900 hover:rotate-90 shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-6 overflow-y-auto">
                            <div className="flex flex-wrap gap-y-3 gap-x-5 py-4">
                                <div className="flex items-center gap-2 text-slate-600 font-semibold text-[0.85rem]">
                                    <Clock size={16} color="#64748b" />
                                    <span>
                                        {new Date(selectedAnnouncement.start || selectedAnnouncement.date || selectedAnnouncement.created_at || '').toLocaleString('en-US', { 
                                            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', 
                                            hour: '2-digit', minute: '2-digit' 
                                        })}
                                    </span>
                                </div>

                                {selectedAnnouncement.extendedProps?.location && (
                                    <div className="flex items-center gap-2 text-slate-600 font-semibold text-[0.85rem]">
                                        <MapPin size={16} color="#ef4444" />
                                        <span>{selectedAnnouncement.extendedProps.location}</span>
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-slate-100 mb-5"></div>

                            <div className="pb-6">
                                {selectedAnnouncement.extendedProps?.description ? (
                                    selectedAnnouncement.extendedProps.description.split('\n').map((paragraph, index) => (
                                        <p key={index} className="text-slate-700 leading-relaxed mt-0 mb-3 text-[0.95rem]">{paragraph}</p>
                                    ))
                                ) : (
                                    <p className="italic text-slate-400 m-0">No additional details provided.</p>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-[#fafaf9] rounded-b-[20px] flex justify-end">
                            <button 
                                onClick={() => setSelectedAnnouncement(null)} 
                                className="bg-[#0B1EAE] text-white border-none py-2.5 px-6 rounded-lg font-bold text-sm cursor-pointer transition-all duration-200 hover:bg-[#081682] hover:-translate-y-[1px]"
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

export default Announcement;