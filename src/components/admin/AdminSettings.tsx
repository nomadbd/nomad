Import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface StoreSettings {
  id?: number;
  delivery_charge: number;
  vat_rate: number;
  updated_at?: string;
}

interface StaffProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: 'staff' | 'admin' | 'super_admin';
  created_at: string;
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettings>({
    delivery_charge: 0,
    vat_rate: 0,
  });

  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'staff' | 'admin' | 'super_admin'>('staff');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingStaff, setUploadingStaff] = useState(false);

  const CLOUD_NAME = "YOUR_CLOUDINARY_CLOUD_NAME";
  const UPLOAD_PRESET = "staff_avatars";

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      const { data: storeData } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (storeData) {
        setSettings({
          id: storeData.id,
          delivery_charge: storeData.delivery_charge ?? 0,
          vat_rate: storeData.vat_rate ?? 0,
        });
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      if (profilesData) {
        const filteredStaff = profilesData.filter((p: any) => 
          ['staff', 'admin', 'super_admin'].includes(String(p.role).toLowerCase())
        );
        
        setStaffList(filteredStaff.length > 0 ? filteredStaff : profilesData);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setMsg(null);

      const payload = {
        id: settings.id || 1,
        delivery_charge: Number(settings.delivery_charge),
        vat_rate: Number(settings.vat_rate),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('store_settings')
        .upsert(payload);

      if (error) throw error;

      setMsg({ type: 'success', text: 'SETTINGS SAVED SUCCESSFULLY' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'FAILED TO SAVE SETTINGS' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingStaff(true);
    setMsg(null);

    try {
      let avatarUrl = '';

      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('upload_preset', UPLOAD_PRESET);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        const fileData = await res.json();
        if (fileData.secure_url) {
          avatarUrl = fileData.secure_url;
        } else {
          throw new Error("AVATAR UPLOAD FAILED");
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newStaffEmail,
        password: newStaffPassword,
        options: {
          data: {
            name: newStaffName,
            avatar_url: avatarUrl,
            role: newStaffRole
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          name: newStaffName,
          email: newStaffEmail,
          avatar_url: avatarUrl,
          role: newStaffRole,
          created_at: new Date().toISOString()
        });

        if (profileError) throw profileError;
      }

      setMsg({ type: 'success', text: 'STAFF ONBOARDED SUCCESSFULLY' });
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPassword('');
      setImageFile(null);
      setIsModalOpen(false);
      fetchInitialData();

    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'ONBOARDING FAILED' });
    } finally {
      setUploadingStaff(false);
    }
  };

  if (loading) {
    return (
      <div style={{ color: '#52525b', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '2px', padding: '80px 0', textAlign: 'center' }}>
        LOADING SYSTEM...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', fontFamily: 'monospace', color: '#fff' }}>
      
      {msg && (
        <div style={{ 
          padding: '12px 16px', 
          fontSize: '11px', 
          letterSpacing: '1px',
          backgroundColor: msg.type === 'success' ? '#092e1e' : '#3b1212', 
          border: `1px solid ${msg.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: msg.type === 'success' ? '#34d399' : '#f87171'
        }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #27272a', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '2px', margin: 0, color: '#fff' }}>CURRENT STAFF</h2>
            <span style={{ fontSize: '10px', color: '#71717a' }}>TOTAL ACTIVE: {staffList.length}</span>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: '#fff', 
              color: '#000', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            +
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {staffList.map((stf) => (
            <div key={stf.id} style={{ background: '#09090b', border: '1px solid #18181b', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {stf.avatar_url ? (
                <img src={stf.avatar_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#18181b', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#a1a1aa' }}>
                  {stf.name ? stf.name.charAt(0).toUpperCase() : 'S'}
                </div>
              )}
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stf.name}</div>
                <div style={{ fontSize: '10px', color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stf.email}</div>
                <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '9px', padding: '2px 6px', background: '#18181b', color: '#a1a1aa', border: '1px solid #27272a', textTransform: 'uppercase' }}>
                  {stf.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ borderBottom: '1px solid #27272a', paddingBottom: '12px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '2px', margin: 0, color: '#fff' }}>LOGISTICS & RATES</h2>
          <span style={{ fontSize: '10px', color: '#71717a' }}>STORE CHARGES CONFIGURATION</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <label style={{ fontSize: '10px', color: '#71717a', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>DELIVERY CHARGE (BDT)</label>
            <input
              type="number"
              value={settings.delivery_charge}
              onChange={(e) => setSettings({ ...settings, delivery_charge: parseFloat(e.target.value) || 0 })}
              style={{ 
                width: '100%', 
                background: 'transparent', 
                border: 'none', 
                borderBottom: '1px solid #27272a', 
                padding: '8px 0', 
                color: '#fff', 
                fontSize: '14px', 
                fontFamily: 'monospace', 
                outline: 'none',
                borderRadius: 0 
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '10px', color: '#71717a', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>VAT RATE (%)</label>
            <input
              type="number"
              step="0.01"
              value={settings.vat_rate}
              onChange={(e) => setSettings({ ...settings, vat_rate: parseFloat(e.target.value) || 0 })}
              style={{ 
                width: '100%', 
                background: 'transparent', 
                border: 'none', 
                borderBottom: '1px solid #27272a', 
                padding: '8px 0', 
                color: '#fff', 
                fontSize: '14px', 
                fontFamily: 'monospace', 
                outline: 'none',
                borderRadius: 0 
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingSettings}
          style={{
            background: '#fff',
            color: '#000',
            border: 'none',
            padding: '12px',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: '700',
            letterSpacing: '2px',
            cursor: savingSettings ? 'not-allowed' : 'pointer',
            marginTop: '12px'
          }}
        >
          {savingSettings ? 'SAVING...' : 'SAVE LOGISTICS SETTINGS'}
        </button>
      </form>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#09090b', border: '1px solid #27272a', padding: '24px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #18181b', paddingBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '2px' }}>ONBOARD NEW STAFF</span>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '9px', color: '#71717a', display: 'block', marginBottom: '4px' }}>FULL NAME</label>
                <input 
                  type="text" 
                  required 
                  value={newStaffName} 
                  onChange={(e) => setNewStaffName(e.target.value)} 
                  style={{ width: '100%', background: '#000', border: '1px solid #18181b', padding: '10px', color: '#fff', fontSize: '11px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '9px', color: '#71717a', display: 'block', marginBottom: '4px' }}>EMAIL</label>
                <input 
                  type="email" 
                  required 
                  value={newStaffEmail} 
                  onChange={(e) => setNewStaffEmail(e.target.value)} 
                  style={{ width: '100%', background: '#000', border: '1px solid #18181b', padding: '10px', color: '#fff', fontSize: '11px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '9px', color: '#71717a', display: 'block', marginBottom: '4px' }}>PASSWORD</label>
                <input 
                  type="password" 
                  required 
                  value={newStaffPassword} 
                  onChange={(e) => setNewStaffPassword(e.target.value)} 
                  style={{ width: '100%', background: '#000', border: '1px solid #18181b', padding: '10px', color: '#fff', fontSize: '11px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '9px', color: '#71717a', display: 'block', marginBottom: '4px' }}>ROLE</label>
                <select 
                  value={newStaffRole} 
                  onChange={(e) => setNewStaffRole(e.target.value as 'staff' | 'admin' | 'super_admin')}
                  style={{ width: '100%', background: '#000', border: '1px solid #18181b', padding: '10px', color: '#fff', fontSize: '11px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                >
                  <option value="staff">STAFF</option>
                  <option value="admin">ADMIN</option>
                  <option value="super_admin">SUPER ADMIN</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '9px', color: '#71717a', display: 'block', marginBottom: '4px' }}>AVATAR IMAGE</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
                  style={{ fontSize: '10px', color: '#a1a1aa' }}
                />
              </div>

              <button
                type="submit"
                disabled={uploadingStaff}
                style={{
                  background: '#fff',
                  color: '#000',
                  border: 'none',
                  padding: '12px',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  fontWeight: '700',
                  letterSpacing: '1px',
                  cursor: uploadingStaff ? 'not-allowed' : 'pointer',
                  marginTop: '8px'
                }}
              >
                {uploadingStaff ? 'PROCESSING...' : 'CONFIRM ONBOARDING'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSettings;

