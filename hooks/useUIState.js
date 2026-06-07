import { useState } from 'react';

export const useUIState = (setSelectedProduct, setModalType) => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [viewCategory, setViewCategory] = useState(null);

  const openDetails = (product) => {
    setSelectedProduct(product);
    setModalType('details');
  };

  const openOrder = (product) => {
    setSelectedProduct(product);
    setModalType('order');
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setModalType(null);
    setPaymentMethod('');
  };

  return { 
    paymentMethod, setPaymentMethod, 
    viewCategory, setViewCategory, 
    openDetails, openOrder, closeModal 
  };
};
