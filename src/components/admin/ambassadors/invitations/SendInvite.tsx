import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { SendIcon } from '@/components/icons';

interface SendInviteProps {
  isOpen?: boolean;
  onClose?: () => void;
  onInviteSuccess?: () => void;
}

const SendInvite: React.FC<SendInviteProps> = ({ isOpen = true, onClose, onInviteSuccess }) => {
  const [recipientName, setRecipientName] = useState('');
  const [validityDays, setValidityDays] = useState<number | string>(7);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [loadingAction, setLoadingAction] = useState<'email' | 'whatsapp' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ইনভাইট তৈরি ও ডাটাবেজে সেভ করার কমন ফাংশন
  const createInviteData = async () => {
    if (!recipientName.trim()) {
      throw new Error('RECIPIENT NAME IS REQUIRED');
    }

    const name = recipientName.trim();
    const token = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const days = Number(validityDays) > 0 ? Number(validityDays) : 7;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const targetIdentifier = email.trim() || phone.trim() || 'N/A';

    const { error } = await supabase
      .from('ambassador')
      .upsert(
        {
          display_name: name,
          recipient_identifier: targetIdentifier,
          assigned_slug: token,
          token: token,
          is_registered: false,
          is_active: true,
          invite_sent_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: 'token' }
      );

    if (error) throw error;

    const inviteUrl = `https://nomadbd.vercel.app/invite/${token}`;
    
    // অত্যন্ত প্রফেশনাল ও প্রিমিয়াম অফিশিয়াল চিঠি
    const message = `NOMAD | OFFICIAL VIP AMBASSADOR INVITATION\n\nDear ${name},\n\nIt is our distinct privilege to officially nominate you as an Exclusive VIP Ambassador for NOMAD.\n\nPlease access your private portal to claim your credentials:\n${inviteUrl}\n\nKindly note that this private portal access remains active for ${days} days.\n\nYours sincerely,\nNOMAD Executive Office`;

    return { name, token, message };
  };

  // ইমেইল মাধ্যমে ইনভাইট পাঠানো
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('PLEASE ENTER AN EMAIL ADDRESS');
      return;
    }

    setErrorMessage(null);
    setLoadingAction('email');

    try {
      const { message } = await createInviteData();
      const subject = 'NOMAD | Official VIP Ambassador Nomination';
      
      window.location.href = `mailto:${email.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

      if (onInviteSuccess) onInviteSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      console.error('Email Invite Error:', err);
      setErrorMessage(err.message || 'FAILED TO PROCESS EMAIL INVITATION');
    } finally {
      setLoadingAction(null);
    }
  };

  // হোয়াটসঅ্যাপ মাধ্যমে ইনভাইট পাঠানো
  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setErrorMessage('PLEASE ENTER A PHONE NUMBER');
      return;
    }

    setErrorMessage(null);
    setLoadingAction('whatsapp');

    try {
      const { message } = await createInviteData();
      const cleanPhone = phone.replace(/[^0-9+]/g, '');
      const formattedPhone = cleanPhone.startsWith('0') ? `88${cleanPhone}` : cleanPhone;

      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');

      if (onInviteSuccess) onInviteSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      console.error('WhatsApp Invite Error:', err);
      setErrorMessage(err.message || 'FAILED TO PROCESS WHATSAPP INVITATION');
    } finally {
      setLoadingAction(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="invite-modal-overlay" onClick={onClose}>
      <div className="invite-wrapper" onClick={(e) => e.stopPropagation()}>
        <style>{`
          .invite-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(3, 3, 3, 0.88);
            backdrop-filter: blur(10px);
            z-index: 1200;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .invite-wrapper {
            width: 100%;
            max-width: 380px;
            background: #050505;
            border: 1px solid #1a1a1a;
            padding: 32px 28px;
            font-family: monospace, sans-serif;
            color: #ffffff;
            position: relative;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9);
          }

          .close-modal-btn {
            position: absolute;
            top: 18px;
            right: 18px;
            background: transparent;
            border: none;
            color: #666666;
            font-size: 16px;
            cursor: pointer;
            padding: 4px;
            transition: color 0.2s ease;
          }

          .close-modal-btn:hover {
            color: #ffffff;
          }

          .invite-header {
            margin-bottom: 28px;
          }

          .invite-title {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: #ffffff;
            margin: 0;
          }

          .form-group-container {
            display: flex;
            flex-direction: column;
            gap: 22px;
          }

          .minimal-input {
            width: 100%;
            background: transparent !important;
            border: none !important;
            border-bottom: 1px solid #ffffff !important;
            border-radius: 0 !important;
            padding: 8px 0 !important;
            color: #ffffff !important;
            font-family: inherit !important;
            font-size: 12px !important;
            outline: none !important;
            box-shadow: none !important;
            box-sizing: border-box;
            letter-spacing: 0.5px;
          }

          .minimal-input::placeholder {
            color: #888888 !important;
            opacity: 1 !important;
          }

          .input-action-row {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
          }

          .send-icon-btn {
            background: #ffffff;
            color: #000000;
            border: none;
            padding: 8px 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: opacity 0.2s ease, transform 0.1s ease;
            height: 33px;
            min-width: 42px;
          }

          .send-icon-btn:hover {
            opacity: 0.88;
          }

          .send-icon-btn:active {
            transform: scale(0.96);
          }

          .send-icon-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          .error-box {
            font-size: 9px;
            color: #ef4444;
            background: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.2);
            padding: 8px 10px;
            margin-bottom: 18px;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
        `}</style>

        {onClose && (
          <button type="button" className="close-modal-btn" onClick={onClose} title="Close">
            ✕
          </button>
        )}

        <div className="invite-header">
          <h2 className="invite-title">VIP INVITATION</h2>
        </div>

        {errorMessage && <div className="error-box">{errorMessage}</div>}

        <div className="form-group-container">
          {/* ১. প্রাপকের নাম */}
          <input
            type="text"
            className="minimal-input"
            placeholder="Recipient Name"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            required
            autoComplete="off"
          />

          {/* ২. লিংকের মেয়াদের দিন */}
          <input
            type="number"
            className="minimal-input"
            placeholder="Validity (Days)"
            value={validityDays}
            onChange={(e) => setValidityDays(e.target.value)}
            min="1"
            required
            autoComplete="off"
          />

          {/* ৩. ইমেইল ইনপুট এবং সেন্ড বাটন */}
          <form onSubmit={handleSendEmail} className="input-action-row">
            <input
              type="email"
              className="minimal-input"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
            <button
              type="submit"
              className="send-icon-btn"
              title="Send via Email"
              disabled={loadingAction === 'email'}
            >
              {loadingAction === 'email' ? '...' : <SendIcon size={13} color="#000000" />}
            </button>
          </form>

          {/* ৪. হোয়াটসঅ্যাপ/ফোন ইনপুট এবং সেন্ড বাটন */}
          <form onSubmit={handleSendWhatsApp} className="input-action-row">
            <input
              type="text"
              className="minimal-input"
              placeholder="WhatsApp Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="off"
            />
            <button
              type="submit"
              className="send-icon-btn"
              title="Send via WhatsApp"
              disabled={loadingAction === 'whatsapp'}
            >
              {loadingAction === 'whatsapp' ? '...' : <SendIcon size={13} color="#000000" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendInvite;
