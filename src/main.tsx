import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// মোবাইল ব্রাউজারে ডেক্সটপ মোড সুইচের সময় ভিউপোর্ট লক করার জন্য
const fixViewportScale = () => {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no'
    );
  }
};

// ইনিশিয়াল কল এবং ইভেন্ট লিসেনার
fixViewportScale();
window.addEventListener('resize', fixViewportScale);
window.addEventListener('orientationchange', fixViewportScale);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
