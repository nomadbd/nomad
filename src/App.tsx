import React from 'react';
import Header from './components/Header';

const App: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'black' }}>
      <Header />
      <main style={{ padding: '32px' }}>
        {/* আপনার মূল কন্টেন্ট এখানে থাকবে */}
      </main>
    </div>
  );
};

export default App;
