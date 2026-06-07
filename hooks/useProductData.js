import { useState, useEffect } from 'react';

export const useProductData = (allProducts, routerQuery) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalType, setModalType] = useState(null);

  useEffect(() => {
    const shuffled = [...allProducts].sort(() => Math.random() - 0.5);
    setProducts(shuffled);
    
    const catMap = {};
    shuffled.forEach(p => {
      const catName = p.name.split(' ')[0];
      if (!catMap[catName]) catMap[catName] = [];
      catMap[catName].push(p);
    });
    setCategories(catMap);

    if (routerQuery.product) {
      const target = allProducts.find(p => p.id === routerQuery.product);
      if (target) { 
        setSelectedProduct({ ...target, ref: routerQuery.ref || '' }); 
        setModalType('details'); 
      }
    }
  }, [allProducts, routerQuery]);

  return { products, categories, selectedProduct, setSelectedProduct, modalType, setModalType };
};
