import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, Building, MapPin } from 'lucide-react';

// ✨ IMPORT YOUR UNIFIED PAGE HEADER ✨
import PageHeader from '../../../components/layout/PageHeader';

// ─── SKELETON PRIMITIVES ───
interface SkProps {
  w?: string;
  h?: string;
  r?: string;
  mb?: string;
}

function Sk({ w = '100%', h = '16px', r = '8px', mb = '0' }: SkProps) {
  return (
    <div
      className="shrink-0 animate-pulse"
      style={{
        width: w,
        height: h,
        borderRadius: r,
        marginBottom: mb,
        backgroundImage: 'linear-gradient(90deg, #e8ecf2 25%, #f4f6fa 50%, #e8ecf2 75%)',
        backgroundSize: '700px 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

// ─── FULL PAGE SKELETON SCREEN ───
function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-[5px] p-3 bg-[#f8f9fc] min-h-screen font-sans text-slate-900">
      {/* Skeleton Header */}
      <div className="flex justify-between px-5 py-3.5 bg-white rounded-[10px] border border-[#e8eaf0]">
        <Sk w="220px" h="26px" r="6px" />
        <div className="flex gap-3">
          <Sk w="36px" h="36px" r="8px" />
          <Sk w="210px" h="36px" r="999px" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-[5px] items-start flex-1">
        {/* Skeleton Sidebar */}
        <aside className="bg-white rounded-[10px] border border-[#e8eaf0] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <Sk w="100%" h="44px" r="8px" mb="8px" />
          <Sk w="100%" h="44px" r="8px" mb="8px" />
          <Sk w="100%" h="44px" r="8px" />
        </aside>

        {/* Skeleton Content Area */}
        <main className="bg-white rounded-[10px] border border-[#e8eaf0] shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[500px]">
          <div className="p-5">
            <Sk w="200px" h="24px" mb="24px" r="6px" />
            <Sk w="100%" h="60px" mb="12px" r="8px" />
            <Sk w="100%" h="60px" mb="12px" r="8px" />
            <Sk w="100%" h="300px" r="10px" />
          </div>
        </main>
      </div>
      
      {/* Required style block for the custom shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -700px 0; }
          100% { background-position:  700px 0; }
        }
      `}</style>
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
    <div className="flex flex-col gap-[5px] p-3 bg-[#f8f9fc] min-h-screen font-sans text-slate-900">
      
      {/* ✨ UNIFIED PAGE HEADER ✨ */}
      <PageHeader title="System Settings" />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-[5px] items-start flex-1">
        
        {/* SETTINGS SIDEBAR NAV */}
        <aside className="bg-white rounded-[10px] border border-[#e8eaf0] p-3 lg:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col">
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
            
            <NavLink 
              to="departments" 
              className={({ isActive }) => `
                group relative flex items-center gap-3 px-4 py-3 rounded-lg no-underline font-medium text-sm transition-all duration-200 whitespace-nowrap lg:whitespace-normal
                ${isActive ? 'bg-blue-50 text-[#0B1EAE] font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
              `}
            >
              {({ isActive }) => (
                <>
                  {/* Left indicator line (Desktop) / Bottom indicator line (Mobile) */}
                  <span className={`
                    absolute left-0 top-0 bottom-0 w-[3px] bg-[#0B1EAE] transition-transform duration-200 origin-center hidden lg:block
                    ${isActive ? 'scale-y-100' : 'scale-y-0'}
                  `}/>
                  <span className={`
                    absolute bottom-0 left-0 right-0 h-[3px] bg-[#0B1EAE] transition-transform duration-200 origin-center lg:hidden
                    ${isActive ? 'scale-x-100' : 'scale-x-0'}
                  `}/>
                  <Building size={18} /> Departments
                </>
              )}
            </NavLink>

            {/* ✨ NEW: Branch Locations (Geo-Fencing) ✨ */}
            <NavLink 
              to="branches" 
              className={({ isActive }) => `
                group relative flex items-center gap-3 px-4 py-3 rounded-lg no-underline font-medium text-sm transition-all duration-200 whitespace-nowrap lg:whitespace-normal
                ${isActive ? 'bg-blue-50 text-[#0B1EAE] font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
              `}
            >
              {({ isActive }) => (
                <>
                  <span className={`
                    absolute left-0 top-0 bottom-0 w-[3px] bg-[#0B1EAE] transition-transform duration-200 origin-center hidden lg:block
                    ${isActive ? 'scale-y-100' : 'scale-y-0'}
                  `}/>
                  <span className={`
                    absolute bottom-0 left-0 right-0 h-[3px] bg-[#0B1EAE] transition-transform duration-200 origin-center lg:hidden
                    ${isActive ? 'scale-x-100' : 'scale-x-0'}
                  `}/>
                  <MapPin size={18} /> Branch Locations
                </>
              )}
            </NavLink>

            <NavLink 
              to="curriculum" 
              className={({ isActive }) => `
                group relative flex items-center gap-3 px-4 py-3 rounded-lg no-underline font-medium text-sm transition-all duration-200 whitespace-nowrap lg:whitespace-normal
                ${isActive ? 'bg-blue-50 text-[#0B1EAE] font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
              `}
            >
              {({ isActive }) => (
                <>
                  <span className={`
                    absolute left-0 top-0 bottom-0 w-[3px] bg-[#0B1EAE] transition-transform duration-200 origin-center hidden lg:block
                    ${isActive ? 'scale-y-100' : 'scale-y-0'}
                  `}/>
                  <span className={`
                    absolute bottom-0 left-0 right-0 h-[3px] bg-[#0B1EAE] transition-transform duration-200 origin-center lg:hidden
                    ${isActive ? 'scale-x-100' : 'scale-x-0'}
                  `}/>
                  <BookOpen size={18} /> Curriculum Rules
                </>
              )}
            </NavLink>

          </nav>
        </aside>

        {/* SETTINGS CONTENT AREA */}
        <main className="flex flex-col gap-[5px]">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}