import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function AuthForm() {
  const [view, setView] = useState<'login' | 'signup' | 'forgot' | 'verify-otp' | 'update'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/profile');
      } else if (view === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ text: 'CHECK YOUR EMAIL TO CONFIRM!', isError: false });
      } else if (view === 'forgot') {
        // কোড পাঠানোর জন্য
        const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
        if (error) throw error;
        setView('verify-otp');
      } else if (view === 'verify-otp') {
        // কোড ভেরিফাই করার জন্য
        const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
        if (error) throw error;
        setView('update');
      } else if (view === 'update') {
        // নতুন পাসওয়ার্ড সেট করার জন্য
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage({ text: 'PASSWORD UPDATED!', isError: false });
        setTimeout(() => navigate('/profile'), 2000);
      }
    } catch (err: any) {
      setMessage({ text: err.message.toUpperCase(), isError: true });
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = { /* আগের মতো স্টাইল */ };

  return (
    <div style={{ width: '100%', maxWidth: '320px', margin: 'auto', paddingTop: '100px', color: '#fff' }}>
      <form onSubmit={handleAuth}>
        {view !== 'update' && view !== 'verify-otp' && (
          <input type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        )}
        {view === 'verify-otp' && (
          <input type="text" placeholder="ENTER 6-DIGIT CODE" value={otp} onChange={(e) => setOtp(e.target.value)} required style={inputStyle} />
        )}
        {(view === 'login' || view === 'signup' || view === 'update') && (
          <input type="password" placeholder={view === 'update' ? "NEW PASSWORD" : "PASSWORD"} value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
        )}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#fff', cursor: 'pointer' }}>
          {loading ? 'PROCESSING...' : view === 'forgot' ? 'SEND CODE' : view === 'verify-otp' ? 'VERIFY' : 'SUBMIT'}
        </button>
      </form>
      {/* মেসেজ ও নেভিগেশন লিংকগুলো এখানে রাখুন */}
    </div>
  );
}
