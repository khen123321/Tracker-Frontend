import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PageHeader.module.css';

// ✨ Import your components
import NotificationBell from './NotificationBell';
import CustomCalendarIcon from "./icons/CustomCalendarIcon";

export default function PageHeader({ title, subtitle, onNotificationClick }) {
  const navigate = useNavigate();
  
  // ✨ FIX: Use a "lazy initializer" function. 
  // React runs this function exactly once on mount to get the initial state.
  const [userRole] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser.role?.toLowerCase() || 'intern';
      } catch  {
        console.error("Failed to parse user data from localStorage");
        return 'intern';
      }
    }
    return 'intern';
  });

  // Helper boolean to check if the user is HR or SuperAdmin
  const isHrOrAdmin = userRole === 'hr' || userRole === 'superadmin';

  // Format today's date
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric',
  });

  // ✨ Dynamic Routing Handlers ✨
  // Routes to the correct dashboard based on the user's role
  const handleNotificationClick = onNotificationClick || (() => {
    navigate(isHrOrAdmin ? '/dashboard/forms-requests' : '/intern-dashboard/forms-requests');
  });

  const handleCalendarClick = () => {
    navigate(isHrOrAdmin ? '/dashboard/events' : '/intern-dashboard/events');
  };

  return (
    <div className={styles.headerContainer}>
      
      {/* Title Area */}
      <div className={styles.titleArea}>
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && (
          <p className={styles.pageSubtitle}>{subtitle}</p>
        )}
      </div>

      {/* Actions Area */}
      <div className={styles.actionsArea}>
        
        {/* Pass the dynamic role to the NotificationBell */}
        <NotificationBell 
          role={userRole} 
          onNotificationClick={handleNotificationClick} 
        />
        
        <button 
          onClick={handleCalendarClick}
          className={styles.calendarBtn}
          title="Go to Events Calendar"
        >
          <CustomCalendarIcon size={20} />
          <span>{todayStr}</span>
        </button>

      </div>
    </div>
  );
}