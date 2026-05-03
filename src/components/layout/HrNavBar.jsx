import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, Clock, CalendarDays,
  FileUp, UserCog, Settings, MoreHorizontal, Camera, ClipboardList, LogOut
} from 'lucide-react'; // ✨ Added LogOut icon
import styles from './HrNavBar.module.css';
import logoImage from '../../assets/logo.png';

const DashboardLayout = () => {
  const navigate = useNavigate();

  // ✨ NEW: State to control the visibility of the logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const user        = JSON.parse(localStorage.getItem('user')) || {};
  const permissions = user.permissions || [];
  const isSuperAdmin = user.role?.toLowerCase() === 'superadmin';

  console.log("=== SIDEBAR DEBUG ===");
  console.log("1. The User Object:", user);
  console.log("2. The Permissions Array:", permissions);
  console.log("3. Is True Superadmin?:", isSuperAdmin);

  // ✨ NEW: Modal Handlers
  const handleLogoutClick = () => {
    setShowLogoutModal(true); 
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem('cims_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const navCls = ({ isActive }) =>
    isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem;

  return (
    <div className={styles.layoutWrapper}>

      {/* ─── SIDEBAR ─── */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img src={logoImage} alt="CLIMBS Logo" className={styles.logoImage} />
        </div>

        <nav className={styles.navMenu}>
          
          {(isSuperAdmin || permissions.includes('Dashboard')) && (
            <NavLink to="/dashboard" end className={navCls}>
              <LayoutDashboard size={20} strokeWidth={1.5} />
              <span>Dashboard</span>
            </NavLink>
          )}

          {(isSuperAdmin || permissions.includes('Intern')) && (
            <NavLink to="/dashboard/interns" className={navCls}>
              <Search size={20} strokeWidth={1.5} />
              <span>Intern</span>
            </NavLink>
          )}

          {(isSuperAdmin || permissions.includes('Time Tracker')) && (
            <NavLink to="/dashboard/time-tracker" className={navCls}>
              <Clock size={20} strokeWidth={1.5} />
              <span>Time Tracker</span>
            </NavLink>
          )}

          {(isSuperAdmin || permissions.includes('Camera Verification')) && (
            <NavLink to="/dashboard/camera-verification" className={navCls}>
              <Camera size={20} strokeWidth={1.5} />
              <span>Camera Verification</span>
            </NavLink>
          )}

          {(isSuperAdmin || permissions.includes('Forms & Requests')) && (
            <NavLink to="/dashboard/forms-requests" className={navCls}>
              <ClipboardList size={20} strokeWidth={1.5} />
              <span>Forms & Requests</span>
            </NavLink>
          )}

          {(isSuperAdmin || permissions.includes('Events')) && (
            <NavLink to="/dashboard/events" className={navCls}>
              <CalendarDays size={20} strokeWidth={1.5} />
              <span>Events</span>
            </NavLink>
          )}

          {(isSuperAdmin || permissions.includes('Reports')) && (
            <NavLink to="/dashboard/export" className={navCls}>
              <FileUp size={20} strokeWidth={1.5} />
              <span>Reports</span>
            </NavLink>
          )}

          {(isSuperAdmin || permissions.includes('Role Management')) && (
            <NavLink to="/dashboard/role-management" className={navCls}>
              <UserCog size={20} strokeWidth={1.5} />
              <span>Role Management</span>
            </NavLink>
          )}

          {(isSuperAdmin || permissions.includes('Settings')) && (
            <NavLink to="/dashboard/settings" className={navCls}>
              <Settings size={20} strokeWidth={1.5} />
              <span>Settings</span>
            </NavLink>
          )}
          
        </nav>

        {/* Changed onClick to handleLogoutClick */}
        <div className={styles.bottomProfile} onClick={handleLogoutClick} title="Click to Logout">
          <div className={styles.profileInfo}>
            <div className={styles.profileAvatar}>
              {user.first_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <span className={styles.profileName}>
              {isSuperAdmin ? 'CLIMBS Admin' : `${user.first_name || 'HR'} ${user.last_name || ''}`}
            </span>
          </div>
          <MoreHorizontal size={18} color="#94a3b8" />
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <div className={styles.mainWrapper}>
        <Outlet />
      </div>

      {/* ─── CUSTOM LOGOUT MODAL ─── */}
      {showLogoutModal && (
        <div className={styles.modalOverlay} onClick={cancelLogout}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIconBox}>
              <LogOut size={24} className={styles.modalIcon} />
            </div>
            <h3 className={styles.modalTitle}>Log Out</h3>
            <p className={styles.modalText}>
              Are you sure you want to log out of your account? You will need to sign back in to access the dashboard.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={cancelLogout}>
                Cancel
              </button>
              <button className={styles.btnLogoutConfirm} onClick={confirmLogout}>
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardLayout;