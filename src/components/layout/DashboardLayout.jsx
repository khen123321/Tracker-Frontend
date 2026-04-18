import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, Clock, CalendarDays,
  FileUp, UserCog, Settings, MoreHorizontal, Camera
} from 'lucide-react';
import styles from './DashboardLayout.module.css';
import logoImage from '../../assets/logo.png';

const DashboardLayout = () => {
  const navigate = useNavigate();

  // Pulling the user from localStorage just like you had it
  const user         = JSON.parse(localStorage.getItem('cims_user')) || {};
  const permissions  = user.permissions || [];
  const isSuperAdmin = user.role === 'superadmin';

  console.log("=== SIDEBAR DEBUG ===");
  console.log("1. The User Object:", user);
  console.log("2. The Permissions Array:", permissions);
  console.log("3. Is Superadmin?:", isSuperAdmin);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('cims_token');
      localStorage.removeItem('cims_user');
      navigate('/login');
    }
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
          
          {/* Dashboard Check */}
          {(isSuperAdmin || permissions.includes('Dashboard')) && (
            <NavLink to="/dashboard" end className={navCls}>
              <LayoutDashboard size={20} strokeWidth={1.5} />
              <span>Dashboard</span>
            </NavLink>
          )}

          {/* Intern Management Check */}
          {(isSuperAdmin || permissions.includes('Intern Management')) && (
            <NavLink to="/dashboard/interns" className={navCls}>
              <Search size={20} strokeWidth={1.5} />
              <span>Intern</span>
            </NavLink>
          )}

          {/* Time Tracker Check */}
          {(isSuperAdmin || permissions.includes('Time Tracker')) && (
            <NavLink to="/dashboard/time-tracker" className={navCls}>
              <Clock size={20} strokeWidth={1.5} />
              <span>Time Tracker</span>
            </NavLink>
          )}

          {/* 👇 NEW: Camera Verification Check 👇 */}
          {(isSuperAdmin || permissions.includes('Camera Verification')) && (
            <NavLink to="/dashboard/camera-verification" className={navCls}>
              <Camera size={20} strokeWidth={1.5} />
              <span>Camera Verification</span>
            </NavLink>
          )}

          {/* Events Check */}
          {(isSuperAdmin || permissions.includes('Events')) && (
            <NavLink to="/dashboard/events" className={navCls}>
              <CalendarDays size={20} strokeWidth={1.5} />
              <span>Events</span>
            </NavLink>
          )}

          {/* Reports Check */}
          {(isSuperAdmin || permissions.includes('Reports & Analytics')) && (
            <NavLink to="/dashboard/export" className={navCls}>
              <FileUp size={20} strokeWidth={1.5} />
              <span>Reports</span>
            </NavLink>
          )}

          {/* Role Management Check */}
          {(isSuperAdmin || permissions.includes('Role Management')) && (
            <NavLink to="/dashboard/role-management" className={navCls}>
              <UserCog size={20} strokeWidth={1.5} />
              <span>Role Management</span>
            </NavLink>
          )}

          {/* Settings Check */}
          {(isSuperAdmin || permissions.includes('Settings')) && (
            <NavLink to="/dashboard/settings" className={navCls}>
              <Settings size={20} strokeWidth={1.5} />
              <span>Settings</span>
            </NavLink>
          )}
          
        </nav>

        <div className={styles.bottomProfile} onClick={handleLogout} title="Click to Logout">
          <div className={styles.profileInfo}>
            <div className={styles.profileAvatar}>
              {user.first_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <span className={styles.profileName}>
              {isSuperAdmin ? 'CLIMBS Admin' : `${user.first_name} ${user.last_name}`}
            </span>
          </div>
          <MoreHorizontal size={18} color="#94a3b8" />
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <div className={styles.mainWrapper}>
        <Outlet />
      </div>

    </div>
  );
};

export default DashboardLayout;