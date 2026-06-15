import React, { useState, useEffect } from 'react';
import { heroContent } from './heroData';

const Hero: React.FC = () => {
  const [currentImage, setCurrentImage] = useState<string>('');

  useEffect(() => {
    if (heroContent.type === 'image' && heroContent.images && heroContent.images.length > 0) {
      const randomIndex = Math.floor(Math.random() * heroContent.images.length);
      setCurrentImage(heroContent.images[randomIndex]);
    }
  }, []);

  return (
    <section id="hero" style={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
      
      {/* ইমেজ মোড */}
      {heroContent.type === 'image' && currentImage ? (
        <a href={heroContent.ctaLink} style={{ display: 'block', height: '100%', width: '100%' }}>
          <img 
            src={currentImage} 
            alt="Banner" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} 
          />
          <h1 style={{ position: 'absolute', bottom: '10%', left: '5%', color: 'white', margin: 0 }}>{heroContent.title}</h1>
        </a>
      ) : (
        /* আর্টিকেল মোড */
        <div style={{ 
            height: '100%', display: 'flex', flexDirection: 'column', 
            alignItems: 'center', justifyContent: 'center', 
            background: '#1a1a1a', color: '#fff', padding: '20px', textAlign: 'center' 
        }}>
          <h2 style={{ fontSize: '3rem', marginBottom: '20px' }}>{heroContent.title}</h2>
          <p style={{ fontSize: '1.2rem', maxWidth: '600px' }}>{heroContent.articleBody}</p>
          <a href={heroContent.ctaLink} style={{ marginTop: '30px', padding: '10px 25px', background: '#fff', color: '#000', textDecoration: 'none', fontWeight: 'bold' }}>
            বিস্তারিত দেখুন
          </a>
        </div>
      )}
    </section>
  );
};

export default Hero;
