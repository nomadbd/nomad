import React from 'react';
import Header from './components/Header';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* 
        এখানে Header কম্পোনেন্ট লোড হচ্ছে। 
        কোনো বাড়তি লাইব্রেরি বা ফন্ট এখানে নেই, 
        তাই এটি চোখের পলকে লোড হবে। 
      */}
      <Header />
      
      <main className="p-8">
        {/* আপনার মূল কন্টেন্ট এখানে থাকবে */}
      </main>
    </div>
  );
};

export default App;
