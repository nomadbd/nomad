import React, { useState, useEffect } from 'react';
import { heroContent } from './heroData';

const Hero: React.FC = () => {
  const [currentImage, setCurrentImage] = useState<string>('');

  useEffect(() => {
    if (heroContent.type === 'image' && heroContent.images?.length > 0) {
      const randomIndex = Math.floor(Math.random() * heroContent.images.length);
      setCurrentImage(heroContent.images[randomIndex]);
    }
  }, []);

  return (
    <section id="hero" style={{ height: '100svh', width: '100%', position: 'relative', overflow: 'hidden' }}>
      {heroContent.type === 'image' && currentImage ? (
        <a href={heroContent.ctaLink} style={{ display: 'block', height: '100%', width: '100%' }}>
          <img 
            src={currentImage} 
            alt="Banner" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              objectPosition: 'center', 
              display: 'block' 
            }} 
          />
          <h1 style={{ position: 'absolute', bottom: '10%', left: '5%', color: 'white', margin: 0 }}>
            {heroContent.title}
          </h1>
        </a>
      ) : (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>
          <p>{heroContent.articleBody}</p>
        </div>
      )}
    </section>
  );
};

export default Hero;
