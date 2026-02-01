import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, PhotoIcon, TrashIcon, CoinsIcon, MusicIcon } from './Icons';
import { VideoItem, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { generateByTemplateId, saveVideoToHistory, getCostByTemplateId } from '../services/aiService';
import LowBalanceModal from './LowBalanceModal';

export type GeneratorMode = 'video' | 'image' | 'music';

interface GeneratorProps {
  onVideoGenerated: (video: VideoItem) => void;
  lang: Language;
  mode?: GeneratorMode;
  initialPrompt?: string;
  initialImage?: string | null;
  initialAspectRatio?: '16:9' | '9:16' | '1:1';
  templateId?: string;
  currentCredits: number;
  onGetMore: () => void;
}

interface ImageFile {
  preview: string;
  data: string; // base64
  mimeType: string;
}

const Generator: React.FC<GeneratorProps & { setCredits?: React.Dispatch<React.SetStateAction<number>> }> = 
({ onVideoGenerated, lang, mode = 'video', initialPrompt, initialImage, initialAspectRatio, templateId, setCredits, currentCredits, onGetMore }) => {
  const t = getTranslation(lang);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('9:16');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLowBalanceOpen, setIsLowBalanceOpen] = useState(false);
  const isWorking = useRef(false);
  const [soraDuration, setSoraDuration] = useState<'10' | '15'>('10');
  const [soraLayout, setSoraLayout] = useState<'portrait' | 'landscape'>('portrait');
  const [videoMethod, setVideoMethod] = useState<'text' | 'image'>('image');

  // 1. Сначала определяем, какой ID использовать
  const getDynamicId = () => {
    // 1. Если это конкретный шаблон из Showcase (кроме дефолта), используем его
    if (templateId && templateId !== 'default') return templateId;
    
    // 2. Если режим содержит слово 'video' (исправляет проблему с manual_video)
    if (mode === 'video' || String(mode).includes('video')) {
      return `sora_${soraDuration}`;
    }
    
    // 3. Для остальных режимов
    return `manual_${mode}`;
  };

  const effectiveTemplateId = getDynamicId();
  const currentCost = getCostByTemplateId(effectiveTemplateId);

  // Оставляем лог, чтобы убедиться, что manual_video побежден
  console.log("FINAL CHECK -> Mode:", mode, "ID:", effectiveTemplateId, "Cost:", currentCost);

  useEffect(() => {
    setIsGenerating(false);
    setStatusMessage("");
    if (!initialPrompt) setPrompt("");
  }, [initialPrompt, initialImage, templateId, mode]);
    
  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (initialImage) {
      setSelectedImage({
        preview: initialImage,
        data: '',
        mimeType: ''
      });
    } else {
      setSelectedImage(null);
    }
  }, [initialImage]);

  useEffect(() => {
    if (initialAspectRatio) {
      setAspectRatio(initialAspectRatio);
    }
  }, [initialAspectRatio]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const matches = base64String.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
            setSelectedImage({
                preview: base64String,
                mimeType: matches[1],
                data: matches[2]
            });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    setStatusMessage(""); 
    if (isWorking.current || isGenerating) return;

    // Проверка: музыка не требует фото, фото/видео требуют
    const isTextMode = videoMethod === 'text' || mode === 'music';
    const hasPrompt = prompt.trim().length > 0;
    const hasImage = !!selectedImage;

    if (!hasPrompt || (!isTextMode && !hasImage)) {
        alert(isTextMode ? "Будь ласка, введіть опис" : t.gen_label_image);
        return;
    }
    
    const needsImage = mode !== 'music';
    if (!prompt.trim() || (needsImage && !selectedImage)) {
        alert(mode === 'music' ? "Опишіть музику" : t.gen_label_image); 
        return;
    }

    if (currentCredits < currentCost) {
        setIsLowBalanceOpen(true);
        return;
    }

    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    isWorking.current = true; 
    setIsGenerating(true);
    setStatusMessage(mode === 'music' ? "Налаштовуємо звук..." : "Завантаження фото...");

    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://server.vidiai.top';
        let imageUrl = selectedImage?.preview || '';
    
        if (needsImage && selectedImage?.data) {
            const formData = new FormData();
            const imgResponse = await fetch(selectedImage.preview);
            const blob = await imgResponse.blob();
            formData.append('photo', blob, `upload_${Date.now()}.png`);

            const uploadRes = await fetch(`${apiUrl}/api/save_file.php`, { 
                method: 'POST', 
                body: formData 
            });
            const uploadData = await uploadRes.json();
            imageUrl = uploadData.fileUrl;
        }

        setStatusMessage('Запуск генерації...');

        // handleGenerate внутри Generator.tsx
        const taskId = await generateByTemplateId(
          effectiveTemplateId, 
          prompt, 
          videoMethod === 'text' ? '' : imageUrl, // Если текст, отправляем пустую строку вместо URL
          { 
            method: videoMethod, // 'text' или 'image'
            duration: soraDuration, 
            aspectRatio: soraLayout === 'portrait' ? '9:16' : '16:9'
          }
        );

        const tgId = tgUser?.id || 0;

        await saveVideoToHistory(taskId, prompt, initialPrompt ? "Шаблон" : `Власна (${mode})`, tgId, imageUrl, aspectRatio);

        onVideoGenerated({
            id: taskId,
            prompt,
            status: 'processing',
            title: initialPrompt ? "Шаблон" : `Власна (${mode})`
        } as any, currentCost);

        setStatusMessage('Додано в чергу!');
        setIsGenerating(false);
      
        setTimeout(() => {
            window.location.hash = '/library';
        }, 1500);

    } catch (error: any) {
        console.error("Ошибка:", error);
        setStatusMessage(`Помилка: ${error.message}`);
        setIsGenerating(false);
      } finally {
      isWorking.current = false;
    }
  };

  // Динамические тексты заголовков
  const getHeader = () => {
    if (initialPrompt) return { title: "За шаблоном", sub: "Стиль налаштовано" };
    switch(mode) {
      case 'image': return { title: "Генерація фото", sub: "Опишіть ідею" };
      case 'music': return { title: "Створення музики", sub: "Опишіть жанр та настрій" };
      default: return { title: "Власне відео", sub: "Опишіть ідею та додайте фото" };
    }
  };

  const header = getHeader();
  
  return (
    <div className="flex flex-col h-full px-4 pt-6 pb-24 max-w-md mx-auto w-full overflow-y-auto no-scrollbar">
      <div className="mb-6 text-center">
        <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg shadow-black/20 bg-gradient-to-tr 
          ${mode === 'music' ? 'from-orange-500 to-yellow-400' : mode === 'image' ? 'from-blue-500 to-cyan-400' : 'from-primary to-secondary'}`}>
           {mode === 'music' ? <MusicIcon className="w-8 h-8 text-white" /> : mode === 'image' ? <PhotoIcon className="w-8 h-8 text-white" /> : <SparklesIcon className="w-8 h-8 text-white" />}
        </div>
        <h2 className="text-2xl font-bold dark:text-white text-gray-900 mb-2">{header.title}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{header.sub}</p>
      </div>
  
      <div className="space-y-6">
          {/* 1. Метод генерації с фиолетовым выделением */}
          {mode === 'video' && !initialPrompt && (
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-gray-300 ml-1">Метод генерації</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                <button
                  onClick={() => setVideoMethod('image')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    videoMethod === 'image' 
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20' 
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                >
                  З фото
                </button>
                <button
                  onClick={() => setVideoMethod('text')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    videoMethod === 'text' 
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20' 
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                >
                  Тільки текст
                </button>
              </div>
            </div>
          )}

          {/* 2. ЗАГРУЗКА ФОТО (Если выбран метод "З фото" или это режим фото) */}
          {(mode === 'image' || (mode === 'video' && videoMethod === 'image')) && (
            <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                 {mode === 'image' ? "Референс (необов'язково)" : "Вихідне фото"}
               </label>
               {!selectedImage ? (
                   <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                   >
                       <div className="p-3 bg-gray-100 dark:bg-white/10 rounded-full mb-2">
                          <PhotoIcon />
                       </div>
                       <span className="text-sm font-medium">{t.gen_upload_text}</span>
                       <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                   </div>
               ) : (
                   <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 group">
                       <img src={selectedImage.preview} alt="Reference" className="w-full h-48 object-cover opacity-80" />
                       <button 
                          onClick={() => { setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors backdrop-blur-sm"
                       >
                           <TrashIcon />
                       </button>
                   </div>
               )}
            </div>
          )}

          {/* 3. ПОЛЕ ТЕКСТА (Prompt) */}
          <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                {mode === 'music' ? "Опис музики" : t.gen_label_prompt}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => { setPrompt(e.target.value); if (statusMessage) setStatusMessage(""); }}
                placeholder={mode === 'music' ? "Напр.: Lo-fi hip hop, calm, piano..." : t.gen_placeholder}
                className="w-full bg-white dark:bg-surface border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none h-28 transition-all shadow-sm text-sm"
                disabled={isGenerating}
              />
          </div>
  
          {/* 4. ТЕХНИЧЕСКИЕ НАСТРОЙКИ (Длительность и формат видео) */}
          {mode === 'video' && !initialPrompt && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-gray-300 ml-1">Тривалість відео</label>
                <div className="grid grid-cols-2 gap-2">
                  {['10', '15'].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setSoraDuration(sec as '10' | '15')}
                      className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                        soraDuration === sec ? 'bg-primary border-primary text-white' : 'bg-white dark:bg-surface text-gray-400'
                      }`}
                    >
                      {sec} сек
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-gray-300 ml-1">Співвідношення сторін</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSoraLayout('portrait')}
                    className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                      soraLayout === 'portrait' ? 'bg-primary border-primary text-white' : 'bg-white dark:bg-surface text-gray-400'
                    }`}
                  >
                    Вертикальне (9:16)
                  </button>
                  <button
                    onClick={() => setSoraLayout('landscape')}
                    className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                      soraLayout === 'landscape' ? 'bg-primary border-primary text-white' : 'bg-white dark:bg-surface text-gray-400'
                    }`}
                  >
                    Горизонтальне (16:9)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. КНОПКА ГЕНЕРАЦИИ */}
          <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95 ${
              isGenerating
                  ? 'bg-gray-200 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary to-secondary text-white shadow-primary/40'
              }`}
          >
              {isGenerating ? (
                <span>{t.gen_btn_generating}</span>
              ) : (
                <span className="flex items-center gap-2">
                  {t.gen_btn_generate} 
                  <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg">
                    <CoinsIcon className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-bold">{currentCost}</span>
                  </div>
                </span>
              )}
          </button>

          {statusMessage && (
              <div className="p-4 rounded-xl text-center text-sm bg-white dark:bg-surface text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-white/5">
                {statusMessage}
              </div>
          )}
      </div>
      
      <LowBalanceModal 
        isOpen={isLowBalanceOpen}
        onClose={() => setIsLowBalanceOpen(false)}
        balance={currentCredits}
        lang={lang}
        onGetMore={onGetMore}
      />
    </div>
  );
};

export default Generator;
