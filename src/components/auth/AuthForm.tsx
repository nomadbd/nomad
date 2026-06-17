import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function AuthForm() {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', 
    padding: '12px 0', 
    backgroundColor: 'transparent', 
    border: 'none', 
    borderBottom: '1px solid #ffffff', 
    color: '#ffffff', 
    marginBottom: '20px',
    outline: 'none',
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    if (view === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setIsError(true); setMessage(error.message); }
      else { setMessage('Check your email to confirm your account!'); }
    } else if (view === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setIsError(true); setMessage('Invalid email or password.'); }
      else { window.location.href = '/profile'; }
    } else if (view === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) { setIsError(true); setMessage(error.message); }
      else { setMessage('Password reset link sent to your email!'); }
    }
    setLoading(false);
  };

  return (
    <div style={{ width: '100%', maxWidth: '320px', color: '#ffffff', fontFamily: 'sans-serif' }}>
      <h2 style={{ letterSpacing: '6px', marginBottom: '50px', fontWeight: '200', textAlign: 'center' }}>NOMAD</h2>
      <form onSubmit={handleAuth}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} autoComplete="off" />
        
        {view !== 'forgot' && (
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} autoComplete="new-password" />
        )}

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#fff', color: '#000', border: 'none', cursor: 'pointer' }}>
          {loading ? 'PROCESSING...' : view === 'login' ? 'SIGN IN' : view === 'signup' ? 'SIGN UP' : 'SEND RESET LINK'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px', cursor: 'pointer' }}>
        {view === 'login' && (
          <>
            <p onClick={() => setView('signup')}>NEED AN ACCOUNT? SIGN UP</p>
            <p onClick={() => setView('forgot')} style={{ marginTop: '10px' }}>FORGOT PASSWORD?</p>
          </>
        )}
        {view !== 'login' && <p onClick={() => setView('login')}>BACK TO LOGIN</p>}
      </div>
      
      {message && <p style={{ textAlign: 'center', marginTop: '20px', color: isError ? '#ff4d4d' : '#fff', fontSize: '12px' }}>{message}</p>}
    </div>
  );
}
