import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import toast, { Toaster } from 'react-hot-toast';
import logo from '../../assets/logo.png';
import styles from './SignUpPage.module.css';

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

// ── Components ────────────────────────────────────────────────────────
const SelectField = ({ label, name, value, onChange, children }) => (
  <div>
    <label className={styles.label}>{label}</label>
    <div className={styles.selectWrapper}>
      <select name={name} value={value} onChange={onChange} className={styles.select}>
        {children}
      </select>
      <div className={styles.selectIcon}>
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

  // ✅ Updated state to use _id for school, branch, and department
  const [formData, setFormData] = useState({
    first_name: '',  middle_name: '',   last_name: '',        email: '',
    emergency_name: '', emergency_phone: '', emergency_address: '', emergency_relationship: '',
    course: '',      school_id: '',     branch_id: '',        department_id: '', date_started: '',
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

    // ✅ Updated payload to send the exact column names Laravel is expecting
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
      course: formData.course,
      
      // Send the IDs to the backend
      school_id: formData.school_id,
      branch_id: formData.branch_id,
      department_id: formData.department_id,
      
      // Keep these just in case your users table relies on them for text fallback
      school_university: formData.school_id,
      assigned_branch: formData.branch_id,
      assigned_department: formData.department_id,
      
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
        <div className={styles.spaceY4}>
          <p className={styles.sectionTitle}>Personal Information</p>
          <div>
            <label className={styles.label}>Last Name</label>
            <input type="text" name="last_name" placeholder="Last Name" className={styles.input} value={formData.last_name} onChange={handleChange} />
          </div>
          <div className={styles.grid2}>
            <div>
              <label className={styles.label}>First Name</label>
              <input type="text" name="first_name" placeholder="First Name" className={styles.input} value={formData.first_name} onChange={handleChange} />
            </div>
            <div>
              <label className={styles.label}>Middle Name</label>
              <input type="text" name="middle_name" placeholder="Middle Name" className={styles.input} value={formData.middle_name} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label className={styles.label}>Email Address</label>
            <input type="email" name="email" placeholder="Email" className={styles.input} value={formData.email} onChange={handleChange} />
          </div>
          <div style={{ paddingTop: '0.25rem' }}>
            <p className={styles.subTitle}>Emergency Contact</p>
            <div className={styles.spaceY3}>
              <input type="text" name="emergency_name" placeholder="Contact Name" className={styles.input} value={formData.emergency_name} onChange={handleChange} />
              <input type="text" name="emergency_phone" placeholder="Phone Number" className={styles.input} value={formData.emergency_phone} onChange={handleChange} />
              <input type="text" name="emergency_address" placeholder="Address" className={styles.input} value={formData.emergency_address} onChange={handleChange} />
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
        <div className={styles.spaceY4}>
          {/* ✅ COURSE STAYS AS TEXT */}
          <SelectField label="Course / Program" name="course" value={formData.course} onChange={handleChange}>
            <option value="">Select Course</option>
            <option value="BSIT">BS Information Technology</option>
            <option value="BSCS">BS Computer Science</option>
            <option value="BSIS">BS Information Systems</option>
            <option value="BSBA">BS Business Administration</option>
          </SelectField>

          {/* ✅ SCHOOL USES IDs */}
          <SelectField label="School / University" name="school_id" value={formData.school_id} onChange={handleChange}>
            <option value="">Select School</option>
            <option value="1">University of Science and Technology of Southern Philippines (USTP)</option>
            <option value="2">Xavier University (XU)</option>
            <option value="3">Capitol University (CU)</option>
            <option value="4">Liceo de Cagayan University</option>
          </SelectField>

          {/* ✅ BRANCHES EXACTLY AS REQUESTED */}
          <SelectField label="Assigned Branch" name="branch_id" value={formData.branch_id} onChange={handleChange}>
            <option value="">Select Branch</option>
            <option value="1">Bulua Branch (Head Office)</option>
            <option value="2">Tiano Office</option>
            <option value="3">Luzon Branch</option>
            <option value="4">Naga Branch</option>
            <option value="5">Baguio Branch</option>
            <option value="6">Cebu Branch</option>
          </SelectField>

          {/* ✅ DEPARTMENTS EXACTLY AS REQUESTED */}
          <SelectField label="Department" name="department_id" value={formData.department_id} onChange={handleChange}>
            <option value="">Select Department</option>
            <option value="1">Insurtech - Business Analyst & System Development</option>
            <option value="2">CARES</option>
            <option value="3">EDP</option>
            <option value="4">CESLA</option>
            <option value="5">Finance</option>
            <option value="6">HR</option>
          </SelectField>

          <div>
            <label className={styles.label}>Date Started</label>
            <input type="date" name="date_started" className={styles.input} value={formData.date_started} onChange={handleChange} />
          </div>
        </div>
      );
      case 3: return (
        <div className={styles.spaceY3}>
          <p className={styles.subTitle}>Documents Submitted</p>
          {['has_moa', 'has_endorsement', 'has_pledge', 'has_nda'].map((key) => (
            <label key={key} className={styles.checkboxRow}>
              <input type="checkbox" name={key} checked={formData[key]} onChange={handleChange} className={styles.checkboxInput} />
              <span className={styles.checkboxLabel}>{key.replace('has_', '').replace('_', ' ').toUpperCase()}</span>
            </label>
          ))}
        </div>
      );
      case 4: return (
        <div className={styles.spaceY4}>
          <input type="password" name="password" placeholder="Password" className={styles.input} value={formData.password} onChange={handleChange} />
          <input type="password" name="password_confirmation" placeholder="Confirm Password" className={styles.input} value={formData.password_confirmation} onChange={handleChange} />
          <div className={styles.termsContainer}>
            <input type="checkbox" id="terms" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className={styles.checkboxInput} style={{ marginTop: '0.125rem' }} />
            <label htmlFor="terms" className={styles.checkboxLabel}>I agree to the Terms and Conditions</label>
          </div>
        </div>
      );
      default: return null;
    }
  };

  const Stepper = () => (
    <div className={styles.stepperContainer}>
      {STEP_LABELS.map((label, i) => {
        const s = i + 1;
        const isComplete = step > s;
        const isActive = step === s;
        return (
          <div key={s} className={`${styles.stepWrapper} ${i < STEP_LABELS.length - 1 ? styles.stepFlex : ''}`}>
            <div className={styles.stepIconContainer}>
              <div className={`${styles.stepCircle} ${isComplete || isActive ? styles.stepCircleActive : styles.stepCircleInactive}`}>
                {isComplete ? <CheckIcon /> : s}
              </div>
              <span className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : styles.stepLabelInactive}`}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`${styles.stepLine} ${step > s ? styles.stepLineActive : styles.stepLineInactive}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const NavButtons = () => (
    <div className={`${styles.btnContainer} ${step > 1 ? styles.btnSpaceBetween : styles.btnRight}`}>
      {step > 1 && (
        <button type="button" onClick={handleBack} className={styles.btnPrimary}>Back</button>
      )}
      {step < 4 ? (
        <button type="button" onClick={handleNext} className={`${styles.btnPrimary} ${styles.btnAutoLeft}`}>Continue</button>
      ) : (
        <button type="submit" disabled={loading || !agreedToTerms} className={styles.btnPrimary}>
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      )}
    </div>
  );

  return (
    <div className={styles.pageWrapper}>
      <Toaster position="top-right" />
      
      <div className={styles.leftPane}>
        <img src={logo} alt="Logo" className={styles.logo} />
        <h1 className={styles.leftTitle}>CLIMBS INTERNSHIP MONITORING SYSTEM</h1>
      </div>

      <div className={styles.rightPane}>
        <div className={styles.bgImage} />
        <div className={styles.bgOverlay} />
        
        <div className={styles.welcomeHeader}>
          <h1 className={styles.welcomeTitle}>WELCOME</h1>
        </div>

        <div className={styles.contentWrapper}>
          <div className={styles.formCard}>
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