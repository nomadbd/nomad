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
    // URL-এ recovery টাইপ আছে কি না তা দেখা
    if (window.location.hash.includes('type=recovery')) {
      setView('update');
    }
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

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = '/profile';
      } else if (view === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ text: 'CHECK YOUR EMAIL!', isError: false });
      } else if (view === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
        setMessage({ text: 'LINK SENT!', isError: false });
      } else if (view === 'update') {
        const { error } = await supabase.auth.updateUser({ password: password });
        if (error) throw error;
        setMessage({ text: 'SUCCESS!', isError: false });
        setTimeout(() => window.location.href = '/profile', 2000);
      }
    } catch (err: any) {
      setMessage({ text: err.message.toUpperCase(), isError: true });
    } finally {
      setLoading(false);
    }
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
          {loading ? '...' : view.toUpperCase()}
        </button>
      </form>
      {message && <p style={{ color: message.isError ? 'red' : 'green', textAlign: 'center', fontSize: '10px' }}>{message.text}</p>}
    </div>
  );
}
