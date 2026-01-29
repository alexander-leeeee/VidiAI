import React from 'react';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';
import { CoinsIcon } from './Icons';

interface LowBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  lang: Language;
}

const LowBalanceModal: React.FC<LowBalanceModalProps> = ({ isOpen, onClose, balance, lang }) => {
  if (!isOpen) return null;
  const t = getTranslation(lang);

  return (
    // Закрытие при клике на затененный фон
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#1a1a1a] w-full max-w-[320px] rounded-[32px] p-8 flex flex-col items-center text-center shadow-2xl border border-white/5 relative overflow-hidden"
        // Останавливаем закрытие при клике внутри окна
        onClick={(e) => e.stopPropagation()}
      >
        {/* Декоративные свечения как в CreditsModal */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-yellow-500/20">
          <div className="w-14 h-14 bg-yellow-500/20 rounded-full flex items-center justify-center border border-yellow-500/30">
            <CoinsIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-2">
          У вас недостатньо кредитів
        </h3>
        
        <p className="text-gray-400 text-sm mb-8">
          {t.credits_balance}: <span className="text-white font-bold">{balance}</span>
        </p>

        <div className="flex flex-col w-full gap-3">
          <button 
            onClick={() => {
                onClose();
                // ГАРАНТИРОВАННЫЙ ПЕРЕХОД
                window.location.hash = '#subscriptions'; 
            }}
            className="w-full py-4 bg-primary rounded-2xl font-bold text-white shadow-lg shadow-primary/30 hover:opacity-90 active:scale-95 transition-all"
          >
            {t.credits_get_more}
          </button>
          
          <button 
            onClick={onClose}
            className="w-full py-2 text-gray-500 text-sm font-medium hover:text-gray-300 transition-colors"
          >
            {/* Можно добавить перевод для "Закрыть" или оставить так */}
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};

export default LowBalanceModal;
