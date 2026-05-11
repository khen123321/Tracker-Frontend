import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Building, UserCircle, Trash2, Plus, Loader2, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { fetchDepartments, addDepartment, deleteDepartment } from '../../../store/departments/actions';
import { RootState } from '../../../store'; 

// ✨ ADDED: TypeScript Interface for Department
interface Department {
  id: number;
  name: string;
  supervisor_name: string;
}

export default function DepartmentSetting() {
  const dispatch = useDispatch();

  const { departments, loading, isSubmitting } = useSelector((state: RootState) => state.departments);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    supervisor_name: ''
  });

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const handleAddDepartment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name || !formData.supervisor_name) {
      toast.error('Both fields are required');
      return;
    }

    dispatch(addDepartment(formData));
    
    setFormData({ name: '', supervisor_name: '' }); 
    setIsModalOpen(false); 
  };

  const handleDelete = (id: number) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    dispatch(deleteDepartment(id));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-6 min-h-[500px]">
      <Toaster position="top-right" />
      
      {/* ─── HEADER & ADD BUTTON ─── */}
      <div className="border-b border-slate-100 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[#0B1EAE] text-xl font-bold flex items-center gap-2 m-0">
            <Building size={24} /> Manage Departments
          </h2>
          <p className="text-slate-500 text-sm mt-1 m-0">
            Add departments and assign supervisors. These will appear on the intern signup page.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0B1EAE] text-white rounded-lg font-semibold text-sm transition-all hover:bg-[#081682] hover:shadow-md active:scale-95 shrink-0"
        >
          <Plus size={18} /> Add Department
        </button>
      </div>

      {/* ─── LIST OF DEPARTMENTS ─── */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-slate-500 py-12">
            <Loader2 size={24} className="animate-spin text-[#0B1EAE]" /> 
            <span>Loading departments...</span>
          </div>
        ) : departments.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            No departments added yet. Click "Add Department" to get started.
          </div>
        ) : (
          <div className="grid gap-3">
            {/* ✨ ADDED: Explicitly typed 'dept' to fix the TS error */}
            {departments.map((dept: Department) => (
              <div key={dept.id} className="flex items-center justify-between p-5 rounded-[10px] border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200">
                <div>
                  <h4 className="font-bold text-slate-800 m-0 flex items-center gap-2">
                    <Building size={16} className="text-[#0B1EAE]" /> {dept.name}
                  </h4>
                  <p className="text-sm text-slate-500 flex items-center gap-2 mt-2 mb-0">
                    <UserCircle size={14} /> Supervisor: <span className="font-medium text-slate-700">{dept.supervisor_name}</span>
                  </p>
                </div>
                <button 
                  onClick={() => handleDelete(dept.id)}
                  className="text-slate-400 p-2 rounded-lg transition-all duration-200 hover:text-red-500 hover:bg-red-100"
                  title="Remove Department"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── ADD DEPARTMENT MODAL (OVERLAY) ─── */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 m-0">Add New Department</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors bg-transparent border-none cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddDepartment} className="flex flex-col">
              <div className="p-6 flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Department Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. IT Department" 
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none transition-all duration-200 focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10 bg-slate-50 focus:bg-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Assigned Supervisor</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Engr. Jay Noel Rojo" 
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none transition-all duration-200 focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10 bg-slate-50 focus:bg-white"
                    value={formData.supervisor_name}
                    onChange={(e) => setFormData({ ...formData, supervisor_name: e.target.value })}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#0B1EAE] border border-transparent hover:bg-[#081682] transition-colors shadow-md shadow-blue-900/20 flex items-center justify-center min-w-[140px] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Save Department'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
      
    </div>
  );
}