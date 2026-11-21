import React from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobalLoading } from '@/context/LoadingContext';

export const GlobalSkeleton: React.FC = () => {
  const { pathname } = useLocation();
  const { skeletonView, isAmbassadorSkeleton } = useGlobalLoading();

  const shimmerStyle: React.CSSProperties = {
    backgroundColor: '#1C1C1F',
    backgroundImage:
      'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%)',
    backgroundSize: '200% 100%',
    animation: 'skeletonShimmer 1.4s ease-in-out infinite',
    borderRadius: '8px',
  };

  const renderProfileHeaderSkeleton = (withBadge = false) => (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 998,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        borderBottom: '1px solid #1F1F22',
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        <div style={{ ...shimmerStyle, width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
          <div style={{ ...shimmerStyle, height: '13px', width: '46%', maxWidth: '150px', borderRadius: '4px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {withBadge && (
              <div style={{ ...shimmerStyle, width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 }} />
            )}
            <div
              style={{
                ...shimmerStyle,
                height: '9px',
                width: withBadge ? '28%' : '36%',
                maxWidth: '120px',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <div style={{ ...shimmerStyle, width: '35px', height: '35px', borderRadius: '50%' }} />
        <div style={{ ...shimmerStyle, width: '35px', height: '35px', borderRadius: '50%' }} />
      </div>
    </div>
  );

  const renderSubViewTopBarSkeleton = (withRightPill = false) => (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 998,
        backgroundColor: '#000000',
        borderBottom: '1px solid #1A1A1A',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ ...shimmerStyle, width: '36px', height: '36px', borderRadius: '50%' }} />
        <div style={{ ...shimmerStyle, width: '112px', height: '16px', borderRadius: '4px' }} />
      </div>

      {withRightPill && (
        <div style={{ ...shimmerStyle, width: '74px', height: '30px', borderRadius: '16px' }} />
      )}
    </div>
  );

  const isUpdatePassword = skeletonView === 'password' || pathname === '/update-password';
  const isSettings =
    !isUpdatePassword &&
    (skeletonView === 'settings' || (!skeletonView && pathname.startsWith('/settings')));
  const isCommunication =
    !isUpdatePassword &&
    !isSettings &&
    (skeletonView === 'communication' ||
      skeletonView === 'chat' ||
      (!skeletonView && (pathname.startsWith('/vip/') || pathname.startsWith('/messages'))));
  const isNotifications =
    !isUpdatePassword &&
    !isSettings &&
    !isCommunication &&
    (skeletonView === 'notifications' || (!skeletonView && pathname.startsWith('/notifications')));
  const isAmbassadorView =
    !isUpdatePassword &&
    !isSettings &&
    !isCommunication &&
    !isNotifications &&
    (skeletonView === 'ambassador' || (!skeletonView && pathname.startsWith('/profile') && isAmbassadorSkeleton));
  const isOrdersView =
    !isUpdatePassword &&
    !isSettings &&
    !isCommunication &&
    !isNotifications &&
    !isAmbassadorView &&
    (skeletonView === 'orders' || (!skeletonView && pathname.startsWith('/profile') && !isAmbassadorSkeleton));
  const isHome =
    !isUpdatePassword &&
    !isSettings &&
    !isCommunication &&
    !isNotifications &&
    !isAmbassadorView &&
    !isOrdersView &&
    (skeletonView === 'home' || pathname === '/');

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#000000',
        color: '#FFFFFF',
        padding: '20px 16px',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {isHome && (
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ ...shimmerStyle, height: '360px', width: '100%', marginBottom: '32px' }} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '12px',
              marginBottom: '20px',
              borderBottom: '1px solid #141414',
            }}
          >
            <div style={{ ...shimmerStyle, width: '130px', height: '14px', borderRadius: '4px' }} />
            <div style={{ ...shimmerStyle, width: '72px', height: '14px', borderRadius: '4px' }} />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '24px',
            }}
          >
            {[1, 2, 3, 4].map((item) => (
              <div key={item} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ ...shimmerStyle, height: '270px', width: '100%' }} />
                <div style={{ ...shimmerStyle, height: '15px', width: '70%' }} />
                <div style={{ ...shimmerStyle, height: '12px', width: '90%' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {isSettings && (
        <div style={{ maxWidth: '640px', margin: '0 auto', paddingTop: '52px' }}>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 998,
              backgroundColor: '#000000',
              borderBottom: '1px solid #1A1A1A',
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ ...shimmerStyle, width: '96px', height: '15px', borderRadius: '4px' }} />
            <div style={{ ...shimmerStyle, width: '20px', height: '20px', borderRadius: '4px' }} />
          </div>

          {isAmbassadorSkeleton && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '26px' }}>
              <div style={{ ...shimmerStyle, width: '76px', height: '76px', borderRadius: '50%' }} />
            </div>
          )}

          <div style={{ marginTop: isAmbassadorSkeleton ? '0' : '16px' }}>
            <div style={{ ...shimmerStyle, width: '54px', height: '9px', borderRadius: '3px', marginBottom: '10px' }} />
            <div style={{ ...shimmerStyle, width: '62%', height: '15px', borderRadius: '4px', marginBottom: '12px' }} />
            <div style={{ height: '1px', backgroundColor: '#1E1E1E', marginBottom: '22px' }} />

            <div style={{ ...shimmerStyle, width: '104px', height: '9px', borderRadius: '3px', marginBottom: '10px' }} />
            <div style={{ ...shimmerStyle, width: '74%', height: '15px', borderRadius: '4px', marginBottom: '12px' }} />
            <div style={{ height: '1px', backgroundColor: '#1E1E1E', marginBottom: '22px' }} />

            {isAmbassadorSkeleton && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ ...shimmerStyle, width: '82px', height: '9px', borderRadius: '3px' }} />
                  <div style={{ ...shimmerStyle, width: '92px', height: '10px', borderRadius: '3px' }} />
                </div>
                <div style={{ ...shimmerStyle, width: '54%', height: '15px', borderRadius: '4px', marginBottom: '12px' }} />
                <div style={{ height: '1px', backgroundColor: '#1E1E1E', marginBottom: '22px' }} />

                <div style={{ ...shimmerStyle, width: '142px', height: '9px', borderRadius: '3px', marginBottom: '12px' }} />
                <div style={{ display: 'flex', gap: '8px', marginBottom: '22px' }}>
                  {[82, 82, 84, 72].map((w, idx) => (
                    <div
                      key={idx}
                      style={{ ...shimmerStyle, width: `${w}px`, height: '30px', borderRadius: '20px', flexShrink: 0 }}
                    />
                  ))}
                </div>

                <div style={{ ...shimmerStyle, width: '106px', height: '9px', borderRadius: '3px', marginBottom: '10px' }} />
                <div style={{ ...shimmerStyle, width: '56%', height: '15px', borderRadius: '4px', marginBottom: '12px' }} />
                <div style={{ height: '1px', backgroundColor: '#1E1E1E', marginBottom: '22px' }} />

                <div style={{ ...shimmerStyle, width: '138px', height: '9px', borderRadius: '3px', marginBottom: '10px' }} />
                <div
                  style={{
                    backgroundColor: '#0B0B0C',
                    border: '1px solid #1C1C1E',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ ...shimmerStyle, width: '124px', height: '12px', borderRadius: '4px' }} />
                  <div style={{ ...shimmerStyle, width: '82px', height: '28px', borderRadius: '16px' }} />
                </div>
              </>
            )}

            <div
              style={{
                borderTop: isAmbassadorSkeleton ? '1px solid #1A1A1C' : 'none',
                paddingTop: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ ...shimmerStyle, width: '136px', height: '11px', borderRadius: '4px' }} />
                <div style={{ ...shimmerStyle, width: '10px', height: '14px', borderRadius: '3px' }} />
              </div>
              <div style={{ ...shimmerStyle, width: '74px', height: '11px', borderRadius: '4px' }} />
              <div style={{ ...shimmerStyle, width: '112px', height: '11px', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      )}

      {isCommunication && (
        <div
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            paddingTop: '58px',
            paddingBottom: '76px',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          {renderSubViewTopBarSkeleton(false)}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
              <div style={{ ...shimmerStyle, width: '56px', height: '22px', borderRadius: '12px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
              <div style={{ ...shimmerStyle, width: '68px', height: '10px', borderRadius: '3px' }} />
              <div
                style={{
                  ...shimmerStyle,
                  width: '68%',
                  height: '46px',
                  borderRadius: '14px',
                  borderTopLeftRadius: '4px',
                }}
              />
              <div style={{ ...shimmerStyle, width: '54px', height: '9px', borderRadius: '3px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
              <div style={{ ...shimmerStyle, width: '28px', height: '10px', borderRadius: '3px' }} />
              <div
                style={{
                  ...shimmerStyle,
                  width: '62%',
                  height: '44px',
                  borderRadius: '14px',
                  borderTopRightRadius: '4px',
                }}
              />
              <div style={{ ...shimmerStyle, width: '54px', height: '9px', borderRadius: '3px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
              <div style={{ ...shimmerStyle, width: '68px', height: '10px', borderRadius: '3px' }} />
              <div
                style={{
                  ...shimmerStyle,
                  width: '56%',
                  height: '38px',
                  borderRadius: '14px',
                  borderTopLeftRadius: '4px',
                }}
              />
              <div style={{ ...shimmerStyle, width: '54px', height: '9px', borderRadius: '3px' }} />
            </div>
          </div>

          <div
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#000000',
              borderTop: '1px solid #18181B',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ ...shimmerStyle, flex: 1, height: '42px', borderRadius: '22px' }} />
            <div style={{ ...shimmerStyle, width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0 }} />
          </div>
        </div>
      )}

      {isNotifications && (
        <div style={{ maxWidth: '640px', margin: '0 auto', paddingTop: '62px' }}>
          {renderSubViewTopBarSkeleton(true)}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                style={{
                  backgroundColor: '#0A0A0B',
                  border: '1px solid #18181B',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div style={{ ...shimmerStyle, width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ ...shimmerStyle, width: '54%', height: '13px', borderRadius: '4px' }} />
                    <div style={{ ...shimmerStyle, width: '46px', height: '10px', borderRadius: '3px', flexShrink: 0 }} />
                  </div>
                  <div style={{ ...shimmerStyle, width: '88%', height: '11px', borderRadius: '4px' }} />
                  <div style={{ ...shimmerStyle, width: '64%', height: '11px', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAmbassadorView && (
        <div style={{ maxWidth: '640px', margin: '0 auto', paddingTop: '54px' }}>
          {renderProfileHeaderSkeleton(true)}

          <div style={{ marginTop: '18px', marginBottom: '22px' }}>
            <div style={{ ...shimmerStyle, width: '156px', height: '9px', borderRadius: '3px', marginBottom: '10px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                <div style={{ ...shimmerStyle, width: '72%', height: '12px', borderRadius: '4px' }} />
                <div style={{ ...shimmerStyle, width: '48%', height: '18px', borderRadius: '4px' }} />
              </div>
              <div style={{ ...shimmerStyle, width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0 }} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#0A0A0B',
              border: '1px solid #1A1A1D',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ ...shimmerStyle, width: '64px', height: '11px', borderRadius: '4px' }} />
              <div style={{ ...shimmerStyle, width: '68px', height: '11px', borderRadius: '4px' }} />
            </div>

            <div
              style={{
                backgroundColor: '#101012',
                border: '1px solid #1C1C20',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ ...shimmerStyle, width: '116px', height: '9px', borderRadius: '3px' }} />
                <div style={{ ...shimmerStyle, width: '56px', height: '24px', borderRadius: '5px' }} />
              </div>
              <div style={{ ...shimmerStyle, width: '88px', height: '32px', borderRadius: '8px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[1, 2].map((box) => (
                <div
                  key={box}
                  style={{
                    backgroundColor: '#101012',
                    border: '1px solid #1C1C20',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ ...shimmerStyle, width: '78px', height: '9px', borderRadius: '3px' }} />
                  <div style={{ ...shimmerStyle, width: '44px', height: '20px', borderRadius: '4px' }} />
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#0A0A0B',
              border: '1px solid #1A1A1D',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ ...shimmerStyle, width: '62px', height: '11px', borderRadius: '4px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[1, 2, 3, 4].map((stat) => (
                <div
                  key={stat}
                  style={{
                    backgroundColor: '#101012',
                    border: '1px solid #1C1C20',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ ...shimmerStyle, width: '68px', height: '9px', borderRadius: '3px' }} />
                  <div style={{ ...shimmerStyle, width: '38px', height: '20px', borderRadius: '4px' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isOrdersView && (
        <div style={{ maxWidth: '720px', margin: '0 auto', paddingTop: '54px' }}>
          {renderProfileHeaderSkeleton(false)}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #17171A',
              paddingBottom: '12px',
              marginTop: '18px',
              marginBottom: '18px',
            }}
          >
            <div style={{ ...shimmerStyle, width: '122px', height: '11px', borderRadius: '4px' }} />
            <div style={{ ...shimmerStyle, width: '60px', height: '11px', borderRadius: '4px' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {[1, 2].map((orderCard) => (
              <div
                key={orderCard}
                style={{
                  backgroundColor: '#070708',
                  border: '1px solid #1D1D20',
                  borderRadius: '10px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ ...shimmerStyle, width: '126px', height: '10px', borderRadius: '3px' }} />
                  <div style={{ ...shimmerStyle, width: '14px', height: '14px', borderRadius: '3px' }} />
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ ...shimmerStyle, width: '64px', height: '82px', borderRadius: '6px', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <div style={{ ...shimmerStyle, width: '68%', height: '13px', borderRadius: '4px' }} />
                    <div style={{ ...shimmerStyle, width: '56%', height: '10px', borderRadius: '3px' }} />
                    <div style={{ ...shimmerStyle, width: '48%', height: '10px', borderRadius: '3px' }} />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #151518',
                    paddingTop: '12px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ ...shimmerStyle, width: '82px', height: '9px', borderRadius: '3px' }} />
                    <div style={{ ...shimmerStyle, width: '78px', height: '18px', borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                    <div style={{ ...shimmerStyle, width: '74px', height: '9px', borderRadius: '3px' }} />
                    <div style={{ ...shimmerStyle, width: '84px', height: '12px', borderRadius: '4px' }} />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #131316',
                    paddingTop: '14px',
                  }}
                >
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flex: 1,
                        gap: '8px',
                      }}
                    >
                      <div style={{ ...shimmerStyle, width: '16px', height: '16px', borderRadius: '50%' }} />
                      <div style={{ ...shimmerStyle, width: '46px', height: '9px', borderRadius: '3px' }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isUpdatePassword && (
        <div style={{ maxWidth: '400px', margin: '100px auto' }}>
          <div style={{ ...shimmerStyle, height: '300px', width: '100%' }} />
        </div>
      )}
    </div>
  );
};
