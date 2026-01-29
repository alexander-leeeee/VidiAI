import React from 'react';
import { CoinsIcon } from './Icons';

interface LowBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
}

const LowBalanceModal: React.FC<LowBalanceModalProps> = ({ isOpen, onClose, balance }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1a1a1a] w-full max-w-[320px] rounded-[32px] p-8 flex flex-col items-center text-center shadow-2xl border border-white/5">
        
        <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
          <div className="w-14 h-14 bg-yellow-500/20 rounded-full flex items-center justify-center border border-yellow-500/30">
            <CoinsIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">
          У вас недостатньо кредитів
        </h3>
        
        <p className="text-gray-400 text-sm mb-8">
          Ваш баланс: <span className="text-white font-bold">{balance}</span>
        </p>

        <div className="flex flex-col w-full gap-3">
          <button 
            onClick={() => window.location.hash = '/subscriptions'} 
            className="w-full py-4 bg-primary rounded-2xl font-bold text-white hover:opacity-90 active:scale-95 transition-all"
          >
            Отримати кредити
          </button>
          
          <button 
            onClick={onClose}
            className="w-full py-2 text-gray-500 text-sm font-medium hover:text-gray-300 transition-colors"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};

export default LowBalanceModal;
