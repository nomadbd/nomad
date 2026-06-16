import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function AuthForm() {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const getFriendlyMessage = (errorMsg: string) => {
    if (errorMsg.includes('Invalid login credentials')) return 'Incorrect email or password.';
    if (errorMsg.includes('User already registered')) return 'This email is already in use.';
    return errorMsg;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    if (view === 'signup') {
      const finalUsername = username || email.split('@')[0];
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { username: finalUsername } }
      });
      if (error) {
        setIsError(true);
        setMessage(getFriendlyMessage(error.message));
      } else {
        setMessage('Account created! Please check your email.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setIsError(true);
        setMessage(getFriendlyMessage(error.message));
      } else {
        setMessage('Welcome back!');
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://nomadbd.vercel.app/reset-password',
    });
    if (error) {
      setIsError(true);
      setMessage(getFriendlyMessage(error.message));
    } else {
      setMessage('Reset link sent! Please check your email.');
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 0', backgroundColor: 'transparent',
    border: 'none', borderBottom: '1px solid #ffffff', fontSize: '15px',
    marginBottom: '20px', outline: 'none', color: '#ffffff', letterSpacing: '0.5px'
  };

  return (
    <div style={{ width: '100%', maxWidth: '320px', color: '#ffffff', fontFamily: 'sans-serif' }}>
      <h2 style={{ letterSpacing: '6px', marginBottom: '50px', fontWeight: '200', textAlign: 'center' }}>NOMAD</h2>
      
      <form onSubmit={view === 'forgot' ? handleForgotPassword : handleAuth}>
        <input type="text" placeholder="Email or Username" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        
        {(view === 'login' || view === 'signup') && (
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
        )}

        {view === 'signup' && (
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} />
        )}
        
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#fff', color: '#000', border: 'none', cursor: 'pointer', marginTop: '10px', fontSize: '12px', letterSpacing: '2px', fontWeight: 'bold' }}>
          {loading ? 'PROCESSING...' : view === 'login' ? 'SIGN IN' : view === 'signup' ? 'SIGN UP' : 'SEND LINK'}
        </button>
      </form>

      {view === 'login' && (
        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '10px', letterSpacing: '1px' }}>
          <span onClick={() => setView('forgot')} style={{ cursor: 'pointer', color: '#777' }}>FORGOT PASSWORD?</span>
          <span onClick={() => setView('signup')} style={{ cursor: 'pointer', color: '#777' }}>SIGN UP</span>
        </div>
      )}
      
      {(view === 'signup' || view === 'forgot') && (
        <p onClick={() => setView('login')} style={{ textAlign: 'center', fontSize: '10px', cursor: 'pointer', marginTop: '30px', letterSpacing: '1px', color: '#fff' }}>
          BACK TO LOGIN
        </p>
      )}

      {/* আপডেট করা লাল রঙের মেসেজ */}
      {message && (
        <p style={{ 
          fontSize: '11px', textAlign: 'center', marginTop: '20px', 
          color: isError ? '#ff4d4d' : '#ffffff', 
          fontWeight: isError ? 'bold' : 'normal',
          letterSpacing: '0.5px' 
        }}>
          {message}
        </p>
      )}
    </div>
  );
}
