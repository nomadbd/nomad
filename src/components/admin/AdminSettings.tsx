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

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('System settings table or record missing, using default values');
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
      alert('Failed to save settings: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
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
          GLOBAL LOGISTICS, NOTICE BANNERS & ACCESS CONTROL
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

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

        {/* Shipping Rates */}
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '2px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', letterSpacing: '1.5px', display: 'block', marginBottom: '15px', borderBottom: '1px solid #111', paddingBottom: '8px' }}>
            01. LOGISTICS & SHIPPING RATES
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
              02. STOREFRONT ANNOUNCEMENT BANNER
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
            03. STORE HEALTH & MAINTENANCE
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

        {/* Roles Overview */}
        <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '2px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', letterSpacing: '1.5px', display: 'block', marginBottom: '12px' }}>
            04. AUTHORIZED ROLES OVERVIEW
          </span>
          <div style={{ fontSize: '10px', color: '#888', lineHeight: '1.7', fontFamily: 'monospace' }}>
            • <strong>ADMINISTRATOR</strong> — Full Access<br />
            • <strong>MANAGER / FULFILLMENT</strong> — Order & Stock Management
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