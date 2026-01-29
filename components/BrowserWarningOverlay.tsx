import React from 'react';
import { Language } from '../types';
import { CoinsIcon } from './Icons'; // Импортируем твою новую иконку

interface Props {
  lang: Language;
  welcomeAmount: number;
}

const BrowserWarningOverlay: React.FC<Props> = ({ lang, welcomeAmount }) => {
  const isUk = lang === 'uk';

  const t = {
    title: "VidiAI",
    // Разделяем текст на "до" и "после" иконки
    descStart: isUk 
      ? "Для використання сервісу переходь в Telegram Bot і отримуй" 
      : "Для использования сервиса переходи в Telegram Bot и получай",
    descEnd: isUk 
      ? "безкоштовних кредитів." 
      : "бесплатных кредитов.",
    btn: isUk ? "Відкрити в Telegram" : "Открыть в Telegram"
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl p-8 text-center border border-white/10 shadow-2xl">
        
        {/* Логотип VidiAI */}
        <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <img src="/logo.webp" alt="Logo" className="w-full h-full object-contain animate-pulse-slow" />
        </div>
        
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {t.title}
        </h2>
        
        {/* Контейнер для текста с иконкой */}
        <div className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed text-lg flex flex-wrap justify-center items-center gap-1">
          <span>{t.descStart}</span>
          <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
            {welcomeAmount} 
            <CoinsIcon className="w-5 h-5 text-yellow-500 inline-block" /> 
          </span>
          <span>{t.descEnd}</span>
        </div>

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
