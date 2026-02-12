// Pricing.tsx
import React from 'react';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';
import { CoinsIcon } from './Icons';

interface PricingProps {
  lang: Language;
  onBuyCredits: (amount: number) => void;
  userCredits: number; // Добавляем пропс баланса
}

const Pricing: React.FC<PricingProps> = ({ lang, onBuyCredits, userCredits }) => {
  const t = getTranslation(lang);

  const creditPacks = [
    { 
      amount: 1000, 
      price: '340 ₴', 
      name: 'Стартовий пак', 
      desc: 'Для знайомства з VidiAI',
      details: ['до 11 видео', 'до 120 изображений', 'до 115 пісень'],
      savings: 0,
      recommended: false,
      color: 'bg-white dark:bg-gray-800' 
    },
    { 
      amount: 3000, 
      price: '900 ₴', 
      name: 'Творчий пак', 
      desc: 'Для активного контенту',
      details: ['до 33 видео', 'до 360 изображений', 'до 345 пісень'],
      savings: 12, //
      recommended: true, 
      color: 'bg-gradient-to-br from-primary to-secondary',
      textColor: 'text-white'
    },
    { 
      amount: 10000, 
      price: '2600 ₴', 
      name: 'Профі пак', 
      desc: 'Максимальні можливості',
      details: ['до 110 видео', 'до 1200 изображений', 'до 1150 пісень'],
      savings: 24, //
      recommended: false,
      color: 'bg-gray-900 dark:bg-neutral-900',
      textColor: 'text-white'
    },
  ];

  return (
    <div className="pb-24 pt-6 px-4 h-full max-w-md mx-auto overflow-y-auto no-scrollbar">
      
      {/* Блок текущего баланса */}
      <div className="mb-8 p-4 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-between border border-gray-200 dark:border-white/10">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Ваш баланс</p>
          <p className="text-2xl font-black dark:text-white text-gray-900">{userCredits} <span className="text-sm font-normal opacity-60">кредитів</span></p>
        </div>
        <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center text-yellow-500">
           <CoinsIcon className="w-8 h-8" />
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold dark:text-white text-gray-900 mb-2">Придбати кредити</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Оберіть пакет для створення контенту.</p>
      </div>

      <div className="space-y-4">
        {creditPacks.map((pack) => (
          <div 
            key={pack.amount}
            className={`relative rounded-3xl p-6 border shadow-lg transition-all duration-300 ${pack.color} ${pack.textColor || 'text-gray-900 dark:text-white'} ${pack.recommended ? 'ring-2 ring-accent scale-[1.02] border-transparent' : 'border-gray-200 dark:border-white/10'}`}
          >
            {pack.savings > 0 && (
              <div className={`absolute -top-3 left-6 ${pack.amount === 10000 ? 'bg-yellow-500 text-black' : 'bg-accent text-white'} text-[10px] font-bold px-3 py-1 rounded-full shadow-md`}>
                ЕКОНОМІЯ {pack.savings}%
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg leading-tight">{pack.name}</h3>
                <p className={`text-xs font-medium ${pack.recommended ? 'opacity-90' : 'text-primary'}`}>
                  {pack.amount} кредитів
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black">{pack.price}</span>
              </div>
            </div>

            <ul className="space-y-2 mb-6 border-t border-b py-4 border-black/5 dark:border-white/5">
              {pack.details.map((detail, idx) => (
                <li key={idx} className="flex items-center space-x-2 text-xs opacity-90 font-medium">
                  <div className={`w-1 h-1 rounded-full ${pack.textColor ? 'bg-white' : 'bg-primary'}`} />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => onBuyCredits(pack.amount)}
              className={`w-full py-4 rounded-2xl font-bold text-sm transition-transform active:scale-95 shadow-md ${
                pack.recommended 
                  ? 'bg-white text-primary hover:bg-gray-50' 
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              Обрати пакет
            </button>
          </div>
        ))}
      </div>

      <p className="mt-8 text-[11px] text-gray-400 leading-relaxed text-center">
        Кредити залишаються на вашому балансі назавжди.
      </p>
    </div>
  );
};

export default Pricing;