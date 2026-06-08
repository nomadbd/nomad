import React from 'react';
import styles from '@/styles/ProductModal.module.css';
import PaymentSection from '@/components/PaymentSection';

export default function ProductModal({ selectedProduct, modalType, setModalType, closeModal, calculatePrice, paymentMethod, setPaymentMethod }) {
  if (!selectedProduct) return null;

  // ক্যালকুলেশন লজিক (ডিসকাউন্ট সহ)
  const price = parseInt(selectedProduct.price || 0);
  const delivery = parseInt(selectedProduct.delivery || 0);
  const discount = selectedProduct.discount || 0; // মেইন ফাইল থেকে আসা ডিসকাউন্ট
  const discountAmount = (price * discount) / 100;
  const total = (price - discountAmount) + delivery;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {modalType === 'details' ? (
          <div>
            <img src={`/products/${selectedProduct.image}`} style={{ width: '100%', borderRadius: '20px' }} />
            <h2 style={{ textAlign: 'center', margin: '20px 0', fontSize: '18px', color: '#fff' }}>{selectedProduct.name}</h2>
            <p style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>৳{price}</p>
            {/* ডেসক্রিপশন এখন ফাইল থেকে আসবে */}
            <p style={{ color: '#aaa', fontSize: '14px', marginTop: '15px', whiteSpace: 'pre-line' }}>{selectedProduct.description}</p>
            <button className="btn-style" style={{ width: '100%', marginTop: '20px' }} onClick={() => setModalType('order')}>PROCEED TO ORDER</button>
            <p onClick={closeModal} style={{ textAlign: 'center', cursor: 'pointer', marginTop: '15px' }}>CANCEL</p>
          </div>
        ) : (
          <form action="/api/order" method="POST" className={styles.container}>
            <div className={styles.priceSummary}>
              <p>Price: ৳{price}</p>
              {discount > 0 && <p style={{color: '#ff4d4d'}}>Discount ({discount}%): -৳{discountAmount}</p>}
              <p>Delivery: ৳{delivery}</p>
              <hr style={{ border: '0.5px solid #333' }} />
              <p style={{ fontWeight: 'bold' }}>Total: ৳{total}</p>
            </div>
            
            <input type="hidden" name="total" value={total} />
            {/* বাকি ইনপুট ফিল্ডগুলো এখানে আগের মতোই থাকবে */}
            <PaymentSection paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />
            <button type="submit" className="btn-style">CONFIRM ORDER</button>
          </form>
        )}
      </div>
    </div>
  );
}
