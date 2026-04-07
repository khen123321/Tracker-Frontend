import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, ShieldCheck, 
  LogOut, UserCircle, ClipboardList, Settings 
} from 'lucide-react';
import styles from './DashboardLayout.module.css';

const DashboardLayout = () => {
    const navigate = useNavigate();
    
    // 1. Get user data
    const user = JSON.parse(localStorage.getItem('cims_user')) || {};
    const permissions = user.permissions || [];
    
    // 2. THE MASTER KEY: This email ignores all permission restrictions
    const isSuperAdmin = user.email === 'admin@climbs.com.ph';

    const handleLogout = () => {
        localStorage.removeItem('cims_token');
        localStorage.removeItem('cims_user');
        navigate('/login');
    };

    return (
        <div className={styles.layoutWrapper}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <div className={styles.logoBox}>C</div> 
                    <span className="font-bold ml-2 text-white">CIMS Admin</span>
                </div>

                <nav className={styles.navMenu}>
                    <div className={styles.navSectionLabel}>Main Menu</div>

                    {/* Dashboard: Everyone sees this */}
                    <NavLink 
                        to="/dashboard" 
                        end 
                        className={({ isActive }) => isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
                    >
                        <LayoutDashboard size={20} /> <span>Main Dashboard</span>
                    </NavLink>
                    
                    {/* Intern List: Super Admin OR Permission */}
                    {(isSuperAdmin || permissions.includes('view_interns')) && (
                        <NavLink 
                            to="/dashboard/interns" 
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
                        >
                            <Users size={20} /> <span>Intern List</span>
                        </NavLink>
                    )}

                    {/* Events Calendar: Super Admin OR Permission */}
                    {(isSuperAdmin || permissions.includes('manage_events')) && (
                        <NavLink 
                            to="/dashboard/events" 
                            className={({ isActive }) => isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
                        >
                            <Calendar size={20} /> <span>Events Calendar</span>
                        </NavLink>
                    )}

                    {/* Attendance Logs: Super Admin OR Permission */}
                    {(isSuperAdmin || permissions.includes('view_time_tracker')) && (
    <NavLink 
        to="/dashboard/time-tracker" 
        className={({ isActive }) => isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
    >
        <ClipboardList size={20} /> <span>Time Tracker</span>
    </NavLink>
                    )}

                    {/* --- ADMINISTRATION SECTION --- */}
                    {/* ONLY the Super Admin can see this whole section */}
                    {isSuperAdmin && (
                        <>
                            <div className={styles.navSectionLabel}>System Control</div>
                            
                            <NavLink 
                                to="/dashboard/role-management" 
                                className={({ isActive }) => isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
                            >
                                <ShieldCheck size={20} /> <span>Role Management</span>
                            </NavLink>

                            <NavLink 
                                to="/dashboard/settings" 
                                className={({ isActive }) => isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
                            >
                                <Settings size={20} /> <span>System Settings</span>
                            </NavLink>
                        </>
                    )}
                </nav>

                <button onClick={handleLogout} className={styles.logoutBtn}>
                    <LogOut size={18} /> <span>Logout</span>
                </button>
            </aside>

            <div className={styles.mainWrapper}>
                <header className={styles.topbar}>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-700">
                                {user.first_name} {user.last_name}
                                {isSuperAdmin && <span className="ml-2 text-[8px] bg-amber-100 text-amber-700 px-1 rounded">SUPER</span>}
                            </p>
                            <p className="text-[10px] text-slate-400 uppercase">{user.role?.replace('_', ' ')}</p>
                        </div>
                        <UserCircle size={32} className="text-slate-400" />
                    </div>
                </header>

                <main className={styles.contentArea}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;