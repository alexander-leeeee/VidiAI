// Subscription.tsx
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

  // Наши рассчитанные пакеты
  const creditPacks = [
    { 
      amount: 1000, 
      price: '340 ₴', 
      name: 'Тестовий пак', 
      desc: 'Для перших кроків',
      recommended: false,
      color: 'bg-white dark:bg-gray-800' 
    },
    { 
      amount: 3000, 
      price: '900 ₴', 
      name: 'Творчий пак', 
      desc: 'Популярний вибір',
      recommended: true, 
      color: 'bg-gradient-to-br from-primary to-secondary',
      textColor: 'text-white'
    },
    { 
      amount: 10000, 
      price: '2600 ₴', 
      name: 'Профі пак', 
      desc: 'Найкраща ціна за кредит',
      recommended: false,
      color: 'bg-gray-900 dark:bg-neutral-900',
      textColor: 'text-white'
    },
  ];

  return (
    <div className="pb-24 pt-6 px-4 h-full max-w-md mx-auto overflow-y-auto no-scrollbar">
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold dark:text-white text-gray-900 mb-2">Поповнити баланс</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Обирайте пакет кредитів. Жодних підписок — платіть тільки за те, що створюєте.</p>
      </div>

      <div className="space-y-4">
        {creditPacks.map((pack) => (
          <div 
            key={pack.amount}
            className={`relative rounded-2xl p-6 border shadow-lg transition-all duration-300 ${pack.color} ${pack.textColor || 'text-gray-900 dark:text-white'} ${pack.recommended ? 'ring-2 ring-accent scale-[1.02] border-transparent' : 'border-gray-200 dark:border-white/10'}`}
          >
            {pack.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                ВИГІДНО
              </div>
            )} {/* <-- Вот здесь должна быть скобка и закрытие блока */}

            {pack.amount === 10000 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                НАЙКРАЩА ЦІНА
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${pack.recommended ? 'bg-white/20' : 'bg-yellow-100 dark:bg-yellow-500/10'}`}>
                  <CoinsIcon className={pack.recommended ? 'text-white' : 'text-yellow-600'} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{pack.name}</h3>
                  <p className={`text-xs ${pack.recommended ? 'opacity-80' : 'text-gray-500'}`}>{pack.amount} кредитів</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black">{pack.price}</span>
              </div>
            </div>

            <p className={`text-sm mb-6 ${pack.recommended ? 'opacity-90' : 'text-gray-500 dark:text-gray-400'}`}>
              {pack.desc}
            </p>

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

      {/* Info Section */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed text-center">
          Кредити не згорають і залишаються на вашому балансі назавжди. 
          1 кредит VidiAI = 1 кредит генерації в системі.
        </p>
      </div>
    </div>
  );
};

export default Subscription;