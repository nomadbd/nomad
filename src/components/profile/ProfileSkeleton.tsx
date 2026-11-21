export type ProfileSkeletonVariant =
  | 'auto'
  | 'ambassador'
  | 'customer'
  | 'ambassador-settings'
  | 'customer-settings';

interface ProfileSkeletonProps {
  variant?: ProfileSkeletonVariant;
}

export default function ProfileSkeleton({ variant = 'auto' }: ProfileSkeletonProps) {
  const resolvedVariant: Exclude<ProfileSkeletonVariant, 'auto'> = (() => {
    if (variant !== 'auto') return variant;
    try {
      const savedView = window.localStorage.getItem('profile_view') || window.localStorage.getItem('currentView') || '';
      const savedMode = window.localStorage.getItem('portal_mode') || window.localStorage.getItem('portalMode') || '';
      const isSettings = savedView.toLowerCase().includes('setting');
      const isAmbassador = savedMode.toLowerCase().includes('ambassador');
      if (isSettings) return isAmbassador ? 'ambassador-settings' : 'customer-settings';
      return isAmbassador ? 'ambassador' : 'customer';
    } catch {
      return 'ambassador';
    }
  })();

  const shimmerStyle = {
    backgroundColor: '#262626',
    backgroundImage:
      'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%)',
    backgroundSize: '200% 100%',
    animation: 'fbShimmer 1.35s ease-in-out infinite',
  };

  const cardShellStyle = {
    backgroundColor: '#0D0D0D',
    border: '1px solid #1C1C1C',
    borderRadius: '14px',
    padding: '16px',
  };

  const isSettingsView =
    resolvedVariant === 'ambassador-settings' || resolvedVariant === 'customer-settings';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '540px',
        margin: '0 auto',
        color: '#FFFFFF',
      }}
    >
      <style>{`
        @keyframes fbShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>

      {isSettingsView ? (
        <div>
          {/* Settings Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '16px',
              marginBottom: '24px',
              borderBottom: '1px solid #1A1A1A',
            }}
          >
            <div style={{ ...shimmerStyle, height: '14px', width: '104px', borderRadius: '4px' }} />
            <div style={{ ...shimmerStyle, height: '20px', width: '20px', borderRadius: '6px' }} />
          </div>

          {resolvedVariant === 'ambassador-settings' && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '26px' }}>
              <div style={{ ...shimmerStyle, width: '76px', height: '76px', borderRadius: '50%' }} />
            </div>
          )}

          {/* NAME & EMAIL fields */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ ...shimmerStyle, height: '9px', width: '48px', borderRadius: '3px', marginBottom: '10px' }} />
            <div style={{ ...shimmerStyle, height: '28px', width: '100%', borderRadius: '4px' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ ...shimmerStyle, height: '9px', width: '96px', borderRadius: '3px', marginBottom: '10px' }} />
            <div style={{ ...shimmerStyle, height: '28px', width: '100%', borderRadius: '4px' }} />
          </div>

          {resolvedVariant === 'ambassador-settings' ? (
            <>
              {/* STORE SLUG */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ ...shimmerStyle, height: '9px', width: '76px', borderRadius: '3px' }} />
                  <div style={{ ...shimmerStyle, height: '9px', width: '84px', borderRadius: '3px' }} />
                </div>
                <div style={{ ...shimmerStyle, height: '28px', width: '100%', borderRadius: '4px' }} />
              </div>

              {/* PAYOUT PILLS */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ ...shimmerStyle, height: '9px', width: '132px', borderRadius: '3px', marginBottom: '12px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ ...shimmerStyle, height: '30px', width: '78px', borderRadius: '20px' }} />
                  <div style={{ ...shimmerStyle, height: '30px', width: '82px', borderRadius: '20px' }} />
                  <div style={{ ...shimmerStyle, height: '30px', width: '84px', borderRadius: '20px' }} />
                </div>
              </div>

              {/* PAYOUT NUMBER */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ ...shimmerStyle, height: '9px', width: '98px', borderRadius: '3px', marginBottom: '10px' }} />
                <div style={{ ...shimmerStyle, height: '28px', width: '100%', borderRadius: '4px' }} />
              </div>

              {/* REAL-TIME SALES ALERTS CARD */}
              <div style={{ ...cardShellStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ ...shimmerStyle, height: '12px', width: '130px', borderRadius: '4px' }} />
                <div style={{ ...shimmerStyle, height: '26px', width: '82px', borderRadius: '16px' }} />
              </div>
            </>
          ) : (
            /* Customer Settings bottom actions */
            <div
              style={{
                borderTop: '1px solid #1A1A1A',
                marginTop: '24px',
                paddingTop: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ ...shimmerStyle, height: '11px', width: '132px', borderRadius: '4px' }} />
                <div style={{ ...shimmerStyle, height: '12px', width: '10px', borderRadius: '3px' }} />
              </div>
              <div style={{ ...shimmerStyle, height: '11px', width: '76px', borderRadius: '4px' }} />
              <div style={{ ...shimmerStyle, height: '11px', width: '114px', borderRadius: '4px' }} />
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Top Profile Row (Avatar + Name/Badge/Email + 2 action circles) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '26px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              <div
                style={{
                  ...shimmerStyle,
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    ...shimmerStyle,
                    height: '15px',
                    width: '62%',
                    borderRadius: '4px',
                    marginBottom: '7px',
                  }}
                />
                <div
                  style={{
                    ...shimmerStyle,
                    height: '10px',
                    width: resolvedVariant === 'ambassador' ? '34%' : '54%',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <div style={{ ...shimmerStyle, width: '36px', height: '36px', borderRadius: '50%' }} />
              <div style={{ ...shimmerStyle, width: '36px', height: '36px', borderRadius: '50%' }} />
            </div>
          </div>

          {resolvedVariant === 'ambassador' ? (
            <>
              {/* Storefront link row */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ ...shimmerStyle, height: '9px', width: '148px', borderRadius: '3px', marginBottom: '12px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...shimmerStyle, height: '11px', width: '165px', borderRadius: '4px', marginBottom: '6px' }} />
                    <div style={{ ...shimmerStyle, height: '15px', width: '135px', borderRadius: '4px' }} />
                  </div>
                  <div style={{ ...shimmerStyle, width: '36px', height: '36px', borderRadius: '50%' }} />
                </div>
              </div>

              {/* WALLET CARD */}
              <div style={{ ...cardShellStyle, marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ ...shimmerStyle, height: '10px', width: '64px', borderRadius: '3px' }} />
                  <div style={{ ...shimmerStyle, height: '10px', width: '68px', borderRadius: '3px' }} />
                </div>

                <div
                  style={{
                    backgroundColor: '#131313',
                    border: '1px solid #202020',
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ ...shimmerStyle, height: '9px', width: '112px', borderRadius: '3px', marginBottom: '8px' }} />
                    <div style={{ ...shimmerStyle, height: '22px', width: '48px', borderRadius: '4px' }} />
                  </div>
                  <div style={{ ...shimmerStyle, height: '30px', width: '92px', borderRadius: '8px' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    style={{
                      backgroundColor: '#131313',
                      border: '1px solid #202020',
                      borderRadius: '10px',
                      padding: '12px',
                    }}
                  >
                    <div style={{ ...shimmerStyle, height: '9px', width: '62px', borderRadius: '3px', marginBottom: '8px' }} />
                    <div style={{ ...shimmerStyle, height: '18px', width: '36px', borderRadius: '4px' }} />
                  </div>
                  <div
                    style={{
                      backgroundColor: '#131313',
                      border: '1px solid #202020',
                      borderRadius: '10px',
                      padding: '12px',
                    }}
                  >
                    <div style={{ ...shimmerStyle, height: '9px', width: '88px', borderRadius: '3px', marginBottom: '8px' }} />
                    <div style={{ ...shimmerStyle, height: '18px', width: '36px', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>

              {/* ORDERS 2x2 GRID */}
              <div style={cardShellStyle}>
                <div style={{ ...shimmerStyle, height: '10px', width: '66px', borderRadius: '3px', marginBottom: '14px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[0, 1, 2, 3].map((item) => (
                    <div
                      key={item}
                      style={{
                        backgroundColor: '#131313',
                        border: '1px solid #202020',
                        borderRadius: '10px',
                        padding: '14px',
                      }}
                    >
                      <div style={{ ...shimmerStyle, height: '9px', width: '58%', borderRadius: '3px', marginBottom: '10px' }} />
                      <div style={{ ...shimmerStyle, height: '20px', width: '28px', borderRadius: '4px' }} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ORDER HISTORY HEADER */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '12px',
                  marginBottom: '18px',
                  borderBottom: '1px solid #1A1A1A',
                }}
              >
                <div style={{ ...shimmerStyle, height: '11px', width: '122px', borderRadius: '4px' }} />
                <div style={{ ...shimmerStyle, height: '11px', width: '64px', borderRadius: '4px' }} />
              </div>

              {/* ORDER HISTORY CARD */}
              <div style={cardShellStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ ...shimmerStyle, height: '10px', width: '132px', borderRadius: '3px' }} />
                  <div style={{ ...shimmerStyle, height: '12px', width: '12px', borderRadius: '3px' }} />
                </div>

                <div style={{ display: 'flex', gap: '14px', marginBottom: '18px' }}>
                  <div
                    style={{
                      ...shimmerStyle,
                      width: '74px',
                      height: '92px',
                      borderRadius: '6px',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ ...shimmerStyle, height: '13px', width: '68%', borderRadius: '4px', marginBottom: '10px' }} />
                    <div style={{ ...shimmerStyle, height: '10px', width: '82%', borderRadius: '4px', marginBottom: '8px' }} />
                    <div style={{ ...shimmerStyle, height: '10px', width: '56%', borderRadius: '4px' }} />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '14px',
                    paddingBottom: '16px',
                    borderTop: '1px solid #181818',
                    borderBottom: '1px solid #181818',
                    marginBottom: '18px',
                  }}
                >
                  <div>
                    <div style={{ ...shimmerStyle, height: '9px', width: '86px', borderRadius: '3px', marginBottom: '6px' }} />
                    <div style={{ ...shimmerStyle, height: '18px', width: '78px', borderRadius: '4px' }} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ ...shimmerStyle, height: '9px', width: '82px', borderRadius: '3px', marginBottom: '6px', marginLeft: 'auto' }} />
                    <div style={{ ...shimmerStyle, height: '15px', width: '92px', borderRadius: '4px' }} />
                  </div>
                </div>

                {/* 4 Status Step Dots */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  {[0, 1, 2, 3].map((step) => (
                    <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <div style={{ ...shimmerStyle, width: '20px', height: '20px', borderRadius: '50%' }} />
                      <div style={{ ...shimmerStyle, height: '8px', width: '48px', borderRadius: '3px' }} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
