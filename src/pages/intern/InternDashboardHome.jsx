// src/pages/intern/InternDashboardHome.jsx
import { useState,} from 'react';
import { Clock, CalendarCheck, TrendingUp, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios'; // Import Axios to talk to Laravel

export default function InternDashboardHome() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [timeInRecord, setTimeInRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get the token saved from the LoginPage
  const token = localStorage.getItem('cims_token');

  // --- TIME IN / TIME OUT LOGIC ---
  const handleTimeAction = async () => {
    setIsLoading(true);
    
    try {
      if (!isCheckedIn) {
        // --- TIMING IN ---
        // Change '/api/attendance/time-in' to whatever your actual Laravel route is
        const response = await axios.post('http://192.168.25.190:8000/api/attendance/time-in', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setIsCheckedIn(true);
        setTimeInRecord(timeString);
        toast.success(response.data.message || `Successfully Timed In at ${timeString}`);
        
      } else {
        // --- TIMING OUT ---
        // Change '/api/attendance/time-out' to your actual route
        const response = await axios.post('http://192.168.25.190:8000/api/attendance/time-out', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setIsCheckedIn(false);
        toast.success(response.data.message || `Successfully Timed Out at ${timeString}. Great work today!`);
      }
    } catch (error) {
      console.error("Attendance Error:", error);
      toast.error(error.response?.data?.message || 'Failed to record time. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mock Progress Data (We can fetch this from Laravel next!)
  const targetHours = 486;
  const completedHours = 142; 
  const progressPercentage = Math.min((completedHours / targetHours) * 100, 100);

  return (
    <div className="flex flex-col gap-6">
      
      {/* WELCOME BANNER */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome back, Khen Joshua!</h1>
          <p className="text-slate-500 mt-1">BSIT Intern • USTP</p>
        </div>
        
        {/* DYNAMIC TIME IN / OUT BUTTON */}
        <button 
          onClick={handleTimeAction}
          disabled={isLoading}
          className={`${
            isCheckedIn 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-[#0B1EAE] hover:bg-[#050C48]'
          } text-white px-8 py-3 rounded-lg font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50`}
        >
          {isCheckedIn ? <LogOut size={20} /> : <Clock size={20} />}
          {isLoading ? 'PROCESSING...' : (isCheckedIn ? 'TIME OUT NOW' : 'TIME IN NOW')}
        </button>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* OJT Hours Progress Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-1 md:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-slate-500 font-medium flex items-center gap-2">
                <TrendingUp size={18} className="text-[#0B1EAE]" />
                OJT Hours Progress
              </h3>
              <div className="text-4xl font-black text-slate-800 mt-2">
                {completedHours} <span className="text-lg text-slate-400 font-medium">/ {targetHours} hrs</span>
              </div>
            </div>
            <div className="bg-blue-50 text-[#0B1EAE] px-3 py-1 rounded-full text-sm font-bold">
              {Math.round(progressPercentage)}% Completed
            </div>
          </div>
          
          <div className="w-full bg-slate-100 rounded-full h-3 mt-4">
            <div 
              className="bg-[#0B1EAE] h-3 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 mt-3">{targetHours - completedHours} hours remaining to finish.</p>
        </div>

        {/* DYNAMIC STATUS CARD */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 border ${
            isCheckedIn ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'
          }`}>
            <CalendarCheck size={28} className={isCheckedIn ? 'text-green-500' : 'text-slate-400'} />
          </div>
          <h3 className="text-slate-500 font-medium">Today's Status</h3>
          
          <span className={`mt-2 px-4 py-1.5 rounded-full text-sm font-bold ${
            isCheckedIn ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {isCheckedIn ? 'Active (Working)' : 'Not Checked In'}
          </span>

          {/* Show the time they logged in if they are active */}
          {isCheckedIn && (
            <p className="text-xs text-slate-400 mt-3 font-medium">
              Clocked in at {timeInRecord}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}