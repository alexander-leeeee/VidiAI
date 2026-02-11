import React from 'react';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';
import { SparklesIcon, CoinsIcon } from './Icons';

interface SubscriptionProps {
  lang: Language;
  onBuyCredits: (amount: number) => void;
}

const Subscription: React.FC<SubscriptionProps> = ({ lang, onBuyCredits }) => {
  const t = getTranslation(lang);

  // Пакеты с описанием возможностей и расчетом экономии
  const creditPacks = [
    { 
      amount: 1000, 
      price: '340 ₴', 
      name: 'Тестовий пак', 
      desc: 'Для знайомства з VidiAI',
      details: ['~5-6 видео Kling/Sora', '~20 картинок Nano', '~30 пісень Suno'],
      savings: 0,
      recommended: false,
      color: 'bg-white dark:bg-gray-800' 
    },
    { 
      amount: 3000, 
      price: '900 ₴', 
      name: 'Творчий пак', 
      desc: 'Для активного контенту',
      details: ['~15-18 видео Kling/Sora', '~60 картинок Nano', '~90 пісень Suno'],
      savings: 12, // (340*3 - 900) / (340*3) ≈ 12%
      recommended: true, 
      color: 'bg-gradient-to-br from-primary to-secondary',
      textColor: 'text-white'
    },
    { 
      amount: 10000, 
      price: '2600 ₴', 
      name: 'Профі пак', 
      desc: 'Максимальні можливості',
      details: ['~50-60 видео Kling/Sora', '~200 картинок Nano', '~300 пісень Suno'],
      savings: 24, // (340*10 - 2600) / (340*10) ≈ 24%
      recommended: false,
      color: 'bg-gray-900 dark:bg-neutral-900',
      textColor: 'text-white'
    },
  ];

  return (
    <div className="pb-24 pt-6 px-4 h-full max-w-md mx-auto overflow-y-auto no-scrollbar">
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold dark:text-white text-gray-900 mb-2">Поповнити баланс</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm text-balance">Обирайте пакет кредитів для створення контенту за допомогою ШІ.</p>
      </div>

      <div className="space-y-4">
        {creditPacks.map((pack) => (
          <div 
            key={pack.amount}
            className={`relative rounded-2xl p-6 border shadow-lg transition-all duration-300 ${pack.color} ${pack.textColor || 'text-gray-900 dark:text-white'} ${pack.recommended ? 'ring-2 ring-accent scale-[1.02] border-transparent' : 'border-gray-200 dark:border-white/10'}`}
          >
            {/* Бейджи экономии и рекомендаций */}
            {pack.recommended && (
              <div className="absolute -top-3 left-6 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                ЕКОНОМІЯ {pack.savings}%
              </div>
            )}
            {pack.amount === 10000 && (
              <div className="absolute -top-3 left-6 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                ЕКОНОМІЯ {pack.savings}%
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${pack.recommended ? 'bg-white/20' : 'bg-yellow-100 dark:bg-yellow-500/10'}`}>
                  <CoinsIcon className={pack.recommended ? 'text-white' : 'text-yellow-600'} />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{pack.name}</h3>
                  <p className={`text-xs font-medium ${pack.recommended ? 'opacity-90' : 'text-primary dark:text-accent'}`}>
                    {pack.amount} кредитів
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black">{pack.price}</span>
              </div>
            </div>

            {/* Списки того, что входит в пакет */}
            <ul className="space-y-2 mb-6 border-t border-b py-4 border-black/5 dark:border-white/5">
              {pack.details.map((detail, idx) => (
                <li key={idx} className="flex items-center space-x-2 text-xs opacity-90">
                  <div className={`w-1 h-1 rounded-full ${pack.textColor ? 'bg-white' : 'bg-primary'}`} />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => onBuyCredits(pack.amount)}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-transform active:scale-95 shadow-md ${
                pack.recommended 
                  ? 'bg-white text-primary hover:bg-gray-50' 
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              Придбати
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
        <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed text-center">
          Кредити не згорають і залишаються на вашому балансі назавжди. 
          Використовуйте їх у будь-який час для створення відео, фото та музики.
        </p>
      </div>
    </div>
  );
};

export default Subscription;