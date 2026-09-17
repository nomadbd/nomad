import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { CloseIcon } from '@/components/icons';
import { AmbassadorInviteData } from '@/types/ambassador';
import { toTitleCase } from '@/utils/string';
import {
  modalBackdropStyle,
  bottomSheetBoxStyle,
  modalHeaderStyle,
  tabButtonStyle,
  underlineInputStyle,
  pillButtonStyle
} from './styles';

interface JoinSheetProps {
  inviteData: AmbassadorInviteData;
  mode: 'signup' | 'login';
  setMode: (mode: 'signup' | 'login') => void;
  defaultEmail: string;
  defaultTitleName: string;
  viewportStyle: React.CSSProperties;
  isJoinSheetAnimating: boolean;
  isCheckingEmail: boolean;
  accountFound: boolean | null;
  email: string;
  setEmail: (email: string) => void;
  onClose: () => void;
}

export const JoinSheet: React.FC<JoinSheetProps> = ({
  inviteData,
  mode,
  setMode,
  defaultEmail,
  defaultTitleName,
  viewportStyle,
  isJoinSheetAnimating,
  isCheckingEmail,
  accountFound,
  email,
  setEmail,
  onClose
}) => {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData || submitting) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      let userId = '';
      let userEmail = (email.trim() || defaultEmail).toLowerCase();
      let userName = fullName.trim() ? toTitleCase(fullName.trim()) : defaultTitleName;

      if (!userEmail) {
        throw new Error('PLEASE ENTER A VALID EMAIL ADDRESS');
      }

      if (mode === 'signup') {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userEmail,
          password,
          options: { data: { full_name: userName, role: 'AMBASSADOR' } }
        });

        if (authError || !authData.user) {
          throw new Error(authError?.message || 'SIGN UP FAILED');
        }
        userId = authData.user.id;
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password
        });

        if (authError || !authData.user) {
          throw new Error('INVALID EMAIL OR PASSWORD');
        }
        userId = authData.user.id;
        userEmail = authData.user.email || userEmail;
      }

      const { data: rpcRes, error: rpcErr } = await supabase.rpc('complete_ambassador_registration', {
        invite_token: inviteData.token,
        new_user_id: userId,
        user_email: userEmail,
        user_name: userName
      });

      if (rpcErr || !rpcRes?.success) {
        throw new Error(rpcRes?.message || rpcErr?.message || 'REGISTRATION FAILED');
      }

      window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || 'SOMETHING WENT WRONG');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        ...modalBackdropStyle,
        opacity: isJoinSheetAnimating ? 1 : 0,
        transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...bottomSheetBoxStyle,
          height: viewportStyle.height ? `calc(${viewportStyle.height} - 40px)` : 'auto',
          maxHeight: '90vh',
          transform: isJoinSheetAnimating ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={modalHeaderStyle}>
          <div>
            <span style={{ fontSize: '8px', letterSpacing: '2.5px', color: '#666666', fontWeight: 600, display: 'block' }}>MEMBERSHIP ACCESS</span>
            <h3 style={{ fontSize: '13px', letterSpacing: '3px', fontWeight: 300, color: '#ffffff', margin: 0 }}>AMBASSADOR CIRCLE</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px' }}
          >
            <CloseIcon />
          </button>
        </div>

        <div style={{ padding: '20px 24px 28px 24px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', marginBottom: '16px' }}>
            <button
              type="button"
              style={{ ...tabButtonStyle, borderBottomColor: mode === 'signup' ? '#ffffff' : 'transparent', color: mode === 'signup' ? '#ffffff' : '#666666' }}
              onClick={() => setMode('signup')}
            >
              SIGN UP
            </button>
            <button
              type="button"
              style={{ ...tabButtonStyle, borderBottomColor: mode === 'login' ? '#ffffff' : 'transparent', color: mode === 'login' ? '#ffffff' : '#666666' }}
              onClick={() => setMode('login')}
            >
              LOG IN
            </button>
          </div>

          <div style={{ minHeight: '18px', fontSize: '10px', letterSpacing: '1.5px', fontWeight: 500, textAlign: 'center', marginBottom: '12px' }}>
            {isCheckingEmail && <span style={{ color: '#60a5fa' }}>VERIFYING ACCOUNT...</span>}
            {!isCheckingEmail && accountFound === true && <span style={{ color: '#4ade80' }}>✓ EXISTING ACCOUNT DETECTED</span>}
            {errorMessage && <span style={{ color: '#f87171' }}>{errorMessage}</span>}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <div style={{
              width: '100%',
              maxHeight: mode === 'signup' ? '60px' : '0px',
              opacity: mode === 'signup' ? 1 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.3s ease, opacity 0.25s ease'
            }}>
              <input
                type="text"
                name="ambassador_name_field"
                autoComplete="off"
                style={underlineInputStyle}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={defaultTitleName || "Full Name"}
              />
            </div>

            <div style={{ width: '100%' }}>
              <input
                type="text"
                inputMode="email"
                name="ambassador_user_id"
                autoComplete="off"
                style={underlineInputStyle}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={defaultEmail || "Email Address"}
              />
            </div>

            <div style={{ width: '100%' }}>
              <input
                type="password"
                name="ambassador_password_field"
                autoComplete="new-password"
                style={underlineInputStyle}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Create Password' : 'Password'}
                required
                minLength={6}
              />
            </div>

            <button type="submit" disabled={submitting || isCheckingEmail} style={{ ...pillButtonStyle, width: '100%', marginTop: '10px' }}>
              {submitting
                ? 'PROCESSING...'
                : mode === 'signup'
                  ? 'CONFIRM & JOIN'
                  : 'ENTER PORTAL'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
