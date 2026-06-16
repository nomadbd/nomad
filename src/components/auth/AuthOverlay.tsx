const AuthOverlay: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: '#f4f4f4', // প্রিমিয়াম হালকা ধূসর
      zIndex: 2000, display: 'flex', flexDirection: 'column', 
      justifyContent: 'center', alignItems: 'center', padding: '20px'
    }}>
      
      <button 
        onClick={onClose} 
        style={{
          position: 'absolute', top: '30px', right: '30px', 
          background: 'none', border: 'none', fontSize: '20px', 
          cursor: 'pointer', color: '#333'
        }}
      >
        CLOSE
      </button>

      <AuthForm />
    </div>
  );
};
