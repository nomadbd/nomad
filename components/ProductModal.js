import React from 'react';
import styles from '@/styles/ProductModal.module.css';
import PaymentSection from '@/components/PaymentSection';

export default function ProductModal({ selectedProduct, modalType, setModalType, closeModal, calculatePrice, paymentMethod, setPaymentMethod }) {
  if (!selectedProduct) return null;

  // দামের হিসাব (সঠিকভাবে ফাংশন কল করা হয়েছে)
  const priceData = calculatePrice ? calculatePrice(selectedProduct) : { base: 0, total: 0, delivery: 0, discount: 0, discountAmount: 0 };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {modalType === 'details' ? (
          <div>
            <img src={`/products/${selectedProduct.image}`} style={{ width: '100%', borderRadius: '20px' }} />
            <h2 style={{ textAlign: 'center', margin: '20px 0', fontSize: '18px', color: '#fff' }}>{selectedProduct.name}</h2>
            <p style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>৳{priceData.base}</p>
            <p style={{ textAlign: 'center', color: '#999', fontSize: '14px', marginTop: '10px' }}>{selectedProduct.description}</p>
            <button className="btn-style" style={{ width: '100%', marginTop: '20px', padding: '15px' }} onClick={() => setModalType('order')}>PROCEED TO ORDER</button>
            <p onClick={closeModal} style={{ textAlign: 'center', cursor: 'pointer', marginTop: '15px', color: '#777' }}>CANCEL</p>
          </div>
        ) : (
          <form action="/api/order" method="POST" className={styles.container}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '16px', color: '#fff' }}>ORDER: {selectedProduct.name}</h2>
            
            <div className={styles.priceSummary}>
              <p>Price: ৳{priceData.base}</p>
              {priceData.discount > 0 && <p>Discount: {priceData.discount}% (-৳{priceData.discountAmount})</p>}
              <p>Delivery: ৳{priceData.delivery}</p>
              <hr style={{ border: '0.5px solid #333', margin: '10px 0' }} />
              <p style={{ fontWeight: 'bold' }}>Total: ৳{priceData.total}</p>
            </div>

            <input type="hidden" name="product_id" value={selectedProduct.id} />
            <input type="hidden" name="product_name" value={selectedProduct.name} />
            <input type="hidden" name="total" value={priceData.total} />

            <input type="text" name="name" placeholder="FULL NAME" required className={styles.inputField} />
            <input type="tel" name="phone" placeholder="PHONE (01XXXXXXXXX)" required pattern="01[0-9]{9}" className={styles.inputField} />
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <select name="size" required className={styles.inputField} style={{ flex: 1 }}>
                <option value="" disabled selected hidden>SELECT SIZE</option>
                <option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option>
              </select>
              <input type="text" name="color" placeholder="COLOR" required className={styles.inputField} style={{ flex: 1 }} />
            </div>

            <textarea name="address" placeholder="FULL ADDRESS" required className={styles.inputField} style={{ height: '60px' }}></textarea>
            
            <PaymentSection paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />

            <button type="submit" className="btn-style" style={{ width: '100%', padding: '15px' }}>CONFIRM ORDER</button>
            <p onClick={closeModal} style={{ textAlign: 'center', cursor: 'pointer', marginTop: '10px', color: '#777' }}>CANCEL</p>
          </form>
        )}
      </div>
    </div>
  );
}
