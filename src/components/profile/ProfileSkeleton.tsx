export default function ProfileSkeleton() {
  const shimmerStyle = {
    backgroundColor: '#3E3E3E',
    backgroundImage:
      'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0) 100%)',
    backgroundSize: '200% 100%',
    animation: 'fbProfileShimmer 1.35s ease-in-out infinite',
  };

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
        @keyframes fbProfileShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>

      {/* Top bar / Avatar row */}
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
                width: '58%',
                borderRadius: '4px',
                marginBottom: '8px',
              }}
            />
            <div
              style={{
                ...shimmerStyle,
                height: '11px',
                width: '36%',
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

      {/* Content block 1 */}
      <div
        style={{
          backgroundColor: '#0E0E10',
          border: '1px solid #222226',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '16px',
        }}
      >
        <div style={{ ...shimmerStyle, height: '12px', width: '34%', borderRadius: '4px', marginBottom: '14px' }} />
        <div style={{ ...shimmerStyle, height: '14px', width: '92%', borderRadius: '4px', marginBottom: '10px' }} />
        <div style={{ ...shimmerStyle, height: '14px', width: '74%', borderRadius: '4px' }} />
      </div>

      {/* Content block 2 */}
      <div
        style={{
          backgroundColor: '#0E0E10',
          border: '1px solid #222226',
          borderRadius: '14px',
          padding: '16px',
        }}
      >
        <div style={{ ...shimmerStyle, height: '12px', width: '42%', borderRadius: '4px', marginBottom: '14px' }} />
        <div style={{ ...shimmerStyle, height: '14px', width: '88%', borderRadius: '4px', marginBottom: '10px' }} />
        <div style={{ ...shimmerStyle, height: '14px', width: '64%', borderRadius: '4px' }} />
      </div>
    </div>
  );
}
