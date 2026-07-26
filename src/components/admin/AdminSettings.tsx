import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; // আপনার সুপাবেস ক্লায়েন্ট পাথ নিশ্চিত করুন

interface SystemSettings {
  delivery_inside_dhaka: number;
  delivery_outside_dhaka: number;
  announcement_text: string;
  is_announcement_active: boolean;
  support_email: string;
  maintenance_mode: boolean;
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

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 🔹 সুপাবেস থেকে সিস্টেম সেটিংস লোড করা
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('System settings table or record missing, using default values:', error.message);
      } else if (data) {
        setSettings({
          delivery_inside_dhaka: data.delivery_inside_dhaka ?? 80,
          delivery_outside_dhaka: data.delivery_outside_dhaka ?? 150,
          announcement_text: data.announcement_text || '',
          is_announcement_active: data.is_announcement_active ?? true,
          support_email: data.support_email || 'hq@nomadapparel.com',
          maintenance_mode: data.maintenance_mode ?? false,
        });
      }
    } catch (err) {
      console.error('Error fetching system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // 💾 সেটিংস সেভ / আপডেট করা
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
      console.error('Failed to save settings:', err);
      alert('Failed to save settings: ' + (err.message || 'Check Supabase table structure'));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div style={{ color: '#888', fontFamily: 'monospace', letterSpacing: '2px', fontSize: '11px', textAlign: 'center', padding: '50px 0' }}>
        LOADING SYSTEM CONFIGURATIONS...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '800px' }}>
      
      {/* 🔝 হেডার */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '3px', margin: 0, color: '#fff' }}>
          ROLES & SYSTEM CONFIGURATION
        </h2>
        <span style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace', letterSpacing: '1px' }}>
          GLOBAL LOGISTICS, NOTICE BANNERS & ACCESS CONTROL
        </span>
      </div>

      {/* 🔔 নোটিফিকেশন মেসেজ */}
      {successMsg && (
        <div style={{ backgroundColor: '#00ff6611', border: '1px solid #00ff6655', color: '#00ff66', padding: '12px 15px', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '1px' }}>
          ✓ {successMsg}
        </div>
      )}

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        
        {/* SECTION 1: LOGISTICS & SHIPPING CHARGES */}
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace', letterSpacing: '1.5px', borderBottom: '1px solid #111', paddingBottom: '8px' }}>
            01. LOGISTICS & SHIPPING RATES
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '9px', color: '#888', fontFamily: 'monospace', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                INSIDE DHAKA (BDT)
              </label>
              <input
                type="number"
                value={settings.delivery_inside_dhaka}
                onChange={(e) => handleChange('delivery_inside_dhaka', parseFloat(e.target.value) || 0)}
                style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '12px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '9px', color: '#888', fontFamily: 'monospace', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                OUTSIDE DHAKA (BDT)
              </label>
              <input
                type="number"
                value={settings.delivery_outside_dhaka}
                onChange={(e) => handleChange('delivery_outside_dhaka', parseFloat(e.target.value) || 0)}
                style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '12px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: LIVE ANNOUNCEMENT BANNER */}
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #111', paddingBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace', letterSpacing: '1.5px' }}>
              02. STOREFRONT ANNOUNCEMENT BANNER
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '10px', fontFamily: 'monospace', color: settings.is_announcement_active ? '#00ff66' : '#666' }}>
              <input
                type="checkbox"
                checked={settings.is_announcement_active}
                onChange={(e) => handleChange('is_announcement_active', e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              {settings.is_announcement_active ? 'ACTIVE' : 'DISABLED'}
            </label>
          </div>

          <div>
            <label style={{ fontSize: '9px', color: '#888', fontFamily: 'monospace', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
              BANNER ANNOUNCEMENT TEXT
            </label>
            <input
              type="text"
              value={settings.announcement_text}
              onChange={(e) => handleChange('announcement_text', e.target.value)}
              placeholder="e.g. FREE SHIPPING ON ALL ORDERS THIS WEEK"
              style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* SECTION 3: SYSTEM CONTROL & MAINTENANCE */}
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace', letterSpacing: '1.5px', borderBottom: '1px solid #111', paddingBottom: '8px' }}>
            03. STORE HEALTH & MAINTENANCE
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '9px', color: '#888', fontFamily: 'monospace', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                SUPPORT EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={settings.support_email}
                onChange={(e) => handleChange('support_email', e.target.value)}
                style={{ width: '100%', backgroundColor: '#000', border: '1px solid #333', padding: '10px', color: '#fff', fontSize: '11px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '9px', color: '#888', fontFamily: 'monospace', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                STORE MAINTENANCE MODE
              </span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#000', border: '1px solid #222', padding: '9px 12px', cursor: 'pointer', fontSize: '11px', fontFamily: 'monospace', color: settings.maintenance_mode ? '#ef4444' : '#888' }}>
                <input
                  type="checkbox"
                  checked={settings.maintenance_mode}
                  onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                />
                {settings.maintenance_mode ? 'PAUSED (MAINTENANCE ON)' : 'OPERATIONAL (STORE LIVE)'}
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 4: SECURITY ROLES (READ-ONLY OVERVIEW) */}
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace', letterSpacing: '1.5px', borderBottom: '1px solid #111', paddingBottom: '8px' }}>
            04. AUTHORIZED ROLES OVERVIEW
          </span>
          
          <div style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace', lineHeight: '1.6' }}>
            <p style={{ margin: '0 0 8px 0' }}>• <strong>ROLE: ADMINISTRATOR</strong> — Full Access (Orders, Catalog, Analytics, Logistics Settings)</p>
            <p style={{ margin: 0 }}>• <strong>ROLE: MANAGER / FULFILLMENT</strong> — Restricted Access (Order Status Updates & Stock Control)</p>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <button
          type="submit"
          disabled={saving}
          style={{
            backgroundColor: '#fff',
            color: '#000',
            border: 'none',
            padding: '14px',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            letterSpacing: '2px',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s ease',
            marginTop: '10px'
          }}
        >
          {saving ? 'COMMITTING CHANGES...' : 'SAVE SYSTEM CONFIGURATION'}
        </button>

      </form>

    </div>
  );
};

export default AdminSettings;
