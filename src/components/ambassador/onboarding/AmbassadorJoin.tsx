import React, { useEffect, useState } from 'react';
import { AmbassadorJoinProps } from '@/types/ambassador';
import { toTitleCase } from '@/utils/string';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEmailCheck } from '@/hooks/useEmailCheck';
import { useConciergeChat } from '@/hooks/useConciergeChat';

import { BenefitCard } from './BenefitCard';
import { ExpiredView } from './ExpiredView';
import { JoinSheet } from './JoinSheet';
import { ConciergeModal } from './ConciergeModal';

import {
  containerStyle,
  mainWrapperStyle,
  titleStyle,
  descStyle,
  pillButtonStyle,
  footerStyle,
  footerLinksContainerStyle,
  footerLinkStyle,
  dotStyle
} from './styles';

export default function AmbassadorJoin({ initialInviteData }: AmbassadorJoinProps) {
  const [inviteData] = useState(initialInviteData);
  const [isExpired, setIsExpired] = useState(false);
  const [reissueSubmitted, setReissueSubmitted] = useState(false);

  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');

  const [isPageMounted, setIsPageMounted] = useState(false);
  const [isJoinSheetOpen, setIsJoinSheetOpen] = useState(false);
  const [isJoinSheetAnimating, setIsJoinSheetAnimating] = useState(false);

  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  const [customSupportEmail, setCustomSupportEmail] = useState('');

  // Values calculation
  const rawDisplayName = inviteData?.display_name || 'GUEST';
  const headerDisplayName = rawDisplayName.toUpperCase();
  const defaultTitleName = toTitleCase(rawDisplayName);

  const defaultEmail = (
    inviteData?.email ||
    (inviteData?.recipient_identifier && inviteData?.recipient_identifier.includes('@')
      ? inviteData.recipient_identifier
      : '')
  ).toLowerCase();

  const commissionRate = inviteData?.commission_rate ?? 15;
  const discountPercent = inviteData?.discount_percent ?? 10;

  // Custom Hooks usage
  const { isCheckingEmail, accountFound } = useEmailCheck(defaultEmail, email);
  
  const {
    messages,
    setMessages,
    isLoadingMessages,
    hasUnread,
    setHasUnread,
    chatContainerRef,
    scrollToBottom
  } = useConciergeChat(inviteData, email, defaultEmail, customSupportEmail, isConciergeOpen);

  const isModalActive = isConciergeOpen || isJoinSheetOpen;
  const { viewportStyle } = useBodyScrollLock(isModalActive, () => {
    if (isConciergeOpen) scrollToBottom(false);
  });

  useEffect(() => {
    setIsPageMounted(true);
  }, []);

  useEffect(() => {
    if (!inviteData) return;

    const isTimeExpired = new Date(inviteData.expires_at || '') < new Date();
    if (isTimeExpired || inviteData.is_registered) {
      setIsExpired(true);
      if (inviteData.reissue_requested) setReissueSubmitted(true);
    }
  }, [inviteData]);

  useEffect(() => {
    if (accountFound === true) setMode('login');
    else if (accountFound === false) setMode('signup');
  }, [accountFound]);

  const handleOpenJoinSheet = () => {
    setIsJoinSheetOpen(true);
    setTimeout(() => setIsJoinSheetAnimating(true), 20);
  };

  const handleCloseJoinSheet = () => {
    setIsJoinSheetAnimating(false);
    setTimeout(() => setIsJoinSheetOpen(false), 350);
  };

  const handleOpenConcierge = () => {
    setHasUnread(false);
    setIsConciergeOpen(true);
    setTimeout(() => {
      setIsModalAnimating(true);
      scrollToBottom(false);
    }, 20);
  };

  const handleCloseConcierge = () => {
    setIsModalAnimating(false);
    setTimeout(() => setIsConciergeOpen(false), 350);
  };

  if (isExpired) {
    return (
      <ExpiredView
        inviteData={inviteData}
        isPageMounted={isPageMounted}
        reissueSubmitted={reissueSubmitted}
        setReissueSubmitted={setReissueSubmitted}
      />
    );
  }

  return (
    <div style={containerStyle}>
      <div
        style={{
          ...mainWrapperStyle,
          transform: isPageMounted ? 'translateY(0)' : 'translateY(35px)',
          opacity: isPageMounted ? 1 : 0,
          transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s ease'
        }}
      >
        <div>
          <h1 style={titleStyle}>
            WELCOME,
            <br />
            <span style={{ color: '#ffffff', fontWeight: 400, letterSpacing: '3px' }}>{headerDisplayName}</span>
          </h1>

          <p style={descStyle}>
            You have been granted exclusive access to curate selected allocations and represent NOMAD.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <BenefitCard
            number="01"
            title="CURATED ALLOCATION"
            description="Select products from our high-tier ambassador allocation to feature in your private gallery."
          />
          <BenefitCard
            number="02"
            title="AUTOMATED COMMISSIONS"
            description={`Earn a baseline ${commissionRate}% payout with real-time performance tracking for every sales conversion. NOMAD reserves the right to dynamically adjust commission structures based on tier performance.`}
          />
          <BenefitCard
            number="03"
            title="PRIVÉ PRIVILEGES"
            description={`Bespoke invitation links offering an initial ${discountPercent}% VIP pass for your audience, early release access, and direct portal management. Rates and privileges remain subject to periodic revision at NOMAD’s discretion.`}
          />
        </div>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <button type="button" onClick={handleOpenJoinSheet} style={pillButtonStyle}>
            JOIN CIRCLE
          </button>
        </div>

        <div style={footerStyle}>
          <div style={footerLinksContainerStyle}>
            <button
              type="button"
              onClick={handleOpenConcierge}
              style={{
                ...footerLinkStyle,
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              CONCIERGE
              {hasUnread && (
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#ef4444',
                    borderRadius: '50%',
                    display: 'inline-block',
                    boxShadow: '0 0 6px #ef4444'
                  }}
                />
              )}
            </button>
            <span style={dotStyle}>•</span>
            <a href="/terms" style={footerLinkStyle}>TERMS</a>
            <span style={dotStyle}>•</span>
            <a href="/privacy" style={footerLinkStyle}>PRIVACY POLICY</a>
          </div>
          <p style={{ color: '#555555', fontSize: '8px', letterSpacing: '2px', margin: 0, fontWeight: 300 }}>
            © 2026 NOMAD. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>

      {isJoinSheetOpen && (
        <JoinSheet
          inviteData={inviteData}
          mode={mode}
          setMode={setMode}
          defaultEmail={defaultEmail}
          defaultTitleName={defaultTitleName}
          viewportStyle={viewportStyle}
          isJoinSheetAnimating={isJoinSheetAnimating}
          isCheckingEmail={isCheckingEmail}
          accountFound={accountFound}
          email={email}
          setEmail={setEmail}
          onClose={handleCloseJoinSheet}
        />
      )}

      {isConciergeOpen && (
        <ConciergeModal
          inviteData={inviteData}
          email={email}
          defaultEmail={defaultEmail}
          customSupportEmail={customSupportEmail}
          setCustomSupportEmail={setCustomSupportEmail}
          viewportStyle={viewportStyle}
          isModalAnimating={isModalAnimating}
          messages={messages}
          setMessages={setMessages}
          isLoadingMessages={isLoadingMessages}
          chatContainerRef={chatContainerRef}
          scrollToBottom={scrollToBottom}
          onClose={handleCloseConcierge}
        />
      )}
    </div>
  );
}
