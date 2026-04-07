import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import toast, { Toaster } from 'react-hot-toast';
import { UserPlus, ShieldCheck, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';

const RoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'hr_intern'
  });

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/hr/all-users');
      setUsers(data);
    } catch {
      toast.error("Failed to load user list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hr/sub-users', formData);
      toast.success("Account created successfully!");
      setShowForm(false);
      fetchUsers(); 
      setFormData({ first_name: '', last_name: '', email: '', password: '', role: 'hr_intern' });
    } catch (err) {
      toast.error(err.response?.data?.message || "Check fields and try again.");
    }
  };

  // NEW: Handle changing roles directly from the table
  const handleRoleChange = async (userId, newRole, currentStatus) => {
    const loadingToast = toast.loading("Updating role...");
    try {
        await api.post(`/hr/update-permissions/${userId}`, {
            role: newRole,
            status: currentStatus || 'active'
        });
        toast.success("User role updated!", { id: loadingToast });
        fetchUsers(); 
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to update user.', { id: loadingToast });
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <Toaster position="top-right" />
      
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-[#0B1EAE]" />
            Role Management
          </h1>
          <p className="text-slate-500">Manage administrative access and sub-HR roles.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-[#0B1EAE] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-800 transition-all font-semibold shadow-md"
        >
          <UserPlus size={18} />
          {showForm ? 'Close Form' : 'Add HR Staff'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-white p-6 rounded-2xl border border-blue-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Register New Staff Member</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <input 
              type="text" placeholder="First Name" className="p-2 border rounded-lg outline-[#0B1EAE]"
              value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required
            />
            <input 
              type="text" placeholder="Last Name" className="p-2 border rounded-lg outline-[#0B1EAE]"
              value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required
            />
            <input 
              type="email" placeholder="Email" className="p-2 border rounded-lg outline-[#0B1EAE]"
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required
            />
            <input 
              type="password" placeholder="Password" className="p-2 border rounded-lg outline-[#0B1EAE]"
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required
            />
            <select 
              className="p-2 border rounded-lg outline-[#0B1EAE] bg-white"
              value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
            >
              <option value="hr_intern">HR Intern</option>
              <option value="hr">HR Staff</option>
              <option value="superadmin">Superadmin</option>
            </select>
            <button className="md:col-span-2 lg:col-span-5 bg-emerald-500 text-white py-2 rounded-lg font-bold hover:bg-emerald-600 transition-colors">
              Confirm & Create Account
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-sm font-bold text-slate-600">Name</th>
              <th className="p-4 text-sm font-bold text-slate-600">Email</th>
              <th className="p-4 text-sm font-bold text-slate-600">Access Level</th>
              <th className="p-4 text-sm font-bold text-slate-600">Status</th>
              <th className="p-4 text-sm font-bold text-slate-600 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">Fetching user data...</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-4 text-slate-700 font-medium">{user.first_name} {user.last_name}</td>
                <td className="p-4 text-slate-500 text-sm">{user.email}</td>
                <td className="p-4">
                  {/* NEW: Interactive Dropdown */}
                  <select 
                      className={`text-xs font-bold uppercase rounded-lg px-2 py-1 outline-none cursor-pointer border ${
                        user.role === 'superadmin' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        user.role === 'hr' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value, user.status)}
                      disabled={user.email === 'testadmin123@gmail.com'} 
                  >
                      <option value="hr_intern">HR Intern</option>
                      <option value="hr">HR Staff</option>
                      <option value="superadmin">Superadmin</option>
                  </select>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    {user.status === 'active' ? (
                      <><CheckCircle size={14} className="text-emerald-500" /> <span className="text-sm text-slate-600">Active</span></>
                    ) : (
                      <><XCircle size={14} className="text-rose-500" /> <span className="text-sm text-slate-600">Inactive</span></>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-2">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" title="Edit User"><Edit size={16} /></button>
                    {user.email !== 'testadmin123@gmail.com' && (
                      <button className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors" title="Deactivate User"><Trash2 size={16} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoleManagement;