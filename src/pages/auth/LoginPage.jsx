import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../api/auth';
import toast, { Toaster } from 'react-hot-toast';
import { User, Lock, Eye, EyeOff } from 'lucide-react'; 

import styles from './Login.module.css';
import logo from '../../assets/logo.png';

export default function LoginPage() {
    const [role, setRole] = useState('intern'); 
    const [authError, setAuthError] = useState(''); 
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const { 
        register, 
        handleSubmit, 
        formState: { errors, isSubmitting } 
    } = useForm();

    const onSubmit = async (data) => {
        setAuthError(''); 
        try {
            const response = await login(data.username, data.password, role);
            
            if (response.access_token) {
                localStorage.setItem('cims_token', response.access_token);
                localStorage.setItem('user', JSON.stringify(response.user));
                sessionStorage.setItem('justLoggedIn', 'true');

                const targetPath = role === 'hr' ? '/dashboard' : '/intern-dashboard';
                navigate(targetPath);
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Invalid Credentials. Please try again.';
            setAuthError(message); 
            toast.error(message); 
        }
    };

    return (
        <div className={styles.loginWrapper}>
            <Toaster position="top-right" />

            {/* ─── LEFT SIDE (Deep Blue / Mascot Area) ─── */}
            <div className={styles.leftSide}>
                
                {/* 1. Dynamic Mascot Greeting */}
                <h2 className={styles.mascotGreeting}>
                    {role === 'intern' ? "Hello, I'm an Intern!" : "Hello, I'm from HR/Admin!"}
                </h2>

                {/* 2. Mascot Image */}
                <img 
                    src={role === 'intern' ? "/intern mordie.png" : "/hr mordie.png"} 
                    alt="Selected Mascot" 
                    className={styles.mascotImgLogin} 
                />

                {/* 3. Logo & Text Below Mascot */}
                <div className={styles.leftHeader}>
                    <img src={logo} alt="CLIMBS Logo" className={styles.leftLogo} />
                    <span className={styles.leftTitle}>
                        CLIMBS INTERNSHIP MONITORING SYSTEM
                    </span>
                </div>

            </div>

            {/* ─── RIGHT SIDE (Half White / Form Area) ─── */}
            <div className={styles.rightSide}>

                <div className={styles.formHeader}>
                    <h1 className={styles.welcomeText}>WELCOME</h1>
                    <p className={styles.subText}>
                        Sign in to your CLIMBS {role === 'hr' ? 'admin' : 'intern'} account
                    </p>
                </div>

                <div className={styles.formCard}>
                    {/* Pill Toggle */}
                    <div className={styles.pillContainer}>
                        <button 
                            className={`${styles.pillBtn} ${role === 'intern' ? styles.pillActive : ''}`}
                            onClick={() => { setRole('intern'); setAuthError(''); }}
                            type="button"
                        >
                            Intern
                        </button>
                        <button 
                            className={`${styles.pillBtn} ${role === 'hr' ? styles.pillActive : ''}`}
                            onClick={() => { setRole('hr'); setAuthError(''); }}
                            type="button"
                        >
                            HR Admin
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        {authError && (
                            <div className="bg-red-50 text-red-600 px-4 py-2 rounded mb-4 text-sm text-center">
                                {authError}
                            </div>
                        )}

                        {/* Username Field */}
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Username</label>
                            <div className={styles.inputWrapper}>
                                <User className={styles.inputIcon} size={18} />
                                <input
                                    type="text"
                                    placeholder="Enter Username"
                                    className={`${styles.inputField} ${errors.username ? styles.inputError : ''}`}
                                    {...register('username', { required: true })}
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
                        <button type="submit" className={styles.loginBtn} disabled={isSubmitting}>
                            Login
                        </button>

                        {/* Forgot Password */}
                        <div className={styles.forgotPasswordRow}>
                            <a href="#" className={styles.forgotPasswordText}>Forgot Password?</a>
                        </div>

                        {/* ✨ Sign Up Link ✨ */}
                        <div className={styles.signupRow}>
                            Don't have an account? <Link to="/signup" className={styles.signupLink}>Sign Up Here</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}