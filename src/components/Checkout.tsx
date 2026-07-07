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

export default function Checkout({ 
  selectedItems, 
  onSuccess, 
  onOrderPlaced 
}: { 
  selectedItems: CartItem[], 
  onSuccess: () => void,
  onOrderPlaced?: (placed: boolean) => void
}) {
  const { removeFromCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [isMobile, setIsMobile] = useState(false);
  const [isOrderPlacedState, setIsOrderPlacedState] = useState(false); 

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

  useEffect(() => {
    if (isOrderPlacedState) {
      window.scrollTo(0, 0);
      if (onOrderPlaced) {
        onOrderPlaced(true);
      }
    }
  }, [isOrderPlacedState, onOrderPlaced]);

  const subtotal = selectedItems.reduce((acc: number, item: CartItem) => acc + item.price * item.quantity, 0);
  const vatAmount = Math.round(subtotal * vatRate);
  const grandTotal = subtotal + deliveryCharge + vatAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      return setErrorMessage('PLEASE FILL IN ALL REQUIRED SHIPPING FIELDS.');
    }

    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    const cleanPhone = formData.phone.trim();
    if (!bdPhoneRegex.test(cleanPhone)) {
      return setErrorMessage('INVALID CONTACT NUMBER. PLEASE ENTER A VALID 11-DIGIT NUMBER (EG. 017XXXXXXXX).');
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user?.id || null, 
          customer_name: formData.name,
          customer_phone: cleanPhone,
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

      // 🔥 [NEW LOGIC] গ্রাহক লগইন না থাকলে ট্র্যাকিংয়ের জন্য ব্রাউজারে আইডি সেভ করে রাখছি
      if (!user) {
        localStorage.setItem('nomad_guest_order_id', order.id);
      }

      setPlacedOrderDetails({
        orderId: order.id,
        customerName: formData.name,
        customerPhone: cleanPhone,
        shippingAddress: formData.address,
        items: [...selectedItems],
        subtotal,
        deliveryCharge,
        vatAmount,
        grandTotal
      });

      selectedItems.forEach((item: CartItem) => {
        removeFromCart(item.id, item.color, item.size);
      });

      setIsOrderPlacedState(true); 
    } catch (err: any) {
      setErrorMessage(err.message || 'ORDER FAILED. PLEASE TRY AGAIN.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!placedOrderDetails) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const formattedDate = `${year}-${month}-${date}`;
    const formattedTime = `${hours}:${minutes}`;

    const itemsHtml = placedOrderDetails.items.map((item: any) => {
      const detailsArray = [];
      if (item.size) detailsArray.push(`SIZE: ${item.size.toUpperCase()}`);
      if (item.color) detailsArray.push(`COLOR: ${item.color.toUpperCase()}`);
      detailsArray.push(`QTY: ${item.quantity}`); 
      
      return `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #eee; font-size: 11px; letter-spacing: 1px; line-height: 1.6; color: #000 !important;">
            <strong style="color: #000 !important; display: block; margin-bottom: 4px;">${item.name.toUpperCase()}</strong>
            <div style="color: #555; font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase;">
              ${detailsArray.join(' &nbsp;|&nbsp; ')} &nbsp;•&nbsp; ৳${item.price}
            </div>
          </td>
          <td style="padding: 14px 0; border-bottom: 1px solid #eee; font-size: 11px; text-align: right; font-family: monospace; vertical-align: bottom; color: #000 !important;">৳${item.price * item.quantity}</td>
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
            <strong style="color: #000 !important;">ORDER ID:</strong> #${placedOrderDetails.orderId}
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; font-weight: bold; letter-spacing: 0.5px;">
            ${placedOrderDetails.customerName.toUpperCase()}
          </td>
          <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
            <strong style="color: #000 !important;">DATE:</strong> ${formattedDate} &nbsp;&nbsp; <strong style="color: #000 !important;">TIME:</strong> ${formattedTime}
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
            ${placedOrderDetails.customerPhone}
          </td>
          <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
            <strong style="color: #000 !important;">PAYMENT:</strong> CASH ON DELIVERY
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px; line-height: 1.4; max-width: 300px;">
            ${placedOrderDetails.shippingAddress.toUpperCase()}
          </td>
          <td style="text-align: right; padding: 4px 0; vertical-align: top; color: #000 !important; font-size: 11px; letter-spacing: 0.5px;">
            <strong style="color: #ff0000; letter-spacing: 1px;">STATUS: UNPAID / DUE</strong>
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
        <tr><td style="color: #000 !important;">SUBTOTAL</td><td style="text-align: right; font-family: monospace; color: #000 !important;">৳${placedOrderDetails.subtotal}</td></tr>
        <tr><td style="color: #000 !important;">SHIPPING</td><td style="text-align: right; font-family: monospace; color: #000 !important;">৳${placedOrderDetails.deliveryCharge}</td></tr>
        <tr><td style="color: #000 !important;">VAT</td><td style="text-align: right; font-family: monospace; color: #000 !important;">৳${placedOrderDetails.vatAmount}</td></tr>
        <tr style="font-weight: bold; font-size: 13px; color: #ff0000;">
          <td style="padding-top: 12px; border-top: 1px solid #000; letter-spacing: 1px;">AMOUNT DUE</td>
          <td style="text-align: right; padding-top: 12px; border-top: 1px solid #000; font-family: monospace;">৳${placedOrderDetails.grandTotal}</td>
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
    successOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      zIndex: 99999, 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box' as const,
      padding: '20px',
    },
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
      textDecoration: 'none' as const, 
      textTransform: 'uppercase' as const,
      background: 'none',
      border: 'none',
      outline: 'none',
      padding: '5px 10px',
    }
  };

  if (isOrderPlacedState) {
    return (
      <div style={styles.successOverlay}>
        <div style={styles.successWrapper}>
          <div style={{ fontSize: '32px', marginBottom: '15px', color: '#fff', lineHeight: 1 }}>✓</div>
          
          <h2 style={{ fontSize: '13px', letterSpacing: '4px', fontWeight: 600, marginBottom: '20px', color: '#fff' }}>
            ORDER PLACED SUCCESSFULLY
          </h2>
          
          <p style={{ fontSize: '10px', letterSpacing: '2px', color: '#888', lineHeight: '2', marginBottom: '40px', textTransform: 'uppercase' as const, padding: '0 10px' }}>
            Thank you for your purchase. Your order has been received and is currently being processed. Registered users can also track this in their profile.
          </p>
          
          <button onClick={handleDownloadInvoice} style={styles.invoiceLink}>
            DOWNLOAD ORDER MEMO
          </button>

          <button onClick={onSuccess} style={{ ...styles.submitBtn, marginTop: '25px', maxWidth: '260px', margin: '25px auto 0 auto' }}>
            CONTINUE SHOPPING
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.topHeader}>
        <span style={styles.topHeaderTitle}>CHECKOUT</span>
        <button type="button" onClick={onSuccess} style={styles.closeBtn}>✕</button>
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>
        {/* Form elements remain the same */}
        <div style={styles.layoutGrid}>
          <div style={styles.leftColumn}>
            <h2 style={styles.sectionHeading}>SHIPPING ADDRESS</h2>
            <input style={styles.input} placeholder="FULL NAME" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <input style={styles.input} placeholder="CONTACT NUMBER" required type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            <textarea style={styles.textarea} placeholder="COMPLETE SHIPPING ADDRESS" required value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            <div style={styles.paymentRow}>
              <span style={styles.paymentText}>CASH ON DELIVERY</span>
              <div style={styles.customCircleCheckbox}>✓</div>
            </div>
            {errorMessage && <div style={{ color: '#ff4d4d', fontSize: '10px', letterSpacing: '2px', marginTop: '20px', textTransform: 'uppercase', lineHeight: '1.6' }}>{errorMessage}</div>}
            <button type="submit" disabled={loading} style={styles.submitBtn}>{loading ? 'PROCESSING...' : 'PLACE ORDER'}</button>
          </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1.5px', marginBottom: '15px', color: '#666' }}><span>SUBTOTAL</span><span style={{ fontFamily: 'monospace' }}>৳{subtotal}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1.5px', marginBottom: '15px', color: '#666' }}><span>SHIPPING</span><span style={{ fontFamily: 'monospace', color: deliveryCharge === 0 ? '#fff' : '#666' }}>{deliveryCharge === 0 ? 'COMPLIMENTARY' : `৳${deliveryCharge}`}</span></div>
              {vatRate > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1.5px', marginBottom: '15px', color: '#666' }}><span>VAT ({vatRate * 100}%)</span><span style={{ fontFamily: 'monospace' }}>৳${vatAmount}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', letterSpacing: '2px', paddingTop: '20px', borderTop: '1px dotted #222', color: '#fff', fontWeight: 600, marginTop: '25px' }}><span>TOTAL</span><span style={{ fontFamily: 'monospace', fontSize: '14px' }}>৳{grandTotal}</span></div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
