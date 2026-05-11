import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import toast, { Toaster } from 'react-hot-toast';
import { Mail, X, Eye, EyeOff } from 'lucide-react'; 
import logo from '../../assets/logo.png';
import bgImage from '../../assets/Bg_image.jpg';

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

// ── Types & Components ────────────────────────────────────────────────
interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, name, value, onChange, disabled, required = true, children }) => (
  <div className="mb-2">
    {label && (
      <label className="block text-[0.8rem] font-semibold text-slate-900 mb-1.5">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
    )}
    <div className="relative">
      <select 
        name={name} 
        value={value} 
        onChange={onChange} 
        disabled={disabled} 
        className="w-full py-3 pl-4 pr-9 border border-slate-200 rounded-lg text-sm text-slate-900 bg-slate-50 outline-none transition-all duration-200 appearance-none cursor-pointer focus:border-[#0B1EAE] focus:bg-white focus:ring-[3px] focus:ring-[#0B1EAE]/10 disabled:opacity-60 disabled:cursor-not-allowed box-border"
      >
        {children}
      </select>
      <div className="absolute top-0 bottom-0 right-3 flex items-center pointer-events-none">
        <ChevronDown />
      </div>
    </div>
  </div>
);

const STEP_LABELS = ['Personal Info', 'School Details', 'Documents', 'Security'];

const inputClasses = "w-full py-3 px-4 border border-slate-200 rounded-lg text-sm text-slate-900 bg-slate-50 outline-none transition-all duration-200 placeholder-slate-400 focus:border-[#0B1EAE] focus:bg-white focus:ring-[3px] focus:ring-[#0B1EAE]/10 box-border [&::-ms-reveal]:hidden [&::-webkit-contacts-auto-fill-button]:hidden";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Terms & Conditions State
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false); 
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const termsBodyRef = useRef<HTMLDivElement>(null);
  
  const [isRegistered, setIsRegistered] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [schoolsList, setSchoolsList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  const [areaData, setAreaData] = useState<any[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  const [formData, setFormData] = useState({
    first_name: '', middle_name: '', last_name: '', email: '',
    province: '', municipality: '', barangay: '',
    emergency_name: '', emergency_phone: '', emergency_address: '', emergency_relationship: '',
    course: '', school_id: '', branch_id: '', department_id: '', date_started: '',
    has_moa: false, has_endorsement: false, has_acceptance: false, has_contract: false, has_pledge: false, has_nda: false,
    password: '', password_confirmation: '',
  });

  useEffect(() => {
    setIsPageLoaded(true);

    const fetchSchoolData = async () => {
      try {
        const [schoolsRes, branchesRes, deptsRes] = await Promise.all([
          axios.get('/public/schools'),
          axios.get('/public/branches'),
          axios.get('/public/departments')
        ]);
        setSchoolsList(schoolsRes.data);
        setBranchesList(branchesRes.data);
        setDepartmentsList(deptsRes.data);
      } catch {
        toast.error("Failed to load school options.");
      } finally {
        setLoadingDropdowns(false);
      }
    };

    const fetchAreaData = async () => {
      try {
        const response = await fetch('/api/area-registration')
        const data = await response.json();
        setAreaData(data); 
      } catch (err) {
        console.error("Address fetch error:", err);
        toast.error("Failed to load address options.");
      } finally {
        setLoadingAreas(false);
      }
    };

    fetchSchoolData();
    fetchAreaData();
  }, []);

  // Auto-detect if terms are too short to scroll
  useEffect(() => {
    if (isTermsModalOpen && termsBodyRef.current) {
      const { scrollHeight, clientHeight } = termsBodyRef.current;
      if (scrollHeight <= clientHeight) {
        setHasScrolledToBottom(true);
      } else {
        setHasScrolledToBottom(false);
      }
    }
  }, [isTermsModalOpen]);

  // Scroll Event Handler for Terms Modal
  const handleTermsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 5; // 5px buffer
    if (bottom) {
      setHasScrolledToBottom(true);
    }
  };

  const selectedProvinceObj = areaData.find((p: any) => p.name === formData.province);
  const municipalitiesList = selectedProvinceObj ? selectedProvinceObj.municipalities : [];

  const selectedMunicipalityObj = municipalitiesList.find((m: any) => m.name === formData.municipality);
  const barangaysList = selectedMunicipalityObj ? selectedMunicipalityObj.barangays : [];

  const handleSchoolChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSchoolId = e.target.value;
    setFormData(prev => ({ ...prev, school_id: selectedSchoolId, course: '' }));
    try {
      const res = await axios.get(`/public/courses/${selectedSchoolId}`);
      setCoursesList(res.data);
    } catch {
      setCoursesList([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, province: e.target.value, municipality: '', barangay: '' }));
  };
  const handleMunicipalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, municipality: e.target.value, barangay: '' }));
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      const requiredFields = ['last_name', 'first_name', 'email', 'province', 'municipality', 'barangay', 'emergency_name', 'emergency_phone', 'emergency_address', 'emergency_relationship'] as const;
      const missing = requiredFields.filter(f => !formData[f] || String(formData[f]).trim() === '');
      
      if (missing.length > 0) {
        toast.error('Please fill in all required fields.');
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error('Please enter a valid email address.');
        return false;
      }
    }

    if (currentStep === 2) {
      const requiredFields = ['school_id', 'course', 'branch_id', 'department_id', 'date_started'] as const;
      const missing = requiredFields.filter(f => !formData[f]);
      
      if (missing.length > 0) {
        toast.error('Please fill in all required fields.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(p => p + 1);
    }
  };

  const handleBack = () => setStep(p => p - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password || !formData.password_confirmation) {
      toast.error('Please enter and confirm your password.');
      return;
    }
    if (formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (!agreedToTerms) { 
      toast.error('Please agree to the Terms of Service.'); 
      return; 
    }
    
    setLoading(true);

    const payload = {
      first_name: formData.first_name,
      middle_name: formData.middle_name,
      last_name: formData.last_name,
      email: formData.email,
      province: formData.province,
      municipality: formData.municipality,
      barangay: formData.barangay,
      emergency_name: formData.emergency_name, 
      emergency_number: formData.emergency_phone, 
      emergency_address: formData.emergency_address,
      emergency_relationship: formData.emergency_relationship,
      course_program: formData.course,
      course: formData.course,
      school_id: formData.school_id,
      branch_id: formData.branch_id,
      department_id: formData.department_id,
      school_university: formData.school_id,
      assigned_branch: formData.branch_id,
      assigned_department: formData.department_id,
      date_started: formData.date_started,
      has_moa: formData.has_moa ? 1 : 0,
      has_endorsement: formData.has_endorsement ? 1 : 0,
      has_acceptance: formData.has_acceptance ? 1 : 0, 
      has_contract: formData.has_contract ? 1 : 0,     
      has_pledge: formData.has_pledge ? 1 : 0,
      has_nda: formData.has_nda ? 1 : 0,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
      role: 'intern',
      status: 'active'
    };

    try {
      const res = await axios.post('/auth/register', payload); 
      if (res.data.requires_verification) {
        setIsRegistered(true); 
      } else {
        toast.success('Account created successfully!');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err: any) {
      if (err.response?.status === 422) {
         const firstError = Object.values(err.response.data.errors)[0] as string[];
         toast.error(firstError[0]); 
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
          <p className="text-[0.75rem] font-bold uppercase tracking-widest text-slate-500 mb-2">Personal Information</p>
          <div className="mb-2">
            <label className="block text-[0.8rem] font-semibold text-slate-900 mb-1.5">Last Name <span className="text-red-600">*</span></label>
            <input type="text" name="last_name" placeholder="Last Name" className={inputClasses} value={formData.last_name} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="mb-2">
              <label className="block text-[0.8rem] font-semibold text-slate-900 mb-1.5">First Name <span className="text-red-600">*</span></label>
              <input type="text" name="first_name" placeholder="First Name" className={inputClasses} value={formData.first_name} onChange={handleChange} />
            </div>
            <div className="mb-2">
              <label className="block text-[0.8rem] font-semibold text-slate-900 mb-1.5">Middle Name</label>
              <input type="text" name="middle_name" placeholder="Middle Name" className={inputClasses} value={formData.middle_name} onChange={handleChange} />
            </div>
          </div>
          <div className="mb-2">
            <label className="block text-[0.8rem] font-semibold text-slate-900 mb-1.5">Email Address <span className="text-red-600">*</span></label>
            <input type="email" name="email" placeholder="Email" className={inputClasses} value={formData.email} onChange={handleChange} />
          </div>

          <div className="h-px bg-slate-200 my-6" />

          <p className="text-[0.75rem] font-bold uppercase tracking-widest text-slate-500 mb-2">Home Address</p>
          <div className="grid grid-cols-2 gap-3">
              <SelectField label="Province" name="province" value={formData.province} onChange={handleProvinceChange} disabled={loadingAreas}>
                  <option value="">{loadingAreas ? "Loading..." : "Select Province"}</option>
                  {areaData.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </SelectField>

              <SelectField label="City/Municipality" name="municipality" value={formData.municipality} onChange={handleMunicipalityChange} disabled={!formData.province}>
                  <option value="">Select City</option>
                  {municipalitiesList.map((m: any) => <option key={m.id} value={m.name}>{m.name}</option>)}
              </SelectField>
          </div>
          <div className="mb-2">
              <SelectField label="Barangay" name="barangay" value={formData.barangay} onChange={handleChange} disabled={!formData.municipality}>
                  <option value="">Select Barangay</option>
                  {barangaysList.map((b: any) => <option key={b.id} value={b.name}>{b.name}</option>)}
              </SelectField>
          </div>

          <div className="h-px bg-slate-200 my-6" />

          <div className="pt-1">
            <p className="text-[0.75rem] font-bold uppercase tracking-widest text-slate-500 mb-2">Emergency Contact</p>
            <div className="space-y-3">
              <input type="text" name="emergency_name" placeholder="Contact Name *" className={inputClasses} value={formData.emergency_name} onChange={handleChange} />
              <input type="text" name="emergency_phone" placeholder="Phone Number *" className={inputClasses} value={formData.emergency_phone} onChange={handleChange} />
              <input type="text" name="emergency_address" placeholder="Address *" className={inputClasses} value={formData.emergency_address} onChange={handleChange} />
              <SelectField label="" name="emergency_relationship" value={formData.emergency_relationship} onChange={handleChange}>
                <option value="">Relationship... *</option>
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
          <SelectField label="School / University" name="school_id" value={formData.school_id} onChange={handleSchoolChange} disabled={loadingDropdowns}>
            <option value="" disabled>{loadingDropdowns ? "Loading schools..." : "-- Select School --"}</option>
            {schoolsList.map(school => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </SelectField>

          <SelectField label="Course / Program" name="course" value={formData.course} onChange={handleChange} disabled={!formData.school_id || coursesList.length === 0}>
            <option value="" disabled>{!formData.school_id ? "Select a school first" : coursesList.length === 0 ? "No courses found" : "-- Select Course --"}</option>
            {coursesList.map((c, index) => (
              <option key={index} value={c.course_name}>{c.course_name}</option>
            ))}
          </SelectField>

          <SelectField label="Assigned Branch" name="branch_id" value={formData.branch_id} onChange={handleChange} disabled={loadingDropdowns}>
            <option value="">{loadingDropdowns ? "Loading branches..." : "Select Branch"}</option>
            {branchesList.map(branch => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </SelectField>

          <SelectField label="Department" name="department_id" value={formData.department_id} onChange={handleChange} disabled={loadingDropdowns}>
            <option value="">{loadingDropdowns ? "Loading departments..." : "Select Department"}</option>
            {departmentsList.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </SelectField>

          <div className="mb-2">
            <label className="block text-[0.8rem] font-semibold text-slate-900 mb-1.5">Date Started <span className="text-red-600">*</span></label>
            <input type="date" name="date_started" className={inputClasses} value={formData.date_started} onChange={handleChange} />
          </div>
        </div>
      );
      
      case 3: {
        const documentsList = [
          { key: 'has_moa', label: 'Memorandum of Agreement' },
          { key: 'has_endorsement', label: 'Endorsement Letter' },
          { key: 'has_acceptance', label: 'Acceptance Letter' },
          { key: 'has_contract', label: 'Internship Contract and Plan' },
          { key: 'has_pledge', label: 'Pledge of Confidentiality' },
          { key: 'has_nda', label: 'Non-Disclosure Agreement' },
        ];

        return (
          <div className="space-y-3">
            <p className="uppercase text-[0.8rem] font-semibold text-slate-800 mb-2">
              Documents and Credentials
            </p>
            <p className="text-[0.85rem] text-slate-500 -mt-1 mb-4 leading-relaxed">
              Kindly ensure you have the necessary documents ready to upload to your profile after your account has been successfully created.
            </p>
            
            <div className="flex flex-col gap-2.5">
              {documentsList.map((doc) => (
                <label 
                  key={doc.key} 
                  className="flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-lg cursor-pointer bg-white transition-all duration-200 hover:bg-slate-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  <input 
                    type="checkbox" 
                    name={doc.key} 
                    checked={formData[doc.key as keyof typeof formData] as boolean} 
                    onChange={handleChange} 
                    className="w-4 h-4 cursor-pointer accent-[#0B1EAE]" 
                  />
                  <span className="text-[0.9rem] color-slate-800 font-medium">
                    {doc.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      } 
      
      case 4: return (
        <div className="space-y-4">
          <div className="mb-2">
             <label className="block text-[0.8rem] font-semibold text-slate-900 mb-1.5">Password <span className="text-red-600">*</span></label>
             <div className="relative">
               <input 
                 type={showPassword ? "text" : "password"} 
                 name="password" 
                 placeholder="Create Password" 
                 className={`${inputClasses} pr-10`} 
                 value={formData.password} 
                 onChange={handleChange} 
               />
               <button 
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate-400 flex items-center justify-center p-0"
               >
                 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
               </button>
             </div>
          </div>
          <div className="mb-2">
             <label className="block text-[0.8rem] font-semibold text-slate-900 mb-1.5">Confirm Password <span className="text-red-600">*</span></label>
             <div className="relative">
               <input 
                 type={showConfirmPassword ? "text" : "password"} 
                 name="password_confirmation" 
                 placeholder="Confirm Password" 
                 className={`${inputClasses} pr-10`} 
                 value={formData.password_confirmation} 
                 onChange={handleChange} 
               />
               <button 
                 type="button"
                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                 className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate-400 flex items-center justify-center p-0"
               >
                 {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
               </button>
             </div>
          </div>
          
          <div className="flex items-start gap-3 mt-4">
            <label htmlFor="terms" className="flex items-center gap-2 text-[0.875rem] text-slate-700 font-semibold cursor-pointer">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={agreedToTerms} 
                  onChange={() => {}} 
                  onClick={(e) => {
                    e.preventDefault(); 
                    if (!agreedToTerms) {
                      setIsTermsModalOpen(true); 
                    } else {
                      setAgreedToTerms(false); 
                    }
                  }} 
                  className="w-[1.1rem] h-[1.1rem] accent-[#0B1EAE] cursor-pointer" 
                />
                <span>
                    I agree to the <button type="button" onClick={(e) => { e.preventDefault(); setIsTermsModalOpen(true); }} className="bg-transparent border-none text-[#0B1EAE] font-bold text-[0.875rem] cursor-pointer p-0 no-underline hover:underline transition-all">Terms and Conditions</button> <span className="text-red-600">*</span>
                </span>
            </label>
          </div>
        </div>
      );
      default: return null;
    }
  };

  const Stepper = () => (
    <div className="flex items-start mb-0">
      {STEP_LABELS.map((label, i) => {
        const s = i + 1;
        const isComplete = step > s;
        const isActive = step === s;
        return (
          <div key={s} className={`flex items-start ${i < STEP_LABELS.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex flex-col items-center">
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-sm font-bold z-10 transition-all duration-400 ease-in-out ${
                  isComplete || isActive 
                    ? `bg-[#0B1EAE] border-[#0B1EAE] text-white ${isActive ? 'scale-105 delay-[850ms]' : ''}` 
                    : 'bg-white border-slate-300 text-slate-400 delay-0'
                }`}
              >
                {isComplete ? <CheckIcon /> : s}
              </div>
              <span className={`text-[0.65rem] mt-1.5 font-medium text-center max-w-[68px] leading-tight transition-colors duration-400 ease-in-out ${isActive ? 'text-[#0B1EAE] delay-[850ms]' : 'text-slate-400 delay-0'}`}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div 
                className="flex-1 h-1 mt-[1.05rem] mx-1.5 bg-slate-200 relative overflow-hidden rounded"
              >
                <div 
                  className={`absolute top-0 left-0 h-full bg-gradient-to-r from-[#0B1EAE] to-[#4F63F1] rounded transition-[width] ease-in-out ${
                    step > s ? 'w-full duration-[850ms] delay-0' : 'w-0 duration-[850ms] delay-[400ms]'
                  }`} 
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const NavButtons = () => (
    <div className="mt-0">
      <div className={`flex gap-3 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
        {step > 1 && (
          <button type="button" onClick={handleBack} className="bg-transparent text-slate-600 border-[1.5px] border-slate-300 py-2.5 px-8 rounded-full font-semibold text-sm cursor-pointer transition-all duration-200 hover:border-[#0B1EAE] hover:text-[#0B1EAE] hover:bg-[#0B1EAE]/5">Back</button>
        )}
        {step < 4 ? (
          <button type="button" onClick={handleNext} className="bg-[#0B1EAE] text-white border-none py-2.5 px-10 rounded-full font-bold text-sm cursor-pointer transition-all duration-200 tracking-wide hover:bg-[#050C48] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed ml-auto">Continue</button>
        ) : (
          <button type="submit" disabled={loading} className="bg-[#0B1EAE] text-white border-none py-2.5 px-10 rounded-full font-bold text-sm cursor-pointer transition-all duration-200 tracking-wide hover:bg-[#050C48] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        )}
      </div>

      {step === 1 && (
        <div className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="bg-transparent border-none text-[#0B1EAE] font-bold text-sm cursor-pointer p-0 no-underline transition-all hover:underline">Login here</Link>
        </div>
      )}
    </div>
  );

  return (
    <div className={`flex min-h-screen w-full font-sans overflow-x-hidden opacity-0 transition-opacity duration-400 ease-in-out flex-col min-[900px]:flex-row ${isPageLoaded ? 'opacity-100' : ''}`}>
      {/* Required for custom animations not built into standard Tailwind */}
      <style>{`
        @keyframes slideFadeIn {
          from { opacity: 0; transform: translateX(15px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes modalPopIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}</style>
      
      <Toaster position="top-right" />
      
      {/* ─── LEFT PANE ─── */}
      <div className="flex-none min-[900px]:flex-1 bg-gradient-to-l from-[#0B1EAE] via-[#152286] to-[#050C48] py-6 px-4 min-[900px]:py-10 min-[900px]:px-8 flex flex-col items-center justify-start relative">
          <div className="flex flex-row items-center justify-center gap-3 w-full mb-0.5">
              <img src={logo} alt="CLIMBS Logo" className="w-auto h-[50px] min-[380px]:h-[70px]" />
          </div>

          <p className="text-white text-xl min-[900px]:text-[1.45rem] font-bold tracking-wide text-center mt-2.5 mb-0 min-[900px]:mb-6">CLIMBS Internship Monitoring System</p>
          <h2 className="hidden min-[900px]:block text-[#FFD700] text-2xl font-bold italic m-0 mb-3 text-center tracking-wide">Hello, I'm an Intern!</h2>

          <video 
              src="/intern mordie.webm" 
              autoPlay 
              loop 
              muted 
              playsInline
              className="hidden min-[900px]:block h-[340px] w-auto object-contain flex-1 drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]" 
          />

          <p className="hidden min-[900px]:block text-white/85 text-sm font-normal text-center leading-relaxed mt-auto pt-3 pb-2">
              Track your hours, submit forms, and<br />monitor your progress
          </p>
      </div>

      {/* ─── RIGHT PANE ─── */}
      <div 
        className="flex-1 relative bg-cover bg-center flex items-center justify-center overflow-visible min-[900px]:overflow-hidden p-0"
        style={{ backgroundImage: `url(${bgImage})` }} 
      >
          <div className="absolute inset-0 bg-white/45 backdrop-blur-[1px] z-0" />
          
          <div className="relative z-10 flex flex-col items-center py-8 px-4 w-full max-w-[560px]">
              
              {isRegistered ? (
                <div className="bg-white/95 py-8 px-6 min-[900px]:py-12 min-[900px]:px-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] w-full max-w-[480px] text-center animate-[slideFadeIn_0.4s_ease-out]">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mb-6">
                    <Mail size={40} color="#3B82F6" />
                  </div>
                  <h1 className="text-[1.8rem] min-[900px]:text-[2.25rem] font-black text-slate-900 m-0 mb-2.5">Check Your Email</h1>
                  <p className="text-[15px] leading-relaxed mb-6 text-slate-600">
                    We've sent a verification link to <strong>{formData.email}</strong>. <br />
                    Please click the link in that email to activate your account.
                  </p>
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg mb-8">
                    <p className="m-0 text-[13px] text-amber-700 font-medium">
                      Don't see the email? Be sure to check your spam or junk folder.
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="w-full bg-[#0B1EAE] text-white border-none py-3 px-10 rounded-full font-bold text-[15px] cursor-pointer transition-all hover:bg-[#050C48]" 
                  >
                    Return to Login
                  </button>
                </div>

              ) : (

                <>
                  {/* ✨ MOVED "CREATE ACCOUNT" TEXT HERE ✨ */}
                  <form 
                    className="bg-white/95 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] w-full max-w-[500px] flex flex-col max-h-[85vh] min-[900px]:max-h-[80vh] overflow-hidden p-0" 
                    onSubmit={step === 4 ? handleSubmit : (e) => e.preventDefault()}
                  >
                    {/* Header inside the form container */}
                    <div className="pt-8 pb-2 px-9 text-center bg-white/95 shrink-0 z-10">
                        <h1 className="text-[2.2rem] min-[900px]:text-[2.5rem] font-black text-[#0B1EAE] m-0 tracking-wide drop-shadow-sm">
                            CREATE ACCOUNT
                        </h1>
                        <p className="text-slate-600 text-[0.95rem] font-medium mt-1 mb-0">
                            Sign up to join the CLIMBS Intern program
                        </p>
                    </div>
                    
                    {/* Stepper */}
                    <div className="px-9 pb-4 bg-white/95 shrink-0 border-b border-slate-200/60 z-10">
                      {Stepper()}
                    </div>

                    {/* Form Inputs (Scrollable) */}
                    <div 
                      className="p-6 min-[900px]:px-9 min-[900px]:py-6 flex-1 overflow-y-auto custom-scrollbar animate-[slideFadeIn_0.3s_ease-out_forwards]" 
                      key={`step-anim-${step}`}
                    >
                      {renderStep()}
                    </div>
                    
                    {/* Nav Buttons (Fixed Bottom) */}
                    <div className="p-6 min-[900px]:py-4 min-[900px]:px-9 min-[900px]:pb-6 bg-white border-t border-slate-200/80 shrink-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                      {NavButtons()}
                    </div>

                  </form>
                </>

              )}

          </div>
      </div>

      {/* ✨ TERMS AND CONDITIONS MODAL ✨ */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setIsTermsModalOpen(false)}>
          <div className="bg-white w-full max-w-[550px] rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] flex flex-col max-h-[85vh] animate-[modalPopIn_0.3s_cubic-bezier(0.16,1,0.3,1)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start pt-6 px-6 pb-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 m-0 mb-1">Terms and Conditions</h2>
                <p className="text-[0.85rem] text-slate-500 m-0">For Interns | CLIMBS Life and General Insurance Cooperative</p>
              </div>
              <button className="bg-transparent border-none text-slate-400 cursor-pointer p-1 rounded transition-all hover:bg-slate-200 hover:text-slate-900" onClick={() => setIsTermsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div 
              className="p-6 overflow-y-auto text-slate-700 text-[0.9rem] leading-relaxed custom-scrollbar" 
              onScroll={handleTermsScroll} 
              ref={termsBodyRef}
            >
              <p className="m-0 mb-4">By creating an account, you agree to the following:</p>

              <h4 className="text-[0.95rem] font-bold text-[#0B1EAE] mt-0 mb-2">1. DATA COLLECTION & PRIVACY</h4>
              <p className="m-0 mb-4">CLIMBS InternTracker collects your personal information (name, email, school, course), GPS coordinates, selfie photos, and attendance records for the sole purpose of OJT monitoring. This is in compliance with Republic Act 10173 (Data Privacy Act of 2012). Your data will not be shared with third parties.</p>

              <h4 className="text-[0.95rem] font-bold text-[#0B1EAE] mt-6 mb-2">2. ATTENDANCE MONITORING</h4>
              <p className="m-0 mb-4">You consent to having your location verified and selfie captured during every clock-in and clock-out action. HR staff may review your selfies to verify attendance authenticity. Suspicious or fraudulent entries may result in hour deductions or your attendance being marked Absent.</p>

              <h4 className="text-[0.95rem] font-bold text-[#0B1EAE] mt-6 mb-2">3. PHOTO RETENTION</h4>
              <p className="m-0 mb-4">Selfie photos are automatically deleted after 5 working days. Profile photos are retained for the duration of your internship and used for ID card generation only.</p>

              <h4 className="text-[0.95rem] font-bold text-[#0B1EAE] mt-6 mb-2">4. ACCEPTABLE USE</h4>
              <p className="m-0 mb-4">You agree NOT to use VPNs or GPS spoofing tools, submit intentionally unclear selfies, or allow others to clock in on your behalf. Violations may result in account deactivation and reporting to your school coordinator.</p>

              <h4 className="text-[0.95rem] font-bold text-[#0B1EAE] mt-6 mb-2">5. SYSTEM RECORDS</h4>
              <p className="m-0 mb-4">Your Daily Time Record (DTR) and Certificate of Completion are generated from your recorded data. Disputes must be filed through the official appeal process within the system.</p>

              <p className="m-0 mt-6 italic text-slate-500">For questions, contact HR at your assigned CLIMBS branch.</p>
            </div>
            
            <div className="py-4 px-6 border-t border-slate-200 flex justify-end gap-3 bg-white">
              <button 
                type="button" 
                onClick={() => setIsTermsModalOpen(false)} 
                className="bg-transparent text-slate-600 border-[1.5px] border-slate-300 py-2 px-6 rounded-full font-semibold text-sm cursor-pointer transition-all duration-200 hover:border-[#0B1EAE] hover:text-[#0B1EAE] hover:bg-[#0B1EAE]/5"
              >
                Close
              </button>
              <button 
                type="button" 
                onClick={() => { 
                  setAgreedToTerms(true); 
                  setIsTermsModalOpen(false); 
                }} 
                disabled={!hasScrolledToBottom}
                className={`bg-[#0B1EAE] text-white border-none py-2 px-6 rounded-full font-bold text-sm transition-all duration-200 ${!hasScrolledToBottom ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#050C48] hover:-translate-y-px'}`}
              >
                {hasScrolledToBottom ? "I Agree" : "Scroll to bottom to agree"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}