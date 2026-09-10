import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface AdminAmbassadorProps {
  searchQuery?: string;
  isFilterOpen?: boolean;
  isSearchOpen?: boolean;
  dateFormat?: string;
}

interface Ambassador {
  id: string;
  name: string;
  email: string;
  code: string;
  commission_rate: number;
  total_sales: number;
  earnings: number;
  status: 'active' | 'pending' | 'suspended';
  created_at: string;
}

export const AdminAmbassador: React.FC<AdminAmbassadorProps> = ({
  searchQuery = '',
  isFilterOpen = false,
  isSearchOpen = false,
}) => {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchAmbassadors();
  }, []);

  const fetchAmbassadors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ambassadors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback mock data if table doesn't exist yet
        setAmbassadors([
          {
            id: '1',
            name: 'ALEX VANCE',
            email: 'alex@vance.co',
            code: 'ALEX2026',
            commission_rate: 12,
            total_sales: 14200,
            earnings: 1704,
            status: 'active',
            created_at: '2026-01-15'
          },
          {
            id: '2',
            name: 'SOPHIA CHEN',
            email: 'sophia@design.io',
            code: 'SOPHIA10',
            commission_rate: 15,
            total_sales: 28900,
            earnings: 4335,
            status: 'active',
            created_at: '2026-02-01'
          },
          {
            id: '3',
            name: 'MARCUS ROY',
            email: 'm.roy@studio.com',
            code: 'MARCUSVIP',
            commission_rate: 10,
            total_sales: 0,
            earnings: 0,
            status: 'pending',
            created_at: '2026-03-04'
          }
        ]);
      } else if (data) {
        setAmbassadors(data);
      }
    } catch (err) {
      console.error('Error loading ambassadors:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredAmbassadors = ambassadors.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalRevenue = ambassadors.reduce((acc, curr) => acc + curr.total_sales, 0);
  const totalPayouts = ambassadors.reduce((acc, curr) => acc + curr.earnings, 0);
  const activeCount = ambassadors.filter(a => a.status === 'active').length;

  return (
    <div style={{ width: '100%', maxWidth: '100%', color: '#fff' }} className="animate-fade-in">
      {/* Top Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div className="apple-glass-hover animate-card" style={{
          backgroundColor: '#0a0a0a',
          border: '1px solid #1a1a1a',
          padding: '16px',
          borderRadius: '2px'
        }}>
          <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            ACTIVE AMBASSADORS
          </span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
            {activeCount} / {ambassadors.length}
          </span>
        </div>

        <div className="apple-glass-hover animate-card" style={{
          backgroundColor: '#0a0a0a',
          border: '1px solid #1a1a1a',
          padding: '16px',
          borderRadius: '2px'
        }}>
          <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            TOTAL REVENUE GENERATED
          </span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
            ${totalRevenue.toLocaleString()}
          </span>
        </div>

        <div className="apple-glass-hover animate-card" style={{
          backgroundColor: '#0a0a0a',
          border: '1px solid #1a1a1a',
          padding: '16px',
          borderRadius: '2px'
        }}>
          <span style={{ fontSize: '9px', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
            TOTAL COMMISSIONS EARNED
          </span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
            ${totalPayouts.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Expandable Filter Panel */}
      <div className={`filter-expand-wrapper ${isFilterOpen ? 'open' : ''}`}>
        <div className="filter-expand-content" style={{
          backgroundColor: '#080808',
          border: '1px solid #1a1a1a',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '10px', color: '#888', letterSpacing: '1px' }}>STATUS:</span>
          {['all', 'active', 'pending', 'suspended'].map((status) => (
            <button
              key={status}
              className="apple-button-press"
              onClick={() => setStatusFilter(status)}
              style={{
                background: statusFilter === status ? '#ffffff' : 'transparent',
                color: statusFilter === status ? '#000000' : '#888888',
                border: '1px solid #222',
                padding: '4px 10px',
                fontSize: '9px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Ambassador Data Table */}
      <div style={{
        backgroundColor: '#060606',
        border: '1px solid #141414',
        overflowX: 'auto',
        width: '100%'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1a1a1a', color: '#666', letterSpacing: '1px' }}>
              <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>AMBASSADOR</th>
              <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>REFERRAL CODE</th>
              <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>RATE</th>
              <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>SALES</th>
              <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>EARNINGS</th>
              <th style={{ padding: '14px 16px', fontWeight: 'bold' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#666' }} className="animate-skeleton">
                  LOADING AMBASSADORS...
                </td>
              </tr>
            ) : filteredAmbassadors.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                  NO AMBASSADORS FOUND
                </td>
              </tr>
            ) : (
              filteredAmbassadors.map((item) => (
                <tr 
                  key={item.id} 
                  className="table-row-hover animate-table-row"
                  style={{ borderBottom: '1px solid #101010' }}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{item.name}</div>
                    <div style={{ fontSize: '9px', color: '#666' }}>{item.email}</div>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <button
                      className="apple-button-press"
                      onClick={() => copyToClipboard(item.code)}
                      style={{
                        background: '#0d0d0d',
                        border: '1px solid #222',
                        color: '#aaa',
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        cursor: 'pointer'
                      }}
                      title="Click to copy referral code"
                    >
                      {item.code} {copiedCode === item.code ? '✓ COPIED' : ''}
                    </button>
                  </td>

                  <td style={{ padding: '14px 16px', color: '#aaa' }}>
                    {item.commission_rate}%
                  </td>

                  <td style={{ padding: '14px 16px', fontWeight: 'bold', color: '#fff' }}>
                    ${item.total_sales.toLocaleString()}
                  </td>

                  <td style={{ padding: '14px 16px', color: '#22c55e', fontWeight: 'bold' }}>
                    ${item.earnings.toLocaleString()}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                      padding: '3px 8px',
                      textTransform: 'uppercase',
                      border: item.status === 'active' ? '1px solid #15803d' : '1px solid #333',
                      color: item.status === 'active' ? '#4ade80' : '#888'
                    }}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
