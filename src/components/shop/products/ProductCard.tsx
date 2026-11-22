import { useState } from 'react';
import ProductGallery from './ProductGallery';
import ProductActionRow from './ProductActionRow';
import { Product } from './productTypes';

const ProductCard = ({ product }: { product: Product }) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  return (
    <div
      id={`product-${product.id}`}
      className="showroom-card-item"
      style={{
        scrollSnapAlign: 'start',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ProductGallery
        media={product.product_media || []}
        productName={product.name}
      />

      <div
        style={{
          marginTop: '15px',
          padding: '0 5px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h3
          style={{
            fontSize: '14px',
            color: '#fff',
            margin: '0 0 6px 0',
            fontWeight: '600',
          }}
        >
          {product.name}
        </h3>

        <div style={{ margin: '0' }}>
          {(() => {
            const characterLimit = 75;
            const isLongText = product.description.length > characterLimit;
            const displayedText = isLongText
              ? product.description.slice(0, characterLimit) + '...'
              : product.description;

            return !isDescExpanded ? (
              <p
                style={{
                  fontSize: '13px',
                  color: '#fff',
                  margin: 0,
                  lineHeight: '1.4',
                }}
              >
                {displayedText}
                <span
                  onClick={() => setIsDescExpanded(true)}
                  style={{
                    fontSize: '12px',
                    color: '#aaa',
                    cursor: 'pointer',
                    marginLeft: '6px',
                    fontWeight: '500',
                    display: 'inline',
                  }}
                >
                  see more
                </span>
              </p>
            ) : (
              <div
                style={{
                  animation: 'swapFadeIn 0.3s ease-in-out',
                }}
              >
                <p
                  style={{
                    fontSize: '13px',
                    color: '#fff',
                    margin: 0,
                    lineHeight: '1.4',
                  }}
                >
                  {product.description}
                </p>

                {product.details &&
                  Object.keys(product.details).length > 0 && (
                    <div
                      style={{
                        borderTop: '1px solid #1a1a1a',
                        marginTop: '12px',
                        paddingTop: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                      }}
                    >
                      {(() => {
                        const specKeys = [
                          'FIT',
                          'GSM',
                          'MATERIAL',
                          'COLOR',
                          'SLEEVE',
                          'PATTERN',
                          'OCCASION',
                          'CARE',
                          'MADE IN',
                        ];

                        const detailsObj = product.details || {};
                        const detailKeys = Object.keys(detailsObj);

                        const getVal = (targetKey: string) => {
                          const foundKey = detailKeys.find(
                            (key) =>
                              key.trim().toUpperCase() === targetKey ||
                              key
                                .trim()
                                .toUpperCase()
                                .replace(/\s+/g, '') ===
                                targetKey.replace(/\s+/g, '')
                          );

                          return foundKey ? detailsObj[foundKey] : null;
                        };

                        const detailsVal = getVal('DETAILS');

                        return (
                          <>
                            {specKeys.map((key) => {
                              const val = getVal(key);
                              if (!val) return null;

                              return (
                                <div
                                  key={key}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    alignItems: 'flex-start',
                                  }}
                                >
                                  <span
                                    style={{
                                      color: '#fff',
                                      width: '95px',
                                      flexShrink: 0,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                    }}
                                  >
                                    {key}
                                  </span>
                                  <span
                                    style={{
                                      color: '#555',
                                      marginRight: '10px',
                                      flexShrink: 0,
                                    }}
                                  >
                                    :
                                  </span>
                                  <span
                                    style={{
                                      color: '#fff',
                                      fontWeight: '400',
                                      flex: 1,
                                      overflowWrap: 'break-word',
                                      wordBreak: 'break-word',
                                      lineHeight: '1.4',
                                    }}
                                  >
                                    {String(val)}
                                  </span>
                                </div>
                              );
                            })}

                            {detailsVal && (
                              <div
                                style={{
                                  marginTop: '4px',
                                  color: '#fff',
                                  fontWeight: '400',
                                  overflowWrap: 'break-word',
                                  wordBreak: 'break-word',
                                  lineHeight: '1.4',
                                }}
                              >
                                {String(detailsVal)}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                <span
                  onClick={() => setIsDescExpanded(false)}
                  style={{
                    fontSize: '11px',
                    color: '#aaa',
                    cursor: 'pointer',
                    marginTop: '12px',
                    display: 'inline-block',
                    letterSpacing: '0.5px',
                  }}
                >
                  see less
                </span>
              </div>
            );
          })()}
        </div>

        <ProductActionRow product={product} />
      </div>
    </div>
  );
};

export default ProductCard;
