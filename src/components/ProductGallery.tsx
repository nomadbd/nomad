import { useState } from 'react';

interface MediaItem {
  media_url: string;
  media_type: 'image' | 'video';
}

export default function ProductGallery({ media = [], productName }: { media: MediaItem[], productName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 🛡️ সেফটি চেক: মিডিয়া না থাকলে ব্ল্যাঙ্ক স্টেট দেখাবে
  if (!media || media.length === 0) {
    return (
      <div style={{ width: '100%', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', color: '#333', fontSize: '11px', letterSpacing: '1px' }}>
        NO MEDIA
      </div>
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : media.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev < media.length - 1 ? prev + 1 : 0));
  };

  const currentItem = media[currentIndex];

  return (
    <div style={{ width: '100%', aspectRatio: '3/4', position: 'relative', overflow: 'hidden', backgroundColor: '#111' }}>

      {/* 🎬 মিডিয়া রেন্ডারিং */}
      {currentItem?.media_type === 'video' ? (
        <video 
          src={currentItem.media_url} 
          autoPlay     // ⚡ স্বয়ংক্রিয়ভাবে চলবে
          loop         // 🔄 লুপে থাকবে
          muted        // 🔇 মিউট থাকবে (অটোপ্লে-র জন্য বাধ্যতামূলক)
          playsInline  // 📱 মোবাইলে ফুলস্ক্রিন হওয়া আটকাবে
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <img 
          src={currentItem?.media_url} 
          alt={productName} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* 🖱️ টাচ ও নেভিগেশন লেয়ার (এখন ভিডিওর সাথে কোনো ঝামেলা করবে না) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', cursor: 'pointer', zIndex: 1 }} onClick={handlePrev} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', cursor: 'pointer', zIndex: 1 }} onClick={handleNext} />

      {/* 🔴 ডট ইন্ডিকেটর */}
      {media.length > 1 && (
        <div style={{ position: 'absolute', bottom: '15px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: '6px', zIndex: 2 }}>
          {media.map((_, idx) => (
            <div 
              key={idx}
              style={{ 
                width: '6px', height: '6px', borderRadius: '50%', 
                background: currentIndex === idx ? '#fff' : 'rgba(255,255,255,0.4)',
                transition: 'background 0.2s ease'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
