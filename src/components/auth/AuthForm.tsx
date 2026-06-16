import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) setMessage(`Error: ${error.message}`);
      else setMessage('Registration successful! Please check your email.');
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(`Error: ${error.message}`);
      else setMessage(`Welcome back!`);
    }
    setLoading(false);
  };

  // প্রিমিয়াম স্টাইল
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 0', backgroundColor: 'transparent',
    border: 'none', borderBottom: '1px solid #333', fontSize: '16px',
    marginBottom: '20px', outline: 'none'
  };

  return (
    <div style={{ width: '100%', maxWidth: '350px', padding: '40px', backgroundColor: '#f4f4f4' }}>
      <h2 style={{ textAlign: 'center', letterSpacing: '3px', marginBottom: '40px', fontWeight: '300' }}>NOMAD</h2>
      <form onSubmit={handleAuth}>
        {isSignUp && (
          <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={inputStyle} />
        )}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
        
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', marginTop: '10px' }}>
          {loading ? 'Processing...' : isSignUp ? 'SIGN UP' : 'SIGN IN'}
        </button>
      </form>
      {message && <p style={{ fontSize: '12px', textAlign: 'center', color: message.startsWith('Error') ? 'red' : 'green' }}>{message}</p>}
      <p onClick={() => setIsSignUp(!isSignUp)} style={{ textAlign: 'center', fontSize: '12px', cursor: 'pointer', marginTop: '20px', textDecoration: 'underline' }}>
        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
      </p>
    </div>
  );
}
