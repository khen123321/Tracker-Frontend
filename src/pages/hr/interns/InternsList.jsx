import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Search, SlidersHorizontal, MoreHorizontal } from 'lucide-react';
import api from '../../../api/axios';
import styles from './InternsList.module.css';

export default function InternsList() {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInterns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hr/interns');
      setInterns(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching interns:", err);
      setError("Failed to load interns list. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInterns(); }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const totalInterns = interns.length;
  const activeInterns = interns.filter(i => i.status?.toLowerCase() === 'active').length;
  const absentToday = 0;
  const avgHours = 0;

  const stats = [
    { label: 'Total Interns', value: totalInterns },
    { label: 'Absent', value: absentToday },
    { label: 'Avg. Hours Rendered', value: avgHours },
    { label: 'Active', value: activeInterns },
  ];

  if (loading) {
    return (
      <div className={styles.pageWrapper}>

        {/* Skeleton Header */}
        <div className={styles.header}>
          <div className={`${styles.skel} ${styles.skelTitle}`} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className={`${styles.skel} ${styles.skelIconBtn}`} />
            <div className={`${styles.skel} ${styles.skelDateBadge}`} />
          </div>
        </div>

        {/* Skeleton Stats Grid */}
        <div className={styles.statsGrid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={styles.statCard}>
              <div className={`${styles.skel} ${styles.skelStatLabel}`} />
              <div className={`${styles.skel} ${styles.skelStatValue}`} />
            </div>
          ))}
        </div>

        {/* Skeleton Filter Grid */}
        <div className={styles.filterGrid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`${styles.skel} ${styles.skelFilterItem}`} />
          ))}
        </div>

        {/* Skeleton Table */}
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <div className={`${styles.skel} ${styles.skelTableTitle}`} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className={`${styles.skel} ${styles.skelSortBtn}`} />
              <div className={`${styles.skel} ${styles.skelIconBtn}`} />
            </div>
          </div>

          {/* Skeleton thead */}
          <div className={styles.skelTheadRow}>
            <div className={`${styles.skel} ${styles.skelCheckbox}`} />
            {[160, 110, 110, 90, 80].map((w, i) => (
              <div key={i} className={`${styles.skel} ${styles.skelTh}`} style={{ width: `${w}px` }} />
            ))}
            <div className={`${styles.skel} ${styles.skelCheckbox}`} />
          </div>

          {/* Skeleton tbody rows */}
          {[...Array(7)].map((_, i) => (
            <div key={i} className={styles.skelTbodyRow}>
              <div className={`${styles.skel} ${styles.skelCheckbox}`} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '2', minWidth: '160px' }}>
                <div className={`${styles.skel} ${styles.skelAvatar}`} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div className={`${styles.skel} ${styles.skelName}`} />
                  <div className={`${styles.skel} ${styles.skelEmail}`} />
                </div>
              </div>
              {[110, 110, 90].map((w, j) => (
                <div key={j} className={`${styles.skel} ${styles.skelCell}`} style={{ width: `${w}px`, flex: '1' }} />
              ))}
              <div className={`${styles.skel} ${styles.skelBadge}`} style={{ flex: '0 0 80px' }} />
              <div className={`${styles.skel} ${styles.skelCheckbox}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>

      {/* Top Header */}
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Interns</h1>
        <div className={styles.headerActions}>
          <button className={styles.iconButton} onClick={fetchInterns} title="Refresh List">
            <Bell size={16} />
          </button>
          <div className={styles.dateBadge}>
            <Calendar size={15} />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {stats.map((stat, idx) => (
          <div key={idx} className={styles.statCard}>
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Dropdowns */}
      <div className={styles.filterGrid}>
        {['All Department', 'All School', 'All Status', 'Present'].map((filter, idx) => (
          <div key={idx} className={styles.selectWrapper}>
            <select className={styles.filterSelect} defaultValue={filter}>
              <option>{filter}</option>
            </select>
            <div className={styles.selectIcon}>
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className={styles.errorBanner}>
          {error}
        </div>
      )}

      {/* Main Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>List Of Interns</h2>
          <div className={styles.tableControls}>
            <button className={styles.sortButton}>
              Sort <SlidersHorizontal size={14} />
            </button>
            <button className={styles.iconButton}>
              <Search size={16} />
            </button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th className={styles.checkboxCell}>
                  <input type="checkbox" className={styles.checkbox} />
                </th>
                <th>Interns</th>
                <th>Department</th>
                <th>School</th>
                <th>Date Started</th>
                <th>Status</th>
                <th className={styles.actionCell}></th>
              </tr>
            </thead>
            <tbody>
              {interns.length === 0 ? (
                <tr>
                  <td colSpan="7" className={styles.emptyRow}>
                    No interns found in the system.
                  </td>
                </tr>
              ) : (
                interns.map((user) => (
                  <tr key={user.id}>
                    <td className={styles.checkboxCell}>
                      <input type="checkbox" className={styles.checkbox} />
                    </td>
                    <td>
                      <div className={styles.internProfile}>
                        <div className={styles.avatar}>
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.first_name + user.id}`}
                            alt="avatar"
                          />
                        </div>
                        <div>
                          <p className={styles.internName}>{user.first_name} {user.last_name}</p>
                          <p className={styles.internEmail}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={styles.cellText}>{user.intern?.department || 'N/A'}</td>
                    <td className={styles.cellText}>{user.intern?.school || 'N/A'}</td>
                    <td className={styles.cellText}>{formatDate(user.created_at)}</td>
                    <td>
                      <span className={user.status?.toLowerCase() === 'active' ? styles.statusActive : styles.statusInactive}>
                        {user.status || 'Unknown'}
                      </span>
                    </td>
                    <td className={styles.actionCell}>
                      <button className={styles.actionButton}>
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}