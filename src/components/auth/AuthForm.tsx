import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 0', backgroundColor: 'transparent',
    border: 'none', borderBottom: '1px solid #ffffff', fontSize: '16px',
    marginBottom: '20px', outline: 'none', color: '#ffffff'
  };

  return (
    <div style={{ width: '100%', maxWidth: '350px', padding: '40px', backgroundColor: 'transparent', color: '#ffffff' }}>
      <h2 style={{ textAlign: 'center', letterSpacing: '3px', marginBottom: '40px', fontWeight: '300' }}>NOMAD</h2>
      <form onSubmit={(e) => { e.preventDefault(); /* লজিক এখানে */ }}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
        
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', backgroundColor: '#ffffff', color: '#000000', border: 'none', cursor: 'pointer', marginTop: '10px', letterSpacing: '1px', fontWeight: 'bold' }}>
          {loading ? 'PROCESSING...' : isSignUp ? 'SIGN UP' : 'SIGN IN'}
        </button>
      </form>
      <p onClick={() => setIsSignUp(!isSignUp)} style={{ textAlign: 'center', fontSize: '12px', cursor: 'pointer', marginTop: '20px', textDecoration: 'underline', color: '#aaaaaa' }}>
        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
      </p>
    </div>
  );
}
