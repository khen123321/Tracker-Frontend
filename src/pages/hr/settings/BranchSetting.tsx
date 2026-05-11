import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MapPin, Navigation, Trash2, Plus, Loader2, X } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// ✨ REDUX IMPORTS ✨
import { RootState } from '../../../store';
import { 
    fetchBranchesRequest, 
    addBranchRequest, 
    deleteBranchRequest 
} from '../../../store/branches/actions';

export default function BranchSetting() {
    const dispatch = useDispatch();

    // ─── PULL GLOBAL STATE FROM REDUX ───
    const { 
        branches, 
        loading, 
        isSubmitting 
    } = useSelector((state: RootState) => state.branches);

    // ─── LOCAL UI STATES ───
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        radius: 100 // Default 100 meters
    });

    // ─── FETCH ON MOUNT ───
    useEffect(() => { 
        dispatch(fetchBranchesRequest()); 
    }, [dispatch]);

    // ─── CLOSE MODAL WHEN ADDITION IS SUCCESSFUL ───
    // We watch `isSubmitting`. If it turns false AND the modal is open, 
    // it means the saga finished. We can close the modal and reset the form.
    useEffect(() => {
        if (!isSubmitting && isModalOpen) {
            // Only reset and close if we actually typed a name (preventing close on initial load)
            if (formData.name !== '') {
                setIsModalOpen(false);
                setFormData({ name: '', address: '', latitude: '', longitude: '', radius: 100 });
            }
        }
    }, [isSubmitting]);

    // ─── HANDLE FORM SUBMISSION ───
    const handleAddBranch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.latitude || !formData.longitude) {
            // We can still keep simple local validation here before hitting Redux
            return;
        }

        // Send it off to the Saga!
        dispatch(addBranchRequest({
            name: formData.name,
            address: formData.address,
            latitude: formData.latitude,
            longitude: formData.longitude,
            radius: formData.radius
        }));
    };

    // ─── HANDLE DELETION ───
    const handleDelete = (id: string | number) => {
        if (!window.confirm('Delete this branch location? Geo-fencing will be disabled for its interns.')) return;
        
        // Send it off to the Saga!
        dispatch(deleteBranchRequest(id));
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-6 min-h-[500px]">
            <Toaster position="top-right" />
            
            {/* ─── HEADER & ADD BUTTON ─── */}
            <div className="border-b border-slate-100 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-[#0B1EAE] text-xl font-bold flex items-center gap-2 m-0">
                        <MapPin size={24} /> Branch Locations (Geo-Fencing)
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 m-0">
                        Define coordinates to restrict intern attendance to specific office locations.
                    </p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#0B1EAE] text-white rounded-lg font-semibold text-sm transition-all hover:bg-[#081682] hover:shadow-md active:scale-95 shrink-0"
                >
                    <Plus size={18} /> Add Branch
                </button>
            </div>

            {/* ─── BRANCH LIST ─── */}
            <div className="flex flex-col gap-3">
                {loading && branches.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 text-slate-500 py-12">
                        <Loader2 size={24} className="animate-spin" />
                        <span>Loading branch data...</span>
                    </div>
                ) : branches.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        No locations set. Click "Add Branch" to get started.
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
                                onClick={() => handleDelete(branch.id!)} 
                                disabled={isSubmitting}
                                className="text-slate-400 p-2 rounded-lg transition-all duration-200 hover:text-red-500 hover:bg-red-100 disabled:opacity-50"
                                title="Remove Location"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* ─── ADD BRANCH MODAL (OVERLAY) ─── */}
            {isModalOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => !isSubmitting && setIsModalOpen(false)} // Prevent closing while submitting
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()} 
                    >
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900 m-0">Add New Branch</h3>
                            <button 
                                onClick={() => !isSubmitting && setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors bg-transparent border-none cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleAddBranch} className="flex flex-col overflow-y-auto">
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Branch Name</label>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="e.g. Bulua Head Office" 
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none transition-all duration-200 focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10 bg-slate-50 focus:bg-white"
                                            value={formData.name} 
                                            onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Street Address</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Zone 1, Bulua" 
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none transition-all duration-200 focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10 bg-slate-50 focus:bg-white"
                                            value={formData.address} 
                                            onChange={(e) => setFormData({...formData, address: e.target.value})} 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Latitude</label>
                                        <input 
                                            type="number" 
                                            required
                                            step="any" 
                                            placeholder="e.g. 8.4851" 
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none transition-all duration-200 focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10 bg-slate-50 focus:bg-white"
                                            value={formData.latitude} 
                                            onChange={(e) => setFormData({...formData, latitude: e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Longitude</label>
                                        <input 
                                            type="number" 
                                            required
                                            step="any" 
                                            placeholder="e.g. 124.6433" 
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none transition-all duration-200 focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10 bg-slate-50 focus:bg-white"
                                            value={formData.longitude} 
                                            onChange={(e) => setFormData({...formData, longitude: e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Radius (Meters)</label>
                                        <input 
                                            type="number" 
                                            required
                                            placeholder="100" 
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none transition-all duration-200 focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10 bg-slate-50 focus:bg-white"
                                            value={formData.radius} 
                                            onChange={(e) => setFormData({...formData, radius: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl mt-auto">
                                <button 
                                    type="button" 
                                    onClick={() => !isSubmitting && setIsModalOpen(false)}
                                    className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting} 
                                    className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#0B1EAE] border border-transparent hover:bg-[#081682] transition-colors shadow-md shadow-blue-900/20 flex items-center justify-center min-w-[140px] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Save Location'}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}
            
        </div>
    );
}