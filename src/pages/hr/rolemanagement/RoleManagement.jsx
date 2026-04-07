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

  // 1. Fetch Users (We'll update the backend for this in a second)
  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/hr/all-users');
      setUsers(data);
    } catch  {
      toast.error("Failed to load user list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Handle Creation of HR Intern
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hr/sub-users', formData);
      toast.success("HR Intern account created!");
      setShowForm(false);
      fetchUsers(); // Refresh the table
      setFormData({ first_name: '', last_name: '', email: '', password: '', role: 'hr_intern' });
    } catch (err) {
      toast.error(err.response?.data?.message || "Check fields and try again.");
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
          {showForm ? 'Close Form' : 'Add HR Intern'}
        </button>
      </div>

      {/* CREATE SUB-HR FORM */}
      {showForm && (
        <div className="mb-8 bg-white p-6 rounded-2xl border border-blue-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Register New HR Intern</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <button className="md:col-span-2 lg:col-span-4 bg-emerald-500 text-white py-2 rounded-lg font-bold hover:bg-emerald-600">
              Confirm & Create Account
            </button>
          </form>
        </div>
      )}

      {/* USER TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-sm font-bold text-slate-600">Name</th>
              <th className="p-4 text-sm font-bold text-slate-600">Email</th>
              <th className="p-4 text-sm font-bold text-slate-600">Current Role</th>
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
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    user.role === 'hr' ? 'bg-blue-100 text-blue-700' : 
                    user.role === 'hr_intern' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.role.replace('_', ' ')}
                  </span>
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
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
                    {user.role !== 'hr' && (
                      <button className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
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