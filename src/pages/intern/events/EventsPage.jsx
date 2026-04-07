import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import api from '../../../api/axios';
import toast, { Toaster } from 'react-hot-toast';
import { Calendar as CalendarIcon } from 'lucide-react';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await api.get('/events');
        console.log("Events received from API:", data); // Check your console (F12)
        setEvents(data);
      } catch (err) {
        console.error("API Error:", err);
        toast.error("Failed to load company calendar.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <Toaster position="top-right" />
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="text-[#0B1EAE]" />
            Company Events
          </h1>
          <p className="text-slate-500 text-sm">Upcoming deadlines and company holidays.</p>
        </div>
        {/* Debug indicator */}
        <div className="text-[10px] text-slate-400">
          Total Events Found: {events.length}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        {loading ? (
          <div className="h-[60vh] flex items-center justify-center text-slate-300 italic">
            Synchronizing with server...
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={events} // FullCalendar needs the 'start' field we defined in Laravel
            height="70vh"
            eventColor="#0B1EAE"
            noEventsContent="No events scheduled yet."
          />
        )}
      </div>
    </div>
  );
};

export default EventsPage;