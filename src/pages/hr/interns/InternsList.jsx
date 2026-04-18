import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Search, SlidersHorizontal, MoreHorizontal } from 'lucide-react';
import api from '../../../api/axios';
import styles from './InternsList.module.css';
import InternDetailsModal from '../internsdetail/InternDetailsModal';

export default function InternsList() {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIntern, setSelectedIntern] = useState(null);

  const fetchInterns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hr/interns');
      setInterns(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching interns:", err);
      setError("Failed to load interns list.");
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

  // 👇 HELPER 1: Translate Department ID back to text
  const getDepartmentName = (id) => {
    if (!id) return 'N/A';
    const departments = {
      "1": "Insurtech - Business Analyst & System Development",
      "2": "CARES",
      "3": "EDP",
      "4": "CESLA",
      "5": "Finance",
      "6": "HR"
    };
    return departments[String(id)] || id; 
  };

  // 👇 HELPER 2: Translate School ID back to text
  const getSchoolName = (id, fallbackName) => {
    if (!id && !fallbackName) return 'N/A';
    const schools = {
      "1": "USTP",
      "2": "Xavier University (XU)",
      "3": "Capitol University (CU)",
      "4": "Liceo de Cagayan"
    };
    return schools[String(id)] || fallbackName || id; 
  };

  const totalInterns = interns.length;
  const activeInterns = interns.filter(i => i.status?.toLowerCase() === 'active').length;

  const stats = [
    { label: 'Total Interns', value: totalInterns },
    { label: 'Absent', value: 0 },
    { label: 'Avg. Hours Rendered', value: 0 },
    { label: 'Active', value: activeInterns },
  ];

  if (loading) {
    return <div className={styles.pageWrapper}>Loading interns...</div>;
  }

  return (
    <div className={styles.pageWrapper}>
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

      <div className={styles.statsGrid}>
        {stats.map((stat, idx) => (
          <div key={idx} className={styles.statCard}>
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className={styles.filterGrid}>
        {['All Department', 'All School', 'All Status', 'Present'].map((filter, idx) => (
          <div key={idx} className={styles.selectWrapper}>
            <select className={styles.filterSelect} defaultValue={filter}>
              <option>{filter}</option>
            </select>
          </div>
        ))}
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>List Of Interns</h2>
          <div className={styles.tableControls}>
            <button className={styles.sortButton}>Sort <SlidersHorizontal size={14} /></button>
            <button className={styles.iconButton}><Search size={16} /></button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th className={styles.checkboxCell}><input type="checkbox" className={styles.checkbox} /></th>
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
                <tr><td colSpan="7" className={styles.emptyRow}>No interns found in the system.</td></tr>
              ) : (
                interns.map((user) => {
                  
                  // 👇 PULLING DATA FROM THE INTERN PROFILE 👇
                  const deptId = user.intern?.department_id;
                  const schoolId = user.intern?.school_id;
                  const schoolName = user.intern?.school;
                  const dateStart = user.intern?.date_started;

                  return (
                    <tr key={user.id}>
                      <td className={styles.checkboxCell}><input type="checkbox" className={styles.checkbox} /></td>
                      <td>
                        <div className={styles.internProfile}>
                          <div className={styles.avatar}>
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.first_name + user.id}`} alt="avatar" />
                          </div>
                          <div>
                            <p className={styles.internName}>{user.first_name} {user.last_name}</p>
                            <p className={styles.internEmail}>{user.email}</p>
                          </div>
                        </div>
                      </td>
                      
                      {/* APPLY THE HELPER TRANSLATORS TO THE TABLE */}
                      <td className={styles.cellText}>{getDepartmentName(deptId)}</td>
                      <td className={styles.cellText}>{getSchoolName(schoolId, schoolName)}</td>
                      <td className={styles.cellText}>{formatDate(dateStart || user.created_at)}</td>
                      
                      <td>
                        <span className={user.status?.toLowerCase() === 'active' ? styles.statusActive : styles.statusInactive}>
                          {user.status || 'Unknown'}
                        </span>
                      </td>
                      <td className={styles.actionCell}>
                        <button 
                          className={styles.actionButton}
                          onClick={() => {
                            // MAP EVERYTHING PERFECTLY FOR THE MODAL
                            setSelectedIntern({
                              id: user.id, 
                              name: `${user.first_name} ${user.last_name}`,
                              email: user.email,
                              department: getDepartmentName(deptId),
                              school: getSchoolName(schoolId, schoolName),
                              course: user.intern?.course || 'N/A',
                              emergency_name: user.intern?.emergency_name || 'NOT PROVIDED',
                              emergency_number: user.intern?.emergency_number || 'NOT PROVIDED',
                              emergency_address: user.intern?.emergency_address || 'NOT PROVIDED',
                            });
                          }}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedIntern && (
        <InternDetailsModal intern={selectedIntern} onClose={() => setSelectedIntern(null)} />
      )}
    </div>
  );
}