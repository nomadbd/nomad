import React from 'react';
import styles from '@/styles/ProductModal.module.css';
import PaymentSection from '@/components/PaymentSection'; // ইমপোর্ট করা হলো

export default function ProductModal({ selectedProduct, modalType, setModalType, closeModal, calculatePrice, paymentNumbers, paymentMethod, setPaymentMethod }) {
  if (!selectedProduct || !modalType) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {modalType === 'details' ? (
          <div>
            <img src={`/products/${selectedProduct.image}`} style={{ width: '100%', borderRadius: '25px' }} />
            <h2 style={{ textAlign: 'center', margin: '25px 0', fontSize: '20px' }}>{selectedProduct.name}</h2>
            <div style={{ marginBottom: '20px' }}>
              {selectedProduct.desc.split('\n').map((line, i) => (
                line.includes(':') ? (
                  <div key={i} className={styles.descLine}><span>{line.split(':')[0]}</span><span>:</span><span>{line.split(':')[1]}</span></div>
                ) : <p key={i} style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>{line}</p>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>৳{calculatePrice(selectedProduct).base}</p>
            <button className="btn-style" style={{ width: '100%', marginTop: '25px', padding: '20px' }} onClick={() => setModalType('order')}>PROCEED TO ORDER</button>
            <p onClick={closeModal} style={{ textAlign: 'center', color: '#444', fontSize: '11px', marginTop: '20px', letterSpacing: '2px', cursor: 'pointer' }}>CANCEL</p>
          </div>
        ) : (
          <form action="/api/order" method="POST" style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '25px', fontSize: '16px', fontWeight: 'bold' }}>ORDER: {selectedProduct.name}</h2>
            
            {/* হিডেন ইনপুটগুলো আগের মতোই থাকবে */}
            <input type="hidden" name="product_id" value={selectedProduct.id} />
            <input type="hidden" name="product_name" value={selectedProduct.name} />
            <input type="hidden" name="price" value={calculatePrice(selectedProduct).base} />
            <input type="hidden" name="total" value={calculatePrice(selectedProduct).total} />

            <div className={styles.priceSummary}>
              <p>Original: ৳{calculatePrice(selectedProduct).original}</p>
              <p>Discount: -৳{calculatePrice(selectedProduct).discountAmt}</p>
              <p>Total: ৳{calculatePrice(selectedProduct).total}</p>
            </div>

            <input type="text" name="name" placeholder="FULL NAME" required className={styles.inputField} />
            <input type="tel" name="phone" placeholder="PHONE" required className={styles.inputField} />
            <textarea name="address" placeholder="ADDRESS" required className={styles.inputField}></textarea>

            {/* আলাদা করা পেমেন্ট সেকশন */}
            <PaymentSection 
              paymentNumbers={paymentNumbers} 
              paymentMethod={paymentMethod} 
              setPaymentMethod={setPaymentMethod} 
            />

            <button type="submit" className="btn-style" style={{ width: '100%', padding: '20px' }}>CONFIRM ORDER</button>
            <p onClick={closeModal} style={{ textAlign: 'center', color: '#444', fontSize: '11px', marginTop: '20px', letterSpacing: '2px', cursor: 'pointer' }}>CANCEL</p>
          </form>
        )}
      </div>
    </div>
  );
}
