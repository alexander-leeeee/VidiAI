import React, { useState } from 'react';
import VideoCard from './VideoCard';
import { VideoItem, Language } from '../types';
import { getTranslation } from '../utils/translations';

export const MOCK_VIDEOS: VideoItem[] = [
  {
    id: '1',
    title: 'Випадковий танець',
    hasMusic: true,
    url: 'https://server.vidiai.top/uploads/videos/dancing-test.mp4',
    thumbnail: 'https://server.vidiai.top/uploads/thumbnails/dancing-test.webp',
    prompt: 'Animate the subject in the photo into an energetic dance performance. Keep the original location, background, lighting, and camera position exactly the same as in the photo. Only the main subject moves and dances. The subject performs a dynamic, high-energy dance with confident, expressive movements, similar to a professional dancer. Strong rhythm, sharp and powerful motions, body control, turns, jumps, and footwork. Realistic motion, smooth animation, natural physics. No changes to clothing, body shape, or environment. The dance feels fun, impressive, and lively. Family-friendly, safe content.',
    category: 'dancing'
  },
  {
    id: '2',
    title: 'Трендовий танець #1',
    pricePerSecond: 10,
    duration: 14,
    hasMusic: true,
    url: 'https://server.vidiai.top/uploads/videos/dancing-trend-1.mp4',
    thumbnail: 'https://server.vidiai.top/uploads/thumbnails/dancing-trend-1.webp',
    prompt: 'The subject from the image is dancing.',
    category: 'dancing'
  },
  {
    id: '3',
    title: 'Трендовий танець #2',
    pricePerSecond: 10,
    duration: 8,
    hasMusic: true,
    url: 'https://server.vidiai.top/uploads/videos/dancing-trend-2.mp4',
    thumbnail: 'https://server.vidiai.top/uploads/thumbnails/dancing-trend-2.webp',
    prompt: 'The subject from the image is dancing.',
    category: 'dancing'
  },
  {
    id: '4',
    title: 'Трендовий танець #3',
    pricePerSecond: 10,
    duration: 8,
    hasMusic: true,
    url: 'https://server.vidiai.top/uploads/videos/dancing-trend-3.mp4',
    thumbnail: 'https://server.vidiai.top/uploads/thumbnails/dancing-trend-3.webp',
    prompt: 'The subject from the image is dancing.',
    category: 'dancing'
  },
  {
    id: '5',
    title: 'Трендовий танець #4',
    pricePerSecond: 10,
    duration: 15,
    hasMusic: true,
    url: 'https://server.vidiai.top/uploads/videos/dancing-trend-4.mp4',
    thumbnail: 'https://server.vidiai.top/uploads/thumbnails/dancing-trend-4.webp',
    prompt: 'The subject from the image is dancing.',
    category: 'dancing'
  },
  {
    id: '6',
    url: 'https://cdn.coverr.co/videos/coverr-neon-signs-in-tokyo-4437/1080p.mp4',
    prompt: 'Ночной город, неоновые вывески, дождь, 8k',
    category: 'laugh'
  }
];

interface ShowcaseProps {
  lang: Language;
  onUseTemplate: (video: VideoItem) => void;
}

const Showcase: React.FC<ShowcaseProps> = ({ lang, onUseTemplate }) => {
  const t = getTranslation(lang);
  const [activeCategory, setActiveCategory] = useState('all');

  // Categories list
  const categories = [
    { id: 'all', label: t.cat_all },
    { id: 'new_year', label: t.cat_new_year },
    { id: 'laugh', label: t.cat_laugh },
    { id: 'dancing', label: t.cat_dancing },
    { id: 'chic', label: t.cat_chic },
    { id: 'fun', label: t.cat_fun },
    { id: 'flow', label: t.cat_flow },
  ];

  const filteredVideos = activeCategory === 'all' 
    ? MOCK_VIDEOS 
    : MOCK_VIDEOS.filter(v => v.category === activeCategory);

  return (
    <div className="pb-24 pt-4">
      {/* Categories Scroll */}
      <div className="sticky top-14 z-30 bg-gray-100/90 dark:bg-background/90 backdrop-blur-sm py-2 mb-2">
        <div className="flex overflow-x-auto no-scrollbar px-3 space-x-2 pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-sm ${
                activeCategory === cat.id
                  ? 'bg-white dark:bg-white text-black'
                  : 'bg-white dark:bg-surface border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3">
        {/* Grid Layout */}
        <div className="grid grid-cols-2 gap-3">
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} onClick={onUseTemplate} />
          ))}
          {/* Duplicate to fill space if filtered result is small */}
           {filteredVideos.length > 0 && filteredVideos.length < 4 && filteredVideos.map((video) => (
            <VideoCard key={`${video.id}-dup`} video={{...video, id: `${video.id}-dup`}} onClick={onUseTemplate} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Showcase;
