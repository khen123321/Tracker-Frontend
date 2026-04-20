import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Trash2, Plus, Loader2 } from 'lucide-react';
import api from '../../../api/axios';
import toast, { Toaster } from 'react-hot-toast';
import styles from './BranchSetting.module.css';

export default function BranchSetting() {
  const [branches, setBranches] = useState([]);
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
  const handleAddBranch = async (e) => {
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
  const handleDelete = async (id) => {
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
    <div className={styles.card}>
      <Toaster position="top-right" />
      
      <div className={styles.header}>
        <h2 className={styles.title}>
          <MapPin size={24} /> Branch Locations (Geo-Fencing)
        </h2>
        <p className={styles.description}>
          Define coordinates to restrict intern attendance to specific office locations.
        </p>
      </div>

      {/* ─── ADD NEW BRANCH FORM ─── */}
      <form onSubmit={handleAddBranch} className={styles.formSection}>
        <div className={styles.gridRow}>
          <div>
            <label className={styles.label}>Branch Name</label>
            <input 
              type="text" 
              placeholder="e.g. Bulua Head Office" 
              className={styles.input}
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          <div>
            <label className={styles.label}>Street Address</label>
            <input 
              type="text" 
              placeholder="e.g. Zone 1, Bulua" 
              className={styles.input}
              value={formData.address} 
              onChange={(e) => setFormData({...formData, address: e.target.value})} 
            />
          </div>
        </div>

        <div className={`${styles.gridRow} ${styles.coordinateRow}`}>
          <div>
            <label className={styles.label}>Latitude</label>
            <input 
              type="number" 
              step="any" 
              placeholder="e.g. 8.4851" 
              className={styles.input}
              value={formData.latitude} 
              onChange={(e) => setFormData({...formData, latitude: e.target.value})} 
            />
          </div>
          <div>
            <label className={styles.label}>Longitude</label>
            <input 
              type="number" 
              step="any" 
              placeholder="e.g. 124.6433" 
              className={styles.input}
              value={formData.longitude} 
              onChange={(e) => setFormData({...formData, longitude: e.target.value})} 
            />
          </div>
          <div>
            <label className={styles.label}>Radius (Meters)</label>
            <input 
              type="number" 
              placeholder="100" 
              className={styles.input}
              value={formData.radius} 
              onChange={(e) => setFormData({...formData, radius: e.target.value})} 
            />
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
          Save Branch Location
        </button>
      </form>

      {/* ─── BRANCH LIST ─── */}
      <div className={styles.branchList}>
        <h3 className="font-semibold text-slate-800 mb-2">Configured Locations</h3>
        
        {loading ? (
          <div className={styles.loadingSpinner}>
            <Loader2 size={24} className="animate-spin" />
            <span>Loading branch data...</span>
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            No locations set. Add your first branch above.
          </div>
        ) : (
          branches.map(branch => (
            <div key={branch.id} className={styles.branchItem}>
              <div className={styles.branchInfo}>
                <h4>{branch.name}</h4>
                <p className={styles.addressText}>{branch.address || 'No address provided'}</p>
                <div className={styles.geoBadge}>
                  <Navigation size={10} />
                  <span>LAT: {branch.latitude}</span>
                  <span>LONG: {branch.longitude}</span>
                  <span className={styles.radiusText}>±{branch.radius}m</span>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(branch.id)} 
                className={styles.deleteBtn}
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