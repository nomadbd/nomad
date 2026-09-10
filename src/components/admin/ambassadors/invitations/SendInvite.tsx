import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';

interface SendInviteProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

export default function SendInvite({ onBack, onSuccess }: SendInviteProps) {
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [expireDays, setExpireDays] = useState('7');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  // নাম টাইপ করার সাথে সাথে কাস্টম স্লাগ (URL Slug) অটো-জেনারেট করার লজিক
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRecipientName(val);
    // স্পেস তুলে দিয়ে হাইফেন দিয়ে কাস্টম স্লাগ তৈরি (যেমন: john-doe)
    const slugified = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    setCustomSlug(slugified);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || submitting) return;

    setSubmitting(true);
    setErrorMessage('');
    setGeneratedLink('');

    try {
      const token = customSlug || crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expireDays, 10));

      // Supabase 'ambassador' টেবিলে ডাটা ইনসার্ট
      const { error } = await supabase.from('ambassador').insert([
        {
          token: token,
          recipient_identifier: recipientName.trim(),
          recipient_email: recipientEmail.trim() || null,
          initial_admin_message: adminMessage.trim() || null,
          expires_at: expiresAt.toISOString(),
          is_registered: false,
          reissue_requested: false,
        },
      ]);

      if (error) {
        throw new Error(error.message || 'Failed to create invitation.');
      }

      // কাস্টম লিংক ফরম্যাট: domain.com/join/slug-or-token
      const fullInviteLink = `${window.location.origin}/${token}`;
      setGeneratedLink(fullInviteLink);

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong while generating invitation.');
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

  // Premium Dark Theme Styles
  const pageContainerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '32px 24px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #222',
    borderRadius: '12px',
    color: '#ffffff',
    fontFamily: "'Inter', sans-serif",
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    backgroundColor: '#141414',
    border: '1px solid #333',
    color: '#fff',
    borderRadius: '6px',
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: '14px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#aaa',
    display: 'block',
    marginBottom: '8px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '14px 28px',
    backgroundColor: '#ffffff',
    color: '#000000',
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderRadius: '6px',
    letterSpacing: '1px',
    fontSize: '12px',
    transition: 'all 0.2s ease',
  };

  return (
    <div style={pageContainerStyle}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #222', paddingBottom: '20px' }}>
        <div>
          <div style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '3px', color: '#888' }}>
            VIP AMBASSADOR MANAGEMENT
          </div>
          <h1 style={{ margin: '6px 0 0 0', fontSize: '24px', fontWeight: '500', letterSpacing: '1px' }}>
            CREATE VIP INVITATION
          </h1>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            style={{
              padding: '10px 18px',
              backgroundColor: '#141414',
              color: '#ccc',
              border: '1px solid #333',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            ← BACK TO LIST
          </button>
        )}
      </div>

      {errorMessage && (
        <div style={{ padding: '14px', backgroundColor: '#221111', border: '1px solid #552222', color: '#ff4d4d', borderRadius: '6px', marginBottom: '24px', fontSize: '14px' }}>
          {errorMessage}
        </div>
      )}

      {/* লিংক জেনারেট হওয়ার পর সাফল্যবার্তা ও লিংক দেখাবে */}
      {generatedLink ? (
        <div style={{ padding: '28px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px' }}>
          <div style={{ padding: '14px', backgroundColor: '#112211', border: '1px solid #225522', borderRadius: '6px', marginBottom: '24px' }}>
            <p style={{ margin: 0, color: '#4edf4e', fontSize: '14px', fontWeight: 'bold' }}>
              ✓ Exclusive Invitation Generated Successfully!
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>GENERATED INVITATION LINK</label>
            <input type="text" readOnly value={generatedLink} style={{ ...inputStyle, color: '#888', fontWeight: 'bold' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={handleCopy} style={buttonStyle}>
              {copied ? 'COPIED TO CLIPBOARD!' : 'COPY INVITATION LINK'}
            </button>
            <button
              type="button"
              onClick={() => {
                setGeneratedLink('');
                setRecipientName('');
                setRecipientEmail('');
                setAdminMessage('');
              }}
              style={{ ...buttonStyle, backgroundColor: '#141414', color: '#fff', border: '1px solid #333' }}
            >
              CREATE ANOTHER INVITATION
            </button>
          </div>
        </div>
      ) : (
        /* ফর্ম ভিউ (ফুল পেজ) */
        <form onSubmit={handleSendInvite}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>RECIPIENT NAME / IDENTIFIER *</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                style={inputStyle}
                value={recipientName}
                onChange={handleNameChange}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>RECIPIENT EMAIL (OPTIONAL)</label>
              <input
                type="email"
                placeholder="john@example.com"
                style={inputStyle}
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>CUSTOM LINK SLUG / TOKEN</label>
              <input
                type="text"
                placeholder="e.g. john-doe"
                style={inputStyle}
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              />
              <span style={{ fontSize: '11px', color: '#666', marginTop: '4px', display: 'block' }}>
                Preview: {window.location.origin}/{customSlug || 'custom-slug'}
              </span>
            </div>

            <div>
              <label style={labelStyle}>LINK EXPIRATION PERIOD</label>
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
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>PERSONALIZED WELCOME MESSAGE</label>
            <textarea
              placeholder="Write a custom note for this ambassador..."
              style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="submit" disabled={submitting} style={buttonStyle}>
              {submitting ? 'GENERATING...' : 'GENERATE VIP INVITATION LINK'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
