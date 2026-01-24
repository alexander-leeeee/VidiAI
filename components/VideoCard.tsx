import React, { useRef, useEffect, useState } from 'react';
import { VideoItem } from '../types';
import { Volume2, VolumeX, Loader2, Play } from 'lucide-react'; 

interface VideoCardProps {
  video: VideoItem;
  onClick?: (video: VideoItem) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const isProcessing = video.status === 'processing';
  const isFailed = video.status === 'failed';

  useEffect(() => {
    if (isProcessing || isFailed || !video.url) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
            setIsPlaying(true);
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [video.url, isProcessing, isFailed]);

  // Управление видео по клику
  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        // Пытаемся запустить и сразу обновляем иконку
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
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-900 p-4 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent animate-pulse" />
            <div className="relative z-10 flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <span className="text-[12px] font-bold tracking-wider uppercase bg-gradient-to-r from-primary via-purple-400 to-primary bg-[length:200%_auto] animate-gradient-text bg-clip-text text-transparent">
                Генерация...
              </span>
            </div>
          </div>
        ) : isFailed ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-900/20 backdrop-blur-sm p-4 text-center">
            <p className="text-[11px] font-medium text-red-400">Ошибка</p>
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

            {/* Иконка паузы (появляется если видео на паузе) */}
            {!isPlaying && !isLoading && (
               <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 pointer-events-none">
                  <Play size={40} className="text-white opacity-80" fill="currentColor" />
               </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
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
              preload="metadata"
              onCanPlay={() => setIsLoading(false)}
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

      {/* Кнопка "Создать" теперь отдельно снизу */}
      {!isProcessing && !isFailed && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClick && onClick(video);
          }}
          className="w-full py-2.5 bg-primary text-white text-[11px] font-bold rounded-lg shadow-lg active:scale-95 transition-all"
        >
          Сгенерировать
        </button>
      )}
    </div>
  );
};

export default VideoCard;
