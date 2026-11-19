import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useCart } from '@/context/CartContext'; 
import { printInvoice } from '@/utils/invoiceUtils'; 

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image_url?: string;
}

interface CountryInfo {
  name: string;
  code: string;
  flag: string;
  minDigits: number;
  maxDigits: number;
  bdMobileCheck?: boolean;
}

const ALL_COUNTRIES: CountryInfo[] = [
  { name: 'Bangladesh', code: '+880', flag: '🇧🇩', minDigits: 10, maxDigits: 10, bdMobileCheck: true },
  { name: 'United States', code: '+1', flag: '🇺🇸', minDigits: 10, maxDigits: 10 },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧', minDigits: 10, maxDigits: 11 },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪', minDigits: 9, maxDigits: 9 },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦', minDigits: 9, maxDigits: 9 },
  { name: 'Canada', code: '+1', flag: '🇨🇦', minDigits: 10, maxDigits: 10 },
  { name: 'Australia', code: '+61', flag: '🇦🇺', minDigits: 9, maxDigits: 9 },
  { name: 'India', code: '+91', flag: '🇮🇳', minDigits: 10, maxDigits: 10 },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾', minDigits: 9, maxDigits: 10 },
  { name: 'Singapore', code: '+65', flag: '🇸🇬', minDigits: 8, maxDigits: 8 },
  { name: 'Germany', code: '+49', flag: '🇩🇪', minDigits: 10, maxDigits: 11 },
  { name: 'France', code: '+33', flag: '🇫🇷', minDigits: 9, maxDigits: 9 },
  { name: 'Italy', code: '+39', flag: '🇮🇹', minDigits: 9, maxDigits: 10 },
  { name: 'Japan', code: '+81', flag: '🇯🇵', minDigits: 10, maxDigits: 10 },
  { name: 'South Korea', code: '+82', flag: '🇰🇷', minDigits: 9, maxDigits: 10 },
  { name: 'Qatar', code: '+974', flag: '🇶🇦', minDigits: 8, maxDigits: 8 },
  { name: 'Kuwait', code: '+965', flag: '🇰🇼', minDigits: 8, maxDigits: 8 },
  { name: 'Oman', code: '+968', flag: '🇴🇲', minDigits: 8, maxDigits: 8 },
  { name: 'Bahrain', code: '+973', flag: '🇧🇭', minDigits: 8, maxDigits: 8 },
  { name: 'Turkey', code: '+90', flag: '🇹🇷', minDigits: 10, maxDigits: 10 },
  { name: 'Pakistan', code: '+92', flag: '🇵🇰', minDigits: 10, maxDigits: 10 },
  { name: 'Netherlands', code: '+31', flag: '🇳🇱', minDigits: 9, maxDigits: 9 },
  { name: 'Spain', code: '+34', flag: '🇪🇸', minDigits: 9, maxDigits: 9 },
  { name: 'Switzerland', code: '+41', flag: '🇨🇭', minDigits: 9, maxDigits: 9 },
  { name: 'Sweden', code: '+46', flag: '🇸🇪', minDigits: 9, maxDigits: 9 },
  { name: 'China', code: '+86', flag: '🇨🇳', minDigits: 11, maxDigits: 11 },
  { name: 'South Africa', code: '+27', flag: '🇿🇦', minDigits: 9, maxDigits: 9 },
];

const validateEmailAddress = (rawEmail: string): { valid: boolean; message?: string } => {
  const email = rawEmail.trim();
  if (!email) {
    return { valid: false, message: 'PLEASE ENTER YOUR EMAIL ADDRESS.' };
  }
  if (/\s/.test(email) || email.includes('..')) {
    return { valid: false, message: 'INVALID EMAIL FORMAT. PLEASE REMOVE SPACES OR EXTRA DOTS.' };
  }
  const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!strictEmailRegex.test(email)) {
    return { valid: false, message: 'INVALID EMAIL ADDRESS. PLEASE ENTER A VALID EMAIL (E.G. NAME@DOMAIN.COM).' };
  }
  return { valid: true };
};

const validatePhoneByCountry = (
  rawPhone: string,
  country: CountryInfo
): { valid: boolean; normalizedDigits: string; fullPhone: string; message?: string } => {
  const trimmed = rawPhone.trim();
  if (!trimmed) {
    return { valid: false, normalizedDigits: '', fullPhone: '', message: 'PLEASE ENTER YOUR PHONE NUMBER.' };
  }

  // বাংলা সংখ্যার ডিজিট থাকলে ইংরেজি ডিজিটে রূপান্তর
  const bnToEnDigits = trimmed.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
  const digitsOnly = bnToEnDigits.replace(/\D/g, '');

  // ইউজার দেশের কোড লিখে ফেললে সেটি বাদ দেওয়া
  const codeDigits = country.code.replace(/\D/g, '');
  let subscriberDigits = digitsOnly;
  if (subscriberDigits.startsWith(codeDigits) && subscriberDigits.length > country.maxDigits) {
    subscriberDigits = subscriberDigits.slice(codeDigits.length);
  }

  // শুরুতে 0 থাকলে বাদ দেওয়া (যেমন 01712345678 -> 1712345678)
  if (subscriberDigits.startsWith('0')) {
    subscriberDigits = subscriberDigits.slice(1);
  }

  if (country.bdMobileCheck) {
    // বাংলাদেশ মোবাইল নম্বর: দেশের কোড (+880) এর পর 1[3-9] দিয়ে শুরু মোট ১০ ডিজিট (স্থানীয়ভাবে 01[3-9] + ৮ ডিজিট)
    if (!/^1[3-9]\d{8}$/.test(subscriberDigits)) {
      return {
        valid: false,
        normalizedDigits: subscriberDigits,
        fullPhone: `${country.code}${subscriberDigits}`,
        message: `INVALID BANGLADESH MOBILE NUMBER FOR ${country.code}. ENTER A VALID 11-DIGIT NUMBER (E.G. 017XXXXXXXX).`
      };
    }
  } else {
    if (subscriberDigits.length < country.minDigits || subscriberDigits.length > country.maxDigits) {
      const expectedText =
        country.minDigits === country.maxDigits
          ? `${country.minDigits} DIGITS`
          : `${country.minDigits} TO ${country.maxDigits} DIGITS`;
      return {
        valid: false,
        normalizedDigits: subscriberDigits,
        fullPhone: `${country.code}${subscriberDigits}`,
        message: `INVALID PHONE NUMBER FOR ${country.name.toUpperCase()} (${country.code}). EXPECTED ${expectedText}.`
      };
    }
  }

  return {
    valid: true,
    normalizedDigits: subscriberDigits,
    fullPhone: `${country.code}${subscriberDigits}`
  };
};

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

  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(ALL_COUNTRIES[0]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
  const [isMobile, setIsMobile] = useState(false);
  const [isOrderPlacedState, setIsOrderPlacedState] = useState(false); 

  const [deliveryCharge, setDeliveryCharge] = useState<number>(100); 
  const [vatRate, setVatRate] = useState<number>(5); 
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
  const vatAmount = Math.round((subtotal * vatRate) / 100);
  const grandTotal = subtotal + deliveryCharge + vatAmount;

  const filteredCountries = ALL_COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.code.includes(countrySearch)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim() || !formData.address.trim()) {
      return setErrorMessage('PLEASE FILL IN YOUR FULL NAME AND COMPLETE SHIPPING ADDRESS.');
    }

    const emailCheck = validateEmailAddress(formData.email);
    if (!emailCheck.valid) {
      return setErrorMessage(emailCheck.message || 'INVALID EMAIL ADDRESS.');
    }

    const phoneCheck = validatePhoneByCountry(formData.phone, selectedCountry);
    if (!phoneCheck.valid) {
      return setErrorMessage(phoneCheck.message || 'INVALID PHONE NUMBER FOR SELECTED COUNTRY.');
    }

    const cleanEmail = formData.email.trim();
    const fullPhone = phoneCheck.fullPhone;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user?.id || null, 
          customer_name: formData.name.trim(),
          customer_email: cleanEmail,
          customer_phone: fullPhone,
          shipping_address: formData.address.trim(), 
          payment_method: 'cod',
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
        color: item.color || null,
        product_name: item.name || 'NOMAD PREMIUM APPAREL',
        product_image: item.image_url || 'https://via.placeholder.com/65x80'
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) throw itemsError;

      setPlacedOrderDetails({
        orderId: order.id,
        customerName: formData.name.trim(),
        customerEmail: cleanEmail,
        customerPhone: fullPhone,
        shippingAddress: formData.address.trim(),
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
    printInvoice(placedOrderDetails);
  };

  const baseFontFamily = "'Inter', 'Noto Sans Bengali', 'Hind Siliguri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  const styles = {
    container: {
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: isMobile ? '10px 15px 120px 15px' : '50px 20px 80px 20px',
      color: '#fff',
      backgroundColor: '#000',
      fontFamily: baseFontFamily,
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
      fontFamily: baseFontFamily,
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
      letterSpacing: '2.5px',
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
      fontSize: '12px',
      letterSpacing: '0.3px',
      marginBottom: '10px', 
      outline: 'none',
      borderRadius: 0,
      fontFamily: baseFontFamily,
    },
    phoneContainer: {
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid #161616',
      marginBottom: '10px',
      gap: '12px',
      position: 'relative' as const,
    },
    countryBtn: {
      background: 'transparent',
      border: 'none',
      color: '#fff',
      fontSize: '11px',
      letterSpacing: '0.8px',
      padding: '12px 0',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      outline: 'none',
      whiteSpace: 'nowrap' as const,
      fontFamily: baseFontFamily,
    },
    phoneInput: {
      flex: 1,
      background: 'transparent',
      border: 'none',
      padding: '12px 0',
      color: '#fff',
      fontSize: '12px',
      letterSpacing: '0.8px',
      outline: 'none',
      borderRadius: 0,
      fontFamily: baseFontFamily,
    },
    pickerModal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(5px)',
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box' as const,
    },
    pickerBox: {
      width: '100%',
      maxWidth: '380px',
      background: '#0a0a0a',
      border: '1px solid #222',
      padding: '20px',
      maxHeight: '450px',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    searchInput: {
      width: '100%',
      background: '#111',
      border: '1px solid #222',
      padding: '10px 12px',
      color: '#fff',
      fontSize: '11px',
      letterSpacing: '0.8px',
      outline: 'none',
      marginBottom: '15px',
      boxSizing: 'border-box' as const,
      fontFamily: baseFontFamily,
    },
    countryList: {
      overflowY: 'auto' as const,
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
    },
    countryItem: {
      padding: '10px',
      background: '#050505',
      border: '1px solid #111',
      color: '#ddd',
      fontSize: '11px',
      letterSpacing: '0.6px',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'all 0.2s ease',
    },
    textarea: {
      width: '100%',
      boxSizing: 'border-box' as const,
      background: 'transparent',
      border: 'none',
      borderBottom: '1px solid #161616',
      padding: '12px 0', 
      color: '#fff',
      fontSize: '12px',
      letterSpacing: '0.3px',
      marginBottom: '10px', 
      outline: 'none',
      borderRadius: 0,
      resize: 'none' as const,
      height: '52px',
      lineHeight: '1.5',
      fontFamily: baseFontFamily,
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
      letterSpacing: '3.5px',
      fontSize: '11px',
      fontWeight: 500,
      textTransform: 'uppercase' as const,
      marginTop: '35px',
      borderRadius: 0,
      outline: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box' as const,
      fontFamily: baseFontFamily,
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
      fontFamily: baseFontFamily,
    }
  };

  if (isOrderPlacedState) {
    return (
      <div style={styles.successOverlay}>
        <div style={styles.successWrapper}>
          <div style={{ fontSize: '32px', marginBottom: '15px', color: '#fff', lineHeight: 1 }}>✓</div>

          <h2 style={{ fontSize: '13px', letterSpacing: '3.5px', fontWeight: 600, marginBottom: '20px', color: '#fff' }}>
            ORDER PLACED SUCCESSFULLY
          </h2>

          <p style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#888', lineHeight: '2', marginBottom: '40px', textTransform: 'uppercase' as const, padding: '0 10px' }}>
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
      {isPickerOpen && (
        <div style={styles.pickerModal} onClick={() => setIsPickerOpen(false)}>
          <div style={styles.pickerBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '10px', letterSpacing: '2px', color: '#888' }}>SELECT COUNTRY</span>
              <button 
                onClick={() => setIsPickerOpen(false)} 
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
              >✕</button>
            </div>

            <input 
              style={styles.searchInput} 
              placeholder="SEARCH COUNTRY OR CODE..." 
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              autoFocus
            />

            <div style={styles.countryList}>
              {filteredCountries.map((c, i) => (
                <div 
                  key={i} 
                  style={styles.countryItem}
                  onClick={() => {
                    setSelectedCountry(c);
                    setIsPickerOpen(false);
                    setCountrySearch('');
                    setErrorMessage(null);
                  }}
                >
                  <span>{c.flag} {c.name}</span>
                  <span style={{ color: '#888', fontFamily: 'monospace' }}>{c.code}</span>
                </div>
              ))}
              {filteredCountries.length === 0 && (
                <div style={{ padding: '15px', color: '#555', fontSize: '10px', textAlign: 'center' }}>
                  NO COUNTRY FOUND
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>
        <div style={styles.layoutGrid}>
          <div style={styles.leftColumn}>
            <h2 style={styles.sectionHeading}>SHIPPING ADDRESS</h2>
            <input
              style={styles.input}
              placeholder="FULL NAME"
              required
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errorMessage) setErrorMessage(null);
              }}
            />
            <input
              style={styles.input}
              placeholder="EMAIL ADDRESS"
              required
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errorMessage) setErrorMessage(null);
              }}
            />

            <div style={styles.phoneContainer}>
              <button 
                type="button"
                style={styles.countryBtn} 
                onClick={() => setIsPickerOpen(true)}
              >
                <span>{selectedCountry.flag}</span>
                <span>{selectedCountry.code}</span>
                <span style={{ fontSize: '8px', color: '#666' }}>▼</span>
              </button>

              <input 
                style={styles.phoneInput} 
                placeholder={selectedCountry.bdMobileCheck ? "PHONE NUMBER (E.G. 017XXXXXXXX)" : "PHONE NUMBER"} 
                required 
                type="tel" 
                value={formData.phone} 
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errorMessage) setErrorMessage(null);
                }} 
              />
            </div>

            <textarea
              style={styles.textarea}
              placeholder="COMPLETE SHIPPING ADDRESS"
              required
              value={formData.address}
              onChange={(e) => {
                setFormData({ ...formData, address: e.target.value });
                if (errorMessage) setErrorMessage(null);
              }}
            />
            <div style={styles.paymentRow}>
              <span style={styles.paymentText}>CASH ON DELIVERY</span>
              <div style={styles.customCircleCheckbox}>✓</div>
            </div>
            {errorMessage && <div style={{ color: '#ff4d4d', fontSize: '10px', letterSpacing: '1.2px', marginTop: '20px', textTransform: 'uppercase', lineHeight: '1.6' }}>{errorMessage}</div>}
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
                      <span style={{ fontSize: '11px', letterSpacing: '0.8px', fontWeight: 500 }}>{item.name}</span>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>৳{item.price * item.quantity}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#666', letterSpacing: '0.6px' }}>
                      QTY: {item.quantity} {item.color && ` • ${item.color}`} {item.size && ` / ${item.size}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1.5px', marginBottom: '15px', color: '#666' }}><span>SUBTOTAL</span><span style={{ fontFamily: 'monospace' }}>৳{subtotal}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1.5px', marginBottom: '15px', color: '#666' }}><span>SHIPPING</span><span style={{ fontFamily: 'monospace', color: deliveryCharge === 0 ? '#fff' : '#666' }}>{deliveryCharge === 0 ? 'COMPLIMENTARY' : `৳${deliveryCharge}`}</span></div>
              {vatRate > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1.5px', marginBottom: '15px', color: '#666' }}><span>VAT ({vatRate}%)</span><span style={{ fontFamily: 'monospace' }}>৳{vatAmount}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', letterSpacing: '2px', paddingTop: '20px', borderTop: '1px dotted #222', color: '#fff', fontWeight: 600, marginTop: '25px' }}><span>TOTAL</span><span style={{ fontFamily: 'monospace', fontSize: '14px' }}>৳{grandTotal}</span></div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
