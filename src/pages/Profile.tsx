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

      const { data: userOrders, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (orderError) console.error("Order Fetch Error:", orderError);
      else if (userOrders) setOrders(userOrders);
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

  // স্টাইল আপডেট করা হয়েছে ফুল স্ক্রিন ও রেসপন্সিভ লেআউটের জন্য
  const containerStyle = { backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' as const, alignItems: 'center' };
  const contentWrapper = { width: '100%', maxWidth: '600px' }; 
  const inputStyle = { width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#fff', marginBottom: '20px', outline: 'none', fontSize: '15px' };
  const navButtonStyle = { background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', marginBottom: '15px', fontSize: '13px', letterSpacing: '1px', display: 'block', width: '100%', textAlign: 'left' as const, padding: '5px 0' };
  const dangerButtonStyle = { background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', marginTop: '30px', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' as const, display: 'block', width: '100%', textAlign: 'left' as const, fontWeight: 'bold' as const };

  return (
    <div style={containerStyle}>
      {toast && <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#111', padding: '15px', borderLeft: `5px solid ${toast.color}`, zIndex: 9999 }}>{toast.message}</div>}
      
      <div style={contentWrapper}>
        {view === 'profile' ? (
          <>
            <h2 style={{ letterSpacing: '4px', fontWeight: '100', fontSize: '18px', marginBottom: '40px' }}>PROFILE</h2>
            <div style={{ marginBottom: '25px' }}>
              <p style={{ fontSize: '8px', color: '#555', letterSpacing: '2px' }}>NAME</p>
              <p style={{ fontSize: '16px', fontWeight: '300' }}>{profile?.name || 'No name set'}</p>
            </div>
            <div style={{ marginBottom: '40px' }}>
              <p style={{ fontSize: '8px', color: '#555', letterSpacing: '2px' }}>EMAIL</p>
              <p style={{ fontSize: '16px', fontWeight: '300' }}>{profile?.email || ''}</p>
            </div>

            <h3 style={{ fontSize: '10px', letterSpacing: '2px', color: '#555', borderBottom: '1px solid #333', paddingBottom: '10px' }}>MY ORDERS</h3>
            {orders.length > 0 ? orders.map((order) => (
              <div key={order.id} style={{ padding: '15px 0', borderBottom: '1px solid #222' }}>
                <p style={{ fontSize: '14px' }}>{order.product_name}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888' }}>
                  <span>{order.status}</span>
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            )) : <p style={{ fontSize: '12px', color: '#444', marginTop: '20px' }}>No orders found.</p>}
            
            <button onClick={() => setView('settings')} style={{ ...navButtonStyle, marginTop: '20px' }}>EDIT PROFILE</button>
          </>
        ) : (
          <>
            <h2 style={{ fontWeight: '100', letterSpacing: '4px', fontSize: '18px', marginBottom: '40px' }}>SETTINGS</h2>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} placeholder="Name" />
            <input placeholder="New Email" onChange={(e) => setNewEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="New Password" onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
            <button onClick={handleUpdate} style={{ ...navButtonStyle, color: '#fff', fontWeight: '600' }}>SAVE CHANGES</button>
            <button onClick={() => setView('profile')} style={navButtonStyle}>BACK</button>
            <button onClick={handleSignOut} style={navButtonStyle}>SIGN OUT</button>
            <button onClick={() => setShowConfirm(true)} style={dangerButtonStyle}>DELETE ACCOUNT</button>
          </>
        )}
      </div>
    </div>
  );
}
