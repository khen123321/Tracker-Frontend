import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import toast, { Toaster } from 'react-hot-toast';
import { Mail } from 'lucide-react'; 
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
const SelectField = ({ label, name, value, onChange, disabled, children }) => (
  <div className={styles.inputGroup}>
    <label className={styles.label}>{label}</label>
    <div className={styles.selectWrapper}>
      <select name={name} value={value} onChange={onChange} disabled={disabled} className={styles.select}>
        {children}
      </select>
      <div className={styles.selectIcon}>
        <ChevronDown />
      </div>
    </div>
  </div>
);

const STEP_LABELS = ['Personal Info', 'School Details', 'Documents', 'Security'];

export default function SignUpPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // State: Tracks if they successfully registered and need to verify
  const [isRegistered, setIsRegistered] = useState(false);
  // State: For triggering page load animations
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // ── States for Dropdowns ──
  const [schoolsList, setSchoolsList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // ── States for Home Address (Nested Tree API) ──
  const [areaData, setAreaData] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  const [formData, setFormData] = useState({
    // Personal
    first_name: '', middle_name: '', last_name: '', email: '',
    // Home Address
    province: '', municipality: '', barangay: '',
    // Emergency Contact
    emergency_name: '', emergency_phone: '', emergency_address: '', emergency_relationship: '',
    // School Details
    course: '', school_id: '', branch_id: '', department_id: '', date_started: '',
    // Documents & Security
    has_moa: false, has_endorsement: false, has_pledge: false, has_nda: false,
    password: '', password_confirmation: '',
  });

  // ── API Fetching on Page Load ──
  useEffect(() => {
    // Trigger initial mount animation
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
        const response = await fetch('https://coop-sustain-be.climbs.coop/api/area-registration');
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

  // ── Dynamic Address Filtering ──
  const selectedProvinceObj = areaData.find(p => p.name === formData.province);
  const municipalitiesList = selectedProvinceObj ? selectedProvinceObj.municipalities : [];

  const selectedMunicipalityObj = municipalitiesList.find(m => m.name === formData.municipality);
  const barangaysList = selectedMunicipalityObj ? selectedMunicipalityObj.barangays : [];

  // ── Handlers ──
  const handleSchoolChange = async (e) => {
    const selectedSchoolId = e.target.value;
    setFormData(prev => ({ ...prev, school_id: selectedSchoolId, course: '' }));
    try {
      const res = await axios.get(`/public/courses/${selectedSchoolId}`);
      setCoursesList(res.data);
    } catch {
      setCoursesList([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleProvinceChange = (e) => {
    setFormData(prev => ({ ...prev, province: e.target.value, municipality: '', barangay: '' }));
  };
  const handleMunicipalityChange = (e) => {
    setFormData(prev => ({ ...prev, municipality: e.target.value, barangay: '' }));
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
      has_pledge: formData.has_pledge ? 1 : 0,
      has_nda: formData.has_nda ? 1 : 0,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
      role: 'intern',
      status: 'active'
    };

    try {
      const res = await axios.post('/auth/register', payload); 
      
      // Check if Laravel told us they need to verify
      if (res.data.requires_verification) {
        setIsRegistered(true); 
      } else {
        toast.success('Account created successfully!');
        setTimeout(() => navigate('/login'), 2000);
      }
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
          <div className={styles.inputGroup}>
            <label className={styles.label}>Last Name</label>
            <input type="text" name="last_name" placeholder="Last Name" className={styles.input} value={formData.last_name} onChange={handleChange} />
          </div>
          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>First Name</label>
              <input type="text" name="first_name" placeholder="First Name" className={styles.input} value={formData.first_name} onChange={handleChange} />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Middle Name</label>
              <input type="text" name="middle_name" placeholder="Middle Name" className={styles.input} value={formData.middle_name} onChange={handleChange} />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <input type="email" name="email" placeholder="Email" className={styles.input} value={formData.email} onChange={handleChange} />
          </div>

          <div className={styles.divider} />

          <p className={styles.sectionTitle}>Home Address</p>
          <div className={styles.grid2}>
              <SelectField label="Province" name="province" value={formData.province} onChange={handleProvinceChange} disabled={loadingAreas}>
                  <option value="">{loadingAreas ? "Loading..." : "Select Province"}</option>
                  {areaData.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </SelectField>

              <SelectField label="City/Municipality" name="municipality" value={formData.municipality} onChange={handleMunicipalityChange} disabled={!formData.province}>
                  <option value="">Select City</option>
                  {municipalitiesList.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </SelectField>
          </div>
          <div className={styles.inputGroup}>
              <SelectField label="Barangay" name="barangay" value={formData.barangay} onChange={handleChange} disabled={!formData.municipality}>
                  <option value="">Select Barangay</option>
                  {barangaysList.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </SelectField>
          </div>

          <div className={styles.divider} />

          <div style={{ paddingTop: '0.25rem' }}>
            <p className={styles.sectionTitle}>Emergency Contact</p>
            <div className={styles.spaceY3}>
              <input type="text" name="emergency_name" placeholder="Contact Name" className={styles.input} value={formData.emergency_name} onChange={handleChange} />
              <input type="text" name="emergency_phone" placeholder="Phone Number" className={styles.input} value={formData.emergency_phone} onChange={handleChange} />
              <input type="text" name="emergency_address" placeholder="Address" className={styles.input} value={formData.emergency_address} onChange={handleChange} />
              <SelectField label="" name="emergency_relationship" value={formData.emergency_relationship} onChange={handleChange}>
                <option value="">Relationship...</option>
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

          <div className={styles.inputGroup}>
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
          <div className={styles.inputGroup}>
             <label className={styles.label}>Password</label>
             <input type="password" name="password" placeholder="Create Password" className={styles.input} value={formData.password} onChange={handleChange} />
          </div>
          <div className={styles.inputGroup}>
             <label className={styles.label}>Confirm Password</label>
             <input type="password" name="password_confirmation" placeholder="Confirm Password" className={styles.input} value={formData.password_confirmation} onChange={handleChange} />
          </div>
          <div className={styles.termsContainer}>
            <label htmlFor="terms" className={styles.checkboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="terms" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className={styles.checkboxInput} />
                I agree to the Terms and Conditions
            </label>
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
    <div className={styles.navButtonsWrapper}>
      <div className={`${styles.btnContainer} ${step > 1 ? styles.btnSpaceBetween : styles.btnRight}`}>
        {step > 1 && (
          <button type="button" onClick={handleBack} className={styles.btnSecondary}>Back</button>
        )}
        {step < 4 ? (
          <button type="button" onClick={handleNext} className={`${styles.btnPrimary} ${styles.btnAutoLeft}`}>Continue</button>
        ) : (
          <button type="submit" disabled={loading || !agreedToTerms} className={styles.btnPrimary}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        )}
      </div>

      {step === 1 && (
        <div className={styles.loginRedirectRow}>
          Already have an account?{' '}
          <Link to="/login" className={styles.inlineLink}>Login here</Link>
        </div>
      )}
    </div>
  );

  return (
    <div className={`${styles.pageWrapper} ${isPageLoaded ? styles.loaded : ''}`}>
      <Toaster position="top-right" />
      
      {/* ─── LEFT PANE ─── */}
      <div className={styles.leftPane}>
          <div className={styles.leftHeader}>
              <img src={logo} alt="CLIMBS Logo" className={styles.leftLogo} />
              <div className={styles.leftTitleGroup}>
                  <span className={styles.leftTitle}>CLIMBS</span>
                  <span className={styles.leftSubTitle}>InternTracker</span>
              </div>
          </div>

          <p className={styles.systemLabel}>CLIMBS Internship Monitoring System</p>
          <h2 className={styles.mascotGreeting}>Hello, I'm an Intern!</h2>

          <video 
              src="/intern mordie.webm" 
              autoPlay 
              loop 
              muted 
              playsInline
              className={styles.mascotImgSignUp} 
          />

          <p className={styles.tagline}>
              Track your hours, submit forms, and<br />monitor your progress
          </p>
      </div>

      {/* ─── RIGHT PANE ─── */}
      <div className={styles.rightPane}>
          <div className={styles.rightOverlay} />
          
          <div className={styles.rightContent}>
              
              {isRegistered ? (
                // ─── VERIFICATION PENDING SCREEN ───
                <div className={styles.successScreenCard}>
                  <div className={styles.successIconWrapper}>
                    <Mail size={40} color="#3B82F6" />
                  </div>
                  <h1 className={styles.welcomeText} style={{ marginBottom: '10px' }}>Check Your Email</h1>
                  <p className={styles.subText} style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '25px', color: '#475569' }}>
                    We've sent a verification link to <strong>{formData.email}</strong>. <br />
                    Please click the link in that email to activate your account.
                  </p>
                  <div className={styles.spamNotice}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#b45309', fontWeight: '500' }}>
                      Don't see the email? Be sure to check your spam or junk folder.
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/login')} 
                    className={styles.btnPrimary} 
                    style={{ width: '100%', padding: '12px', fontSize: '15px' }}
                  >
                    Return to Login
                  </button>
                </div>

              ) : (

                // ─── ORIGINAL SIGNUP FORM WITH PINNED HEADER/FOOTER AND ANIMATED SCROLLING MIDDLE ───
                <>
                  <div className={styles.formHeader}>
                      <h1 className={styles.welcomeText}>CREATE ACCOUNT</h1>
                      <p className={styles.subText}>Sign up to join the CLIMBS Intern program</p>
                  </div>

                  {/* The form acts as the Flex container for the pinned layout */}
                  <form className={styles.formCard} onSubmit={step === 4 ? handleSubmit : (e) => e.preventDefault()}>
                    
                    {/* PINNED TOP */}
                    <div className={styles.cardHeaderPinned}>
                      {/* ✨ FIX: Call this as a function so React animates the CSS instead of destroying it! ✨ */}
                      {Stepper()}
                    </div>

                    {/* SCROLLING MIDDLE + ANIMATION */}
                    {/* The key={step} automatically triggers the CSS animation and resets scroll to top! */}
                    <div className={styles.cardBodyScrollable} key={`step-anim-${step}`}>
                      {renderStep()}
                    </div>
                    
                    {/* PINNED BOTTOM */}
                    <div className={styles.cardFooterPinned}>
                      {/* ✨ FIX: Call this as a function too ✨ */}
                      {NavButtons()}
                    </div>

                  </form>
              
                </>

              )}

          </div>
      </div>
    </div>
  );
}