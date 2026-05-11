'use client';

import React, { useState, useEffect } from 'react';
import { Search, Shield, X, CheckCircle, UserCircle, Key, UserPlus, MapPin, Clock, UserCheck, Eye, EyeOff, ClipboardList } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../../api/axios'; 

// ✨ IMPORT YOUR UNIFIED PAGE HEADER ✨
import PageHeader from '../../components/layout/PageHeader';

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

// Animation keyframes for shimmer
const shimmerAnimation = `
  @keyframes shimmer {
    0%   { background-position: -700px 0; }
    100% { background-position:  700px 0; }
  }
`;

// ─── FULL PAGE SKELETON SCREEN ───
function RoleManagementSkeleton() {
  return (
    <div className="flex flex-col gap-1 p-3 bg-slate-100 min-h-screen font-sans text-slate-900">
      <style>{shimmerAnimation}</style>
      
      {/* Skeleton Page Header */}
      <div className="flex justify-between p-3.5 bg-white rounded-[10px] border border-slate-200 shadow-sm">
        <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-700 h-6.5 rounded w-55" style={{ backgroundSize: '700px 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
        <div className="flex gap-3">
          <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-700 h-9 rounded-2xl w-9" style={{ backgroundSize: '700px 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
          <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-700 h-9 rounded-full w-52.5" style={{ backgroundSize: '700px 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
        </div>
      </div>

      {/* Toolbar Skeleton */}
      <div className="flex justify-between items-center bg-white p-3 px-5 rounded-[10px] border border-slate-200 shadow-sm">
        <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-700 h-10 rounded-2xl w-70" style={{ backgroundSize: '700px 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
        <div className="flex gap-2.5">
          <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-700 h-9 rounded-2xl w-27.5" style={{ backgroundSize: '700px 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
          <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-700 h-9 rounded-2xl w-27.5" style={{ backgroundSize: '700px 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-[10px] border border-slate-200 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          {/* Table Header */}
          <div className="flex items-center gap-6 p-4 px-5 border-b border-slate-200 bg-slate-100">
            <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-700 h-3.5 rounded flex-2" style={{ backgroundSize: '700px 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
            <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-700 h-3.5 rounded flex-1.5" style={{ backgroundSize: '700px 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
            <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-700 h-3.5 rounded flex-1" style={{ backgroundSize: '700px 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
            <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-700 h-3.5 rounded flex-1" style={{ backgroundSize: '700px 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
            <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-700 h-3.5 rounded flex-0.5" style={{ backgroundSize: '700px 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
          </div>
          
          {/* Table Body Rows */}
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-6 p-4 px-5 border-b border-slate-100">
              {/* User Cell */}
              <div className="flex-2 flex items-center gap-3">
                <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-700 w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundSize: '700px 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-700 h-3.5 rounded w-3/5" style={{ backgroundSize: '700px 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
                  <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-700 h-3.5 rounded w-2/5" style={{ backgroundSize: '700px 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
                </div>
              </div>
              
              {/* Page Access */}
              <div className="flex-1.5">
                <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-700 h-6.5 rounded w-4/5" style={{ backgroundSize: '700px 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
              </div>
              
              {/* Account Type */}
              <div className="flex-1">
                <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-700 h-6.5 rounded" style={{ backgroundSize: '700px 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
              </div>
              
              {/* Status */}
              <div className="flex-1">
                <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-700 h-3.5 rounded w-7/10" style={{ backgroundSize: '700px 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
              </div>
              
              {/* Action */}
              <div className="flex-0.5">
                <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-700 h-9 rounded-2xl w-27.5" style={{ backgroundSize: '700px 100%', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
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
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]); 
  const [searchQuery, setSearchQuery] = useState('');
  
  // Who is currently using the app? (Needed to hide/show the Logs button)
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}') || {};
  const isSuperAdmin = currentUser.role?.toLowerCase() === 'superadmin';

  // Edit Access Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Profile View & Force Reset State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Audit Logs State
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
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
  permissions: [] as string[] 
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

  const formatRoleDisplay = (role: string) => {
    if (!role) return 'Unknown';
    if (role.toLowerCase() === 'superadmin') return 'Super Admin';
    if (role.toLowerCase() === 'hr') return 'HR Staff';
    if (role.toLowerCase() === 'hr_intern') return 'HR Intern';
    return role;
  };

  // ─── CREATE USER LOGIC ───
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadId = toast.loading("Creating account & sending verification email...");
    
    try {
      // ✨ THE FIX: We intercept the empty string and convert it to null here!
      const payload = {
        ...newUser,
        branch_id: newUser.branch_id === "" ? null : newUser.branch_id
      };

      // ✨ Send the modified payload instead of the raw newUser state
      await api.post('/hr/users', payload);
      await fetchData(); 
      
      toast.success("Account created! Verification email sent.", { id: loadId });
      setIsAddModalOpen(false);
      setShowPassword(false);
      setNewUser({ first_name: '', last_name: '', email: '', password: '', role: 'hr_intern', branch_id: '', permissions: [] });
    } catch (error: any) {
      console.error("Failed to create user", error);
      toast.error(error.response?.data?.message || "Error creating account.", { id: loadId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewUserPermissionToggle = (page: string) => {
    setNewUser(prev => ({
      ...prev,
      permissions: prev.permissions.includes(page)
        ? prev.permissions.filter(p => p !== page)
        : [...prev.permissions, page]
    }));
  };

  // ─── EDIT ACCESS LOGIC ───
  const handleOpenAccessModal = (user: any) => {
    setSelectedUser(user);
    if (user.role?.toLowerCase() === 'superadmin') {
      setSelectedPermissions(AVAILABLE_PAGES);
    } else {
      setSelectedPermissions(Array.isArray(user.permissions) ? user.permissions : []);
    }
    setIsModalOpen(true);
  };

  const handleToggleEditPermission = (page: string) => {
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
  const handleViewProfile = (user: any) => {
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
    <div className="flex flex-col gap-1 p-3 bg-slate-100 min-h-screen font-sans text-slate-900">
      <Toaster position="top-right" />
      
      {/* ✨ UNIFIED HEADER ✨ */}
      <PageHeader title="Role Management" />

      {/* ✨ TOOLBAR (Search & Actions) ✨ */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-3 px-5 rounded-[10px] border border-slate-200 shadow-sm">
        
        {/* ✨ THE FIXED SEARCH BAR ✨ */}
        <div className="relative flex items-center w-full md:w-auto">
          <Search size={18} className="absolute left-3.5 text-slate-400 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search HR staff..." 
            className="w-full md:w-72 py-2 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-[#0B1EAE] focus:ring-4 focus:ring-[#0B1EAE]/10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Audit Logs Button (Only visible to Superadmins) */}
          {isSuperAdmin && (
            <button 
              className="inline-flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:enabled:bg-slate-200 flex-1 md:flex-auto"
              onClick={fetchAuditLogs}
              disabled={logsLoading}
            >
              <ClipboardList size={16} /> {logsLoading ? 'Loading...' : 'Audit Logs'}
            </button>
          )}

          <button className="inline-flex items-center justify-center gap-1.5 bg-blue-700 text-white px-4 py-2.5 rounded-2xl border-none text-xs font-semibold cursor-pointer transition-all hover:enabled:bg-blue-800 hover:enabled:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex-1 md:flex-auto" onClick={() => setIsAddModalOpen(true)}>
            <UserPlus size={16} /> Add Staff
          </button>
        </div>
      </div>

      {/* ─── DATA TABLE ─── */}
      <div className="bg-white rounded-[10px] border border-slate-200 shadow-sm overflow-hidden flex-1 mt-2">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="p-3.5 px-5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">HR Staff Member</th>
                <th className="p-3.5 px-5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Page Access</th>
                <th className="p-3.5 px-5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Account Type</th>
                <th className="p-3.5 px-5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="p-3.5 px-5 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 transition-colors hover:bg-slate-100">
                    
                    <td 
                      className="p-4 px-5 align-middle flex items-center gap-3"
                      style={{ cursor: user.role?.toLowerCase() === 'superadmin' ? 'default' : 'pointer' }}
                      onClick={() => {
                        if (user.role?.toLowerCase() !== 'superadmin') {
                          handleViewProfile(user);
                        }
                      }}
                      title={user.role?.toLowerCase() === 'superadmin' ? "Super Admin Profile" : "Click to view full credentials"}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                        <UserCircle size={20} />
                      </div>
                      <div>
                        <p 
                          className="m-0 mb-0.5 text-sm transition-colors"
                          style={user.role?.toLowerCase() === 'superadmin' ? { color: '#1e293b', fontWeight: 'bold' } : { color: '#2563eb', textDecoration: 'underline' }}
                        >
                          {user.name || `${user.first_name} ${user.last_name}`}
                        </p>
                        <p className="m-0 text-xs text-slate-600">{user.email}</p>
                      </div>
                    </td>

                    <td className="p-4 px-5 align-middle max-w-80">
                      {user.role?.toLowerCase() === 'superadmin' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-sm">Full System Access</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(user.permissions) ? user.permissions : []).map((page: string) => (
                            <span key={page} className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-1 rounded border border-slate-200 whitespace-nowrap">{page}</span>
                          ))}
                          {(!user.permissions || user.permissions.length === 0) && (
                            <span className="text-red-500 text-xs font-medium italic">No access granted</span>
                          )}
                        </div>
                      )}
                    </td>
                    
                    <td className="p-4 px-5 align-middle">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border whitespace-nowrap text-xs font-bold ${user.role?.toLowerCase() === 'superadmin' ? 'bg-red-100 text-red-900 border-red-300' : 'bg-indigo-100 text-indigo-900 border-indigo-200'}`}>
                        <Shield size={14} />
                        {formatRoleDisplay(user.role)}
                      </span>
                    </td>

                    <td className="p-4 px-5 align-middle">
                      {user.email_verified_at ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-600 text-xs font-semibold">
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                          Pending Email
                        </span>
                      )}
                    </td>

                    <td className="p-4 px-5 align-middle">
                      <button 
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-slate-200 bg-white text-slate-600 text-xs font-semibold cursor-pointer transition-all whitespace-nowrap hover:enabled:bg-slate-100 hover:enabled:text-slate-900 hover:enabled:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                  <td colSpan={5} className="text-center p-12 text-slate-400 italic text-sm">No staff found. Check your search filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── AUDIT LOGS MODAL ─── */}
      {isLogsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl w-full flex flex-col shadow-2xl max-w-2xl max-h-[80vh] animate-in">
            <div className="flex justify-between items-center p-6 px-6 border-b border-slate-200 bg-red-50">
              <h2 className="m-0 text-lg font-bold text-slate-900">System Audit Logs</h2>
              <button className="bg-transparent border-none text-slate-600 cursor-pointer p-1.5 rounded transition-all hover:bg-slate-100 hover:text-slate-900 flex items-center" onClick={() => setIsLogsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto bg-slate-100 flex-1">
              {activityLogs.length > 0 ? (
                <table className="w-full border-collapse text-xs text-left">
                  <thead className="bg-slate-300 sticky top-0">
                    <tr>
                      <th className="p-3 px-4 text-slate-600">Date & Time</th>
                      <th className="p-3 px-4 text-slate-600">User</th>
                      <th className="p-3 px-4 text-slate-600">Action Performed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-200 bg-white">
                        <td className="p-3 px-4 text-slate-600 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-3 px-4 font-bold text-slate-700">
                          {log.user ? `${log.user.first_name} ${log.user.last_name}` : 'System'}
                          <span className="block text-xs text-slate-500 font-normal">
                            {log.user ? formatRoleDisplay(log.user.role) : ''}
                          </span>
                        </td>
                        <td className="p-3 px-4">
                          <strong className="text-slate-900 block">{log.action}</strong>
                          <span className="text-slate-600 text-xs">{log.description}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-10 text-center text-slate-600">
                  <ClipboardList size={40} className="mx-auto mb-2.5 opacity-50" />
                  <p>No activity logs recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD NEW STAFF MODAL ─── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl w-full flex flex-col shadow-2xl max-w-2xl max-h-[90vh]">
            <div className="flex justify-between items-center p-6 px-6 border-b border-slate-200 bg-red-50">
              <h2 className="m-0 text-lg font-bold text-slate-900">Create HR Account</h2>
              <button className="bg-transparent border-none text-slate-600 cursor-pointer p-1.5 rounded transition-all hover:bg-slate-100 hover:text-slate-900 flex items-center" onClick={() => { setIsAddModalOpen(false); setShowPassword(false); }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1">
                <div className="flex gap-4">
                  <div className="flex-1 mb-5">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">First Name</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full p-2.5 px-3.5 border border-slate-200 rounded-2xl text-sm outline-none bg-slate-100 transition-all text-slate-900 box-border focus:border-blue-700 focus:bg-white focus:shadow-[0_0_0_3px_rgba(11,30,174,0.1)]"
                      value={newUser.first_name}
                      onChange={e => setNewUser({...newUser, first_name: e.target.value})}
                    />
                  </div>
                  <div className="flex-1 mb-5">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Last Name</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full p-2.5 px-3.5 border border-slate-200 rounded-2xl text-sm outline-none bg-slate-100 transition-all text-slate-900 box-border focus:border-blue-700 focus:bg-white focus:shadow-[0_0_0_3px_rgba(11,30,174,0.1)]"
                      value={newUser.last_name}
                      onChange={e => setNewUser({...newUser, last_name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full p-2.5 px-3.5 border border-slate-200 rounded-2xl text-sm outline-none bg-slate-100 transition-all text-slate-900 box-border focus:border-blue-700 focus:bg-white focus:shadow-[0_0_0_3px_rgba(11,30,174,0.1)]"
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Temporary Password</label>
                  <div className="relative flex items-center">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      minLength={6}
                      className="w-full p-2.5 px-3.5 pr-10 border border-slate-200 rounded-2xl text-sm outline-none bg-slate-100 transition-all text-slate-900 box-border focus:border-blue-700 focus:bg-white focus:shadow-[0_0_0_3px_rgba(11,30,174,0.1)]"
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 bg-transparent border-none cursor-pointer text-slate-600 flex items-center"
                      title={showPassword ? "Hide Password" : "Show Password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 mb-5">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Account Role</label>
                    <select 
                      className="w-full p-2.5 px-3.5 border border-slate-200 rounded-2xl text-sm outline-none bg-slate-100 transition-all text-slate-900 box-border focus:border-blue-700 focus:bg-white focus:shadow-[0_0_0_3px_rgba(11,30,174,0.1)]"
                      value={newUser.role}
                      onChange={e => setNewUser({...newUser, role: e.target.value, permissions: e.target.value === 'superadmin' ? AVAILABLE_PAGES : []})}
                    >
                      <option value="hr_intern">HR Intern</option>
                      <option value="hr">HR Staff</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </div>

                  <div className="flex-1 mb-5">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Branch Assignment</label>
                    <select 
                      className="w-full p-2.5 px-3.5 border border-slate-200 rounded-2xl text-sm outline-none bg-slate-100 transition-all text-slate-900 box-border focus:border-blue-700 focus:bg-white focus:shadow-[0_0_0_3px_rgba(11,30,174,0.1)]"
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
                  <div className="mt-2 mb-4">
                    <label className="block mb-2.5 font-bold text-xs">Initial Access Permissions</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {AVAILABLE_PAGES.map((page: string) => (
                        <label key={`new-${page}`} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={newUser.permissions.includes(page)}
                            onChange={() => handleNewUserPermissionToggle(page)}
                            className="accent-blue-600 w-4 h-4"
                          />
                          <span className="text-sm">{page}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 px-6 bg-white border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
                <button type="button" className="px-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-600 font-semibold text-xs cursor-pointer transition-all hover:bg-slate-100 hover:text-slate-900" onClick={() => { setIsAddModalOpen(false); setShowPassword(false); }}>Cancel</button>
                <button type="submit" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl border-none bg-blue-700 text-white font-semibold text-xs cursor-pointer transition-all hover:enabled:bg-blue-800 hover:enabled:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed" disabled={isSubmitting}>
                  <UserPlus size={16} /> {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── VIEW PROFILE & FORCE RESET MODAL ─── */}
      {isProfileModalOpen && profileUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl w-full flex flex-col shadow-2xl max-w-md">
            <div className="flex justify-between items-center p-6 px-6 border-b border-slate-200 bg-red-50">
              <h2 className="m-0 text-lg font-bold text-slate-900">HR Profile</h2>
              <button className="bg-transparent border-none text-slate-600 cursor-pointer p-1.5 rounded transition-all hover:bg-slate-100 hover:text-slate-900 flex items-center" onClick={() => setIsProfileModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto text-center">
              <div className="inline-flex p-5 bg-slate-100 rounded-full mb-4">
                <UserCircle size={60} color="#64748b" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 m-0">{profileUser.name || `${profileUser.first_name} ${profileUser.last_name}`}</h3>
              <p className="text-slate-600 text-sm mb-6">{profileUser.email}</p>
              
              <div className="flex flex-col gap-4 text-left bg-slate-100 p-4 rounded-3xl mb-5">
                <div className="flex items-center gap-3">
                  <Shield size={18} color="#3b82f6" />
                  <div>
                    <p className="m-0 text-xs text-slate-500 uppercase font-bold">Account Role</p>
                    <p className="m-0 text-sm text-slate-700 font-medium">{formatRoleDisplay(profileUser.role)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin size={18} color="#ef4444" />
                  <div>
                    <p className="m-0 text-xs text-slate-500 uppercase font-bold">Assigned Branch</p>
                    <p className="m-0 text-sm text-slate-700 font-medium">{profileUser.branch_name || 'Headquarters'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <UserCheck size={18} color="#10b981" />
                  <div>
                    <p className="m-0 text-xs text-slate-500 uppercase font-bold">Created By</p>
                    <p className="m-0 text-sm text-slate-700 font-medium">{profileUser.created_by || 'System Admin'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock size={18} color="#8b5cf6" />
                  <div>
                    <p className="m-0 text-xs text-slate-500 uppercase font-bold">Creation Date</p>
                    <p className="m-0 text-sm text-slate-700 font-medium">{profileUser.created_at ? new Date(profileUser.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Danger Zone: Password Reset */}
              <div className="border-t border-slate-200 pt-5 text-left">
                <p className="text-xs font-bold text-red-500 mb-2.5">
                  Danger Zone: Force Password Reset
                </p>
                
                {isResetting ? (
                  <div className="flex gap-2.5">
                    <input 
                      type="text" 
                      placeholder="Type new temp password" 
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                      className="flex-1 p-2 px-3 border border-slate-300 rounded"
                    />
                    <button 
                      onClick={handleForcePasswordReset}
                      className="bg-red-500 text-white border-none px-4 py-2 rounded cursor-pointer font-bold"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => { setIsResetting(false); setResetPasswordValue(''); }}
                      className="bg-slate-100 text-slate-600 border-none px-4 py-2 rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsResetting(true)}
                    className="w-full p-2.5 bg-red-100 text-red-500 border border-dashed border-red-500 rounded-2xl cursor-pointer font-bold transition-colors hover:bg-red-200"
                  >
                    <Key size={16} className="inline align-middle mr-1.5"/>
                    Overwrite User&apos;s Password
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT PERMISSION MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl w-full flex flex-col shadow-2xl max-w-2xl max-h-[90vh]">
            <div className="flex justify-between items-center p-6 px-6 border-b border-slate-200 bg-red-50 flex-shrink-0">
              <h2 className="m-0 text-lg font-bold text-slate-900">Manage Access Limits</h2>
              <button className="bg-transparent border-none text-slate-600 cursor-pointer p-1.5 rounded transition-all hover:bg-slate-100 hover:text-slate-900 flex items-center" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-slate-600 m-0 mb-5 leading-relaxed">
                Select which pages <strong>{selectedUser?.name || selectedUser?.first_name}</strong> is allowed to view and interact with in the HR Panel.
              </p>
              
              <div className="flex flex-col gap-3 bg-slate-100 p-4 rounded border border-slate-200">
                {AVAILABLE_PAGES.map((page) => (
                  <label key={`edit-${page}`} className="flex items-center gap-3 cursor-pointer p-2 rounded transition-colors hover:bg-slate-200">
                    <div className="relative w-5 h-5 flex-shrink-0">
                      <input 
                        type="checkbox" 
                        checked={selectedPermissions.includes(page)}
                        onChange={() => handleToggleEditPermission(page)}
                        className="opacity-0 w-0 h-0 absolute"
                      />
                      <span className="absolute top-0 left-0 h-5 w-5 bg-white border-2 border-slate-300 rounded transition-all"></span>
                      {selectedPermissions.includes(page) && (
                        <span className="absolute top-0 left-0 h-5 w-5 bg-blue-700 border-2 border-blue-700 rounded transition-all flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-800">{page}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 px-6 bg-white border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
              <button className="px-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-600 font-semibold text-xs cursor-pointer transition-all hover:bg-slate-100 hover:text-slate-900" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl border-none bg-blue-700 text-white font-semibold text-xs cursor-pointer transition-all hover:bg-blue-800 hover:-translate-y-0.5" onClick={handleSaveRole}>
                <CheckCircle size={16} /> Save Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}