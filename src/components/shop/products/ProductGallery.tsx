import { useState } from 'react';

interface MediaItem {
  media_url: string;
  media_type: 'image' | 'video' | string;
}

export default function ProductGallery({ media = [], productName }: { media: MediaItem[], productName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) {
    return (
      <div style={{ width: '100%', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', color: '#333', fontSize: '11px', letterSpacing: '1px' }}>
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
    <div style={{ width: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#111' }}>
      {currentItem?.media_type === 'video' ? (
        <video 
          src={currentItem.media_url} 
          autoPlay
          loop
          muted
          playsInline
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      ) : (
        <img 
          src={currentItem?.media_url} 
          alt={productName} 
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      )}

      <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', cursor: 'pointer', zIndex: 1 }} onClick={handlePrev} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', cursor: 'pointer', zIndex: 1 }} onClick={handleNext} />

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
