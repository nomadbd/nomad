import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function AuthForm() {
  const [view, setView] = useState<'login' | 'signup' | 'forgot' | 'verify' | 'update'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 0', backgroundColor: 'transparent', 
    border: 'none', borderBottom: '1px solid #ffffff', 
    color: '#ffffff', marginBottom: '20px', outline: 'none',
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    let error = null;

    try {
      if (view === 'login') {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        error = loginError;
        if (!error) window.location.href = '/profile';
      } else if (view === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        error = signUpError;
        if (!error) setMessage({ text: 'CHECK YOUR EMAIL TO CONFIRM!', isError: false });
      } else if (view === 'forgot') {
        // OTP পাঠানোর লজিক
        const { error: otpError } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
        error = otpError;
        if (!error) setView('verify');
      } else if (view === 'verify') {
        // OTP ভেরিফাই করার লজিক
        const { error: vError } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
        error = vError;
        if (!error) setView('update');
      } else if (view === 'update') {
        const { error: updateError } = await supabase.auth.updateUser({ password: password });
        error = updateError;
        if (!error) {
          setMessage({ text: 'PASSWORD UPDATED!', isError: false });
          setTimeout(() => window.location.href = '/profile', 2000);
        }
      }
    } catch (err: any) {
      error = err;
    }

    if (error) setMessage({ text: error.message.toUpperCase(), isError: true });
    setLoading(false);
  };

  return (
    <div style={{ width: '100%', maxWidth: '320px', color: '#ffffff', fontFamily: 'sans-serif', margin: 'auto', paddingTop: '100px' }}>
      <h2 style={{ letterSpacing: '6px', marginBottom: '50px', fontWeight: '200', textAlign: 'center' }}>NOMAD</h2>

      <form onSubmit={handleAuth}>
        {view !== 'update' && view !== 'verify' && (
          <input type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} autoComplete="email" />
        )}
        
        {view === 'verify' && (
          <input type="text" placeholder="ENTER 6-DIGIT CODE" value={otp} onChange={(e) => setOtp(e.target.value)} required style={inputStyle} />
        )}

        {(view === 'login' || view === 'signup' || view === 'update') && (
          <input type="password" placeholder={view === 'update' ? "NEW PASSWORD" : "PASSWORD"} value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} autoComplete={view === 'update' ? "new-password" : "current-password"} />
        )}

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#fff', color: '#000', border: 'none', cursor: 'pointer', fontSize: '10px', letterSpacing: '2px' }}>
          {loading ? 'PROCESSING...' : view === 'login' ? 'SIGN IN' : view === 'signup' ? 'SIGN UP' : view === 'verify' ? 'VERIFY CODE' : view === 'update' ? 'UPDATE PASSWORD' : 'SEND CODE'}
        </button>
      </form>

      {message && (
        <div style={{ textAlign: 'center', marginTop: '25px', color: message.isError ? '#ff4d4d' : '#4dff4d', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {message.text}
        </div>
      )}

      {view !== 'update' && view !== 'verify' && (
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px', cursor: 'pointer', letterSpacing: '1px' }}>
          {view === 'login' && (
            <>
              <p onClick={() => { setView('signup'); setMessage(null); }}>NEED AN ACCOUNT? SIGN UP</p>
              <p onClick={() => { setView('forgot'); setMessage(null); }} style={{ marginTop: '10px' }}>FORGOT PASSWORD?</p>
            </>
          )}
          {view !== 'login' && <p onClick={() => { setView('login'); setMessage(null); }}>BACK TO LOGIN</p>}
        </div>
      )}
    </div>
  );
}
