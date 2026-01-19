import React from 'react';
import { Language, Theme } from '../types';
import { getTranslation } from '../utils/translations';

interface SettingsProps {
  lang: Language;
  setLang: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const Settings: React.FC<SettingsProps> = ({ lang, setLang, theme, setTheme }) => {
  const t = getTranslation(lang);

  return (
    <div className="pb-24 pt-6 px-4 h-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-8 dark:text-white text-gray-900">{t.set_title}</h2>
      
      {/* Language Section */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-500 mb-3 ml-1 uppercase tracking-wider">{t.set_lang}</h3>
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-sm">
          {[
            { code: 'ru', label: 'Русский', flag: '🇷🇺' },
            { code: 'en', label: 'English', flag: '🇺🇸' },
            { code: 'uk', label: 'Українська', flag: '🇺🇦' }
          ].map((item, index) => (
            <button
              key={item.code}
              onClick={() => setLang(item.code as Language)}
              className={`flex items-center justify-between p-4 transition-colors ${
                index !== 2 ? 'border-b border-gray-100 dark:border-white/5' : ''
              } ${lang === item.code ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{item.flag}</span>
                <span className={`font-medium ${lang === item.code ? 'text-primary' : 'text-gray-900 dark:text-gray-200'}`}>
                  {item.label}
                </span>
              </div>
              {lang === item.code && (
                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(109,40,217,0.8)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3 ml-1 uppercase tracking-wider">{t.set_theme}</h3>
        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-white/10 rounded-2xl p-2 shadow-sm">
          <div className="flex bg-gray-100 dark:bg-black/40 rounded-xl p-1 relative">
             <button
              onClick={() => setTheme('dark')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-neutral-800 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {t.set_theme_dark}
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                theme === 'light'
                  ? 'bg-white text-gray-900 shadow-md ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {t.set_theme_light}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;