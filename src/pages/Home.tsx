import React, { Suspense, lazy } from 'react';
const HeroSection = lazy(() => import('@/components/ui/hero-section-1').then(m => ({ default: m.HeroSection })));
const Footer = lazy(() => import('@/components/ui/footer-taped-design').then(m => ({ default: m.Component })));

const Home: React.FC = () => {
  return (
    <>
      <Suspense fallback={<div />}> 
        <HeroSection />
      </Suspense>
      <Suspense fallback={<div />}> 
        <Footer />
      </Suspense>
    </>
  );
};

export default Home;