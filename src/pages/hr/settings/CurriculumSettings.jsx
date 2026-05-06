import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Pencil, Check, X } from 'lucide-react';
import api from '../../../api/axios';
import toast, { Toaster } from 'react-hot-toast';

// ✨ ABBREVIATION HELPER FUNCTION ✨
const getSchoolAbbreviation = (schoolName) => {
  if (!schoolName) return '';

  const overrides = {
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
  const [requirements, setRequirements] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddingNewSchool, setIsAddingNewSchool] = useState(false);

  const [newRule, setNewRule] = useState({
    school_id: '',
    new_school_name: '',
    course_name: '',
    required_hours: ''
  });

  // ── Edit state ──
  // editingId: the rule.id currently being edited (null = none)
  // editValues: the live field values while editing
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({
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

  const handleAddRule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hr/settings/requirements', newRule);
      toast.success("Rule added successfully!");
      setNewRule({ school_id: '', new_school_name: '', course_name: '', required_hours: '' });
      setIsAddingNewSchool(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add rule.");
    }
  };

  const handleDelete = async (id) => {
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
  const handleStartEdit = (rule) => {
    setEditingId(rule.id);
    setEditValues({
      course_name: rule.course_name,
      required_hours: rule.required_hours
    });
  };

  // ── Cancel edit without saving ──
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({ course_name: '', required_hours: '' });
  };

  // ── Save edited rule ──
  const handleSaveEdit = async (id) => {
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
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update rule.");
    }
  };

  // ── Shared inline input style ──
  const inlineInput = {
    padding: '7px 10px',
    borderRadius: '6px',
    border: '1.5px solid #0B1EAE',
    outline: 'none',
    fontSize: '13px',
    width: '100%',
    boxSizing: 'border-box',
    background: '#eff6ff',
    color: '#0f172a',
    fontFamily: 'inherit'
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <Toaster position="top-right" />

      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>

        {/* ── ADD NEW RULE FORM ── */}
        <div style={{ flex: '1', minWidth: '300px', background: 'white', padding: '24px', borderRadius: '10px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
          <h3 style={{ marginTop: 0, color: '#0f172a' }}>Add New Requirement</h3>
          <form onSubmit={handleAddRule} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>School / University</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewSchool(!isAddingNewSchool);
                    setNewRule({ ...newRule, school_id: '', new_school_name: '' });
                  }}
                  style={{ background: 'none', border: 'none', color: '#0B1EAE', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: 0 }}
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
                  style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #0B1EAE', outline: 'none', background: '#eff6ff' }}
                />
              ) : (
                <select
                  required
                  value={newRule.school_id}
                  onChange={(e) => setNewRule({ ...newRule, school_id: e.target.value })}
                  style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', background: 'white' }}
                >
                  <option value="" disabled>-- Choose a School --</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Course Program</label>
              <input
                type="text"
                placeholder="e.g., BS Information Technology"
                required
                value={newRule.course_name}
                onChange={(e) => setNewRule({ ...newRule, course_name: e.target.value })}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Required Hours</label>
              <input
                type="number"
                placeholder="e.g., 486"
                required
                min="1"
                value={newRule.required_hours}
                onChange={(e) => setNewRule({ ...newRule, required_hours: e.target.value })}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>

            <button
              type="submit"
              style={{ background: '#0B1EAE', color: 'white', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Plus size={18} /> Save Rule
            </button>
          </form>
        </div>

        {/* ── EXISTING RULES TABLE ── */}
        <div style={{ flex: '2', minWidth: '400px', background: 'white', padding: '24px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, color: '#0f172a' }}>Active Curriculum Rules</h3>

          {loading ? <p style={{ color: '#64748b' }}>Loading curriculum data...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>School</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Course</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Required Hours</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', color: '#475569', fontWeight: '600', width: '100px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requirements.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: '32px 20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        No rules set yet. Add a requirement on the left.
                      </td>
                    </tr>
                  )}

                  {requirements.map(rule => {
                    const isEditing = editingId === rule.id;

                    return (
                      <tr
                        key={rule.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: isEditing ? '#f8faff' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
                        {/* School — never editable (abbreviation stays) */}
                        <td
                          style={{ padding: '14px 16px', fontSize: '14px', color: '#0f172a', fontWeight: '500' }}
                          title={rule.school ? rule.school.name : ''}
                        >
                          {rule.school
                            ? getSchoolAbbreviation(rule.school.name)
                            : `School ID: ${rule.school_id}`}
                        </td>

                        {/* Course — editable inline */}
                        <td style={{ padding: '10px 16px', fontSize: '14px', color: '#0f172a' }}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editValues.course_name}
                              onChange={(e) => setEditValues({ ...editValues, course_name: e.target.value })}
                              style={inlineInput}
                              autoFocus
                            />
                          ) : (
                            rule.course_name
                          )}
                        </td>

                        {/* Required Hours — editable inline */}
                        <td style={{ padding: '10px 16px', fontSize: '14px' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              value={editValues.required_hours}
                              onChange={(e) => setEditValues({ ...editValues, required_hours: e.target.value })}
                              style={{ ...inlineInput, maxWidth: '100px' }}
                            />
                          ) : (
                            <span style={{ fontWeight: '600', color: '#0B1EAE' }}>{rule.required_hours} hrs</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {isEditing ? (
                              <>
                                {/* Save */}
                                <button
                                  onClick={() => handleSaveEdit(rule.id)}
                                  title="Save changes"
                                  style={{ background: '#dcfce7', color: '#16a34a', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <Check size={16} />
                                </button>
                                {/* Cancel */}
                                <button
                                  onClick={handleCancelEdit}
                                  title="Cancel edit"
                                  style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                                  style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <Pencil size={16} />
                                </button>
                                {/* Delete */}
                                <button
                                  onClick={() => handleDelete(rule.id)}
                                  title="Delete Rule"
                                  style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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