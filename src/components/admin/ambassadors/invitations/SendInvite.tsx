import React, { useState, useMemo } from 'react';
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
  const [copied, setCopied] = useState(false);

  // ইনপুট পরিবর্তনের সাথে সাথে রিয়েল-টাইমে ডায়নামিক ডাটা জেনারেট
  const liveInvite = useMemo(() => {
    const name = recipientName.trim();
    if (!name) return null;

    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const slug = `${baseSlug}`;
    const generatedUrl = `https://nomadbd.vercel.app/invite/${slug}`;
    const message = `OFFICIAL INVITATION | NOMAD VIP PROGRAM\n\nDear ${name},\n\nYou have been nominated to join NOMAD as an exclusive VIP Ambassador.\n\nAccess your private portal:\n${generatedUrl}\n\n(This invitation is confidential and non-transferable.)`;

    return { name, slug, generatedUrl, message };
  }, [recipientName]);

  // ডাটাবেজে সেভ করার ফাংশন
  const saveToDatabase = async () => {
    if (!liveInvite || !recipientIdentifier.trim()) {
      throw new Error('RECIPIENT NAME AND IDENTIFIER ARE REQUIRED');
    }

    const token = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);

    const { error } = await supabase
      .from('ambassador')
      .insert([
        {
          display_name: liveInvite.name,
          recipient_identifier: recipientIdentifier.trim(),
          assigned_slug: `${liveInvite.slug}-${Math.floor(100 + Math.random() * 900)}`,
          token: token,
          is_registered: false,
          is_active: true,
          invite_sent_at: new Date().toISOString(),
        }
      ]);

    if (error) throw error;
    if (onInviteSuccess) onInviteSuccess();
  };

  const handleShare = async () => {
    if (!liveInvite) return;
    setErrorMessage(null);
    setLoading(true);

    try {
      await saveToDatabase();

      if (navigator.share) {
        await navigator.share({
          title: 'NOMAD VIP Invitation',
          text: liveInvite.message,
        });
      } else {
        await handleCopy(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'FAILED TO SAVE INVITATION');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (skipSave = false) => {
    if (!liveInvite) return;
    setErrorMessage(null);
    setLoading(true);

    try {
      if (!skipSave) {
        await saveToDatabase();
      }
      await navigator.clipboard.writeText(liveInvite.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'FAILED TO COPY');
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
            max-width: 420px;
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
            gap: 16px;
            margin-bottom: 24px;
          }

          .input-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
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

          .document-preview {
            margin-top: 16px;
            padding-top: 20px;
            border-top: 1px solid #141414;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .doc-box {
            background: #030303;
            border-left: 2px solid #ffffff;
            padding: 14px;
            font-size: 11px;
            line-height: 1.6;
            color: #a0a0a0;
            white-space: pre-wrap;
            letter-spacing: 0.5px;
          }

          .action-grid {
            display: flex;
            gap: 10px;
          }

          .share-btn {
            flex: 1;
            background: #ffffff;
            color: #000000;
            border: none;
            padding: 12px;
            font-family: inherit;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 2px;
            cursor: pointer;
            text-transform: uppercase;
            transition: opacity 0.2s ease;
          }

          .copy-btn {
            flex: 1;
            background: transparent;
            border: 1px solid #333333;
            color: #ffffff;
            padding: 12px;
            font-family: inherit;
            font-size: 9px;
            letter-spacing: 2px;
            cursor: pointer;
            text-transform: uppercase;
            transition: all 0.2s ease;
          }

          .copy-btn:hover {
            border-color: #ffffff;
          }

          .share-btn:disabled, .copy-btn:disabled {
            opacity: 0.4;
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

        <div className="input-group">
          <div className="input-field">
            <label className="input-label">RECIPIENT NAME</label>
            <input
              type="text"
              className="minimal-input"
              placeholder="e.g. John Doe"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="input-field">
            <label className="input-label">EMAIL / PHONE IDENTIFIER</label>
            <input
              type="text"
              className="minimal-input"
              placeholder="e.g. john@example.com / +88017..."
              value={recipientIdentifier}
              onChange={(e) => setRecipientIdentifier(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        {liveInvite && (
          <div className="document-preview">
            <span className="input-label">OFFICIAL DOCUMENT PREVIEW</span>

            <div className="doc-box">
              {liveInvite.message}
            </div>

            <div className="action-grid">
              <button 
                type="button" 
                className="share-btn" 
                onClick={handleShare}
                disabled={loading || !recipientIdentifier.trim()}
              >
                {loading ? 'PROCESSING...' : 'SHARE INVITATION'}
              </button>
              <button 
                type="button" 
                className="copy-btn" 
                onClick={() => handleCopy(false)}
                disabled={loading || !recipientIdentifier.trim()}
              >
                {copied ? 'COPIED' : 'COPY TEXT'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendInvite;
