export const usePriceCalculator = (announcement) => {
  const calculatePrice = (product) => {
    if (!product || !product.priceText) return { original: 0, base: 0, discountAmt: 0, discountPercent: 0, delivery: 0, total: 0 };
    
    const discMatch = announcement?.match(/(\d+)%/);
    const annDisc = discMatch ? parseInt(discMatch[1]) : 0;
    const numberOnly = parseInt(product.priceText.replace(/[^0-9]/g, "")) || 0;
    const descDiscMatch = product.desc?.match(/Discount:\s*(\d+)%/i);
    const descDisc = descDiscMatch ? parseInt(descDiscMatch[1]) : 0;

    const totalDiscountPercent = annDisc + descDisc;
    const discountAmount = Math.floor(numberOnly * totalDiscountPercent / 100);
    const basePrice = numberOnly - discountAmount;
    const delMatch = product.desc?.match(/Delivery:\s*(\d+)/i);
    const deliveryCharge = delMatch ? parseInt(delMatch[1]) : 0;

    return { 
      original: numberOnly, 
      base: basePrice, 
      discountAmt: discountAmount, 
      discountPercent: totalDiscountPercent, 
      delivery: deliveryCharge, 
      total: basePrice + deliveryCharge 
    };
  };

  return { calculatePrice };
};
