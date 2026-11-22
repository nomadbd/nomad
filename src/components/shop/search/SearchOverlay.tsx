import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { SearchOverlayProps, SearchProduct } from './searchTypes';
import { scoreSearchProduct } from './searchScoring';
import SearchProductCard from './SearchProductCard';

export default function SearchOverlay({
  isOpen,
  onClose,
  searchQuery,
}: SearchOverlayProps) {
  const [allProducts, setAllProducts] =
    useState<SearchProduct[]>([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const onCloseRef =
    useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (
      e: KeyboardEvent
    ) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const fetchCatalog = async () => {
      try {
        setIsLoading(true);

        const { data, error } =
          await supabase
            .from('products')
            .select(`
              *,
              product_media (
                media_url,
                media_type
              )
            `)
            .order(
              'created_at',
              {
                ascending:
                  false,
              }
            );

        if (error) throw error;

        if (
          isMounted &&
          data
        ) {
          setAllProducts(
            data as SearchProduct[]
          );
        }
      } catch (err) {
        console.error(
          'Error loading search catalog:',
          err
        );
      } finally {
        if (
          isMounted
        ) {
          setIsLoading(
            false
          );
        }
      }
    };

    fetchCatalog();

    return () => {
      isMounted =
        false;
    };
  }, [isOpen]);

  const rankedResults =
    useMemo(() => {
      const trimmed =
        searchQuery.trim();

      if (!trimmed)
        return [];

      return allProducts
        .map(
          (product) => ({
            product,
            score:
              scoreSearchProduct(
                product,
                trimmed
              ),
          })
        )
        .filter(
          (entry) =>
            entry.score >
            0
        )
        .sort(
          (
            a,
            b
          ) => {
            if (
              b.score !==
              a.score
            ) {
              return (
                b.score -
                a.score
              );
            }

            return (
              new Date(
                b.product
                  .created_at
              ).getTime() -
              new Date(
                a.product
                  .created_at
              ).getTime()
            );
          }
        )
        .map(
          (entry) =>
            entry.product
        );
    }, [
      allProducts,
      searchQuery,
    ]);

  if (!isOpen)
    return null;

  const hasQuery =
    searchQuery
      .trim()
      .length > 0;

  return (
    <div
      style={{
        position:
          'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height:
          '100dvh',
        backgroundColor:
          'black',
        zIndex:
          900,
        boxSizing:
          'border-box',
        overflowY:
          'auto',
        fontFamily:
          'sans-serif',
        paddingTop:
          '84px',
        paddingBottom:
          '40px',
      }}
    >
      <div
        style={{
          color:
            'white',
          width:
            '100%',
          boxSizing:
            'border-box',
        }}
      >
        {hasQuery &&
          rankedResults
            .length >
            0 && (
            <>
              <div
                style={{
                  padding:
                    '0 24px 18px 24px',
                  fontSize:
                    '10px',
                  letterSpacing:
                    '2px',
                  color:
                    '#666',
                  textTransform:
                    'uppercase',
                  fontFamily:
                    'monospace',
                }}
              >
                {
                  rankedResults
                    .length
                }{' '}
                {
                  rankedResults
                    .length ===
                  1
                    ? 'Result'
                    : 'Results'
                }
              </div>

              <div className="search-results-container">
                {rankedResults.map(
                  (
                    product
                  ) => (
                    <ProductCardWrapper
                      key={
                        product.id
                      }
                      product={
                        product
                      }
                    />
                  )
                )}
              </div>
            </>
          )}

        {hasQuery &&
          !isLoading &&
          rankedResults
            .length ===
            0 && (
            <p
              style={{
                fontSize:
                  '11px',
                letterSpacing:
                  '2px',
                opacity:
                  0.5,
                padding:
                  '0 24px',
                textTransform:
                  'uppercase',
              }}
            >
              No products found matching "
              {
                searchQuery
              }
              "
            </p>
          )}
      </div>

      <style>{`
        @keyframes swapFadeIn {
          from {
            opacity: 0;
            transform: translateY(1px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .variant-scroll-container::-webkit-scrollbar {
          display: none;
        }

        .variant-scroll-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @media (max-width: 767px) {
          .search-results-container {
            width: 100vw;
            display: flex;
            flex-direction: column;
            gap: 40px;
          }

          .search-card-item {
            width: 100vw !important;
            min-width: 100vw !important;
            padding: 0 24px !important;
          }
        }

        @media (min-width: 768px) {
          .search-results-container {
            display: flex;
            flex-wrap: wrap;
            gap: 30px;
            padding: 0 24px;
          }

          .search-card-item {
            width: 300px;
            min-width: 300px;
            margin-bottom: 30px;
          }
        }
      `}</style>
    </div>
  );
}

function ProductCardWrapper({ product }: { product: SearchProduct }) {
  return <SearchProductCard product={product} />;
}
