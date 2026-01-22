import React, { useRef, useEffect, useState } from 'react';
import { VideoItem } from '../types';
import { Volume2, VolumeX, Loader2, Clock } from 'lucide-react'; // Добавили иконки ожидания

interface VideoCardProps {
  video: VideoItem;
  onClick?: (video: VideoItem) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Проверяем, в процессе ли генерация
  const isProcessing = video.status === 'processing';
  const isFailed = video.status === 'failed';

  useEffect(() => {
    // Если видео еще создается, не запускаем плеер
    if (isProcessing || isFailed || !video.url) return;

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
  }, [video.url, isProcessing, isFailed]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <div 
        className="relative w-full aspect-[9/16] bg-neutral-900 rounded-xl overflow-hidden shadow-lg border border-white/5 group cursor-pointer active:scale-95 transition-transform duration-200"
        onClick={() => onClick && onClick(video)}
    >
      {/* Отображение состояния загрузки (Processing) */}
      {isProcessing ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-900 p-4 text-center">
          {/* Анимированный фон-пульсация */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent animate-pulse" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative mb-4">
              {/* Вращающаяся иконка с двойным эффектом */}
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <div className="absolute inset-0 w-10 h-10 border-2 border-primary/20 rounded-full animate-ping" />
            </div>
            
            {/* Текст с градиентным переливом */}
            <span className="text-[12px] font-bold tracking-wider uppercase bg-gradient-to-r from-primary via-purple-400 to-primary bg-[length:200%_auto] animate-gradient-text bg-clip-text text-transparent">
              Генерация шедевра
            </span>
            
            <div className="flex items-center mt-2 space-x-1">
              <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1 h-1 bg-primary rounded-full animate-bounce"></span>
            </div>
            
            <p className="text-[9px] text-gray-500 mt-3 font-medium tracking-tight">
              Создаем видео...
            </p>
          </div>
        </div>
      ) : isFailed ? (

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-900/20 backdrop-blur-sm p-4 text-center">
          <p className="text-[11px] font-medium text-red-400">Ошибка генерации</p>
        </div>
      ) : (
        <>
          {/* Кнопка звука - показываем только для готовых видео */}
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
            muted={isMuted}
            loop
            playsInline
            autoPlay
            preload="auto"
            onCanPlay={() => setIsLoading(false)}
            onWaiting={() => setIsLoading(true)}
            onPlaying={() => setIsLoading(false)}
          />
        </>
      )}
      
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
