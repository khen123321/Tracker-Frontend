import React, { useState, useEffect } from 'react';
import { Search, Shield, Edit2, X, CheckCircle, UserCircle, Key, UserPlus } from 'lucide-react';
import api from '../../../api/axios'; 
import styles from './RoleManagement.module.css';

const AVAILABLE_PAGES = [
  'Dashboard',
  'Time Tracker',
  'Intern Management',
  'Reports & Analytics',
  'Role Management'
];

export default function RoleManagement() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit Access Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Create User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'hr_intern' // Defaulting to intern!
  });

  // ─── FETCH USERS ───
  const fetchUsers = async () => {
    try {
      const res = await api.get('/hr/users-roles');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const formatRoleDisplay = (role) => {
    if (role === 'superadmin') return 'Super Admin (HR Head)';
    if (role === 'hr') return 'HR Staff';
    if (role === 'hr_intern') return 'HR Intern';
    return role;
  };

  // ─── CREATE USER LOGIC ───
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await api.post('/hr/users', newUser);
      
      // Refresh the table to show the new user
      await fetchUsers();
      
      // Close modal and reset form
      setIsAddModalOpen(false);
      setNewUser({ first_name: '', last_name: '', email: '', password: '', role: 'hr_intern' });
    } catch (error) {
      console.error("Failed to create user", error);
      alert(error.response?.data?.message || "Error creating account. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── EDIT ACCESS LOGIC ───
  const handleOpenModal = (user) => {
    setSelectedUser(user);
    if (user.role === 'superadmin') {
      setSelectedPermissions(AVAILABLE_PAGES);
    } else {
      setSelectedPermissions(user.permissions || []);
    }
    setIsModalOpen(true);
  };

  const handleTogglePermission = (page) => {
    setSelectedPermissions(prev => 
      prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]
    );
  };

  const handleSaveRole = async () => {
    try {
      await api.put(`/hr/users-roles/${selectedUser.id}`, {
        role: selectedUser.role, 
        permissions: selectedPermissions
      });
      
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, permissions: selectedPermissions } : u
      ));
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to update permissions", error);
      alert("Error saving permissions. Check your console.");
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.header}>
          <div className={`${styles.skel} ${styles.skelTitle}`} />
          <div className={`${styles.skel} ${styles.skelSearch}`} />
        </div>
        <div className={styles.tableSection}>
          <div className={styles.skelTheadRow}>
            <div className={`${styles.skel} ${styles.skelTh}`} style={{ width: '200px' }} />
            <div className={`${styles.skel} ${styles.skelTh}`} style={{ width: '250px' }} />
            <div className={`${styles.skel} ${styles.skelTh}`} style={{ width: '100px' }} />
            <div className={`${styles.skel} ${styles.skelTh}`} style={{ width: '80px' }} />
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={styles.skelTbodyRow}>
              <div style={{ display: 'flex', gap: '12px', flex: 1.5 }}>
                <div className={`${styles.skel} ${styles.skelAvatar}`} />
                <div>
                  <div className={`${styles.skel} ${styles.skelText}`} style={{ width: '120px', marginBottom: '6px' }} />
                  <div className={`${styles.skel} ${styles.skelText}`} style={{ width: '160px' }} />
                </div>
              </div>
              <div className={`${styles.skel} ${styles.skelText}`} style={{ flex: 2 }} />
              <div className={`${styles.skel} ${styles.skelBadge}`} style={{ flex: 1 }} />
              <div className={`${styles.skel} ${styles.skelActionBtn}`} style={{ flex: 0.5 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* ─── HEADER & SEARCH ─── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>HR Access Management</h1>
          <p className={styles.pageSub}>Manage your team and their panel permissions.</p>
        </div>
        
        <div className={styles.headerRight}>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={styles.tableRow}>
                    <td className={styles.userCell}>
                      <div className={styles.avatar}>
                        <UserCircle size={20} />
                      </div>
                      <div>
                        <p className={styles.userName}>{user.name}</p>
                        <p className={styles.userEmail}>{user.email}</p>
                      </div>
                    </td>
                    <td className={styles.accessCell}>
                      {user.role === 'superadmin' ? (
                        <span className={styles.allAccess}>Full System Access</span>
                      ) : (
                        <div className={styles.tagsContainer}>
                          {(user.permissions || []).map(page => (
                            <span key={page} className={styles.pageTag}>{page}</span>
                          ))}
                          {(!user.permissions || user.permissions.length === 0) && (
                            <span className={styles.noAccess}>No access granted</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={user.role === 'superadmin' ? styles.badgeHead : styles.badgeIntern}>
                        <Shield size={14} />
                        {formatRoleDisplay(user.role)}
                      </span>
                    </td>
                    <td>
                      <button 
                        className={styles.editBtn}
                        onClick={() => handleOpenModal(user)}
                        disabled={user.role === 'superadmin'}
                      >
                        <Key size={15} /> Access
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className={styles.emptyRow}>No staff found in the database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── ADD NEW STAFF MODAL ─── */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Create HR Account</h2>
              <button className={styles.closeBtn} onClick={() => setIsAddModalOpen(false)}>
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
                  <input 
                    type="text" 
                    required 
                    minLength={6}
                    className={styles.inputField} 
                    value={newUser.password}
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Account Role</label>
                  <select 
                    className={styles.inputField}
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="hr_intern">HR Intern</option>
                    <option value="hr">HR Staff</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
                  <UserPlus size={16} /> {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
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
                Select which pages <strong>{selectedUser?.name}</strong> is allowed to view and interact with in the HR Panel.
              </p>
              
              <div className={styles.permissionsList}>
                {AVAILABLE_PAGES.map((page) => (
                  <label key={page} className={styles.permissionItem}>
                    <div className={styles.checkboxWrapper}>
                      <input 
                        type="checkbox" 
                        checked={selectedPermissions.includes(page)}
                        onChange={() => handleTogglePermission(page)}
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