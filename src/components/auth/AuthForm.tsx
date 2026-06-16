import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function AuthForm() {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [identifier, setIdentifier] = useState(''); // ইমেইল বা মোবাইল বা ইউজারনেম
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    if (view === 'signup') {
      const finalUsername = username || identifier.split('@')[0] || `user_${Math.floor(Math.random() * 1000)}`;
      
      const { data, error } = await supabase.auth.signUp({
        email: identifier, // Supabase এ ইমেইল/ফোন ফিল্ডে এটি যাবে
        password,
        options: { data: { username: finalUsername } }
      });

      if (error) {
        setIsError(true);
        setMessage(error.message);
      } else if (data.user) {
        await supabase.from('profiles').insert([{ id: data.user.id, username: finalUsername, email: identifier }]);
        setMessage('Account created! Please check your email.');
      }
    } else {
      // লগইন: ইমেইল/ফোন দিয়ে সাইন ইন
      const { error } = await supabase.auth.signInWithPassword({ email: identifier, password });
      
      if (error) {
        setIsError(true);
        setMessage('Invalid credentials.');
      } else {
        window.location.href = '/profile'; // সাকসেস হলে প্রোফাইল পেজে রিডাইরেক্ট
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ width: '100%', maxWidth: '320px', color: '#ffffff', fontFamily: 'sans-serif' }}>
      <h2 style={{ letterSpacing: '6px', marginBottom: '50px', fontWeight: '200', textAlign: 'center' }}>NOMAD</h2>
      <form onSubmit={handleAuth}>
        <input 
          type="text" 
          placeholder="Email, Mobile or Username" 
          value={identifier} 
          onChange={(e) => setIdentifier(e.target.value)} 
          required 
          style={{ width: '100%', padding: '12px 0', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #ffffff', color: '#ffffff', marginBottom: '20px' }} 
        />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px 0', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #ffffff', color: '#ffffff', marginBottom: '20px' }} />
        
        {view === 'signup' && (
          <input type="text" placeholder="Username (Optional)" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '12px 0', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #ffffff', color: '#ffffff', marginBottom: '20px' }} />
        )}

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#fff', color: '#000', border: 'none', cursor: 'pointer' }}>
          {loading ? 'PROCESSING...' : view === 'login' ? 'SIGN IN' : 'SIGN UP'}
        </button>
      </form>
      <p onClick={() => setView(view === 'login' ? 'signup' : 'login')} style={{ textAlign: 'center', fontSize: '10px', cursor: 'pointer', marginTop: '20px' }}>
        {view === 'login' ? 'NEED AN ACCOUNT? SIGN UP' : 'BACK TO LOGIN'}
      </p>
      {message && <p style={{ textAlign: 'center', marginTop: '20px', color: isError ? '#ff4d4d' : '#fff' }}>{message}</p>}
    </div>
  );
}
