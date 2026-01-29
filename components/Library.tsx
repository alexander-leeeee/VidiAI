import React, { useEffect, useState } from 'react';
import VideoCard from './VideoCard';
import { VideoItem, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { getTaskStatus, updateVideoInDb } from '../services/aiService';

interface LibraryProps {
  lang: Language;
}

const Library: React.FC<LibraryProps> = ({ lang }) => {
  const t = getTranslation(lang);
  const [dbVideos, setDbVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('https://server.vidiai.top/api/get_history.php');
        const data = await response.json();
        
        if (data.status === "success" && data.videos) {
          const formatted: VideoItem[] = data.videos.map((v: any) => ({
            id: v.task_id,
            url: v.video_url || '',
            prompt: v.prompt,
            title: v.title, // Теперь title подтянется из базы
            status: v.status,
            isLocal: false
          }));

          // Проверяем статус через API для тех видео, что еще в обработке
          for (const video of formatted) {
            if (video.status === 'processing') {
              const freshStatus = await getTaskStatus(video.id);
              if (freshStatus.status === 'succeeded' && freshStatus.video_url) {
                video.status = 'succeeded';
                video.url = freshStatus.video_url;
                // Сразу сохраняем готовую ссылку в твою БД
                await updateVideoInDb(video.id, 'succeeded', freshStatus.video_url);
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
    const interval = setInterval(fetchHistory, 5000); // Опрос каждые 5 сек
    return () => clearInterval(interval);
  }, []);

    const handleDelete = async (videoId: number) => {
      if (!window.confirm(t.lib_delete_confirm || "Видалити це відео?")) return;
    
      try {
        const response = await fetch('https://server.vidiai.top/delete_video.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            video_id: videoId, 
            telegram_id: tgUser?.id 
          })
        });
        
        const data = await response.json();
        if (data.status === 'success') {
          setDbVideos(prev => prev.filter(v => v.id !== videoId));
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error("Помилка видалення:", error);
      }
    };

    const handleGenerateMore = (video: VideoItem) => {
      // Перенаправляем пользователя на главную страницу с тем же промптом
      // Если у тебя используется навигация через state или router, укажи её здесь.
      // Самый простой вариант для Telegram Mini App — вызвать callback, если он есть, 
      // или просто вывести промпт в консоль для теста:
      console.log("Re-generating video with prompt:", video.prompt);
      
      // Если хочешь, чтобы при нажатии что-то происходило, например переход на главную:
      // window.location.href = '/'; 
    };

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
        <div className="grid grid-cols-2 gap-3">
          {dbVideos.map((video) => (
            <VideoCard 
              key={video.id} 
              video={video} 
              canDownload={true}
              onDelete={handleDelete}
              onClick={handleGenerateMore}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
