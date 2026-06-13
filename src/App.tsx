import React from 'react';
import Header from './components/Header';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-8">
        {/* আপনার মেইন কন্টেন্ট এখানে থাকবে */}
      </main>
    </div>
  );
};

export default App; 