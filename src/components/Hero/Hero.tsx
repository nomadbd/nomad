import React, { useState, useEffect } from 'react';
import { heroContent } from './heroData';

const Hero: React.FC = () => {
  const [currentImage, setCurrentImage] = useState<string>('');
  const s = heroContent.styles || {}; // সেফটি চেক

  useEffect(() => {
    if (heroContent.type === 'image' && heroContent.images?.length > 0) {
      const randomIndex = Math.floor(Math.random() * heroContent.images.length);
      setCurrentImage(heroContent.images[randomIndex]);
    }
  }, []);

  return (
    <section id="hero" style={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
      {heroContent.type === 'image' && currentImage ? (
        <a href={heroContent.ctaLink} style={{ display: 'block', height: '100%', width: '100%' }}>
          <img src={currentImage} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
          <h1 style={{ position: 'absolute', bottom: '10%', left: '5%', color: 'white', margin: 0 }}>{heroContent.title}</h1>
        </a>
      ) : (
        <div style={{ 
            height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', 
            justifyContent: 'center', background: s.backgroundColor || '#000', 
            padding: s.padding || '20px', textAlign: 'center' 
        }}>
          <h2 style={{ fontSize: s.titleFontSize || '2.5rem', color: s.titleColor || '#fff', marginBottom: '20px' }}>
            {heroContent.title}
          </h2>
          <p style={{ fontSize: s.textFontSize || '1rem', color: s.textColor || '#ccc', maxWidth: '600px', lineHeight: '1.6' }}>
            {heroContent.articleBody}
          </p>
          <a href={heroContent.ctaLink} style={{ 
              marginTop: '30px', padding: '12px 25px', background: s.buttonBg || '#fff', 
              color: s.buttonColor || '#000', textDecoration: 'none', fontWeight: 'bold' 
          }}>
            {heroContent.ctaText || 'বিস্তারিত'}
          </a>
        </div>
      )}
    </section>
  );
};

export default Hero;
