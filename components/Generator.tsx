import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, PhotoIcon, TrashIcon } from './Icons';
import { VideoItem, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { generateByTemplateId, saveVideoToHistory, getCostByTemplateId } from '../services/aiService';

interface GeneratorProps {
  onVideoGenerated: (video: VideoItem) => void;
  lang: Language;
  initialPrompt?: string;
  templateId?: string;
}

interface ImageFile {
  preview: string;
  data: string; // base64
  mimeType: string;
}

const Generator: React.FC<GeneratorProps> = ({ onVideoGenerated, lang, initialPrompt, templateId }) => {
  const t = getTranslation(lang);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentCost = getCostByTemplateId(templateId);

  // Update prompt when initialPrompt changes (e.g. from template)
  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Extract base64 data and mime type
        // Data URL format: "data:image/png;base64,....."
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
    // Проверка: текст и фото теперь обязательны
    if (!prompt.trim() || !selectedImage) {
        alert(t.gen_label_image); 
        return;
    }

    setIsGenerating(true);
    setStatusMessage("Завантаження фото...");

    try {
        // 1. Загрузка фото на твой сервер
        const formData = new FormData();
        const imgResponse = await fetch(selectedImage.preview);
        const blob = await imgResponse.blob();
        formData.append('photo', blob, `upload_${Date.now()}.png`);

        const uploadRes = await fetch('https://server.vidiai.top/api/save_file.php', {
            method: 'POST',
            body: formData
        });
        
        const uploadData = await uploadRes.json();
        if (uploadData.status !== 'success') throw new Error('Помилка завантаження фото');

        const imageUrl = uploadData.fileUrl;
        setStatusMessage('Запуск генерації...');

        // 2. Вызов диспетчера по ID шаблона
        const taskId = await generateByTemplateId(templateId || 'default', prompt, imageUrl);

        // 3. Сохранение в твою БД
        await saveVideoToHistory(taskId, prompt, initialPrompt ? "Шаблон" : "Власна генерація");

        onVideoGenerated({
            id: taskId,
            prompt,
            status: 'processing',
            title: initialPrompt ? "Шаблон" : "Власна генерація"
        } as any, currentCost);

        setStatusMessage('Відео додано в чергу!');
      
        // 4. Переход в библиотеку через 1.5 сек
        setTimeout(() => {
            window.location.hash = '/library';
        }, 1500);

    } catch (error: any) {
        console.error("Ошибка:", error);
        setStatusMessage(`Помилка: ${error.message}`);
        setIsGenerating(false); 
    }
  };
  
  return (
    <div className="flex flex-col h-full px-4 pt-6 pb-24 max-w-md mx-auto w-full overflow-y-auto no-scrollbar">
      <div className="mb-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-tr from-primary to-secondary rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg shadow-purple-900/50">
           <SparklesIcon />
        </div>
        <h2 className="text-2xl font-bold dark:text-white text-gray-900 mb-2">
          {initialPrompt ? "Создание по шаблону" : "Свободная генерация"}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {initialPrompt ? "Стиль уже настроен, просто добавь фото" : "Опиши свою идею и загрузи референс"}
        </p>
      </div>
  
      <div className="space-y-6">
          {/* Поле Prompt - показываем ТОЛЬКО если это свободная генерация */}
          {!initialPrompt ? (
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{t.gen_label_prompt}</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t.gen_placeholder}
                  className="w-full bg-white dark:bg-surface border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none h-28 transition-all shadow-sm text-sm"
                  disabled={isGenerating}
                />
            </div>
          ) : (
            /* Если это шаблон, промпт скрыт, но работает "под капотом" */
            <textarea value={prompt} className="hidden" readOnly />
          )}
  
          {/* Image Upload - Всегда активно */}
          <div className="space-y-2">
             <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{t.gen_label_image}</label>
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
  
          {/* Выбор формата - показываем ТОЛЬКО если это свободная генерация */}
          {!initialPrompt && (
            <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{t.gen_label_format}</label>
                  <div className="grid grid-cols-2 gap-3">
                      <button
                          onClick={() => setAspectRatio('9:16')}
                          className={`py-3 rounded-xl border font-medium text-sm transition-all shadow-sm ${
                              aspectRatio === '9:16' ? 'bg-primary border-primary text-white shadow-primary/30' : 'bg-white dark:bg-surface border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'
                          }`}
                      >
                          {t.gen_fmt_vertical}
                      </button>
                      <button
                          onClick={() => setAspectRatio('16:9')}
                          className={`py-3 rounded-xl border font-medium text-sm transition-all shadow-sm ${
                              aspectRatio === '16:9' ? 'bg-primary border-primary text-white shadow-primary/30' : 'bg-white dark:bg-surface border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'
                          }`}
                      >
                          {t.gen_fmt_landscape}
                      </button>
                  </div>
              </div>
          )}
  
          {/* Кнопка генерации */}
          <button
              onClick={handleGenerate}
              disabled={isGenerating || (!prompt.trim() && !selectedImage)}
              className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95 ${
              isGenerating || (!prompt.trim() && !selectedImage)
                  ? 'bg-gray-200 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary to-secondary text-white shadow-primary/40'
              }`}
          >
              {isGenerating ? (
                <span>{t.gen_btn_generating}</span>
              ) : (
                <span className="flex items-center gap-2">
                  {t.gen_btn_generate} <span className="opacity-70 text-sm font-mono">({currentCost} 🪙)</span>
                </span>
              )}
          </button>
  
          {statusMessage && (
              <div className="p-4 rounded-xl text-center text-sm bg-white dark:bg-surface text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-white/5">
                {statusMessage}
              </div>
          )}
      </div>
    </div>
  );
};

export default Generator;
