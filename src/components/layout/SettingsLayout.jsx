import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, Sliders, Users, ShieldAlert } from 'lucide-react';
import styles from './SettingsLayout.module.css';

export default function SettingsLayout() {
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.header}>
        <h1>System Settings</h1>
        <p>Manage platform rules, requirements, and configurations.</p>
      </div>

      <div className={styles.layoutContainer}>
        {/* SETTINGS SIDEBAR NAV */}
        <aside className={styles.sidebar}>
          <nav className={styles.navGroup}>
            
            {/* 👇 FIXED: Using short relative paths instead of full URLs 👇 */}
            <NavLink 
              to="general" 
              className={({ isActive }) => isActive ? `${styles.navItem} ${styles.activeItem}` : styles.navItem}
            >
              <Sliders size={18} /> General Setup
            </NavLink>

            <NavLink 
              to="curriculum" 
              className={({ isActive }) => isActive ? `${styles.navItem} ${styles.activeItem}` : styles.navItem}
            >
              <BookOpen size={18} /> Curriculum Rules
            </NavLink>

            <NavLink 
              to="accounts" 
              className={({ isActive }) => isActive ? `${styles.navItem} ${styles.activeItem}` : styles.navItem}
            >
              <Users size={18} /> Admin Accounts
            </NavLink>

            <NavLink 
              to="security" 
              className={({ isActive }) => isActive ? `${styles.navItem} ${styles.activeItem}` : styles.navItem}
            >
              <ShieldAlert size={18} /> Security & Logs
            </NavLink>

          </nav>
        </aside>

        {/* SETTINGS CONTENT AREA */}
        <main className={styles.contentArea}>
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}