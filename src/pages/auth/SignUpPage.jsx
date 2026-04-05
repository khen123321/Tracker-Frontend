import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

// ── Chevron down icon ──────────────────────────────────────────────────
const ChevronDown = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// ── Check icon ─────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

// ── Shared classes ─────────────────────────────────────────────────────
const inputCls =
  'w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-700 ' +
  'placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B1EAE] ' +
  'focus:border-transparent bg-white transition';

const selectCls =
  'w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-700 ' +
  'focus:outline-none focus:ring-2 focus:ring-[#0B1EAE] bg-white appearance-none ' +
  'cursor-pointer transition';

const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

// ── Reusable Select wrapper with chevron ───────────────────────────────
const SelectField = ({ label, name, value, onChange, children }) => (
  <div>
    <label className={labelCls}>{label}</label>
    <div className="relative">
      <select name={name} value={value} onChange={onChange} className={selectCls}>
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <ChevronDown />
      </div>
    </div>
  </div>
);

// ── Step labels ────────────────────────────────────────────────────────
const STEP_LABELS = ['Personal Information', 'School Details', 'Documents', 'Set Password'];

// ══════════════════════════════════════════════════════════════════════
export default function SignUpPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',  middle_name: '',   last_name: '',         email: '',
    emergency_name: '', emergency_phone: '', emergency_address: '', emergency_relationship: '',
    course: '',      school: '',        branch: '',            department: '', date_started: '',
    has_moa: false,  has_endorsement: false, has_pledge: false, has_nda: false,
    password: '',    password_confirmation: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleNext = () => setStep(p => p + 1);
  const handleBack = () => setStep(p => p - 1);

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToTerms) { toast.error('Please agree to the Terms of Service.'); return; }
    
    setLoading(true);

    // ── MAPPING THE DATA TO MATCH THE DATABASE ──────────────────────────
    const payload = {
      first_name: formData.first_name,
      middle_name: formData.middle_name,
      last_name: formData.last_name,
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
      
      // These keys MUST match the names in your Laravel Migration precisely
      emergency_contact_name: formData.emergency_name, 
      emergency_contact_phone: formData.emergency_phone,
      emergency_contact_address: formData.emergency_address,
      emergency_relationship: formData.emergency_relationship,
      
      course_program: formData.course,
      school_university: formData.school,
      assigned_branch: formData.branch,
      assigned_department: formData.department,
      date_started: formData.date_started,
      
      has_moa: formData.has_moa,
      has_endorsement: formData.has_endorsement,
      has_pledge: formData.has_pledge,
      has_nda: formData.has_nda,

      role: 'intern', // Default role
      status: 'active' // Default status
    };

    try {
      // Send the 'payload' instead of 'formData'
      await axios.post('/auth/register', payload); 
    toast.success('Account created successfully!');
    navigate('/login');
    } catch (err) {
      console.error("Registration Error:", err.response?.data);
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Step content ─────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      /* ── STEP 1: Personal Information ── */
      case 1: return (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
            Personal Information
          </p>

          {/* Last Name */}
          <div>
            <label className={labelCls}>Last Name</label>
            <input type="text" name="last_name" placeholder="Last Name"
              className={inputCls} value={formData.last_name} onChange={handleChange} />
          </div>

          {/* First + Middle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>First Name</label>
              <input type="text" name="first_name" placeholder="First Name"
                className={inputCls} value={formData.first_name} onChange={handleChange} />
            </div>
            <div>
              <label className={labelCls}>Middle Name (Optional)</label>
              <input type="text" name="middle_name" placeholder="Middle Name"
                className={inputCls} value={formData.middle_name} onChange={handleChange} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={labelCls}>Email Address</label>
            <input type="email" name="email" placeholder="Enter Email"
              className={inputCls} value={formData.email} onChange={handleChange} />
          </div>

          {/* Emergency Contact divider */}
          <div className="pt-1">
            <p className="text-sm font-semibold text-slate-700 mb-3">Emergency Contact</p>

            <div className="space-y-3">
              <div>
                <label className={labelCls}>Name of Contact</label>
                <input type="text" name="emergency_name" placeholder="Full Name"
                  className={inputCls} value={formData.emergency_name} onChange={handleChange} />
              </div>

              <div>
                <label className={labelCls}>Phone Number</label>
                <input type="text" name="emergency_phone" placeholder="Enter Number"
                  className={inputCls} value={formData.emergency_phone} onChange={handleChange} />
              </div>

              <div>
                <label className={labelCls}>Address</label>
                <input type="text" name="emergency_address" placeholder="Enter Address"
                  className={inputCls} value={formData.emergency_address} onChange={handleChange} />
              </div>

              <SelectField label="Relationship to Contact" name="emergency_relationship"
                value={formData.emergency_relationship} onChange={handleChange}>
                <option value="">Choose</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Spouse">Spouse</option>
                <option value="Guardian">Guardian</option>
                <option value="Relative">Relative</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </SelectField>
            </div>
          </div>
        </div>
      );

      /* ── STEP 2: School Details ── */
      case 2: return (
        <div className="space-y-4">
          <SelectField label="Course/Program" name="course" value={formData.course} onChange={handleChange}>
            <option value="">Select Course</option>
            <option value="BSIT">BS Information Technology</option>
            <option value="BSCS">BS Computer Science</option>
            <option value="BSA">BS Accountancy</option>
            <option value="BSBA">BS Business Administration</option>
            <option value="BSN">BS Nursing</option>
            <option value="BSECE">BS Electronics Engineering</option>
            <option value="BSED">BS Education</option>
          </SelectField>

          <SelectField label="School/University" name="school" value={formData.school} onChange={handleChange}>
            <option value="">Select School</option>
            <option value="USTP">USTP – Cagayan de Oro</option>
            <option value="XU">Xavier University – Ateneo de Cagayan</option>
            <option value="CU">Capitol University</option>
            <option value="LC">Lourdes College</option>
            <option value="MSU-IIT">MSU-IIT</option>
          </SelectField>

          <SelectField label="Assigned Branch" name="branch" value={formData.branch} onChange={handleChange}>
            <option value="">Select Branch</option>
            <option value="Main">Main Branch</option>
            <option value="North">North Branch</option>
            <option value="South">South Branch</option>
            <option value="East">East Branch</option>
          </SelectField>

          <SelectField label="Assigned Department" name="department" value={formData.department} onChange={handleChange}>
            <option value="">Select Department</option>
            <option value="IT">Information Technology</option>
            <option value="HR">Human Resources</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
            <option value="Marketing">Marketing</option>
            <option value="Admin">Administration</option>
          </SelectField>

          <div>
            <label className={labelCls}>Date Started</label>
            <input type="date" name="date_started"
              className={inputCls} value={formData.date_started} onChange={handleChange} />
          </div>
        </div>
      );

      /* ── STEP 3: Documents ── */
      case 3: return (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700 mb-4">Documents and Credentials</p>

          {[
            { key: 'has_moa',         label: 'Memorandum of Agreement' },
            { key: 'has_endorsement', label: 'Endorsement Letter' },
            { key: 'has_pledge',      label: 'Pledge of Confidentiality' },
            { key: 'has_nda',         label: 'Non- Disclosure Agreement' },
          ].map((doc) => (
            <label key={doc.key}
              className="flex items-center gap-4 px-4 py-3.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                name={doc.key}
                checked={formData[doc.key]}
                onChange={handleChange}
                className="w-4 h-4 accent-[#0B1EAE] rounded cursor-pointer"
              />
              <span className="text-sm text-slate-700">{doc.label}</span>
            </label>
          ))}
        </div>
      );

      /* ── STEP 4: Set Password ── */
      case 4: return (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Set your Password</label>
            <input type="password" name="password" placeholder="Enter Password"
              className={inputCls} value={formData.password} onChange={handleChange} />
          </div>

          <div>
            <label className={labelCls}>Confirm Password</label>
            <input type="password" name="password_confirmation" placeholder="Re-enter Password"
              className={inputCls} value={formData.password_confirmation} onChange={handleChange} />
          </div>

          <div className="flex items-start gap-3 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#0B1EAE] cursor-pointer flex-shrink-0"
            />
            <label htmlFor="terms" className="text-sm text-slate-600 leading-snug cursor-pointer">
              I agree to the Terms of Service and Privacy Policy of CLIMBS Intern Tracker
            </label>
          </div>
        </div>
      );

      default: return null;
    }
  };

  // ── Stepper ──────────────────────────────────────────────────────────
  const Stepper = () => (
    <div className="flex items-start mb-8">
      {STEP_LABELS.map((label, i) => {
        const s = i + 1;
        const isComplete = step > s;
        const isActive   = step === s;
        return (
          <div key={s} className={`flex items-start ${i < STEP_LABELS.length - 1 ? 'flex-1' : ''}`}>
            {/* Circle + label */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 
                text-sm font-bold transition-all z-10
                ${isComplete || isActive
                  ? 'bg-[#0B1EAE] border-[#0B1EAE] text-white'
                  : 'bg-white border-slate-300 text-slate-400'}`}>
                {isComplete ? <CheckIcon /> : s}
              </div>
              <span className={`text-[11px] mt-1.5 font-medium text-center leading-tight
                ${isActive ? 'text-[#0B1EAE]' : 'text-slate-400'}`}
                style={{ maxWidth: '70px' }}>
                {label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEP_LABELS.length - 1 && (
              <div className={`flex-1 h-[2px] mt-4 mx-1
                ${step > s ? 'bg-[#0B1EAE]' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Navigation buttons ───────────────────────────────────────────────
  const NavButtons = () => (
    <div className={`mt-7 flex gap-3 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
      {step > 1 && (
        <button type="button" onClick={handleBack}
          className="flex items-center gap-2 px-7 py-2.5 bg-[#0B1EAE] text-white rounded-lg
            font-semibold text-sm hover:bg-[#0a1a9e] transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}

      {step < 4 ? (
        <button type="button" onClick={handleNext}
          className="ml-auto flex items-center gap-2 px-7 py-2.5 bg-[#0B1EAE] text-white
            rounded-lg font-semibold text-sm hover:bg-[#0a1a9e] transition-all">
          Continue
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ) : (
        <button type="submit" disabled={loading || !agreedToTerms}
          className="px-7 py-2.5 bg-[#0B1EAE] text-white rounded-lg font-semibold text-sm
            hover:bg-[#0a1a9e] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex font-sans">

      {/* ── LEFT SIDEBAR ── */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-center items-center p-12
          text-white relative overflow-hidden flex-shrink-0"
        style={{
          background: 'linear-gradient(270deg, #0B1EAE 0%, #152286 23.56%, #0D1767 63.46%, #050C48 100%)',
        }}
      >
        {/* Logo */}
        <img src={logo} alt="CLIMBS Logo" className="w-44 mb-6 z-10" />

        {/* Title */}
        <h1 className="text-2xl font-black text-center z-10 tracking-wide leading-snug">
          CLIMBS INTERNSHIP<br />MONITORING SYSTEM
        </h1>

        {/* Subtle cube texture overlay */}
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col relative overflow-y-auto">

        {/* Background photo */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1400&q=80')",
          }}
        />
        {/* White overlay */}
        <div className="absolute inset-0 bg-white/65 backdrop-blur-[2px]" />

        {/* WELCOME heading */}
        <div className="relative z-10 text-center pt-10 pb-2">
          <h1 className="text-5xl font-black text-[#0B1EAE] tracking-tight">WELCOME</h1>
          <p className="text-[#0B1EAE] text-base font-medium mt-1">
            Sign in to your CLIMBS admin account
          </p>
        </div>

        {/* FORM CARD */}
        <div className="relative z-10 flex justify-center px-4 pb-10 pt-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 p-8">

            {/* Card meta row */}
            <div className="flex justify-between items-center mb-5">
              <span className="text-sm text-slate-500">Create an Account</span>
              <span className="text-sm text-slate-500">Step {step} of 4</span>
            </div>

            {/* Stepper */}
            <Stepper />

            {/* Form body */}
            <form onSubmit={step === 4 ? handleSubmit : (e) => e.preventDefault()}>
              {renderStep()}
              <NavButtons />
            </form>

            {/* Login link */}
            <p className="text-center mt-5 text-slate-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-[#0B1EAE] font-bold hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}