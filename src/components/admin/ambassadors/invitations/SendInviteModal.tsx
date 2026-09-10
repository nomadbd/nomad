import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { SendInviteModalProps } from './types';

export default function SendInviteModal({ isOpen, onClose, onSuccess }: SendInviteModalProps) {
  const [recipient, setRecipient] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [expireDays, setExpireDays] = useState('7'); // ডিফল্ট ৭ দিন
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || submitting) return;

    setSubmitting(true);
    setErrorMessage('');
    setGeneratedLink('');

    try {
      // ১. ইউনিক টোকেন ও এক্সপায়ারি ডেট জেনারেট
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expireDays, 10));

      // ২. Supabase-এর 'ambassador' টেবিলে নতুন ইনভাইট রেকর্ড
      const { error } = await supabase.from('ambassador').insert([
        {
          token,
          recipient_identifier: recipient.trim(),
          initial_admin_message: adminMessage.trim() || null,
          expires_at: expiresAt.toISOString(),
          is_registered: false,
          reissue_requested: false,
        },
      ]);

      if (error) {
        throw new Error(error.message || 'Failed to create invitation.');
      }

      // ৩. ক্লায়েন্ট ডোমেইনের সাথে লিংক তৈরি
      const fullInviteLink = `${window.location.origin}/ambassador/join/${token}`;
      setGeneratedLink(fullInviteLink);

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleModalClose = () => {
    // ফর্ম রিসেট
    setRecipient('');
    setAdminMessage('');
    setExpireDays('7');
    setGeneratedLink('');
    setErrorMessage('');
    setCopied(false);
    onClose();
  };

  // Inline CSS Styles (Matching your AmbassadorJoin aesthetic)
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    fontFamily: "'Inter', sans-serif",
  };

  const modalStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '28px',
    boxSizing: 'border-box',
    color: '#fff',
    boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    marginBottom: '16px',
    backgroundColor: '#141414',
    border: '1px solid #333',
    color: '#fff',
    borderRadius: '4px',
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: '14px',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    backgroundColor: '#ffffff',
    color: '#000000',
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderRadius: '4px',
    letterSpacing: '1px',
    fontSize: '12px',
    marginTop: '10px',
  };

  return (
    <div style={overlayStyle} onClick={handleModalClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ textTransform: 'uppercase', fontSize: '10px', letterSpacing: '2px', color: '#888' }}>
              ADMIN CONTROL
            </div>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '500', letterSpacing: '1px' }}>
              ISSUE VIP INVITATION
            </h3>
          </div>
          <button
            onClick={handleModalClose}
            style={{ background: 'none', border: 'none', color: '#666', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <p style={{ color: '#ff4d4d', fontSize: '13px', marginBottom: '16px' }}>{errorMessage}</p>
        )}

        {/* যদি লিংক জেনারেট হয়ে যায় তবে লিংক কপি করার ভিউ দেখাবে */}
        {generatedLink ? (
          <div>
            <div style={{ padding: '14px', backgroundColor: '#112211', border: '1px solid #225522', borderRadius: '4px', marginBottom: '20px' }}>
              <p style={{ margin: 0, color: '#4edf4e', fontSize: '13px', fontWeight: 'bold' }}>
                ✓ Invitation Created Successfully!
              </p>
            </div>

            <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '6px' }}>
              EXCLUSIVE JOIN LINK
            </label>
            <input type="text" readOnly value={generatedLink} style={{ ...inputStyle, marginBottom: '12px', color: '#888' }} />

            <button type="button" onClick={handleCopy} style={buttonStyle}>
              {copied ? 'COPIED TO CLIPBOARD!' : 'COPY INVITATION LINK'}
            </button>

            <button
              type="button"
              onClick={handleModalClose}
              style={{
                ...buttonStyle,
                backgroundColor: 'transparent',
                color: '#888',
                border: '1px solid #333',
                marginTop: '10px',
              }}
            >
              CLOSE
            </button>
          </div>
        ) : (
          /* ফর্ম ভিউ */
          <form onSubmit={handleSendInvite}>
            <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '6px' }}>
              RECIPIENT NAME / EMAIL / IDENTIFIER
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe (john@example.com)"
              style={inputStyle}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
            />

            <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '6px' }}>
              EXPIRATION PERIOD
            </label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={expireDays}
              onChange={(e) => setExpireDays(e.target.value)}
            >
              <option value="3">3 Days Validity</option>
              <option value="7">7 Days Validity</option>
              <option value="14">14 Days Validity</option>
              <option value="30">30 Days Validity</option>
            </select>

            <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '6px' }}>
              PERSONALIZED WELCOME MESSAGE (OPTIONAL)
            </label>
            <textarea
              placeholder="e.g. We are excited to invite you to our exclusive ambassador network..."
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
            />

            <button type="submit" disabled={submitting} style={buttonStyle}>
              {submitting ? 'GENERATING LINK...' : 'GENERATE INVITATION LINK'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
