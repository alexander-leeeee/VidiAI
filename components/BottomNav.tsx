import React from 'react';
import { Tab, Language } from '../types';
import { HomeIcon, PlusIcon, FolderIcon, SettingsIcon, CircleDollarSign } from './Icons';
import { getTranslation } from '../utils/translations';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  lang: Language;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, lang }) => {
  const t = getTranslation(lang);

  const navItemClass = (isActive: boolean) => 
    `flex flex-col items-center justify-center w-14 space-y-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[88px] z-50 px-4">
        {/* Blur backdrop container */}
        <div className="absolute inset-0 bg-white/90 dark:bg-background/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/5" />
        
        <div className="relative flex justify-between items-center h-16 pt-2 max-w-lg mx-auto">
            
            {/* Home */}
            <button onClick={() => onTabChange(Tab.SHOWCASE)} className={navItemClass(activeTab === Tab.SHOWCASE)}>
                <HomeIcon active={activeTab === Tab.SHOWCASE} />
                <span className="text-[10px] font-medium">{t.nav_home}</span>
            </button>

            {/* Credits */}
            <button 
                onClick={() => onTabChange(Tab.SUBSCRIPTION)}
                className={`flex flex-col items-center gap-1 transition-colors ${
                    activeTab === Tab.SUBSCRIPTION ? 'text-primary' : 'text-gray-500'
                }`}
            >
                <CircleDollarSign className="w-6 h-6" /> {/* Твоя новая иконка */}
                <span className="text-[10px]">{t.nav_subscription}</span>
            </button>

            {/* Create (Center) */}
            <button onClick={() => onTabChange(Tab.CREATE)} className="relative -top-5">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-lg ${
                    activeTab === Tab.CREATE 
                    ? 'bg-gradient-to-tr from-primary to-accent shadow-primary/50 text-white' 
                    : 'bg-white dark:bg-surface border border-gray-100 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-neutral-800'
                }`}>
                    <PlusIcon active={true} />
                </div>
            </button>

            {/* Library */}
            <button onClick={() => onTabChange(Tab.LIBRARY)} className={navItemClass(activeTab === Tab.LIBRARY)}>
                <FolderIcon active={activeTab === Tab.LIBRARY} />
                <span className="text-[10px] font-medium">{t.nav_library}</span>
            </button>

            {/* Settings */}
            <button onClick={() => onTabChange(Tab.SETTINGS)} className={navItemClass(activeTab === Tab.SETTINGS)}>
                <SettingsIcon active={activeTab === Tab.SETTINGS} />
                <span className="text-[10px] font-medium">{t.nav_settings}</span>
            </button>

        </div>
    </div>
  );
};

export default BottomNav;