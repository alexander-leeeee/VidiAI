import React, { useRef, useEffect, useState } from 'react';
import { VideoItem } from '../types';
import { Volume2, VolumeX, Play, Music2, Download } from 'lucide-react'; // Добавили Music сюда!

interface VideoCardProps {
  video: VideoItem;
  onClick?: (video: VideoItem) => void;
  onDelete?: (id: number) => void;
  canDownload?: boolean;
}

const getMediaType = (url: string): 'image' | 'audio' | 'video' => {
  const ext = url.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return 'image';
  if (['mp3', 'wav', 'ogg'].includes(ext || '')) return 'audio';
  return 'video';
};

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, canDownload = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const isProcessing = video.status === 'processing';
  const isFailed = video.status === 'failed';

  useEffect(() => {
    if (isProcessing || isFailed || !video.url) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
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

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (getMediaType(video.url || '') !== 'video' || !videoRef.current) return;
    
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.error("Playback error:", err));
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

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!video.url) return;
    
    const ext = video.url.split('.').pop() || 'file'; // Берем реальное расширение
    const link = document.createElement('a');
    link.href = video.url;
    link.download = `vidiai_${video.id || 'media'}.${ext}`; 
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col space-y-2 group">
      <div 
        className="relative w-full aspect-[9/16] bg-neutral-900 rounded-xl overflow-hidden shadow-lg border border-white/5 cursor-pointer active:scale-[0.98] transition-all duration-200"
        onClick={handleVideoClick} 
      >
        {isProcessing ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-900 p-4 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent animate-pulse" />
            <span className="relative z-10 text-[12px] font-bold tracking-wider uppercase bg-gradient-to-r from-primary via-purple-400 to-primary bg-[length:200%_auto] animate-gradient-text bg-clip-text text-transparent text-white">
              Генерация...
            </span>
          </div>
        ) : isFailed ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-900/20 p-4 text-center">
            <p className="text-[11px] font-medium text-red-400">Ошибка</p>
          </div>
        ) : (
          <>
            {/* Кнопка скачивания универсальная */}
            {canDownload && !isProcessing && !isFailed && video.url && (
              <button 
                onClick={handleDownload}
                className="absolute top-2 left-2 z-30 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-primary transition-colors"
              >
                <Download size={14} />
              </button>
            )}

            {/* Интерфейс плеера только для видео */}
            {getMediaType(video.url || '') === 'video' && (
              <>
                <button 
                  onClick={toggleMute}
                  className="absolute top-2 right-2 z-30 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white"
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>

                {!isPlaying && (
                   <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 pointer-events-none">
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                        <Play size={24} className="text-white ml-1" fill="currentColor" />
                      </div>
                   </div>
                )}
              </>
            )}
            
            {/* Умный рендер контента */}
            {(() => {
              const type = getMediaType(video.url || '');
              
              if (type === 'image') {
                return (
                  <img 
                    src={video.url} 
                    className="w-full h-full object-cover" 
                    alt={video.title || 'Generated image'} 
                  />
                );
              }
            
              if (type === 'audio') {
                return (
                  <div className="flex flex-col items-center justify-center w-full h-full bg-neutral-800 p-4">
                    <Music2 size={48} className="text-primary mb-4 animate-bounce" />
                    <audio 
                      src={video.url} 
                      controls 
                      className="w-full h-8 opacity-70 custom-audio-player" 
                    />
                  </div>
                );
              }
            
              return (
                <video
                  ref={videoRef}
                  src={video.url}
                  poster={video.thumbnail}
                  className="w-full h-full object-cover"
                  muted={isMuted}
                  loop
                  playsInline
                  preload="metadata"
                  onPlaying={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onClick={handleVideoClick}
                />
              );
            })()}
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
        
        <div className="absolute bottom-0 left-0 right-0 p-3 z-20 flex flex-col items-start gap-1.5">
          {video.hasMusic && (
            <div className="flex items-center gap-1.5 bg-primary/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-primary/30 animate-pulse">
              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <Music2 size={10} className="text-white" strokeWidth={3} />
              </div>
              <span className="text-[9px] font-bold text-white uppercase tracking-widest">
                С музыкой
              </span>
            </div>
          )}

          <p className="text-[13px] font-bold text-white line-clamp-1">
            {video.title || 'Без названия'}
          </p>
        </div>
      </div>
        
      {!isProcessing && !isFailed && (
        <div className="w-full">
          {canDownload ? (
            /* Ряд круглых кнопок только для Галереи */
            <div className="flex items-center justify-between px-1 py-2">
              
              {/* 1. Скачать */}
              <button 
                onClick={handleDownload}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 active:scale-90 transition-all"
              >
                <Download size={18} />
              </button>
      
              {/* 2. Вкл/Выкл звук */}
              {getMediaType(video.url || '') === 'video' && (
                <button 
                  onClick={toggleMute}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 active:scale-90 transition-all"
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              )}
      
              {/* 3. Генерировать повторно (используем onClick) */}
              <button 
                onClick={(e) => { e.stopPropagation(); onClick && onClick(video); }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary active:scale-90 transition-all"
              >
                <Play size={18} fill="currentColor" />
              </button>
      
              {/* 4. Удалить */}
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (video.id && onDelete) onDelete(Number(video.id)); 
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 active:scale-90 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
      
            </div>
          ) : (
            /* Обычная кнопка для главной */
            <button 
              onClick={(e) => { e.stopPropagation(); onClick && onClick(video); }}
              className="w-full py-2.5 bg-primary text-white text-[11px] font-bold rounded-lg shadow-lg active:scale-95 transition-all"
            >
              Сгенерировать
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoCard;
