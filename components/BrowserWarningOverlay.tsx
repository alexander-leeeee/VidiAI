// components/BrowserWarningOverlay.tsx
import React from 'react';
import { Language } from '../types';

interface Props {
  lang: Language;
}

const BrowserWarningOverlay: React.FC<Props> = ({ lang }) => {
  const content = {
    ru: {
      title: "Это витрина проекта",
      desc: "Для генерации видео, получения бесплатных 40 🪙 и сохранения баланса, пожалуйста, перейдите в наш Telegram бот.",
      btn: "Открыть в Telegram"
    },
    uk: {
      title: "Це вітрина проєкту",
      desc: "Для генерації відео, отримання безкоштовних 40 🪙 та збереження балансу, будь ласка, перейдіть у наш Telegram бот.",
      btn: "Відкрити в Telegram"
    }
  };

  const t = lang === 'uk' ? content.uk : content.ru;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl p-8 text-center border border-white/10 shadow-2xl">
        {/* Вместо старого div с ракетой */}
        <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <img 
            src="/logo.webp" 
            alt="Logo" 
            className="w-full h-full object-contain animate-pulse-slow" 
          />
        </div>
        
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {t.title}
        </h2>
        
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          {t.desc}
        </p>

        <a 
          href="https://t.me/vidiai_bot" // ЗАМЕНИ НА СВОЙ ЮЗЕРНЕЙМ БОТА
          className="block w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-opacity"
        >
          {t.btn}
        </a>
      </div>
    </div>
  );
};

export default BrowserWarningOverlay;
