import React from 'react';
import heroVideo from '@/assets/Holographic_Invoice_Cinematic_Reveal.mp4';
import posterImage from '@/assets/image.png';

const VideoShowcase: React.FC = () => {
  const ref = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    let io: IntersectionObserver | null = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => {
      if (io) {
        io.disconnect();
      }
      io = null;
    };
  }, []);

  return (
    <video
      ref={ref}
      className="z-2 aspect-15/8 relative rounded-2xl border border-border/25 w-full object-cover"
      src={heroVideo}
      poster={posterImage}
      playsInline
      autoPlay
      muted
      loop
      preload="metadata"
    />
  );
};

export default VideoShowcase;
