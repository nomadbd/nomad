import React from 'react';
import { useLocation } from 'react-router-dom';

export const GlobalSkeleton: React.FC = () => {
  const { pathname } = useLocation();

  const shimmerStyle: React.CSSProperties = {
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    animation: 'skeletonPulse 1.5s infinite ease-in-out',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'black',
        color: '#fff',
        padding: '24px',
      }}
    >
      <style>{`
        @keyframes skeletonPulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}</style>

      {pathname === '/' && (
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              ...shimmerStyle,
              height: '380px',
              width: '100%',
              marginBottom: '40px',
            }}
          />

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
                <div style={{ ...shimmerStyle, height: '280px', width: '100%' }} />
                <div style={{ ...shimmerStyle, height: '16px', width: '70%' }} />
                <div style={{ ...shimmerStyle, height: '13px', width: '90%' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <div style={{ ...shimmerStyle, height: '18px', width: '64px' }} />
                  <div style={{ ...shimmerStyle, height: '36px', width: '120px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(pathname === '/profile' || pathname.startsWith('/profile/')) && (
        <div style={{ maxWidth: '900px', margin: '24px auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              marginBottom: '28px',
              paddingBottom: '20px',
              borderBottom: '1px solid #111',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div
                style={{
                  ...shimmerStyle,
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                }}
              />

              <div>
                <div
                  style={{
                    ...shimmerStyle,
                    height: '22px',
                    width: '190px',
                    marginBottom: '10px',
                  }}
                />
                <div
                  style={{
                    ...shimmerStyle,
                    height: '15px',
                    width: '140px',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ ...shimmerStyle, width: '38px', height: '38px', borderRadius: '50%' }} />
              <div style={{ ...shimmerStyle, width: '38px', height: '38px', borderRadius: '50%' }} />
              <div style={{ ...shimmerStyle, width: '38px', height: '38px', borderRadius: '50%' }} />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '12px',
              marginBottom: '20px',
            }}
          >
            <div style={{ ...shimmerStyle, width: '124px', height: '12px', borderRadius: '3px' }} />
            <div style={{ ...shimmerStyle, width: '58px', height: '12px', borderRadius: '3px' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[1, 2].map((item) => (
              <div
                key={item}
                style={{
                  backgroundColor: '#050505',
                  border: '1px solid #222',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ ...shimmerStyle, width: '132px', height: '12px', borderRadius: '3px' }} />
                  <div style={{ ...shimmerStyle, width: '14px', height: '14px', borderRadius: '3px' }} />
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div
                    style={{
                      ...shimmerStyle,
                      width: '60px',
                      height: '75px',
                      borderRadius: '4px',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ ...shimmerStyle, width: '75%', height: '14px', borderRadius: '4px' }} />
                    <div style={{ ...shimmerStyle, width: '50%', height: '11px', borderRadius: '4px' }} />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingTop: '16px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ ...shimmerStyle, width: '78px', height: '10px', borderRadius: '3px' }} />
                    <div style={{ ...shimmerStyle, width: '86px', height: '18px', borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                    <div style={{ ...shimmerStyle, width: '72px', height: '10px', borderRadius: '3px' }} />
                    <div style={{ ...shimmerStyle, width: '82px', height: '12px', borderRadius: '3px' }} />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    paddingTop: '18px',
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
                        gap: '10px',
                      }}
                    >
                      <div style={{ ...shimmerStyle, width: '16px', height: '16px', borderRadius: '50%' }} />
                      <div style={{ ...shimmerStyle, width: '48px', height: '10px', borderRadius: '3px' }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(
        pathname.startsWith('/vip/') ||
        (
          pathname !== '/' &&
          !pathname.startsWith('/profile') &&
          !pathname.startsWith('/admin') &&
          pathname !== '/update-password'
        )
      ) && (
        <div
          style={{
            maxWidth: '600px',
            margin: '80px auto',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              ...shimmerStyle,
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              margin: '0 auto 24px',
            }}
          />

          <div
            style={{
              ...shimmerStyle,
              height: '32px',
              width: '60%',
              margin: '0 auto 16px',
            }}
          />

          <div
            style={{
              ...shimmerStyle,
              height: '180px',
              width: '100%',
            }}
          />
        </div>
      )}

      {pathname === '/update-password' && (
        <div style={{ maxWidth: '400px', margin: '100px auto' }}>
          <div
            style={{
              ...shimmerStyle,
              height: '300px',
              width: '100%',
            }}
          />
        </div>
      )}
    </div>
  );
};
