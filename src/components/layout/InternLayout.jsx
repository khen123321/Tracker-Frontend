import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Clock, ScrollText,
    FileText, Megaphone, UserCircle, MoreHorizontal,
    Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import styles from './InternLayout.module.css';
import logoImage from '../../assets/logo.png';
import smallLogo from '../../assets/logo-s.png'; 

const InternLayout = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    
    // State to handle sidebar collapse on desktop and visibility on mobile
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to log out?')) {
            localStorage.removeItem('cims_token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    const navCls = ({ isActive }) =>
        isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem;

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);
    const toggleMobileMenu = () => setIsMobileOpen(!isMobileOpen);

    return (
        <div className={styles.layoutWrapper}>

            {/* ─── MOBILE OVERLAY ─── */}
            {isMobileOpen && (
                <div 
                    className={styles.mobileOverlay} 
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* ─── SIDEBAR ─── */}
            <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}>
                
                {/* 🌟 Desktop Collapse Toggle 🌟 */}
                <button onClick={toggleSidebar} className={styles.collapseToggleBtn}>
                    {isCollapsed ? <ChevronRight size={16} strokeWidth={2.5} /> : <ChevronLeft size={16} strokeWidth={2.5} />}
                </button>

                {/* Mobile Close Button */}
                <button className={styles.mobileCloseBtn} onClick={toggleMobileMenu}>
                    <X size={24} color="white" />
                </button>

                <div className={styles.brand}>
                    <img 
                        src={isCollapsed ? smallLogo : logoImage} 
                        alt="CLIMBS Logo" 
                        className={isCollapsed ? styles.smallLogoImage : styles.logoImage} 
                    />
                </div>

                <nav className={styles.navMenu}>
                    <NavLink to="/intern-dashboard" end className={navCls} onClick={() => setIsMobileOpen(false)}>
                        <LayoutDashboard size={20} strokeWidth={1.5} />
                        <span className={styles.navText}>Dashboard</span>
                    </NavLink>
                    <NavLink to="/intern-dashboard/attendance" className={navCls} onClick={() => setIsMobileOpen(false)}>
                        <Clock size={20} strokeWidth={1.5} />
                        <span className={styles.navText}>Clock In/Out</span>
                    </NavLink>
                    <NavLink to="/intern-dashboard/logs" className={navCls} onClick={() => setIsMobileOpen(false)}>
                        <ScrollText size={20} strokeWidth={1.5} />
                        <span className={styles.navText}>My Logs</span>
                    </NavLink>
                    <NavLink to="/intern-dashboard/forms" className={navCls} onClick={() => setIsMobileOpen(false)}>
                        <FileText size={20} strokeWidth={1.5} />
                        <span className={styles.navText}>Forms</span>
                    </NavLink>
                    <NavLink to="/intern-dashboard/announcements" className={navCls} onClick={() => setIsMobileOpen(false)}>
                        <Megaphone size={20} strokeWidth={1.5} />
                        <span className={styles.navText}>Announcements</span>
                    </NavLink>
                    <NavLink to="/intern-dashboard/profile" className={navCls} onClick={() => setIsMobileOpen(false)}>
                        <UserCircle size={20} strokeWidth={1.5} />
                        <span className={styles.navText}>Profile</span>
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
                    {!isCollapsed && <MoreHorizontal size={18} color="#94a3b8" className={styles.profileMoreIcon} />}
                </div>
            </aside>

            {/* ─── MAIN CONTENT ─── */}
            <div className={styles.mainWrapper}>
                
                {/* ✨ FLOATING MOBILE HAMBURGER ✨ */}
                <button 
                    className={styles.hamburgerBtn} 
                    onClick={toggleMobileMenu}
                >
                    <Menu size={24} className="text-slate-700" />
                </button>

                {/* PAGE CONTENT WRAPPER */}
                <div className={styles.contentArea}>
                    <Outlet />
                </div>
            </div>

        </div>
    );
};

export default InternLayout;