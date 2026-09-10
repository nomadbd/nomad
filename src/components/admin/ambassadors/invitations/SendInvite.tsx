import React, { useState } from 'react';

const SendInvite: React.FC = () => {
  const [recipientName, setRecipientName] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName) return;

    const slug = customSlug.trim() 
      ? customSlug.trim().toLowerCase().replace(/\s+/g, '-') 
      : recipientName.trim().toLowerCase().replace(/\s+/g, '-');
    
    const url = `https://nomadbd.vercel.app/vip/${slug}`;
    setGeneratedUrl(url);
  };

  const handleCopy = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="invite-container">
      <style>{`
        .invite-container {
          width: 100%;
          max-width: 420px;
          margin: 40px auto 0 auto;
          padding: 0 12px;
          font-family: monospace, sans-serif;
          color: #ffffff;
        }

        .invite-title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: #ffffff;
          margin-bottom: 40px;
        }

        .invite-form {
          display: flex;
          flex-direction: column;
          gap: 36px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
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
          border-bottom: 1px solid #262626 !important;
          border-radius: 0 !important;
          padding: 8px 0 !important;
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
          margin-top: 12px;
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
          opacity: 0.85;
        }

        .result-box {
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid #1a1a1a;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .url-display {
          font-size: 12px;
          color: #888888;
          word-break: break-all;
          padding: 10px 0;
          border-bottom: 1px solid #222222;
        }

        .copy-btn {
          background: transparent;
          border: 1px solid #333333;
          color: #ffffff;
          padding: 10px;
          font-family: inherit;
          font-size: 9px;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
        }

        .copy-btn:hover {
          background: #ffffff;
          color: #000000;
        }

        @media (max-width: 767px) {
          .invite-container {
            margin-top: 10px;
          }
        }
      `}</style>

      <h2 className="invite-title">CREATE VIP LINK</h2>

      <form className="invite-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">RECIPIENT NAME *</label>
          <input
            type="text"
            className="minimal-input"
            placeholder="John Doe"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">CUSTOM SLUG</label>
          <input
            type="text"
            className="minimal-input"
            placeholder="john-doe"
            value={customSlug}
            onChange={(e) => setCustomSlug(e.target.value)}
          />
        </div>

        <button type="submit" className="submit-btn">
          GENERATE LINK
        </button>
      </form>

      {generatedUrl && (
        <div className="result-box">
          <span className="input-label">GENERATED VIP LINK</span>
          <div className="url-display">{generatedUrl}</div>
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? 'COPIED TO CLIPBOARD' : 'COPY LINK'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SendInvite;
