// src/components/layout/InternLayout.jsx
import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { LayoutDashboard, Clock, UserCircle, LogOut } from 'lucide-react';

// REUSING YOUR AWESOME CSS!
import styles from './DashboardLayout.module.css';
import logo from '../../assets/logo.png'; 

export default function InternLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem('justLoggedIn')) {
      toast.success('Welcome to your Intern Portal!');
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

      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img src={logo} alt="CLIMBS InternTracker" className={styles.brandLogo} />
        </div>

        {/* INTERN MENU SECTION */}
        <nav className={`${styles.navMenu} overflow-y-auto`}>
          <NavLink to="/intern-dashboard" end className={({ isActive }) => isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}>
            <LayoutDashboard size={20} /> My Dashboard
          </NavLink>

          <NavLink to="/intern-dashboard/time-logs" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}>
            <Clock size={20} /> My Time Logs
          </NavLink>

          <NavLink to="/intern-dashboard/profile" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}>
            <UserCircle size={20} /> My Profile
          </NavLink>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
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