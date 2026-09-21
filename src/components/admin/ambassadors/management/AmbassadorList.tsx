import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

interface AmbassadorProfile {
  id: string;
  name: string;
  email: string;
  status: string;
  assigned_slug: string;
}

export default function AmbassadorList() {
  const [ambassadors, setAmbassadors] = useState<AmbassadorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ১. সকল অ্যাম্বাসেডর ফেচ করা
  const fetchAmbassadors = async () => {
    setLoading(true);
    try {
      // profiles এবং ambassador টেবিল জয়েন করে ডাটা ফেচ করা
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          status,
          ambassador (
            assigned_slug
          )
        `)
        .eq('role', 'AMBASSADOR')
        .order('id', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedData: AmbassadorProfile[] = data.map((item: any) => {
          const ambData = Array.isArray(item.ambassador) ? item.ambassador[0] : item.ambassador;
          return {
            id: item.id,
            name: item.name || 'Unnamed Ambassador',
            email: item.email || 'No Email',
            status: item.status || 'ACTIVE',
            assigned_slug: ambData?.assigned_slug || 'N/A',
          };
        });
        setAmbassadors(formattedData);
      }
    } catch (err: any) {
      console.error('Error fetching ambassadors:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbassadors();
  }, []);

  // ২. অ্যাম্বাসেডর ব্লক / ডিএক্টিভেট করার হ্যান্ডলার
  const handleBlockAmbassador = async (userId: string, currentSlug: string) => {
    const confirmBlock = window.confirm(
      `Are you sure you want to block this ambassador?\nStore link (${currentSlug}) will be deactivated and released.`
    );
    if (!confirmBlock) return;

    setActionLoading(userId);

    try {
      // Supabase RPC ফাংশন কল
      const { error } = await supabase.rpc('deactivate_ambassador', {
        target_user_id: userId,
      });

      if (error) throw error;

      alert('Ambassador blocked successfully!');
      // ডাটা রিফ্রেশ করা
      fetchAmbassadors();
    } catch (err: any) {
      alert('Failed to block ambassador: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div style={loadingStyle}>Loading ambassador list...</div>;
  }

  return (
    <div style={containerStyle}>
      <div style={headerSectionStyle}>
        <h2 style={titleStyle}>Manage Ambassadors</h2>
        <span style={countBadgeStyle}>{ambassadors.length} Total</span>
      </div>

      {ambassadors.length === 0 ? (
        <div style={emptyStyle}>No ambassadors found.</div>
      ) : (
        <div style={listGridStyle}>
          {ambassadors.map((amb) => {
            const isBlocked = amb.status === 'BLOCKED';

            return (
              <div key={amb.id} style={cardStyle}>
                <div style={infoGroupStyle}>
                  <div style={nameRowStyle}>
                    <h4 style={nameStyle}>{amb.name}</h4>
                    <span style={statusBadgeStyle(isBlocked)}>
                      {isBlocked ? 'BLOCKED' : 'ACTIVE'}
                    </span>
                  </div>
                  <p style={emailStyle}>{amb.email}</p>
                  <div style={slugRowStyle}>
                    <span style={slugLabelStyle}>Link:</span>
                    <span style={slugValueStyle}>/{amb.assigned_slug}</span>
                  </div>
                </div>

                <div style={actionGroupStyle}>
                  {!isBlocked ? (
                    <button
                      onClick={() => handleBlockAmbassador(amb.id, amb.assigned_slug)}
                      disabled={actionLoading === amb.id}
                      style={blockButtonStyle}
                    >
                      {actionLoading === amb.id ? 'Processing...' : 'Block Ambassador'}
                    </button>
                  ) : (
                    <span style={disabledTextStyle}>Access Terminated</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------- STYLES (Matching Nomad Dark Theme) ----------------

const containerStyle: React.CSSProperties = {
  padding: '20px 16px',
  color: '#ffffff',
  maxWidth: '800px',
  margin: '0 auto',
};

const headerSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '20px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  margin: 0,
  letterSpacing: '-0.02em',
};

const countBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  padding: '4px 10px',
  borderRadius: '20px',
  color: '#86868b',
};

const listGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(18, 18, 18, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '16px',
  padding: '16px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backdropFilter: 'blur(10px)',
  flexWrap: 'wrap',
  gap: '12px',
};

const infoGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const nameRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const nameStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '15px',
  fontWeight: 600,
  color: '#ffffff',
};

const emailStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: '#86868b',
};

const slugRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginTop: '4px',
};

const slugLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#6e6e73',
};

const slugValueStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#2997ff',
  fontWeight: 500,
};

const statusBadgeStyle = (isBlocked: boolean): React.CSSProperties => ({
  fontSize: '9px',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: '6px',
  letterSpacing: '0.05em',
  backgroundColor: isBlocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
  color: isBlocked ? '#ef4444' : '#22c55e',
  border: `1px solid ${isBlocked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
});

const actionGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const blockButtonStyle: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.12)',
  color: '#ef4444',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  padding: '8px 14px',
  borderRadius: '10px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const disabledTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6e6e73',
  fontStyle: 'italic',
};

const loadingStyle: React.CSSProperties = {
  padding: '40px',
  textAlign: 'center',
  color: '#86868b',
  fontSize: '13px',
};

const emptyStyle: React.CSSProperties = {
  padding: '40px',
  textAlign: 'center',
  color: '#6e6e73',
  fontSize: '13px',
};
