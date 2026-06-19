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

  const handleSignOut = async () => { 
    await supabase.auth.signOut(); 
    window.location.reload(); 
  };

  // ডিলিট ফাংশন আপডেট করা হয়েছে
  const handleDeleteAccount = async () => {
    setShowConfirm(false);
    try {
      // প্রথমে auth ব্যবহারকারী ডিলিট করার চেষ্টা
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        // যদি admin access না থাকে, তবে আরপিসি কল করুন
        const { error: rpcError } = await supabase.rpc('delete_user');
        if (rpcError) throw rpcError;
      }
      
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error: any) {
      showToast("Delete Error: " + error.message, "#ff4444");
    }
  };

  const handleUpdate = async () => {
    try {
      if (newName !== profile?.name) {
        await supabase.from('profiles').update({ name: newName }).eq('id', profile.id);
      }
      if (newEmail && newEmail !== profile?.email) {
        await supabase.auth.updateUser({ email: newEmail });
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
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
      {toast && <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#111', padding: '15px', borderLeft: `5px solid ${toast.color}`, zIndex: 9999 }}>{toast.message}</div>}
      
      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: '#111', padding: '30px', borderRadius: '10px', textAlign: 'center', border: '1px solid #333' }}>
            <p>Are you sure you want to delete your account?</p>
            <button onClick={handleDeleteAccount} style={{ background: '#ff4444', border: 'none', padding: '10px 20px', color: '#fff', marginRight: '10px' }}>Yes</button>
            <button onClick={() => setShowConfirm(false)} style={{ background: 'transparent', border: '1px solid #555', padding: '10px 20px', color: '#fff' }}>No</button>
          </div>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '400px' }}>
        {view === 'profile' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
              <h2 style={{ letterSpacing: '4px', fontWeight: '100', fontSize: '18px' }}>PROFILE</h2>
              <svg onClick={() => setView('settings')} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" cursor="pointer"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15..."></path></svg>
            </div>
            {/* প্রোফাইল এবং অর্ডার সেকশন আগের মতোই */}
            <div style={{ marginBottom: '25px' }}><p style={{ fontSize: '8px', color: '#555', letterSpacing: '2px' }}>NAME</p><p>{profile?.name || 'Add display name'}</p></div>
            <h3 style={{ fontSize: '10px', letterSpacing: '2px', color: '#555', borderBottom: '1px solid #333' }}>MY ORDERS</h3>
            {orders.map((order) => <div key={order.id} style={{ padding: '15px 0', borderBottom: '1px solid #222' }}>{order.product_name}</div>)}
          </>
        ) : (
          /* সেটিংস সেকশন */
          <>
            <h2 style={{ fontWeight: '100', letterSpacing: '4px', fontSize: '18px', marginBottom: '40px' }}>SETTINGS</h2>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} />
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
