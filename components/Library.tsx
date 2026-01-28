import React, { useEffect, useState } from 'react';
import VideoCard from './VideoCard';
import { VideoItem, Language } from '../types';
import { getTranslation } from '../utils/translations';
// Импортируем функцию из твоего нового сервиса
import { getUserHistory } from '../services/aiService';

interface LibraryProps {
  lang: Language;
}

const Library: React.FC<LibraryProps> = ({ lang }) => {
  const t = getTranslation(lang);
  const [dbVideos, setDbVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

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
            status: v.status,
            isLocal: false
          }));
          setDbVideos(formatted);
        }
      } catch (error) {
        console.error("Ошибка загрузки истории:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    // Опрашиваем сервер каждые 5 секунд, пока есть видео в статусе 'processing'
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pb-24 pt-4 px-3 h-full overflow-y-auto no-scrollbar">
      <h2 className="text-xl font-bold dark:text-white mb-4 px-1">{t.nav_library}</h2>
      
      {loading ? (
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : dbVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500 space-y-4 text-center px-6">
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
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
