import React from 'react';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';
import { SparklesIcon, CoinsIcon } from './Icons';

interface SubscriptionProps {
  lang: Language;
  currentPlanId: string;
  onSubscribe: (planId: string) => void;
  onBuyCredits: (amount: number) => void;
}

const Subscription: React.FC<SubscriptionProps> = ({ lang, currentPlanId, onSubscribe, onBuyCredits }) => {
  const t = getTranslation(lang);
  const isPaidPlan = currentPlanId === 'pro' || currentPlanId === 'ultra';

  const plans = [
    {
      id: 'free',
      name: t.sub_plan_free,
      price: '$0',
      features: [t.sub_feat_speed, 'SD Quality'],
      color: 'bg-white dark:bg-gray-800',
      textColor: 'text-gray-900 dark:text-white',
      border: 'border-gray-200 dark:border-transparent'
    },
    {
      id: 'pro',
      name: t.sub_plan_pro,
      price: '$19',
      period: `/${t.sub_month}`,
      features: [t.sub_feat_speed, t.sub_feat_quality, t.sub_feat_watermark],
      recommended: true,
      color: 'bg-gradient-to-br from-primary to-secondary',
      textColor: 'text-white',
      border: 'border-transparent'
    },
    {
      id: 'ultra',
      name: t.sub_plan_ultra,
      price: '$49',
      period: `/${t.sub_month}`,
      features: [t.sub_feat_speed, '4K Quality', t.sub_feat_watermark, t.sub_feat_commercial],
      color: 'bg-gray-900 dark:bg-neutral-900',
      textColor: 'text-white',
      border: 'border-gray-800 dark:border-white/10'
    }
  ];

  const creditPacks = [
    { amount: 100, price: '$4.99', name: t.sub_credits_pack_small },
    { amount: 500, price: '$19.99', name: t.sub_credits_pack_medium },
    { amount: 1000, price: '$34.99', name: t.sub_credits_pack_large },
  ];

  return (
    <div className="pb-24 pt-6 px-4 h-full max-w-md mx-auto overflow-y-auto no-scrollbar">
      
      {/* Plans Section */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold dark:text-white text-gray-900 mb-2">{t.sub_title}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t.sub_desc}</p>
      </div>

      <div className="space-y-4 mb-12">
        {plans.map((plan) => {
          const isActive = currentPlanId === plan.id;
          return (
            <div 
              key={plan.id}
              className={`relative rounded-2xl p-6 ${plan.color} ${plan.textColor} border ${plan.border} shadow-lg transition-all duration-300 ${isActive ? 'ring-2 ring-accent scale-[1.02]' : ''}`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-primary text-xs font-bold px-3 py-1 rounded-full shadow-md ring-1 ring-black/5">
                  BEST VALUE
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-sm opacity-80 ml-1">{plan.period}</span>}
                  </div>
                </div>
                {plan.id === 'pro' && (
                  <div className="p-2 bg-white/20 rounded-full">
                    <SparklesIcon />
                  </div>
                )}
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feat, i) => (
                  <li key={i} className="text-sm flex items-center space-x-2 opacity-90">
                    <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onSubscribe(plan.id)}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-transform active:scale-95 ${
                  isActive
                    ? 'bg-white/20 dark:bg-black/20 text-current cursor-default' 
                    : plan.id === 'ultra' || plan.id === 'free'
                      ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90' 
                      : 'bg-white text-primary hover:bg-gray-50'
                }`}
              >
                {isActive ? t.sub_btn_current : t.sub_btn_upgrade}
              </button>
            </div>
          );
        })}
      </div>

      {/* Credit Packs Section */}
      <div className="mb-4">
        <div className="text-center mb-6">
           <div className="flex items-center justify-center space-x-2 mb-2">
               <CoinsIcon className="w-6 h-6 text-yellow-500" />
               <h3 className="text-xl font-bold dark:text-white text-gray-900">{t.sub_credits_title}</h3>
           </div>
           <p className="text-gray-500 dark:text-gray-400 text-sm">{t.sub_credits_desc}</p>
        </div>

        <div className="relative">
             {/* Lock Overlay for Free Plan */}
             {!isPaidPlan && (
                 <div className="absolute inset-0 z-10 bg-white/60 dark:bg-black/60 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center text-center p-4 border border-gray-200 dark:border-white/10">
                     <div className="bg-gray-900 dark:bg-white text-white dark:text-black p-3 rounded-full mb-3 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                        </svg>
                     </div>
                     <p className="font-bold text-gray-900 dark:text-white">{t.sub_credits_locked}</p>
                 </div>
             )}

             <div className="grid grid-cols-1 gap-3">
                 {creditPacks.map((pack) => (
                     <div key={pack.amount} className="flex items-center justify-between p-4 bg-white dark:bg-surface border border-gray-200 dark:border-white/10 rounded-xl shadow-sm">
                         <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                                 <CoinsIcon />
                             </div>
                             <div>
                                 <p className="font-bold text-gray-900 dark:text-white">{pack.amount} Credits</p>
                                 <p className="text-xs text-gray-500">{pack.name}</p>
                             </div>
                         </div>
                         <button 
                             onClick={() => isPaidPlan && onBuyCredits(pack.amount)}
                             disabled={!isPaidPlan}
                             className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 active:scale-95 transition-transform"
                         >
                             {pack.price}
                         </button>
                     </div>
                 ))}
             </div>
        </div>
      </div>

    </div>
  );
};

export default Subscription;