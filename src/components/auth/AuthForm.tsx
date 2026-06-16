import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // ... আপনার আগের লজিক কোড এখানে থাকবে ...
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '15px 0',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1px solid #a0a0a0',
    fontSize: '16px',
    color: '#333',
    outline: 'none',
    marginBottom: '20px',
  };

  return (
    <div style={{ width: '100%', textAlign: 'center', fontFamily: '"Inter", sans-serif' }}>
      <h1 style={{ letterSpacing: '4px', marginBottom: '40px', fontWeight: '300', color: '#111' }}>NOMAD</h1>
      
      <form onSubmit={handleAuth} style={{ maxWidth: '320px', margin: '0 auto' }}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
        
        <button type="submit" style={{ width: '100%', padding: '15px', marginTop: '20px', backgroundColor: '#111', color: '#fff', border: 'none', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '12px' }}>
          {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <p onClick={() => setIsSignUp(!isSignUp)} style={{ marginTop: '30px', fontSize: '12px', color: '#666', cursor: 'pointer', letterSpacing: '1px' }}>
        {isSignUp ? 'Already a member? Sign In' : 'Create an account'}
      </p>
    </div>
  );
}
