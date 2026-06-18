export const Toast = ({ message, color }: { message: string, color: string }) => (
  <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#111', color: '#fff', padding: '15px 25px', borderRadius: '5px', borderLeft: `5px solid ${color}`, zIndex: 9999, fontSize: '12px', letterSpacing: '1px' }}>
    {message}
  </div>
);
