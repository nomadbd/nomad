import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero/Hero'; // Hero কম্পোনেন্ট ইমপোর্ট করা হলো

const App: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'black', color: 'white' }}>
      {/* হেডার এখন নিজেই সার্চ এবং প্রোফাইল ওভারলে হ্যান্ডেল করবে */}
      <Header />

      {/* হিরো ব্যানার সেকশন */}
      <Hero />

      <main style={{ padding: '32px' }}>
        {/* আপনার অন্যান্য কন্টেন্ট এখানে থাকবে */}
      </main>
    </div>
  );
};

export default App;
