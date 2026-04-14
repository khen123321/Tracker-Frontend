import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../../api/axios';
import toast, { Toaster } from 'react-hot-toast';
import { Calendar as CalendarIcon, X, MapPin, Trash2, Clock, Users, GraduationCap, BookOpen, Bell, Plus } from 'lucide-react';
import styles from './EventsPage.module.css';

const EventsPage = () => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Controls the Skeleton UI
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [schools, setSchools] = useState([]);
    const [courses, setCourses] = useState([]);

    const [formData, setFormData] = useState({
        title: '', type: 'event', startDate: '', startTime: '09:00',
        location: '', audience: 'all', school: '', course: '', description: ''
    });

    const loadData = useCallback(async () => {
        try {
            const [eventsRes, filtersRes] = await Promise.all([
                api.get('/events'),
                api.get('/event-filters')
            ]);
            
            // Map backend types to UI colors
            const formattedEvents = eventsRes.data.map(ev => {
                let color = '#eab308'; // Default Yellow (Event)
                if (ev.extendedProps?.type === 'holiday') color = '#152286'; // Blue
                if (ev.extendedProps?.type === 'reminder') color = '#22c55e'; // Green
                return { ...ev, backgroundColor: color, borderColor: color };
            });

            return {
                events: formattedEvents,
                schools: filtersRes.data.schools || [],
                courses: filtersRes.data.courses || []
            };
        } catch (err) {
            console.error("Fetch error:", err);
            return null;
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        loadData().then(data => {
            if (isMounted && data) {
                setEvents(data.events);
                setSchools(data.schools);
                setCourses(data.courses);
                setIsLoading(false); // Turn off skeleton when data arrives
            }
        });
        return () => { isMounted = false; };
    }, [loadData]);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleAddEventClick = () => {
        setSelectedEvent(null);
        setFormData({ 
            title: '', type: 'event', startDate: new Date().toISOString().split('T')[0], 
            startTime: '09:00', location: '', audience: 'all', school: '', course: '', description: '' 
        });
        setIsModalOpen(true);
    };

    const handleDateClick = (arg) => {
        setSelectedEvent(null);
        setFormData({ ...formData, startDate: arg.dateStr, title: '', description: '', location: '', audience: 'all', school: '', course: '' });
        setIsModalOpen(true);
    };

    const handleEventClick = (info) => {
        setSelectedEvent({ id: info.event.id, title: info.event.title, start: info.event.startStr, ...info.event.extendedProps });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/events', { ...formData, date: formData.startDate, time: formData.startTime });
            toast.success("Event Published!");
            setIsModalOpen(false);
            const ref = await loadData();
            if (ref) setEvents(ref.events);
        } catch { toast.error("Validation error."); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this event?")) return;
        await api.delete(`/events/${id}`);
        toast.success("Event deleted");
        setIsModalOpen(false);
        const ref = await loadData();
        if (ref) setEvents(ref.events);
    };

    const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <div className={styles.pageContainer}>
            <Toaster position="top-right" />
            
            <header className={styles.header}>
                <h1 className={styles.pageTitle}>Events</h1>
                <div className={styles.headerActions}>
                    <button className={styles.iconBtn}><Bell size={20} /></button>
                    <div className={styles.dateBadge}>
                        <CalendarIcon size={18} className="text-slate-400"/> {todayFormatted}
                    </div>
                </div>
            </header>

            <div className={styles.mainGrid}>
                
                {/* --- SIDEBAR --- */}
                <aside>
                    <div className={styles.sidebarBlock}>
                        <h2 className={styles.blockTitle}>Create Event</h2>
                        <button onClick={handleAddEventClick} className={styles.addEventBtn}>
                            <Plus size={18} /> Add Event
                        </button>
                    </div>

                    <div className={styles.sidebarBlock}>
                        <h2 className={styles.blockTitle}>Category</h2>
                        <div className={styles.legendList}>
                            <div className={styles.legendItem}><span className={`${styles.dot} ${styles.dotYellow}`}></span> Event (with work)</div>
                            <div className={styles.legendItem}><span className={`${styles.dot} ${styles.dotBlue}`}></span> Holiday (no work)</div>
                            <div className={styles.legendItem}><span className={`${styles.dot} ${styles.dotGreen}`}></span> Reminder</div>
                        </div>
                        <button className={styles.addCategoryBtn}><Plus size={14} /> Add New Category</button>
                    </div>

                    <div className={styles.sidebarBlock}>
                        <h2 className={styles.blockTitle}>Upcoming Event</h2>
                        <div className={styles.eventList}>
                            {isLoading ? (
                                <>
                                    <div className={`${styles.skeleton} ${styles.skeletonCard}`}></div>
                                    <div className={`${styles.skeleton} ${styles.skeletonCard}`}></div>
                                    <div className={`${styles.skeleton} ${styles.skeletonCard}`}></div>
                                </>
                            ) : events.length === 0 ? (
                                <p className="text-sm text-slate-500 italic">No upcoming events.</p>
                            ) : (
                                events.slice(0, 5).map(ev => (
                                    <div key={ev.id} className={styles.eventCard} onClick={() => handleEventClick({event: ev})}>
                                        <div className={styles.cardHeader}>
                                            <span>{ev.extendedProps?.time || 'All Day'}</span>
                                            <span>{ev.start.split('T')[0]}</span>
                                        </div>
                                        <h4 className={styles.cardTitle}>{ev.title}</h4>
                                        {ev.extendedProps?.location && (
                                            <div className={styles.cardLocation}>
                                                <MapPin size={14} /> {ev.extendedProps.location}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>

                {/* --- CALENDAR MAIN --- */}
                <main className={styles.calendarWrapper}>
                    {isLoading ? (
                        <div className={`${styles.skeleton} ${styles.skeletonCalendar}`}></div>
                    ) : (
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
                    )}
                </main>
            </div>

            {/* --- MODAL --- */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContainer}>
                        <div className={styles.modalHeader}>
                            <h2 className="font-bold">{selectedEvent ? 'Event Details' : 'New Event'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        
                        {selectedEvent ? (
                            <div className={styles.viewContent}>
                                <h1 className="text-2xl font-black mb-4">{selectedEvent.title}</h1>
                                <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-slate-600">
                                    <div className="flex items-center gap-2"><Clock size={16}/> {selectedEvent.time}</div>
                                    <div className="flex items-center gap-2"><MapPin size={16}/> {selectedEvent.location}</div>
                                    <div className="flex items-center gap-2 text-[#0B1EAE] font-bold"><GraduationCap size={16}/> {selectedEvent.school || 'All'}</div>
                                    <div className="flex items-center gap-2 text-[#0B1EAE] font-bold"><BookOpen size={16}/> {selectedEvent.course || 'All'}</div>
                                </div>
                                <p className="p-4 bg-slate-50 border rounded-xl italic mb-6">"{selectedEvent.description}"</p>
                                <button onClick={() => handleDelete(selectedEvent.id)} className={styles.deleteBtn}><Trash2 size={18}/> Delete Event</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className={styles.modalForm}>
                                <div className={styles.formGrid}>
                                    <div className={styles.formColumn}>
                                        <label className={styles.label}>Title</label>
                                        <input name="title" value={formData.title} onChange={handleInputChange} className={styles.input} required />
                                        
                                        <label className={styles.label}>Category</label>
                                        <select name="type" value={formData.type} onChange={handleInputChange} className={styles.input}>
                                            <option value="event">Event (with work)</option>
                                            <option value="holiday">Holiday (no work)</option>
                                            <option value="reminder">Reminder</option>
                                        </select>

                                        <label className={styles.label}>Target Audience</label>
                                        <select name="audience" value={formData.audience} onChange={handleInputChange} className={styles.input}>
                                            <option value="all">Everyone</option>
                                            <option value="school">By University</option>
                                            <option value="course">By Course</option>
                                            <option value="both">Both</option>
                                        </select>

                                        {(formData.audience === 'school' || formData.audience === 'both') && (
                                            <select name="school" value={formData.school} onChange={handleInputChange} className={styles.input} required>
                                                <option value="">-- Select School --</option>
                                                {schools.map(s => <option key={s.school} value={s.school}>{s.school} ({s.total})</option>)}
                                            </select>
                                        )}

                                        {(formData.audience === 'course' || formData.audience === 'both') && (
                                            <select name="course" value={formData.course} onChange={handleInputChange} className={styles.input} required>
                                                <option value="">-- Select Course --</option>
                                                {courses.map(c => <option key={c.course} value={c.course}>{c.course} ({c.total})</option>)}
                                            </select>
                                        )}
                                    </div>
                                    <div className={styles.formColumn}>
                                        <label className={styles.label}>Date & Time</label>
                                        <div className={styles.inputGroup}>
                                            <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className={styles.inputGroupItemPrimary} />
                                            <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className={styles.inputGroupItem} />
                                        </div>
                                        <label className={styles.label}>Location</label>
                                        <input name="location" value={formData.location} onChange={handleInputChange} className={styles.input} placeholder="Office/Remote" />
                                        <label className={styles.label}>Description</label>
                                        <textarea name="description" value={formData.description} onChange={handleInputChange} className={styles.textarea} rows="2" />
                                    </div>
                                </div>
                                <button type="submit" className={styles.submitButton}>Publish Event</button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsPage;