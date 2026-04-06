import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Clock, History, Megaphone, LogOut, UserCircle } from 'lucide-react';
import styles from './InternLayout.module.css';

const InternLayout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('cims_token');
        navigate('/login');
    };

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <div className={styles.logoBox}>C</div>
                    <span className={styles.brandName}>CIMS <small>Intern</small></span>
                </div>

                <nav className={styles.navigation}>
                    <NavLink to="/intern-dashboard" end className={({ isActive }) => isActive ? styles.active : styles.navLink}>
                        <LayoutDashboard size={20} /> <span>Dashboard</span>
                    </NavLink>
                    
                    <NavLink to="/intern-dashboard/attendance" className={({ isActive }) => isActive ? styles.active : styles.navLink}>
                        <Clock size={20} /> <span>Attendance</span>
                    </NavLink>

                    <NavLink to="/intern-dashboard/history" className={({ isActive }) => isActive ? styles.active : styles.navLink}>
                        <History size={20} /> <span>History Request</span>
                    </NavLink>

                    <NavLink to="/intern-dashboard/announcements" className={({ isActive }) => isActive ? styles.active : styles.navLink}>
                        <Megaphone size={20} /> <span>Announcements</span>
                    </NavLink>
                </nav>

                <button onClick={handleLogout} className={styles.logoutBtn}>
                    <LogOut size={18} /> <span>Logout</span>
                </button>
            </aside>

            <main className={styles.content}>
                <header className={styles.topbar}>
                    <div className={styles.breadcrumb}>Portal / Intern Dashboard</div>
                    <div className={styles.profileArea}>
                        <span>Khen Joshua</span>
                        <UserCircle size={28} color="#64748b" />
                    </div>
                </header>
                <div className={styles.pageBody}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default InternLayout;