import React from 'react';
import { Language } from '../types';

interface Props {
  lang: Language;
  welcomeAmount: number;
}

const BrowserWarningOverlay: React.FC<Props> = ({ lang, welcomeAmount }) => {
  // Простая логика перевода
  const isUk = lang === 'uk';

  const t = {
    title: "VidiAI",
    desc: isUk 
      ? `Для використання сервісу переходь в Telegram Bot і отримуй ${welcomeAmount} безкоштовних кредитів.` 
      : `Для использования сервиса переходи в Telegram Bot и бесплатно получай ${welcomeAmount} бесплатных кредитов.`,
    btn: isUk ? "Відкрити в Telegram" : "Открыть в Telegram"
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl p-8 text-center border border-white/10 shadow-2xl">
        
        {/* Логотип */}
        <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <img src="/logo.webp" alt="Logo" className="w-full h-full object-contain animate-pulse-slow" />
        </div>
        
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {t.title}
        </h2>
        
        {/* Чистый текст без иконок */}
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed text-lg">
          {t.desc}
        </p>

        <a 
          href="https://t.me/vidiai_bot" 
          className="block w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-bold text-xl hover:opacity-90 transition-all active:scale-95 text-center shadow-lg shadow-primary/20"
        >
          {t.btn}
        </a>
      </div>
    </div>
  );
};

// Тот самый экспорт, который просит Vercel
export default BrowserWarningOverlay;
