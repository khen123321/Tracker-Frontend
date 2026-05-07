import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from "../../api/axios"; // Make sure this path is correct for your setup

type VerificationStatus = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const apiUrl = searchParams.get('api_url');

  // ✨ THE FIX: We check the URL immediately during initial render!
  // If apiUrl is missing, we start directly in the 'error' state.
  const [status, setStatus] = useState<VerificationStatus>(apiUrl ? 'loading' : 'error');
  const [message, setMessage] = useState<string>(apiUrl ? 'Verifying your email...' : 'Invalid or missing verification link.');

  useEffect(() => {
    // If there is no URL, we don't even try to fetch. The state is already set to error.
    if (!apiUrl) return;

    let isMounted = true;

    const verifyAccount = async () => {
      try {
        // We decode the safe API URL sent by Laravel and hit it!
        const decodedUrl = decodeURIComponent(apiUrl);
        // ✨ CORRECT: Matches Laravel's Route::get!
        const response = await api.get(decodedUrl);

        if (isMounted) {
          setStatus('success');
          setMessage(response.data.message || 'Email verified successfully!');
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus('error');
          setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
        }
      }
    };

    verifyAccount();

    return () => { isMounted = false; };
  }, [apiUrl]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-[90%] max-w-[400px] p-10 bg-white rounded-xl shadow-md text-center">
        
        {/* Loading State */}
        {status === 'loading' && (
          <>
            <Loader2 size={48} color="#0B1EAE" className="mx-auto mb-5 animate-spin" />
            <h2 className="mb-2.5 text-2xl font-bold text-slate-900">Verifying...</h2>
            <p className="text-slate-500">{message}</p>
          </>
        )}

        {/* Success State */}
        {status === 'success' && (
          <>
            <CheckCircle2 size={56} color="#22C55E" className="mx-auto mb-5" />
            <h2 className="mb-2.5 text-2xl font-bold text-slate-900">Verified!</h2>
            <p className="mb-6 text-slate-500">{message}</p>
            <button 
              onClick={() => navigate('/login')}
              className="w-full px-4 py-3 font-semibold text-white transition-colors rounded-lg bg-[#0B1EAE] hover:bg-[#081682]"
            >
              Go to Login
            </button>
          </>
        )}

        {/* Error State */}
        {status === 'error' && (
          <>
            <AlertCircle size={56} color="#EF4444" className="mx-auto mb-5" />
            <h2 className="mb-2.5 text-2xl font-bold text-slate-900">Verification Failed</h2>
            <p className="mb-6 text-slate-500">{message}</p>
            <button 
              onClick={() => navigate('/login')}
              className="w-full px-4 py-3 font-semibold transition-colors rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              Return to Login
            </button>
          </>
        )}

      </div>
    </div>
  );
}