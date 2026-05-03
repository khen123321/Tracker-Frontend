import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- AUTH & PROTECTION IMPORTS ---
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import VerifyEmail from './pages/auth/VerifyEmail'; 
import ProtectedRoute from './components/ProtectedRoute';
import PermissionGuard from './components/PermissionGuard'; 

// --- HR ADMIN IMPORTS ---
import DashboardLayout from './components/layout/HrNavBar';
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
import FormsAndRequests from './pages/hr/forms&request/FormsAndRequests';

// --- INTERN IMPORTS ---
import InternLayout from './components/layout/InternNavBar';
import InternDashboardHome from './pages/intern/InternDashboardHome';
import Attendance from './pages/intern/attendance/Attendance';
import Logs from './pages/intern/logs/Logs';
import Forms from './pages/intern/forms/Forms'; 
import InternProfile from './pages/intern/internprofile/InternProfile';
import Announcement from './pages/intern/announcement/announcement'; 

// ✨ Global Profile Drawer Provider
import { ProfileDrawerProvider } from './context/ProfileDrawerContext';

// ✨ Dedicated Read-Only Intern Calendar
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
        
        {/* ✨ THE FIX: Perfectly matched to the email link URL ✨ */}
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* ==============================================
            PROTECTED ROUTES (Requires Login)
        ============================================== */}
        <Route element={<ProtectedRoute />}>
          
          {/* --- HR DASHBOARD ROUTES --- */}
          <Route element={<ProtectedRoute allowedRoles={['superadmin', 'hr', 'hr_intern']} />}>
            <Route 
              path="/dashboard" 
              element={
                <ProfileDrawerProvider>
                  <DashboardLayout />
                </ProfileDrawerProvider>
              }
            >
              <Route index element={
                <PermissionGuard requiredPermission="Dashboard">
                  <DashboardHome />
                </PermissionGuard>
              } />
              
              <Route path="interns" element={
                <PermissionGuard requiredPermission="Intern">
                  <InternsList />
                </PermissionGuard>
              } />
              
              <Route path="interns/:id" element={
                <PermissionGuard requiredPermission="Intern">
                  <InternProfile isHrView={true} />
                </PermissionGuard>
              } />
              
              <Route path="time-tracker" element={
                <PermissionGuard requiredPermission="Time Tracker">
                  <TimeTracker />
                </PermissionGuard>
              } /> 
              
              <Route path="events" element={
                <PermissionGuard requiredPermission="Events">
                  <HREventsPage />
                </PermissionGuard>
              } />
              
              <Route path="export" element={
                <PermissionGuard requiredPermission="Reports">
                  <ExportReports />
                </PermissionGuard>
              } />
              
              <Route path="camera-verification" element={
                <PermissionGuard requiredPermission="Camera Verification">
                  <CameraVerification />
                </PermissionGuard>
              } />
              
              <Route path="forms-requests" element={
                <PermissionGuard requiredPermission="Forms & Requests">
                  <FormsAndRequests />
                </PermissionGuard>
              } />
              
              <Route path="role-management" element={
                <PermissionGuard requiredPermission="Role Management">
                  <RoleManagement />
                </PermissionGuard>
              } />
              
              <Route path="settings" element={
                <PermissionGuard requiredPermission="Settings">
                  <SettingsLayout />
                </PermissionGuard>
              }>
                <Route index element={<Navigate to="curriculum" replace />} />
                <Route path="curriculum" element={<CurriculumSettings />} />
                <Route path="departments" element={<DepartmentSetting />} />
                <Route path="branches" element={<BranchSetting />} />
                <Route path="general" element={<PlaceholderPage title="General Setup" />} />
                <Route path="accounts" element={<PlaceholderPage title="Admin Accounts" />} />
                <Route path="security" element={<PlaceholderPage title="Security & Logs" />} />
              </Route>
            </Route>
          </Route>

          {/* --- INTERN DASHBOARD ROUTES --- */}
          <Route element={<ProtectedRoute allowedRoles={['intern']} />}>
            <Route path="/intern-dashboard" element={<InternLayout />}>
              <Route index element={<InternDashboardHome />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="events" element={<InternCalendar />} />
              <Route path="logs" element={<Logs />} />
              <Route path="forms" element={<Forms />} />
              <Route path="profile" element={<InternProfile />} />
              <Route path="history" element={<PlaceholderPage title="History" />} />
              <Route path="announcements" element={<Announcement />} />
            </Route>
          </Route>

        </Route>

        {/* 👇 CATCH-ALL: Redirects any unknown URL back to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}