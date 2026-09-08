import { useState, useRef } from 'react';

interface ImageCropModalProps {
  isOpen: boolean;
  selectedImageSrc: string | null;
  isAmbassadorActive: boolean;
  onClose: () => void;
  onApply: (croppedFile: File) => void;
}

export default function ImageCropModal({
  isOpen,
  selectedImageSrc,
  isAmbassadorActive,
  onClose,
  onApply
}: ImageCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  if (!isOpen || !selectedImageSrc) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const generateCroppedFile = (): Promise<File | null> => {
    return new Promise((resolve) => {
      if (!imgRef.current || !selectedImageSrc) {
        resolve(null);
        return;
      }

      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      const outputSize = 500;
      canvas.width = outputSize;
      canvas.height = outputSize;

      const viewportSize = 200;
      const baseScale = Math.max(viewportSize / image.naturalWidth, viewportSize / image.naturalHeight);
      const currentScale = baseScale * zoom;

      const renderedWidth = image.naturalWidth * currentScale;
      const renderedHeight = image.naturalHeight * currentScale;

      const imgLeftInViewport = (viewportSize - renderedWidth) / 2 + offset.x;
      const imgTopInViewport = (viewportSize - renderedHeight) / 2 + offset.y;

      const scaleRatio = outputSize / viewportSize;

      ctx.fillStyle = '#181818';
      ctx.fillRect(0, 0, outputSize, outputSize);

      ctx.drawImage(
        image,
        imgLeftInViewport * scaleRatio,
        imgTopInViewport * scaleRatio,
        renderedWidth * scaleRatio,
        renderedHeight * scaleRatio
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        resolve(croppedFile);
      }, 'image/jpeg', 0.92);
    });
  };

  const handleApplyClick = async () => {
    const croppedFile = await generateCroppedFile();
    if (croppedFile) {
      onApply(croppedFile);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 10001 }}>
      <div style={{ background: '#121212', borderTop: '1px solid #282828', borderRadius: '24px 24px 0 0', padding: '16px 20px calc(20px + env(safe-area-inset-bottom)) 20px', maxWidth: '480px', width: '100%', maxHeight: '90dvh', overflowY: 'auto', textAlign: 'center', boxShadow: '0 -10px 30px rgba(0,0,0,0.8)', boxSizing: 'border-box' }}>
        <div style={{ width: '36px', height: '4px', background: '#333', borderRadius: '2px', margin: '0 auto 12px auto' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>EDIT MEDIA</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>

        <div 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ width: '200px', height: '200px', borderRadius: '50%', margin: '0 auto 16px auto', overflow: 'hidden', position: 'relative', cursor: isDragging ? 'grabbing' : 'grab', backgroundColor: '#181818', border: isAmbassadorActive ? '1px solid #ffffff' : '1px solid #333', boxShadow: isAmbassadorActive ? '0 0 20px rgba(255, 255, 255, 0.4)' : 'none', userSelect: 'none', touchAction: 'none' }}>
          <img 
            ref={imgRef}
            src={selectedImageSrc} 
            alt="Crop preview" 
            draggable={false}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: 'center center', pointerEvents: 'none' }}
          />
        </div>

        <div style={{ marginBottom: '16px', padding: '0 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888', marginBottom: '6px', letterSpacing: '1px' }}>
            <span>ZOOM</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="3" 
            step="0.05" 
            value={zoom} 
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#fff', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
          <button onClick={onClose} style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', color: '#ccc', padding: '12px 0', borderRadius: '24px', fontSize: '12px', letterSpacing: '1px', fontWeight: '600', cursor: 'pointer' }}>CANCEL</button>
          <button onClick={handleApplyClick} style={{ flex: 1, background: '#fff', border: 'none', color: '#000', padding: '12px 0', borderRadius: '24px', fontSize: '12px', letterSpacing: '1px', fontWeight: '700', cursor: 'pointer' }}>APPLY</button>
        </div>
      </div>
    </div>
  );
}