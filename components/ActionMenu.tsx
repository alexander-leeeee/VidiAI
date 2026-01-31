import React from 'react';
import { PhotoIcon, SparklesIcon, MusicIcon } from './Icons'; // Убедись, что иконка музыки есть

interface ActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'video' | 'image' | 'music') => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-10">
      {/* Задний фон с размытием */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Контейнер меню */}
      <div className="relative w-full max-w-md bg-white dark:bg-surface rounded-3xl p-6 shadow-2xl animate-slide-up">
        <h3 className="text-center text-xl font-bold mb-6 dark:text-white">Що створимо?</h3>
        
        <div className="grid grid-cols-1 gap-4">
          {/* Кнопка ВИДЕО */}
          <button 
            onClick={() => { onSelect('video'); onClose(); }}
            className="flex items-center p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border border-primary/20 hover:scale-[1.02] transition-transform"
          >
            <div className="p-3 bg-primary rounded-xl text-white mr-4">
              <SparklesIcon />
            </div>
            <div className="text-left">
              <div className="font-bold dark:text-white text-lg">Відео</div>
              <div className="text-sm text-gray-400">Анімуй фото за допомогою ШІ</div>
            </div>
          </button>

          {/* Кнопка ИЗОБРАЖЕНИЕ */}
          <button 
            onClick={() => { onSelect('image'); onClose(); }}
            className="flex items-center p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl border border-blue-500/20 hover:scale-[1.02] transition-transform"
          >
            <div className="p-3 bg-blue-500 rounded-xl text-white mr-4">
              <PhotoIcon />
            </div>
            <div className="text-left">
              <div className="font-bold dark:text-white text-lg">Зображення</div>
              <div className="text-sm text-gray-400">Створи шедевр з опису</div>
            </div>
          </button>

          {/* Кнопка МУЗЫКА */}
          <button 
            onClick={() => { onSelect('music'); onClose(); }}
            className="flex items-center p-4 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-2xl border border-orange-500/20 hover:scale-[1.02] transition-transform"
          >
            <div className="p-3 bg-orange-500 rounded-xl text-white mr-4">
              {/* Если нет MusicIcon, используй любую ноту или Sparkles */}
              <MusicIcon /> 
            </div>
            <div className="text-left">
              <div className="font-bold dark:text-white text-lg">Музика</div>
              <div className="text-sm text-gray-400">Генеруй треки за стилем</div>
            </div>
          </button>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-6 py-3 text-gray-500 font-medium"
        >
          Скасувати
        </button>
      </div>
    </div>
  );
};

export default ActionMenu;
