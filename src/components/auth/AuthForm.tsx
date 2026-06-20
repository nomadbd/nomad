import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function AuthForm() {
  const [view, setView] = useState<'login' | 'signup' | 'forgot' | 'update'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const location = useLocation();

  useEffect(() => {
    // URL থেকে রিকভারি টোকেন চেক করার জন্য শক্তিশালী লজিক
    const hash = window.location.hash;
    const search = window.location.search;
    
    if (hash.includes('type=recovery') || search.includes('type=recovery')) {
      setView('update');
    }
  }, [location]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    let error = null;

    try {
      if (view === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        error = signUpError;
        if (!error) setMessage({ text: 'CHECK YOUR EMAIL TO CONFIRM!', isError: false });
      } 
      else if (view === 'login') {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        error = loginError;
        if (!error) window.location.href = '/profile';
      } 
      else if (view === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        error = resetError;
        if (!error) setMessage({ text: 'PASSWORD RESET LINK SENT!', isError: false });
      } 
      else if (view === 'update') {
        // পাসওয়ার্ড আপডেটের সময় সেশন চেক করা
        const { error: updateError } = await supabase.auth.updateUser({ password: password });
        error = updateError;
        if (!error) {
          setMessage({ text: 'PASSWORD UPDATED SUCCESSFULLY!', isError: false });
          setTimeout(() => window.location.href = '/profile', 1500);
        }
      }
    } catch (e: any) {
      error = e;
    }

    if (error) {
      setMessage({ text: error.message.toUpperCase(), isError: true });
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 0', backgroundColor: 'transparent', 
    border: 'none', borderBottom: '1px solid #ffffff', 
    color: '#ffffff', marginBottom: '20px', outline: 'none',
  };

  return (
    <div style={{ width: '100%', maxWidth: '320px', color: '#ffffff', fontFamily: 'sans-serif', margin: 'auto', paddingTop: '100px' }}>
      <h2 style={{ letterSpacing: '6px', marginBottom: '50px', fontWeight: '200', textAlign: 'center' }}>NOMAD</h2>
      <form onSubmit={handleAuth}>
        {view !== 'update' && (
          <input type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        )}
        {view !== 'forgot' && (
          <input type="password" placeholder={view === 'update' ? "NEW PASSWORD" : "PASSWORD"} value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
        )}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#fff', color: '#000', border: 'none', cursor: 'pointer', fontSize: '10px', letterSpacing: '2px' }}>
          {loading ? 'PROCESSING...' : view === 'login' ? 'SIGN IN' : view === 'signup' ? 'SIGN UP' : view === 'update' ? 'UPDATE PASSWORD' : 'SEND RESET LINK'}
        </button>
      </form>
      {message && <div style={{ textAlign: 'center', marginTop: '25px', color: message.isError ? '#ff4d4d' : '#4dff4d', fontSize: '10px' }}>{message.text}</div>}
      
      {view !== 'update' && (
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px', cursor: 'pointer' }}>
          {view === 'login' && <p onClick={() => setView('signup')}>NEED AN ACCOUNT? SIGN UP</p>}
          {view === 'login' && <p onClick={() => setView('forgot')}>FORGOT PASSWORD?</p>}
          {view !== 'login' && <p onClick={() => setView('login')}>BACK TO LOGIN</p>}
        </div>
      )}
    </div>
  );
}
