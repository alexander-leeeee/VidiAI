import React, { useEffect, useState } from 'react';
import VideoCard from './VideoCard';
import { VideoItem, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { getTaskStatus, updateVideoInDb } from '../services/aiService';

interface LibraryProps {
  lang: Language;
  onReplayRequest: (video: VideoItem) => void;
  currentCredits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
}

const Library: React.FC<LibraryProps> = ({ lang, onReplayRequest, currentCredits, setCredits }) => {
  const t = getTranslation(lang);
  const [dbVideos, setDbVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
  const [filter, setFilter] = useState<'all' | 'video' | 'image' | 'music'>('all');
  
  const filterOptions = [
    { id: 'all', label: 'Всі' },
    { id: 'video', label: 'Відео' },
    { id: 'image', label: 'Фото' },
    { id: 'music', label: 'Музика' },
  ];

  useEffect(() => {
      const fetchHistory = async () => {
        try {
          const tgId = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id;
          if (!tgId) return;
          
          const response = await fetch(`https://server.vidiai.top/api/get_history.php?telegram_id=${tgId}`);
          const data = await response.json();
          
          if (data.status === "success" && data.videos) {
            const formatted: VideoItem[] = data.videos.map((v: any) => {
              // Определяем тип контента для корректного отображения и удаления
              let detectedType: 'video' | 'image' | 'music' = 'video';
              if (v.title?.includes('(image)')) detectedType = 'image';
              if (v.title?.includes('(music)')) detectedType = 'music';
            
              return {
                id: v.task_id,
                url: v.video_url || '',
                alternative_url: v.alternative_url || '',
                prompt: v.prompt,
                title: v.title,
                status: v.status,
                sourceImage: v.source_image_url || '',
                aspectRatio: v.aspect_ratio || '9:16',
                contentType: v.type || detectedType,
                isLocal: false
              };
            });
  
            // Проверяем статус через API для тех, что еще в обработке
            for (const video of formatted) {
              if (video.status === 'processing') {
                const freshStatus = await getTaskStatus(video.id);
                if (freshStatus.status === 'succeeded' && freshStatus.video_url) {
                  video.status = 'succeeded';
                  video.url = freshStatus.video_url;
                  
                  // 1. Сохраняем вторую ссылку в локальном объекте (для мгновенного появления кнопки)
                  video.alternative_url = freshStatus.alternative_url; 

                  // 2. Отправляем в базу данных ВСЕ данные (добавляем 4-й аргумент)
                  await updateVideoInDb(
                    video.id, 
                    'succeeded', 
                    freshStatus.video_url, 
                    freshStatus.alternative_url 
                  );
                }
              }
            }
  
            setDbVideos(formatted);
          }
        } catch (error) {
          console.error("Ошибка загрузки истории:", error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchHistory();
      const interval = setInterval(fetchHistory, 5000);
      return () => clearInterval(interval);
    }, []);

    const handleDelete = async (id: any, contentType: 'video' | 'image' | 'audio' | 'music' = 'video') => {
      const tg = (window as any).Telegram?.WebApp;
      const itemInState = dbVideos.find(v => v.id === id);
    
      const confirmTextMap: Record<string, string> = {
        video: "Видалити це відео?",
        image: "Видалити це фото?",
        music: "Видалити цей трек?",
        audio: "Видалити цей трек?",
      };
      
      const finalConfirmText = confirmTextMap[contentType] || "Видалити цей файл?";
    
      // ИСПОЛЬЗУЕМ НАТИВНОЕ ОКНО TELEGRAM
      tg.showConfirm(finalConfirmText, async (isConfirmed: boolean) => {
        if (!isConfirmed) return; // Если пользователь нажал "Отмена"
    
        try {
          // Используем актуальный ID пользователя напрямую из Telegram
          const tgId = tg.initDataUnsafe?.user?.id;
          const apiUrl = import.meta.env.VITE_API_URL || 'https://server.vidiai.top';
    
          const response = await fetch(`${apiUrl}/api/delete_media.php`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              content_id: id, 
              content_type: contentType,
              telegram_id: tgId
            })
          });
    
          if (!response.ok) throw new Error("Сервер не відповідає");
    
          const data = await response.json();
          if (data.status === 'success') {
            setDbVideos(prev => prev.filter(v => v.id != id));
          } else {
            // Нативный алерт Telegram вместо обычного alert
            tg.showAlert(data.message || "Помилка видалення");
          }
        } catch (error) {
          console.error(`Помилка видалення:`, error);
          tg.showAlert("Не вдалося видалити файл. Перевірте з'єднання.");
        } finally {
          console.log("Процес видалення завершено"); 
        }
      });
    };
  
    const handleGenerateMore = (video: VideoItem) => {
      // Просто передаем всё видео целиком в App.tsx
      onReplayRequest?.(video);
    };

    const filteredVideos = dbVideos.filter(item => {
      if (filter === 'all') return true;
      const itemType = (item.contentType || (item as any).type || '').toLowerCase();
      return itemType === filter;
    });

    return (
    <div className="pb-24 pt-4 px-3 h-full overflow-y-auto no-scrollbar">
      <h2 className="text-xl font-bold dark:text-white mb-4 px-1">{t.nav_library}</h2>
      
      {/* Вставляем блок здесь, чтобы он был виден всегда */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-3">
        <div className="text-xl">⏳</div>
        <p className="text-sm text-blue-200/80 leading-relaxed font-medium">
          {t.lib_storage_info}
        </p>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : dbVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500 space-y-4 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center border border-gray-200 dark:border-white/5">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 opacity-50">
               <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h2.25m9 0H18A2.25 2.25 0 0120.25 6v3.776m-1.5 0V6a.75.75 0 00-.75-.75h-2.25m-9 0H6a.75.75 0 00-.75.75v3.776" />
             </svg>
          </div>
          <p className="text-sm">{t.lib_empty || "У вас ще немає створених відео"}</p>
        </div>
      ) : (
        <>
          {/* Панель фильтров */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setFilter(option.id as any)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap border ${
                  filter === option.id
                    ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        
          <div className="grid grid-cols-2 gap-3">
            {dbVideos.map((video) => {
              // 1. Проверяем, есть ли уже вариант v2 для этого конкретного видео
              // Мы смотрим, существует ли в массиве dbVideos объект с ID, равным ID текущего видео + "_v2"
              const hasV2 = dbVideos.some(v => v.id === `${video.id}_v2`);
          
              return (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  canDownload={true}
                  onDelete={handleDelete}
                  onClick={handleGenerateMore}
                  currentCredits={currentCredits}
                  setCredits={setCredits}
                  // 2. Передаем результат проверки в VideoCard
                  isV2Exists={hasV2} 
                  // 3. Передаем функцию добавления нового видео в стейт без перезагрузки страницы
                  onNewItemAdded={(newItem) => setDbVideos(prev => [newItem, ...prev])}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Library;
