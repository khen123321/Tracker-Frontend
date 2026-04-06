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
import ExportReports from './pages/hr/export/Exportreports';
import SettingsLayout from './pages/hr/settings/SettingsLayout'; 
import TimeTracker from './pages/hr/timetracker/TimeTracker'; // Imported correctly

// --- INTERN IMPORTS ---
import InternLayout from './components/layout/InternLayout';
import InternDashboardHome from './pages/intern/InternDashboardHome';
import Attendance from './pages/intern/attendance/Attendance';

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
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="interns" element={<InternsList />} />
            
            {/* FIX: Pointed to the real TimeTracker component */}
            <Route path="time-tracker" element={<TimeTracker />} /> 
            
            <Route path="events" element={<PlaceholderPage title="Events Calendar" />} />
            <Route path="role-management" element={<RoleManagement />} />
            <Route path="export" element={<ExportReports />} />
            
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="/dashboard/settings/account" replace />} />
              <Route path="account" element={<PlaceholderPage title="Account Settings" />} />
              <Route path="about" element={<PlaceholderPage title="About CIMS" />} />
            </Route>
          </Route>

          <Route path="/intern-dashboard" element={<InternLayout />}>
            <Route index element={<InternDashboardHome />} />
            <Route index element={<InternDashboardHome />} />
    <Route path="attendance" element={<Attendance />} />
    <Route path="history" element={<PlaceholderPage title="History" />} />
    <Route path="announcements" element={<PlaceholderPage title="Announcements" />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}