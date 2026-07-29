import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface SystemSettings {
  delivery_inside_dhaka: number;
  delivery_outside_dhaka: number;
  announcement_text: string;
  is_announcement_active: boolean;
  support_email: string;
  maintenance_mode: boolean;
}

interface StaffProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
  created_at: string;
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    delivery_inside_dhaka: 80,
    delivery_outside_dhaka: 150,
    announcement_text: 'FREE SHIPPING ON ORDERS OVER ৳5000 | NOMAD ESSENTIALS',
    is_announcement_active: true,
    support_email: 'hq@nomadapparel.com',
    maintenance_mode: false,
  });

  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Staff Creation Form States
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('staff');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingStaff, setUploadingStaff] = useState(false);

  // Cloudinary Config (আপনার ক্রেডেনশিয়াল বসান)
  const CLOUD_NAME = "YOUR_CLOUDINARY_CLOUD_NAME"; 
  const UPLOAD_PRESET = "staff_avatars"; 

  const fetchSettingsAndStaff = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch System Settings
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (settingsData) {
        setSettings({
          delivery_inside_dhaka: settingsData.delivery_inside_dhaka ?? 80,
          delivery_outside_dhaka: settingsData.delivery_outside_dhaka ?? 150,
          announcement_text: settingsData.announcement_text || '',
          is_announcement_active: settingsData.is_announcement_active ?? true,
          support_email: settingsData.support_email || 'hq@nomadapparel.com',
          maintenance_mode: settingsData.maintenance_mode ?? false,
        });
      }

      // 2. Fetch All Staff Profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesData) {
        setStaffList(profilesData);
      }

    } catch (err) {
      console.error('Error fetching settings or staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndStaff();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg(null);

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 1,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSuccessMsg('SYSTEM CONFIGURATION UPDATED SUCCESSFULLY.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Failed to save settings: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Add New Staff Functionality (With Cloudinary)
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingStaff(true);

    try {
      let avatarUrl = '';

      // 1. Upload Profile Picture to Cloudinary if selected
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
          throw new Error("Failed to upload avatar image to Cloudinary.");
        }
      }

      // 2. Create Auth User in Supabase
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

      // 3. Upsert Profile into Profiles Table
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

      setSuccessMsg(`STAFF (${newStaffName.toUpperCase()}) CREATED SUCCESSFULLY.`);
      
      // Clear Form & Refresh List
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPassword('');
      setImageFile(null);
      fetchSettingsAndStaff();

    } catch (err: any) {
      alert("Error onboard staff: " + err.message);
    } finally {
      setUploadingStaff(false);
    }
  };

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div style={{ color: '#888', fontFamily: 'monospace', letterSpacing: '2px', fontSize: '11px', textAlign: 'center', padding: '60px 0' }}>
        LOADING SYSTEM CONFIGURATIONS...
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: '100%', 
      overflowX: 'hidden',
      display: 'flex', 
      flexDirection: 'column', 
      gap: '25px' 
    }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '3px', margin: 0, color: '#fff' }}>
          ROLES & SYSTEM CONFIGURATION
        </h2>
        <span style={{ fontSize: '10px', color: '#666', letterSpacing: '1px' }}>
          GLOBAL LOGISTICS, NOTICE BANNERS & STAFF ONBOARDING
        </span>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div style={{ 
          backgroundColor: '#00ff6611', 
          border: '1px solid #00ff6655', 
          color: '#00ff66', 
          padding: '12px 16px', 
          fontSize: '11px', 
          fontFamily: 'monospace',
          borderRadius: '2px'
        }}>
          ✓ {successMsg}
        </div>
      )}

      {/* 05. NEW STAFF ONBOARDING (ADMIN ONLY) */}
      <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '2px' }}>
        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', letterSpacing: '1.5px', display: 'block', marginBottom: '15px', borderBottom: '1px solid #111', paddingBottom: '8px' }}>
          01. ONBOARD NEW STAFF (ADMIN CONTROL)
        </span>

        <form onSubmit={handleCreateStaff} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>FULL NAME</label>
            <input 
              type="text" 
              required 
              value={newStaffName} 
              onChange={(e) => setNewStaffName(e.target.value)} 
              placeholder="e.g. John Doe"
              style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', fontFamily: 'monospace', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>EMAIL ADDRESS</label>
            <input 
              type="email" 
              required 
              value={newStaffEmail} 
              onChange={(e) => setNewStaffEmail(e.target.value)} 
              placeholder="staff@nomad.com"
              style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', fontFamily: 'monospace', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>INITIAL PASSWORD</label>
            <input 
              type="password" 
              required 
              value={newStaffPassword} 
              onChange={(e) => setNewStaffPassword(e.target.value)} 
              placeholder="Min 6 chars"
              style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', fontFamily: 'monospace', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>ASSIGN ROLE</label>
            <select 
              value={newStaffRole} 
              onChange={(e) => setNewStaffRole(e.target.value)}
              style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', fontFamily: 'monospace', boxSizing: 'border-box' }}
            >
              <option value="staff">STAFF / FULFILLMENT</option>
              <option value="manager">MANAGER</option>
              <option value="admin">ADMINISTRATOR</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>PROFILE AVATAR (CLOUDINARY)</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
              style={{ fontSize: '11px', color: '#aaa' }}
            />
          </div>

          <button
            type="submit"
            disabled={uploadingStaff}
            style={{
              gridColumn: '1 / -1',
              backgroundColor: '#3498db',
              color: '#fff',
              border: 'none',
              padding: '12px',
              fontSize: '10px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              letterSpacing: '2px',
              cursor: uploadingStaff ? 'not-allowed' : 'pointer',
              marginTop: '5px'
            }}
          >
            {uploadingStaff ? 'UPLOADING TO CLOUDINARY & CREATING...' : '+ ONBOARD NEW STAFF MEMBER'}
          </button>
        </form>

        {/* Existing Staff Roster List */}
        <div style={{ marginTop: '20px', borderTop: '1px dashed #222', paddingTop: '15px' }}>
          <span style={{ fontSize: '9px', color: '#666', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>CURRENT STAFF ROSTER ({staffList.length})</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {staffList.map((stf) => (
              <div key={stf.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a0a', padding: '8px 12px', border: '1px solid #1a1a1a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {stf.avatar_url ? (
                    <img src={stf.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#222', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>
                      {stf.name ? stf.name.charAt(0) : 'U'}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>{stf.name}</div>
                    <div style={{ fontSize: '9px', color: '#666' }}>{stf.email}</div>
                  </div>
                </div>
                <span style={{ fontSize: '9px', padding: '2px 6px', background: '#111', color: '#3498db', border: '1px solid #222' }}>
                  {stf.role.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

        {/* Shipping Rates */}
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '2px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', letterSpacing: '1.5px', display: 'block', marginBottom: '15px', borderBottom: '1px solid #111', paddingBottom: '8px' }}>
            02. LOGISTICS & SHIPPING RATES
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                INSIDE DHAKA (BDT)
              </label>
              <input
                type="number"
                value={settings.delivery_inside_dhaka}
                onChange={(e) => handleChange('delivery_inside_dhaka', parseFloat(e.target.value) || 0)}
                style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '11px', color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                OUTSIDE DHAKA (BDT)
              </label>
              <input
                type="number"
                value={settings.delivery_outside_dhaka}
                onChange={(e) => handleChange('delivery_outside_dhaka', parseFloat(e.target.value) || 0)}
                style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '11px', color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
              />
            </div>
          </div>
        </div>

        {/* Announcement Banner */}
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', letterSpacing: '1.5px' }}>
              03. STOREFRONT ANNOUNCEMENT BANNER
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', cursor: 'pointer', color: settings.is_announcement_active ? '#22c55e' : '#888' }}>
              <input
                type="checkbox"
                checked={settings.is_announcement_active}
                onChange={(e) => handleChange('is_announcement_active', e.target.checked)}
              />
              {settings.is_announcement_active ? 'ACTIVE' : 'DISABLED'}
            </label>
          </div>

          <input
            type="text"
            value={settings.announcement_text}
            onChange={(e) => handleChange('announcement_text', e.target.value)}
            placeholder="Announcement text..."
            style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '11px', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
          />
        </div>

        {/* System Control */}
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '2px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', letterSpacing: '1.5px', display: 'block', marginBottom: '15px', borderBottom: '1px solid #111', paddingBottom: '8px' }}>
            04. STORE HEALTH & MAINTENANCE
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                SUPPORT EMAIL
              </label>
              <input
                type="email"
                value={settings.support_email}
                onChange={(e) => handleChange('support_email', e.target.value)}
                style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '11px', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                MAINTENANCE MODE
              </label>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                background: '#000', 
                border: '1px solid #222', 
                padding: '11px 14px', 
                cursor: 'pointer',
                color: settings.maintenance_mode ? '#ef4444' : '#888'
              }}>
                <input
                  type="checkbox"
                  checked={settings.maintenance_mode}
                  onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                />
                {settings.maintenance_mode ? 'MAINTENANCE ON' : 'STORE LIVE'}
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          style={{
            backgroundColor: '#fff',
            color: '#000',
            border: 'none',
            padding: '15px',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            letterSpacing: '2px',
            cursor: saving ? 'not-allowed' : 'pointer',
            marginTop: '10px'
          }}
        >
          {saving ? 'SAVING CHANGES...' : 'SAVE ALL SYSTEM SETTINGS'}
        </button>

      </form>
    </div>
  );
};

export default AdminSettings;
