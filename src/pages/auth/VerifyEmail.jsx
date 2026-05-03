import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from "../../api/axios";// Make sure this path is correct for your setup

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const apiUrl = searchParams.get('api_url');

  // ✨ THE FIX: We check the URL immediately during initial render!
  // If apiUrl is missing, we start directly in the 'error' state.
  const [status, setStatus] = useState(apiUrl ? 'loading' : 'error');
  const [message, setMessage] = useState(apiUrl ? 'Verifying your email...' : 'Invalid or missing verification link.');

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
      } catch (err) {
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px', width: '90%' }}>
        
        {/* Loading State */}
        {status === 'loading' && (
          <>
            <Loader2 size={48} color="#0B1EAE" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px' }}>Verifying...</h2>
            <p style={{ color: '#64748b' }}>{message}</p>
          </>
        )}

        {/* Success State */}
        {status === 'success' && (
          <>
            <CheckCircle2 size={56} color="#22C55E" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px' }}>Verified!</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>{message}</p>
            <button 
              onClick={() => navigate('/login')}
              style={{ width: '100%', padding: '12px', backgroundColor: '#0B1EAE', color: 'white', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
            >
              Go to Login
            </button>
          </>
        )}

        {/* Error State */}
        {status === 'error' && (
          <>
            <AlertCircle size={56} color="#EF4444" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px' }}>Verification Failed</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>{message}</p>
            <button 
              onClick={() => navigate('/login')}
              style={{ width: '100%', padding: '12px', backgroundColor: '#f1f5f9', color: '#334155', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
            >
              Return to Login
            </button>
          </>
        )}

      </div>
    </div>
  );
}