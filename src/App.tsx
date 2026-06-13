import React, { lazy, Suspense } from 'react';

// এটি কোডটিকে ছোট ছোট টুকরোয় ভাগ করে লোড করবে, যা স্পিড বাড়ায়
const Header = lazy(() => import('./components/Header'));

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <Suspense fallback={<div></div>}>
        <Header />
      </Suspense>
      <main className="p-8">
      </main>
    </div>
  );
};

export default App;
