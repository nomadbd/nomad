import styles from '@/styles/PaymentSection.module.css';

export default function PaymentSection({ paymentNumbers, paymentMethod, setPaymentMethod }) {
  return (
    <div className={styles.container}>
      <select name="method" required className={styles.inputField} onChange={(e) => setPaymentMethod(e.target.value)}>
        <option value="" disabled selected>PAYMENT GATEWAY</option>
        <option>Bkash</option><option>Nagad</option><option>Rocket</option><option>Upay</option><option>Cellfin</option>
      </select>
      {paymentMethod && <p className={styles.info}>SEND MONEY TO: {paymentNumbers[paymentMethod]}</p>}
      <input type="tel" name="sender_no" placeholder="SENDER NO" required className={styles.inputField} />
      <input type="text" name="txn_id" placeholder="TRANSACTION ID" required className={styles.inputField} />
    </div>
  );
}
