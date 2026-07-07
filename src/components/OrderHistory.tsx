import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // আপনার supabaseClient-এর সঠিক পাথ দিন

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserOrders = async () => {
      try {
        setLoading(true);
        // ১. কারেন্ট লগইন করা ইউজারের ডাটা নেওয়া
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError("PLEASE LOG IN TO VIEW YOUR ORDER HISTORY.");
          setLoading(false);
          return;
        }

        // ২. ইউজারের আইডি দিয়ে অর্ডার টেবিল থেকে ডেটা কুয়েরি করা
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('id, created_at, total_amount, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        if (data) setOrders(data);

      } catch (err: any) {
        console.error("Error fetching orders:", err);
        setError("FAILED TO LOAD ORDER HISTORY. PLEASE TRY AGAIN.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrders();
  }, []);

  // স্ট্যাটাস ট্র্যাকিং স্টেপস
  const statusSteps = ['pending', 'received', 'shipped', 'delivered'];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).toUpperCase();
  };

  const styles = {
    container: {
      width: '100%',
      backgroundColor: '#000',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box' as const,
    },
    title: {
      fontSize: '11px',
      letterSpacing: '3px',
      color: '#fff',
      textTransform: 'uppercase' as const,
      marginBottom: '25px',
      fontWeight: 600,
      borderBottom: '1px solid #111',
      paddingBottom: '15px'
    },
    message: {
      fontSize: '10px',
      letterSpacing: '2px',
      color: '#666',
      textTransform: 'uppercase' as const,
      padding: '20px 0',
    },
    orderCard: {
      border: '1px solid #111',
      backgroundColor: '#050505',
      padding: '20px',
      marginBottom: '20px',
      boxSizing: 'border-box' as const,
    },
    metaRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap' as const,
      gap: '10px',
      marginBottom: '25px',
      borderBottom: '1px dotted #161616',
      paddingBottom: '15px'
    },
    metaBlock: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px'
    },
    label: {
      fontSize: '8px',
      letterSpacing: '1.5px',
      color: '#555',
    },
    value: {
      fontSize: '11px',
      letterSpacing: '1px',
      color: '#fff',
      fontWeight: 500,
    },
    trackerWrapper: {
      marginTop: '15px',
    },
    trackerLineContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative' as const,
      width: '100%',
      padding: '0 10px',
      boxSizing: 'border-box' as const,
    },
    stepNode: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      flex: 1,
      position: 'relative' as const,
      zIndex: 2,
    },
    dot: (isActive: boolean) => ({
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: isActive ? '#fff' : '#222',
      boxShadow: isActive ? '0 0 8px #fff' : 'none',
      transition: 'all 0.3s ease',
    }),
    stepLabel: (isActive: boolean, isCurrent: boolean) => ({
      fontSize: '8px',
      letterSpacing: '1px',
      marginTop: '8px',
      color: isCurrent ? '#fff' : isActive ? '#aaa' : '#444',
      fontWeight: isCurrent ? ('bold' as const) : ('normal' as const),
      textTransform: 'uppercase' as const,
      transition: 'all 0.3s ease',
    })
  };

  if (loading) {
    return <div style={styles.message}>LOADING YOUR ORDER SUMMARY...</div>;
  }

  if (error) {
    return <div style={{ ...styles.message, color: '#ff4d4d' }}>{error}</div>;
  }

  if (orders.length === 0) {
    return <div style={styles.message}>YOU HAVE NOT PLACED ANY ORDERS YET.</div>;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>ORDER MEMORANDUM & TRACKING</h3>
      
      {orders.map((order) => {
        const currentStatus = order.status ? order.status.toLowerCase() : 'pending';
        const currentStepIndex = statusSteps.indexOf(currentStatus);

        return (
          <div key={order.id} style={styles.orderCard}>
            {/* অর্ডার মেটা ইনফো */}
            <div style={styles.metaRow}>
              <div style={styles.metaBlock}>
                <span style={styles.label}>ORDER ID</span>
                <span style={styles.value}>#{order.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div style={styles.metaBlock}>
                <span style={styles.label}>DATE</span>
                <span style={styles.value}>{formatDate(order.created_at)}</span>
              </div>
              <div style={styles.metaBlock}>
                <span style={styles.label}>TOTAL AMOUNT</span>
                <span style={{ ...styles.value, fontFamily: 'monospace' }}>৳{order.total_amount}</span>
              </div>
            </div>

            {/* লাইভ স্ট্যাটাস ট্র্যাকার (ডিজাইন স্টেপার) */}
            <div style={styles.trackerWrapper}>
              <div style={styles.trackerLineContainer}>
                
                {statusSteps.map((step, idx) => {
                  const isActive = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div key={step} style={styles.stepNode}>
                      <div style={styles.dot(isActive)} />
                      <span style={styles.stepLabel(isActive, isCurrent)}>
                        {step}
                      </span>
                    </div>
                  );
                })}

              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
