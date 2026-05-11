import React from 'react';
import { useNavigate } from 'react-router-dom';

// ✨ REDUX IMPORTS ✨
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

// ✨ Imported BOTH notification components
import NotificationCenter from '../NotificationCenter';
import NotificationBell from '../NotificationBell'; 
import CustomCalendarIcon from "../icons/CustomCalendarIcon";

// ─── TYPESCRIPT INTERFACES ───
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onExportDTR?: () => void;
  onNotificationClick?: () => void; // ✨ Added the missing prop here!
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onExportDTR,
  onNotificationClick, // ✨ Destructured the new prop
}) => {
  const navigate = useNavigate();

  // ✨ THE FIX: Pull the user safely from Redux instead of localStorage
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Safely grab the role (defaults to 'intern' if user is somehow null)
  const userRole = user?.role?.toLowerCase() || 'intern';
  const isHrOrAdmin = userRole === 'hr' || userRole === 'superadmin';

  // Display the complete date (e.g., "Friday, May 8, 2026")
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleCalendarClick = () => {
    navigate(isHrOrAdmin ? '/dashboard/events' : '/intern-dashboard/events');
  };

  return (
    // Removed "overflow-hidden" so dropdowns/drawers don't get accidentally clipped
    <div className="flex flex-row justify-between items-center bg-white py-3 px-4 md:py-4 md:px-6 rounded-[10px] border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] gap-3 md:gap-4 flex-nowrap w-full">

      {/* Title Area - Added min-w-0 and truncate so it never pushes buttons down */}
      <div className="flex flex-col min-w-0 flex-1 pr-2">
        <h1 className="m-0 text-lg md:text-2xl font-black font-sans text-slate-900 leading-tight tracking-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 md:mt-1 mb-0 text-slate-500 text-xs md:text-sm font-medium truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions Area - Added shrink-0 so the buttons never get squished */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">

        {onExportDTR && (
          <button
            type="button"
            onClick={onExportDTR}
            className="flex items-center gap-1.5 md:gap-2 bg-white py-1.5 px-2 md:py-2 md:px-3 rounded-[10px] text-xs md:text-[13px] font-semibold text-slate-600 border border-slate-300 shadow-[0_1px_3px_rgba(0,0,0,0.04)] cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900"
          >
            Export DTR
          </button>
        )}

        {/* ✨ Wrapped in a div to attach the onNotificationClick event ✨ */}
        <div onClick={onNotificationClick} className={onNotificationClick ? "cursor-pointer" : ""}>
          {isHrOrAdmin ? (
            <NotificationBell />  
          ) : (
            <NotificationCenter role={userRole} />
          )}
        </div>

        <button
          type="button"
          onClick={handleCalendarClick}
          className="flex items-center gap-1.5 md:gap-2.5 bg-white py-1.5 px-2.5 md:py-2 md:px-3 rounded-[10px] text-xs md:text-[13px] font-semibold text-slate-600 border border-slate-300 shadow-[0_1px_3px_rgba(0,0,0,0.04)] cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900"
          title="Go to Events Calendar"
        >
          {/* Shrunk the icon slightly on mobile */}
          <div className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] flex items-center justify-center">
             <CustomCalendarIcon size={18} />
          </div>
          <span>{todayStr}</span>
        </button>

      </div>
    </div>
  );
};

export default PageHeader;