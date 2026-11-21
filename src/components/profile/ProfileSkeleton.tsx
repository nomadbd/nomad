export default function ProfileSkeleton() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto',
        paddingTop: '12px',
      }}
    >
      <style>{`
        @keyframes brightGreySkeleton {
          0%, 100% {
            background-color: #3A3A3A;
            opacity: 0.72;
          }
          50% {
            background-color: #555555;
            opacity: 0.95;
          }
        }
      `}</style>

      {/* Top bar block */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '26px',
        }}
      >
        <div
          style={{
            height: '18px',
            width: '34%',
            borderRadius: '4px',
            animation: 'brightGreySkeleton 1.4s ease-in-out infinite',
          }}
        />
        <div
          style={{
            height: '24px',
            width: '76px',
            borderRadius: '12px',
            animation: 'brightGreySkeleton 1.4s ease-in-out infinite',
          }}
        />
      </div>

      {/* Avatar + Name/Sub-line block */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '28px',
        }}
      >
        <div
          style={{
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            flexShrink: 0,
            animation: 'brightGreySkeleton 1.4s ease-in-out infinite',
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: '16px',
              width: '52%',
              borderRadius: '4px',
              marginBottom: '9px',
              animation: 'brightGreySkeleton 1.4s ease-in-out infinite',
            }}
          />
          <div
            style={{
              height: '12px',
              width: '34%',
              borderRadius: '4px',
              animation: 'brightGreySkeleton 1.4s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* Main section blocks */}
      <div
        style={{
          borderTop: '1px solid #242424',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div
          style={{
            height: '78px',
            width: '100%',
            borderRadius: '8px',
            animation: 'brightGreySkeleton 1.4s ease-in-out infinite',
          }}
        />
        <div
          style={{
            height: '78px',
            width: '100%',
            borderRadius: '8px',
            animation: 'brightGreySkeleton 1.4s ease-in-out infinite',
          }}
        />
        <div
          style={{
            height: '56px',
            width: '88%',
            borderRadius: '8px',
            animation: 'brightGreySkeleton 1.4s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}
