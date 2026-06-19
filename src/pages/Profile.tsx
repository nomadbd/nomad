import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Profile() {
  const [view, setView] = useState<'profile' | 'settings'>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => { fetchUserData(); }, []);

  const showToast = (message: string, color: string = '#fff') => {
    setToast({ message, color });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile({ ...prof, email: user.email });
      setNewName(prof?.name || '');

      const { data: userOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (userOrders) setOrders(userOrders);
    }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/'; };

  const handleDeleteAccount = async () => {
    setShowConfirm(false);
    const { error } = await supabase.rpc('delete_user');
    if (error) showToast("Error: " + error.message, "#ff4444");
    else { await supabase.auth.signOut(); window.location.href = '/'; }
  };

  const handleUpdate = async () => {
    try {
      if (newName !== profile?.name) {
        await supabase.from('profiles').update({ name: newName }).eq('id', profile.id);
      }
      if (newEmail && newEmail !== profile?.email) {
        await supabase.auth.updateUser({ email: newEmail });
        showToast("Check your new email to confirm.", "#3498db");
      }
      if (newPassword) {
        await supabase.auth.updateUser({ password: newPassword });
      }
      showToast("Profile updated successfully!", "#2ecc71");
      await fetchUserData();
      setView('profile');
    } catch (error: any) {
      showToast("Update Error: " + error.message, "#ff4444");
    }
  };

  const inputStyle = { width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#fff', marginBottom: '20px', outline: 'none', fontSize: '15px' };
  const navButtonStyle = { background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', marginBottom: '15px', fontSize: '13px', letterSpacing: '1px', display: 'block', width: '100%', textAlign: 'left' as const, padding: '5px 0' };
  const dangerButtonStyle = { background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', marginTop: '30px', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' as const, display: 'block', width: '100%', textAlign: 'left' as const, fontWeight: 'bold' as const };

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
      
      {/* Settings Icon and Header logic preserved */}
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {view === 'profile' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <h2 style={{ letterSpacing: '4px', fontWeight: '100', fontSize: '18px', margin: 0 }}>PROFILE</h2>
              <svg onClick={() => setView('settings')} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" cursor="pointer" style={{ display: 'block' }}>
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
            
            {/* Rest of your Profile code remains the same */}
            <div style={{ marginBottom: '25px' }}>
              <p style={{ fontSize: '8px', color: '#555', letterSpacing: '2px', marginBottom: '5px' }}>NAME</p>
              <p style={{ fontSize: '16px', fontWeight: '300' }}>{profile?.name || 'No name set'}</p>
            </div>
            <div style={{ marginBottom: '40px' }}>
              <p style={{ fontSize: '8px', color: '#555', letterSpacing: '2px', marginBottom: '5px' }}>EMAIL</p>
              <p style={{ fontSize: '16px', fontWeight: '300' }}>{profile?.email || ''}</p>
            </div>
            
            <h3 style={{ fontSize: '10px', letterSpacing: '2px', color: '#555', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>MY ORDERS</h3>
            {orders.length > 0 ? orders.map((order) => (
              <div key={order.id} style={{ padding: '15px 0', borderBottom: '1px solid #222' }}>
                <p style={{ fontSize: '14px', margin: '0 0 5px 0' }}>{order.product_name}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888' }}>
                  <span>{order.status}</span>
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            )) : <p style={{ fontSize: '12px', color: '#444' }}>No orders found.</p>}
          </>
        ) : (
          <>
            <h2 style={{ fontWeight: '100', letterSpacing: '4px', fontSize: '18px', marginBottom: '40px' }}>SETTINGS</h2>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} />
            <input placeholder={profile?.email} onChange={(e) => setNewEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="••••••••" onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
            <div style={{ marginTop: '20px' }}>
              <button onClick={handleUpdate} style={{ ...navButtonStyle, color: '#fff', fontWeight: '600' }}>SAVE CHANGES</button>
              <button onClick={() => setView('profile')} style={navButtonStyle}>BACK</button>
              <button onClick={handleSignOut} style={navButtonStyle}>SIGN OUT</button>
            </div>
            <button onClick={() => setShowConfirm(true)} style={dangerButtonStyle}>DELETE ACCOUNT</button>
          </>
        )}
      </div>
    </div>
  );
}
