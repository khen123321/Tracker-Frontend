import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../api/auth';
import toast, { Toaster } from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

import styles from './Login.module.css';
import logo from '../../assets/logo.png';

export default function LoginPage() {
    const [role, setRole] = useState('intern');
    const [authError, setAuthError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm();

    const onSubmit = async (data) => {
        setAuthError('');
        try {
            const response = await login(data.email, data.password, role);

            if (response.access_token) {
                localStorage.setItem('cims_token', response.access_token);
                localStorage.setItem('user', JSON.stringify(response.user));
                sessionStorage.setItem('justLoggedIn', 'true');

                const targetPath = role === 'hr' ? '/dashboard' : '/intern-dashboard';

                // ── Trigger the left-shrink / right-expand animation ──
                setIsTransitioning(true);

                // Wait for the CSS transition to finish (0.7s) then navigate
                setTimeout(() => {
                    navigate(targetPath);
                }, 750);
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Invalid Credentials. Please try again.';
            setAuthError(message);
            toast.error(message);
        }
    };

    return (
        <div className={`${styles.loginWrapper} ${isTransitioning ? styles.transitioning : ''}`}>
            <Toaster position="top-right" />

            {/* ─── LEFT SIDE ─── */}
            <div className={styles.leftSide}>

                {/* Logo & Title at TOP */}
                <div className={styles.leftHeader}>
                    <img src={logo} alt="CLIMBS Logo" className={styles.leftLogo} />
                    <div className={styles.leftTitleGroup}>
                    </div>
                </div>

                <p className={styles.systemLabel}>CLIMBS Internship Monitoring System</p>

                {/* Dynamic Greeting */}
                <h2 className={styles.mascotGreeting}>
                    {role === 'intern' ? "Hello, I'm an Intern!" : "Hello, I'm from HR/Admin!"}
                </h2>

                {/* Mascot */}
                {role === 'intern' ? (
                    <video
                        src="/intern mordie.webm"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className={styles.mascotImgLogin}
                    />
                ) : (
                    <video
                        src="/hr mordie.webm"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className={styles.mascotImgLogin}
                    />
                )}

                {/* Bottom tagline */}
                <p className={styles.tagline}>
                    {role === 'intern' ? (
                        <>Track your hours, submit forms, and<br />monitor your progress</>
                    ) : (
                        <>Manage interns, review logs, make<br />announcements, and generate reports</>
                    )}
                </p>
            </div>

            {/* ─── RIGHT SIDE ─── */}
            <div className={styles.rightSide}>
                {/* Blue overlay on top of background image */}
                <div className={styles.rightOverlay} />

                <div className={styles.rightContent}>
                    <div className={styles.formHeader}>
                        <h1 className={styles.welcomeText}>WELCOME</h1>
                        <p className={styles.subText}>
                            Login to your CLIMBS {role === 'hr' ? 'admin' : 'Intern'} account
                        </p>
                    </div>

                    <div className={styles.formCard}>
                        
                        {/* ✨ NEW SLIDING PILL TOGGLE ✨ */}
                        <div className={styles.pillContainer}>
                            {/* The physical sliding block */}
                            <div className={`${styles.slider} ${role === 'hr' ? styles.sliderRight : ''}`} />
                            
                            <button
                                className={`${styles.pillBtn} ${role === 'intern' ? styles.pillActiveText : ''}`}
                                onClick={() => { setRole('intern'); setAuthError(''); }}
                                type="button"
                            >
                                Intern
                            </button>
                            <button
                                className={`${styles.pillBtn} ${role === 'hr' ? styles.pillActiveText : ''}`}
                                onClick={() => { setRole('hr'); setAuthError(''); }}
                                type="button"
                            >
                                HR Admin
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            {authError && (
                                <div className={styles.errorBox}>
                                    {authError}
                                </div>
                            )}

                            {/* Email Field */}
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>Email Address</label>
                                <div className={styles.inputWrapper}>
                                    <Mail className={styles.inputIcon} size={18} />
                                    <input
                                        type="email"
                                        placeholder="Enter Email Address"
                                        className={`${styles.inputField} ${errors.email ? styles.inputError : ''}`}
                                        {...register('email', { required: true })}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>Password</label>
                                <div className={styles.inputWrapper}>
                                    <Lock className={styles.inputIcon} size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter Password"
                                        className={`${styles.inputField} ${errors.password ? styles.inputError : ''}`}
                                        {...register('password', { required: true })}
                                    />
                                    <button
                                        type="button"
                                        className={styles.passwordToggleBtn}
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex="-1"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Keep Signed In */}
                            <div className={styles.optionsRow}>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" className={styles.checkbox} />
                                    Keep me Signed In
                                </label>
                            </div>

                            {/* Login Button */}
                            <div className={styles.loginBtnRow}>
                                <button
                                    type="submit"
                                    className={styles.loginBtn}
                                    disabled={isSubmitting || isTransitioning}
                                >
                                    {isTransitioning ? 'Loading...' : 'Login'}
                                </button>
                            </div>

                            {/* Forgot Password */}
                            <div className={styles.forgotPasswordRow}>
                                <a href="#" className={styles.forgotPasswordText}>Forgot Password?</a>
                            </div>

                            {/* Sign Up Link (intern only) */}
                            {role === 'intern' && (
                                <div className={styles.signupRow}>
                                    Don't have an account?{' '}
                                    <Link to="/signup" className={styles.signupLink}>Sign Up here</Link>
                                </div>
                            )}

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}