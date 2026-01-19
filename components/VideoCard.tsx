import React, { useRef, useEffect, useState } from 'react';
import { VideoItem } from '../types';
import { Volume2, VolumeX } from 'lucide-react'; // Импортируем иконки

interface VideoCardProps {
  video: VideoItem;
  onClick?: (video: VideoItem) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // Состояние звука

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [video.url]);

  // Функция переключения звука
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Чтобы не срабатывал переход в генератор при нажатии на звук
    setIsMuted(!isMuted);
  };

  return (
    <div 
        className="relative w-full aspect-[9/16] bg-neutral-900 rounded-xl overflow-hidden shadow-lg border border-white/5 group cursor-pointer active:scale-95 transition-transform duration-200"
        onClick={() => onClick && onClick(video)}
    >
      {/* Кнопка звука */}
      <button 
        onClick={toggleMute}
        className="absolute top-2 right-2 z-30 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all"
      >
        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>

      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={video.url}
        className="w-full h-full object-cover"
        muted={isMuted} // Управляем звуком через состояние
        loop
        playsInline
        autoPlay
        preload="auto"
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
      
      <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
        <p className="text-[10px] font-medium text-gray-100 line-clamp-2 leading-tight opacity-90">
          {video.prompt}
        </p>
      </div>
    </div>
  );
};

export default VideoCard;
