import React, { useRef, useEffect, useState } from 'react';
import { VideoItem } from '../types';
import { Volume2, VolumeX, Play, Pause, Music2, Download, RotateCcw, Trash2 } from 'lucide-react'; 

interface VideoCardProps {
  video: VideoItem;
  onClick?: (video: VideoItem) => void;
  onDelete?: (id: any, contentType: string) => void; // Измени на это
  canDownload?: boolean;
}

const getMediaType = (url: string): 'image' | 'audio' | 'video' => {
  const ext = url.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return 'image';
  if (['mp3', 'wav', 'ogg'].includes(ext || '')) return 'audio';
  return 'video';
};

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, onDelete, canDownload = false }) => {
  // 1. ОПРЕДЕЛЯЕМ ТИП КОНТЕНТА (в самом начале)
  const actualType = video.type || (video as any).contentType || getMediaType(video.url || '');
  const isVideo = actualType === 'video';
  const isMusic = actualType === 'music' || actualType === 'audio';
  const isImage = actualType === 'image';

  // 2. СОСТОЯНИЯ (Hooks)
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // 3. СТАТУСЫ
  const isProcessing = video.status === 'processing';
  const isFailed = video.status === 'failed' || video.status === 'error';

  // 4. ФУНКЦИИ УПРАВЛЕНИЯ
  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Переключаем звук только если это видео
    if (isVideo) {
      setIsMuted(!isMuted);
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Если это музыка — запускаем toggleAudio
    if (isMusic) {
      toggleAudio(e);
      return;
    }

    // Если это видео — стандартная логика
    if (isVideo && videoRef.current) {
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

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!video.url) return;
    
    const ext = video.url.split('.').pop() || 'file'; 
    const link = document.createElement('a');
    link.href = video.url;
    link.download = `vidiai_${video.id || 'media'}.${ext}`; 
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Имитация генерации второго трека Suno
  const handleUnlockVariant = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Если уже идет процесс или нет ссылки — выходим
    if (isUnlocking || !video.alternative_url) return;
  
    // 1. ПРОВЕРКА БАЛАНСА (5 монет за второй вариант)
    const cost = 5;
    if (currentCredits < cost) {
      alert("Недостатньо монет для активації другого варіанту");
      return;
    }
  
    try {
      setIsUnlocking(true);
      
      // 2. СПИСАНИЕ МОНЕТ ЧЕРЕЗ ТВОЙ API
      const response = await fetch('https://server.vidiai.top/api/deduct_credits.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id,
          amount: cost,
          reason: 'unlock_variant'
        })
      });
  
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Ошибка списания");
  
      // 3. ОБНОВЛЯЕМ БАЛАНС В ИНТЕРФЕЙСЕ (если есть функция обновления)
      // updateCredits(data.new_balance);
  
      // 4. ИМИТАЦИЯ "МАГИИ" (визуальная обработка)
      setIsAudioPlaying(false);
      
      setTimeout(() => {
        if (audioRef.current) {
          // Подменяем основной URL на альтернативный
          audioRef.current.src = video.alternative_url!;
          audioRef.current.play();
          setIsAudioPlaying(true);
        }
        setIsUnlocking(false);
      }, 3000);
  
    } catch (error: any) {
      console.error("Unlock error:", error);
      alert("Сталася помилка: " + error.message);
      setIsUnlocking(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2 group">
      <div 
        className="relative w-full aspect-[9/16] bg-neutral-900 rounded-xl overflow-hidden shadow-lg border border-white/5 cursor-pointer active:scale-[0.98] transition-all duration-200"
        onClick={handleVideoClick} 
      >
        {isProcessing ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#050505] p-4 text-center overflow-hidden">
            {/* 1. Живой фон с глубоким градиентом */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/10 animate-pulse" />
            
            {/* 2. Центральный анимированный элемент */}
            <div className="relative mb-6">
              {/* Мягкое свечение сзади */}
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-pulse" />
              
              {/* Вращающееся высокотехнологичное кольцо */}
              <div className="w-16 h-16 rounded-full border-2 border-transparent border-t-primary border-r-secondary animate-spin shadow-[0_0_20px_rgba(168,85,247,0.3)]" />
              
            </div>
        
            {/* 3. Текст с градиентом и анимацией */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-gradient-to-r from-primary via-purple-300 to-secondary bg-clip-text text-transparent animate-pulse">
                Створюємо магію
              </span>
              
              {/* 4. Полоска прогресса (shimmer effect) */}
              <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-primary via-secondary to-primary w-full animate-[shimmer_2s_infinite_linear]" />
              </div>
            </div>
          </div>
        ) : isFailed ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-950/40 p-4 text-center backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mb-2 border border-red-500/30">
                <span className="text-red-500 text-xl font-bold">!</span>
            </div>
            <p className="text-[11px] font-black uppercase tracking-wider text-red-400">Помилка</p>
          </div>
        ) : (
          <>
            {/* 1. КНОПКИ ПОВЕРХ ВИДЕО ТЕПЕРЬ ТОЛЬКО НА ГЛАВНОЙ */}
            {!canDownload && getMediaType(video.url || '') === 'video' && (
              <button 
                onClick={toggleMute}
                className="absolute top-2 right-2 z-30 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white"
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            )}

            {/* Плей оставляем всегда, когда видео на паузе */}
            {!isPlaying && getMediaType(video.url || '') === 'video' && (
               <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 pointer-events-none">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                    <Play size={24} className="text-white ml-1" fill="currentColor" />
                  </div>
               </div>
            )}
            
            {(() => {
              const type = video.contentType || getMediaType(video.url || '');
              
              if (type === 'image') {
                return (
                  <img 
                    src={video.url} 
                    className="w-full h-full object-cover" 
                    alt={video.title || 'Generated image'} 
                  />
                );
              }
            
              if (type === 'music' || type === 'audio') {
                return (
                  <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-b from-neutral-800 to-black p-6 relative" onClick={toggleAudio}>
                    <audio 
                      ref={audioRef}
                      src={video.url} 
                      onEnded={() => setIsAudioPlaying(false)}
                      className="hidden" 
                    />
                    
                    {/* Визуализация */}
                    <div className={`relative w-24 h-24 mb-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isAudioPlaying ? 'border-primary shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'border-white/10'}`}>
                      {isAudioPlaying ? (
                        <Pause size={40} className="text-primary fill-current" />
                      ) : (
                        <Play size={40} className="text-white fill-current ml-2" />
                      )}
                      
                      {/* Пульсирующие круги при проигрывании */}
                      {isAudioPlaying && (
                        <div className="absolute inset-0 rounded-full border border-primary animate-ping opacity-20" />
                      )}
                    </div>
              
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                      {isAudioPlaying ? 'Зараз лунає' : 'Слухати'}
                    </span>
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

      {/* КНОПКА ВАРИАНТ №2 (Добавляем сюда) */}
      {isMusic && video.alternative_url && !isProcessing && (
        <button 
          onClick={handleUnlockVariant}
          disabled={isUnlocking}
          className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border
            ${isUnlocking 
              ? 'bg-neutral-800 border-white/5 text-gray-500 cursor-wait' 
              : 'bg-gradient-to-r from-secondary/10 to-primary/10 border-secondary/30 text-secondary hover:border-secondary shadow-[0_0_15px_rgba(236,72,153,0.1)] active:scale-[0.97]'
            }`}
        >
          {isUnlocking ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
              Активація...
            </span>
          ) : (
            '✨ Отримати варіант №2 (5 🟡)'
          )}
        </button>
      )}
        
      {!isProcessing && !isFailed && (
        <div className="w-full">
          {canDownload ? (
            /* 2. ПАНЕЛЬ В ОБЩЕЙ РАМКЕ */
            <div className="flex items-center justify-around bg-white/5 border border-white/10 rounded-2xl p-1 shadow-sm mt-1">
              {/* Скачать */}
              <button onClick={handleDownload} className="p-2.5 text-gray-400 hover:text-white transition-colors">
                <Download size={18} />
              </button>

              {/* Кнопка Звук в нижней панели */}
              <button 
                onClick={toggleMute} 
                disabled={!isVideo} 
                className={`p-2.5 transition-all duration-200 ${
                  isVideo 
                    ? 'text-gray-400 hover:text-white active:scale-110' 
                    : 'text-white/40 cursor-not-allowed opacity-30'
                }`}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              {/* 3. ПОВТОР (ИКОНКА СТРЕЛКИ) */}
              <button onClick={(e) => { e.stopPropagation(); onClick && onClick(video); }} className="p-2.5 text-primary hover:opacity-80 transition-opacity">
                <RotateCcw size={18} />
              </button>

              {/* Удалить */}
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  
                  // Пробуем все варианты, которые могут прийти из базы или API
                  const actualId = video.id || video.video_id || (video as any)._id; 
                  
                  console.log("Пытаемся удалить видео с объектом:", video); // Увидим структуру в консоли
                  
                  if (actualId && onDelete) {
                    onDelete(actualId, video.contentType || 'video');
                  } else {
                    alert("Не вдалося знайти ID відео");
                  }
                }}
                className="p-2.5 text-red-500/60 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ) : (
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
