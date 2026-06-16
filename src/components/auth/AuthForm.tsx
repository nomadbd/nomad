import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function AuthForm() {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // ইনপুট বক্সের জন্য স্টাইল (অটোফিল এবং সবুজ বক্স বন্ধ করার স্টাইলসহ)
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setIsError(true);
        setMessage(error.message);
      } else {
        setMessage('Check your email to confirm your account!');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
        setIsError(true);
        setMessage('Invalid email or password.');
      } else {
        window.location.href = '/profile';
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ width: '100%', maxWidth: '320px', color: '#ffffff', fontFamily: 'sans-serif' }}>
      <h2 style={{ letterSpacing: '6px', marginBottom: '50px', fontWeight: '200', textAlign: 'center' }}>NOMAD</h2>
      <form onSubmit={handleAuth}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={inputStyle}
          autoComplete="off" // ব্রাউজারকে অটোফিল করতে বাধা দিচ্ছে
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={inputStyle}
          autoComplete="new-password" // পাসওয়ার্ড বক্সের সবুজ বক্স আটকাবে
        />

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#fff', color: '#000', border: 'none', cursor: 'pointer' }}>
          {loading ? 'PROCESSING...' : view === 'login' ? 'SIGN IN' : 'SIGN UP'}
        </button>
      </form>
      <p onClick={() => setView(view === 'login' ? 'signup' : 'login')} style={{ textAlign: 'center', fontSize: '10px', cursor: 'pointer', marginTop: '20px' }}>
        {view === 'login' ? 'NEED AN ACCOUNT? SIGN UP' : 'BACK TO LOGIN'}
      </p>
      {message && <p style={{ textAlign: 'center', marginTop: '20px', color: isError ? '#ff4d4d' : '#fff', fontSize: '12px' }}>{message}</p>}
    </div>
  );
}
