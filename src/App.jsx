import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- AUTH & PROTECTION IMPORTS ---
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import ProtectedRoute from './components/ProtectedRoute';

// --- HR ADMIN IMPORTS ---
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHome from './pages/hr/DashboardHome';
import InternsList from './pages/hr/interns/InternsList';
import RoleManagement from './pages/hr/rolemanagement/RoleManagement';
import ExportReports from './pages/hr/export/ExportReports';
import SettingsLayout from './pages/hr/settings/SettingsLayout'; 
import TimeTracker from './pages/hr/timetracker/TimeTracker'; 
import HREventsPage from './pages/hr/events/EventsPage'; 

// --- INTERN IMPORTS ---
import InternLayout from './components/layout/InternLayout';
import InternDashboardHome from './pages/intern/InternDashboardHome';
import Attendance from './pages/intern/attendance/Attendance';
import InternEventsPage from './pages/intern/events/EventsPage'; 
import Logs from './pages/intern/logs/Logs';
import Forms from './pages/intern/forms/Forms'; 

// Placeholder for sections still being developed
const PlaceholderPage = ({ title }) => (
  <div className="p-8">
    <h2 className="text-3xl font-bold text-slate-800">{title}</h2>
    <p className="text-slate-500 mt-2">This page is currently under construction.</p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* PROTECTED ROUTES (Requires Login) */}
        <Route element={<ProtectedRoute />}>
          
          {/* --- HR DASHBOARD ROUTES --- */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="interns" element={<InternsList />} />
            <Route path="time-tracker" element={<TimeTracker />} /> 
            <Route path="events" element={<HREventsPage />} />
            <Route path="role-management" element={<RoleManagement />} />
            <Route path="export" element={<ExportReports />} />
            
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="/dashboard/settings/account" replace />} />
              <Route path="account" element={<PlaceholderPage title="Account Settings" />} />
              <Route path="about" element={<PlaceholderPage title="About CIMS" />} />
            </Route>
          </Route>

          {/* --- INTERN DASHBOARD ROUTES --- */}
          <Route path="/intern-dashboard" element={<InternLayout />}>
            <Route index element={<InternDashboardHome />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="events" element={<InternEventsPage />} />
            <Route path="logs" element={<Logs />} />
            
            {/* ✅ This is now correctly mapped to the Forms component */}
            <Route path="forms" element={<Forms />} />
            
            <Route path="history" element={<PlaceholderPage title="History" />} />
            <Route path="announcements" element={<PlaceholderPage title="Announcements" />} />
          </Route>

        </Route>

        {/* CATCH-ALL REDIRECT */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}