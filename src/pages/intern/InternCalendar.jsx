import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../api/axios'; 
import { Calendar as CalendarIcon, Clock, MapPin, X, Info } from 'lucide-react';
import styles from './InternCalendar.module.css';

const InternCalendar = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/events');
            
            // Format data specifically for FullCalendar
            const formattedEvents = response.data.map(event => ({
                id: event.id,
                title: event.title,
                start: event.start,
                end: event.end,
                extendedProps: {
                    description: event.description,
                    location: event.location
                },
                backgroundColor: '#0B1EAE',
                borderColor: '#0B1EAE',
                textColor: '#ffffff'
            }));
            
            setEvents(formattedEvents);
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    // 🔒 Interns can only VIEW details, never edit
    const handleEventClick = (info) => {
        setSelectedEvent({
            title: info.event.title,
            start: info.event.start,
            end: info.event.end,
            description: info.event.extendedProps.description,
            location: info.event.extendedProps.location
        });
    };

    // ✨ LOADING SCREEN (Fixes the ESLint warning!)
    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-[#0B1EAE] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading calendar...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            
            {/* ─── HEADER (No "Add Event" button) ─── */}
            <div className={styles.header}>
                <div className="flex items-center gap-3">
                    <div className="bg-[#0B1EAE]/10 p-2 rounded-lg">
                        <CalendarIcon className="text-[#0B1EAE]" size={24} />
                    </div>
                    <div>
                        <h1 className={styles.pageTitle}>Company Events</h1>
                        <p className={styles.subText}>View upcoming activities and deadlines.</p>
                    </div>
                </div>
            </div>

            {/* ─── CALENDAR CONTAINER ─── */}
            <div className={styles.calendarCard}>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={events}
                    eventClick={handleEventClick}
                    
                    /* 🔒 STRICT READ-ONLY SETTINGS 🔒 */
                    selectable={false} 
                    editable={false}
                    droppable={false}
                    eventStartEditable={false}
                    eventDurationEditable={false}
                    
                    height="auto"
                    aspectRatio={1.8}
                />
            </div>

            {/* ─── EVENT DETAILS MODAL (Read-Only) ─── */}
            {selectedEvent && (
                <div className={styles.modalOverlay} onClick={() => setSelectedEvent(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className="flex items-center gap-2">
                                <Info size={18} className="text-[#0B1EAE]" />
                                <h2 className={styles.modalTitle}>Event Details</h2>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} className={styles.closeBtn}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <h3 className={styles.eventHeading}>{selectedEvent.title}</h3>
                            
                            <div className={styles.infoRow}>
                                <Clock size={16} />
                                <span>
                                    {new Date(selectedEvent.start).toLocaleString('en-US', { 
                                        month: 'long', day: 'numeric', year: 'numeric', 
                                        hour: '2-digit', minute: '2-digit' 
                                    })}
                                </span>
                            </div>

                            {selectedEvent.location && (
                                <div className={styles.infoRow}>
                                    <MapPin size={16} />
                                    <span>{selectedEvent.location}</span>
                                </div>
                            )}

                            <div className={styles.descriptionBox}>
                                <p>{selectedEvent.description || "No description provided for this event."}</p>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button onClick={() => setSelectedEvent(null)} className={styles.btnPrimary}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InternCalendar;