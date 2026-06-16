import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isSignUp) {
      const finalUsername = username || email.split('@')[0];
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: finalUsername } }
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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 0', backgroundColor: 'transparent',
    border: 'none', borderBottom: '1px solid #ffffff', fontSize: '15px',
    marginBottom: '20px', outline: 'none', color: '#ffffff', letterSpacing: '0.5px'
  };

  return (
    <div style={{ width: '100%', maxWidth: '320px', color: '#ffffff', fontFamily: 'sans-serif' }}>
      <h2 style={{ letterSpacing: '6px', marginBottom: '50px', fontWeight: '200', textAlign: 'center' }}>NOMAD</h2>
      <form onSubmit={handleAuth}>
        <input 
          type="text" 
          placeholder="Email or Username" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={inputStyle} 
        />
        {isSignUp && (
          <input 
            type="text" 
            placeholder="Username (optional)" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={inputStyle} 
          />
        )}
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={inputStyle} 
        />
        
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#fff', color: '#000', border: 'none', cursor: 'pointer', marginTop: '10px', fontSize: '12px', letterSpacing: '2px', fontWeight: 'bold' }}>
          {loading ? 'WAIT...' : isSignUp ? 'SIGN UP' : 'SIGN IN'}
        </button>
      </form>
      {message && <p style={{ fontSize: '11px', textAlign: 'center', marginTop: '15px', color: '#aaa' }}>{message}</p>}
      <p onClick={() => setIsSignUp(!isSignUp)} style={{ textAlign: 'center', fontSize: '11px', cursor: 'pointer', marginTop: '30px', letterSpacing: '1px', color: '#777' }}>
        {isSignUp ? 'ALREADY HAVE AN ACCOUNT? SIGN IN' : "DON'T HAVE AN ACCOUNT? SIGN UP"}
      </p>
    </div>
  );
}
