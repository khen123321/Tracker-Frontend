import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Search, Clock, Camera, ClipboardList, 
    CalendarDays, FileUp, UserCog, Settings, ScrollText, 
    FileText, UserCircle, MoreHorizontal, ChevronLeft, 
    ChevronRight, LogOut, X, ChevronDown, ChevronUp
} from 'lucide-react';

//  REDUX IMPORTS
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { logoutRequest } from '../../store/auth/actions';

import logoImage from '../../assets/logo.png';
import smallLogo from '../../assets/logo-s.png';

interface SidebarProps {
    role: 'hr' | 'intern';
}

interface NavLinkDef {
    name: string;
    path: string;
    icon: React.ReactNode;
    perm?: string; 
    end?: boolean; 
}

export default function Sidebar({ role }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch(); // 

    // ─── STATE ───
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
    const [showMobileAccount, setShowMobileAccount] = useState<boolean>(false);
    
    // Check if any settings page is active to keep the menu highlighted
    const isSettingsActive = location.pathname.includes('/dashboard/settings');
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

    // Pull user safely from Redux!
    const authState = useSelector((state: RootState) => state.auth);
    const user = authState?.user || {} as any;

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
        { name: 'Profile', path: '/intern-dashboard/profile', icon: <UserCircle size={20} strokeWidth={1.5} /> }
    ];

    const visibleLinks = role === 'hr'
        ? hrLinks.filter(link => isSuperAdmin || (link.perm && permissions.includes(link.perm)))
        : internLinks;

   
    const mobileBottomLinks = role === 'hr'
        ? visibleLinks.filter(link => link.name !== 'Settings')
        : [
            internLinks.find(l => l.name === 'Dashboard'),
            internLinks.find(l => l.name === 'My Time Logs'),
            internLinks.find(l => l.name === 'Clock In/Out'), 
            internLinks.find(l => l.name === 'Forms and Requests')
        ].filter(Boolean) as NavLinkDef[];

    // ─── LOGOUT HANDLERS ───
    const handleLogoutClick = () => {
        setShowMobileAccount(false); 
        setShowLogoutModal(true);
    };
    const cancelLogout = () => setShowLogoutModal(false);
    
    // Trigger the Redux logout action
    const confirmLogout = () => {
        setShowLogoutModal(false);
        dispatch(logoutRequest()); // Tell Redux Saga to clear everything
        navigate('/login');
    };

    // ─── UI HANDLERS ───
    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const getDesktopNavClass = ({ isActive }: { isActive: boolean }) => {
        return `flex items-center gap-3 py-3.5 px-4 rounded-l-lg text-[14px] transition-all whitespace-nowrap overflow-hidden ${
            isActive 
                ? 'bg-gradient-to-r from-[#999] via-[#ccc] to-white text-[#061178] font-bold shadow-[-2px_0_8px_rgba(0,0,0,0.1)]' 
                : 'text-slate-300 hover:bg-white/10 hover:text-[#FFFFFF] font-normal'
        }`;
    };

    const getMobileName = (name: string) => {
        const shortNames: Record<string, string> = {
            'Forms and Requests': 'Forms',
            'Forms & Requests': 'Forms',
            'Camera Verification': 'Camera',
            'Role Management': 'Roles',
            'Time Tracker': 'Tracker',
            'Clock In/Out': 'Clock In',
            'My Time Logs': 'Logs'
        };
        return shortNames[name] || name;
    };

    const userInitial = user?.first_name?.[0]?.toUpperCase() || (role === 'hr' ? 'A' : 'I');
    const displayUserName = role === 'hr' && isSuperAdmin ? 'CLIMBS Admin' : `${user?.first_name || (role === 'hr' ? 'HR' : 'Intern')} ${user?.last_name || ''}`;

    return (
        <>
            {/* ─── DESKTOP SIDEBAR ─── */}
            <aside 
                className={`
                    hidden md:flex flex-col shrink-0 text-[#FFFFFF] 
                    shadow-[2px_0_10px_rgba(0,0,0,0.12)] z-40 transition-all duration-300 relative h-screen
                    ${isCollapsed ? 'w-[88px]' : 'w-[260px]'}
                `}
                style={{ 
                    background: 'var(--Main-color, linear-gradient(270deg, #0B1EAE 0%, #152286 23.56%, #0D1767 63.46%, #050C48 100%))' 
                }}
            >
                <button 
                    onClick={toggleSidebar} 
                    className="absolute -right-3 top-10 bg-white text-[#0B1EAE] w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 transition-transform hover:scale-110 z-50 border border-slate-200"
                >
                    {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
                </button>

                <div className="py-10 px-6 flex items-center justify-center h-[120px] transition-all">
                    <img 
                        src={isCollapsed ? smallLogo : logoImage} 
                        alt="CLIMBS Logo" 
                        className={`object-contain transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-[150px] h-auto'}`} 
                    />
                </div>

                <nav className="flex-1 flex flex-col pl-4 gap-1 overflow-visible py-4 relative z-[60]">
                    {visibleLinks.map((link) => {
                        
                        if (link.name === 'Settings') {
                            return (
                                <div key={link.name} className="relative flex flex-col">
                                    <button
                                        onClick={() => {
                                            if (isCollapsed) setIsCollapsed(false); 
                                            setIsSettingsOpen(!isSettingsOpen);
                                        }}
                                        className={`flex items-center justify-between gap-3 py-3.5 px-4 rounded-l-lg text-[14px] transition-all whitespace-nowrap overflow-hidden cursor-pointer ${
                                            isSettingsActive
                                                ? 'bg-gradient-to-r from-[#999] via-[#ccc] to-white text-[#061178] font-bold shadow-[-2px_0_8px_rgba(0,0,0,0.1)]' 
                                                : 'text-slate-300 hover:bg-white/10 hover:text-white font-normal'
                                        }`}
                                        title={isCollapsed ? 'Settings' : undefined}
                                    >
                                        <div className="flex items-center gap-3 shrink-0">
                                            {link.icon}
                                            <span className={`transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>
                                                {link.name}
                                            </span>
                                        </div>
                                        {!isCollapsed && (
                                            <div className={`shrink-0 transition-transform duration-200 ${isSettingsActive ? 'text-[#061178]' : 'text-slate-400'}`}>
                                                {isSettingsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                        )}
                                    </button>
                                    
                                    {!isCollapsed && (
                                        <div 
                                            className={`absolute top-[calc(100%+8px)] left-6 right-4 z-[100] bg-[#0A1560] border border-white/10 rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-200 origin-top ${
                                                isSettingsOpen 
                                                    ? 'opacity-100 scale-y-100 pointer-events-auto' 
                                                    : 'opacity-0 scale-y-95 pointer-events-none'
                                            }`}
                                        >
                                            <div className="flex flex-col py-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                                
                                                <NavLink 
                                                    to="/dashboard/settings/departments" 
                                                    onClick={() => setIsSettingsOpen(false)}
                                                    className={({isActive}) => `py-2.5 px-4 text-[13px] transition-colors flex items-center gap-3 w-full ${
                                                        isActive 
                                                            ? 'bg-white/20 text-white font-bold' 
                                                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                                    }`}
                                                >
                                                    <FileText size={14} className="opacity-70 shrink-0" />
                                                    <span className="truncate">Departments</span>
                                                </NavLink>
                                                
                                                <NavLink 
                                                    to="/dashboard/settings/branches" 
                                                    onClick={() => setIsSettingsOpen(false)}
                                                    className={({isActive}) => `py-2.5 px-4 text-[13px] transition-colors flex items-center gap-3 w-full ${
                                                        isActive 
                                                            ? 'bg-white/20 text-white font-bold' 
                                                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                                    }`}
                                                >
                                                    <FileText size={14} className="opacity-70 shrink-0" />
                                                    <span className="truncate">Branch Locations</span>
                                                </NavLink>
                                                
                                                <NavLink 
                                                    to="/dashboard/settings/curriculum" 
                                                    onClick={() => setIsSettingsOpen(false)}
                                                    className={({isActive}) => `py-2.5 px-4 text-[13px] transition-colors flex items-center gap-3 w-full ${
                                                        isActive 
                                                            ? 'bg-white/20 text-white font-bold' 
                                                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                                    }`}
                                                >
                                                    <FileText size={14} className="opacity-70 shrink-0" />
                                                    <span className="truncate">Curriculum Rules</span>
                                                </NavLink>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        // STANDARD NAV LINKS
                        return (
                            <NavLink 
                                key={link.name}
                                to={link.path} 
                                end={link.end}
                                className={getDesktopNavClass}
                                title={isCollapsed ? link.name : undefined}
                                onClick={() => setIsSettingsOpen(false)} 
                            >
                                <div className="shrink-0">{link.icon}</div>
                                <span className={`transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>
                                    {link.name}
                                </span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div 
                    onClick={handleLogoutClick} 
                    title="Click to Logout"
                    className={`m-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${isCollapsed ? 'justify-center' : ''} relative z-[40]`}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-xs font-bold text-[#FFFFFF] shrink-0 shadow-inner">
                            {userInitial}
                        </div>
                        {!isCollapsed && (
                            <span className="text-sm font-medium text-[#FFFFFF] truncate">
                                {displayUserName}
                            </span>
                        )}
                    </div>
                    {!isCollapsed && <MoreHorizontal size={18} className="text-slate-400 shrink-0" />}
                </div>
            </aside>

            {/* ─── MOBILE BOTTOM NAV BAR ─── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] pb-safe">
                <div className={`flex items-center justify-around w-full px-1 ${role === 'hr' ? 'overflow-x-auto no-scrollbar' : 'overflow-visible'}`}>
                    {mobileBottomLinks.map((link) => {
                        const isClockIn = link.name === 'Clock In/Out';

                        return (
                            <NavLink 
                                key={link.name}
                                to={link.path} 
                                end={link.end}
                                className={({ isActive }) => `
                                    relative flex flex-col items-center justify-center min-w-[65px] flex-1 py-2.5 px-1 gap-1 transition-colors h-[60px]
                                    ${isActive && !isClockIn ? 'text-[#0B1EAE]' : 'text-slate-400 hover:text-slate-600'}
                                `}
                            >
                                {({ isActive }) => isClockIn ? (
                                    <>
                                        <div className={`
                                            absolute -top-5 flex items-center justify-center w-14 h-14 rounded-full border-[4px] border-white text-white shadow-[0_6px_16px_rgba(11,30,174,0.35)] transition-transform
                                            ${isActive ? 'bg-[#081682] scale-105' : 'bg-[#0B1EAE] hover:bg-[#081682]'}
                                        `}>
                                            {/* ✨ FIX: React.ReactElement<any> */}
                                            {React.cloneElement(link.icon as React.ReactElement<any>, { size: 24, strokeWidth: 2.5 })}
                                        </div>
                                        <div className="h-[22px]"></div>
                                        <span className={`text-[10px] whitespace-nowrap mt-auto ${isActive ? 'font-bold text-[#0B1EAE]' : 'font-semibold text-slate-500'}`}>
                                            Clock In
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        {/* ✨ FIX: React.ReactElement<any> */}
                                        {React.cloneElement(link.icon as React.ReactElement<any>, { 
                                            size: 22, 
                                            strokeWidth: isActive ? 2.5 : 1.5 
                                        })}
                                        <span className={`text-[10px] whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>
                                            {getMobileName(link.name)}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                    
                    <button 
                        onClick={() => setShowMobileAccount(true)}
                        className={`flex flex-col items-center justify-center min-w-[65px] flex-1 py-2.5 px-1 gap-1 h-[60px] transition-colors ${showMobileAccount ? 'text-[#0B1EAE]' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <div className={`w-[24px] h-[24px] rounded-full bg-[#0B1EAE] flex items-center justify-center text-[10px] font-bold text-white transition-all ${showMobileAccount ? 'ring-2 ring-offset-1 ring-[#0B1EAE]' : ''}`}>
                            {userInitial}
                        </div>
                        <span className={`text-[10px] whitespace-nowrap mt-auto ${showMobileAccount ? 'font-bold' : 'font-medium'}`}>Profile</span>
                    </button>
                </div>
            </nav>

            {/* ─── MOBILE ACCOUNT BOTTOM SHEET ─── */}
            {showMobileAccount && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden animate-in fade-in" 
                    onClick={() => setShowMobileAccount(false)}
                >
                    <div 
                        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full duration-300 pb-safe"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-[#0B1EAE] flex items-center justify-center text-xl font-bold text-white shadow-inner">
                                    {userInitial}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 m-0 leading-tight">
                                        {displayUserName}
                                    </h3>
                                    <p className="text-sm text-slate-500 m-0 font-medium">
                                        {role === 'hr' ? 'Human Resources' : 'Intern'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowMobileAccount(false)}
                                className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {role === 'intern' ? (
                                <button 
                                    onClick={() => {
                                        setShowMobileAccount(false);
                                        navigate('/intern-dashboard/profile');
                                    }}
                                    className="w-full flex items-center gap-3 py-3.5 px-5 bg-slate-50 text-slate-700 rounded-2xl font-bold text-[15px] transition-colors hover:bg-slate-100 border border-slate-100"
                                >
                                    <UserCircle size={20} className="text-slate-500" />
                                    View Profile
                                </button>
                            ) : (
                                <button 
                                    onClick={() => {
                                        setShowMobileAccount(false);
                                        navigate('/dashboard/settings/departments'); 
                                    }}
                                    className="w-full flex items-center gap-3 py-3.5 px-5 bg-slate-50 text-slate-700 rounded-2xl font-bold text-[15px] transition-colors hover:bg-slate-100 border border-slate-100"
                                >
                                    <Settings size={20} className="text-slate-500" />
                                    Account Settings
                                </button>
                            )}

                            <button 
                                onClick={handleLogoutClick}
                                className="w-full flex items-center gap-3 py-3.5 px-5 bg-red-50 text-red-500 rounded-2xl font-bold text-[15px] transition-colors hover:bg-red-100 border border-red-50"
                            >
                                <LogOut size={20} strokeWidth={2.5} />
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── LOGOUT CONFIRMATION MODAL ─── */}
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

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); }
                
                /* Hide scrollbar in mobile bottom nav but keep scrolling active */
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                /* Safe area padding for iPhones */
                .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
            `}</style>
        </>
    );
}