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

  const [priceData, setPriceData] = useState({ base: 0, delivery: 60, discount: 0, discountAmount: 0, total: 0 });
  const [description, setDescription] = useState("");
  const [productInfo, setProductInfo] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    const loadProductData = async () => {
      try {
        // ডিসকাউন্ট লোড (announcement.txt)
        const discountRes = await fetch('/content/announcement.txt');
        const discountText = await discountRes.text();
        
        let discountPercent = 0;
        const match = discountText.match(/(\d+)%/i);
        if (match) discountPercent = parseInt(match[1]);

        // প্রোডাক্ট ডেটা লোড (descriptions/1.txt)
        const descRes = await fetch(`/descriptions/${selectedProduct.id}.txt`);
        const text = await descRes.text();

        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const info = {};

        lines.forEach(line => {
          if (line.includes(':')) {
            const [key, ...val] = line.split(':');
            const cleanKey = key.trim().toLowerCase();
            const cleanValue = val.join(':').trim();

            info[cleanKey] = cleanValue;

            if (cleanKey.includes('price')) {
              info.basePrice = parseInt(cleanValue.replace(/[^0-9]/g, '')) || 0;
            }
            if (cleanKey.includes('delivery')) {
              info.delivery = parseInt(cleanValue.replace(/[^0-9]/g, '')) || 60;
            }
            if (cleanKey.includes('size')) {
              info.sizes = cleanValue;
            }
          }
        });

        const basePrice = info.basePrice || selectedProduct.price || 700;
        const delivery = info.delivery || 60;
        const discountAmount = Math.round((basePrice * discountPercent) / 100);
        const total = basePrice + delivery - discountAmount;

        setProductInfo(info);
        setDescription(lines.slice(7).join('\n') || text);

        setPriceData({ base: basePrice, delivery, discount: discountPercent, discountAmount, total });

      } catch (error) {
        console.error("Error loading data:", error);
        setDescription("Failed to load product details.");
      }
    };

    loadProductData();
  }, [selectedProduct]);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        
        {/* ================== DETAILS MODE ================== */}
        {modalType === 'details' ? (
          <div>
            <img 
              src={`/products/${selectedProduct.image || selectedProduct.id + '.jpg'}`} 
              alt={selectedProduct.name}
              style={{ width: '100%', borderRadius: '20px', objectFit: 'cover' }} 
            />
            
            <h2 style={{ textAlign: 'center', margin: '20px 0', fontSize: '18px', color: '#fff' }}>
              {selectedProduct.name}
            </h2>
            
            <p style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
              ৳{priceData.base}
            </p>

            <div style={{ 
              color: '#ccc', 
              fontSize: '14px', 
              marginTop: '15px', 
              lineHeight: '1.7', 
              whiteSpace: 'pre-line',
              padding: '0 8px'
            }}>
              {description}
            </div>

            <button 
              className="btn-style" 
              style={{ width: '100%', marginTop: '25px', padding: '15px' }} 
              onClick={() => setModalType('order')}
            >
              PROCEED TO ORDER
            </button>
            
            <p onClick={closeModal} style={{ textAlign: 'center', cursor: 'pointer', marginTop: '15px', color: '#777' }}>
              CANCEL
            </p>
          </div>
        ) : (

          /* ================== ORDER MODE ================== */
          <form action="/api/order" method="POST" className={styles.container}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '16px', color: '#fff' }}>
              ORDER: {selectedProduct.name}
            </h2>

            {/* Hidden Fields for API */}
            <input type="hidden" name="product_id" value={selectedProduct.id} />
            <input type="hidden" name="product_name" value={selectedProduct.name} />
            <input type="hidden" name="price" value={priceData.base} />
            <input type="hidden" name="delivery" value={priceData.delivery} />
            <input type="hidden" name="total" value={priceData.total} />
            <input type="hidden" name="discountPercent" value={priceData.discount} />
            <input type="hidden" name="discountAmt" value={priceData.discountAmount} />

            {/* Price Summary */}
            <div className={styles.priceSummary}>
              <p>Price: ৳{priceData.base}</p>
              <p>Delivery: ৳{priceData.delivery}</p>
              {priceData.discount > 0 && (
                <p style={{ color: '#ff4d4d' }}>Discount ({priceData.discount}%): -৳{priceData.discountAmount}</p>
              )}
              <hr style={{ border: '0.5px solid #333', margin: '10px 0' }} />
              <p style={{ fontWeight: 'bold', fontSize: '16px' }}>Total: ৳{priceData.total}</p>
            </div>

            {/* Customer Info */}
            <input type="text" name="name" placeholder="FULL NAME" required className={styles.inputField} />
            <input type="tel" name="phone" placeholder="PHONE (01XXXXXXXXX)" required pattern="01[0-9]{9}" className={styles.inputField} />

            <div style={{ display: 'flex', gap: '10px' }}>
              <select name="size" required className={styles.inputField} style={{ flex: 1 }}>
                <option value="" disabled selected hidden>SELECT SIZE</option>
                {productInfo.sizes?.split(',').map(s => (
                  <option key={s} value={s.trim()}>{s.trim()}</option>
                ))}
              </select>
              <input type="text" name="color" placeholder="COLOR" required className={styles.inputField} style={{ flex: 1 }} />
            </div>

            <textarea name="address" placeholder="FULL ADDRESS" required className={styles.inputField} style={{ height: '70px' }} />

            {/* Payment Section */}
            <PaymentSection 
              paymentMethod={paymentMethod} 
              setPaymentMethod={setPaymentMethod} 
            />

            <button 
              type="submit" 
              className="btn-style" 
              style={{ width: '100%', padding: '15px', marginTop: '8px' }}
            >
              CONFIRM ORDER
            </button>

            <p onClick={closeModal} style={{ textAlign: 'center', cursor: 'pointer', marginTop: '10px', color: '#777' }}>
              CANCEL
            </p>
          </form>
        )}
      </div>
    </div>
  );
}