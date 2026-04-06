// src/components/layout/DashboardLayout.jsx
import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  Clock, 
  CalendarDays, 
  Settings, 
  LogOut,
  UserCog, 
  FileDown 
} from 'lucide-react';

import styles from './DashboardLayout.module.css';
import logo from '../../assets/logo.png';

export default function DashboardLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem('justLoggedIn')) {
      toast.success('Welcome to CIMS Dashboard!');
      sessionStorage.removeItem('justLoggedIn');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cims_token');
    navigate('/login');
  };

  return (
    <div className={styles.layoutWrapper}>
      <Toaster position="top-right" /> 

      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img src={logo} alt="CLIMBS InternTracker" className={styles.brandLogo} />
        </div>

        <nav className={`${styles.navMenu} overflow-y-auto`}>
          <NavLink to="/dashboard" end className={({ isActive }) => isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          
          <NavLink to="/dashboard/interns" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}>
            <Users size={20} /> Interns List
          </NavLink>

          <NavLink to="/dashboard/time-tracker" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}>
            <Clock size={20} /> Time Tracker
          </NavLink>

          <NavLink to="/dashboard/events" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}>
            <CalendarDays size={20} /> Events
          </NavLink>

          {/* ✅ FIXED: Changed /hr/ to /dashboard/ to match App.jsx */}
          <NavLink to="/dashboard/role-management" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}>
            <UserCog size={20} /> Role Management
          </NavLink>

          <NavLink to="/dashboard/export" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}>
            <FileDown size={20} /> Export Reports
          </NavLink>
        </nav>

        <div className="mt-auto pb-6 pt-4 border-t border-white/10">
          <NavLink 
            to="/dashboard/settings" 
            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
          >
            <Settings size={20} /> Settings
          </NavLink>
        </div>
      </aside>

      <div className={styles.mainWrapper}>
        <header className={styles.topbar}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={18} /> Sign Out
          </button>
        </header>

        <main className={styles.contentArea}>
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}