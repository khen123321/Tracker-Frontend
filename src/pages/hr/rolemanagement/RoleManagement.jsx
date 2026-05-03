import React, { useState, useEffect } from 'react';
import { Search, Shield, X, CheckCircle, UserCircle, Key, UserPlus, MapPin, Clock, UserCheck, Eye, EyeOff, ClipboardList, Mail } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../../../api/axios'; 
import styles from './RoleManagement.module.css';

// ✨ IMPORT YOUR UNIFIED PAGE HEADER ✨
import PageHeader from '../../../components/PageHeader';

// ✨ MUST match the strings in HrNavBar.jsx EXACTLY
const AVAILABLE_PAGES = [
  "Dashboard",
  "Intern",
  "Time Tracker",
  "Camera Verification",
  "Forms & Requests",
  "Events",
  "Reports",
  "Role Management",
  "Settings"
];

// ─── FULL PAGE SKELETON SCREEN ───
function RoleManagementSkeleton() {
  return (
    <div className={styles.pageWrapper}>
      {/* Skeleton Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', background: '#fff', borderRadius: '10px', border: '1px solid #e8eaf0' }}>
        <div className={styles.skel} style={{ width: '220px', height: '26px', borderRadius: '6px' }}></div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className={styles.skel} style={{ width: '36px', height: '36px', borderRadius: '8px' }}></div>
          <div className={styles.skel} style={{ width: '210px', height: '36px', borderRadius: '999px' }}></div>
        </div>
      </div>

      {/* Toolbar Skeleton */}
      <div className={styles.toolbarContainer}>
        <div className={`${styles.skel} ${styles.skelSearch}`}></div>
        <div className={styles.headerRight}>
          <div className={`${styles.skel} ${styles.skelActionBtn}`}></div>
          <div className={`${styles.skel} ${styles.skelActionBtn}`}></div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className={styles.tableSection}>
        <div className={styles.tableContainer}>
          {/* Table Header */}
          <div className={styles.skelTheadRow}>
            <div className={`${styles.skel} ${styles.skelTh}`} style={{ flex: 2 }}></div>
            <div className={`${styles.skel} ${styles.skelTh}`} style={{ flex: 1.5 }}></div>
            <div className={`${styles.skel} ${styles.skelTh}`} style={{ flex: 1 }}></div>
            <div className={`${styles.skel} ${styles.skelTh}`} style={{ flex: 1 }}></div>
            <div className={`${styles.skel} ${styles.skelTh}`} style={{ flex: 0.5 }}></div>
          </div>
          
          {/* Table Body Rows */}
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={styles.skelTbodyRow}>
              {/* User Cell */}
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={`${styles.skel} ${styles.skelAvatar}`}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <div className={`${styles.skel} ${styles.skelText}`} style={{ width: '60%' }}></div>
                  <div className={`${styles.skel} ${styles.skelText}`} style={{ width: '40%' }}></div>
                </div>
              </div>
              
              {/* Page Access */}
              <div style={{ flex: 1.5 }}>
                <div className={`${styles.skel} ${styles.skelBadge}`} style={{ width: '80%' }}></div>
              </div>
              
              {/* Account Type */}
              <div style={{ flex: 1 }}>
                <div className={`${styles.skel} ${styles.skelBadge}`}></div>
              </div>
              
              {/* Status */}
              <div style={{ flex: 1 }}>
                <div className={`${styles.skel} ${styles.skelText}`} style={{ width: '70%' }}></div>
              </div>
              
              {/* Action */}
              <div style={{ flex: 0.5 }}>
                <div className={`${styles.skel} ${styles.skelActionBtn}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RoleManagement() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]); 
  const [searchQuery, setSearchQuery] = useState('');
  
  // Who is currently using the app? (Needed to hide/show the Logs button)
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};
  const isSuperAdmin = currentUser.role?.toLowerCase() === 'superadmin';

  // Edit Access Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Profile View & Force Reset State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Audit Logs State
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Create User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'hr_intern',
    branch_id: '',
    permissions: [] 
  });

  // ─── FETCH INITIAL DATA ───
  const fetchData = async () => {
    try {
      const [usersRes, branchesRes] = await Promise.all([
        api.get('/hr/users-roles'),
        api.get('/public/branches') 
      ]);
      setUsers(usersRes.data);
      setBranches(branchesRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ─── FETCH AUDIT LOGS LOGIC ───
  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await api.get('/hr/activity-logs');
      setActivityLogs(response.data);
      setIsLogsModalOpen(true);
    } catch (error) {
      console.error("Failed to load logs:", error);
      toast.error("Failed to load audit logs.");
    } finally {
      setLogsLoading(false);
    }
  };

  const formatRoleDisplay = (role) => {
    if (!role) return 'Unknown';
    if (role.toLowerCase() === 'superadmin') return 'Super Admin';
    if (role.toLowerCase() === 'hr') return 'HR Staff';
    if (role.toLowerCase() === 'hr_intern') return 'HR Intern';
    return role;
  };

  // ─── CREATE USER LOGIC ───
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadId = toast.loading("Creating account & sending verification email...");
    
    try {
      await api.post('/hr/users', newUser);
      await fetchData(); 
      
      toast.success("Account created! Verification email sent.", { id: loadId });
      setIsAddModalOpen(false);
      setShowPassword(false);
      setNewUser({ first_name: '', last_name: '', email: '', password: '', role: 'hr_intern', branch_id: '', permissions: [] });
    } catch (error) {
      console.error("Failed to create user", error);
      toast.error(error.response?.data?.message || "Error creating account.", { id: loadId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewUserPermissionToggle = (page) => {
    setNewUser(prev => ({
      ...prev,
      permissions: prev.permissions.includes(page)
        ? prev.permissions.filter(p => p !== page)
        : [...prev.permissions, page]
    }));
  };

  // ─── EDIT ACCESS LOGIC ───
  const handleOpenAccessModal = (user) => {
    setSelectedUser(user);
    if (user.role?.toLowerCase() === 'superadmin') {
      setSelectedPermissions(AVAILABLE_PAGES);
    } else {
      setSelectedPermissions(Array.isArray(user.permissions) ? user.permissions : []);
    }
    setIsModalOpen(true);
  };

  const handleToggleEditPermission = (page) => {
    setSelectedPermissions(prev => 
      prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]
    );
  };

  const handleSaveRole = async () => {
    const loadId = toast.loading("Saving access limits...");
    try {
      await api.put(`/hr/users-roles/${selectedUser.id}`, {
        role: selectedUser.role, 
        permissions: selectedPermissions
      });
      
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, permissions: selectedPermissions } : u
      ));
      toast.success("Access updated!", { id: loadId });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to update permissions", error);
      toast.error("Error saving permissions.", { id: loadId });
    }
  };

  // ─── PROFILE VIEW & FORCE RESET LOGIC ───
  const handleViewProfile = (user) => {
    setProfileUser(user);
    setIsResetting(false);
    setResetPasswordValue('');
    setIsProfileModalOpen(true);
  };

  const handleForcePasswordReset = async () => {
    if (resetPasswordValue.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }
    
    const loadId = toast.loading("Resetting password...");
    try {
      await api.put(`/hr/users/${profileUser.id}/force-reset-password`, { 
        password: resetPasswordValue 
      });
      
      toast.success("Password reset successfully!", { id: loadId });
      setResetPasswordValue('');
      setIsResetting(false);
    } catch (error) {
      console.error("Reset Error:", error);
      toast.error("Failed to reset password.", { id: loadId });
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      user.name?.toLowerCase().includes(query) || 
      user.email?.toLowerCase().includes(query)
    );
  });

  // ✨ Show full page skeleton only on initial load
  if (loading) return <RoleManagementSkeleton />;

  return (
    <div className={styles.pageWrapper}>
      <Toaster position="top-right" />
      
      {/* ✨ UNIFIED HEADER ✨ */}
      <PageHeader title="Role Management" />

      {/* ✨ TOOLBAR (Search & Actions) ✨ */}
      <div className={styles.toolbarContainer}>
        <div className={styles.searchContainer}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search HR staff..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className={styles.headerRight}>
          {/* Audit Logs Button (Only visible to Superadmins) */}
          {isSuperAdmin && (
            <button 
              className={styles.addBtn} 
              style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }} 
              onClick={fetchAuditLogs}
              disabled={logsLoading}
            >
              <ClipboardList size={16} /> {logsLoading ? 'Loading...' : 'Audit Logs'}
            </button>
          )}

          <button className={styles.addBtn} onClick={() => setIsAddModalOpen(true)}>
            <UserPlus size={16} /> Add Staff
          </button>
        </div>
      </div>

      {/* ─── DATA TABLE ─── */}
      <div className={styles.tableSection}>
        <div className={styles.tableContainer}>
          <table className={styles.roleTable}>
            <thead>
              <tr>
                <th>HR Staff Member</th>
                <th>Page Access</th>
                <th>Account Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={styles.tableRow}>
                    
                    <td 
                      className={styles.userCell}
                      style={{ cursor: user.role?.toLowerCase() === 'superadmin' ? 'default' : 'pointer' }}
                      onClick={() => {
                        if (user.role?.toLowerCase() !== 'superadmin') {
                          handleViewProfile(user);
                        }
                      }}
                      title={user.role?.toLowerCase() === 'superadmin' ? "Super Admin Profile" : "Click to view full credentials"}
                    >
                      <div className={styles.avatar}>
                        <UserCircle size={20} />
                      </div>
                      <div>
                        <p 
                          className={styles.userName} 
                          style={user.role?.toLowerCase() === 'superadmin' ? { color: '#1e293b', fontWeight: 'bold' } : { color: '#2563eb', textDecoration: 'underline' }}
                        >
                          {user.name || `${user.first_name} ${user.last_name}`}
                        </p>
                        <p className={styles.userEmail}>{user.email}</p>
                      </div>
                    </td>

                    <td className={styles.accessCell}>
                      {user.role?.toLowerCase() === 'superadmin' ? (
                        <span className={styles.allAccess}>Full System Access</span>
                      ) : (
                        <div className={styles.tagsContainer}>
                          {(Array.isArray(user.permissions) ? user.permissions : []).map(page => (
                            <span key={page} className={styles.pageTag}>{page}</span>
                          ))}
                          {(!user.permissions || user.permissions.length === 0) && (
                            <span className={styles.noAccess}>No access granted</span>
                          )}
                        </div>
                      )}
                    </td>
                    
                    <td>
                      <span className={user.role?.toLowerCase() === 'superadmin' ? styles.badgeHead : styles.badgeIntern}>
                        <Shield size={14} />
                        {formatRoleDisplay(user.role)}
                      </span>
                    </td>

                    <td>
                      {user.email_verified_at ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '0.85rem', fontWeight: '600' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                          Verified
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#d97706', fontSize: '0.85rem', fontWeight: '600' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                          Pending Email
                        </span>
                      )}
                    </td>

                    <td>
                      <button 
                        className={styles.editBtn}
                        onClick={() => handleOpenAccessModal(user)}
                        disabled={user.role?.toLowerCase() === 'superadmin'}
                        title={user.role?.toLowerCase() === 'superadmin' ? "Superadmins have full access" : "Edit Access"}
                      >
                        <Key size={15} /> Access
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className={styles.emptyRow}>No staff found. Check your search filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── AUDIT LOGS MODAL ─── */}
      {isLogsModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '700px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>System Audit Logs</h2>
              <button className={styles.closeBtn} onClick={() => setIsLogsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody} style={{ overflowY: 'auto', padding: '0', backgroundColor: '#f8fafc' }}>
              {activityLogs.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#e2e8f0', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Date & Time</th>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>User</th>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Action Performed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                        <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#334155' }}>
                          {log.user ? `${log.user.first_name} ${log.user.last_name}` : 'System'}
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}>
                            {log.user ? formatRoleDisplay(log.user.role) : ''}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <strong style={{ color: '#0f172a', display: 'block' }}>{log.action}</strong>
                          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{log.description}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <ClipboardList size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                  <p>No activity logs recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD NEW STAFF MODAL ─── */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Create HR Account</h2>
              <button className={styles.closeBtn} onClick={() => { setIsAddModalOpen(false); setShowPassword(false); }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>First Name</label>
                    <input 
                      type="text" 
                      required 
                      className={styles.inputField} 
                      value={newUser.first_name}
                      onChange={e => setNewUser({...newUser, first_name: e.target.value})}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Last Name</label>
                    <input 
                      type="text" 
                      required 
                      className={styles.inputField} 
                      value={newUser.last_name}
                      onChange={e => setNewUser({...newUser, last_name: e.target.value})}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    required 
                    className={styles.inputField} 
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Temporary Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      minLength={6}
                      className={styles.inputField} 
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                      style={{ paddingRight: '40px', width: '100%' }}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={showPassword ? "Hide Password" : "Show Password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Account Role</label>
                    <select 
                      className={styles.inputField}
                      value={newUser.role}
                      onChange={e => setNewUser({...newUser, role: e.target.value, permissions: e.target.value === 'superadmin' ? AVAILABLE_PAGES : []})}
                    >
                      <option value="hr_intern">HR Intern</option>
                      <option value="hr">HR Staff</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Branch Assignment</label>
                    <select 
                      className={styles.inputField}
                      value={newUser.branch_id}
                      onChange={e => setNewUser({...newUser, branch_id: e.target.value})}
                    >
                      <option value="">Headquarters (All Branches)</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {newUser.role !== 'superadmin' && (
                  <div style={{ marginTop: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Initial Access Permissions</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {AVAILABLE_PAGES.map(page => (
                        <label key={`new-${page}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={newUser.permissions.includes(page)}
                            onChange={() => handleNewUserPermissionToggle(page)}
                          />
                          <span style={{ fontSize: '0.9rem' }}>{page}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => { setIsAddModalOpen(false); setShowPassword(false); }}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
                  <UserPlus size={16} /> {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── VIEW PROFILE & FORCE RESET MODAL ─── */}
      {isProfileModalOpen && profileUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '450px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>HR Profile</h2>
              <button className={styles.closeBtn} onClick={() => setIsProfileModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody} style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ display: 'inline-flex', padding: '20px', backgroundColor: '#f1f5f9', borderRadius: '50%', marginBottom: '16px' }}>
                <UserCircle size={60} color="#64748b" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{profileUser.name || `${profileUser.first_name} ${profileUser.last_name}`}</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>{profileUser.email}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Shield size={18} color="#3b82f6" />
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Account Role</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', fontWeight: '500' }}>{formatRoleDisplay(profileUser.role)}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <MapPin size={18} color="#ef4444" />
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Assigned Branch</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', fontWeight: '500' }}>{profileUser.branch_name || 'Headquarters'}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <UserCheck size={18} color="#10b981" />
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Created By</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', fontWeight: '500' }}>{profileUser.created_by || 'System Admin'}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Clock size={18} color="#8b5cf6" />
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Creation Date</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', fontWeight: '500' }}>{profileUser.created_at ? new Date(profileUser.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Danger Zone: Password Reset */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'left' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '10px' }}>
                  Danger Zone: Force Password Reset
                </p>
                
                {isResetting ? (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="Type new temp password" 
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                    <button 
                      onClick={handleForcePasswordReset}
                      style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => { setIsResetting(false); setResetPasswordValue(''); }}
                      style={{ backgroundColor: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsResetting(true)}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px dashed #ef4444', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    <Key size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }}/>
                    Overwrite User's Password
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT PERMISSION MODAL ─── */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Manage Access Limits</h2>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <p className={styles.modalSub}>
                Select which pages <strong>{selectedUser?.name || selectedUser?.first_name}</strong> is allowed to view and interact with in the HR Panel.
              </p>
              
              <div className={styles.permissionsList}>
                {AVAILABLE_PAGES.map((page) => (
                  <label key={`edit-${page}`} className={styles.permissionItem}>
                    <div className={styles.checkboxWrapper}>
                      <input 
                        type="checkbox" 
                        checked={selectedPermissions.includes(page)}
                        onChange={() => handleToggleEditPermission(page)}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkmark}></span>
                    </div>
                    <span className={styles.permissionLabel}>{page}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSaveRole}>
                <CheckCircle size={16} /> Save Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 