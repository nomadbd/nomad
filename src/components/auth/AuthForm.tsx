import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function AuthForm() {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (view === 'signup') {
      const finalUsername = username || email.split('@')[0];
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { username: finalUsername } }
      });
      if (error) setMessage(`Error: ${error.message}`);
      else setMessage('Check your email to confirm!');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(`Error: ${error.message}`);
      else setMessage('Welcome back!');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://nomadbd.vercel.app/reset-password',
    });
    if (error) setMessage(`Error: ${error.message}`);
    else setMessage('Reset link sent! Check your email.');
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
      
      {/* ভিউ অনুযায়ী ফর্ম রেন্ডার হবে */}
      <form onSubmit={view === 'forgot' ? handleForgotPassword : handleAuth}>
        
        {/* ইমেইল ফিল্ড সব ভিউতেই থাকবে */}
        <input type="text" placeholder="Email or Username" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        
        {/* পাসওয়ার্ড ফিল্ড শুধু লগইন ও সাইনআপ ভিউতে দেখাবে */}
        {(view === 'login' || view === 'signup') && (
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
        )}

        {/* ইউজারনেম ফিল্ড শুধু সাইনআপ ভিউতে */}
        {view === 'signup' && (
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} />
        )}
        
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#fff', color: '#000', border: 'none', cursor: 'pointer', marginTop: '10px', fontSize: '12px', letterSpacing: '2px', fontWeight: 'bold' }}>
          {loading ? 'WAIT...' : view === 'login' ? 'SIGN IN' : view === 'signup' ? 'SIGN UP' : 'SEND RESET LINK'}
        </button>
      </form>

      {/* নেভিগেশন টেক্সট */}
      <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '11px', color: '#777' }}>
        {view === 'login' && (
          <>
            <p onClick={() => setView('forgot')} style={{ cursor: 'pointer', marginBottom: '15px' }}>FORGOT PASSWORD?</p>
            <p onClick={() => setView('signup')} style={{ cursor: 'pointer' }}>DON'T HAVE AN ACCOUNT? SIGN UP</p>
          </>
        )}
        {view === 'signup' && <p onClick={() => setView('login')} style={{ cursor: 'pointer' }}>ALREADY HAVE AN ACCOUNT? SIGN IN</p>}
        {view === 'forgot' && <p onClick={() => setView('login')} style={{ cursor: 'pointer' }}>BACK TO LOGIN</p>}
      </div>

      {message && <p style={{ fontSize: '11px', textAlign: 'center', marginTop: '15px', color: '#aaa' }}>{message}</p>}
    </div>
  );
}
