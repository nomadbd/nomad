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
    width: '100%', padding: '12px 0', backgroundColor: 'transparent', 
    border: 'none', borderBottom: '1px solid #ffffff', 
    color: '#ffffff', marginBottom: '20px', outline: 'none',
  };

  const clearMessage = () => { setMessage(''); setIsError(false); };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessage();

    if (view === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setIsError(true); setMessage(error.message); }
      else { setMessage('CHECK YOUR EMAIL TO CONFIRM!'); }
    } else if (view === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setIsError(true); setMessage('INVALID EMAIL OR PASSWORD.'); }
      else { window.location.href = '/profile'; }
    } else if (view === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) { setIsError(true); setMessage(error.message); }
      else { setMessage('PASSWORD RESET LINK SENT!'); }
    }
    setLoading(false);
  };

  return (
    <div style={{ width: '100%', maxWidth: '320px', color: '#ffffff', fontFamily: 'sans-serif', margin: 'auto', paddingTop: '100px' }}>
      <h2 style={{ letterSpacing: '6px', marginBottom: '50px', fontWeight: '200', textAlign: 'center' }}>NOMAD</h2>
      <form onSubmit={handleAuth}>
        <input type="email" placeholder="EMAIL" value={email} onChange={(e) => { setEmail(e.target.value); clearMessage(); }} required style={inputStyle} autoComplete="off" />
        {view !== 'forgot' && (
          <input type="password" placeholder="PASSWORD" value={password} onChange={(e) => { setPassword(e.target.value); clearMessage(); }} required style={inputStyle} autoComplete="new-password" />
        )}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#fff', color: '#000', border: 'none', cursor: 'pointer', fontSize: '10px', letterSpacing: '2px' }}>
          {loading ? 'PROCESSING...' : view === 'login' ? 'SIGN IN' : view === 'signup' ? 'SIGN UP' : 'SEND RESET LINK'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px', cursor: 'pointer', letterSpacing: '1px' }}>
        {view === 'login' && (
          <>
            <p onClick={() => { setView('signup'); clearMessage(); }}>NEED AN ACCOUNT? SIGN UP</p>
            <p onClick={() => { setView('forgot'); clearMessage(); }} style={{ marginTop: '10px' }}>FORGOT PASSWORD?</p>
          </>
        )}
        {view !== 'login' && <p onClick={() => { setView('login'); clearMessage(); }}>BACK TO LOGIN</p>}
      </div>
      {message && (
        <p style={{ textAlign: 'center', marginTop: '25px', color: isError ? '#ff4d4d' : '#fff', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {message}
        </p>
      )}
    </div>
  );
}
