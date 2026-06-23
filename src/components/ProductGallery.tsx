import { useState } from 'react';

// মিডিয়া অবজেক্টের ইন্টারফেস
interface MediaItem {
  media_url: string;
  media_type: 'image' | 'video';
}

export default function ProductGallery({ media, productName }: { media: MediaItem[], productName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // বামে ক্লিক করলে আগের মিডিয়া
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : media.length - 1));
  };

  // ডানে ক্লিক করলে পরের মিডিয়া
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev < media.length - 1 ? prev + 1 : 0));
  };

  const currentItem = media[currentIndex];

  return (
    <div style={{ width: '100%', aspectRatio: '3/4', position: 'relative', overflow: 'hidden', backgroundColor: '#111' }}>
      
      {/* মিডিয়া ডিসপ্লে: ইমেজ নাকি ভিডিও চেক করা হচ্ছে */}
      {currentItem?.media_type === 'video' ? (
        <video 
          src={currentItem.media_url} 
          controls 
          loop
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <img 
          src={currentItem?.media_url} 
          alt={productName} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* টাচ এরিয়া: বাম পাশে Prev, ডান পাশে Next */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', cursor: 'pointer' }} onClick={handlePrev} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', cursor: 'pointer' }} onClick={handleNext} />

      {/* ইন্সটাগ্রামের মতো ডট ইন্ডিকেটর */}
      {media.length > 1 && (
        <div style={{ position: 'absolute', bottom: '15px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: '6px' }}>
          {media.map((_, idx) => (
            <div 
              key={idx}
              style={{ 
                width: '6px', height: '6px', borderRadius: '50%', 
                background: currentIndex === idx ? '#fff' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
