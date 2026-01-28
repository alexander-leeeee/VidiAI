import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Showcase from './components/Showcase';
import Generator from './components/Generator';
import Library from './components/Library';
import Settings from './components/Settings';
import Subscription from './components/Subscription';
import CreditsModal from './components/CreditsModal';
import { CoinsIcon } from './components/Icons';
import { Tab, VideoItem, Language, Theme } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SHOWCASE);
  const [generatedVideos, setGeneratedVideos] = useState<VideoItem[]>([]);
  const [lang, setLang] = useState<Language>('ru');
  const [theme, setTheme] = useState<Theme>('dark');
  const [credits, setCredits] = useState<number>(120);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<string>('free');
  
  // State for passing template prompt to generator
  const [templatePrompt, setTemplatePrompt] = useState<string>('');

  // Handle Theme Change
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
      html.style.backgroundColor = '#050505';
    } else {
      html.classList.remove('dark');
      html.style.backgroundColor = '#f3f4f6';
    }
  }, [theme]);

  const handleVideoGenerated = (video: VideoItem) => {
    setGeneratedVideos(prev => [video, ...prev]);
    setActiveTab(Tab.LIBRARY);
    setCredits(prev => Math.max(0, prev - 10)); // Deduct credits example
  };

  const handleSubscribe = (planId: string) => {
    // In a real app, this would trigger a payment flow
    setCurrentPlanId(planId);
    if (planId !== 'free') {
        setCredits(prev => prev + 100); // Bonus credits for subscribing
    }
  };

  const handleBuyCredits = (amount: number) => {
    // In a real app, this would trigger a payment flow
    setCredits(prev => prev + amount);
  };

  const handleUseTemplate = (video: VideoItem) => {
    // Проверяем наличие systemPrompt, если его нет — берем обычный prompt
    // Это позволит работать и старым шаблонам, и новым длинным через обратные кавычки
    setTemplatePrompt(video.systemPrompt || video.prompt); 
    
    setActiveTab(Tab.CREATE); 
  };

  const handleTabChange = (tab: Tab) => {
    // Если пользователь нажимает на вкладку CREATE (центральный "+")
    if (tab === Tab.CREATE) {
      setTemplatePrompt(''); // Очищаем промпт, чтобы открылась "Свободная генерация"
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-background text-black dark:text-white font-sans selection:bg-primary/30 transition-colors duration-300">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-4 h-14 flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
            <h1 className="text-lg font-bold tracking-tight">VidiAI</h1>
        </div>
        
        {/* Credits Counter */}
        <button 
            onClick={() => setIsCreditsModalOpen(true)}
            className="flex items-center space-x-1.5 bg-gray-200/50 dark:bg-white/10 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/5 active:scale-95 transition-transform cursor-pointer hover:bg-gray-200 dark:hover:bg-white/20"
        >
             <CoinsIcon />
             <span className="text-xs font-bold font-mono">{credits}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="pt-14 w-full max-w-lg mx-auto min-h-screen relative">
        <div className={`transition-opacity duration-300 ${activeTab === Tab.SHOWCASE ? 'opacity-100' : 'hidden absolute inset-0'}`}>
             <Showcase lang={lang} onUseTemplate={handleUseTemplate} />
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === Tab.SUBSCRIPTION ? 'opacity-100' : 'hidden absolute inset-0'}`}>
             <Subscription 
                lang={lang} 
                currentPlanId={currentPlanId} 
                onSubscribe={handleSubscribe} 
                onBuyCredits={handleBuyCredits}
             />
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === Tab.CREATE ? 'opacity-100' : 'hidden absolute inset-0'}`}>
             <Generator 
                key={templatePrompt}
                onVideoGenerated={handleVideoGenerated} 
                lang={lang} 
                initialPrompt={templatePrompt}
                templateId={templates.find(t => t.prompt === templatePrompt)?.id || 'default'}
             />
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === Tab.LIBRARY ? 'opacity-100' : 'hidden absolute inset-0'}`}>
             <Library lang={lang} />
        </div>
        <div className={`transition-opacity duration-300 ${activeTab === Tab.SETTINGS ? 'opacity-100' : 'hidden absolute inset-0'}`}>
             <Settings lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} />
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} lang={lang} />

      {/* Credits Modal */}
      <CreditsModal 
        isOpen={isCreditsModalOpen} 
        onClose={() => setIsCreditsModalOpen(false)} 
        credits={credits}
        lang={lang}
        onGetMore={() => setActiveTab(Tab.SUBSCRIPTION)}
      />
      
    </div>
  );
};

export default App;
