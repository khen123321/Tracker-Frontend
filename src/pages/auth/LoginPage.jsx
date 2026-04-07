import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../api/auth';
import toast, { Toaster } from 'react-hot-toast';
import { User, Lock } from 'lucide-react';

// Styling and Assets
import styles from './Login.module.css';
import logo from '../../assets/logo.png';

export default function LoginPage() {
    const [role, setRole] = useState('intern'); 
    const [authError, setAuthError] = useState(''); 
    const navigate = useNavigate();

    const { 
        register, 
        handleSubmit, 
        formState: { errors, isSubmitting } 
    } = useForm();

    // --- THE SUBMIT FUNCTION ---
    const onSubmit = async (data) => {
        setAuthError(''); 
        
        try {
            // Calling your API helper
            const response = await login(data.email, data.password, role);
            
            if (response.access_token) {
                // 1. Store the Token for API Authorization headers
                localStorage.setItem('cims_token', response.access_token);
                
                // 2. STORE THE USER DATA (The Critical Fix)
                // We stringify the object so localStorage can store it
                localStorage.setItem('cims_user', JSON.stringify(response.user));

                sessionStorage.setItem('justLoggedIn', 'true');

                // 3. Redirect based on the toggle state (intern or hr)
                const targetPath = role === 'hr' ? '/dashboard' : '/intern-dashboard';
                navigate(targetPath);
            }
        } catch (err) {
            console.error(">>> LOGIN API ERROR:", err);
            const message = err.response?.data?.message || 'Invalid Email or Password. Please try again.';
            setAuthError(message); 
            toast.error(message); 
        }
    };

    const onError = (formErrors) => {
        if (formErrors.email) toast.error(formErrors.email.message);
        else if (formErrors.password) toast.error(formErrors.password.message);
    };

    return (
        <div className={styles.pageWrapper}>
            <Toaster position="top-right" />

            <div className={styles.brandSide}>
                <img src={logo} alt="CLIMBS Logo" className={styles.brandLogo} />
                <h2>CLIMBS INTERNSHIP MONITORING SYSTEM</h2>
            </div>

            <div className={styles.formSide}>
                <div className={styles.headerArea}>
                    <h1 className={styles.welcomeText}>WELCOME</h1>
                    <p className={styles.subText}>
                        Sign in to your CLIMBS {role === 'hr' ? 'admin' : 'intern'} account
                    </p>
                </div>

                <div className={styles.loginCard}>
                    {/* ROLE TOGGLE */}
                    <div className={styles.toggleContainer}>
                        <button 
                            type="button"
                            className={`${styles.toggleBtn} ${role === 'intern' ? styles.toggleBtnActive : ''}`}
                            onClick={() => setRole('intern')}
                        >
                            Intern
                        </button>
                        <button 
                            type="button"
                            className={`${styles.toggleBtn} ${role === 'hr' ? styles.toggleBtnActive : ''}`}
                            onClick={() => setRole('hr')}
                        >
                            HR Admin
                        </button>
                    </div>

                    <form onSubmit={(e) => {
                        e.preventDefault(); 
                        handleSubmit(onSubmit, onError)(e); 
                    }}>
                        
                        {authError && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-5 text-sm text-center font-medium shadow-sm">
                                {authError}
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <User className={styles.inputIcon} size={18} />
                            <input
                                type="email"
                                placeholder="Enter Email"
                                className={`${styles.inputField} ${errors.email ? styles.inputError : ''}`}
                                {...register('email', { required: 'Email is required' })}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <Lock className={styles.inputIcon} size={18} />
                            <input
                                type="password"
                                placeholder="Enter Password"
                                className={`${styles.inputField} ${errors.password ? styles.inputError : ''}`}
                                {...register('password', { required: 'Password is required' })}
                            />
                        </div>

                        <div className="flex items-center mt-2 mb-6">
                            <input type="checkbox" id="remember" className="w-4 h-4 rounded text-[#0B1EAE]" />
                            <label htmlFor="remember" className="ml-2 text-sm text-gray-500">Keep me Signed In</label>
                        </div>

                        <button 
                            type="submit" 
                            className={styles.loginBtn} 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Authenticating...' : 'Login'}
                        </button>

                        <div className="text-center mt-5">
                            <a href="#" className="text-sm text-[#0B1EAE] hover:underline">Forgot Password?</a>
                        </div>

                        <div className="text-center mt-6 text-sm text-slate-500 border-t border-slate-200 pt-4">
                            Need a test account?{' '}
                            <Link to="/signup" className="text-[#0B1EAE] font-semibold hover:underline">
                                Sign Up Here
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}