import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../../api/axios';
import toast, { Toaster } from 'react-hot-toast';
import { Calendar as CalendarIcon } from 'lucide-react';

const EventsPage = () => {
  const [events, setEvents] = useState([]);

  // Fetch data only once on mount to satisfy the linter
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const { data } = await api.get('/events');
        setEvents(data);
      } catch  {
        toast.error("Could not sync with the database.");
      }
    };
    loadEvents();
  }, []);

  const handleDateClick = async (arg) => {
    const title = prompt("Event Title:");
    if (!title) return;

    const type = prompt("Type (holiday, meeting, deadline, other):", "meeting");

    try {
      await api.post('/events', {
        title,
        date: arg.dateStr,
        type: type || 'other',
        description: 'Posted via HR Dashboard'
      });
      
      toast.success("Event live for all interns!");
      
      // Manual refresh to update the UI instantly
      const { data } = await api.get('/events');
      setEvents(data);
    } catch  {
      toast.error("Error saving event.");
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <Toaster position="top-right" />
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="text-[#0B1EAE]" />
            Manage Events
          </h1>
          <p className="text-slate-500 text-sm">Click a date to schedule a meeting or holiday.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={handleDateClick}
          height="75vh"
          eventColor="#0B1EAE"
        />
      </div>
    </div>
  );
};

export default EventsPage;