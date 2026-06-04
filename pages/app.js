import '../styles/globals.css'; // আপনার যদি কোনো গ্লোবাল CSS ফাইল থাকে
import { CartProvider } from '../context/CartContext';

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <Component {...pageProps} />
    </CartProvider>
  );
}
