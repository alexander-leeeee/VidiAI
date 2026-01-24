import React, { useRef, useEffect, useState } from 'react';
import { VideoItem } from '../types';
import { Volume2, VolumeX, Play } from 'lucide-react'; 

interface VideoCardProps {
  video: VideoItem;
  onClick?: (video: VideoItem) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false); // Видео изначально стоит

  const isProcessing = video.status === 'processing';
  const isFailed = video.status === 'failed';

  // IntersectionObserver теперь только ставит на паузу, если видео ушло с экрана
  useEffect(() => {
    if (isProcessing || isFailed || !video.url) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Если видео вышло из кадра, останавливаем его
          if (!entry.isIntersecting && isPlaying) {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [isPlaying, isProcessing, isFailed]);

  // Управление видео по клику: запускает и останавливает мгновенно
  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.error("Ошибка воспроизведения:", err));
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex flex-col space-y-2 group">
      {/* Контейнер видео */}
      <div 
        className="relative w-full aspect-[9/16] bg-neutral-900 rounded-xl overflow-hidden shadow-lg border border-white/5 cursor-pointer active:scale-[0.98] transition-all duration-200"
        onClick={handleVideoClick} 
      >
        {isProcessing ? (
          /* Состояние генерации: только текст и мягкий фон, никаких крутилок */
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-900 p-4 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent animate-pulse" />
            <span className="relative z-10 text-[12px] font-bold tracking-wider uppercase bg-gradient-to-r from-primary via-purple-400 to-primary bg-[length:200%_auto] animate-gradient-text bg-clip-text text-transparent">
              Генерация шедевра
            </span>
          </div>
        ) : isFailed ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-900/20 backdrop-blur-sm p-4 text-center">
            <p className="text-[11px] font-medium text-red-400">Ошибка генерации</p>
          </div>
        ) : (
          <>
            {/* Кнопка звука */}
            <button 
              onClick={toggleMute}
              className="absolute top-2 right-2 z-30 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>

            {/* Иконка Play - видна только когда видео на паузе */}
            {!isPlaying && (
               <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 pointer-events-none">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                    <Play size={24} className="text-white ml-1" fill="currentColor" />
                  </div>
               </div>
            )}
            
            <video
              ref={videoRef}
              src={video.url}
              poster={video.thumbnail}
              className="w-full h-full object-cover"
              muted={isMuted}
              loop
              playsInline
              // autoPlay полностью убран
              preload="metadata"
              onPlaying={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={handleVideoClick}
            />
          </>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
        
        <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
          <p className="text-[10px] font-medium text-gray-100 line-clamp-2 opacity-90">
            {video.prompt}
          </p>
        </div>
      </div>

      {/* Кнопка действия под видео */}
      {!isProcessing && !isFailed && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClick && onClick(video);
          }}
          className="w-full py-2.5 bg-primary text-white text-[11px] font-bold rounded-lg shadow-lg active:scale-95 transition-all"
        >
          Згенерувати таке
        </button>
      )}
    </div>
  );
};

export default VideoCard;
