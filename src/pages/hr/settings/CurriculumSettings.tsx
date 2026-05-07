import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Pencil, Check, X } from 'lucide-react';
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

export default function SettingsPage() {
  const [requirements, setRequirements] = useState<RequirementRule[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [isAddingNewSchool, setIsAddingNewSchool] = useState<boolean>(false);

  const [newRule, setNewRule] = useState<NewRuleState>({
    school_id: '',
    new_school_name: '',
    course_name: '',
    required_hours: ''
  });

  // ── Edit state ──
  // editingId: the rule.id currently being edited (null = none)
  // editValues: the live field values while editing
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
      toast.error("Failed to load settings data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/hr/settings/requirements', newRule);
      toast.success("Rule added successfully!");
      setNewRule({ school_id: '', new_school_name: '', course_name: '', required_hours: '' });
      setIsAddingNewSchool(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add rule.");
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

  // ── Start editing: seed editValues from the rule ──
  const handleStartEdit = (rule: RequirementRule) => {
    setEditingId(rule.id);
    setEditValues({
      course_name: rule.course_name,
      required_hours: String(rule.required_hours)
    });
  };

  // ── Cancel edit without saving ──
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
    <div className="font-sans text-slate-900">
      <Toaster position="top-right" />

      {/* ✨ STRICT 5PX GAP & RESPONSIVE GRID ✨ */}
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-[5px] items-start">

        {/* ── ADD NEW RULE FORM ── */}
        <div className="bg-white p-6 rounded-[10px] border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] h-fit">
          <h3 className="mt-0 mb-4 text-slate-900 text-[18px] font-bold">Add New Requirement</h3>
          <form onSubmit={handleAddRule} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[13px] font-semibold text-slate-600">School / University</label>
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
                  className="w-full px-3 py-2.5 rounded-md border outline-none text-sm transition-all box-border bg-blue-50 text-slate-900 border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10"
                />
              ) : (
                <select
                  required
                  value={newRule.school_id}
                  onChange={(e) => setNewRule({ ...newRule, school_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-md border border-slate-300 outline-none bg-white text-sm text-slate-900 transition-all box-border focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10"
                >
                  <option value="" disabled>-- Choose a School --</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-600">Course Program</label>
              <input
                type="text"
                placeholder="e.g., BS Information Technology"
                required
                value={newRule.course_name}
                onChange={(e) => setNewRule({ ...newRule, course_name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-md border border-slate-300 outline-none bg-white text-sm text-slate-900 transition-all box-border focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-600">Required Hours</label>
              <input
                type="number"
                placeholder="e.g., 486"
                required
                min="1"
                value={newRule.required_hours}
                onChange={(e) => setNewRule({ ...newRule, required_hours: e.target.value })}
                className="w-full px-3 py-2.5 rounded-md border border-slate-300 outline-none bg-white text-sm text-slate-900 transition-all box-border focus:border-[#0B1EAE] focus:ring-[3px] focus:ring-[#0B1EAE]/10"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-[#0B1EAE] text-white p-3 border-none rounded-md font-semibold cursor-pointer flex items-center justify-center gap-2 transition-transform hover:bg-[#091891] hover:-translate-y-[1px]"
            >
              <Plus size={18} /> Save Rule
            </button>
          </form>
        </div>

        {/* ── EXISTING RULES TABLE ── */}
        <div className="bg-white p-6 rounded-[10px] border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h3 className="mt-0 mb-4 text-slate-900 text-[18px] font-bold">Active Curriculum Rules</h3>

          {loading ? (
            <p className="text-slate-500 text-sm">Loading curriculum data...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse mt-4 text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-3 px-4 text-xs text-slate-600 font-bold uppercase tracking-wider whitespace-nowrap">School</th>
                    <th className="py-3 px-4 text-xs text-slate-600 font-bold uppercase tracking-wider whitespace-nowrap">Course</th>
                    <th className="py-3 px-4 text-xs text-slate-600 font-bold uppercase tracking-wider whitespace-nowrap">Required Hours</th>
                    <th className="py-3 px-4 text-xs text-slate-600 font-bold uppercase tracking-wider text-center w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requirements.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 px-5 text-center text-slate-400 text-sm italic">
                        No rules set yet. Add a requirement on the left.
                      </td>
                    </tr>
                  )}

                  {requirements.map(rule => {
                    const isEditing = editingId === rule.id;

                    return (
                      <tr
                        key={rule.id}
                        className={`border-b border-slate-100 transition-colors ${isEditing ? 'bg-[#f8faff]' : 'hover:bg-slate-50'}`}
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
                              className="w-full px-2.5 py-[7px] rounded-md border-[1.5px] border-[#0B1EAE] outline-none text-[13px] box-border bg-blue-50 text-slate-900 font-inherit focus:ring-[3px] focus:ring-[#0B1EAE]/10"
                              autoFocus
                            />
                          ) : (
                            rule.course_name
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
                              className="w-full max-w-[100px] px-2.5 py-[7px] rounded-md border-[1.5px] border-[#0B1EAE] outline-none text-[13px] box-border bg-blue-50 text-slate-900 font-inherit focus:ring-[3px] focus:ring-[#0B1EAE]/10"
                            />
                          ) : (
                            <span className="font-bold text-[#0B1EAE]">{rule.required_hours} hrs</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 align-middle">
                          <div className="flex items-center justify-center gap-2">
                            {isEditing ? (
                              <>
                                {/* Save */}
                                <button
                                  onClick={() => handleSaveEdit(rule.id)}
                                  title="Save changes"
                                  className="bg-[#dcfce7] text-[#16a34a] border-none p-2 rounded-md cursor-pointer flex items-center justify-center transition-colors hover:bg-green-200"
                                >
                                  <Check size={16} />
                                </button>
                                {/* Cancel */}
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
                                {/* Edit */}
                                <button
                                  onClick={() => handleStartEdit(rule)}
                                  title="Edit Rule"
                                  className="bg-blue-50 text-blue-600 border-none p-2 rounded-md cursor-pointer flex items-center justify-center transition-colors hover:bg-blue-100"
                                >
                                  <Pencil size={16} />
                                </button>
                                {/* Delete */}
                                <button
                                  onClick={() => handleDelete(rule.id)}
                                  title="Delete Rule"
                                  className="bg-red-100 text-red-500 border border-red-200 p-2 rounded-md cursor-pointer flex items-center justify-center transition-all hover:bg-red-400 hover:text-white hover:border-red-400"
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

      </div>
    </div>
  );
}