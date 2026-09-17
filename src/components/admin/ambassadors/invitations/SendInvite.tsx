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
  const [commissionRate, setCommissionRate] = useState<number | string>('');
  const [discountPercent, setDiscountPercent] = useState<number | string>('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [loadingAction, setLoadingAction] = useState<'email' | 'whatsapp' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeConflict, setActiveConflict] = useState<{ type: 'email' | 'whatsapp'; message: string } | null>(null);

  const executeInviteSend = async (actionType: 'email' | 'whatsapp', forceSend: boolean = false) => {
    if (!recipientName.trim()) {
      throw new Error('RECIPIENT NAME IS REQUIRED');
    }

    if (!validityDays || Number(validityDays) <= 0) {
      throw new Error('PLEASE ENTER VALIDITY DAYS');
    }

    if (commissionRate === '' || Number(commissionRate) < 0) {
      throw new Error('PLEASE ENTER COMMISSION RATE');
    }

    if (discountPercent === '' || Number(discountPercent) < 0) {
      throw new Error('PLEASE ENTER DISCOUNT PERCENT');
    }

    const name = recipientName.trim();
    const token = name.toLowerCase().replace(/[^a-z0-9]+/g, '');

    if (!token) {
      throw new Error('PLEASE ENTER A VALID NAME');
    }

    const days = Number(validityDays);
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (trimmedEmail) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('email', trimmedEmail)
        .maybeSingle();

      if (existingProfile && existingProfile.role === 'AMBASSADOR') {
        throw new Error('THIS EMAIL IS ALREADY AN ACTIVE AMBASSADOR!');
      }
    }

    const primaryIdentifier = trimmedEmail || trimmedPhone;
    const targetIdentifier = actionType === 'email' ? trimmedEmail : trimmedPhone;

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

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

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
          commission_rate: Number(commissionRate),
          discount_percent: Number(discountPercent),
          is_registered: false,
          is_active: true,
          invite_sent_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: 'token' }
      );

    if (error) throw error;

    const inviteUrl = `https://nomadbd.vercel.app/${token}`;
    const message = `NOMAD\nAMBASSADOR INVITATION\n\nDear ${name},\n\nWe would be honored to invite you to join the NOMAD Ambassador Circle.\n\nTo review the details and decide if you would like to accept, please access your private link:\n${inviteUrl}\n\nNote: This link will remain active for ${days} days.\n\nWarm regards,\nNOMAD`;

    return { name, token, message, targetIdentifier };
  };

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
            background-color: rgba(0, 0, 0, 0.82);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            z-index: 1200;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .invite-wrapper {
            width: 100%;
            max-width: 390px;
            background: linear-gradient(180deg, #09090b 0%, #030303 100%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 34px 28px;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Mono", monospace, sans-serif;
            color: #ffffff;
            position: relative;
            box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.08);
            animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }

          @keyframes scaleUp {
            from { opacity: 0; transform: scale(0.96) translateY(8px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }

          .close-modal-btn {
            position: absolute;
            top: 22px;
            right: 22px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 50%;
            color: #888888;
            cursor: pointer;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }

          .close-modal-btn:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.15);
            transform: scale(1.05);
          }

          .invite-header {
            margin-bottom: 26px;
            text-align: left;
          }

          .invite-title {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 3.5px;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.9);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .invite-title::before {
            content: '';
            display: inline-block;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #ffffff;
          }

          .form-group-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .two-col-row {
            display: flex;
            gap: 14px;
            width: 100%;
          }

          .minimal-input {
            width: 100%;
            background: transparent !important;
            border: none !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.15) !important;
            border-radius: 0 !important;
            padding: 10px 0 !important;
            color: #ffffff !important;
            font-family: inherit !important;
            font-size: 12px !important;
            outline: none !important;
            box-shadow: none !important;
            box-sizing: border-box;
            letter-spacing: 0.5px;
            transition: border-color 0.25s ease;
          }

          .minimal-input::placeholder {
            color: rgba(255, 255, 255, 0.35) !important;
            opacity: 1 !important;
            font-weight: 400;
          }

          .minimal-input:focus {
            border-bottom-color: #ffffff !important;
          }

          .input-action-row {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
          }

          /* ডিম্বাকার (Pill-shaped) স্মল অ্যাকশন বাটন */
          .send-icon-btn {
            background: rgba(255, 255, 255, 0.08);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 9999px; /* Oval / Pill Shape */
            padding: 0 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            height: 32px;
            min-width: 44px;
            font-size: 11px;
            font-weight: 600;
          }

          .send-icon-btn:hover:not(:disabled) {
            background: #ffffff;
            color: #000000;
            border-color: #ffffff;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);
          }

          .send-icon-btn:active:not(:disabled) {
            transform: translateY(0) scale(0.96);
          }

          .send-icon-btn:disabled {
            opacity: 0.25;
            cursor: not-allowed;
          }

          .error-box {
            font-size: 9px;
            color: #f87171;
            background: rgba(248, 113, 113, 0.08);
            border: 1px solid rgba(248, 113, 113, 0.2);
            border-radius: 10px;
            padding: 10px 12px;
            margin-bottom: 16px;
            letter-spacing: 0.8px;
            text-transform: uppercase;
          }

          .conflict-box {
            font-size: 9px;
            color: #fbbf24;
            background: rgba(251, 191, 36, 0.08);
            border: 1px solid rgba(251, 191, 36, 0.22);
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 16px;
            letter-spacing: 0.6px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          /* ডিম্বাকার (Pill-shaped) ফোর্স সেন্ড বাটন */
          .force-send-btn {
            background: #fbbf24;
            color: #000000;
            border: none;
            border-radius: 9999px; /* Oval / Pill shape */
            padding: 6px 14px;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            align-self: flex-end;
            transition: all 0.2s ease;
          }

          .force-send-btn:hover {
            opacity: 0.9;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(251, 191, 36, 0.25);
          }
        `}</style>

        {onClose && (
          <button type="button" className="close-modal-btn" onClick={onClose} title="Close">
            <CloseIcon size={14} color="currentColor" />
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
              <SendIcon size={11} color="#000000" />
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

          <div className="two-col-row">
            <input
              type="number"
              className="minimal-input"
              placeholder="Commission (%)"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              min="0"
              step="0.01"
              required
              autoComplete="off"
            />

            <input
              type="number"
              className="minimal-input"
              placeholder="Discount (%)"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              min="0"
              step="0.01"
              required
              autoComplete="off"
            />
          </div>

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
              {loadingAction === 'email' ? '...' : <SendIcon size={14} color="currentColor" />}
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
              {loadingAction === 'whatsapp' ? '...' : <SendIcon size={14} color="currentColor" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendInvite;
