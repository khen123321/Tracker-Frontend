import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Clock, History, Megaphone, LogOut, UserCircle } from 'lucide-react';
import styles from './InternLayout.module.css';

const InternLayout = () => {
    const navigate = useNavigate();
    
    // Get actual user data from localStorage
    const user = JSON.parse(localStorage.getItem('user')) || {};

    const handleLogout = () => {
        localStorage.removeItem('cims_token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <div className={styles.logoBox}>C</div>
                    <span className={styles.brandName}>
                        CIMS <small>{user.role === 'superadmin' ? 'Admin' : 'Intern'}</small>
                    </span>
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
                    <div className={styles.breadcrumb}>
                        Portal / {user.role === 'superadmin' ? 'Superadmin' : 'Intern'} Dashboard
                    </div>
                    <div className={styles.profileArea}>
                        {/* Dynamically show the logged in user's name */}
                        <div className="text-right mr-2">
                            <p className="text-sm font-bold text-slate-700 leading-none">
                                {user.first_name} {user.last_name}
                            </p>
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                                {user.role}
                            </p>
                        </div>
                        <UserCircle size={32} color="#0B1EAE" />
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