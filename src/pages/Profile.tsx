import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Profile() {
  const [view, setView] = useState<'profile' | 'settings'>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { fetchUserData(); }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 'full_name' কলাম থেকে ডাটা নিচ্ছি
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof) {
        setProfile({ ...prof, email: user.email });
        setNewName(prof.full_name || ''); 
      }
    }
  };

  const handleUpdate = async () => {
    // এখানে 'name' এর জায়গায় 'full_name' ব্যবহার করা হয়েছে
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: newName }) 
      .eq('id', profile.id);

    if (profileError) {
      alert("Error updating profile: " + profileError.message);
      return;
    }

    if (newPassword) {
      const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
      if (passwordError) {
        alert("Error updating password: " + passwordError.message);
        return;
      }
    }

    alert("PROFILE UPDATED!");
    setView('profile');
    fetchUserData();
  };

  // ... (বাকি JSX অংশ আগের মতোই থাকবে, শুধু নামের জায়গায় profile?.full_name ব্যবহার করবেন)
  // প্রোফাইল ভিউতে নামের লাইনটি এমন হবে: 
  // <p style={{ fontSize: '16px', marginBottom: '20px' }}>{profile?.full_name || ''}</p>
