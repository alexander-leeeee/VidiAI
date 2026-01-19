import React, { useRef, useEffect, useState } from 'react';
import { VideoItem } from '../types';

interface VideoCardProps {
  video: VideoItem;
  onClick?: (video: VideoItem) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Изначально ставим false, чтобы не ждать лоадера, если видео в кэше
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Попытка принудительного воспроизведения при появлении в кадре
            const playPromise = videoRef.current?.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {
                // Если заблокировано, попробуем еще раз при клике или взаимодействии
              });
            }
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.1 } // Начинаем играть раньше (при 10% видимости)
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, [video.url]); // Перезапускаем при смене ссылки

  return (
    <div 
        className="relative w-full aspect-[9/16] bg-neutral-900 rounded-xl overflow-hidden shadow-lg border border-white/5 group cursor-pointer active:scale-95 transition-transform duration-200"
        onClick={() => onClick && onClick(video)}
    >
      {/* Лоадер показываем только поверх видео, не скрывая его */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={video.url}
        // Убираем poster, чтобы не было статичной картинки
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
        autoPlay // Пытаемся запустить сразу
        preload="auto" // Грузим видео максимально быстро
        onCanPlay={() => setIsLoading(false)} // Убираем лоадер, как только можно играть
        onWaiting={() => setIsLoading(true)} // Возвращаем лоадер, если видео зависло (буферизация)
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
