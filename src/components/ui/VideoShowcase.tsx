import React from 'react';
import posterImage from '@/assets/image.png';

const VideoShowcase: React.FC = () => {
  return (
    <img
      src={posterImage}
      alt="Ledgr product preview"
      className="z-2 relative w-full h-auto rounded-2xl border border-border/25 object-cover"
      loading="eager"
      decoding="async"
    />
  );
};

export default VideoShowcase;
