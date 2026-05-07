import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Trash2, Plus, Loader2 } from 'lucide-react';
import api from '../../../api/axios';
import toast, { Toaster } from 'react-hot-toast';

// Define the shape of our Branch object for TypeScript
interface Branch {
  id: string | number;
  name: string;
  address: string;
  latitude: string | number;
  longitude: string | number;
  radius: string | number;
}

export default function BranchSetting() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    radius: 100 // Default 100 meters
  });

  // Fetch Existing Branches
  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hr/settings/branches');
      setBranches(response.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchBranches(); 
  }, []);

  // Handle Form Submission
  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.latitude || !formData.longitude) {
      toast.error('Name, Latitude, and Longitude are required');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/hr/settings/branches', formData);
      toast.success('Branch location saved!');
      setFormData({ name: '', address: '', latitude: '', longitude: '', radius: 100 });
      fetchBranches();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save branch location');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Deletion
  const handleDelete = async (id: string | number) => {
    if (!window.confirm('Delete this branch location? Geo-fencing will be disabled for its interns.')) return;
    
    try {
      await api.delete(`/hr/settings/branches/${id}`);
      toast.success('Branch removed');
      fetchBranches();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete branch');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-6">
      <Toaster position="top-right" />
      
      <div className="border-b border-slate-100 pb-4 mb-6">
        <h2 className="text-[#0B1EAE] text-xl font-bold flex items-center gap-2">
          <MapPin size={24} /> Branch Locations (Geo-Fencing)
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Define coordinates to restrict intern attendance to specific office locations.
        </p>
      </div>

      {/* ─── ADD NEW BRANCH FORM ─── */}
      <form onSubmit={handleAddBranch} className="bg-slate-50 p-6 rounded-[10px] border border-slate-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Branch Name</label>
            <input 
              type="text" 
              placeholder="e.g. Bulua Head Office" 
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10"
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Street Address</label>
            <input 
              type="text" 
              placeholder="e.g. Zone 1, Bulua" 
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10"
              value={formData.address} 
              onChange={(e) => setFormData({...formData, address: e.target.value})} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Latitude</label>
            <input 
              type="number" 
              step="any" 
              placeholder="e.g. 8.4851" 
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10"
              value={formData.latitude} 
              onChange={(e) => setFormData({...formData, latitude: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Longitude</label>
            <input 
              type="number" 
              step="any" 
              placeholder="e.g. 124.6433" 
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10"
              value={formData.longitude} 
              onChange={(e) => setFormData({...formData, longitude: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Radius (Meters)</label>
            <input 
              type="number" 
              placeholder="100" 
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10"
              value={formData.radius} 
              onChange={(e) => setFormData({...formData, radius: Number(e.target.value)})}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full bg-[#0A114A] text-white p-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200 hover:bg-[#0B1EAE] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
          Save Branch Location
        </button>
      </form>

      {/* ─── BRANCH LIST ─── */}
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-slate-800 mb-2">Configured Locations</h3>
        
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-slate-500 py-6">
            <Loader2 size={24} className="animate-spin" />
            <span>Loading branch data...</span>
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            No locations set. Add your first branch above.
          </div>
        ) : (
          branches.map(branch => (
            <div key={branch.id} className="flex justify-between items-center p-5 border border-slate-200 rounded-[10px] transition-all duration-200 hover:border-blue-200 hover:bg-blue-50">
              <div>
                <h4 className="font-bold text-slate-800 m-0">{branch.name}</h4>
                <p className="text-xs text-slate-500 mt-1 mb-2">{branch.address || 'No address provided'}</p>
                <div className="flex items-center gap-3 font-mono text-[0.65rem] bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded w-fit">
                  <Navigation size={10} />
                  <span>LAT: {branch.latitude}</span>
                  <span>LONG: {branch.longitude}</span>
                  <span className="font-extrabold">±{branch.radius}m</span>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(branch.id)} 
                className="text-slate-400 p-2 rounded-lg transition-all duration-200 hover:text-red-500 hover:bg-red-100"
                title="Remove Location"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}