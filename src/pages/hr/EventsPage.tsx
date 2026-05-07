import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import api from '../../api/axios';
import toast, { Toaster } from 'react-hot-toast';
import { X, MapPin, Trash2, Clock, GraduationCap, BookOpen, Plus, Pin, PinOff } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';

// ─── TYPES & INTERFACES ───
interface EventItem {
    id: string; // ✨ FIXED: Strictly a string for FullCalendar compatibility
    title: string;
    start: string;
    backgroundColor?: string;
    borderColor?: string;
    extendedProps?: {
        type: string;
        time: string;
        location: string;
        school: string;
        course: string;
        description: string;
        is_pinned: boolean;
    };
}

interface SelectedEvent {
    id: string; // ✨ FIXED to match EventItem
    title: string;
    start: string;
    type?: string;
    time?: string;
    location?: string;
    school?: string;
    course?: string;
    description?: string;
    is_pinned?: boolean;
}

interface School {
    id: number | string;
    school: string;
}

interface Course {
    id?: number | string;
    course?: string;
    course_name?: string;
}

interface FormData {
    title: string;
    type: string;
    startDate: string;
    startTime: string;
    location: string;
    audience: string;
    school: string;
    course: string;
    description: string;
    is_pinned: boolean;
}

// ─── SKELETON PRIMITIVES ───
interface SkProps {
    w?: string;
    h?: string;
    r?: string;
    mb?: string;
}

function Sk({ w = '100%', h = '16px', r = '8px', mb = '0' }: SkProps) {
    return (
        <div
            className="bg-slate-200 animate-pulse shrink-0"
            style={{ width: w, height: h, borderRadius: r, marginBottom: mb }}
        />
    );
}

// ─── FULL PAGE SKELETON SCREEN ───
function EventsSkeleton() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 p-3 gap-1.5">
            <div className="flex justify-between items-center p-3.5 px-5 bg-white rounded-[10px] border border-slate-200 mb-3">
                <Sk w="240px" h="26px" r="6px" />
                <div className="flex gap-3">
                    <Sk w="36px" h="36px" r="8px" />
                    <Sk w="210px" h="36px" r="999px" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-1.5 items-start flex-1">
                <aside>
                    <div className="bg-white rounded-[10px] p-5 shadow-sm border border-slate-200 mb-1.5">
                        <Sk w="120px" h="16px" mb="16px" />
                        <Sk w="100%" h="44px" r="8px" />
                    </div>
                    <div className="bg-white rounded-[10px] p-5 shadow-sm border border-slate-200 mb-1.5">
                        <Sk w="140px" h="16px" mb="16px" />
                        <Sk w="80%" h="14px" mb="12px" />
                        <Sk w="85%" h="14px" mb="12px" />
                        <Sk w="75%" h="14px" />
                    </div>
                    <div className="bg-white rounded-[10px] p-5 shadow-sm border border-slate-200 mb-1.5">
                        <Sk w="130px" h="16px" mb="16px" />
                        <div className="flex flex-col gap-2.5">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="p-3 border border-slate-100 rounded-lg bg-slate-50">
                                    <div className="flex justify-between mb-2">
                                        <Sk w="60px" h="10px" />
                                        <Sk w="60px" h="10px" />
                                    </div>
                                    <Sk w="140px" h="14px" mb="8px" />
                                    <Sk w="90px" h="10px" />
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="bg-white p-5 rounded-[10px] shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-5">
                        <Sk w="150px" h="28px" r="6px" />
                        <Sk w="200px" h="34px" r="6px" />
                        <Sk w="100px" h="34px" r="6px" />
                    </div>
                    <Sk w="100%" h="65vh" r="8px" />
                </main>
            </div>
        </div>
    );
}

// ─── MAIN COMPONENT ───
const EventsPage: React.FC = () => {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [initialLoad, setInitialLoad] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);

    // States for Audience Dropdowns
    const [schoolsList, setSchoolsList] = useState<School[]>([]);
    const [coursesList, setCoursesList] = useState<Course[]>([]);
    const [allCoursesList, setAllCoursesList] = useState<Course[]>([]);
    const [loadingDropdowns, setLoadingDropdowns] = useState<boolean>(true);

    const [formData, setFormData] = useState<FormData>({
        title: '', type: 'event', startDate: '', startTime: '09:00',
        location: '', audience: 'all', school: '', course: '', description: '',
        is_pinned: false
    });

    const loadData = useCallback(async () => {
        setLoadingDropdowns(true);
        try {
            const [eventsRes, filtersRes] = await Promise.all([
                api.get('/events'),
                api.get('/event-filters')
            ]);

            const formattedEvents = eventsRes.data.map((ev: any) => {
                let color = '#eab308'; // Default Yellow
                if (ev.extendedProps?.type === 'holiday') color = '#152286'; // Blue
                if (ev.extendedProps?.type === 'reminder') color = '#22c55e'; // Green

                return { 
                    ...ev, 
                    id: String(ev.id), // ✨ FIXED: Cast ID to a string
                    backgroundColor: color, 
                    borderColor: color 
                };
            });

            setSchoolsList(filtersRes.data.schools || []);
            setAllCoursesList(filtersRes.data.courses || []);

            return { events: formattedEvents };
        } catch (err) {
            console.error("Fetch error:", err);
            return null;
        } finally {
            setLoadingDropdowns(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        loadData().then(data => {
            if (isMounted) {
                if (data) setEvents(data.events);
                setInitialLoad(false);
            }
        });
        return () => { isMounted = false; };
    }, [loadData]);

    const handleSchoolChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedSchoolName = e.target.value;
        setFormData(prev => ({ ...prev, school: selectedSchoolName, course: '' }));

        const schoolObj = schoolsList.find(s => s.school === selectedSchoolName);

        if (schoolObj) {
            try {
                const res = await api.get(`/public/courses/${schoolObj.id}`);
                setCoursesList(res.data);
            } catch {
                setCoursesList([]);
            }
        } else {
            setCoursesList([]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        // Type assertion to access 'checked' which only exists on HTMLInputElement
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

        setFormData(prev => {
            const newValue = type === 'checkbox' ? checked : value;
            const newData: any = { ...prev, [name]: newValue };

            if (name === 'audience') {
                newData.school = '';
                newData.course = '';
                setCoursesList([]);
            }
            return newData;
        });
    };

    const handleAddEventClick = () => {
        setSelectedEvent(null);
        setFormData({
            title: '', type: 'event', startDate: new Date().toISOString().split('T')[0],
            startTime: '09:00', location: '', audience: 'all', school: '', course: '', description: '',
            is_pinned: false
        });
        setCoursesList([]);
        setIsModalOpen(true);
    };

    const handleDateClick = (arg: any) => {
        setSelectedEvent(null);
        setFormData({
            ...formData, startDate: arg.dateStr, title: '', description: '',
            location: '', audience: 'all', school: '', course: '', is_pinned: false
        });
        setCoursesList([]);
        setIsModalOpen(true);
    };

    const handleEventClick = (info: any) => {
        setSelectedEvent({
            id: info.event.id, // FullCalendar naturally parses this as a string back to us
            title: info.event.title,
            start: info.event.startStr,
            ...info.event.extendedProps
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...formData,
            date: formData.startDate,
            time: formData.startTime,
            school: (formData.audience === 'school' || formData.audience === 'both') ? formData.school : null,
            course: (formData.audience === 'course' || formData.audience === 'both') ? formData.course : null,
            is_pinned: formData.is_pinned ? 1 : 0
        };

        try {
            await api.post('/events', payload);
            toast.success("Event Published!");
            setIsModalOpen(false);

            const ref = await loadData();
            if (ref) setEvents(ref.events);
        } catch (error: any) {
            console.error("🔥 LARAVEL CRASH REPORT:", error.response?.data);
            const realError = error.response?.data?.error || error.response?.data?.message || "Failed to sync event";
            toast.error(realError);
        }
    };

    const handleTogglePin = async (id: string | number, currentPinStatus?: boolean) => {
        try {
            const endpoint = currentPinStatus ? `/events/${id}/unpin` : `/events/${id}/pin`;
            await api.put(endpoint);

            toast.success(currentPinStatus ? "Event unpinned!" : "Event pinned!");
            setIsModalOpen(false);

            const ref = await loadData();
            if (ref) setEvents(ref.events);
        } catch {
            toast.error("Failed to update pin status.");
        }
    };

    const handleDelete = async (id: string | number) => {
        if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;
        try {
            await api.delete(`/events/${id}`);
            toast.success("Event deleted successfully");
            setIsModalOpen(false);

            const ref = await loadData();
            if (ref) setEvents(ref.events);
        } catch {
            toast.error("Failed to delete event.");
        }
    };

    if (initialLoad) return <EventsSkeleton />;

    // Shared input class string to keep JSX clean
    const inputClasses = "w-full p-2.5 border border-slate-200 rounded-lg outline-none text-[13px] transition-all bg-slate-50 focus:border-[#0B1EAE] focus:bg-white focus:ring-[3px] focus:ring-[#0B1EAE]/10";

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 p-3 gap-1.5 text-slate-900 font-sans">
            {/* Global style injections for custom scrollbar and FullCalendar overrides */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                
                .fc {
                    --fc-border-color: #f1f5f9;
                    --fc-button-text-color: #475569;
                    --fc-button-bg-color: #ffffff;
                    --fc-button-border-color: #e2e8f0;
                    --fc-button-hover-bg-color: #f8fafc;
                    --fc-button-hover-border-color: #cbd5e1;
                    --fc-button-active-bg-color: #f1f5f9;
                    --fc-today-bg-color: #eff6ff;
                }
                .fc .fc-toolbar-title { font-size: 18px !important; font-weight: 700; color: #0f172a; }
                .fc .fc-button { font-size: 13px !important; font-weight: 600 !important; text-transform: capitalize !important; padding: 6px 12px !important; }
                .fc-col-header-cell { padding: 12px 0 !important; background: #f8fafc; }
                .fc-col-header-cell-cushion { font-size: 12px; font-weight: 600; color: #64748b; text-decoration: none !important; }
            `}</style>

            <Toaster position="top-right" />

            <PageHeader title="Events" />

            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-1.5 items-start flex-1">
                
                {/* --- LEFT SIDEBAR --- */}
                <aside>
                    <div className="bg-white rounded-[10px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-slate-200 mb-1.5">
                        <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">Create Event</h2>
                        <button 
                            onClick={handleAddEventClick} 
                            className="w-full bg-[#0B1EAE] hover:bg-[#091891] text-white rounded-lg p-3 text-[13px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-[1px]"
                        >
                            <Plus size={18} /> Add New Event
                        </button>
                    </div>

                    <div className="bg-white rounded-[10px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-slate-200 mb-1.5">
                        <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">Category Legend</h2>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2.5 text-[13px] text-slate-600 font-medium"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Event (Regular Work)</div>
                            <div className="flex items-center gap-2.5 text-[13px] text-slate-600 font-medium"><span className="w-2 h-2 rounded-full bg-[#152286]"></span> Holiday (No Work)</div>
                            <div className="flex items-center gap-2.5 text-[13px] text-slate-600 font-medium"><span className="w-2 h-2 rounded-full bg-green-500"></span> Reminder / Deadline</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[10px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-slate-200 mb-1.5">
                        <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">Upcoming Events</h2>
                        <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                            {events.length === 0 ? <p className="text-sm text-slate-500 italic">No upcoming events.</p> :
                                events.slice(0, 5).map(ev => (
                                    <div 
                                        key={ev.id} 
                                        className="bg-slate-50 rounded-lg p-3 cursor-pointer transition-all duration-200 border border-slate-100 hover:border-slate-300 hover:bg-slate-100" 
                                        onClick={() => handleEventClick({ event: ev })}
                                    >
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase">
                                            <span>{ev.extendedProps?.time || 'All Day'}</span>
                                            <span>{ev.start.split('T')[0]}</span>
                                        </div>
                                        <h4 className="text-[13px] font-bold text-slate-900 mb-1 flex items-center">
                                            {ev.title}
                                            {ev.extendedProps?.is_pinned && <Pin size={12} className="ml-2 text-red-500 fill-red-500" />}
                                        </h4>
                                        {ev.extendedProps?.location && (
                                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                                <MapPin size={14} /> {ev.extendedProps.location}
                                            </div>
                                        )}
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </aside>

                {/* --- MAIN CALENDAR --- */}
                <main className="bg-white p-5 rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-slate-200">
                    <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin, multiMonthPlugin]}
                        initialView="dayGridMonth"
                        events={events}
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                        height="78vh"
                        headerToolbar={{
                            left: 'title',
                            center: 'today prev,next',
                            right: 'multiMonthYear,dayGridMonth'
                        }}
                        buttonText={{
                            multiMonthYear: 'Year View',
                            dayGridMonth: 'Month View'
                        }}
                    />
                </main>
            </div>

            {/* --- MODAL (CREATE / VIEW / DELETE) --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px]" onMouseDown={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-xl w-full max-w-[750px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200" onMouseDown={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-[#fffbfa]">
                            <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                {selectedEvent ? 'Event Details' : 'Create New Event'}
                                {selectedEvent?.is_pinned && <Pin size={16} className="text-red-500 fill-red-500" />}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
                                <X size={20} />
                            </button>
                        </div>

                        {selectedEvent ? (
                            <div className="p-6">
                                <div className="mb-2">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase text-white ${
                                        selectedEvent.type === 'holiday' ? 'bg-[#152286]' :
                                        selectedEvent.type === 'reminder' ? 'bg-green-500' : 'bg-yellow-500'
                                    }`}>
                                        {selectedEvent.type}
                                    </span>
                                </div>
                                <h1 className="text-2xl font-black mb-4 text-slate-900 leading-tight">{selectedEvent.title}</h1>

                                <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2"><Clock size={16} className="text-slate-400" /> {selectedEvent.time || 'All Day'}</div>
                                    <div className="flex items-center gap-2"><MapPin size={16} className="text-slate-400" /> {selectedEvent.location || 'N/A'}</div>

                                    <div className="flex items-center gap-2 text-blue-700 font-semibold"><GraduationCap size={16} /> {selectedEvent.school || 'All Universities'}</div>
                                    <div className="flex items-center gap-2 text-blue-700 font-semibold"><BookOpen size={16} /> {selectedEvent.course || 'All Courses'}</div>
                                </div>

                                {selectedEvent.description && (
                                    <div className="mb-6">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                                    <button onClick={() => handleDelete(selectedEvent.id)} className="flex-1 w-full p-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-semibold border border-rose-200 flex items-center justify-center gap-2 transition-colors">
                                        <Trash2 size={18} /> Delete Event
                                    </button>

                                    <button
                                        onClick={() => handleTogglePin(selectedEvent.id, selectedEvent.is_pinned)}
                                        className={`flex items-center justify-center gap-2 flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                                            selectedEvent.is_pinned
                                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                                        }`}
                                    >
                                        {selectedEvent.is_pinned ? (
                                            <><PinOff size={18} /> Unpin Event</>
                                        ) : (
                                            <><Pin size={18} /> Pin Event</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-3">
                                        <label className="text-xs font-semibold text-slate-600 -mb-1">Event Title</label>
                                        <input name="title" value={formData.title} onChange={handleInputChange} className={inputClasses} placeholder="e.g. Monthly Townhall" required />

                                        <label className="text-xs font-semibold text-slate-600 -mb-1">Event Category</label>
                                        <select name="type" value={formData.type} onChange={handleInputChange} className={inputClasses}>
                                            <option value="event">Event (Regular Work)</option>
                                            <option value="holiday">Holiday (No Work)</option>
                                            <option value="reminder">Reminder / Deadline</option>
                                        </select>

                                        <label className="text-xs font-semibold text-slate-600 -mb-1">Target Audience</label>
                                        <select name="audience" value={formData.audience} onChange={handleInputChange} className={inputClasses}>
                                            <option value="all">Everyone (All Interns)</option>
                                            <option value="school">Specific University</option>
                                            <option value="course">Specific Course</option>
                                            <option value="both">University & Course</option>
                                        </select>

                                        {(formData.audience === 'school' || formData.audience === 'both') && (
                                            <div className="mt-1 animate-in fade-in slide-in-from-top-2 flex flex-col gap-3">
                                                <label className="text-xs font-semibold text-slate-600 -mb-1">Select University</label>
                                                <select name="school" value={formData.school} onChange={handleSchoolChange} disabled={loadingDropdowns} className={inputClasses} required>
                                                    <option value="">{loadingDropdowns ? "Loading..." : "-- Select School --"}</option>
                                                    {schoolsList.map((s, idx) => <option key={s.id || idx} value={s.school}>{s.school}</option>)}
                                                </select>
                                            </div>
                                        )}

                                        {(formData.audience === 'course' || formData.audience === 'both') && (
                                            <div className="mt-1 animate-in fade-in slide-in-from-top-2 flex flex-col gap-3">
                                                <label className="text-xs font-semibold text-slate-600 -mb-1">Select Course</label>
                                                <select
                                                    name="course"
                                                    value={formData.course}
                                                    onChange={handleInputChange}
                                                    className={inputClasses}
                                                    disabled={(formData.audience === 'both' && !formData.school) || (formData.audience === 'both' && coursesList.length === 0)}
                                                    required
                                                >
                                                    <option value="">
                                                        {formData.audience === 'both' && !formData.school
                                                            ? "Select a school first"
                                                            : formData.audience === 'both' && coursesList.length === 0
                                                                ? "No courses found"
                                                                : "-- Select Course --"}
                                                    </option>

                                                    {formData.audience === 'course'
                                                        ? allCoursesList.map((c, i) => <option key={c.id || i} value={c.course}>{c.course}</option>)
                                                        : coursesList.map((c, i) => <option key={c.id || i} value={c.course_name}>{c.course_name}</option>)
                                                    }
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <label className="text-xs font-semibold text-slate-600 -mb-1">Date & Time</label>
                                        <div className="flex gap-2">
                                            <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className={`${inputClasses} flex-[1.5]`} required />
                                            <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className={`${inputClasses} flex-1`} required />
                                        </div>

                                        <label className="text-xs font-semibold text-slate-600 -mb-1">Location (Optional)</label>
                                        <input name="location" value={formData.location} onChange={handleInputChange} className={inputClasses} placeholder="e.g. Main Office / Zoom Link" />

                                        <label className="text-xs font-semibold text-slate-600 -mb-1">Description / Notes (Optional)</label>
                                        <textarea name="description" value={formData.description} onChange={handleInputChange} className={inputClasses} rows={4} placeholder="Provide extra details here..." />

                                        <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="is_pinned"
                                                    checked={formData.is_pinned}
                                                    onChange={handleInputChange}
                                                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-[#0B1EAE] cursor-pointer"
                                                />
                                                <span className="text-sm font-semibold text-slate-700">
                                                    📌 Pin this event to the top of announcements
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button type="submit" className="px-6 py-2.5 bg-[#0B1EAE] hover:bg-[#091891] text-white rounded-lg font-semibold text-sm transition-colors">Publish Event</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsPage;