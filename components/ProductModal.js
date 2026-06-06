import React from 'react';
import styles from '@/styles/ProductModal.module.css';

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
            <input type="hidden" name="product_id" value={selectedProduct.id} />
            <input type="hidden" name="product_name" value={selectedProduct.name} />
            <input type="hidden" name="price" value={calculatePrice(selectedProduct).base} />
            <input type="hidden" name="delivery" value={calculatePrice(selectedProduct).delivery} />
            <input type="hidden" name="total" value={calculatePrice(selectedProduct).total} />
            <input type="hidden" name="ref" value={selectedProduct.ref || ''} />
            <input type="hidden" name="discountAmt" value={calculatePrice(selectedProduct).discountAmt} />
            <input type="hidden" name="discountPercent" value={calculatePrice(selectedProduct).discountPercent} />

            <div style={{ background: '#111', padding: '15px', borderRadius: '15px', margin: '0 0 20px 0', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#aaa', textDecoration: 'line-through' }}>Original: ৳{calculatePrice(selectedProduct).original}</p>
              <p style={{ fontSize: '13px', color: '#0f0' }}>Discount ({calculatePrice(selectedProduct).discountPercent}%): -৳{calculatePrice(selectedProduct).discountAmt}</p>
              <p style={{ fontSize: '12px', color: '#aaa' }}>Delivery: ৳{calculatePrice(selectedProduct).delivery}</p>
              <p style={{ fontWeight: 'bold', fontSize: '20px', color: '#fff', marginTop: '5px' }}>TOTAL: ৳{calculatePrice(selectedProduct).total}</p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <select name="size" required className={styles.inputField} style={{ flex: 1 }}><option value="" disabled selected>SIZE</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></select>
              <input type="text" name="color" placeholder="COLOR" required className={styles.inputField} style={{ flex: 1 }} />
            </div>
            <input type="text" name="name" placeholder="FULL NAME" required className={styles.inputField} />
            <input type="tel" name="phone" placeholder="PHONE" required className={styles.inputField} />
            <textarea name="address" placeholder="ADDRESS" required className={styles.inputField} style={{ minHeight: '80px' }}></textarea>

            <div style={{ background: '#050505', padding: '20px', borderRadius: '25px', border: '1px solid #1a1a1a', marginBottom: '25px' }}>
              <select name="method" required className={styles.inputField} style={{ border: 'none', marginBottom: '5px' }} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="" disabled selected>PAYMENT GATEWAY</option>
                <option>Bkash</option><option>Nagad</option><option>Rocket</option><option>Upay</option><option>Cellfin</option>
              </select>
              {paymentMethod && <p style={{ fontSize: '10px', color: '#666', textAlign: 'center', margin: '10px 0' }}>SEND MONEY TO: {paymentNumbers[paymentMethod]}</p>}
              <input type="tel" name="sender_no" placeholder="SENDER NO" required style={{ background: 'none', border: 'none', borderBottom: '1px solid #333', color: '#fff', width: '100%', padding: '10px 0', fontSize: '14px', marginBottom: '10px' }} />
              <input type="text" name="txn_id" placeholder="TRANSACTION ID" required style={{ background: 'none', border: 'none', borderBottom: '1px solid #333', color: '#fff', width: '100%', padding: '10px 0', fontSize: '14px' }} />
            </div>
            <button type="submit" className="btn-style" style={{ width: '100%', padding: '20px' }}>CONFIRM ORDER</button>
            <p onClick={closeModal} style={{ textAlign: 'center', color: '#444', fontSize: '11px', marginTop: '20px', letterSpacing: '2px', cursor: 'pointer' }}>CANCEL</p>
          </form>
        )}
      </div>
    </div>
  );
}
