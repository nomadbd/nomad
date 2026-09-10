import React, { useState } from 'react';

const SendInvite: React.FC = () => {
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [expirationPeriod, setExpirationPeriod] = useState('7d');
  const [welcomeMessage, setWelcomeMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // এখানে আপনার ইনভাইটেশন সাবমিট লজিক দিন
    console.log({
      recipientName,
      recipientEmail,
      customSlug,
      expirationPeriod,
      welcomeMessage
    });
  };

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <style>{`
        .invite-card {
          background-color: #090909;
          border: 1px solid #1a1a1a;
          border-radius: 8px;
          padding: 16px;
          color: #fff;
          font-family: monospace, sans-serif;
          box-sizing: border-box;
        }

        .invite-grid {
          display: grid;
          grid-template-columns: 1fr; /* মোবাইলে ১ কলাম */
          gap: 16px;
        }

        /* বড় স্ক্রিনে (৬৪০ পিক্সেলের উপরে) ২ কলাম হবে */
        @media (min-width: 640px) {
          .invite-card {
            padding: 28px;
          }
          .invite-grid {
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
        }

        .invite-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }

        .invite-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #a0a0a0;
          text-transform: uppercase;
        }

        .invite-input, .invite-select, .invite-textarea {
          width: 100%;
          background-color: #141414;
          border: 1px solid #262626;
          border-radius: 4px;
          padding: 12px;
          color: #ffffff;
          font-family: inherit;
          font-size: 13px;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .invite-input:focus, .invite-select:focus, .invite-textarea:focus {
          border-color: #555555;
        }

        .invite-input::placeholder, .invite-textarea::placeholder {
          color: #555555;
        }

        .invite-btn {
          width: 100%;
          background-color: #ffffff;
          color: #000000;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 1.5px;
          padding: 14px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          text-transform: uppercase;
          margin-top: 20px;
          transition: background-color 0.2s ease;
        }

        .invite-btn:hover {
          background-color: #e0e0e0;
        }

        .slug-preview {
          font-size: 10px;
          color: #666;
          margin-top: 4px;
          word-break: break-all;
        }
      `}</style>

      <div className="invite-card">
        <div style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '9px', color: '#666', letterSpacing: '2px', fontWeight: 'bold' }}>
            VIP AMBASSADOR MANAGEMENT
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '2px', marginTop: '4px' }}>
            CREATE VIP INVITATION
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="invite-grid">
            <div className="invite-field">
              <label className="invite-label">RECIPIENT NAME / IDENTIFIER *</label>
              <input
                type="text"
                className="invite-input"
                placeholder="e.g. John Doe"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
              />
            </div>

            <div className="invite-field">
              <label className="invite-label">RECIPIENT EMAIL (OPTIONAL)</label>
              <input
                type="email"
                className="invite-input"
                placeholder="john@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>

            <div className="invite-field">
              <label className="invite-label">CUSTOM LINK SLUG / TOKEN</label>
              <input
                type="text"
                className="invite-input"
                placeholder="e.g. john-doe"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
              />
              <span className="slug-preview">
                Preview: https://nomadbd.vercel.app/{customSlug || 'custom-slug'}
              </span>
            </div>

            <div className="invite-field">
              <label className="invite-label">LINK EXPIRATION PERIOD</label>
              <select
                className="invite-select"
                value={expirationPeriod}
                onChange={(e) => setExpirationPeriod(e.target.value)}
              >
                <option value="1d">1 Day Validity</option>
                <option value="7d">7 Days Validity</option>
                <option value="30d">30 Days Validity</option>
                <option value="never">Never Expires</option>
              </select>
            </div>
          </div>

          <div className="invite-field" style={{ marginTop: '16px' }}>
            <label className="invite-label">PERSONALIZED WELCOME MESSAGE</label>
            <textarea
              className="invite-textarea"
              rows={4}
              placeholder="Write a custom note for this ambassador..."
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
            />
          </div>

          <button type="submit" className="invite-btn">
            GENERATE VIP INVITATION
          </button>
        </form>
      </div>
    </div>
  );
};

export default SendInvite;
