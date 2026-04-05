// src/pages/dashboard/settings/SettingsLayout.jsx
import { NavLink, Outlet } from 'react-router-dom';
import { User, CalendarClock, Users, Bell } from 'lucide-react';
import styles from './SettingsLayout.module.css';

export default function SettingsLayout() {
  return (
    <div>
      <h1 className={styles.pageHeader}>Settings</h1>

      <div className={styles.settingsContainer}>
        
        {/* LEFT: Sub-Navigation */}
        <aside className={styles.subSidebar}>
          <NavLink 
            to="/dashboard/settings/account" 
            className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.subNavItemActive}` : styles.subNavItem}
          >
            {({ isActive }) => (
              <>
                <User size={20} />
                <span className={isActive ? styles.activeText : ''}>Account</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/dashboard/settings/schedule" 
            className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.subNavItemActive}` : styles.subNavItem}
          >
             {({ isActive }) => (
              <>
                <CalendarClock size={20} />
                <span className={isActive ? styles.activeText : ''}>Schedule</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/dashboard/settings/department" 
            className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.subNavItemActive}` : styles.subNavItem}
          >
             {({ isActive }) => (
              <>
                <Users size={20} />
                <span className={isActive ? styles.activeText : ''}>Department</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/dashboard/settings/notification" 
            className={({ isActive }) => isActive ? `${styles.subNavItem} ${styles.subNavItemActive}` : styles.subNavItem}
          >
             {({ isActive }) => (
              <>
                <Bell size={20} />
                <span className={isActive ? styles.activeText : ''}>Notification</span>
              </>
            )}
          </NavLink>
        </aside>

        {/* RIGHT: Active Setting Content */}
        <main className={styles.settingsContent}>
          <Outlet />
        </main>
        
      </div>
    </div>
  );
}