import React from 'react';
import styles from '@/styles/ProductModal.module.css';
import PaymentSection from '@/components/PaymentSection';

export default function ProductModal({ selectedProduct, modalType, setModalType, closeModal, calculatePrice, paymentMethod, setPaymentMethod }) {
  if (!selectedProduct || !modalType) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {modalType === 'details' ? (
          <div>
            <img src={`/products/${selectedProduct.image}`} style={{ width: '100%', borderRadius: '25px' }} />
            <h2 style={{ textAlign: 'center', margin: '25px 0', fontSize: '20px' }}>{selectedProduct.name}</h2>
            <p style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>৳{calculatePrice(selectedProduct).base}</p>
            <button className="btn-style" style={{ width: '100%', marginTop: '25px', padding: '20px' }} onClick={() => setModalType('order')}>PROCEED TO ORDER</button>
            <p onClick={closeModal} style={{ textAlign: 'center', cursor: 'pointer', marginTop: '20px' }}>CANCEL</p>
          </div>
        ) : (
          <form action="/api/order" method="POST" style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '16px' }}>ORDER: {selectedProduct.name}</h2>

            <input type="hidden" name="product_id" value={selectedProduct.id} />
            <input type="hidden" name="product_name" value={selectedProduct.name} />
            <input type="hidden" name="total" value={calculatePrice(selectedProduct).total} />

            {/* গ্রাহকের তথ্য */}
            <input type="text" name="name" placeholder="FULL NAME" required className={styles.inputField} />
            
            {/* মোবাইল নাম্বারের ভ্যালিডেশন: ১১ ডিজিট নিশ্চিত করা */}
            <input 
              type="tel" name="phone" placeholder="PHONE (01XXXXXXXXX)" 
              required pattern="01[0-9]{9}" title="১১ ডিজিটের সঠিক মোবাইল নাম্বার দিন"
              className={styles.inputField} 
            />

            {/* সাইজ ও কালার সিলেকশন */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <select name="size" required className={styles.inputField} style={{ flex: 1 }}>
                <option value="">SELECT SIZE</option>
                <option value="S">S</option><option value="M">M</option>
                <option value="L">L</option><option value="XL">XL</option>
              </select>
              <input type="text" name="color" placeholder="COLOR" required className={styles.inputField} style={{ flex: 1 }} />
            </div>

            <textarea name="address" placeholder="FULL ADDRESS" required className={styles.inputField}></textarea>

            {/* পেমেন্ট সেকশন (এখন আর paymentNumbers পাস করার দরকার নেই) */}
            <PaymentSection 
              paymentMethod={paymentMethod} 
              setPaymentMethod={setPaymentMethod} 
            />

            <button type="submit" className="btn-style" style={{ width: '100%', padding: '20px', marginTop: '10px' }}>CONFIRM ORDER</button>
            <p onClick={closeModal} style={{ textAlign: 'center', cursor: 'pointer', marginTop: '15px' }}>CANCEL</p>
          </form>
        )}
      </div>
    </div>
  );
}
