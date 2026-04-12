import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Clock, ScrollText,
    FileText, Megaphone, Bell, UserCircle, MoreHorizontal,
} from 'lucide-react';
import styles from './InternLayout.module.css';
import logoImage from '../../assets/logo.png';

const InternLayout = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')) || {};

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to log out?')) {
            localStorage.removeItem('cims_token');
            localStorage.removeItem('user');
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
                    <NavLink to="/intern-dashboard" end className={navCls}>
                        <LayoutDashboard size={20} strokeWidth={1.5} />
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/intern-dashboard/attendance" className={navCls}>
                        <Clock size={20} strokeWidth={1.5} />
                        <span>Clock In/Out</span>
                    </NavLink>
                    <NavLink to="/intern-dashboard/logs" className={navCls}>
                        <ScrollText size={20} strokeWidth={1.5} />
                        <span>My Logs</span>
                    </NavLink>
                    <NavLink to="/intern-dashboard/forms" className={navCls}>
                        <FileText size={20} strokeWidth={1.5} />
                        <span>Forms</span>
                    </NavLink>
                    <NavLink to="/intern-dashboard/announcements" className={navCls}>
                        <Megaphone size={20} strokeWidth={1.5} />
                        <span>Announcements</span>
                    </NavLink>
                    <NavLink to="/intern-dashboard/notifications" className={navCls}>
                        <Bell size={20} strokeWidth={1.5} />
                        <span>Notifications</span>
                    </NavLink>
                    <NavLink to="/intern-dashboard/profile" className={navCls}>
                        <UserCircle size={20} strokeWidth={1.5} />
                        <span>Profile</span>
                    </NavLink>
                </nav>

                <div className={styles.bottomProfile} onClick={handleLogout} title="Click to Logout">
                    <div className={styles.profileInfo}>
                        <div className={styles.profileAvatar}>
                            {user.first_name?.[0]?.toUpperCase() || 'I'}
                        </div>
                        <span className={styles.profileName}>
                            {user.first_name} {user.last_name}
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

export default InternLayout;