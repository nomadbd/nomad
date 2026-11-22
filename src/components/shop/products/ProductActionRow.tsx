import React, { useEffect, useState, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { Product } from './productTypes';

const ProductActionRow = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();

  const [step, setStep] = useState<'idle' | 'size' | 'color'>('idle');
  const [selectedSize, setSelectedSize] = useState('');
  const [isAdded, setIsAdded] = useState(false);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const availableSizes = product.sizes || [];
  const availableColors = product.colors || [];

  const isSoldOut =
    product.status === 'sold_out' || product.stock_quantity <= 0;

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const triggerAddedFeedback = () => {
    setIsAdded(true);

    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const handleActionClick = () => {
    if (availableSizes.length === 0 && availableColors.length === 0) {
      addToCart({ ...product, size: 'FREE', color: 'DEFAULT' });
      triggerAddedFeedback();
      return;
    }

    if (availableSizes.length > 0) {
      setStep('size');
    } else {
      setStep('color');
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?p=${product.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: shareUrl,
        });
      } catch (err) {}
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch (err) {}
    }
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: '500',
    letterSpacing: '1px',
    color: '#888',
    textTransform: 'uppercase',
    flexShrink: 0,
    marginRight: '12px',
    display: 'inline-block',
    lineHeight: '1',
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '42px',
        marginTop: '15px',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {step === 'idle' && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            animation: 'swapFadeIn 0.25s ease-in-out',
          }}
        >
          <span
            style={{
              fontSize: '15px',
              color: isSoldOut ? '#555' : '#fff',
              fontWeight: 500,
              fontFamily: 'monospace',
            }}
          >
            ৳{product.price}
          </span>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <button
              onClick={handleShare}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
              }}
              title="Share"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ccc"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>

            {isSoldOut ? (
              <button
                disabled
                style={{
                  height: '36px',
                  width: '130px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                  lineHeight: '1',
                  background: 'transparent',
                  border: '1px solid #222',
                  color: '#555',
                  fontSize: '11px',
                  letterSpacing: '1.5px',
                  cursor: 'not-allowed',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                }}
              >
                SOLD OUT
              </button>
            ) : (
              <button
                onClick={handleActionClick}
                style={{
                  height: '36px',
                  width: '130px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                  lineHeight: '1',
                  background: 'transparent',
                  border: `1px solid ${isAdded ? '#fff' : '#333'}`,
                  color: '#fff',
                  fontSize: '11px',
                  letterSpacing: '1.5px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
              >
                {isAdded ? 'ADDED' : 'ADD TO CART'}
              </button>
            )}
          </div>
        </div>
      )}

      {step === 'size' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            animation: 'swapFadeIn 0.25s ease-in-out',
            overflow: 'hidden',
          }}
        >
          <span style={labelStyle}>SIZE:</span>
          <div
            className="variant-scroll-container"
            style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              flex: 1,
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              paddingRight: '5px',
            }}
          >
            {availableSizes.map((size) => (
              <span
                key={size}
                onClick={() => {
                  setSelectedSize(size);
                  if (availableColors.length > 0) {
                    setStep('color');
                  } else {
                    addToCart({
                      ...product,
                      size,
                      color: 'DEFAULT',
                    });
                    triggerAddedFeedback();
                    setStep('idle');
                  }
                }}
                style={{
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '500',
                  letterSpacing: '1px',
                  flexShrink: 0,
                  padding: '4px 2px',
                  lineHeight: '1',
                }}
              >
                {size}
              </span>
            ))}
          </div>
        </div>
      )}

      {step === 'color' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            animation: 'swapFadeIn 0.25s ease-in-out',
            overflow: 'hidden',
          }}
        >
          <span style={labelStyle}>COLOR:</span>
          <div
            className="variant-scroll-container"
            style={{
              display: 'flex',
              gap: '14px',
              overflowX: 'auto',
              flex: 1,
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              paddingRight: '5px',
            }}
          >
            {availableColors.map((color) => (
              <span
                key={color}
                onClick={() => {
                  addToCart({
                    ...product,
                    size: selectedSize || 'FREE',
                    color,
                  });
                  triggerAddedFeedback();
                  setStep('idle');
                }}
                style={{
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '500',
                  letterSpacing: '1px',
                  flexShrink: 0,
                  padding: '4px 2px',
                  textTransform: 'uppercase',
                  lineHeight: '1',
                }}
              >
                {color}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductActionRow;
