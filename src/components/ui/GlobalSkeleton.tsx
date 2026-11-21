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
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '24px',
            }}
          >
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                style={{ ...shimmerStyle, height: '320px' }}
              />
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                style={{
                  ...shimmerStyle,
                  height: '92px',
                  width: '100%',
                }}
              />
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
