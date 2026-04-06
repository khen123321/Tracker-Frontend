import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import toast, { Toaster } from 'react-hot-toast'; // Named import for Toaster
import logo from '../../assets/logo.png';

// ── Icons ─────────────────────────────────────────────────────────────
const ChevronDown = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

// ── Shared Tailwind Classes ──────────────────────────────────────────
const inputCls = 'w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B1EAE] focus:border-transparent bg-white transition';
const selectCls = 'w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B1EAE] bg-white appearance-none cursor-pointer transition';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

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

const STEP_LABELS = ['Personal Information', 'School Details', 'Documents', 'Set Password'];

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

    const payload = {
      first_name: formData.first_name,
      middle_name: formData.middle_name,
      last_name: formData.last_name,
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
      emergency_contact_name: formData.emergency_name, 
      emergency_contact_phone: formData.emergency_phone,
      emergency_contact_address: formData.emergency_address,
      emergency_relationship: formData.emergency_relationship,
      course_program: formData.course,
      school_university: formData.school,
      assigned_branch: formData.branch,
      assigned_department: formData.department,
      date_started: formData.date_started,
      
      has_moa: formData.has_moa ? 1 : 0,
      has_endorsement: formData.has_endorsement ? 1 : 0,
      has_pledge: formData.has_pledge ? 1 : 0,
      has_nda: formData.has_nda ? 1 : 0,

      role: 'intern',
      status: 'active'
    };

    try {
      await axios.post('/auth/register', payload); 
      toast.success('Account created successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (err.response?.status === 422) {
         const firstError = Object.values(err.response.data.errors)[0][0];
         toast.error(firstError); 
      } else {
         toast.error(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Personal Information</p>
          <div>
            <label className={labelCls}>Last Name</label>
            <input type="text" name="last_name" placeholder="Last Name" className={inputCls} value={formData.last_name} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>First Name</label>
              <input type="text" name="first_name" placeholder="First Name" className={inputCls} value={formData.first_name} onChange={handleChange} />
            </div>
            <div>
              <label className={labelCls}>Middle Name</label>
              <input type="text" name="middle_name" placeholder="Middle Name" className={inputCls} value={formData.middle_name} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Email Address</label>
            <input type="email" name="email" placeholder="Email" className={inputCls} value={formData.email} onChange={handleChange} />
          </div>
          <div className="pt-1">
            <p className="text-sm font-semibold text-slate-700 mb-3">Emergency Contact</p>
            <div className="space-y-3">
              <input type="text" name="emergency_name" placeholder="Contact Name" className={inputCls} value={formData.emergency_name} onChange={handleChange} />
              <input type="text" name="emergency_phone" placeholder="Phone Number" className={inputCls} value={formData.emergency_phone} onChange={handleChange} />
              <input type="text" name="emergency_address" placeholder="Address" className={inputCls} value={formData.emergency_address} onChange={handleChange} />
              <SelectField label="Relationship" name="emergency_relationship" value={formData.emergency_relationship} onChange={handleChange}>
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
      case 2: return (
        <div className="space-y-4">
          <SelectField label="Course" name="course" value={formData.course} onChange={handleChange}>
            <option value="">Select Course</option>
            <option value="BSIT">BS Information Technology</option>
            <option value="BSCS">BS Computer Science</option>
          </SelectField>
          <SelectField label="School" name="school" value={formData.school} onChange={handleChange}>
            <option value="">Select School</option>
            <option value="USTP">USTP</option>
            <option value="XU">Xavier University</option>
          </SelectField>
          <SelectField label="Branch" name="branch" value={formData.branch} onChange={handleChange}>
            <option value="">Select Branch</option>
            <option value="Main">Main Branch</option>
          </SelectField>
          <SelectField label="Department" name="department" value={formData.department} onChange={handleChange}>
            <option value="">Select Department</option>
            <option value="IT">Information Technology</option>
            <option value="HR">Human Resources</option>
          </SelectField>
          <div>
            <label className={labelCls}>Date Started</label>
            <input type="date" name="date_started" className={inputCls} value={formData.date_started} onChange={handleChange} />
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700 mb-4">Documents</p>
          {['has_moa', 'has_endorsement', 'has_pledge', 'has_nda'].map((key) => (
            <label key={key} className="flex items-center gap-4 px-4 py-3.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" name={key} checked={formData[key]} onChange={handleChange} className="w-4 h-4 accent-[#0B1EAE]" />
              <span className="text-sm text-slate-700">{key.replace('has_', '').replace('_', ' ').toUpperCase()}</span>
            </label>
          ))}
        </div>
      );
      case 4: return (
        <div className="space-y-4">
          <input type="password" name="password" placeholder="Password" className={inputCls} value={formData.password} onChange={handleChange} />
          <input type="password" name="password_confirmation" placeholder="Confirm Password" className={inputCls} value={formData.password_confirmation} onChange={handleChange} />
          <div className="flex items-start gap-3">
            <input type="checkbox" id="terms" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#0B1EAE]" />
            <label htmlFor="terms" className="text-sm text-slate-600">I agree to the Terms and Conditions</label>
          </div>
        </div>
      );
      default: return null;
    }
  };

  const Stepper = () => (
    <div className="flex items-start mb-8">
      {STEP_LABELS.map((label, i) => {
        const s = i + 1;
        const isComplete = step > s;
        const isActive = step === s;
        return (
          <div key={s} className={`flex items-start ${i < STEP_LABELS.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-sm font-bold z-10 ${isComplete || isActive ? 'bg-[#0B1EAE] border-[#0B1EAE] text-white' : 'bg-white border-slate-300 text-slate-400'}`}>
                {isComplete ? <CheckIcon /> : s}
              </div>
              <span className={`text-[11px] mt-1.5 font-medium text-center ${isActive ? 'text-[#0B1EAE]' : 'text-slate-400'}`} style={{ maxWidth: '70px' }}>{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && <div className={`flex-1 h-[2px] mt-4 mx-1 ${step > s ? 'bg-[#0B1EAE]' : 'bg-slate-200'}`} />}
          </div>
        );
      })}
    </div>
  );

  const NavButtons = () => (
    <div className={`mt-7 flex gap-3 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
      {step > 1 && <button type="button" onClick={handleBack} className="flex items-center gap-2 px-7 py-2.5 bg-[#0B1EAE] text-white rounded-lg font-semibold text-sm">Back</button>}
      {step < 4 ? (
        <button type="button" onClick={handleNext} className="ml-auto flex items-center gap-2 px-7 py-2.5 bg-[#0B1EAE] text-white rounded-lg font-semibold text-sm">Continue</button>
      ) : (
        <button type="submit" disabled={loading || !agreedToTerms} className="px-7 py-2.5 bg-[#0B1EAE] text-white rounded-lg font-semibold text-sm disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex font-sans">
      <Toaster position="top-right" /> {/* Use the named export component directly */}
      
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-center items-center p-12 text-white relative overflow-hidden" style={{ background: 'linear-gradient(270deg, #0B1EAE 0%, #152286 23.56%, #0D1767 63.46%, #050C48 100%)' }}>
        <img src={logo} alt="Logo" className="w-44 mb-6 z-10" />
        <h1 className="text-2xl font-black text-center z-10">CLIMBS INTERNSHIP MONITORING SYSTEM</h1>
      </div>

      <div className="flex-1 flex flex-col relative overflow-y-auto">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1400&q=80')" }} />
        <div className="absolute inset-0 bg-white/65 backdrop-blur-[2px]" />
        
        <div className="relative z-10 text-center pt-10 pb-2">
          <h1 className="text-5xl font-black text-[#0B1EAE] tracking-tight">WELCOME</h1>
        </div>

        <div className="relative z-10 flex justify-center px-4 pb-10 pt-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
            <Stepper />
            <form onSubmit={step === 4 ? handleSubmit : (e) => e.preventDefault()}>
              {renderStep()}
              <NavButtons />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}