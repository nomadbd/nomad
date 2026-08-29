import React, { useState, useEffect } from 'react';

interface ProductMediaViewerProps {
  media: { media_url: string; media_type?: string }[];
  productName: string;
}

export const ProductMediaViewer: React.FC<ProductMediaViewerProps> = ({ media, productName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [media]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : media.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev < media.length - 1 ? prev + 1 : 0));
  };

  const currentMedia = media[currentIndex];
  const isVideo = currentMedia?.media_type === 'video' || (currentMedia?.media_url && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(currentMedia.media_url));

  return (
    <div style={{ width: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {media.length > 0 ? (
        isVideo ? (
          <video
            src={currentMedia.media_url}
            autoPlay
            muted
            loop
            playsInline
            style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
          />
        ) : (
          <img src={currentMedia.media_url} alt={productName} style={{ width: '100%', height: 'auto', display: 'block' }} />
        )
      ) : (
        <div style={{ width: '100%', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>No Media</div>
      )}

      {media.length > 1 && (
        <>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', cursor: 'pointer' }} onClick={handlePrev} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', cursor: 'pointer' }} onClick={handleNext} />
          <div style={{ position: 'absolute', bottom: '15px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: '6px', zIndex: 2 }}>
            {media.map((_, idx) => (
              <div
                key={idx}
                className="smooth-transition"
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
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
