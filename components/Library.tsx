import React, { useEffect, useState } from 'react';
import VideoCard from './VideoCard';
import { VideoItem, Language } from '../types';
import { getTranslation } from '../utils/translations';

interface LibraryProps {
  lang: Language;
}

const Library: React.FC<LibraryProps> = ({ lang }) => {
  const t = getTranslation(lang);
  // Создаем внутреннее состояние для видео, загруженных из БД
  const [dbVideos, setDbVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('https://server.vidiai.top/api/get_history.php');
        const data = await response.json();
        
        // Преобразуем данные из БД под формат VideoItem
        const formatted: VideoItem[] = data.map((v: any) => ({
          id: v.task_id,
          url: v.video_url || '', // Если видео еще нет, будет пустая строка
          prompt: v.prompt,
          status: v.status, // processing, succeeded, failed
          isLocal: false
        }));

        setDbVideos(formatted);
      } catch (error) {
        console.error("Ошибка загрузки истории:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="pb-24 pt-4 px-3 h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent px-1">
        {t.lib_title}
      </h2>
      
      {loading ? (
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : dbVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500 space-y-4">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center border border-gray-200 dark:border-white/5">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 opacity-50">
               <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
             </svg>
          </div>
          <div className="text-center">
            <p className="font-medium">{t.lib_empty}</p>
            <p className="text-xs opacity-60">{t.lib_empty_sub}</p>
          </div>
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
