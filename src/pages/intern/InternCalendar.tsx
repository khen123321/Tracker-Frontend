import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core';
import api from '../../api/axios';
import { Calendar as CalendarIcon, Clock, MapPin, X, Info } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    extendedProps: {
        description?: string;
        location?: string;
    };
    backgroundColor: string;
    borderColor: string;
    textColor: string;
}

interface SelectedEvent {
    title: string;
    start: Date | null;
    end: Date | null;
    description?: string;
    location?: string;
}

// ─── FullCalendar global style overrides (injected once) ──────────────────────

const calendarGlobalStyles = `
    .fc-col-header-cell-cushion,
    .fc-daygrid-day-number {
        color: #334155;
        text-decoration: none;
    }
    .fc-event {
        cursor: pointer !important;
    }
`;

// ─── Component ────────────────────────────────────────────────────────────────

const InternCalendar: React.FC = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async (): Promise<void> => {
        try {
            setLoading(true);
            const response = await api.get('/events');

            const formattedEvents: CalendarEvent[] = response.data.map(
                (event: { id: number | string; title: string; start: string; end: string; description?: string; location?: string }) => ({
                    id: String(event.id),
                    title: event.title,
                    start: event.start,
                    end: event.end,
                    extendedProps: {
                        description: event.description,
                        location: event.location,
                    },
                    backgroundColor: '#0B1EAE',
                    borderColor: '#0B1EAE',
                    textColor: '#ffffff',
                })
            );

            setEvents(formattedEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    // 🔒 Interns can only VIEW details, never edit
    const handleEventClick = (info: EventClickArg): void => {
        setSelectedEvent({
            title: info.event.title,
            start: info.event.start,
            end: info.event.end,
            description: info.event.extendedProps.description as string | undefined,
            location: info.event.extendedProps.location as string | undefined,
        });
    };

    // ─── Loading Screen ────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-[#0B1EAE] border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">Loading calendar...</p>
                </div>
            </div>
        );
    }

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="p-5 flex flex-col gap-5">

            {/* Inject FullCalendar global overrides */}
            <style>{calendarGlobalStyles}</style>

            {/* ─── HEADER ─── */}
            <div className="flex justify-between items-center bg-white px-6 py-6 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="bg-[#0B1EAE]/10 p-2 rounded-lg">
                        <CalendarIcon className="text-[#0B1EAE]" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 m-0">Company Events</h1>
                        <p className="text-slate-500 text-sm mt-0.5">View upcoming activities and deadlines.</p>
                    </div>
                </div>
            </div>

            {/* ─── CALENDAR CARD ─── */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay',
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
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-[4px] flex items-center justify-center z-[1000]"
                    onClick={() => setSelectedEvent(null)}
                >
                    <div
                        className="bg-white w-full max-w-[450px] rounded-2xl overflow-hidden animate-[slideUp_0.3s_ease]"
                        onClick={(e) => e.stopPropagation()}
                        style={{ animation: 'slideUp 0.3s ease' }}
                    >
                        {/* Modal Header */}
                        <div className="px-5 py-5 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Info size={18} className="text-[#0B1EAE]" />
                                <h2 className="font-bold text-slate-800 m-0">Event Details</h2>
                            </div>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="bg-transparent border-none text-slate-400 cursor-pointer transition-colors p-1 hover:text-red-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-6">
                            <h3 className="text-xl font-extrabold text-[#0B1EAE] m-0 mb-4">
                                {selectedEvent.title}
                            </h3>

                            <div className="flex items-center gap-2.5 text-slate-500 text-sm mb-3">
                                <Clock size={16} />
                                <span>
                                    {selectedEvent.start
                                        ? new Date(selectedEvent.start).toLocaleString('en-US', {
                                              month: 'long',
                                              day: 'numeric',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                          })
                                        : '—'}
                                </span>
                            </div>

                            {selectedEvent.location && (
                                <div className="flex items-center gap-2.5 text-slate-500 text-sm mb-3">
                                    <MapPin size={16} />
                                    <span>{selectedEvent.location}</span>
                                </div>
                            )}

                            <div className="mt-5 px-4 py-4 bg-slate-50 rounded-lg text-sm leading-relaxed text-slate-700">
                                <p className="m-0">{selectedEvent.description || 'No description provided for this event.'}</p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-slate-50 flex justify-end">
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="bg-[#0B1EAE] text-white border-none px-6 py-2.5 rounded-lg font-semibold cursor-pointer transition-colors hover:bg-[#050C48]"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Keyframe for modal slide-up animation */}
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to   { transform: translateY(0);    opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default InternCalendar;