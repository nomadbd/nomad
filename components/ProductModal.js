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

  const [priceData, setPriceData] = useState({ base: 700, delivery: 60, discount: 0, discountAmount: 0, total: 760 });
  const [fullDescription, setFullDescription] = useState("Loading description...");
  const [productName, setProductName] = useState(selectedProduct.name || "T-Shirt");
  const [productInfo, setProductInfo] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        // ডিসকাউন্ট
        let discount = 0;
        try {
          const res = await fetch('/content/announcement.txt');
          if (res.ok) {
            const txt = await res.text();
            const m = txt.match(/(\d+)%/);
            if (m) discount = parseInt(m[1]);
          }
        } catch {}

        // ডেসক্রিপশন ফাইল
        let text = "Description not available.";
        try {
          const res = await fetch(`/descriptions/${selectedProduct.id}.txt`);
          if (res.ok) {
            text = await res.text();
          }
        } catch {}

        const lines = text.split('\n').map(l => l.trim()).filter(l => l);

        // প্রথম লাইন = নাম
        let name = selectedProduct.name || "T-Shirt";
        if (lines.length > 0) {
          name = lines[0].replace(/^\d+\s*/, '').trim();
        }

        // বাকি সব ডেসক্রিপশন
        const desc = lines.slice(1).join('\n');

        // প্রাইস ও অন্যান্য তথ্য
        let basePrice = selectedProduct.price || 700;
        let delivery = 60;
        let sizes = "";

        lines.forEach(line => {
          if (line.toLowerCase().includes('price')) {
            const num = parseInt(line.replace(/[^0-9]/g, ''));
            if (num) basePrice = num;
          }
          if (line.toLowerCase().includes('delivery')) {
            const num = parseInt(line.replace(/[^0-9]/g, ''));
            if (num) delivery = num;
          }
          if (line.toLowerCase().includes('size')) {
            sizes = line.split(':')[1] || "";
          }
        });

        const discountAmt = Math.round((basePrice * discount) / 100);
        const total = basePrice + delivery - discountAmt;

        setProductName(name);
        setFullDescription(desc || text);
        setProductInfo({ sizes });
        setPriceData({ base: basePrice, delivery, discount, discountAmount: discountAmt, total });

      } catch (err) {
        console.error(err);
        setFullDescription("Failed to load details.");
      }
    };

    loadData();
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
              <p style={{ fontWeight: 'bold', color: '#fff' }}>Total: ৳{priceData.total}</p>
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