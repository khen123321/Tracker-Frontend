import React, { useState, useEffect, useMemo } from 'react';
import { 
  Filter, Building2, GraduationCap, 
  MapPin, Calendar, BarChart3, Users, FileSpreadsheet
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../../../api/axios';
import toast, { Toaster } from 'react-hot-toast';
import styles from './ExportReports.module.css';

// ✨ IMPORT YOUR UNIFIED PAGE HEADER ✨
import PageHeader from '../../../components/PageHeader';

// ─── SKELETON PRIMITIVES ───
function Sk({ w = '100%', h = '16px', r = '8px', mb = '0' }) {
    return <div className={styles.skel} style={{ width: w, height: h, borderRadius: r, marginBottom: mb, flexShrink: 0 }} />;
}

// ─── FULL PAGE SKELETON SCREEN ───
function ExportReportsSkeleton() {
    return (
        <div className={styles.pageWrapper}>
            {/* Skeleton Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', background: '#fff', borderRadius: '10px', border: '1px solid #e8eaf0' }}>
                <Sk w="200px" h="26px" r="6px" />
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Sk w="36px" h="36px" r="8px" />
                    <Sk w="210px" h="36px" r="999px" />
                </div>
            </div>

            {/* Skeleton Toolbar */}
            <div className={styles.toolbarContainer}>
                <div className={styles.tabsArea}>
                    <Sk w="180px" h="36px" r="8px" />
                    <Sk w="180px" h="36px" r="8px" />
                </div>
                <Sk w="140px" h="36px" r="8px" />
            </div>

            {/* Skeleton Filters */}
            <div className={styles.filterCard}>
                <Sk w="140px" h="16px" mb="16px" />
                <div className={styles.filterGrid}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={styles.filterGroup}>
                            <Sk w="90px" h="14px" mb="6px" />
                            <Sk w="100%" h="38px" r="8px" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Skeleton Table Card */}
            <div className={styles.contentCard}>
                <div className={styles.cardHeader}>
                    <Sk w="220px" h="20px" r="4px" />
                </div>
                <div style={{ padding: '20px' }}>
                    <Sk w="100%" h="40px" mb="12px" r="6px" />
                    <Sk w="100%" h="40px" mb="12px" r="6px" />
                    <Sk w="100%" h="40px" mb="12px" r="6px" />
                    <Sk w="100%" h="40px" mb="12px" r="6px" />
                    <Sk w="100%" h="40px" r="6px" />
                </div>
            </div>
        </div>
    );
}

export default function ExportReports() {
  const [initialLoad, setInitialLoad] = useState(true); // ✨ Tracks first load for skeleton
  const [interns, setInterns] = useState([]);
  const [activeTab, setActiveTab] = useState('ojt'); // 'ojt' or 'school'

  // ─── FILTER STATES ───
  const [filters, setFilters] = useState({
    department: 'All',
    school: 'All',
    branch: 'All',
    completionRange: 'All',
    monthYear: '' 
  });

  // ─── FETCH DATA ───
  const fetchReportData = async () => {
    try {
      const response = await api.get('/hr/interns');
      setInterns(response.data || []);
    } catch (err) {
      console.error("Error fetching report data", err);
      toast.error("Failed to load report data.");
    } finally {
      setInitialLoad(false); // ✨ Turn off skeleton once data arrives
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // ✨ HELPER FUNCTION: BULLETPROOF SCHOOL EXTRACTION ✨
  const extractSchoolName = (intern) => {
    return (typeof intern.school === 'string' ? intern.school : intern.school?.name) || 
           intern.intern?.school?.name || 
           intern?.rawData?.intern?.school?.name || 
           'Unassigned';
  };

  // ✨ HELPER FUNCTION: BULLETPROOF DEPT EXTRACTION ✨
  const extractDeptName = (intern) => {
    return (typeof intern.department === 'string' ? intern.department : intern.department?.name) || 
           intern.intern?.department?.name || 
           intern?.rawData?.intern?.department?.name || 
           'Unassigned';
  };

  // ─── DYNAMIC UNIQUE VALUES FOR DROPDOWNS ───
  const uniqueDepts = useMemo(() => ['All', ...new Set(interns.map(extractDeptName).filter(Boolean))], [interns]);
  const uniqueSchools = useMemo(() => ['All', ...new Set(interns.map(extractSchoolName).filter(Boolean))], [interns]);
  const uniqueBranches = useMemo(() => ['All', ...new Set(interns.map(i => i.intern?.branch?.name || i.branch?.name || 'Unassigned').filter(Boolean))], [interns]);

  // ─── FILTER & PROGRESS LOGIC ───
  const filteredInterns = useMemo(() => {
    return interns.filter(intern => {
      const dept = extractDeptName(intern);
      const school = extractSchoolName(intern);
      const branch = intern.intern?.branch?.name || intern.branch?.name || 'Unassigned';
      
      const reqHours = parseFloat(intern.intern?.required_hours || 486);
      const renHours = parseFloat(intern.attendance_logs_sum_hours_rendered || intern.intern?.hours_rendered || 0);
      
      let progress = 0;
      if (reqHours > 0 && renHours > 0) {
          progress = (renHours / reqHours) * 100;
      }
      if (progress > 100) progress = 100;
      if (isNaN(progress)) progress = 0;

      const dateStarted = intern.intern?.date_started || intern.created_at;
      const startMonthYear = dateStarted ? dateStarted.substring(0, 7) : '';

      let matchesRange = true;
      if (filters.completionRange === 'Below 25%') matchesRange = progress < 25;
      else if (filters.completionRange === '25-50%') matchesRange = progress >= 25 && progress < 50;
      else if (filters.completionRange === '50-75%') matchesRange = progress >= 50 && progress < 75;
      else if (filters.completionRange === '75-99%') matchesRange = progress >= 75 && progress < 100;
      else if (filters.completionRange === 'Completed') matchesRange = progress >= 100;

      const matchesDept = filters.department === 'All' || dept === filters.department;
      const matchesSchool = filters.school === 'All' || school === filters.school;
      const matchesBranch = filters.branch === 'All' || branch === filters.branch;
      const matchesMonth = !filters.monthYear || startMonthYear === filters.monthYear;

      return matchesDept && matchesSchool && matchesBranch && matchesRange && matchesMonth;
    });
  }, [interns, filters]);

  // ─── SCHOOL ANALYTICS AGGREGATION ───
  const schoolAnalyticsData = useMemo(() => {
    const dataMap = {};
    
    filteredInterns.forEach(intern => {
      const school = extractSchoolName(intern);
      
      if (!dataMap[school]) {
        dataMap[school] = { name: school, totalInterns: 0, totalReq: 0, totalRen: 0, completed: 0 };
      }
      
      dataMap[school].totalInterns += 1;
      
      const req = parseFloat(intern.intern?.required_hours || 486);
      const ren = parseFloat(intern.attendance_logs_sum_hours_rendered || intern.intern?.hours_rendered || 0);
      
      dataMap[school].totalReq += req;
      dataMap[school].totalRen += ren;
      
      if (ren >= req && req > 0) {
        dataMap[school].completed += 1;
      }
    });

    return Object.values(dataMap).map(school => ({
      ...school,
      avgProgress: school.totalReq > 0 ? ((school.totalRen / school.totalReq) * 100).toFixed(1) : 0,
      active: school.totalInterns - school.completed
    })).sort((a, b) => b.totalInterns - a.totalInterns);
  }, [filteredInterns]);

  // ─── HELPER COMPONENTS ───
  const getProgressColor = (percent) => {
    if (percent >= 100) return '#22C55E'; 
    if (percent >= 75) return '#3B82F6';  
    if (percent >= 50) return '#EAB308';  
    if (percent >= 25) return '#F97316';  
    return '#EF4444'; 
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // ─── EXPORT LOGIC ───
  const handleExport = async () => {
    const loadingToast = toast.loading(`Preparing ${activeTab === 'ojt' ? 'OJT Completion' : 'School Analytics'} export...`);
    
    try {
      const payload = {
        report_type: activeTab,
        filters: filters
      };

      const response = await api.post('/hr/reports/export', payload, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CLIMBS_${activeTab.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Export downloaded successfully!", { id: loadingToast });
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to generate export file.", { id: loadingToast });
    }
  };

  // ✨ Show full page skeleton only on initial load
  if (initialLoad) return <ExportReportsSkeleton />;

  return (
    <div className={styles.pageWrapper}>
      <Toaster position="top-right" />
      
      {/* ✨ UNIFIED PAGE HEADER ✨ */}
      <PageHeader title="Reports" />

      {/* ✨ TOOLBAR: TABS + EXPORT BUTTON ✨ */}
      <div className={styles.toolbarContainer}>
        <div className={styles.tabsArea}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'ojt' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('ojt')}
          >
            <Users size={16} /> OJT Completion Report
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'school' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('school')}
          >
            <BarChart3 size={16} /> School Analytics Report
          </button>
        </div>
        
        <button onClick={handleExport} className={styles.exportBtn}>
          <FileSpreadsheet size={16} /> Export {activeTab === 'ojt' ? 'Data' : 'Analytics'}
        </button>
      </div>

      {/* ─── MASTER FILTER PANEL ─── */}
      <div className={styles.filterCard}>
        <div className={styles.filterHeader}>
          <Filter size={16} /> <span>Report Filters</span>
        </div>
        <div className={styles.filterGrid}>
          
          <div className={styles.filterGroup}>
            <label><Building2 size={14}/> Department</label>
            <select name="department" value={filters.department} onChange={handleFilterChange} className={styles.select}>
              {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label><GraduationCap size={14}/> School / University</label>
            <select name="school" value={filters.school} onChange={handleFilterChange} className={styles.select}>
              {uniqueSchools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label><MapPin size={14}/> Branch</label>
            <select name="branch" value={filters.branch} onChange={handleFilterChange} className={styles.select}>
              {uniqueBranches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {activeTab === 'ojt' && (
            <div className={styles.filterGroup}>
              <label><BarChart3 size={14}/> Completion Range</label>
              <select name="completionRange" value={filters.completionRange} onChange={handleFilterChange} className={styles.select}>
                <option value="All">All Progress</option>
                <option value="Below 25%">Below 25%</option>
                <option value="25-50%">25% – 50%</option>
                <option value="50-75%">50% – 75%</option>
                <option value="75-99%">75% – 99%</option>
                <option value="Completed">Completed (100%)</option>
              </select>
            </div>
          )}

          <div className={styles.filterGroup}>
            <label><Calendar size={14}/> Intake Month</label>
            <input 
              type="month" 
              name="monthYear" 
              value={filters.monthYear} 
              onChange={handleFilterChange} 
              className={styles.select}
            />
          </div>

        </div>
      </div>

      {/* ─── TAB 1: OJT COMPLETION REPORT ─── */}
      {activeTab === 'ojt' && (
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Intern Progress Tracking ({filteredInterns.length})</h3>
          </div>
          
          <div className={styles.tableWrapper}>
            <table className={styles.reportTable}>
              <thead>
                <tr>
                  <th>Intern Name</th>
                  <th>School</th>
                  <th>Department</th>
                  <th>Required</th>
                  <th>Rendered</th>
                  <th style={{ width: '250px' }}>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterns.length === 0 ? (
                  <tr><td colSpan="7" className={styles.emptyState}>No interns match the current filters.</td></tr>
                ) : (
                  filteredInterns.map(intern => {
                    const req = parseFloat(intern.intern?.required_hours || 486);
                    const ren = parseFloat(intern.attendance_logs_sum_hours_rendered || intern.intern?.hours_rendered || 0);
                    
                    const displaySchool = extractSchoolName(intern);
                    const displayDept = extractDeptName(intern);

                    let percent = 0;
                    if (req > 0 && ren > 0) {
                        percent = (ren / req) * 100;
                    }
                    
                    if (percent > 100) percent = 100;
                    if (isNaN(percent)) percent = 0;

                    const color = getProgressColor(percent);

                    return (
                      <tr key={intern.id}>
                        <td className={styles.boldCell}>{intern.first_name} {intern.last_name}</td>
                        <td className={styles.subCell}>{displaySchool}</td>
                        <td className={styles.subCell}>{displayDept}</td>
                        <td className={styles.numberCell}>{req} hrs</td>
                        <td className={styles.numberCell}>{ren.toFixed(1)} hrs</td>
                        
                        <td>
                          <div className={styles.progressContainer}>
                            <div className={styles.progressLabel}>
                              <span>{percent.toFixed(1)}%</span>
                            </div>
                            <div className={styles.progressTrack}>
                              <div 
                                className={styles.progressFill} 
                                style={{ width: `${percent}%`, backgroundColor: color }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        <td>
                          {percent >= 100 ? (
                            <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Completed</span>
                          ) : (
                            <span className={`${styles.statusBadge} ${styles.statusActive}`}>On-going</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SCHOOL ANALYTICS REPORT ─── */}
      {activeTab === 'school' && (
        <div className={styles.contentGrid}>
          
          <div className={styles.contentCard} style={{ flex: '1 1 100%' }}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Intern Distribution by School</h3>
            </div>
            <div className={styles.chartContainer}>
              {schoolAnalyticsData.length === 0 ? (
                <div className={styles.emptyState}>No data to chart.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={schoolAnalyticsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="active" name="Active Interns" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className={styles.contentCard} style={{ flex: '1 1 100%' }}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Institutional Summary</h3>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>School / University</th>
                    <th style={{ textAlign: 'center' }}>Total Interns</th>
                    <th style={{ textAlign: 'center' }}>Active</th>
                    <th style={{ textAlign: 'center' }}>Completed</th>
                    <th style={{ textAlign: 'right' }}>Avg. Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolAnalyticsData.length === 0 ? (
                    <tr><td colSpan="5" className={styles.emptyState}>No data matches filters.</td></tr>
                  ) : (
                    schoolAnalyticsData.map((school, index) => (
                      <tr key={index}>
                        <td className={styles.boldCell}>{school.name}</td>
                        <td className={styles.numberCell} style={{ textAlign: 'center', fontWeight: '800' }}>{school.totalInterns}</td>
                        <td className={styles.numberCell} style={{ textAlign: 'center', color: '#3B82F6' }}>{school.active}</td>
                        <td className={styles.numberCell} style={{ textAlign: 'center', color: '#22C55E' }}>{school.completed}</td>
                        <td style={{ textAlign: 'right' }}>
                           <span className={styles.avgBadge} style={{ backgroundColor: getProgressColor(school.avgProgress) + '20', color: getProgressColor(school.avgProgress) }}>
                             {school.avgProgress}%
                           </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}