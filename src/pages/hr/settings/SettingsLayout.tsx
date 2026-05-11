import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

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

// ─── FULL PAGE SKELETON SCREEN (Updated to Full-Width) ───
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

      {/* Skeleton Content Area (Now takes up the whole space!) */}
      <main className="bg-white rounded-[10px] border border-[#e8eaf0] shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[500px] flex-1">
        <div className="p-5">
          <Sk w="200px" h="24px" mb="24px" r="6px" />
          <Sk w="100%" h="60px" mb="12px" r="8px" />
          <Sk w="100%" h="60px" mb="12px" r="8px" />
          <Sk w="100%" h="300px" r="10px" />
        </div>
      </main>
      
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

      {/* ✨ FULL WIDTH OUTLET CONTAINER ✨ */}
      {/* Removed the side navigation and grid split. Everything here is now 100% width */}
      <main className="flex-1 flex flex-col w-full mx-auto">
        <Outlet /> 
      </main>
      
    </div>
  );
}