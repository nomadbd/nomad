import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';

interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  created_at: string;
  product_media: { media_url: string; media_type: string }[];
}

// 📸 প্রোডাক্ট গ্যালারি কম্পোনেন্ট
const ProductGallery = ({ images, productName }: { images: string[], productName: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div style={{ width: '100%', aspectRatio: '3/4', position: 'relative', overflow: 'hidden', backgroundColor: '#111' }}>
      {images.length > 0 ? (
        <img 
          src={images[currentIndex]} 
          alt={productName} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>No Image</div>
      )}

      {images.length > 1 && (
        <>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', cursor: 'pointer' }} onClick={handlePrev} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', cursor: 'pointer' }} onClick={handleNext} />

          <div style={{ position: 'absolute', bottom: '15px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: '6px' }}>
            {images.map((_, idx) => (
              <div 
                key={idx}
                style={{ 
                  width: '6px', height: '6px', borderRadius: '50%', 
                  background: currentIndex === idx ? '#fff' : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// 🛒 ইনলাইন বাটন, সাইজ ও কালার সিলেক্টর কম্পোনেন্ট
const AddToCartInlineButton = ({ product, disabled }: { product: Product, disabled: boolean }) => {
  const { cartItems, addToCart, setIsCartOpen } = useCart();
  const [isPressed, setIsPressed] = useState(false);
  
  // গ্রাহকের ইনপুট নেওয়ার জন্য স্টেট (সুপাবেজে আপাতত যা-ই থাকুক, গ্রাহকের ইনপুটই কার্টে যাবে)
  const [selectedSize, setSelectedSize] = useState('M'); 
  const [selectedColor, setSelectedColor] = useState('BLACK'); 

  if (disabled) {
    return (
      <button disabled style={{ background: 'transparent', border: '1px solid #1a1a1a', color: '#444', padding: '8px 16px', fontSize: '11px', letterSpacing: '1.5px', cursor: 'not-allowed', textTransform: 'uppercase', fontWeight: '600' }}>
        SOLD OUT
      </button>
    );
  }

  const isInCart = cartItems.some((item: any) => item.id === product.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
      
      {/* সাইজ এবং কালার ইনপুট প্যানেল (শুধুমাত্র কার্টে যোগ করার আগে দেখাবে) */}
      {!isInCart && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          
          {/* সাইজ সিলেক্টর বাটন */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: '#555', letterSpacing: '1px' }}>SIZE:</span>
            {['S', 'M', 'L', 'XL'].map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                style={{
                  background: 'transparent',
                  color: selectedSize === size ? '#fff' : '#555',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: selectedSize === size ? '700' : '400',
                  padding: '2px 4px',
                  letterSpacing: '1px'
                }}
              >
                {size}
              </button>
            ))}
          </div>

          {/* কালার ইনপুট বক্স (মিনিমালিস্ট ডিজাইন) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: '#555', letterSpacing: '1px' }}>COLOR:</span>
            <input
              type="text"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value.toUpperCase())}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid #333',
                color: '#fff',
                fontSize: '11px',
                width: '70px',
                textAlign: 'right',
                outline: 'none',
                letterSpacing: '1px',
                fontFamily: 'monospace'
              }}
              onFocus={(e) => e.target.style.borderBottom = '1px solid #666'}
              onBlur={(e) => e.target.style.borderBottom = '1px solid #333'}
            />
          </div>
        </div>
      )}

      {/* অ্যাকশন বাটন */}
      <button
        onClick={() => {
          setIsPressed(true);
          setTimeout(() => setIsPressed(false), 150);
          
          if (isInCart) {
            setIsCartOpen(true);
          } else {
            // গ্রাহকের সিলেক্ট করা সাইজ এবং কালার কার্ট অবজেক্টে পুশ করা হচ্ছে
            addToCart({
              ...product,
              size: selectedSize,
              color: selectedColor
            });
          }
        }}
        style={{
          background: 'transparent',
          border: `1px solid ${isInCart ? '#fff' : '#333'}`,
          color: '#fff',
          padding: '8px 16px',
          fontSize: '11px',
          letterSpacing: '1.5px',
          cursor: 'pointer',
          textTransform: 'uppercase',
          fontWeight: '600',
          transition: 'all 0.2s ease-in-out',
          transform: isPressed ? 'scale(0.94)' : 'scale(1)',
          opacity: isPressed ? 0.7 : 1
        }}
      >
        {isInCart ? 'VIEW BAG' : 'ADD TO CART'}
      </button>
    </div>
  );
};

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_media (
          media_url,
          media_type
        )
      `)
      .order('created_at', { ascending: false });

    if (data) setProducts(data as Product[]);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  if (loading) return <p style={{ color: '#555', padding: '40px' }}>LOADING PRODUCTS...</p>;

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div style={{ backgroundColor: '#000', width: '100%', boxSizing: 'border-box' }}>
      {categories.map((category) => {
        const categoryProducts = products.filter(p => p.category === category);
        const isExpanded = !!expandedCategories[category];

        return (
          <div key={category} className="showroom-section" style={{ marginBottom: '50px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 15px 12px 15px', borderBottom: '1px solid #141414' }}>
              <h3 style={{ margin: 0, fontSize: '13px', letterSpacing: '3px', color: '#b3b3b3', textTransform: 'uppercase' }}>{category}</h3>
              <button onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !isExpanded }))} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer', opacity: 0.7 }}>
                {isExpanded ? 'SEE LESS' : 'SEE MORE'}
              </button>
            </div>

            <div className="showroom-row-container" style={{ display: 'flex', flexWrap: isExpanded ? 'wrap' : 'nowrap', width: '100%', scrollSnapType: 'x mandatory', overflowX: 'auto', scrollBehavior: 'smooth' }}>
              {categoryProducts.map((product) => (
                <div key={product.id} className="showroom-card-item" style={{ scrollSnapAlign: 'start', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>

                  <ProductGallery 
                    images={product.product_media?.map(m => m.media_url) || []} 
                    productName={product.name} 
                  />

                  <div style={{ marginTop: '15px', padding: '0 5px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: '14px', color: '#e5e5e5', margin: '0 0 6px 0' }}>{product.name}</h3>
                    <p style={{ fontSize: '13px', color: '#888', margin: '0 0 15px 0', lineHeight: '1.4', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingBottom: '5px' }}>
                      <span style={{ fontSize: '15px', color: '#fff', paddingBottom: '2px' }}>৳{product.price}</span>
                      <AddToCartInlineButton product={product} disabled={product.stock_quantity <= 0} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <style>{`
        @media (max-width: 767px) {
          .showroom-section { margin-left: calc(-50vw + 50%); margin-right: calc(-50vw + 50%); width: 100vw; }
          .showroom-card-item { width: 100vw !important; min-width: 100vw !important; padding: 0 15px !important; }
        }
        @media (min-width: 768px) {
          .showroom-section { padding: 0 15px; }
          .showroom-card-item { width: 300px; min-width: 300px; padding: 0 10px; margin-bottom: 30px; }
        }
        .showroom-row-container::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
