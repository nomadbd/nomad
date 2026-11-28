import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { useGlobalLoading } from '@/context/LoadingContext';
import { BannerSlot } from '@/components/admin/banners/BannerSlot';
import { Product } from './productTypes';
import ProductCard from './ProductCard';

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const loadingTokenRef = useRef<number | null>(null);

  const { setIsPageLoading } = useGlobalLoading();

  const startPageLoading = () => {
    const token = setIsPageLoading(true, { view: 'home' });
    loadingTokenRef.current = token;
  };

  const stopPageLoading = () => {
    if (loadingTokenRef.current === null) return;

    setIsPageLoading(
      false,
      undefined,
      loadingTokenRef.current
    );
    loadingTokenRef.current = null;
  };

  useLayoutEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      setLoading(true);
      startPageLoading();

      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            product_media (
              media_url,
              media_type
            )
          `)
          .in('status', ['active', 'sold_out'])
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && isMounted) {
          const shuffledProducts = [...data].sort(
            () => Math.random() - 0.5
          );

          const uniqueCategories = Array.from(
            new Set(shuffledProducts.map((item) => item.category))
          ).sort(() => Math.random() - 0.5);

          setProducts(shuffledProducts as Product[]);
          setCategories(uniqueCategories);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
          stopPageLoading();
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
      stopPageLoading();
    };
  }, []);

  useEffect(() => {
    if (!loading && products.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get('p') || params.get('product');

      if (targetId) {
        const targetProduct = products.find(
          (item) => String(item.id) === String(targetId)
        );

        if (targetProduct && targetProduct.category) {
          setExpandedCategories((previous) => ({
            ...previous,
            [targetProduct.category]: true,
          }));
        }

        const scrollTimer = window.setTimeout(() => {
          const element = document.getElementById(
            `product-${targetId}`
          );

          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }, 300);

        return () => window.clearTimeout(scrollTimer);
      }
    }
  }, [loading, products]);

  if (loading) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: '#000',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <BannerSlot slotKey="top_below_header" />

      {categories.map((category) => {
        const categoryProducts = products.filter(
          (item) => item.category === category
        );
        const isExpanded = !!expandedCategories[category];

        return (
          <div
            key={category}
            className="showroom-section"
            style={{ marginBottom: '25px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 15px 12px 15px',
                borderBottom: '1px solid #141414',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '13px',
                  letterSpacing: '3px',
                  color: '#b3b3b3',
                  textTransform: 'uppercase',
                }}
              >
                {category}
              </h3>

              <button
                onClick={() =>
                  setExpandedCategories((previous) => ({
                    ...previous,
                    [category]: !isExpanded,
                  }))
                }
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '11px',
                  letterSpacing: '2px',
                  cursor: 'pointer',
                  opacity: 0.7,
                  display: 'flex',
                  padding: 0,
                  alignItems: 'center',
                  width: '85px',
                  justifyContent: 'flex-end',
                }}
              >
                <span>SEE&nbsp;</span>
                <span
                  style={{
                    display: 'inline-block',
                    width: '35px',
                    textAlign: 'left',
                  }}
                >
                  {isExpanded ? 'LESS' : 'MORE'}
                </span>
              </button>
            </div>

            <div
              className="showroom-row-container"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                flexWrap: isExpanded ? 'wrap' : 'nowrap',
                width: '100%',
                scrollSnapType: 'x mandatory',
                overflowX: 'auto',
                scrollBehavior: 'smooth',
              }}
            >
              {categoryProducts.map((product) => (
                <div
                  key={product.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0,
                  }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes swapFadeIn {
          from { opacity: 0; transform: translateY(1px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .variant-scroll-container::-webkit-scrollbar {
          display: none;
        }

        .variant-scroll-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @media (max-width: 767px) {
          .showroom-section {
            margin-left: calc(-50vw + 50%);
            margin-right: calc(-50vw + 50%);
            width: 100vw;
          }

          .showroom-card-item {
            width: 100vw !important;
            min-width: 100vw !important;
            padding: 0 15px !important;
          }
        }

        @media (min-width: 768px) {
          .showroom-section {
            padding: 0 15px;
          }

          .showroom-card-item {
            width: 300px;
            min-width: 300px;
            padding: 0 10px;
            margin-bottom: 25px;
          }
        }

        .showroom-row-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
