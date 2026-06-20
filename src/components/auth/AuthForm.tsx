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

  // রিসেট লিঙ্ক থেকে টোকেন চেক করার লজিক উন্নত করা হয়েছে
  useEffect(() => {
    const checkRecoveryMode = () => {
      // হ্যাশ প্যারামিটার চেক (সুপাবেজ ডিফল্ট)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      // কোয়েরি প্যারামিটার চেক (ব্যাকআপ)
      const queryParams = new URLSearchParams(window.location.search);
      
      if (hashParams.get('type') === 'recovery' || queryParams.get('type') === 'recovery') {
        setView('update');
      }
    };
    
    checkRecoveryMode();
  }, [location]);

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

    if (view === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      error = signUpError;
      if (!error) setMessage({ text: 'CHECK YOUR EMAIL TO CONFIRM!', isError: false });
    } else if (view === 'login') {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      error = loginError;
      if (!error) window.location.href = '/profile';
    } else if (view === 'forgot') {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      error = resetError;
      if (!error) setMessage({ text: 'PASSWORD RESET LINK SENT!', isError: false });
    } else if (view === 'update') {
      // পাসওয়ার্ড আপডেট করার সময় সেশন ভ্যালিডেশন নিশ্চিত করা
      const { error: updateError } = await supabase.auth.updateUser({ password: password });
      error = updateError;
      if (!error) {
        setMessage({ text: 'PASSWORD UPDATED SUCCESSFULLY!', isError: false });
        setTimeout(() => { window.location.href = '/profile'; }, 2000);
      }
    }

    if (error) {
      setMessage({ text: error.message.toUpperCase(), isError: true });
    }
    setLoading(false);
  };

  return (
    <div style={{ width: '100%', maxWidth: '320px', color: '#ffffff', fontFamily: 'sans-serif', margin: 'auto', paddingTop: '100px' }}>
      <h2 style={{ letterSpacing: '6px', marginBottom: '50px', fontWeight: '200', textAlign: 'center' }}>NOMAD</h2>

      <form onSubmit={handleAuth}>
        {view !== 'update' && (
          <input type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} autoComplete="email" />
        )}

        {view !== 'forgot' && (
          <input type="password" placeholder={view === 'update' ? "NEW PASSWORD" : "PASSWORD"} value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} autoComplete={view === 'update' ? "new-password" : "current-password"} />
        )}

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#fff', color: '#000', border: 'none', cursor: 'pointer', fontSize: '10px', letterSpacing: '2px' }}>
          {loading ? 'PROCESSING...' : view === 'login' ? 'SIGN IN' : view === 'signup' ? 'SIGN UP' : view === 'update' ? 'UPDATE PASSWORD' : 'SEND RESET LINK'}
        </button>
      </form>

      {message && (
        <div style={{ textAlign: 'center', marginTop: '25px', color: message.isError ? '#ff4d4d' : '#4dff4d', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {message.text}
        </div>
      )}

      {view !== 'update' && (
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
