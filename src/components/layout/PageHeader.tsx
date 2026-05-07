import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import NotificationBell from '../NotificationBell';
import CustomCalendarIcon from "../icons/CustomCalendarIcon";

// ─── TYPESCRIPT INTERFACES ───
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onNotificationClick?: () => void;
  onExportDTR?: () => void;        // ✅ added — optional, only renders button when passed
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onNotificationClick,
  onExportDTR,                     // ✅ destructured
}) => {
  const navigate = useNavigate();

  const [userRole] = useState<string>(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser.role?.toLowerCase() || 'intern';
      } catch {
        console.error("Failed to parse user data from localStorage");
        return 'intern';
      }
    }
    return 'intern';
  });

  const isHrOrAdmin = userRole === 'hr' || userRole === 'superadmin';

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleNotificationClick = onNotificationClick || (() => {
    navigate(isHrOrAdmin ? '/dashboard/forms-requests' : '/intern-dashboard/forms-requests');
  });

  const handleCalendarClick = () => {
    navigate(isHrOrAdmin ? '/dashboard/events' : '/intern-dashboard/events');
  };

  return (
    <div className="flex justify-between items-center bg-white py-4 px-6 rounded-[10px] border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex-wrap gap-4">

      {/* Title Area */}
      <div className="flex flex-col">
        <h1 className="m-0 text-2xl font-black font-sans text-slate-900 leading-tight tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 mb-0 text-slate-500 text-sm font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions Area */}
      <div className="flex items-center gap-4">

        {/* ✅ Export DTR button — only renders on pages that pass onExportDTR */}
        {onExportDTR && (
          <button
            onClick={onExportDTR}
            className="flex items-center gap-2 bg-white py-2 px-3 rounded-[10px] text-[13px] font-semibold text-slate-600 border border-slate-300 shadow-[0_1px_3px_rgba(0,0,0,0.04)] cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900"
          >
            Export DTR
          </button>
        )}

        <NotificationBell
          role={userRole}
          onNotificationClick={handleNotificationClick}
        />

        <button
          onClick={handleCalendarClick}
          className="flex items-center gap-2.5 bg-white py-2 px-3 rounded-[10px] text-[13px] font-semibold text-slate-600 border border-slate-300 shadow-[0_1px_3px_rgba(0,0,0,0.04)] cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900"
          title="Go to Events Calendar"
        >
          <CustomCalendarIcon size={20} />
          <span>{todayStr}</span>
        </button>

      </div>
    </div>
  );
};

export default PageHeader;