import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface OrderItem {
  id: string; // ইউনিক আইডেন্টিফায়ার (ফরেন কি বা আইটেম আইডি)
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  size: string | null;
  color: string | null;
  products?: {
    name: string;
  } | null;
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

  // ম্যানেজ মোড ট্র্যাকিং (কোন অর্ডার আইডিটি এখন ম্যানেজ মোডে আছে)
  const [managingOrderId, setManagingOrderId] = useState<string | null>(null);
  // মাল্টিপল সিলেক্টেড আইটেম আইডি ট্র্যাকিং
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('PLEASE LOG IN TO VIEW YOUR ORDER HISTORY.');
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
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

  // ১. ক্রস চিহ্নে ক্লিক করে সিঙ্গেল আইটেম রিমুভ করা এবং টোটাল অ্যামাউন্ট আপডেট করা
  const handleRemoveSingleItem = async (orderId: string, itemId: string) => {
    // এখানে চাইলে Supabase ডিলিট কুয়েরিও যুক্ত করতে পারেন:
    // await supabase.from('order_items').delete().eq('id', itemId);

    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id !== orderId) return order;
        
        const updatedItems = order.order_items.filter(item => item.id !== itemId);
        const newSubtotal = updatedItems.reduce((acc, item) => acc + (item.price_at_purchase * item.quantity), 0);
        const newTotal = newSubtotal + order.delivery_charge + order.vat_amount;

        return {
          ...order,
          order_items: updatedItems,
          total_amount: updatedItems.length === 0 ? 0 : newTotal
        };
      }).filter(order => order.order_items.length > 0) // সব আইটেম ডিলিট হলে অর্ডারটিই রিমুভ হয়ে যাবে
    );
  };

  // ২. ম্যানেজ মোড অন/অফ টগল করা
  const handleToggleManageMode = (orderId: string) => {
    if (managingOrderId === orderId) {
      setManagingOrderId(null);
      setSelectedItemIds([]);
    } else {
      setManagingOrderId(orderId);
      setSelectedItemIds([]);
    }
  };

  // ৩. একাধিক সিলেক্ট করার জন্য আইটেম টগল লজিক
  const handleToggleSelectItem = (itemId: string) => {
    setSelectedItemIds(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  // ৪. একাধিক সিলেক্টেড আইটেম একসাথে রিমুভ করা (Bulk Remove)
  const handleRemoveSelectedItems = (orderId: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id !== orderId) return order;

        const updatedItems = order.order_items.filter(item => !selectedItemIds.includes(item.id));
        const newSubtotal = updatedItems.reduce((acc, item) => acc + (item.price_at_purchase * item.quantity), 0);
        const newTotal = newSubtotal + order.delivery_charge + order.vat_amount;

        return {
          ...order,
          order_items: updatedItems,
          total_amount: updatedItems.length === 0 ? 0 : newTotal
        };
      }).filter(order => order.order_items.length > 0)
    );

    // রিসেট স্টেট
    setManagingOrderId(null);
    setSelectedItemIds([]);
  };

  // ৫. অরিজিনাল ইনভয়েস প্রিন্ট করার মেথড (লাইভ স্ট্যাটাস ও চেক মার্ক সহ)
  const handleDownloadInvoice = (order: Order) => {
    const orderDate = new Date(order.created_at);
    const formattedDate = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
    const formattedTime = `${String(orderDate.getHours()).padStart(2, '0')}:${String(orderDate.getMinutes()).padStart(2, '0')}`;

    const subtotal = order.order_items.reduce((acc, item) => acc + item.price_at_purchase * item.quantity, 0);

    const currentStatus = order.status.toUpperCase();
    let statusHtml = '';
    
    if (currentStatus === 'PENDING') {
      statusHtml = `<strong style="color: #ff0000; letter-spacing: 1px;">STATUS: UNPAID / DUE</strong>`;
    } else if (currentStatus === 'DELIVERED' || currentStatus === 'PAID') {
      statusHtml = `<strong style="color: #00ff66; letter-spacing: 1px;"><span style="font-size: 14px;">✓</span> STATUS: ${currentStatus}</strong>`;
    } else {
      statusHtml = `<strong style="color: #ffaa00; letter-spacing: 1px;">STATUS: ${currentStatus}</strong>`;
    }

    const itemsHtml = order.order_items.map((item) => {
      const detailsArray = [];
      if (item.size) detailsArray.push(`SIZE: ${item.size.toUpperCase()}`);
      if (item.color) detailsArray.push(`COLOR: ${item.color.toUpperCase()}`);
      detailsArray.push(`QTY: ${item.quantity}`); 

      const productName = item.products?.name || `PRODUCT #${item.product_id}`;

      return `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #eee; font-size: 11px; letter-spacing: 1px; line-height: 1.6; color: #000 !important;">
            <strong style="color: #000 !important; display: block; margin-bottom: 4px;">${productName.toUpperCase()}</strong>
            <div style="color: #555; font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase;">
              ${detailsArray.join(' &nbsp;|&nbsp; ')} &nbsp;•&nbsp; ৳${item.price_at_purchase}
            </div>
          </td>
          <td style="padding: 14px 0; border-bottom: 1px solid #eee; font-size: 11px; text-align: right; font-family: monospace; vertical-align: bottom; color: #000 !important;">
            ৳${item.price_at_purchase * item.quantity}
          </td>
        </tr>
      `;
    }).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Please allow popups to print invoices.');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - #${order.id}</title>
        <style>
          body { background: #fff !important; color: #000 !important; margin: 0 !important; padding: 50px 40px !important; font-family: sans-serif; box-sizing: border-box; }
          .header { text-align: center; margin-bottom: 10px; letter-spacing: 6px; font-weight: bold; font-size: 22px; color: #000 !important; }
          .sub-header { text-align: center; font-size: 10px; letter-spacing: 3px; color: #666 !important; margin-bottom: 50px; text-transform: uppercase; }
          .info-table { width: 100%; margin-bottom: 40px; font-size: 11px; letter-spacing: 0.5px; border-collapse: collapse; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          .summary-table { width: 40%; margin-left: auto; font-size: 11px; line-height: 2; letter-spacing: 0.5px; margin-bottom: 60px; page-break-inside: avoid !important; }
          .disclaimer { font-size: 9px; color: #777 !important; line-height: 1.6; text-align: center; border-top: 1px solid #eee; padding-top: 20px; letter-spacing: 0.5px; page-break-inside: avoid; }
          @media print { @page { margin: 0mm; } body { padding: 50px 40px !important; } }
        </style>
      </head>
      <body>
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
            <td style="padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; font-weight: bold; letter-spacing: 0.5px;">${order.customer_name.toUpperCase()}</td>
            <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
              <strong style="color: #000 !important;">DATE:</strong> ${formattedDate} &nbsp;&nbsp; <strong style="color: #000 !important;">TIME:</strong> ${formattedTime}
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">${order.customer_phone}</td>
            <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
              <strong style="color: #000 !important;">PAYMENT:</strong> CASH ON DELIVERY
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px; line-height: 1.4; max-width: 300px;">${order.shipping_address.toUpperCase()}</td>
            <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">${statusHtml}</td>
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
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  if (loading) return <div style={styles.centerText}>LOADING ORDER HISTORY...</div>;
  if (error) return <div style={{ ...styles.centerText, color: '#ff4d4d' }}>{error}</div>;
  if (orders.length === 0) return <div style={styles.centerText}>NO ORDERS FOUND YET.</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>ORDER HISTORY</h1>
      <div style={styles.orderList}>
        {orders.map((order) => {
          const isCurrentOrderManaging = managingOrderId === order.id;

          return (
            <div key={order.id} style={styles.orderCard}>
              <div style={styles.orderHeader}>
                <div>
                  <span style={styles.orderId}>ORDER ID: #{order.id}</span>
                  <span style={styles.orderDate}>
                    {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {/* কাস্টম ম্যানেজ বাটন */}
                  <button 
                    onClick={() => handleToggleManageMode(order.id)} 
                    style={{
                      ...styles.manageBtn,
                      color: isCurrentOrderManaging ? '#ff0000' : '#888',
                      borderColor: isCurrentOrderManaging ? '#ff0000' : '#222'
                    }}
                  >
                    {isCurrentOrderManaging ? 'EXIT' : 'MANAGE'}
                  </button>

                  {/* লাইভ স্ট্যাটাস থিম */}
                  <span style={{ 
                    ...styles.statusBadge, 
                    color: order.status.toLowerCase() === 'pending' ? '#ff0000' : order.status.toLowerCase() === 'delivered' || order.status.toLowerCase() === 'paid' ? '#00ff66' : '#ffaa00'
                  }}>
                    {order.status.toLowerCase() === 'delivered' || order.status.toLowerCase() === 'paid' ? '✓ ' : ''}{order.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* ডানে-বামে উঁকি দিয়ে থাকা (Peek-a-boo) কাস্টম স্ক্রল এরিয়া */}
              <div style={styles.scrollWrapper} className="hide-scrollbar">
                {order.order_items.map((item) => {
                  const isSelected = selectedItemIds.includes(item.id);

                  return (
                    <div key={item.id} style={styles.productCard}>
                      {/* ম্যানেজ মোডে থাকলে সিলেক্ট চেক মার্কার দেখাবে */}
                      {isCurrentOrderManaging ? (
                        <div 
                          onClick={() => handleToggleSelectItem(item.id)}
                          style={{
                            ...styles.checkbox,
                            backgroundColor: isSelected ? '#fff' : 'transparent',
                            borderColor: isSelected ? '#fff' : '#444'
                          }}
                        >
                          {isSelected && <span style={{ color: '#000', fontSize: '9px', fontWeight: 'bold' }}>✓</span>}
                        </div>
                      ) : (
                        /* সাধারণ মোডে ক্রস চিহ্নে ক্লিক করে ডিলিট করার অপশন */
                        <button 
                          onClick={() => handleRemoveSingleItem(order.id, item.id)} 
                          style={styles.crossBtn}
                        >
                          ✕
                        </button>
                      )}

                      <div style={styles.productDetails}>
                        <div style={styles.productName}>
                          {item.products?.name?.toUpperCase() || `PRODUCT #${item.product_id}`}
                        </div>
                        <div style={styles.productMeta}>
                          {item.size ? `SIZE: ${item.size.toUpperCase()}` : ''}
                          {item.color ? ` | COL: ${item.color.toUpperCase()}` : ''}
                          {` | QTY: ${item.quantity}`}
                        </div>
                        <div style={styles.productPrice}>
                          ৳{item.price_at_purchase * item.quantity}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={styles.orderFooter}>
                <div style={styles.totalAmount}>
                  TOTAL: <span style={{ fontFamily: 'monospace' }}>৳{order.total_amount}</span>
                </div>
                
                {/* মোড অনুযায়ী অ্যাকশন বাটন চেঞ্জার */}
                {isCurrentOrderManaging ? (
                  <button 
                    onClick={() => handleRemoveSelectedItems(order.id)}
                    disabled={selectedItemIds.length === 0}
                    style={{
                      ...styles.invoiceBtn,
                      color: selectedItemIds.length > 0 ? '#ff0000' : '#444',
                      borderColor: selectedItemIds.length > 0 ? '#ff0000' : '#222',
                      cursor: selectedItemIds.length > 0 ? 'pointer' : 'not-allowed'
                    }}
                  >
                    REMOVE SELECTED ({selectedItemIds.length})
                  </button>
                ) : (
                  <button onClick={() => handleDownloadInvoice(order)} style={styles.invoiceBtn}>
                    DOWNLOAD MEMO
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* স্ক্রলবার হাইড করার গ্লোবাল সিএসএস ইনজেকশন */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
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
    gap: '30px',
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
    paddingBottom: '14px',
    marginBottom: '20px',
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
  manageBtn: {
    background: 'transparent',
    border: '1px solid #222',
    padding: '4px 8px',
    fontSize: '9px',
    letterSpacing: '1px',
    cursor: 'pointer',
    outline: 'none',
  },
  // উঁকি দিয়ে থাকা (Peek) হরিজন্টাল স্ক্রল স্টাইল
  scrollWrapper: {
    display: 'flex',
    overflowX: 'auto' as const,
    gap: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #111',
    scrollSnapType: 'x mandatory' as const,
  },
  // প্রতিটি প্রডাক্ট কার্ড ফ্লেক্স বেসিসে ৭৫% নেওয়াতে পরের প্রডাক্ট ডানে সামান্য উঁকি দিয়ে থাকবে
  productCard: {
    flex: '0 0 75%',
    backgroundColor: '#0a0a0a',
    border: '1px solid #161616',
    padding: '15px',
    position: 'relative' as const,
    scrollSnapAlign: 'start' as const,
    boxSizing: 'border-box' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    minHeight: '100px',
  },
  crossBtn: {
    position: 'absolute' as const,
    top: '10px',
    right: '12px',
    background: 'transparent',
    border: 'none',
    color: '#444',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '4px',
  },
  checkbox: {
    position: 'absolute' as const,
    top: '10px',
    right: '12px',
    width: '14px',
    height: '14px',
    border: '1px solid #444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  productDetails: {
    marginTop: '5px',
  },
  productName: {
    fontSize: '11px',
    letterSpacing: '1px',
    fontWeight: 600,
    color: '#fff',
    marginBottom: '6px',
    paddingRight: '20px',
  },
  productMeta: {
    fontSize: '10px',
    color: '#555',
    letterSpacing: '0.5px',
    marginBottom: '10px',
  },
  productPrice: {
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#aaa',
  },
  orderFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
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
