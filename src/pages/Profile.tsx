import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Profile() {
  const [view, setView] = useState<'profile' | 'settings'>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile({ ...prof, email: user.email });
      setNewName(prof?.name || '');

      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setOrders(orderData || []);
    }
    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    const { error } = await supabase.from('profiles').update({ name: newName }).eq('id', profile.id);
    if (!error) {
      setProfile({ ...profile, name: newName });
      setView('profile');
    }
  };

  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to delete your order history?")) {
      await supabase.from('orders').delete().eq('user_id', profile.id);
      setOrders([]);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', color: '#ffffff', fontFamily: 'sans-serif', backgroundColor: '#000000', padding: '40px 20px' }}>

      <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h2 style={{ letterSpacing: '8px', fontWeight: '200', margin: 0 }}>PROFILE</h2>
          {view === 'profile' && (
            <svg onClick={() => setView('settings')} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          )}
          {view === 'settings' && <span onClick={() => setView('profile')} style={{ cursor: 'pointer', fontSize: '12px' }}>CLOSE</span>}
        </div>

        {view === 'profile' ? (
          <>
            <div style={{ textAlign: 'left', marginBottom: '40px' }}>
              <p style={{ fontSize: '10px', color: '#777', margin: '0 0 5px 0' }}>NAME</p>
              <p style={{ fontSize: '16px', marginBottom: '20px' }}>{profile?.name || 'Set your name'}</p>
              <p style={{ fontSize: '10px', color: '#777', margin: '0 0 5px 0' }}>EMAIL</p>
              <p style={{ fontSize: '16px' }}>{profile?.email}</p>
            </div>

            {/* আপডেট করা অর্ডার হিস্ট্রি সেকশন */}
            <div style={{ textAlign: 'left', borderTop: '1px solid #333', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '10px', letterSpacing: '2px', color: '#777' }}>ORDER HISTORY</p>
                {orders.length > 0 && <button onClick={handleClearHistory} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '10px' }}>CLEAR</button>}
              </div>

              {orders.length > 0 ? (
                orders.map(order => (
                  <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '12px', borderBottom: '1px solid #222' }}>
                    <span>{order.product_name}</span>
                    <span style={{ color: order.status === 'Delivered' ? '#fff' : '#888' }}>{order.status}</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ fontSize: '12px', color: '#555', marginBottom: '20px' }}>Your order history is empty.</p>
                  <a href="/" style={{ fontSize: '10px', letterSpacing: '2px', color: '#fff', textDecoration: 'none', border: '1px solid #333', padding: '10px 20px' }}>
                    DISCOVER NOMAD
                  </a>
                </div>
              )}
            </div>

            <p style={{ fontSize: '9px', color: '#444', marginTop: '30px', textAlign: 'center' }}>Your data is automatically cleared every 90 days for privacy.</p>
            <button onClick={handleSignOut} style={{ marginTop: '40px', background: 'none', border: '1px solid #333', color: '#fff', padding: '10px 20px', cursor: 'pointer', fontSize: '10px' }}>SIGN OUT</button>
          </>
        ) : (
          <div style={{ textAlign: 'left' }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', marginBottom: '10px' }} />
            <button onClick={handleUpdateProfile} style={{ width: '100%', padding: '10px', background: '#fff', color: '#000', border: 'none', cursor: 'pointer' }}>SAVE CHANGES</button>
          </div>
        )}
      </div>
    </div>
  );
}
