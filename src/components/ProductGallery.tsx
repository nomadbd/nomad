import { useState } from 'react';

export default function ProductGallery({ images, productName }: { images: string[], productName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // বামে ক্লিক করলে আগের ছবি
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  };

  // ডানে ক্লিক করলে পরের ছবি
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div style={{ width: '100%', aspectRatio: '3/4', position: 'relative', overflow: 'hidden', backgroundColor: '#111' }}>
      {/* ছবি ডিসপ্লে */}
      <img 
        src={images[currentIndex]} 
        alt={productName} 
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      {/* টাচ এরিয়া: বাম পাশে ক্লিক করলে Prev, ডান পাশে ক্লিক করলে Next */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', cursor: 'pointer' }} onClick={handlePrev} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', cursor: 'pointer' }} onClick={handleNext} />

      {/* ইন্সটাগ্রামের মতো ডট ইন্ডিকেটর (নিচে সুন্দরভাবে থাকবে) */}
      {images.length > 1 && (
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
      )}
    </div>
  );
}
