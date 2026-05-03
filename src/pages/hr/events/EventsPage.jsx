import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../../api/axios';
import toast, { Toaster } from 'react-hot-toast';
import { X, MapPin, Trash2, Clock, GraduationCap, BookOpen, Plus, Pin, PinOff } from 'lucide-react';
import styles from './EventsPage.module.css';

// ✨ IMPORT YOUR UNIFIED PAGE HEADER ✨
import PageHeader from '../../../components/PageHeader';

// ─── SKELETON PRIMITIVES ───
function Sk({ w = '100%', h = '16px', r = '8px', mb = '0' }) {
    return <div className={styles.skel} style={{ width: w, height: h, borderRadius: r, marginBottom: mb, flexShrink: 0 }} />;
}

// ─── FULL PAGE SKELETON SCREEN ───
function EventsSkeleton() {
    return (
        <div className={styles.pageWrapper}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', background: '#fff', borderRadius: '10px', border: '1px solid #e8eaf0', marginBottom: '12px' }}>
                <Sk w="240px" h="26px" r="6px" />
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Sk w="36px" h="36px" r="8px" />
                    <Sk w="210px" h="36px" r="999px" />
                </div>
            </div>

            <div className={styles.mainGrid}>
                <aside>
                    <div className={styles.sidebarBlock}>
                        <Sk w="120px" h="16px" mb="16px" />
                        <Sk w="100%" h="44px" r="8px" />
                    </div>
                    <div className={styles.sidebarBlock}>
                        <Sk w="140px" h="16px" mb="16px" />
                        <Sk w="80%" h="14px" mb="12px" />
                        <Sk w="85%" h="14px" mb="12px" />
                        <Sk w="75%" h="14px" />
                    </div>
                    <div className={styles.sidebarBlock}>
                        <Sk w="130px" h="16px" mb="16px" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} style={{ padding: '12px', border: '1px solid #f1f5f9', borderRadius: '8px', background: '#f8fafc' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
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

                <main className={styles.calendarWrapper}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
const EventsPage = () => {
    const [events, setEvents] = useState([]);
    const [initialLoad, setInitialLoad] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    
    // States for Audience Dropdowns
    const [schoolsList, setSchoolsList] = useState([]);
    const [coursesList, setCoursesList] = useState([]);
    const [allCoursesList, setAllCoursesList] = useState([]);
    const [loadingDropdowns, setLoadingDropdowns] = useState(true);

    const [formData, setFormData] = useState({
        title: '', type: 'event', startDate: '', startTime: '09:00',
        location: '', audience: 'all', school: '', course: '', description: '',
        is_pinned: false // ✨ NEW: Pin state in form
    });

    const loadData = useCallback(async () => {
        setLoadingDropdowns(true);
        try {
            const [eventsRes, filtersRes] = await Promise.all([
                api.get('/events'),
                api.get('/event-filters')
            ]);
            
            const formattedEvents = eventsRes.data.map(ev => {
                let color = '#eab308'; // Default Yellow
                if (ev.extendedProps?.type === 'holiday') color = '#152286'; // Blue
                if (ev.extendedProps?.type === 'reminder') color = '#22c55e'; // Green
                
                return { ...ev, backgroundColor: color, borderColor: color };
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

    const handleSchoolChange = async (e) => {
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

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            // ✨ NEW: Handle checkbox for is_pinned
            const newValue = type === 'checkbox' ? checked : value;
            const newData = { ...prev, [name]: newValue };
            
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
            is_pinned: false // Reset pin state
        });
        setCoursesList([]);
        setIsModalOpen(true);
    };

    const handleDateClick = (arg) => {
        setSelectedEvent(null);
        setFormData({ 
            ...formData, startDate: arg.dateStr, title: '', description: '', 
            location: '', audience: 'all', school: '', course: '', is_pinned: false 
        });
        setCoursesList([]);
        setIsModalOpen(true);
    };

    const handleEventClick = (info) => {
        setSelectedEvent({ 
            id: info.event.id, 
            title: info.event.title, 
            start: info.event.startStr, 
            ...info.event.extendedProps 
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const payload = {
            ...formData,
            date: formData.startDate,
            time: formData.startTime,
            school: (formData.audience === 'school' || formData.audience === 'both') ? formData.school : null,
            course: (formData.audience === 'course' || formData.audience === 'both') ? formData.course : null,
            is_pinned: formData.is_pinned ? 1 : 0 // Ensure it sends as boolean/int
        };

        try {
            await api.post('/events', payload);
            toast.success("Event Published!");
            setIsModalOpen(false);
            
            const ref = await loadData();
            if (ref) setEvents(ref.events);
        } catch (error) { 
            console.error("🔥 LARAVEL CRASH REPORT:", error.response?.data);
            const realError = error.response?.data?.error || error.response?.data?.message || "Failed to sync event";
            toast.error(realError);
        }
    };

    // ✨ NEW: Toggle Pin Status from the View Modal ✨
    const handleTogglePin = async (id, currentPinStatus) => {
        try {
            const endpoint = currentPinStatus ? `/events/${id}/unpin` : `/events/${id}/pin`;
            await api.put(endpoint);
            
            toast.success(currentPinStatus ? "Event unpinned!" : "Event pinned!");
            setIsModalOpen(false);
            
            const ref = await loadData();
            if (ref) setEvents(ref.events);
        } catch  {
            toast.error("Failed to update pin status.");
        }
    };

    const handleDelete = async (id) => {
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

    return (
        <div className={styles.pageWrapper}>
            <Toaster position="top-right" />
            
            <PageHeader title="Events" />

            <div className={styles.mainGrid}>
                
                {/* --- LEFT SIDEBAR --- */}
                <aside>
                    <div className={styles.sidebarBlock}>
                        <h2 className={styles.blockTitle}>Create Event</h2>
                        <button onClick={handleAddEventClick} className={styles.addEventBtn}>
                            <Plus size={18} /> Add New Event
                        </button>
                    </div>

                    <div className={styles.sidebarBlock}>
                        <h2 className={styles.blockTitle}>Category Legend</h2>
                        <div className={styles.legendList}>
                            <div className={styles.legendItem}><span className={`${styles.dot} ${styles.dotYellow}`}></span> Event (Regular Work)</div>
                            <div className={styles.legendItem}><span className={`${styles.dot} ${styles.dotBlue}`}></span> Holiday (No Work)</div>
                            <div className={styles.legendItem}><span className={`${styles.dot} ${styles.dotGreen}`}></span> Reminder / Deadline</div>
                        </div>
                    </div>

                    <div className={styles.sidebarBlock}>
                        <h2 className={styles.blockTitle}>Upcoming Events</h2>
                        <div className={styles.eventList}>
                            {events.length === 0 ? <p className="text-sm text-slate-500 italic">No upcoming events.</p> : 
                                events.slice(0, 5).map(ev => (
                                    <div key={ev.id} className={styles.eventCard} onClick={() => handleEventClick({event: ev})}>
                                        <div className={styles.cardHeader}>
                                            <span>{ev.extendedProps?.time || 'All Day'}</span>
                                            <span>{ev.start.split('T')[0]}</span>
                                        </div>
                                        <h4 className={styles.cardTitle}>
                                            {ev.title}
                                            {/* ✨ Show Pin icon if event is pinned ✨ */}
                                            {ev.extendedProps?.is_pinned && <Pin size={12} className="inline ml-2 text-red-500 fill-red-500" />}
                                        </h4>
                                        {ev.extendedProps?.location && (
                                            <div className={styles.cardLocation}>
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
                <main className={styles.calendarWrapper}>
                    <FullCalendar 
                        plugins={[dayGridPlugin, interactionPlugin]} 
                        initialView="dayGridMonth" 
                        events={events} 
                        dateClick={handleDateClick} 
                        eventClick={handleEventClick} 
                        height="78vh" 
                        headerToolbar={{
                            left: 'title',
                            center: 'today prev,next',
                            right: 'dayGridMonth'
                        }}
                    />
                </main>
            </div>

            {/* --- MODAL (CREATE / VIEW / DELETE) --- */}
            {isModalOpen && (
                <div className={styles.modalOverlay} onMouseDown={() => setIsModalOpen(false)}>
                    <div className={styles.modalContainer} onMouseDown={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                {selectedEvent ? 'Event Details' : 'Create New Event'}
                                {selectedEvent?.is_pinned && <Pin size={16} className="text-red-500 fill-red-500" />}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
                                <X size={20} />
                            </button>
                        </div>
                        
                        {selectedEvent ? (
                            <div className={styles.viewContent}>
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
                                    <div className="flex items-center gap-2"><Clock size={16} className="text-slate-400"/> {selectedEvent.time || 'All Day'}</div>
                                    <div className="flex items-center gap-2"><MapPin size={16} className="text-slate-400"/> {selectedEvent.location || 'N/A'}</div>
                                    
                                    <div className="flex items-center gap-2 text-blue-700 font-semibold"><GraduationCap size={16}/> {selectedEvent.school || 'All Universities'}</div>
                                    <div className="flex items-center gap-2 text-blue-700 font-semibold"><BookOpen size={16}/> {selectedEvent.course || 'All Courses'}</div>
                                </div>
                                
                                {selectedEvent.description && (
                                    <div className="mb-6">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
                                    </div>
                                )}
                                
                                {/* ✨ ACTION BUTTONS (Delete + Pin/Unpin) ✨ */}
                                <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                                    <button onClick={() => handleDelete(selectedEvent.id)} className={`${styles.deleteBtn} flex-1`}>
                                        <Trash2 size={18}/> Delete Event
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
                                            <><PinOff size={18}/> Unpin Event</>
                                        ) : (
                                            <><Pin size={18}/> Pin Event</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className={styles.modalForm}>
                                <div className={styles.formGrid}>
                                    <div className={styles.formColumn}>
                                        <label className={styles.label}>Event Title</label>
                                        <input name="title" value={formData.title} onChange={handleInputChange} className={styles.input} placeholder="e.g. Monthly Townhall" required />
                                        
                                        <label className={styles.label}>Event Category</label>
                                        <select name="type" value={formData.type} onChange={handleInputChange} className={styles.input}>
                                            <option value="event">Event (Regular Work)</option>
                                            <option value="holiday">Holiday (No Work)</option>
                                            <option value="reminder">Reminder / Deadline</option>
                                        </select>

                                        <label className={styles.label}>Target Audience</label>
                                        <select name="audience" value={formData.audience} onChange={handleInputChange} className={styles.input}>
                                            <option value="all">Everyone (All Interns)</option>
                                            <option value="school">Specific University</option>
                                            <option value="course">Specific Course</option>
                                            <option value="both">University & Course</option>
                                        </select>

                                        {(formData.audience === 'school' || formData.audience === 'both') && (
                                            <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                                <label className={styles.label}>Select University</label>
                                                <select name="school" value={formData.school} onChange={handleSchoolChange} disabled={loadingDropdowns} className={styles.input} required>
                                                    <option value="">{loadingDropdowns ? "Loading..." : "-- Select School --"}</option>
                                                    {schoolsList.map(s => <option key={s.id} value={s.school}>{s.school}</option>)}
                                                </select>
                                            </div>
                                        )}

                                        {(formData.audience === 'course' || formData.audience === 'both') && (
                                            <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                                <label className={styles.label}>Select Course</label>
                                                <select 
                                                    name="course" 
                                                    value={formData.course} 
                                                    onChange={handleInputChange} 
                                                    className={styles.input} 
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
                                                        : coursesList.map((c, i) => <option key={i} value={c.course_name}>{c.course_name}</option>)
                                                    }
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.formColumn}>
                                        <label className={styles.label}>Date & Time</label>
                                        <div className={styles.inputGroup}>
                                            <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className={styles.inputGroupItemPrimary} required />
                                            <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className={styles.inputGroupItem} required />
                                        </div>
                                        
                                        <label className={styles.label}>Location (Optional)</label>
                                        <input name="location" value={formData.location} onChange={handleInputChange} className={styles.input} placeholder="e.g. Main Office / Zoom Link" />
                                        
                                        <label className={styles.label}>Description / Notes (Optional)</label>
                                        <textarea name="description" value={formData.description} onChange={handleInputChange} className={styles.textarea} rows="4" placeholder="Provide extra details here..." />
                                        
                                        {/* ✨ NEW: Pin Checkbox on Create ✨ */}
                                        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    name="is_pinned" 
                                                    checked={formData.is_pinned} 
                                                    onChange={handleInputChange} 
                                                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" 
                                                />
                                                <span className="text-sm font-semibold text-slate-700">
                                                    📌 Pin this event to the top of announcements
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={styles.modalFooter}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
                                    <button type="submit" className={styles.submitButton}>Publish Event</button>
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