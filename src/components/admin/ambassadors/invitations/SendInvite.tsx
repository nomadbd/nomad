import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';

interface SendInviteProps {
  isOpen?: boolean;
  onClose?: () => void;
  onInviteSuccess?: () => void;
}

const SendInvite: React.FC<SendInviteProps> = ({ isOpen = true, onClose, onInviteSuccess }) => {
  const [recipientName, setRecipientName] = useState('');
  const [recipientIdentifier, setRecipientIdentifier] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientIdentifier.trim()) return;

    setErrorMessage(null);
    setLoading(true);

    try {
      const name = recipientName.trim();
      const identifier = recipientIdentifier.trim();
      
      // ১. নাম থেকে ছোট ও পরিষ্কার টোকেন তৈরি (যেমন: Liton -> liton)
      const token = name.toLowerCase().replace(/[^a-z0-9]+/g, '');

      // ২. ইনভাইটের মেয়াদ নির্ধারণ (আজ থেকে ৭ দিন পর)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // ৩. Supabase-এ Upsert করা
      const { error } = await supabase
        .from('ambassador')
        .upsert(
          {
            display_name: name,
            recipient_identifier: identifier,
            assigned_slug: token,
            token: token,
            is_registered: false,
            is_active: true,
            invite_sent_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(), // মেয়াদ সেভ হলো
          },
          { onConflict: 'token' }
        );

      if (error) throw error;

      // ৪. শর্ট ইনভাইট লিংক
      const inviteUrl = `https://nomadbd.vercel.app/invite/${token}`;
      const message = `OFFICIAL INVITATION | NOMAD VIP PROGRAM\n\nDear ${name},\n\nYou have been nominated to join NOMAD as an exclusive VIP Ambassador.\n\nAccess your private portal:\n${inviteUrl}`;

      // ৫. সরাসরি মেসেজ বা ইমেইল পাঠানোর ব্যবস্থা
      if (identifier.includes('@')) {
        window.location.href = `mailto:${identifier}?subject=${encodeURIComponent('NOMAD VIP Ambassador Invitation')}&body=${encodeURIComponent(message)}`;
      } else {
        const cleanPhone = identifier.replace(/[^0-9+]/g, '');
        const formattedPhone = cleanPhone.startsWith('0') ? `88${cleanPhone}` : cleanPhone;
        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
      }

      setRecipientName('');
      setRecipientIdentifier('');

      if (onInviteSuccess) onInviteSuccess();
      if (onClose) onClose();

    } catch (err: any) {
      console.error('Error sending invite:', err);
      setErrorMessage(err.message || 'FAILED TO SEND INVITATION');
    } finally {
      setLoading(false);
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
            background-color: rgba(3, 3, 3, 0.85);
            backdrop-filter: blur(8px);
            z-index: 1200;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .invite-wrapper {
            width: 100%;
            max-width: 400px;
            background: #080808;
            border: 1px solid #1f1f1f;
            padding: 28px 24px;
            font-family: monospace, sans-serif;
            color: #ffffff;
            position: relative;
            box-shadow: 0 20px 40px rgba(0,0,0,0.8);
          }

          .close-modal-btn {
            position: absolute;
            top: 16px;
            right: 16px;
            background: transparent;
            border: none;
            color: #888888;
            font-size: 16px;
            cursor: pointer;
            padding: 4px 8px;
            transition: color 0.2s ease;
          }

          .close-modal-btn:hover {
            color: #ffffff;
          }

          .invite-header {
            margin-bottom: 24px;
          }

          .invite-title {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: #ffffff;
          }

          .input-group {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-bottom: 28px;
          }

          .input-field {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .input-label {
            font-size: 9px;
            letter-spacing: 2px;
            color: #666666;
            text-transform: uppercase;
            font-weight: 600;
          }

          .minimal-input {
            width: 100%;
            background: transparent !important;
            border: none !important;
            border-bottom: 1px solid #222222 !important;
            border-radius: 0 !important;
            padding: 8px 0 !important;
            color: #ffffff !important;
            font-family: inherit !important;
            font-size: 13px !important;
            outline: none !important;
            transition: border-color 0.3s ease !important;
            box-shadow: none !important;
            box-sizing: border-box;
          }

          .minimal-input:focus {
            border-bottom-color: #ffffff !important;
          }

          .minimal-input::placeholder {
            color: #333333;
          }

          .error-box {
            font-size: 10px;
            color: #ef4444;
            background: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.2);
            padding: 8px 10px;
            margin-bottom: 16px;
            letter-spacing: 0.5px;
          }

          .submit-btn {
            width: 100%;
            background-color: #ffffff;
            color: #000000;
            border: none;
            padding: 14px;
            font-family: inherit;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            cursor: pointer;
            transition: opacity 0.2s ease;
          }

          .submit-btn:hover {
            opacity: 0.88;
          }

          .submit-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
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

        <form onSubmit={handleSend}>
          <div className="input-group">
            <div className="input-field">
              <label className="input-label">RECIPIENT NAME</label>
              <input
                type="text"
                className="minimal-input"
                placeholder="e.g. Liton"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            <div className="input-field">
              <label className="input-label">EMAIL / PHONE IDENTIFIER</label>
              <input
                type="text"
                className="minimal-input"
                placeholder="e.g. liton@example.com / 015..."
                value={recipientIdentifier}
                onChange={(e) => setRecipientIdentifier(e.target.value)}
                required
                autoComplete="off"
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'SENDING...' : 'SEND INVITATION'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SendInvite;
