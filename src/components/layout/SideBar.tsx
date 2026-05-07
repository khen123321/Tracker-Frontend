import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Search, Clock, Camera, ClipboardList, 
    CalendarDays, FileUp, UserCog, Settings, ScrollText, 
    FileText, Megaphone, UserCircle, MoreHorizontal, 
    ChevronLeft, ChevronRight, Menu, X, LogOut
} from 'lucide-react';

// Adjust these paths to where your actual logo files are stored
import logoImage from '../../assets/logo.png';
import smallLogo from '../../assets/logo-s.png';

interface SidebarProps {
    role: 'hr' | 'intern';
}

interface NavLinkDef {
    name: string;
    path: string;
    icon: React.ReactNode;
    perm?: string; // Only needed for HR permission checks
    end?: boolean; // For exact route matching
}

export default function Sidebar({ role }: SidebarProps) {
    const navigate = useNavigate();

    // ─── STATE ───
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
    const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

    // ─── USER DATA & PERMISSIONS ───
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const permissions: string[] = user.permissions || [];
    const isSuperAdmin = user.role?.toLowerCase() === 'superadmin';

    // ─── LINK CONFIGURATION ───
    const hrLinks: NavLinkDef[] = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.5} />, perm: 'Dashboard', end: true },
        { name: 'Intern', path: '/dashboard/interns', icon: <Search size={20} strokeWidth={1.5} />, perm: 'Intern' },
        { name: 'Time Tracker', path: '/dashboard/time-tracker', icon: <Clock size={20} strokeWidth={1.5} />, perm: 'Time Tracker' },
        { name: 'Camera Verification', path: '/dashboard/camera-verification', icon: <Camera size={20} strokeWidth={1.5} />, perm: 'Camera Verification' },
        { name: 'Forms & Requests', path: '/dashboard/forms-requests', icon: <ClipboardList size={20} strokeWidth={1.5} />, perm: 'Forms & Requests' },
        { name: 'Events', path: '/dashboard/events', icon: <CalendarDays size={20} strokeWidth={1.5} />, perm: 'Events' },
        { name: 'Reports', path: '/dashboard/export', icon: <FileUp size={20} strokeWidth={1.5} />, perm: 'Reports' },
        { name: 'Role Management', path: '/dashboard/role-management', icon: <UserCog size={20} strokeWidth={1.5} />, perm: 'Role Management' },
        { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} strokeWidth={1.5} />, perm: 'Settings' }
    ];

    const internLinks: NavLinkDef[] = [
        { name: 'Dashboard', path: '/intern-dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.5} />, end: true },
        { name: 'Clock In/Out', path: '/intern-dashboard/attendance', icon: <Clock size={20} strokeWidth={1.5} /> },
        { name: 'My Time Logs', path: '/intern-dashboard/logs', icon: <ScrollText size={20} strokeWidth={1.5} /> },
        { name: 'Forms and Requests', path: '/intern-dashboard/forms', icon: <FileText size={20} strokeWidth={1.5} /> },
        { name: 'Announcements', path: '/intern-dashboard/announcements', icon: <Megaphone size={20} strokeWidth={1.5} /> },
        { name: 'Profile', path: '/intern-dashboard/profile', icon: <UserCircle size={20} strokeWidth={1.5} /> }
    ];

    // Filter links based on role and permissions
    const visibleLinks = role === 'hr'
        ? hrLinks.filter(link => isSuperAdmin || (link.perm && permissions.includes(link.perm)))
        : internLinks;

    // ─── LOGOUT HANDLERS ───
    const handleLogoutClick = () => setShowLogoutModal(true);
    const cancelLogout = () => setShowLogoutModal(false);
    const confirmLogout = () => {
        setShowLogoutModal(false);
        localStorage.removeItem('cims_token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // ─── UI HANDLERS ───
    const toggleSidebar = () => setIsCollapsed(!isCollapsed);
    const toggleMobileMenu = () => setIsMobileOpen(!isMobileOpen);

    const getNavClass = ({ isActive }: { isActive: boolean }) => {
        return `flex items-center gap-3 py-3.5 px-4 rounded-l-lg text-[14px] transition-all whitespace-nowrap overflow-hidden ${
            isActive 
                ? 'bg-gradient-to-r from-[#999] via-[#ccc] to-white text-[#061178] font-bold shadow-[-2px_0_8px_rgba(0,0,0,0.1)]' 
                : 'text-slate-300 hover:bg-white/10 hover:text-[#FFFFFF] font-normal'
        }`;
    };

    return (
        <>
            {/* ─── FLOATING MOBILE HAMBURGER (Visible only on small screens) ─── */}
            <button 
                className="md:hidden fixed top-4 left-4 z-20 p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors" 
                onClick={toggleMobileMenu}
            >
                <Menu size={24} />
            </button>

            {/* ─── MOBILE OVERLAY ─── */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in" 
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* ─── SIDEBAR ─── */}
            <aside 
                className={`
                    flex flex-col shrink-0 text-[#FFFFFF] 
                    shadow-[2px_0_10px_rgba(0,0,0,0.12)] z-40 transition-all duration-300 fixed md:relative h-full
                    ${isCollapsed ? 'md:w-[88px]' : 'md:w-[260px] w-[260px]'}
                    ${isMobileOpen ? 'left-0' : '-left-[260px] md:left-0'}
                `}
                style={{ 
                    background: 'var(--Main-color, linear-gradient(270deg, #0B1EAE 0%, #152286 23.56%, #0D1767 63.46%, #050C48 100%))' 
                }}
            >
                
                {/* Desktop Collapse Toggle */}
                <button 
                    onClick={toggleSidebar} 
                    className="hidden md:flex absolute -right-3 top-10 bg-white text-[#0B1EAE] w-6 h-6 rounded-full items-center justify-center shadow-md hover:bg-slate-50 transition-transform hover:scale-110 z-50 border border-slate-200"
                >
                    {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
                </button>

                {/* Mobile Close Button */}
                <button 
                    className="md:hidden absolute top-4 right-4 p-2 text-white/70 hover:text-[#FFFFFF] bg-white/10 rounded-lg" 
                    onClick={toggleMobileMenu}
                >
                    <X size={20} />
                </button>

                {/* Brand / Logo */}
                <div className={`py-10 px-6 flex items-center justify-center h-[120px] transition-all ...`}>
                    <img 
                        src={isCollapsed ? smallLogo : logoImage} 
                        alt="CLIMBS Logo" 
                        className={`object-contain transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-[150px] h-auto'}`} 
                    />
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 flex flex-col pl-4 gap-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar">
                    {visibleLinks.map((link) => (
                        <NavLink 
                            key={link.name}
                            to={link.path} 
                            end={link.end}
                            className={getNavClass}
                            onClick={() => setIsMobileOpen(false)}
                            title={isCollapsed ? link.name : undefined}
                        >
                            <div className="shrink-0">{link.icon}</div>
                            <span className={`transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>
                                {link.name}
                            </span>
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Profile / Logout Area */}
                <div 
                    onClick={handleLogoutClick} 
                    title="Click to Logout"
                    className={`m-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-xs font-bold text-[#FFFFFF] shrink-0 shadow-inner">
                            {user.first_name?.[0]?.toUpperCase() || (role === 'hr' ? 'A' : 'I')}
                        </div>
                        {!isCollapsed && (
                            <span className="text-sm font-medium text-[#FFFFFF] truncate">
                                {role === 'hr' && isSuperAdmin ? 'CLIMBS Admin' : `${user.first_name || (role === 'hr' ? 'HR' : 'Intern')} ${user.last_name || ''}`}
                            </span>
                        )}
                    </div>
                    {!isCollapsed && <MoreHorizontal size={18} className="text-slate-400 shrink-0" />}
                </div>
            </aside>

            {/* ─── LOGOUT MODAL ─── */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex justify-center items-center z-[9999] p-5 animate-in fade-in duration-200" onClick={cancelLogout}>
                    <div className="bg-white rounded-2xl w-full max-w-[400px] p-8 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        
                        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-5">
                            <LogOut size={24} className="text-red-500" />
                        </div>
                        
                        <h3 className="text-xl font-extrabold text-slate-900 mb-3 m-0">Log Out</h3>
                        
                        <p className="text-[15px] text-slate-500 leading-relaxed mb-8 m-0">
                            Are you sure you want to log out of your account? You will need to sign back in to access the dashboard.
                        </p>
                        
                        <div className="flex gap-3 w-full">
                            <button 
                                className="flex-1 bg-slate-100 text-slate-600 border-none py-3 rounded-xl font-bold text-[15px] cursor-pointer transition-colors hover:bg-slate-200 hover:text-slate-900" 
                                onClick={cancelLogout}
                            >
                                Cancel
                            </button>
                            <button 
                                className="flex-1 bg-red-500 text-[#FFFFFF] border-none py-3 rounded-xl font-bold text-[15px] cursor-pointer transition-all hover:bg-red-600 hover:-translate-y-[1px] shadow-[0_2px_4px_rgba(239,68,68,0.2)]" 
                                onClick={confirmLogout}
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Utility CSS for scrollbar hiding inside the nav */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
            `}</style>
        </>
    );
}