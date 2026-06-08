import React, { useState, useEffect } from 'react';
import styles from '@/styles/ProductModal.module.css';
import PaymentSection from '@/components/PaymentSection';

export default function ProductModal({ 
  selectedProduct, 
  modalType, 
  setModalType, 
  closeModal 
}) {
  if (!selectedProduct) return null;

  const [priceData, setPriceData] = useState({
    base: selectedProduct.price || 0,
    delivery: 0,
    discount: 0,
    discountAmount: 0,
    total: 0
  });

  const [description, setDescription] = useState("Loading description...");

  // ================== ডিসকাউন্ট ক্যালকুলেশন (announcement.txt) ==================
  useEffect(() => {
    const loadDiscountAndDescription = async () => {
      try {
        // ডিসকাউন্ট অফার লোড
        const discountRes = await fetch('/content/announcement.txt');
        const discountText = await discountRes.text();

        let discountPercent = 0;
        const discountMatch = discountText.match(/(\d+)%/);
        if (discountMatch) {
          discountPercent = parseInt(discountMatch[1]);
        }

        const basePrice = selectedProduct.price || 0;
        const deliveryCharge = 60; // ডিফল্ট ডেলিভারি চার্জ (প্রয়োজনে পরিবর্তন করো)

        const discountAmount = Math.round((basePrice * discountPercent) / 100);
        const total = basePrice + deliveryCharge - discountAmount;

        setPriceData({
          base: basePrice,
          delivery: deliveryCharge,
          discount: discountPercent,
          discountAmount,
          total
        });

        // প্রোডাক্ট ডেসক্রিপশন লোড
        const descRes = await fetch(`/descriptions/${selectedProduct.id}.txt`);
        if (descRes.ok) {
          const descText = await descRes.text();
          setDescription(descText.trim());
        } else {
          setDescription("No description available for this product.");
        }

      } catch (error) {
        console.error("Error loading announcement or description:", error);
        setDescription("Failed to load description.");
      }
    };

    loadDiscountAndDescription();
  }, [selectedProduct]);

  // ================== ফর্ম সাবমিট হ্যান্ডলার ==================
  const handleSubmit = (e) => {
    // কোনো অতিরিক্ত ক্লায়েন্ট সাইড লজিক লাগলে এখানে রাখতে পারো
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        
        {/* ================== প্রোডাক্ট ডিটেইলস মোড ================== */}
        {modalType === 'details' ? (
          <div>
            <img 
              src={`/products/${selectedProduct.image}`} 
              alt={selectedProduct.name}
              style={{ width: '100%', borderRadius: '20px', objectFit: 'cover' }} 
            />
            
            <h2 style={{ textAlign: 'center', margin: '20px 0', fontSize: '18px', color: '#fff' }}>
              {selectedProduct.name}
            </h2>
            
            <p style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
              ৳{priceData.base}
            </p>

            {/* ডেসক্রিপশন */}
            <div style={{ 
              color: '#ccc', 
              fontSize: '14px', 
              marginTop: '15px', 
              textAlign: 'left', 
              lineHeight: '1.6',
              padding: '0 5px'
            }}>
              <p style={{ whiteSpace: 'pre-line' }}>{description}</p>
            </div>

            <button 
              className="btn-style" 
              style={{ width: '100%', marginTop: '25px', padding: '15px' }} 
              onClick={() => setModalType('order')}
            >
              PROCEED TO ORDER
            </button>
            
            <p 
              onClick={closeModal} 
              style={{ textAlign: 'center', cursor: 'pointer', marginTop: '15px', color: '#777' }}
            >
              CANCEL
            </p>
          </div>
        ) : (

          /* ================== অর্ডার ফর্ম মোড ================== */
          <form 
            action="/api/order" 
            method="POST" 
            onSubmit={handleSubmit}
            className={styles.container}
          >
            <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '16px', color: '#fff' }}>
              ORDER: {selectedProduct.name}
            </h2>

            {/* হিডেন ফিল্ডস */}
            <input type="hidden" name="product_id" value={selectedProduct.id} />
            <input type="hidden" name="product_name" value={selectedProduct.name} />
            <input type="hidden" name="price" value={priceData.base} />
            <input type="hidden" name="delivery" value={priceData.delivery} />
            <input type="hidden" name="total" value={priceData.total} />
            <input type="hidden" name="discountPercent" value={priceData.discount} />
            <input type="hidden" name="discountAmt" value={priceData.discountAmount} />

            {/* প্রাইস সামারি */}
            <div className={styles.priceSummary}>
              <p>Price: ৳{priceData.base}</p>
              <p>Delivery: ৳{priceData.delivery}</p>
              {priceData.discount > 0 && (
                <p style={{ color: '#ff4d4d' }}>
                  Discount ({priceData.discount}%): -৳{priceData.discountAmount}
                </p>
              )}
              <hr style={{ border: '0.5px solid #333', margin: '10px 0' }} />
              <p style={{ fontWeight: 'bold', fontSize: '16px' }}>
                Total: ৳{priceData.total}
              </p>
            </div>

            {/* কাস্টমার ইনফো */}
            <input 
              type="text" 
              name="name" 
              placeholder="FULL NAME" 
              required 
              className={styles.inputField} 
            />
            
            <input 
              type="tel" 
              name="phone" 
              placeholder="PHONE (01XXXXXXXXX)" 
              required 
              pattern="01[0-9]{9}" 
              className={styles.inputField} 
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <select 
                name="size" 
                required 
                className={styles.inputField} 
                style={{ flex: 1 }}
              >
                <option value="" disabled selected hidden>SELECT SIZE</option>
                {selectedProduct.sizes?.split(',').map(s => (
                  <option key={s} value={s.trim()}>{s.trim()}</option>
                ))}
              </select>
              
              <input 
                type="text" 
                name="color" 
                placeholder="COLOR" 
                required 
                className={styles.inputField} 
                style={{ flex: 1 }} 
              />
            </div>

            <textarea 
              name="address" 
              placeholder="FULL ADDRESS" 
              required 
              className={styles.inputField} 
              style={{ height: '70px' }}
            />

            <PaymentSection 
              paymentMethod={selectedProduct.paymentMethod} 
              setPaymentMethod={selectedProduct.setPaymentMethod} 
            />

            <button 
              type="submit" 
              className="btn-style" 
              style={{ width: '100%', padding: '15px', marginTop: '10px' }}
            >
              CONFIRM ORDER
            </button>

            <p 
              onClick={closeModal} 
              style={{ textAlign: 'center', cursor: 'pointer', marginTop: '10px', color: '#777' }}
            >
              CANCEL
            </p>
          </form>
        )}
      </div>
    </div>
  );
}