import React, { useRef, useEffect, useState } from 'react';
import { VideoItem } from '../types';
import { 
  Volume2, VolumeX, Play, Music2, Download, 
  RotateCcw, Trash2 
} from 'lucide-react'; 

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

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, onDelete, canDownload = false }) => {
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
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(err => console.error(err));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!video.url) return;
    const link = document.createElement('a');
    link.href = video.url;
    link.download = `vidiai_${video.id || 'media'}.mp4`;
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
              Генерація...
            </span>
          </div>
        ) : isFailed ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-900/20 p-4 text-center">
            <p className="text-[11px] font-medium text-red-400">Помилка</p>
          </div>
        ) : (
          <>
            {/* Кнопка Play теперь видна везде, если видео на паузе */}
            {getMediaType(video.url || '') === 'video' && !isPlaying && (
               <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 pointer-events-none">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                    <Play size={24} className="text-white ml-1" fill="currentColor" />
                  </div>
               </div>
            )}

            {/* Иконка звука сверху только для Главной */}
            {!canDownload && getMediaType(video.url || '') === 'video' && (
              <button onClick={toggleMute} className="absolute top-2 right-2 z-30 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white">
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            )}
            
            {(() => {
              const type = getMediaType(video.url || '');
              if (type === 'image') return <img src={video.url} className="w-full h-full object-cover" alt="" />;
              if (type === 'audio') return (
                <div className="flex flex-col items-center justify-center w-full h-full bg-neutral-800 p-4">
                  <Music2 size={48} className="text-primary mb-4 animate-bounce" />
                  <audio src={video.url} controls className="w-full h-8 opacity-70" />
                </div>
              );
              return (
                <video
                  ref={videoRef}
                  src={video.url}
                  poster={video.thumbnail || video.url + '#t=0.01'} // Трюк для подгрузки первого кадра
                  className="w-full h-full object-cover bg-neutral-900"
                  muted={isMuted}
                  loop
                  playsInline
                  preload="auto"
                  onPlaying={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              );
            })()}
          </>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
        
        <div className="absolute bottom-0 left-0 right-0 p-3 z-20 flex flex-col items-start gap-1.5">
          {video.hasMusic && (
            <div className="flex items-center gap-1.5 bg-primary/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-primary/30">
              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <Music2 size={10} className="text-white" strokeWidth={3} />
              </div>
              <span className="text-[9px] font-bold text-white uppercase tracking-widest">З музикою</span>
            </div>
          )}
          <p className="text-[13px] font-bold text-white line-clamp-1">{video.title || 'Без назви'}</p>
        </div>
      </div>
        
      {!isProcessing && !isFailed && (
        <div className="w-full">
          {canDownload ? (
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-1 shadow-sm">
              <button onClick={handleDownload} className="p-2.5 text-gray-400 hover:text-white transition-colors">
                <Download size={18} />
              </button>

              <button onClick={toggleMute} className="p-2.5 text-gray-400 hover:text-white transition-colors">
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              <button onClick={(e) => { e.stopPropagation(); onClick?.(video); }} className="p-2.5 text-primary hover:opacity-80 transition-opacity">
                <RotateCcw size={18} />
              </button>

              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (video.id && onDelete) onDelete(Number(video.id)); 
                }} 
                className="p-2.5 text-red-500/60 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); onClick?.(video); }}
              className="w-full py-2.5 bg-primary text-white text-[11px] font-bold rounded-lg shadow-lg active:scale-95 transition-all"
            >
              Сгенерувати
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoCard;
