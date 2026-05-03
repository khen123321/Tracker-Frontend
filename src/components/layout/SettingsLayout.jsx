import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, Building, MapPin } from 'lucide-react';
import styles from './SettingsLayout.module.css';

// ✨ IMPORT YOUR UNIFIED PAGE HEADER ✨
import PageHeader from '../PageHeader';

// ─── SKELETON PRIMITIVES ───
function Sk({ w = '100%', h = '16px', r = '8px', mb = '0' }) {
  return <div className={styles.skel} style={{ width: w, height: h, borderRadius: r, marginBottom: mb, flexShrink: 0 }} />;
}

// ─── FULL PAGE SKELETON SCREEN ───
function SettingsSkeleton() {
  return (
    <div className={styles.pageWrapper}>
      {/* Skeleton Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', background: '#fff', borderRadius: '10px', border: '1px solid #e8eaf0' }}>
        <Sk w="220px" h="26px" r="6px" />
        <div style={{ display: 'flex', gap: '12px' }}>
          <Sk w="36px" h="36px" r="8px" />
          <Sk w="210px" h="36px" r="999px" />
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Skeleton Sidebar */}
        <aside className={styles.sidebarSkeleton}>
          <Sk w="100%" h="44px" r="8px" mb="8px" />
          <Sk w="100%" h="44px" r="8px" mb="8px" />
          <Sk w="100%" h="44px" r="8px" />
        </aside>

        {/* Skeleton Content Area */}
        <main className={styles.contentSkeleton}>
          <div style={{ padding: '20px' }}>
            <Sk w="200px" h="24px" mb="24px" r="6px" />
            <Sk w="100%" h="60px" mb="12px" r="8px" />
            <Sk w="100%" h="60px" mb="12px" r="8px" />
            <Sk w="100%" h="300px" r="10px" />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SettingsLayout() {
  const [initialLoad, setInitialLoad] = useState(true);

  // ✨ Briefly show the skeleton to ensure smooth transitions when mounting the Settings route
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 400); // 400ms mock load
    return () => clearTimeout(timer);
  }, []);

  if (initialLoad) return <SettingsSkeleton />;

  return (
    <div className={styles.pageWrapper}>
      
      {/* ✨ UNIFIED PAGE HEADER ✨ */}
      <PageHeader title="System Settings" />

      <div className={styles.mainGrid}>
        {/* SETTINGS SIDEBAR NAV */}
        <aside className={styles.sidebar}>
          <nav className={styles.navGroup}>
            
            <NavLink 
              to="departments" 
              className={({ isActive }) => isActive ? `${styles.navItem} ${styles.activeItem}` : styles.navItem}
            >
              <Building size={18} /> Departments
            </NavLink>

            {/* ✨ NEW: Branch Locations (Geo-Fencing) ✨ */}
            <NavLink 
              to="branches" 
              className={({ isActive }) => isActive ? `${styles.navItem} ${styles.activeItem}` : styles.navItem}
            >
              <MapPin size={18} /> Branch Locations
            </NavLink>

            <NavLink 
              to="curriculum" 
              className={({ isActive }) => isActive ? `${styles.navItem} ${styles.activeItem}` : styles.navItem}
            >
              <BookOpen size={18} /> Curriculum Rules
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