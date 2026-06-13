import React from 'react';
import Header from './components/Header';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="p-8">
        {/* আপনার কন্টেন্ট এখানে থাকবে */}
      </main>
    </div>
  );
};

export default App;
