import React, { useState, useEffect } from 'react';
import { Building, UserCircle, Trash2, Plus, Loader2 } from 'lucide-react';
import api from '../../../api/axios';
import toast, { Toaster } from 'react-hot-toast';

export default function DepartmentSetting() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    supervisor_name: ''
  });

  // Fetch Existing Departments on load
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hr/settings/departments');
      setDepartments(response.data);
    } catch {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Handle Form Submission
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.supervisor_name) {
      toast.error('Both fields are required');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/hr/settings/departments', formData);
      toast.success('Department added successfully!');
      setFormData({ name: '', supervisor_name: '' }); // Clear form
      fetchDepartments(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add department');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Deletion
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;

    try {
      await api.delete(`/hr/settings/departments/${id}`);
      toast.success('Department removed');
      fetchDepartments(); // Refresh list
    } catch {
      toast.error('Failed to delete department. It might be assigned to an intern.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <Toaster position="top-right" />
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold text-[#0B1EAE] flex items-center gap-2">
          <Building size={24} /> Manage Departments
        </h2>
        <p className="text-slate-500 text-sm mt-1">Add departments and assign supervisors. These will appear on the intern signup page.</p>
      </div>

      {/* ─── ADD NEW DEPARTMENT FORM ─── */}
      <form onSubmit={handleAddDepartment} className="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Department Name</label>
          <input 
            type="text" 
            placeholder="e.g. IT Department" 
            className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#0B1EAE]"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Assigned Supervisor</label>
          <input 
            type="text" 
            placeholder="e.g. Engr. Jay Noel Rojo" 
            className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#0B1EAE]"
            value={formData.supervisor_name}
            onChange={(e) => setFormData({ ...formData, supervisor_name: e.target.value })}
          />
        </div>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-[#0A114A] hover:bg-[#0B1EAE] text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-70 h-[42px]"
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          Add
        </button>
      </form>

      {/* ─── LIST OF DEPARTMENTS ─── */}
      <div>
        <h3 className="font-semibold text-slate-800 mb-4 text-lg">Current Departments</h3>
        {loading ? (
          <div className="text-center py-8 text-slate-400 flex flex-col items-center gap-2">
            <Loader2 size={24} className="animate-spin text-[#0B1EAE]" /> Loading...
          </div>
        ) : departments.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200 text-slate-500">
            No departments added yet. Add your first one above!
          </div>
        ) : (
          <div className="grid gap-3">
            {departments.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <Building size={16} className="text-[#0B1EAE]" /> {dept.name}
                  </h4>
                  <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                    <UserCircle size={14} /> Supervisor: <span className="font-medium text-slate-700">{dept.supervisor_name}</span>
                  </p>
                </div>
                <button 
                  onClick={() => handleDelete(dept.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove Department"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}