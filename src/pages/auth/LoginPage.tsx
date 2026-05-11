import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

// ✨ REDUX IMPORTS ✨
import { RootState } from '../../store';
import { loginRequest } from '../../store/auth/actions';

import logo from '../../assets/logo.png';
import bgImage from '../../assets/Bg_image.jpg';

export default function LoginPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // ─── PULL GLOBAL STATE FROM REDUX ───
    const { isAuthenticated, loading, error, user } = useSelector((state: RootState) => state.auth);

    const [role, setRole] = useState('intern');
    const [showPassword, setShowPassword] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm();

    // ─── TRIGGER ANIMATION & NAVIGATION ON SUCCESS ───
    useEffect(() => {
        if (isAuthenticated && user) {
            sessionStorage.setItem('justLoggedIn', 'true');
            
            // Trigger the left-shrink / right-expand animation
            setIsTransitioning(true);

            // Navigate based on the actual role returned from the backend
            const targetPath = (user.role === 'hr' || user.role === 'superadmin') 
                ? '/dashboard' 
                : '/intern-dashboard';

            const timer = setTimeout(() => {
                navigate(targetPath);
            }, 750);

            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, user, navigate]);

    // ─── SUBMIT HANDLER (Now 1 line!) ───
    const onSubmit = (data: any) => {
        // Redux Saga intercepts this, hits the API, saves the token, and updates global state!
        dispatch(loginRequest({ 
            email: data.email, 
            password: data.password, 
            role: role 
        }));
    };

    return (
        <>
            <style>
                {`
                    @keyframes customFadeIn {
                        from { opacity: 0; transform: translateY(-5px); }
                        to   { opacity: 1; transform: translateY(0); }
                    }
                    .animate-custom-fade-in {
                        animation: customFadeIn 0.3s ease-in-out;
                    }
                    
                    /* Hides the browser's default duplicate eye icon */
                    input[type="password"]::-ms-reveal,
                    input[type="password"]::-webkit-reveal {
                        display: none;
                    }
                `}
            </style>

            <div className="flex w-full min-h-screen overflow-hidden font-['Inter',sans-serif] relative max-[900px]:flex-col max-[900px]:h-auto">
                <Toaster position="top-right" />

                {/* ─── LEFT SIDE ─── */}
                <div 
                    className={`
                        bg-[linear-gradient(270deg,#0B1EAE_0%,#152286_23.56%,#0D1767_63.46%,#050C48_100%)] 
                        flex flex-col items-center justify-start relative overflow-hidden 
                        transition-all duration-[700ms] ease-[cubic-bezier(0.77,0,0.18,1)] 
                        max-[900px]:flex-none max-[900px]:py-6 max-[900px]:px-4 max-[900px]:transition-none
                        ${isTransitioning ? 'flex-[0_0_260px] min-w-0 py-6 px-4' : 'flex-1 py-10 px-8'}
                    `}
                >
                    {/* Logo & Title */}
                    <div 
                        className={`
                            flex flex-row items-center justify-center gap-3 w-full mb-1 
                            transition-all duration-300 ease-out
                            ${isTransitioning ? 'opacity-0 -translate-y-2.5' : 'opacity-100 translate-y-0'}
                        `}
                    >
                        <img src={logo} alt="CLIMBS Logo" className="h-[70px] w-auto" />
                    </div>

                    <p 
                        className={`
                            text-white font-bold text-center transition-all duration-400 ease-out
                            max-[900px]:mb-2 max-[900px]:text-[1.35rem] max-[900px]:leading-snug
                            ${isTransitioning ? 'text-[0.65rem] tracking-[0.2px] opacity-0 mt-1.5 mb-[1.5rem]' : 'text-[1.78rem] tracking-[0.3px] opacity-100 mt-1.5 mb-[1.5rem]'}
                        `}
                    >
                        CLIMBS Internship Monitoring System
                    </p>

                    <h2 
                        className={`
                            text-[#FFD700] text-[1.5rem] font-bold italic m-0 mb-4 text-center tracking-[0.3px] 
                            animate-custom-fade-in transition-all duration-250 ease-out max-[900px]:hidden
                            ${isTransitioning ? 'opacity-0 translate-y-2.5' : 'opacity-100 translate-y-0'}
                        `}
                    >
                        {role === 'intern' ? "Hello, I'm an Intern!" : "Hello, I'm from HR/Admin!"}
                    </h2>

                    {/* Mascot */}
                    {role === 'intern' ? (
                        <video
                            src="/intern mordie.webm"
                            autoPlay loop muted playsInline
                            className={`
                                w-auto object-contain flex-1 drop-shadow-[0_0_30px_rgba(255,255,255,0.15)] 
                                transition-all duration-500 ease-out max-[900px]:hidden
                                ${isTransitioning ? 'h-[120px] opacity-0' : 'h-[340px] opacity-100'}
                            `}
                        />
                    ) : (
                        <video
                            src="/hr mordie.webm"
                            autoPlay loop muted playsInline
                            className={`
                                w-auto object-contain flex-1 drop-shadow-[0_0_30px_rgba(255,255,255,0.15)] 
                                transition-all duration-500 ease-out max-[900px]:hidden
                                ${isTransitioning ? 'h-[120px] opacity-0' : 'h-[340px] opacity-100'}
                            `}
                        />
                    )}

                    <p 
                        className={`
                            text-white/85 text-[0.9rem] font-normal text-center leading-[1.6] mt-auto pt-4 
                            transition-all duration-250 ease-out max-[900px]:hidden
                            ${isTransitioning ? 'opacity-0 translate-y-2.5' : 'opacity-100 translate-y-0'}
                        `}
                    >
                        {role === 'intern' ? (
                            <>Track your hours, submit forms, and<br />monitor your progress</>
                        ) : (
                            <>Manage interns, review logs, make<br />announcements, and generate reports</>
                        )}
                    </p>
                </div>

                {/* ─── RIGHT SIDE ─── */}
                <div 
                    className={`
                        relative bg-cover bg-center flex items-center justify-center 
                        transition-all duration-[700ms] ease-[cubic-bezier(0.77,0,0.18,1)] flex-1
                        max-[900px]:py-8 max-[900px]:px-4 max-[900px]:transition-none
                    `}
                    style={{ backgroundImage: `url("${bgImage}")` }}
                >
                    <div 
                        className={`
                            absolute inset-0 backdrop-blur-[1px] z-0 transition-colors duration-500
                            ${isTransitioning ? 'bg-white' : 'bg-white/45'}
                        `}
                    />

                    <div 
                        className={`
                            relative z-10 flex flex-col items-center p-8 w-full max-w-[500px] 
                            transition-all duration-300 ease-out
                            ${isTransitioning ? 'opacity-0 scale-[0.97] translate-y-2.5' : 'opacity-100 scale-100 translate-y-0'}
                        `}
                    >
                        <div className="bg-[rgba(255,255,255,0.97)] p-8 md:px-9 rounded-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.25)] w-full max-w-[420px] max-[900px]:p-6">
                            
                            {/* ✨ TEXT MOVED INSIDE THE CARD ✨ */}
                            <div className="text-center mb-6">
                                <h1 className="text-[2.5rem] font-black text-[#0B1EAE] m-0 mb-1 tracking-[1px] max-[900px]:text-[2.2rem]">
                                    WELCOME
                                </h1>
                                <p className="text-slate-500 text-[0.95rem] font-medium m-0">
                                    Login to your CLIMBS {role === 'hr' ? 'admin' : 'Intern'} account
                                </p>
                            </div>

                            <div className="flex bg-slate-100 rounded-full p-1 mb-6 relative">
                                <div 
                                    className={`
                                        absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white rounded-full 
                                        shadow-[0_2px_6px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-[1]
                                        ${role === 'hr' ? 'translate-x-[100%]' : 'translate-x-0'}
                                    `}
                                />
                                <button
                                    className={`flex-1 py-[0.6rem] px-4 rounded-full border-none bg-transparent text-[0.85rem] font-semibold cursor-pointer transition-colors duration-300 relative z-10 ${role === 'intern' ? 'text-[rgba(0,2,112,0.9)]' : 'text-slate-500'}`}
                                    onClick={() => setRole('intern')}
                                    type="button"
                                >
                                    Intern
                                </button>
                                <button
                                    className={`flex-1 py-[0.6rem] px-4 rounded-full border-none bg-transparent text-[0.85rem] font-semibold cursor-pointer transition-colors duration-300 relative z-10 ${role === 'hr' ? 'text-[rgba(0,2,112,0.9)]' : 'text-slate-500'}`}
                                    onClick={() => setRole('hr')}
                                    type="button"
                                >
                                    HR Admin
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)}>
                                {/* ✨ Display Redux Global Error State Here ✨ */}
                                {error && (
                                    <div className="bg-red-50 text-red-600 px-4 py-[0.6rem] rounded-lg text-[0.85rem] text-center mb-4 border border-red-200">
                                        {error}
                                    </div>
                                )}

                                <div className="mb-[1.1rem]">
                                    <label className="block text-[0.8rem] font-semibold text-slate-900 mb-[0.4rem]">Email Address</label>
                                    <div className="relative w-full">
                                        <Mail className="absolute left-[14px] top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                        <input
                                            type="email"
                                            placeholder="Enter Email Address"
                                            className={`w-full py-3 pr-4 pl-[2.5rem] border rounded-lg text-[0.9rem] outline-none bg-slate-50 text-slate-900 transition-all duration-200 focus:bg-white focus:ring-[3px] focus:ring-[#0B1EAE]/10 ${errors.email ? 'border-red-500' : 'border-slate-200 focus:border-[#0B1EAE]'}`}
                                            {...register('email', { required: true })}
                                        />
                                    </div>
                                </div>

                                <div className="mb-[1.1rem]">
                                    <label className="block text-[0.8rem] font-semibold text-slate-900 mb-[0.4rem]">Password</label>
                                    <div className="relative w-full">
                                        <Lock className="absolute left-[14px] top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter Password"
                                            className={`w-full py-3 pr-4 pl-[2.5rem] border rounded-lg text-[0.9rem] outline-none bg-slate-50 text-slate-900 transition-all duration-200 focus:bg-white focus:ring-[3px] focus:ring-[#0B1EAE]/10 ${errors.password ? 'border-red-500' : 'border-slate-200 focus:border-[#0B1EAE]'}`}
                                            {...register('password', { required: true })}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-[14px] top-1/2 -translate-y-1/2 bg-transparent border-none text-slate-400 cursor-pointer p-0 flex items-center justify-center hover:text-slate-600"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex mt-3 mb-5">
                                    <label className="flex items-center gap-2 text-[0.82rem] text-slate-500 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 rounded cursor-pointer accent-[#0B1EAE]" />
                                        Keep me Signed In
                                    </label>
                                </div>

                                <div className="flex justify-center mb-2">
                                    <button
                                        type="submit"
                                        className="bg-[#0B1EAE] hover:bg-[#050C48] text-white border-none py-3 px-[3.5rem] rounded-full font-bold text-[0.95rem] cursor-pointer transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-70 disabled:cursor-not-allowed tracking-[0.5px]"
                                        disabled={loading || isTransitioning}
                                    >
                                        {loading || isTransitioning ? 'Loading...' : 'Login'}
                                    </button>
                                </div>

                                {role === 'intern' && (
                                    <>
                                        <div className="text-center mt-4">
                                            <Link to="/forgot-password" className="text-slate-600 text-[0.82rem] font-medium no-underline hover:text-[#0B1EAE] hover:underline">
                                                Forgot Password?
                                            </Link>
                                        </div>
                                        <div className="text-center mt-3 text-[0.82rem] text-slate-500">
                                            Don't have an account?{' '}
                                            <Link to="/signup" className="text-[#0B1EAE] font-bold no-underline ml-[3px] hover:underline">Sign Up here</Link>
                                        </div>
                                    </>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}