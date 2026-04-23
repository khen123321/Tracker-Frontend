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
import SettingsLayout from './components/layout/SettingsLayout'; 
import CurriculumSettings from './pages/hr/settings/CurriculumSettings';  
import DepartmentSetting from './pages/hr/settings/DepartmentSetting'; 
import BranchSetting from './pages/hr/settings/BranchSetting';         
import TimeTracker from './pages/hr/timetracker/TimeTracker'; 
import HREventsPage from './pages/hr/events/EventsPage'; 
import CameraVerification from "./pages/hr/cameraverification/CameraVerification";

// --- INTERN IMPORTS ---
import InternLayout from './components/layout/InternLayout';
import InternDashboardHome from './pages/intern/InternDashboardHome';
import Attendance from './pages/intern/attendance/Attendance';
import Logs from './pages/intern/logs/Logs';
import Forms from './pages/intern/forms/Forms'; 
import InternProfile from './pages/intern/internprofile/InternProfile';

// ✨ NEW: Import the dedicated Read-Only Intern Calendar ✨
import InternCalendar from './pages/intern/InternCalendar'; 

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
        {/* 👇 ROOT REDIRECT */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* PUBLIC ROUTES */}
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* PROTECTED ROUTES (Requires Login) */}
        <Route element={<ProtectedRoute />}>
          
          {/* --- HR DASHBOARD ROUTES --- */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="interns" element={<InternsList />} />
            
            {/* Intern Profile loads inside the HR layout */}
            <Route path="interns/:id" element={<InternProfile />} />
            
            <Route path="time-tracker" element={<TimeTracker />} /> 
            <Route path="events" element={<HREventsPage />} />
            <Route path="role-management" element={<RoleManagement />} />
            <Route path="export" element={<ExportReports />} />
            <Route path="camera-verification" element={<CameraVerification />} />
            
            {/* --- SETTINGS ROUTES --- */}
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="curriculum" replace />} />
              <Route path="curriculum" element={<CurriculumSettings />} />
              
              <Route path="departments" element={<DepartmentSetting />} />
              <Route path="branches" element={<BranchSetting />} />
              
              <Route path="general" element={<PlaceholderPage title="General Setup" />} />
              <Route path="accounts" element={<PlaceholderPage title="Admin Accounts" />} />
              <Route path="security" element={<PlaceholderPage title="Security & Logs" />} />
            </Route>
          </Route>

          {/* --- INTERN DASHBOARD ROUTES --- */}
          <Route path="/intern-dashboard" element={<InternLayout />}>
            <Route index element={<InternDashboardHome />} />
            <Route path="attendance" element={<Attendance />} />
            
            {/* ✨ UPDATED: Now using the dedicated InternCalendar component ✨ */}
            <Route path="events" element={<InternCalendar />} />
            
            <Route path="logs" element={<Logs />} />
            <Route path="forms" element={<Forms />} />
            <Route path="profile" element={<InternProfile />} />
            
            <Route path="history" element={<PlaceholderPage title="History" />} />
            <Route path="announcements" element={<PlaceholderPage title="Announcements" />} />
          </Route>

        </Route>

        {/* 👇 CATCH-ALL: Redirects any unknown URL back to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}