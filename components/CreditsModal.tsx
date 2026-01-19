import React from 'react';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';
import { CoinsIcon, SparklesIcon } from './Icons';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credits: number;
  lang: Language;
  onGetMore: () => void;
}

const CreditsModal: React.FC<CreditsModalProps> = ({ isOpen, onClose, credits, lang, onGetMore }) => {
  if (!isOpen) return null;
  const t = getTranslation(lang);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white dark:bg-surface border border-gray-200 dark:border-white/10 w-full max-w-xs rounded-3xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 relative overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative background blur */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center text-center mb-6 relative">
          <div className="w-16 h-16 rounded-full bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center mb-4 ring-1 ring-yellow-500/20">
             <CoinsIcon className="w-8 h-8 text-yellow-500" />
          </div>
          <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-1">{t.credits_title}</h3>
          <p className="text-sm text-gray-500">{t.credits_balance}: <span className="font-bold text-gray-900 dark:text-white">{credits}</span></p>
        </div>

        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 mb-6 relative">
             <div className="flex justify-between items-center mb-1">
                 <span className="text-sm text-gray-500 dark:text-gray-400">{t.credits_cost_title}</span>
             </div>
             <div className="flex items-center space-x-2 text-gray-900 dark:text-white font-medium">
                 <SparklesIcon />
                 <span>{t.credits_cost_value}</span>
             </div>
        </div>

        <button 
            onClick={() => {
                onGetMore();
                onClose();
            }}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary/30 transition-all active:scale-95"
        >
            {t.credits_get_more}
        </button>
      </div>
    </div>
  );
};

export default CreditsModal;