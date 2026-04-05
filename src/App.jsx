// src/App.jsx
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

// --- INTERN IMPORTS ---
import InternLayout from './components/layout/InternLayout';
import InternDashboardHome from './pages/intern/InternDashboardHome';

// --- PLACEHOLDER FOR UNFINISHED PAGES ---
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
          
          {/* ========================================== */}
          {/* HR ADMIN ROUTES (/dashboard)                 */}
          {/* ========================================== */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="interns" element={<InternsList />} />
            <Route path="profile" element={<PlaceholderPage title="Intern Profile" />} />
            <Route path="time-tracker" element={<PlaceholderPage title="Time Tracker" />} />
            <Route path="events" element={<PlaceholderPage title="Events Calendar" />} />
            
            {/* The newly added Admin Features */}
            <Route path="role-management" element={<RoleManagement />} />
            <Route path="export" element={<ExportReports />} />
            
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="/dashboard/settings/account" replace />} />
              <Route path="account" element={<PlaceholderPage title="Account Settings" />} />
              <Route path="schedule" element={<PlaceholderPage title="Schedule Management" />} />
              <Route path="department" element={<PlaceholderPage title="Department Management" />} />
              <Route path="notification" element={<PlaceholderPage title="Notification Preferences" />} />
              <Route path="about" element={<PlaceholderPage title="About CIMS" />} />
            </Route>
          </Route>

          {/* ========================================== */}
          {/* INTERN ROUTES (/intern-dashboard)            */}
          {/* ========================================== */}
          <Route path="/intern-dashboard" element={<InternLayout />}>
            <Route index element={<InternDashboardHome />} />
            <Route path="time-logs" element={<PlaceholderPage title="My Time Logs" />} />
            <Route path="profile" element={<PlaceholderPage title="My Profile Settings" />} />
          </Route>

        </Route>

        {/* CATCH-ALL ROUTE (Redirects lost users to login) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}