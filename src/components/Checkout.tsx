import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image_url?: string;
}

export default function Checkout({ selectedItems, onSuccess }: { selectedItems: CartItem[], onSuccess: () => void }) {
  const { clearCart } = useCart() as any;

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [isMobile, setIsMobile] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false); 

  const [deliveryCharge, setDeliveryCharge] = useState<number>(100); 
  const [vatRate, setVatRate] = useState<number>(0.05); 
  const [placedOrderDetails, setPlacedOrderDetails] = useState<any>(null); 

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 960);
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const fetchStoreSettings = async () => {
      try {
        const { data, error = null } = await supabase
          .from('store_settings')
          .select('delivery_charge, vat_rate')
          .single();
        
        if (data && !error) {
          setDeliveryCharge(data.delivery_charge);
          setVatRate(Number(data.vat_rate));
        }
      } catch (err) {
        console.error("Settings fetch failed, using fallbacks:", err);
      }
    };

    fetchStoreSettings();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // অর্ডার প্লেস হলে অটোমেটিক স্ক্রিনের একদম ওপরে স্ক্রল করার জন্য এফেক্ট
  useEffect(() => {
    if (isOrderPlaced) {
      window.scrollTo(0, 0);
    }
  }, [isOrderPlaced]);

  const subtotal = selectedItems.reduce((acc: number, item: CartItem) => acc + item.price * item.quantity, 0);
  const vatAmount = Math.round(subtotal * vatRate);
  const grandTotal = subtotal + deliveryCharge + vatAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      return setErrorMessage('PLEASE FILL IN ALL REQUIRED SHIPPING FIELDS.');
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user?.id || null, 
          customer_name: formData.name,
          customer_phone: formData.phone,
          shipping_address: formData.address, 
          sender_phone: null,
          payment_method: 'cod',
          transaction_id: null,
          delivery_charge: deliveryCharge, 
          vat_amount: vatAmount,           
          total_amount: grandTotal, 
          status: 'pending' 
        }])
        .select().single();

      if (orderError) throw orderError;

      const items = selectedItems.map((item: CartItem) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
        size: item.size || null,   
        color: item.color || null  
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) throw itemsError;

      setPlacedOrderDetails({
        orderId: order.id,
        customerName: formData.name,
        customerPhone: formData.phone,
        shippingAddress: formData.address,
        items: [...selectedItems],
        subtotal,
        deliveryCharge,
        vatAmount,
        grandTotal
      });

      clearCart(); 
      setIsOrderPlaced(true); 
    } catch (err: any) {
      setErrorMessage(err.message || 'ORDER FAILED. PLEASE TRY AGAIN.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!placedOrderDetails) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = placedOrderDetails.items.map((item: any) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-size: 12px;">${item.name.toUpperCase()} (QTY: ${item.quantity})</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-size: 12px; text-align: right; font-family: monospace;">৳${item.price * item.quantity}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>INVOICE - NOMAD</title>
          <style>
            body { font-family: sans-serif; color: #000; background: #fff; padding: 40px; margin: 0; }
            .header { text-align: center; margin-bottom: 40px; letter-spacing: 4px; font-weight: bold; font-size: 20px; }
            .info-table { width: 100%; margin-bottom: 30px; font-size: 12px; line-height: 1.6; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .summary-table { width: 40%; margin-left: auto; font-size: 12px; line-height: 1.8; }
          </style>
        </head>
        <body>
          <div class="header">NOMAD</div>
          <table class="info-table">
            <tr>
              <td>
                <strong>SHIPPING DETAILS:</strong><br>
                ${placedOrderDetails.customerName}<br>
                ${placedOrderDetails.customerPhone}<br>
                ${placedOrderDetails.shippingAddress}
              </td>
              <td style="text-align: right; vertical-align: top;">
                <strong>ORDER ID:</strong> #${placedOrderDetails.orderId}<br>
                <strong>DATE:</strong> ${new Date().toLocaleDateString()}<br>
                <strong>PAYMENT:</strong> CASH ON DELIVERY
              </td>
            </tr>
          </table>
          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: left; padding-bottom: 10px; border-bottom: 2px solid #000; font-size: 12px;">ITEM</th>
                <th style="text-align: right; padding-bottom: 10px; border-bottom: 2px solid #000; font-size: 12px;">TOTAL</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <table class="summary-table">
            <tr><td>SUBTOTAL</td><td style="text-align: right; font-family: monospace;">৳${placedOrderDetails.subtotal}</td></tr>
            <tr><td>SHIPPING</td><td style="text-align: right; font-family: monospace;">৳${placedOrderDetails.deliveryCharge}</td></tr>
            <tr><td>VAT</td><td style="text-align: right; font-family: monospace;">৳${placedOrderDetails.vatAmount}</td></tr>
            <tr style="font-weight: bold; font-size: 14px;"><td style="padding-top: 10px; border-top: 1px solid #000;">TOTAL</td><td style="text-align: right; padding-top: 10px; border-top: 1px solid #000; font-family: monospace;">৳${placedOrderDetails.grandTotal}</td></tr>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const styles = {
    container: {
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: isMobile ? '10px 15px 120px 15px' : '50px 20px 80px 20px',
      color: '#fff',
      backgroundColor: '#000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minHeight: isMobile ? '100vh' : 'auto',
      boxSizing: 'border-box' as const,
    },
    // ⚡ নতুন কন্ডিশনাল টপ হেডার স্টাইল
    topHeader: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative' as const,
      paddingBottom: '15px',
      marginBottom: '30px',
      borderBottom: '1px solid #111',
    },
    topHeaderTitle: {
      fontSize: '13px',
      letterSpacing: '4px',
      fontWeight: 600,
      color: '#fff',
    },
    closeBtn: {
      position: 'absolute' as const,
      right: 0,
      background: 'none',
      border: 'none',
      color: '#fff',
      fontSize: '16px',
      cursor: 'pointer',
      outline: 'none',
      padding: '5px',
    },
    layoutGrid: {
      display: 'flex',
      flexDirection: isMobile ? 'column-reverse' as const : 'row' as const,
      gap: isMobile ? '30px' : '60px',
      alignItems: 'flex-start',
    },
    leftColumn: {
      flex: '1 1 58%',
      width: '100%',
    },
    rightColumn: {
      flex: '1 1 42%',
      width: '100%',
      position: isMobile ? 'relative' as const : 'sticky' as const,
      top: '40px',
      background: '#000',
      padding: isMobile ? '10px 0' : '20px',
      boxSizing: 'border-box' as const,
    },
    sectionHeading: {
      fontSize: '11px',
      letterSpacing: '3px',
      color: '#fff',
      textTransform: 'uppercase' as const,
      marginBottom: '20px',
      marginTop: '30px',
      fontWeight: 600,
    },
    input: {
      width: '100%',
      boxSizing: 'border-box' as const,
      background: 'transparent',
      border: 'none',
      borderBottom: '1px solid #161616',
      padding: '12px 0', 
      color: '#fff',
      fontSize: '11px',
      letterSpacing: '2px',
      marginBottom: '10px', 
      outline: 'none',
      borderRadius: 0,
    },
    textarea: {
      width: '100%',
      boxSizing: 'border-box' as const,
      background: 'transparent',
      border: 'none',
      borderBottom: '1px solid #161616',
      padding: '12px 0', 
      color: '#fff',
      fontSize: '11px',
      letterSpacing: '2px',
      marginBottom: '10px', 
      outline: 'none',
      borderRadius: 0,
      resize: 'none' as const,
      height: '45px',
      fontFamily: 'inherit',
    },
    paymentRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid #161616',
      padding: '14px 0', 
      marginTop: '30px',
      marginBottom: '25px',
      cursor: 'default',
      userSelect: 'none' as const,
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    paymentText: {
      fontSize: '11px',
      letterSpacing: '2px',
      color: '#fff',
      fontWeight: 500,
      textTransform: 'uppercase' as const,
    },
    customCircleCheckbox: {
      width: '16px',
      height: '16px',
      backgroundColor: '#fff',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      color: '#000',
      fontWeight: 'bold' as const,
      lineHeight: 1,
      flexShrink: 0,
    },
    productRow: {
      display: 'flex',
      gap: '20px',
      alignItems: 'center',
      paddingBottom: '20px',
      marginBottom: '20px',
      borderBottom: '1px solid #0d0d0d',
    },
    productImg: {
      width: '65px',
      height: '80px',
      objectFit: 'cover' as const,
      background: '#0a0a0a',
    },
    submitBtn: {
      width: '100%',
      height: '52px', 
      background: 'transparent', 
      border: '1.5px solid #fff',  
      color: '#fff',             
      cursor: 'pointer',
      letterSpacing: '4px',
      fontSize: '11px',
      fontWeight: 500,
      textTransform: 'uppercase' as const,
      marginTop: '35px',
      borderRadius: 0,
      outline: 'none',
      WebkitAppearance: 'none' as const,
      MozAppearance: 'none' as const,
      appearance: 'none' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box' as const,
    },
    successWrapper: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center', 
      paddingTop: isMobile ? '30px' : '60px', 
      paddingBottom: '40px',
      textAlign: 'center' as const,
      maxWidth: '450px',
      margin: '0 auto',
      boxSizing: 'border-box' as const,
    },
    invoiceLink: {
      fontSize: '11px',
      letterSpacing: '2px',
      color: '#888',
      cursor: 'pointer',
      textDecoration: 'none' as const, // কোনো আন্ডারলাইন বা দাগ থাকবে না
      textTransform: 'uppercase' as const,
      background: 'none',
      border: 'none',
      outline: 'none',
      padding: '5px 10px',
    }
  };

  // 🌟 অর্ডার সাকসেস স্ক্রিন (এখানে কোনো CHECKOUT হেডার বা ক্রস বাটন নেই)
  if (isOrderPlaced) {
    return (
      <div style={styles.container}>
        <div style={styles.successWrapper}>
          <div style={{ fontSize: '32px', marginBottom: '15px', color: '#fff', lineHeight: 1 }}>✓</div>
          
          <h2 style={{ fontSize: '13px', letterSpacing: '4px', fontWeight: 600, marginBottom: '20px', color: '#fff' }}>
            ORDER PLACED SUCCESSFULLY
          </h2>
          
          <p style={{ fontSize: '10px', letterSpacing: '2px', color: '#888', lineHeight: '2', marginBottom: '40px', textTransform: 'uppercase' as const, padding: '0 10px' }}>
            Thank you for your purchase. Your order has been received and is currently being processed. Registered users can also track this in their profile.
          </p>
          
          <button onClick={handleDownloadInvoice} style={styles.invoiceLink}>
            DOWNLOAD INVOICE
          </button>

          <button onClick={onSuccess} style={{ ...styles.submitBtn, marginTop: '25px', maxWidth: '260px', margin: '25px auto 0 auto' }}>
            CONTINUE SHOPPING
          </button>
        </div>
      </div>
    );
  }

  // 🌟 রেগুলার চেকআউট স্ক্রিন (ফর্ম পূরণের সময় ওপরে CHECKOUT হেডার দেখাবে)
  return (
    <div style={styles.container}>
      
      {/* ⚡ মেইন চেকআউট হেডার: যা সফল স্ক্রিনে সম্পূর্ণ হাইড থাকবে */}
      <div style={styles.topHeader}>
        <span style={styles.topHeaderTitle}>CHECKOUT</span>
        <button type="button" onClick={onSuccess} style={styles.closeBtn}>✕</button>
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>
        <div style={styles.layoutGrid}>

          {/* বাম পাশ: ফর্ম */}
          <div style={styles.leftColumn}>
            <h2 style={styles.sectionHeading}>SHIPPING ADDRESS</h2>
            <input
              style={styles.input}
              placeholder="FULL NAME"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <input
              style={styles.input}
              placeholder="CONTACT NUMBER"
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <textarea
              style={styles.textarea}
              placeholder="COMPLETE SHIPPING ADDRESS"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />

            <div style={styles.paymentRow}>
              <span style={styles.paymentText}>CASH ON DELIVERY</span>
              <div style={styles.customCircleCheckbox}>✓</div>
            </div>

            {errorMessage && (
              <div style={{ color: '#ff4d4d', fontSize: '10px', letterSpacing: '2px', marginTop: '20px', textTransform: 'uppercase' }}>
                {errorMessage}
              </div>
            )}

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'PROCESSING...' : 'PLACE ORDER'}
            </button>
          </div>

          {/* ডান পাশ: অর্ডার সামারি */}
          <div style={styles.rightColumn}>
            <h2 style={{ ...styles.sectionHeading, marginTop: 0, borderBottom: '1px solid #111', paddingBottom: '15px' }}>ORDER SUMMARY</h2>

            <div>
              {selectedItems.map((item: CartItem) => (
                <div key={item.id} style={styles.productRow}>
                  <img src={item.image_url || 'https://via.placeholder.com/65x80'} alt={item.name} style={styles.productImg} />
                  <div style={{ flexGrow: 1 }}> 
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '11px', letterSpacing: '1.5px', fontWeight: 500 }}>{item.name.toUpperCase()}</span>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>৳{item.price * item.quantity}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#444', letterSpacing: '1px' }}>
                      QTY: {item.quantity} {item.color && ` • ${item.color.toUpperCase()}`} {item.size && ` / ${item.size.toUpperCase()}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1.5px', marginBottom: '15px', color: '#666' }}>
                <span>SUBTOTAL</span>
                <span style={{ fontFamily: 'monospace' }}>৳{subtotal}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1.5px', marginBottom: '15px', color: '#666' }}>
                <span>SHIPPING</span>
                <span style={{ fontFamily: 'monospace', color: deliveryCharge === 0 ? '#fff' : '#666' }}>
                  {deliveryCharge === 0 ? 'COMPLIMENTARY' : `৳${deliveryCharge}`}
                </span>
              </div>

              {vatRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1.5px', marginBottom: '15px', color: '#666' }}>
                  <span>VAT ({vatRate * 100}%)</span>
                  <span style={{ fontFamily: 'monospace' }}>৳{vatAmount}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', letterSpacing: '2px', paddingTop: '20px', borderTop: '1px dotted #222', color: '#fff', fontWeight: 600, marginTop: '25px' }}>
                <span>TOTAL</span>
                <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>৳{grandTotal}</span>
              </div>
            </div>

          </div>

        </div>
      </form>
    </div>
  );
}
