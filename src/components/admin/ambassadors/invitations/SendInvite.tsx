import React, { useState } from 'react';

const SendInvite: React.FC = () => {
  const [recipientName, setRecipientName] = useState('');
  const [inviteData, setInviteData] = useState<{ name: string; url: string; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) return;

    const name = recipientName.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const token = Math.random().toString(36).substring(2, 7);
    const generatedUrl = `https://nomadbd.vercel.app/invite/${slug}-${token}`;

    // অফিশিয়াল প্রিমিয়াম মেসেজ টেমপ্লেট
    const officialMessage = `OFFICIAL INVITATION | NOMAD VIP PROGRAM\n\nDear ${name},\n\nYou have been nominated to join NOMAD as an exclusive VIP Ambassador.\n\nAccess your private onboarding portal:\n${generatedUrl}\n\n(This invitation link is strictly confidential and non-transferable.)`;

    setInviteData({
      name,
      url: generatedUrl,
      message: officialMessage,
    });
    setCopied(false);
  };

  const handleShare = async () => {
    if (!inviteData) return;

    // ব্রাউজারের নেটিভ শেয়ার অপশন (WhatsApp, Email, Telegram ইত্যাদি)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NOMAD VIP Invitation',
          text: inviteData.message,
        });
      } catch (err) {
        // শেয়ার ক্যান্সেল করলে বা সাপোর্ট না করলে কপির ব্যবস্থা
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    if (!inviteData) return;
    navigator.clipboard.writeText(inviteData.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="invite-wrapper">
      <style>{`
        .invite-wrapper {
          width: 100%;
          max-width: 400px;
          margin: 40px auto 0 auto;
          padding: 0 16px;
          font-family: monospace, sans-serif;
          color: #ffffff;
        }

        .invite-header {
          margin-bottom: 36px;
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
          gap: 12px;
          margin-bottom: 28px;
        }

        .input-label {
          font-size: 9px;
          letter-spacing: 2px;
          color: #555555;
          text-transform: uppercase;
          font-weight: 600;
        }

        .minimal-input {
          width: 100%;
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid #222222 !important;
          border-radius: 0 !important;
          padding: 10px 0 !important;
          color: #ffffff !important;
          font-family: inherit !important;
          font-size: 14px !important;
          outline: none !important;
          transition: border-color 0.3s ease !important;
          box-shadow: none !important;
        }

        .minimal-input:focus {
          border-bottom-color: #ffffff !important;
        }

        .minimal-input::placeholder {
          color: #333333;
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

        .document-preview {
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid #141414;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .doc-box {
          background: #080808;
          border-left: 2px solid #ffffff;
          padding: 16px;
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

        @media (max-width: 767px) {
          .invite-wrapper {
            margin-top: 10px;
          }
        }
      `}</style>

      <div className="invite-header">
        <h2 className="invite-title">VIP INVITATION</h2>
      </div>

      <form onSubmit={handleGenerate}>
        <div className="input-group">
          <label className="input-label">RECIPIENT NAME</label>
          <input
            type="text"
            className="minimal-input"
            placeholder="e.g. John Doe"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            required
            autoComplete="off"
          />
        </div>

        <button type="submit" className="submit-btn">
          GENERATE INVITATION
        </button>
      </form>

      {inviteData && (
        <div className="document-preview">
          <span className="input-label">OFFICIAL DOCUMENT PREVIEW</span>
          
          <div className="doc-box">
            {inviteData.message}
          </div>

          <div className="action-grid">
            <button type="button" className="share-btn" onClick={handleShare}>
              SHARE INVITATION
            </button>
            <button type="button" className="copy-btn" onClick={handleCopy}>
              {copied ? 'COPIED' : 'COPY TEXT'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendInvite;
