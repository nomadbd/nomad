import styles from '@/styles/PaymentSection.module.css';

export default function PaymentSection({ paymentMethod, setPaymentMethod }) {
  const paymentNumbers = {
    'Bkash': '01521731371',
    'Nagad': '01521731371',
    'Rocket': '01521731371',
    'Upay': '01521731371',
    'Cellfin': '01521731371'
  };

  return (
    <div className={styles.container}>
      <select 
        name="method" 
        required 
        className={styles.inputField} 
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
      >
        <option value="" disabled>PAYMENT GATEWAY</option>
        <option value="Bkash">Bkash</option>
        <option value="Nagad">Nagad</option>
        <option value="Rocket">Rocket</option>
        <option value="Upay">Upay</option>
        <option value="Cellfin">Cellfin</option>
      </select>

      {paymentMethod && (
        <p className={styles.info}>SEND MONEY TO: {paymentNumbers[paymentMethod]}</p>
      )}

      <input 
        type="tel" 
        name="sender_no" 
        placeholder="SENDER NO (11 Digits)" 
        required 
        pattern="01[0-9]{9}" 
        className={styles.inputField} 
      />
      <input 
        type="text" 
        name="txn_id" 
        placeholder="TRANSACTION ID" 
        required 
        minLength="6" 
        className={styles.inputField} 
      />
    </div>
  );
}
