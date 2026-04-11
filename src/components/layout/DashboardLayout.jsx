import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, Clock, CalendarDays,
  FileUp, UserCog, Settings, MoreHorizontal,
} from 'lucide-react';
import styles from './DashboardLayout.module.css';
import logoImage from '../../assets/logo.png';

const DashboardLayout = () => {
  const navigate = useNavigate();

  const user         = JSON.parse(localStorage.getItem('cims_user')) || {};
  const permissions  = user.permissions || [];
  const isSuperAdmin = user.role === 'superadmin';

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
          <NavLink to="/dashboard" end className={navCls}>
            <LayoutDashboard size={20} strokeWidth={1.5} />
            <span>Dashboard</span>
          </NavLink>

          {(isSuperAdmin || permissions.includes('view_interns')) && (
            <NavLink to="/dashboard/interns" className={navCls}>
              <Search size={20} strokeWidth={1.5} />
              <span>Intern</span>
            </NavLink>
          )}

          {(isSuperAdmin || permissions.includes('view_time_tracker')) && (
            <NavLink to="/dashboard/time-tracker" className={navCls}>
              <Clock size={20} strokeWidth={1.5} />
              <span>Time Tracker</span>
            </NavLink>
          )}

          {(isSuperAdmin || permissions.includes('manage_events')) && (
            <NavLink to="/dashboard/events" className={navCls}>
              <CalendarDays size={20} strokeWidth={1.5} />
              <span>Events</span>
            </NavLink>
          )}

          <NavLink to="/dashboard/export" className={navCls}>
            <FileUp size={20} strokeWidth={1.5} />
            <span>Reports</span>
          </NavLink>

          {isSuperAdmin && (
            <NavLink to="/dashboard/role-management" className={navCls}>
              <UserCog size={20} strokeWidth={1.5} />
              <span>Role Management</span>
            </NavLink>
          )}

          {isSuperAdmin && (
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
        {/* The header is inside the pages, so we only render the Outlet here */}
        <Outlet />
      </div>

    </div>
  );
};

export default DashboardLayout;