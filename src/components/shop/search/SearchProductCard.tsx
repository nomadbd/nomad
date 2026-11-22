import { useState } from 'react';
import { SearchProduct } from './searchTypes';
import SearchProductGallery from './SearchProductGallery';
import SearchProductActionRow from './SearchProductActionRow';

const SearchProductCard = ({
  product,
}: {
  product: SearchProduct;
}) => {
  const [isDescExpanded, setIsDescExpanded] =
    useState(false);

  const mediaUrls =
    product.product_media?.map(
      (m) => m.media_url
    ) || [];

  const description = product.description || '';

  return (
    <div
      className="showroom-card-item search-card-item"
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          padding: '0 5px',
        }}
      >
        <span
          style={{
            textTransform: 'uppercase',
            fontSize: '13px',
            letterSpacing: '3px',
            fontWeight: 'bold',
            color: '#b3b3b3',
          }}
        >
          {product.category || 'PRODUCT'}
        </span>
      </div>

      <SearchProductGallery
        images={mediaUrls}
        productName={product.name}
      />

      <div
        style={{
          marginTop: '15px',
          padding: '0 5px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
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

        <div style={{ margin: '0 0 15px 0' }}>
          {(() => {
            const characterLimit = 75;
            const isLongText =
              description.length >
              characterLimit;

            const displayedText = isLongText
              ? description.slice(
                  0,
                  characterLimit
                ) + '...'
              : description;

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

                {isLongText && (
                  <span
                    onClick={() =>
                      setIsDescExpanded(
                        true
                      )
                    }
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
                )}
              </p>
            ) : (
              <div
                style={{
                  animation:
                    'swapFadeIn 0.3s ease-in-out',
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
                  {description}
                </p>

                {product.details &&
                  Object.keys(
                    product.details
                  ).length > 0 && (
                    <div
                      style={{
                        borderTop:
                          '1px solid #1a1a1a',
                        marginTop: '12px',
                        paddingTop: '12px',
                        display: 'flex',
                        flexDirection:
                          'column',
                        gap: '8px',
                        fontFamily:
                          'monospace',
                        fontSize: '12px',
                      }}
                    >
                      {Object.entries(
                        product.details
                      ).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            style={{
                              display:
                                'flex',
                              justifyContent:
                                'flex-start',
                              alignItems:
                                'flex-start',
                            }}
                          >
                            <span
                              style={{
                                color:
                                  '#fff',
                                width:
                                  '95px',
                                flexShrink:
                                  0,
                                textTransform:
                                  'uppercase',
                                letterSpacing:
                                  '0.5px',
                              }}
                            >
                              {key}
                            </span>
                            <span
                              style={{
                                color:
                                  '#555',
                                marginRight:
                                  '10px',
                                flexShrink:
                                  0,
                              }}
                            >
                              :
                            </span>
                            <span
                              style={{
                                color:
                                  '#fff',
                                fontWeight:
                                  '400',
                                flex:
                                  1,
                                overflowWrap:
                                  'break-word',
                                wordBreak:
                                  'break-word',
                                lineHeight:
                                  '1.4',
                              }}
                            >
                              {value}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}

                <span
                  onClick={() =>
                    setIsDescExpanded(
                      false
                    )
                  }
                  style={{
                    fontSize: '11px',
                    color: '#aaa',
                    cursor: 'pointer',
                    marginTop: '12px',
                    display:
                      'inline-block',
                    letterSpacing:
                      '0.5px',
                  }}
                >
                  see less
                </span>
              </div>
            );
          })()}
        </div>

        <SearchProductActionRow product={product} />
      </div>
    </div>
  );
};

export default SearchProductCard;
