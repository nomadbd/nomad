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
  const [fullDescription, setFullDescription] = useState("Loading...");
  const [productName, setProductName] = useState(selectedProduct.name);
  const [productInfo, setProductInfo] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    const loadProductData = async () => {
      try {
        // ডিসকাউন্ট লোড
        let discountPercent = 0;
        try {
          const res = await fetch('/content/announcement.txt');
          if (res.ok) {
            const text = await res.text();
            const match = text.match(/(\d+)%/i);
            if (match) discountPercent = parseInt(match[1]);
          }
        } catch (e) {}

        // প্রোডাক্ট ডেসক্রিপশন লোড
        let rawText = "Description not available.";
        try {
          const res = await fetch(`/descriptions/${selectedProduct.id}.txt`);
          if (res.ok) {
            rawText = await res.text();
          }
        } catch (e) {}

        const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

        let extractedName = selectedProduct.name;
        const info = {};
        let descriptionBody = "";

        lines.forEach(line => {
          // প্রথম লাইন থেকে প্রোডাক্ট নাম বের করা
          if (!extractedName || extractedName === selectedProduct.name) {
            const nameMatch = line.match(/^\d+\s+(.+)$/);
            if (nameMatch) extractedName = nameMatch[1].trim();
          }

          // কী-ভ্যালু পার্সিং
          if (line.includes(':')) {
            const [keyPart, ...valuePart] = line.split(':');
            const key = keyPart.replace(/^\d+\s*/, '').trim().toLowerCase();
            const value = valuePart.join(':').trim();

            info[key] = value;

            if (key.includes('price')) {
              info.basePrice = parseInt(value.replace(/[^0-9]/g, '')) || 0;
            }
            if (key.includes('delivery')) {
              info.delivery = parseInt(value.replace(/[^0-9]/g, '')) || 60;
            }
            if (key.includes('size')) {
              info.sizes = value;
            }
          } else {
            descriptionBody += line + "\n";
          }
        });

        const basePrice = info.basePrice || selectedProduct.price || 700;
        const delivery = info.delivery || 60;
        const discountAmount = Math.round((basePrice * discountPercent) / 100);
        const total = basePrice + delivery - discountAmount;

        setProductName(extractedName);
        setProductInfo(info);
        setFullDescription(descriptionBody.trim() || rawText);
        setPriceData({ base: basePrice, delivery, discount: discountPercent, discountAmount, total });

      } catch (error) {
        console.error(error);
        setFullDescription("Failed to load description.");
      }
    };

    loadProductData();
  }, [selectedProduct]);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        
        {modalType === 'details' ? (
          <div>
            <img 
              src={`/products/${selectedProduct.image || selectedProduct.id + '.jpg'}`} 
              alt={productName}
              style={{ width: '100%', borderRadius: '20px', objectFit: 'cover' }} 
            />
            
            <h2 style={{ textAlign: 'center', margin: '20px 0 10px', fontSize: '18px', color: '#fff' }}>
              {productName}
            </h2>
            
            <p style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#fff', marginBottom: '20px' }}>
              ৳{priceData.base}
            </p>

            <div className={styles.description}>
              {fullDescription}
            </div>

            <button 
              className="btn-style" 
              style={{ width: '100%', marginTop: '30px', padding: '15px' }} 
              onClick={() => setModalType('order')}
            >
              PROCEED TO ORDER
            </button>
            
            <p onClick={closeModal} style={{ textAlign: 'center', cursor: 'pointer', marginTop: '15px', color: '#777' }}>
              CANCEL
            </p>
          </div>
        ) : (
          <form action="/api/order" method="POST" className={styles.container}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '16px', color: '#fff' }}>
              ORDER: {productName}
            </h2>

            <input type="hidden" name="product_id" value={selectedProduct.id} />
            <input type="hidden" name="product_name" value={productName} />
            <input type="hidden" name="price" value={priceData.base} />
            <input type="hidden" name="delivery" value={priceData.delivery} />
            <input type="hidden" name="total" value={priceData.total} />
            <input type="hidden" name="discountPercent" value={priceData.discount} />
            <input type="hidden" name="discountAmt" value={priceData.discountAmount} />

            <div className={styles.priceSummary}>
              <p>Price: ৳{priceData.base}</p>
              <p>Delivery: ৳{priceData.delivery}</p>
              {priceData.discount > 0 && <p style={{color: '#ff4d4d'}}>Discount ({priceData.discount}%): -৳{priceData.discountAmount}</p>}
              <hr style={{ border: '0.5px solid #333', margin: '10px 0' }} />
              <p style={{ fontWeight: 'bold', fontSize: '16px', color: '#fff' }}>Total: ৳{priceData.total}</p>
            </div>

            <input type="text" name="name" placeholder="FULL NAME" required className={styles.inputField} />
            <input type="tel" name="phone" placeholder="PHONE (01XXXXXXXXX)" required pattern="01[0-9]{9}" className={styles.inputField} />

            <div style={{ display: 'flex', gap: '10px' }}>
              <select name="size" required className={styles.inputField} style={{ flex: 1 }}>
                <option value="" disabled selected hidden>SELECT SIZE</option>
                {productInfo.sizes?.split(',').map(s => <option key={s} value={s.trim()}>{s.trim()}</option>)}
              </select>
              <input type="text" name="color" placeholder="COLOR" required className={styles.inputField} style={{ flex: 1 }} />
            </div>

            <textarea name="address" placeholder="FULL ADDRESS" required className={styles.inputField} style={{ height: '70px' }} />

            <PaymentSection paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />

            <button type="submit" className="btn-style" style={{ width: '100%', padding: '15px', marginTop: '8px' }}>
              CONFIRM ORDER
            </button>

            <p onClick={closeModal} style={{ textAlign: 'center', cursor: 'pointer', marginTop: '12px', color: '#777' }}>
              CANCEL
            </p>
          </form>
        )}
      </div>
    </div>
  );
}