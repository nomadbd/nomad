import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useCart } from '@/context/CartContext';
import { printInvoice } from '@/utils/invoiceUtils';
import { CartItem, CountryInfo, ALL_COUNTRIES } from './checkoutTypes';
import { validateEmailAddress, validatePhoneByCountry } from './checkoutValidation';
import { createCheckoutStyles } from './checkoutStyles';
import CountryPickerModal from './CountryPickerModal';
import OrderSuccessView from './OrderSuccessView';
import OrderSummarySection from './OrderSummarySection';

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

  const styles = createCheckoutStyles(isMobile);

  if (isOrderPlacedState) {
    return (
      <OrderSuccessView
        styles={styles}
        onDownloadInvoice={handleDownloadInvoice}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        .nomad-checkout-field::placeholder {
          color: #b5b5b5;
          opacity: 1;
        }
      `}</style>

      {isPickerOpen && (
        <CountryPickerModal
          styles={styles}
          countrySearch={countrySearch}
          onSearchChange={setCountrySearch}
          filteredCountries={filteredCountries}
          onSelectCountry={(c) => {
            setSelectedCountry(c);
            setIsPickerOpen(false);
            setCountrySearch('');
            setErrorMessage(null);
          }}
          onClose={() => setIsPickerOpen(false)}
        />
      )}

      <form onSubmit={handleSubmit} noValidate style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <div style={styles.layoutGrid}>
          <div style={styles.leftColumn}>
            <input
              className="nomad-checkout-field"
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
              className="nomad-checkout-field"
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
                <span style={{ fontSize: '8px', color: '#bbbbbb' }}>▼</span>
              </button>

              <input
                className="nomad-checkout-field"
                style={styles.phoneInput}
                placeholder="PHONE NUMBER"
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
              className="nomad-checkout-field"
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
            {errorMessage && <div style={{ color: '#ff6666', fontSize: '10px', letterSpacing: '1px', marginTop: '16px', textTransform: 'uppercase', lineHeight: '1.6' }}>{errorMessage}</div>}
            <button type="submit" disabled={loading} style={styles.submitBtn}>{loading ? 'PROCESSING...' : 'PLACE ORDER'}</button>
          </div>

          <OrderSummarySection
            styles={styles}
            selectedItems={selectedItems}
            subtotal={subtotal}
            deliveryCharge={deliveryCharge}
            vatRate={vatRate}
            vatAmount={vatAmount}
            grandTotal={grandTotal}
          />
        </div>
      </form>
    </div>
  );
}
