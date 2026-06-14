import React from 'react';
import { heroContent } from './heroData';

const Hero: React.FC = () => {
  return (
    <section id="hero" style={{ height: '100vh', width: '100%', position: 'relative' }}>
      {heroContent.type === 'image' ? (
        <a href={heroContent.ctaLink} style={{ display: 'block', height: '100%' }}>
          <img src={heroContent.imageUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <h1 style={{ position: 'absolute', bottom: '10%', left: '5%', color: 'white' }}>{heroContent.title}</h1>
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
