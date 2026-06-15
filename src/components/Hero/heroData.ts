// heroData.ts
export const heroContent = {
  // যদি ছবি দেখাতে চান তাহলে type: 'image', অন্যথায় 'article'
  type: 'image', 
  title: '',
  ctaLink: '#products',
  
  // ছবির তালিকা (একাধিক ছবি থাকলে র‍্যান্ডম আসবে)
  images: [
    '/images/hero-banner.jpg',
    // '/images/hero-banner1.jpg' // নতুন ছবি যোগ করতে পারেন
  ],
  
  // ছবির পরিবর্তে যা দেখাবে (যদি type: 'article' হয়)
  articleBody: 'আমাদের নতুন কালেকশন এখন লাইভ। প্রিমিয়াম কোয়ালিটি এবং সেরা ডিজাইন যা আপনাকে করবে অনন্য।'
};
