import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Toast } from '../Toast'; // আপনার তৈরি করা টোস্ট কম্পোনেন্ট

export default function AuthForm() {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);

  const showToast = (message: string, color: string = '#fff') => {
    setToast({ message, color });
    setTimeout(() => setToast(null), 3000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 0', backgroundColor: 'transparent', 
    border: 'none', borderBottom: '1px solid #ffffff', 
    color: '#ffffff', marginBottom: '20px', outline: 'none',
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let error = null;

    if (view === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      error = signUpError;
      if (!error) showToast('CHECK YOUR EMAIL TO CONFIRM!', '#4dff4d');
    } else if (view === 'login') {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      error = loginError;
      if (!error) window.location.href = '/profile';
    } else if (view === 'forgot') {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      error = resetError;
      if (!error) showToast('PASSWORD RESET LINK SENT!', '#4dff4d');
    }

    if (error) {
      // এখানে সরাসরি error.message ব্যবহার করা হয়েছে যাতে {} না দেখায়
      showToast(error.message.toUpperCase(), '#ff4d4d');
    }
    setLoading(false);
  };

  return (
    <div style={{ width: '100%', maxWidth: '320px', color: '#ffffff', fontFamily: 'sans-serif', margin: 'auto', paddingTop: '100px' }}>
      
      {/* টোস্ট কম্পোনেন্টটি এখানে যোগ করা হয়েছে */}
      {toast && <Toast message={toast.message} color={toast.color} />}

      <h2 style={{ letterSpacing: '6px', marginBottom: '50px', fontWeight: '200', textAlign: 'center' }}>NOMAD</h2>

      <form onSubmit={handleAuth}>
        <input type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} autoComplete="email" />
        {view !== 'forgot' && (
          <input type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} autoComplete="current-password" />
        )}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#fff', color: '#000', border: 'none', cursor: 'pointer', fontSize: '10px', letterSpacing: '2px' }}>
          {loading ? 'PROCESSING...' : view === 'login' ? 'SIGN IN' : view === 'signup' ? 'SIGN UP' : 'SEND RESET LINK'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px', cursor: 'pointer', letterSpacing: '1px' }}>
        {view === 'login' && (
          <>
            <p onClick={() => { setView('signup'); }}>NEED AN ACCOUNT? SIGN UP</p>
            <p onClick={() => { setView('forgot'); }} style={{ marginTop: '10px' }}>FORGOT PASSWORD?</p>
          </>
        )}
        {view !== 'login' && <p onClick={() => { setView('login'); }}>BACK TO LOGIN</p>}
      </div>
    </div>
  );
}
