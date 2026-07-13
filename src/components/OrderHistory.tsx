import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface OrderItem {
  id: string;
  quantity: number;
  price_at_purchase: number;
  size: string | null;
  color: string | null;
  products: {
    name: string;
    product_media: {
      media_url: string;
    }[]; // এখানে মাল্টিপল মিডিয়া অবজেক্ট এর অ্যারে আসবে
  } | null;
}

interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  shipping_address: string;
  delivery_charge: number;
  vat_amount: number;
  total_amount: number;
  status: string;
  order_items: OrderItem[];
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setErrorMessage("PLEASE LOG IN TO VIEW YOUR ORDER HISTORY.");
          setLoading(false);
          return;
        }

        // ৩ লেভেলের নেস্টেড কোয়েরি: orders -> order_items -> products -> product_media
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            customer_name,
            shipping_address,
            delivery_charge,
            vat_amount,
            total_amount,
            status,
            order_items (
              id,
              quantity,
              price_at_purchase,
              size,
              color,
              products:product_id (
                name,
                product_media (
                  media_url
                )
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (err: any) {
        console.error("Error fetching history:", err);
        setErrorMessage(err.message || "FAILED TO LOAD ORDER HISTORY.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, []);

  const styles = {
    container: {
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      color: '#fff',
      backgroundColor: '#000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box' as const,
    },
    heading: {
      fontSize: '11px',
      letterSpacing: '3px',
      textTransform: 'uppercase' as const,
      marginBottom: '30px',
      fontWeight: 600,
      borderBottom: '1px solid #161616',
      paddingBottom: '15px',
    },
    orderCard: {
      border: '1px solid #161616',
      padding: '20px',
      marginBottom: '25px',
      backgroundColor: '#030303',
    },
    orderHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #0d0d0d',
      paddingBottom: '12px',
      marginBottom: '15px',
    },
    orderId: {
      fontSize: '10px',
      letterSpacing: '1px',
      color: '#888',
      textTransform: 'uppercase' as const,
    },
    statusBadge: {
      fontSize: '9px',
      letterSpacing: '2px',
      padding: '4px 8px',
      border: '1px solid #333',
      textTransform: 'uppercase' as const,
      color: '#aaa',
    },
    itemRow: {
      display: 'flex',
      gap: '15px',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid #0d0d0d',
    },
    productImg: {
      width: '45px',
      height: '55px',
      objectFit: 'cover' as const,
      background: '#0a0a0a',
      border: '1px solid #111',
    },
    itemDetails: {
      flexGrow: 1,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '11px',
      letterSpacing: '1px',
    },
    metaText: {
      fontSize: '10px',
      color: '#555',
      marginTop: '3px',
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '15px',
      paddingTop: '12px',
      fontSize: '11px',
      letterSpacing: '1.5px',
    },
    infoMessage: {
      fontSize: '11px',
      letterSpacing: '2px',
      color: '#666',
      textAlign: 'center' as const,
      marginTop: '50px',
      textTransform: 'uppercase' as const,
    }
  };

  if (loading) return <div style={styles.container}><div style={styles.infoMessage}>LOADING ORDERS...</div></div>;
  if (errorMessage) return <div style={styles.container}><div style={{ ...styles.infoMessage, color: '#ff4d4d' }}>{errorMessage}</div></div>;
  if (orders.length === 0) return <div style={styles.container}><div style={styles.infoMessage}>NO ORDERS FOUND.</div></div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>ORDER HISTORY</h1>
      
      {orders.map((order) => (
        <div key={order.id} style={styles.orderCard}>
          <div style={styles.orderHeader}>
            <span style={styles.orderId}>ORDER: #{order.id.slice(0, 8)}...</span>
            <span style={styles.statusBadge}>{order.status}</span>
          </div>

          <div>
            {order.order_items?.map((item) => {
              // product_media অ্যারের প্রথম অবজেক্ট থেকে ছবি নেওয়া হচ্ছে
              const firstImage = item.products?.product_media?.[0]?.media_url;

              return (
                <div key={item.id} style={styles.itemRow}>
                  <img 
                    src={firstImage || 'https://via.placeholder.com/45x55'} 
                    alt={item.products?.name || 'Product'} 
                    style={styles.productImg} 
                  />
                  <div style={styles.itemDetails}>
                    <div>
                      <span style={{ fontWeight: 500 }}>
                        {item.products?.name ? item.products.name.toUpperCase() : 'PRODUCT'}
                      </span>
                      <div style={styles.metaText}>
                        QTY: {item.quantity} 
                        {item.color && ` • ${item.color.toUpperCase()}`} 
                        {item.size && ` / ${item.size.toUpperCase()}`}
                      </div>
                    </div>
                    <span style={{ fontFamily: 'monospace' }}>৳{item.price_at_purchase * item.quantity}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.totalRow}>
            <span style={{ color: '#666' }}>
              DATE: {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase()}
            </span>
            <span>
              TOTAL: <strong style={{ fontFamily: 'monospace', fontSize: '12px', color: '#fff' }}>৳{order.total_amount}</strong>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
