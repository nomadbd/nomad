import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { SendIcon, CloseIcon } from '@/components/icons';

interface SendInviteProps {
  isOpen?: boolean;
  onClose?: () => void;
  onInviteSuccess?: () => void;
}

const SendInvite: React.FC<SendInviteProps> = ({ isOpen = true, onClose, onInviteSuccess }) => {
  const [recipientName, setRecipientName] = useState('');
  const [validityDays, setValidityDays] = useState<number | string>('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [loadingAction, setLoadingAction] = useState<'email' | 'whatsapp' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ওয়ার্নিং ও কনফ্লিক্ট স্টেট
  const [activeConflict, setActiveConflict] = useState<{ type: 'email' | 'whatsapp'; message: string } | null>(null);

  // ইনভাইট সেন্ড ও ডাটাবেজ আপডেট করার মেইন ফাংশন
  const executeInviteSend = async (actionType: 'email' | 'whatsapp', forceSend: boolean = false) => {
    if (!recipientName.trim()) {
      throw new Error('RECIPIENT NAME IS REQUIRED');
    }

    if (!validityDays || Number(validityDays) <= 0) {
      throw new Error('PLEASE ENTER VALIDITY DAYS');
    }

    const name = recipientName.trim();
    // নামের ওপর ভিত্তি করে টোকেন তৈরি (যেমন: Toha -> toha)
    const token = name.toLowerCase().replace(/[^a-z0-9]+/g, '');

    if (!token) {
      throw new Error('PLEASE ENTER A VALID NAME');
    }

    const days = Number(validityDays);
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    // ইমেইল ইনপুট দেওয়া থাকলে সেটি প্রথম অগ্রাধিকার পাবে যেন অনবোর্ডিং পেজে অটো-ফিল হয়
    const primaryIdentifier = trimmedEmail || trimmedPhone;
    const targetIdentifier = actionType === 'email' ? trimmedEmail : trimmedPhone;

    // ১. চেক করা হবে এই টোকেনে আগে কোনো সক্রিয় ইনভাইট আছে কিনা
    if (!forceSend) {
      const { data: existingRecord } = await supabase
        .from('ambassador')
        .select('expires_at, is_active')
        .eq('token', token)
        .maybeSingle();

      if (existingRecord && existingRecord.expires_at) {
        const isStillActive = new Date(existingRecord.expires_at) > new Date();
        if (isStillActive) {
          setActiveConflict({
            type: actionType,
            message: `AN ACTIVE INVITE ALREADY EXISTS FOR "${name.toUpperCase()}". OVERWRITE?`
          });
          return null;
        }
      }
    }

    // ২. মেয়াদের সময় হিসাব (২৪ ঘণ্টা = ১ দিন)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // ৩. ডাটাবেজে সেভ/আপডেট (Upsert) - ইমেইল ও ফোন দুটোই সেভ রাখা হচ্ছে
    const { error } = await supabase
      .from('ambassador')
      .upsert(
        {
          display_name: name,
          recipient_identifier: primaryIdentifier,
          email: trimmedEmail || null,
          phone: trimmedPhone || null,
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

    // সরাসরি site/token লিংক তৈরি
    const inviteUrl = `https://nomadbd.vercel.app/${token}`;

    // শর্ট, মিনিমাল ও এলিগেন্ট মেসেজ
    const message = `NOMAD\nAMBASSADOR INVITATION\n\nDear ${name},\n\nWe would be honored to invite you to join the NOMAD Ambassador Circle.\n\nTo review the details and decide if you would like to accept, please access your private link:\n${inviteUrl}\n\nNote: This link will remain active for ${days} days.\n\nWarm regards,\nNOMAD`;

    return { name, token, message, targetIdentifier };
  };

  // ইমেইল সাবমিট হ্যান্ডলার
  const handleSendEmail = async (e?: React.FormEvent, force: boolean = false) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('PLEASE ENTER AN EMAIL ADDRESS');
      return;
    }

    setErrorMessage(null);
    setActiveConflict(null);
    setLoadingAction('email');

    try {
      const result = await executeInviteSend('email', force);
      if (!result) return;

      const { message, targetIdentifier } = result;
      const subject = 'NOMAD | Ambassador Invitation';

      window.location.href = `mailto:${targetIdentifier}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

      if (onInviteSuccess) onInviteSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      console.error('Email Invite Error:', err);
      setErrorMessage(err.message || 'FAILED TO PROCESS EMAIL INVITATION');
    } finally {
      setLoadingAction(null);
    }
  };

  // হোয়াটসঅ্যাপ সাবমিট হ্যান্ডলার
  const handleSendWhatsApp = async (e?: React.FormEvent, force: boolean = false) => {
    if (e) e.preventDefault();
    if (!phone.trim()) {
      setErrorMessage('PLEASE ENTER A PHONE NUMBER');
      return;
    }

    setErrorMessage(null);
    setActiveConflict(null);
    setLoadingAction('whatsapp');

    try {
      const result = await executeInviteSend('whatsapp', force);
      if (!result) return;

      const { message, targetIdentifier } = result;
      const cleanPhone = targetIdentifier.replace(/[^0-9+]/g, '');
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
            color: #888888;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s ease, transform 0.2s ease;
          }

          .close-modal-btn:hover {
            color: #ffffff;
            transform: scale(1.1);
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
            background: transparent;
            color: #ffffff;
            border: none;
            padding: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: color 0.2s ease, transform 0.1s ease, opacity 0.2s ease;
            height: 33px;
            min-width: 33px;
          }

          .send-icon-btn:hover {
            opacity: 0.9;
            color: #25D366;
          }

          .send-icon-btn:active {
            transform: scale(0.92);
          }

          .send-icon-btn:disabled {
            opacity: 0.3;
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

          .conflict-box {
            font-size: 9px;
            color: #f59e0b;
            background: rgba(245, 158, 11, 0.08);
            border: 1px solid rgba(245, 158, 11, 0.25);
            padding: 10px;
            margin-bottom: 18px;
            letter-spacing: 0.8px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .force-send-btn {
            background: #f59e0b;
            color: #000000;
            border: none;
            padding: 6px 10px;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 1px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            align-self: flex-end;
            transition: opacity 0.2s ease;
          }

          .force-send-btn:hover {
            opacity: 0.88;
          }
        `}</style>

        {onClose && (
          <button type="button" className="close-modal-btn" onClick={onClose} title="Close">
            <CloseIcon size={16} color="currentColor" />
          </button>
        )}

        <div className="invite-header">
          <h2 className="invite-title">VIP INVITATION</h2>
        </div>

        {errorMessage && <div className="error-box">{errorMessage}</div>}

        {activeConflict && (
          <div className="conflict-box">
            <span>{activeConflict.message}</span>
            <button
              type="button"
              className="force-send-btn"
              onClick={() => {
                if (activeConflict.type === 'email') handleSendEmail(undefined, true);
                if (activeConflict.type === 'whatsapp') handleSendWhatsApp(undefined, true);
              }}
            >
              <span>OVERWRITE & SEND ANYWAY</span>
              <SendIcon size={12} color="#000000" />
            </button>
          </div>
        )}

        <div className="form-group-container">
          <input
            type="text"
            className="minimal-input"
            placeholder="Recipient Name"
            value={recipientName}
            onChange={(e) => {
              setRecipientName(e.target.value);
              setActiveConflict(null);
            }}
            required
            autoComplete="off"
          />

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

          <form onSubmit={(e) => handleSendEmail(e, false)} className="input-action-row">
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
              {loadingAction === 'email' ? '...' : <SendIcon size={16} color="currentColor" />}
            </button>
          </form>

          <form onSubmit={(e) => handleSendWhatsApp(e, false)} className="input-action-row">
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
              {loadingAction === 'whatsapp' ? '...' : <SendIcon size={16} color="currentColor" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendInvite;
