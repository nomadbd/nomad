import React, { useState, useEffect } from 'react';
import { heroContent } from './heroData';

const Hero: React.FC = () => {
  const [currentImage, setCurrentImage] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false); // অ্যানিমেশন ট্রিকার করার জন্য
  const s = heroContent.styles || {};

  useEffect(() => {
    if (heroContent.type === 'image' && heroContent.images?.length > 0) {
      const randomIndex = Math.floor(Math.random() * heroContent.images.length);
      setCurrentImage(heroContent.images[randomIndex]);
    }
    // কম্পোনেন্ট মাউন্ট হওয়ার পর অ্যানিমেশন শুরু করার জন্য ছোট ডিলে
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // কমন স্টাইল অবজেক্ট
  const transitionStyle: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all 1.2s cubic-bezier(0.22, 1, 0.36, 1)', // প্রিমিয়াম ফিল দিতে কিউবিক বেজিয়ার
  };

  return (
    <section id="hero" style={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
      {heroContent.type === 'image' && currentImage ? (
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
          <img 
            src={currentImage} 
            alt="Banner" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 10s ease-out' }} 
          />
          <h1 style={{ ...transitionStyle, position: 'absolute', bottom: '10%', left: '5%', color: 'white', margin: 0, fontSize: '3rem' }}>
            {heroContent.title}
          </h1>
        </div>
      ) : (
        <div style={{ 
            height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', 
            justifyContent: 'center', background: s.backgroundColor || '#000', 
            padding: s.padding || '20px', textAlign: 'center' 
        }}>
          <h2 style={{ ...transitionStyle, fontSize: s.titleFontSize || '2.5rem', color: s.titleColor || '#fff', marginBottom: '20px' }}>
            {heroContent.title}
          </h2>
          <p style={{ ...transitionStyle, transitionDelay: '0.2s', fontSize: s.textFontSize || '1rem', color: s.textColor || '#ccc', maxWidth: '600px', lineHeight: '1.6' }}>
            {heroContent.articleBody}
          </p>
        </div>
      )}
    </section>
  );
};

export default Hero;
