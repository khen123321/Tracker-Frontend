import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Pencil, Check, X, BookOpen, Loader2 } from 'lucide-react';
import api from '../../../api/axios';
import toast, { Toaster } from 'react-hot-toast';

// ─── TYPES & INTERFACES ───
interface School {
  id: string | number;
  name: string;
}

interface RequirementRule {
  id: string | number;
  school_id?: string | number;
  school?: School;
  course_name: string;
  required_hours: number | string;
}

interface NewRuleState {
  school_id: string;
  new_school_name: string;
  course_name: string;
  required_hours: string;
}

interface EditValuesState {
  course_name: string;
  required_hours: string;
}

// ✨ ABBREVIATION HELPER FUNCTION ✨
const getSchoolAbbreviation = (schoolName: string | undefined): string => {
  if (!schoolName) return '';

  const overrides: Record<string, string> = {
    "University of Science and Technology of Southern Philippines": "USTP",
    "Xavier University": "XU",
    "Xavier University - Ateneo de Cagayan": "XU",
    "Capitol University": "CU",
    "Liceo de Cagayan University": "LDCU",
    "Mindanao State University": "MSU"
  };

  if (overrides[schoolName]) return overrides[schoolName];

  const stopWords = ['of', 'and', 'the', 'in', 'at', 'de'];
  const words = schoolName.split(/[\s-]+/);

  let acronym = '';
  words.forEach(word => {
    if (!stopWords.includes(word.toLowerCase()) && word.length > 0) {
      acronym += word[0].toUpperCase();
    }
  });

  return acronym.length >= 2 ? acronym : schoolName;
};

export default function ProgramSettings() {
  const [requirements, setRequirements] = useState<RequirementRule[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // ✨ Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAddingNewSchool, setIsAddingNewSchool] = useState<boolean>(false);

  const [newRule, setNewRule] = useState<NewRuleState>({
    school_id: '',
    new_school_name: '',
    course_name: '',
    required_hours: ''
  });

  // ── Edit state ──
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editValues, setEditValues] = useState<EditValuesState>({
    course_name: '',
    required_hours: ''
  });

  const fetchData = async () => {
    try {
      const [reqRes, schoolsRes] = await Promise.all([
        api.get('/hr/settings/requirements'),
        api.get('/hr/settings/schools')
      ]);
      setRequirements(Array.isArray(reqRes.data) ? reqRes.data : []);
      setSchools(Array.isArray(schoolsRes.data) ? schoolsRes.data : []);
    } catch {
      toast.error("Failed to load program settings data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/hr/settings/requirements', newRule);
      toast.success("Rule added successfully!");
      setNewRule({ school_id: '', new_school_name: '', course_name: '', required_hours: '' });
      setIsAddingNewSchool(false);
      setIsModalOpen(false); // ✨ Close modal on success
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add rule.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) return;
    try {
      await api.delete(`/hr/settings/requirements/${id}`);
      toast.success("Rule deleted!");
      fetchData();
    } catch {
      toast.error("Failed to delete rule.");
    }
  };

  // ── Start editing ──
  const handleStartEdit = (rule: RequirementRule) => {
    setEditingId(rule.id);
    setEditValues({
      course_name: rule.course_name,
      required_hours: String(rule.required_hours)
    });
  };

  // ── Cancel edit ──
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({ course_name: '', required_hours: '' });
  };

  // ── Save edited rule ──
  const handleSaveEdit = async (id: string | number) => {
    if (!editValues.course_name.trim() || !editValues.required_hours) {
      toast.error("Course and required hours cannot be empty.");
      return;
    }
    try {
      await api.put(`/hr/settings/requirements/${id}`, {
        course_name: editValues.course_name.trim(),
        required_hours: Number(editValues.required_hours)
      });
      toast.success("Rule updated successfully!");
      setEditingId(null);
      setEditValues({ course_name: '', required_hours: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update rule.");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-6 min-h-[500px]">
      <Toaster position="top-right" />

      {/* ─── HEADER & ADD BUTTON ─── */}
      <div className="border-b border-slate-100 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[#0B1EAE] text-xl font-bold flex items-center gap-2 m-0">
            <BookOpen size={24} /> Program Settings
          </h2>
          <p className="text-slate-500 text-sm mt-1 m-0">
            Manage required OJT hours for different schools and degree programs.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0B1EAE] text-white rounded-lg font-semibold text-sm transition-all hover:bg-[#081682] hover:shadow-md active:scale-95 shrink-0"
        >
          <Plus size={18} /> Add Rule
        </button>
      </div>

      {/* ── EXISTING RULES TABLE ── */}
      <div className="flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-slate-500 py-12">
            <Loader2 size={24} className="animate-spin" />
            <span>Loading program data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-slate-200">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-4 text-xs text-slate-600 font-bold uppercase tracking-wider whitespace-nowrap">School</th>
                  <th className="py-3 px-4 text-xs text-slate-600 font-bold uppercase tracking-wider whitespace-nowrap">Course Program</th>
                  <th className="py-3 px-4 text-xs text-slate-600 font-bold uppercase tracking-wider whitespace-nowrap">Required Hours</th>
                  <th className="py-3 px-4 text-xs text-slate-600 font-bold uppercase tracking-wider text-center w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requirements.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 px-5 text-center text-slate-400 bg-slate-50/50">
                      No program rules set yet. Click "Add Rule" to get started.
                    </td>
                  </tr>
                )}

                {requirements.map(rule => {
                  const isEditing = editingId === rule.id;

                  return (
                    <tr
                      key={rule.id}
                      className={`border-b border-slate-100 transition-colors last:border-0 ${isEditing ? 'bg-[#f8faff]' : 'hover:bg-slate-50'}`}
                    >
                      {/* School — never editable (abbreviation stays) */}
                      <td
                        className="p-4 text-sm font-semibold text-slate-900 align-middle"
                        title={rule.school ? rule.school.name : ''}
                      >
                        {rule.school
                          ? getSchoolAbbreviation(rule.school.name)
                          : `School ID: ${rule.school_id}`}
                      </td>

                      {/* Course — editable inline */}
                      <td className="p-4 text-sm text-slate-900 align-middle">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.course_name}
                            onChange={(e) => setEditValues({ ...editValues, course_name: e.target.value })}
                            className="w-full px-3 py-2 rounded-md border-[1.5px] border-[#0B1EAE] outline-none text-[13px] box-border bg-white text-slate-900 focus:ring-[3px] focus:ring-[#0B1EAE]/10"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium text-slate-700">{rule.course_name}</span>
                        )}
                      </td>

                      {/* Required Hours — editable inline */}
                      <td className="p-4 text-sm align-middle">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            value={editValues.required_hours}
                            onChange={(e) => setEditValues({ ...editValues, required_hours: e.target.value })}
                            className="w-full max-w-[120px] px-3 py-2 rounded-md border-[1.5px] border-[#0B1EAE] outline-none text-[13px] box-border bg-white text-slate-900 focus:ring-[3px] focus:ring-[#0B1EAE]/10"
                          />
                        ) : (
                          <div className="inline-flex items-center gap-1.5 font-mono text-[0.75rem] bg-indigo-50 text-[#0B1EAE] px-2.5 py-1 rounded-md font-bold border border-indigo-100">
                            {rule.required_hours} HRS
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 align-middle">
                        <div className="flex items-center justify-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(rule.id)}
                                title="Save changes"
                                className="bg-[#dcfce7] text-[#16a34a] border-none p-2 rounded-md cursor-pointer flex items-center justify-center transition-colors hover:bg-green-200"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                title="Cancel edit"
                                className="bg-slate-100 text-slate-500 border-none p-2 rounded-md cursor-pointer flex items-center justify-center transition-colors hover:bg-slate-200"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEdit(rule)}
                                title="Edit Rule"
                                className="bg-blue-50 text-blue-600 border-none p-2 rounded-md cursor-pointer flex items-center justify-center transition-colors hover:bg-blue-100"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(rule.id)}
                                title="Delete Rule"
                                className="bg-red-50 text-red-500 border-none p-2 rounded-md cursor-pointer flex items-center justify-center transition-colors hover:bg-red-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── ADD RULE MODAL (OVERLAY) ─── */}
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
              <h3 className="text-xl font-bold text-slate-900 m-0">Add New Requirement</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors bg-transparent border-none cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddRule} className="flex flex-col">
              <div className="p-6 flex flex-col gap-5">
                
                {/* School Selection */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-slate-700">School / University</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewSchool(!isAddingNewSchool);
                        setNewRule({ ...newRule, school_id: '', new_school_name: '' });
                      }}
                      className="bg-transparent border-none text-[#0B1EAE] text-[12px] font-bold cursor-pointer p-0 transition-colors hover:text-[#4F63F1]"
                    >
                      {isAddingNewSchool ? "Cancel (Select from list)" : "+ Add New School"}
                    </button>
                  </div>

                  {isAddingNewSchool ? (
                    <input
                      type="text"
                      placeholder="Type new school name..."
                      required
                      value={newRule.new_school_name}
                      onChange={(e) => setNewRule({ ...newRule, new_school_name: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none transition-all duration-200 focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10 bg-slate-50 focus:bg-white"
                    />
                  ) : (
                    <select
                      required
                      value={newRule.school_id}
                      onChange={(e) => setNewRule({ ...newRule, school_id: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none transition-all duration-200 focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10 bg-slate-50 focus:bg-white cursor-pointer"
                    >
                      <option value="" disabled>-- Choose a School --</option>
                      {schools.map(school => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Course Name */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Course Program</label>
                  <input
                    type="text"
                    placeholder="e.g., BS Information Technology"
                    required
                    value={newRule.course_name}
                    onChange={(e) => setNewRule({ ...newRule, course_name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none transition-all duration-200 focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10 bg-slate-50 focus:bg-white"
                  />
                </div>

                {/* Required Hours */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Required Hours</label>
                  <input
                    type="number"
                    placeholder="e.g., 486"
                    required
                    min="1"
                    value={newRule.required_hours}
                    onChange={(e) => setNewRule({ ...newRule, required_hours: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none transition-all duration-200 focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10 bg-slate-50 focus:bg-white"
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
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#0B1EAE] border border-transparent hover:bg-[#081682] transition-colors shadow-md shadow-blue-900/20 flex items-center justify-center min-w-[120px] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Save Rule'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
      
    </div>
  );
}