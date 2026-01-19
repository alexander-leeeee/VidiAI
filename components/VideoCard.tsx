import React, { useRef, useEffect, useState } from 'react';
import { VideoItem } from '../types';

interface VideoCardProps {
  video: VideoItem;
  onClick?: (video: VideoItem) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Observer to play video only when in view (saves battery/performance)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {
              // Auto-play might be blocked or low power mode
            });
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div 
        className="relative w-full aspect-[9/16] bg-surface rounded-xl overflow-hidden shadow-lg border border-white/10 group cursor-pointer active:scale-95 transition-transform duration-200"
        onClick={() => onClick && onClick(video)}
    >
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={video.url}
        poster={video.thumbnail}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        muted
        loop
        playsInline
        onLoadedData={() => setIsLoading(false)}
      />
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
      
      {/* Text Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-xs font-medium text-gray-200 line-clamp-2 leading-snug">
          {video.prompt}
        </p>
      </div>
    </div>
  );
};

export default VideoCard;