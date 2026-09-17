import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { SendIcon, CloseIcon } from '@/components/icons';
import styles from './SendInvite.module.css';

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
    <div className={styles.inviteModalOverlay} onClick={onClose}>
      <div className={styles.inviteWrapper} onClick={(e) => e.stopPropagation()}>
        {onClose && (
          <button type="button" className={styles.closeModalBtn} onClick={onClose} title="Close">
            <CloseIcon size={14} color="currentColor" />
          </button>
        )}

        <div className={styles.inviteHeader}>
          <h2 className={styles.inviteTitle}>VIP INVITATION</h2>
        </div>

        {errorMessage && <div className={styles.errorBox}>{errorMessage}</div>}

        {activeConflict && (
          <div className={styles.conflictBox}>
            <span>{activeConflict.message}</span>
            <button
              type="button"
              className={styles.forceSendBtn}
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

        <div className={styles.formGroupContainer}>
          <input
            type="text"
            className={styles.minimalInput}
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
            className={styles.minimalInput}
            placeholder="Validity (Days)"
            value={validityDays}
            onChange={(e) => setValidityDays(e.target.value)}
            min="1"
            required
            autoComplete="off"
          />

          <div className={styles.twoColRow}>
            <input
              type="number"
              className={styles.minimalInput}
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
              className={styles.minimalInput}
              placeholder="Discount (%)"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              min="0"
              step="0.01"
              required
              autoComplete="off"
            />
          </div>

          <form onSubmit={(e) => handleSendEmail(e, false)} className={styles.inputActionRow}>
            <input
              type="email"
              className={styles.minimalInput}
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
            <button
              type="submit"
              className={styles.sendIconBtn}
              title="Send via Email"
              disabled={loadingAction === 'email'}
            >
              {loadingAction === 'email' ? '...' : <SendIcon size={14} color="currentColor" />}
            </button>
          </form>

          <form onSubmit={(e) => handleSendWhatsApp(e, false)} className={styles.inputActionRow}>
            <input
              type="text"
              className={styles.minimalInput}
              placeholder="WhatsApp Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="off"
            />
            <button
              type="submit"
              className={styles.sendIconBtn}
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
