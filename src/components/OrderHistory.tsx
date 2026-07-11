import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface OrderItem {
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  size: string | null;
  color: string | null;
  products?: {
    name: string;
  } | null; // Supabase Foreign Key Join এর মাধ্যমে প্রোডাক্টের নাম আনার জন্য
}

interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        setLoading(true);
        // ১. কারেন্ট লগড-ইন ইউজারকে গেট করা
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('PLEASE LOG IN TO VIEW YOUR ORDER HISTORY.');
          setLoading(false);
          return;
        }

        // ২. ইউজার আইডি অনুযায়ী অর্ডার এবং তার সাথে রিলেটেড আইটেম ও প্রোডাক্টের নাম ফেচ করা
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              product_id,
              quantity,
              price_at_purchase,
              size,
              color,
              products ( name )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setOrders(data || []);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'FAILED TO LOAD ORDERS.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, []);

  // ইনভয়েস ডাউনলোড/প্রিন্ট করার মূল মেথড (আপনার ডিজাইন অনুযায়ী)
  const handleDownloadInvoice = (order: Order) => {
    const orderDate = new Date(order.created_at);
    const year = orderDate.getFullYear();
    const month = String(orderDate.getMonth() + 1).padStart(2, '0');
    const date = String(orderDate.getDate()).padStart(2, '0');
    const hours = String(orderDate.getHours()).padStart(2, '0');
    const minutes = String(orderDate.getMinutes()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${date}`;
    const formattedTime = `${hours}:${minutes}`;

    // সাবটোটাল ক্যালকুলেট করা (আইটেম প্রাইস * কোয়ান্টিটি)
    const subtotal = order.order_items.reduce(
      (acc, item) => acc + item.price_at_purchase * item.quantity, 
      0
    );

    const itemsHtml = order.order_items.map((item) => {
      const detailsArray = [];
      if (item.size) detailsArray.push(`SIZE: ${item.size.toUpperCase()}`);
      if (item.color) detailsArray.push(`COLOR: ${item.color.toUpperCase()}`);
      detailsArray.push(`QTY: ${item.quantity}`); 

      // যদি ফরেন কি জয়েন থেকে নাম না পায়, তবে ব্যাকআপ হিসেবে আইডি দেখাবে
      const productName = item.products?.name || `PRODUCT #${item.product_id}`;

      return `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #eee; font-size: 11px; letter-spacing: 1px; line-height: 1.6; color: #000 !important;">
            <strong style="color: #000 !important; display: block; margin-bottom: 4px;">${productName.toUpperCase()}</strong>
            <div style="color: #555; font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase;">
              ${detailsArray.join(' &nbsp;|&nbsp; ')} &nbsp;•&nbsp; ৳${item.price_at_purchase}
            </div>
          </td>
          <td style="padding: 14px 0; border-bottom: 1px solid #eee; font-size: 11px; text-align: right; font-family: monospace; vertical-align: bottom; color: #000 !important;">৳${item.price_at_purchase * item.quantity}</td>
        </tr>
      `;
    }).join('');

    const printContainer = document.createElement('div');
    printContainer.id = 'nomad-universal-print-area';

    printContainer.innerHTML = `
      <div class="header">NOMAD</div>
      <div class="sub-header">Proforma Invoice / Order Memorandum</div>
      
      <table class="info-table">
        <tr>
          <td style="width: 50%; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px;">
            <span style="color: #666; font-size: 9px; letter-spacing: 1.5px; font-weight: bold; display: block;">SHIPPING TO</span>
          </td>
          <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
            <strong style="color: #000 !important;">ORDER ID:</strong> #${order.id}
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; font-weight: bold; letter-spacing: 0.5px;">
            ${order.customer_name.toUpperCase()}
          </td>
          <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
            <strong style="color: #000 !important;">DATE:</strong> ${formattedDate} &nbsp;&nbsp; <strong style="color: #000 !important;">TIME:</strong> ${formattedTime}
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
            ${order.customer_phone}
          </td>
          <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
            <strong style="color: #000 !important;">PAYMENT:</strong> CASH ON DELIVERY
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px; line-height: 1.4; max-width: 300px;">
            ${order.shipping_address.toUpperCase()}
          </td>
          <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
            <strong style="color: #ff0000; letter-spacing: 1px;">STATUS: ${order.status.toUpperCase() === 'PENDING' ? 'UNPAID / DUE' : order.status.toUpperCase()}</strong>
          </td>
        </tr>
      </table>

      <table class="items-table">
        <thead>
          <tr>
            <th style="text-align: left; padding-bottom: 12px; border-bottom: 1.5px solid #000; font-size: 11px; letter-spacing: 1px; color: #000 !important;">DESCRIPTION</th>
            <th style="text-align: right; padding-bottom: 12px; border-bottom: 1.5px solid #000; font-size: 11px; letter-spacing: 1px; color: #000 !important;">TOTAL</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <table class="summary-table">
        <tr><td style="color: #000 !important;">SUBTOTAL</td><td style="text-align: right; font-family: monospace; color: #000 !important;">৳${subtotal}</td></tr>
        <tr><td style="color: #000 !important;">SHIPPING</td><td style="text-align: right; font-family: monospace; color: #000 !important;">৳${order.delivery_charge}</td></tr>
        <tr><td style="color: #000 !important;">VAT</td><td style="text-align: right; font-family: monospace; color: #000 !important;">৳${order.vat_amount}</td></tr>
        <tr style="font-weight: bold; font-size: 13px; color: #ff0000;">
          <td style="padding-top: 12px; border-top: 1px solid #000; letter-spacing: 1px;">AMOUNT DUE</td>
          <td style="text-align: right; padding-top: 12px; border-top: 1px solid #000; font-family: monospace;">৳${order.total_amount}</td>
        </tr>
      </table>

      <div class="disclaimer">
        <strong>LEGAL NOTICE:</strong> This is a computer-generated order memorandum for Cash on Delivery (COD) transactions. It does not constitute a proof of final payment, sales receipt, or legal ownership of goods. Physical products will remain property of NOMAD until the full invoice amount is successfully collected by our authorized delivery agent.
      </div>
    `;

    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
      @media print {
        @page { margin: 0mm; }
        body { 
          background: #fff !important; 
          color: #000 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        body > *:not(#nomad-universal-print-area) {
          display: none !important;
        }
        #nomad-universal-print-area {
          display: block !important;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: #fff !important;
          color: #000 !important;
          padding: 50px 40px !important;
          box-sizing: border-box;
          font-family: sans-serif;
        }
        .header { text-align: center; margin-bottom: 10px; letter-spacing: 6px; font-weight: bold; font-size: 22px; color: #000 !important; }
        .sub-header { text-align: center; font-size: 10px; letter-spacing: 3px; color: #666 !important; margin-bottom: 50px; text-transform: uppercase; }
        .info-table { width: 100%; margin-bottom: 40px; font-size: 11px; letter-spacing: 0.5px; border-collapse: collapse; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
        .summary-table { width: 40%; margin-left: auto; font-size: 11px; line-height: 2; letter-spacing: 0.5px; margin-bottom: 60px; page-break-inside: avoid !important; }
        .disclaimer { font-size: 9px; color: #777 !important; line-height: 1.6; text-align: center; border-top: 1px solid #eee; padding-top: 20px; letter-spacing: 0.5px; page-break-inside: avoid; }
      }
      @media screen {
        #nomad-universal-print-area { display: none !important; }
      }
    `;

    document.body.appendChild(printContainer);
    document.head.appendChild(styleSheet);

    setTimeout(() => {
      window.print();
      if (document.getElementById('nomad-universal-print-area')) {
        document.body.removeChild(printContainer);
      }
      document.head.removeChild(styleSheet);
    }, 150);
  };

  if (loading) {
    return <div style={styles.centerText}>LOADING ORDER HISTORY...</div>;
  }

  if (error) {
    return <div style={{ ...styles.centerText, color: '#ff4d4d' }}>{error}</div>;
  }

  if (orders.length === 0) {
    return <div style={styles.centerText}>NO ORDERS FOUND YET.</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>ORDER HISTORY</h1>
      
      <div style={styles.orderList}>
        {orders.map((order) => (
          <div key={order.id} style={styles.orderCard}>
            <div style={styles.orderHeader}>
              <div>
                <span style={styles.orderId}>ORDER ID: #{order.id}</span>
                <span style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <span style={{ 
                ...styles.statusBadge, 
                color: order.status === 'pending' ? '#ffaa00' : '#00ff66' 
              }}>
                {order.status.toUpperCase()}
              </span>
            </div>

            <div style={styles.itemSummary}>
              {order.order_items.map((item, idx) => (
                <div key={idx} style={styles.itemRow}>
                  <span>
                    {item.products?.name?.toUpperCase() || `PRODUCT #${item.product_id}`} 
                    <span style={styles.itemMeta}>
                      {item.size ? ` (${item.size.toUpperCase()})` : ''}
                      {item.color ? ` - ${item.color.toUpperCase()}` : ''} × {item.quantity}
                    </span>
                  </span>
                  <span style={styles.itemPrice}>৳{item.price_at_purchase * item.quantity}</span>
                </div>
              ))}
            </div>

            <div style={styles.orderFooter}>
              <div style={styles.totalAmount}>
                TOTAL: <span style={{ fontFamily: 'monospace' }}>৳{order.total_amount}</span>
              </div>
              <button 
                onClick={() => handleDownloadInvoice(order)} 
                style={styles.invoiceBtn}
              >
                DOWNLOAD MEMO
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  pageTitle: {
    fontSize: '14px',
    letterSpacing: '4px',
    fontWeight: 600,
    textAlign: 'center' as const,
    marginBottom: '40px',
  },
  centerText: {
    textAlign: 'center' as const,
    padding: '100px 20px',
    color: '#888',
    fontSize: '11px',
    letterSpacing: '2px',
    backgroundColor: '#000',
    minHeight: '50vh',
  },
  orderList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '25px',
  },
  orderCard: {
    border: '1px solid #111',
    backgroundColor: '#050505',
    padding: '20px',
    boxSizing: 'border-box' as const,
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #111',
    paddingBottom: '12px',
    marginBottom: '15px',
  },
  orderId: {
    fontSize: '11px',
    letterSpacing: '1px',
    fontWeight: 600,
    display: 'block',
    marginBottom: '4px',
  },
  orderDate: {
    fontSize: '10px',
    color: '#555',
    letterSpacing: '0.5px',
  },
  statusBadge: {
    fontSize: '10px',
    letterSpacing: '1.5px',
    fontWeight: 600,
  },
  itemSummary: {
    paddingBottom: '15px',
    borderBottom: '1px dotted #161616',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    letterSpacing: '1px',
    marginBottom: '8px',
    color: '#aaa',
  },
  itemMeta: {
    fontSize: '10px',
    color: '#555',
    marginLeft: '6px',
  },
  itemPrice: {
    fontFamily: 'monospace',
    color: '#fff',
  },
  orderFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '15px',
  },
  totalAmount: {
    fontSize: '12px',
    letterSpacing: '1.5px',
    fontWeight: 500,
  },
  invoiceBtn: {
    background: 'transparent',
    border: '1px solid #333',
    color: '#888',
    padding: '8px 14px',
    fontSize: '9px',
    letterSpacing: '2px',
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    transition: 'all 0.2s ease',
    outline: 'none',
  },
};
