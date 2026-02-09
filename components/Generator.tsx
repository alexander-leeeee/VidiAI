import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, PhotoIcon, TrashIcon, CoinsIcon, MusicIcon } from './Icons';
import { VideoItem, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { generateByTemplateId, saveVideoToHistory, getCostByTemplateId, generateNanoImage, generateUniversalVideo, generateUniversalMusic } from '../services/aiService';
import LowBalanceModal from './LowBalanceModal';
import { Volume2, VolumeX } from 'lucide-react';

export type GeneratorMode = 'video' | 'image' | 'music';

interface GeneratorProps {
  onVideoGenerated: (video: VideoItem, cost: number) => void;
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
  const [aspectRatio, setAspectRatio] = useState<string>('9:16');
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLowBalanceOpen, setIsLowBalanceOpen] = useState(false);
  const isWorking = useRef(false);
  const [soraDuration, setSoraDuration] = useState<'10' | '15'>('10');
  const [soraLayout, setSoraLayout] = useState<'portrait' | 'landscape'>('portrait');
  const [imageQuality, setImageQuality] = useState<'standard' | 'pro' | 'edit'>('standard');
  const [fileFormat, setFileFormat] = useState<'png' | 'jpeg'>('png');
  const [isCustomMusic, setIsCustomMusic] = useState(false);
  const [musicTitle, setMusicTitle] = useState('');
  const [musicStyles, setMusicStyles] = useState('');
  const [hasVocals, setHasVocals] = useState(true);
  const [vocalType, setVocalType] = useState<'male' | 'female' | 'random'>('random');
  const [lyrics, setLyrics] = useState('');
  const [withSound, setWithSound] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<ImageFile[]>([]); 
  const [videoMethod, setVideoMethod] = useState<'text' | 'image' | 'reference' | 'start-end'>('image');
  const [selectedModelId, setSelectedModelId] = useState<string>('sora-2');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const matches = base64String.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          const newImage = { preview: base64String, mimeType: matches[1], data: matches[2] };
          // Добавляем в массив, если не превышен лимит (2 для start-end, 3 для reference)
          const limit = videoMethod === 'start-end' ? 2 : 3;
          if (uploadedImages.length < limit) {
            setUploadedImages([...uploadedImages, newImage]);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };
  
  const effectiveTemplateId = (() => {
    if (templateId && templateId !== 'default') return templateId;
    if (selectedModelId === 'veo') return 'veo';
    if (selectedModelId === 'sora-2') return `sora_${soraDuration}`;
    if (mode === 'image') return `image_${imageQuality}`;
    return `manual_${mode}`;
  })();

  const currentCost = getCostByTemplateId(effectiveTemplateId);

  useEffect(() => {
    setIsGenerating(false);
    setStatusMessage("");
    if (!initialPrompt) setPrompt("");
  }, [initialPrompt, initialImage, templateId, mode]);
    
  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    if (initialImage) {
      setUploadedImages([{ preview: initialImage, data: '', mimeType: '' }]);
    } else {
      setUploadedImages([]);
    }
  }, [initialImage]);

  useEffect(() => {
    if (initialAspectRatio) setAspectRatio(initialAspectRatio);
  }, [initialAspectRatio]);

  const handleGenerate = async () => {
      setStatusMessage(""); 
      if (isWorking.current || isGenerating) return;

      const isImageEdit = mode === 'image' && imageQuality === 'edit';
      const isVideoWithImage = mode === 'video' && videoMethod !== 'text';
      const needsImage = isImageEdit || isVideoWithImage;
      const isCustom = mode === 'music' && isCustomMusic;
    
      const hasContent = isCustom ? (prompt.trim().length > 0 || lyrics.trim().length > 0) : prompt.trim().length > 0;
      const hasImage = uploadedImages.length > 0;

      if (!hasContent || (needsImage && !hasImage)) {
          alert(needsImage && !hasImage ? t.gen_label_image : "Будь ласка, введіть опис або текст пісні");
          return;
      }

      if (currentCredits < currentCost) {
          setIsLowBalanceOpen(true);
          return;
      }

      isWorking.current = true; 
      setIsGenerating(true);
      setStatusMessage(mode === 'music' ? "Налаштовуємо звук..." : "Завантаження...");

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://server.vidiai.top';
        const uploadedUrls = [];
    
        // 1. Проверки перед стартом
        const isImageEdit = mode === 'image' && imageQuality === 'edit';
        const isVideoWithImage = mode === 'video' && videoMethod !== 'text';
        const needsImage = isImageEdit || isVideoWithImage;
        
        if (needsImage && uploadedImages.length === 0) {
            alert(t.gen_label_image);
            return;
        }
    
        isWorking.current = true; 
        setIsGenerating(true);
        setStatusMessage(mode === 'music' ? "Налаштовуємо звук..." : "Завантаження фото...");
    
        // 2. ЦИКЛ ЗАГРУЗКИ ВСЕХ ФОТО НА СЕРВЕР
        if (needsImage) {
            for (let i = 0; i < uploadedImages.length; i++) {
                const img = uploadedImages[i];
                const formData = new FormData();
                // Загружаем превью напрямую
                const imgResponse = await fetch(img.preview);
                const blob = await imgResponse.blob();
                formData.append('photo', blob, `frame_${i}_${Date.now()}.png`);
                
                const uploadRes = await fetch(`${apiUrl}/api/save_file.php`, { method: 'POST', body: formData });
                const uploadData = await uploadRes.json();
                uploadedUrls.push(uploadData.fileUrl);
            }
        }
    
        // Собираем ссылки в строку через запятую для API
        const finalImageUrlForApi = uploadedUrls.join(',');
        const mainUrl = uploadedUrls[0] || ''; // Для старых функций, где нужно только одно фото
    
        setStatusMessage('Запуск генерації...');
        let taskId;
    
        if (templateId && templateId !== 'default') {
            taskId = await generateByTemplateId(
                effectiveTemplateId, 
                prompt, 
                mainUrl, 
                { method: videoMethod as any, duration: soraDuration, aspectRatio: aspectRatio, modelId: selectedModelId }
            );
        } else if (mode === 'image') {
            taskId = await generateNanoImage({
                prompt: prompt,
                quality: imageQuality,
                aspectRatio: aspectRatio,
                outputFormat: fileFormat,
                imageUrl: mainUrl
            });
          } else if (mode === 'music') {
              const musicTaskId = await generateUniversalMusic({
                  prompt: prompt,
                  title: musicTitle,
                  style: musicStyles,
                  lyrics: lyrics,
                  vocalGender: vocalType,
                  instrumental: !hasVocals, 
                  isCustom: isCustomMusic
              });
              taskId = `music_${musicTaskId}`; 
          } else {
              // Власна генерація відео (Sora / Veo)
              taskId = await generateUniversalVideo({
                  prompt: prompt, 
                  // Если это Sora — берем только первую ссылку, если Veo — все через запятую
                  imageUrl: selectedModelId === 'sora-2' ? (uploadedUrls[0] || '') : finalImageUrlForApi, 
                  duration: soraDuration, 
                  aspectRatio: soraLayout as any,
                  method: videoMethod, // Теперь здесь 'image' для Sora или 'reference'/'start-end' для Veo
                  modelId: selectedModelId,
                  includeSound: withSound
              });
          }

          // СОХРАНЕНИЕ В БАЗУ
          const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
          const tgId = tgUser?.id || 0;
          const displayTitle = (mode === 'music' && musicTitle?.trim()) ? musicTitle : (initialPrompt ? "Шаблон" : `Власна (${mode})`);
        
          await saveVideoToHistory(taskId, prompt, displayTitle, tgId, mainUrl, aspectRatio, mode);

          onVideoGenerated({
              id: taskId,
              prompt,
              status: 'processing',
              contentType: mode,
              title: displayTitle
          } as any, currentCost);

          setStatusMessage('Додано в чергу!');
          setTimeout(() => { window.location.hash = '/library'; }, 1500);

      } catch (error: any) {
          console.error("Ошибка:", error);
          alert(`Помилка: ${error.message}`);
      } finally {
          setIsGenerating(false);
          isWorking.current = false;
      }
  };

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

      {/* ПЕРЕКЛЮЧАТЕЛЬ МОДЕЛЕЙ (ФУНДАМЕНТ) */}
      {mode === 'video' && templateId === 'default' && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'sora-2', name: 'Sora 2', active: true, icon: '⚡' },
            { id: 'veo', name: 'Veo', active: true, icon: '🔮' }, // АКТИВИРОВАЛИ VEO
            { id: 'kling', name: 'Kling 1.5', active: false, icon: '🎬' }
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                if (m.active) {
                  setSelectedModelId(m.id);
                  setUploadedImages([]); // Очищаем фото при смене модели
                  if (m.id === 'veo') {
                    setVideoMethod('reference'); // Для Veo свой метод
                    setSoraLayout('9:16');
                  } else {
                    setVideoMethod('image'); // Для Sora возвращаем стандарт
                    if (soraLayout === 'auto') setSoraLayout('portrait');
                  }
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all whitespace-nowrap ${
                selectedModelId === m.id 
                ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/10' 
                : 'bg-white/5 border-white/10 text-white/30 opacity-60'
              } ${!m.active ? 'cursor-not-allowed' : 'active:scale-95'}`}
            >
              <span className="text-sm">{m.icon}</span>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-black uppercase tracking-wider">{m.name}</span>
                {!m.active && <span className="text-[7px] text-primary font-bold uppercase">Soon</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {/* Качество фото */}
        {mode === 'image' && (
          <div className="space-y-2 animate-in fade-in duration-300">
            <label className="text-sm font-medium dark:text-gray-300 ml-1">Якість та режим</label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
              {[{ id: 'standard', label: 'Базова' }, { id: 'pro', label: 'Висока' }, { id: 'edit', label: 'Стилізація' }].map((q) => (
                <button key={q.id} onClick={() => setImageQuality(q.id as any)} className={`py-2.5 rounded-xl text-[10px] font-bold transition-all ${imageQuality === q.id ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md' : 'text-gray-400'}`}>{q.label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Метод генерації */}
        {mode === 'video' && templateId === 'default' && (
          <div className="space-y-2">
            <label className="text-sm font-medium dark:text-gray-300 ml-1">Метод генерації</label>
            
            {selectedModelId === 'veo' ? (
              <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                <button onClick={() => { setVideoMethod('reference'); setUploadedImages([]); }} className={`py-2.5 rounded-xl text-[10px] font-bold transition-all ${videoMethod === 'reference' ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md' : 'text-gray-400'}`}>Стиль (1-3)</button>
                <button onClick={() => { setVideoMethod('start-end'); setUploadedImages([]); }} className={`py-2.5 rounded-xl text-[10px] font-bold transition-all ${videoMethod === 'start-end' ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md' : 'text-gray-400'}`}>Перехід (2)</button>
                <button onClick={() => { setVideoMethod('text'); setUploadedImages([]); }} className={`py-2.5 rounded-xl text-[10px] font-bold transition-all ${videoMethod === 'text' ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md' : 'text-gray-400'}`}>Промт</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                <button onClick={() => { setVideoMethod('image'); setUploadedImages([]); }} className={`py-2.5 rounded-xl text-xs font-bold transition-all ${videoMethod === 'image' ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md' : 'text-gray-400'}`}>З фото</button>
                <button onClick={() => { setVideoMethod('text'); setUploadedImages([]); }} className={`py-2.5 rounded-xl text-xs font-bold transition-all ${videoMethod === 'text' ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md' : 'text-gray-400'}`}>Промт</button>
              </div>
            )}
          </div>
        )}

        {/* Динамічний блок завантаження */}
        {((mode === 'image' && imageQuality === 'edit') || (mode === 'video' && videoMethod !== 'text')) && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedModelId === 'sora-2' ? "Фото для анімації" : videoMethod === 'start-end' ? "Кадри переходу (Старт + Фінал)" : "Референси стилю (1-3)"}
              </label>
              {selectedModelId === 'veo' && videoMethod === 'reference' && (
                <span className="text-[10px] font-bold text-primary uppercase">{uploadedImages.length} / 3</span>
              )}
            </div>
        
            {/* 1. РЕЖИМ ПЕРЕХОДУ (VEO) — На всю ширину з плюсиком */}
            {selectedModelId === 'veo' && videoMethod === 'start-end' ? (
              <div className="flex items-center gap-3">
                {[0, 1].map((idx) => (
                  <React.Fragment key={idx}>
                    <div className="flex-1 relative h-32 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-2xl overflow-hidden bg-white/5">
                      {uploadedImages[idx] ? (
                        <>
                          <img src={uploadedImages[idx].preview} className="w-full h-full object-cover" />
                          <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 p-1.5 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors"><TrashIcon className="w-3 h-3"/></button>
                          <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[8px] text-center py-1 uppercase font-black text-white">{idx === 0 ? 'Старт' : 'Фінал'}</div>
                        </>
                      ) : (
                        <div onClick={() => fileInputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                          <PhotoIcon className="w-6 h-6 mb-1 opacity-30" />
                          <span className="text-[9px] font-bold uppercase text-gray-500">{idx === 0 ? "Початок" : "Кінець"}</span>
                        </div>
                      )}
                    </div>
                    {idx === 0 && <div className="text-primary font-black text-xl">+</div>}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              /* 2. РЕЖИМ SORA АБО СТИЛЬ VEO */
              <div className={`flex items-center gap-2 ${selectedModelId === 'sora-2' ? 'flex-col' : 'overflow-x-auto pb-2 no-scrollbar'}`}>
                {uploadedImages.map((img, index) => (
                  <div key={index} className={`relative flex-shrink-0 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm ${selectedModelId === 'sora-2' ? 'w-full h-48' : 'w-24 h-24'}`}>
                    <img src={img.preview} className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1.5 bg-black/60 text-white rounded-full hover:bg-red-500"><TrashIcon className="w-3 h-3"/></button>
                  </div>
                ))}
        
                {/* Кнопка "Додати" */}
                {uploadedImages.length < (selectedModelId === 'sora-2' ? 1 : 3) && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-gray-300 dark:border-white/20 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-all ${selectedModelId === 'sora-2' ? 'w-full h-48' : 'w-24 h-24 flex-shrink-0'}`}
                  >
                    <PhotoIcon className={`${selectedModelId === 'sora-2' ? 'w-8 h-8' : 'w-6 h-6'} mb-1 opacity-30`} />
                    <span className="text-[10px] font-bold uppercase">Додати фото</span>
                  </button>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        )}

        {mode === 'music' ? (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
              <span className="text-sm font-bold dark:text-white">Користувацький режим</span>
              <button onClick={() => setIsCustomMusic(!isCustomMusic)} className={`w-12 h-6 rounded-full transition-all relative ${isCustomMusic ? 'bg-orange-500' : 'bg-gray-300 dark:bg-white/20'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isCustomMusic ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {isCustomMusic ? (
              <div className="space-y-4 animate-in slide-in-from-top-2">
                <input type="text" value={musicTitle} onChange={(e) => setMusicTitle(e.target.value)} placeholder="Назва треку" className="w-full bg-white dark:bg-surface border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm dark:text-white outline-none" />
                <textarea value={musicStyles} onChange={(e) => setMusicStyles(e.target.value)} placeholder="Стилі та настрій (рок, меланхолійний...)" className="w-full bg-white dark:bg-surface border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm h-24 resize-none outline-none" />
              </div>
            ) : (
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Опис пісні (Промт)..." className="w-full bg-white dark:bg-surface border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm h-28 resize-none outline-none" />
            )}

            <div className="space-y-4 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium dark:text-gray-300">З вокалом</label>
                <button onClick={() => setHasVocals(!hasVocals)} className={`w-11 h-6 rounded-full transition-all relative duration-300 ${hasVocals ? 'bg-orange-500' : 'bg-gray-300 dark:bg-white/20'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${hasVocals ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              {hasVocals && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-3 gap-2">
                    {[{ id: 'male', label: 'Чоловічий' }, { id: 'female', label: 'Жіночий' }, { id: 'random', label: 'Випадковий' }].map((v) => (
                      <button key={v.id} onClick={() => setVocalType(v.id as any)} className={`py-2 rounded-xl text-[10px] font-bold border ${vocalType === v.id ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-surface border-gray-200 dark:border-white/10 text-gray-400'}`}>{v.label}</button>
                    ))}
                  </div>
                  {isCustomMusic && <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} placeholder="Текст пісні..." className="w-full bg-white dark:bg-surface border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs h-24 resize-none outline-none" />}
                </div>
              )}
            </div>
          </div>
        ) : (
          templateId === 'default' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                {t.gen_label_prompt}
              </label>
              <textarea 
                value={prompt} 
                onChange={(e) => { setPrompt(e.target.value); if (statusMessage) setStatusMessage(""); }} 
                placeholder={t.gen_placeholder} 
                className="w-full bg-white dark:bg-surface border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none h-28 text-sm transition-all shadow-sm" 
                disabled={isGenerating} 
              />
            </div>
          )
        )}

        {/* НАСТРОЙКИ МОДЕЛЕЙ (Sora 2 / Veo) */}
        {mode === 'video' && templateId === 'default' && (
          <div className="space-y-6">
            {/* БЛОК ДЛИТЕЛЬНОСТИ */}
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-gray-300 ml-1">Тривалість відео</label>
              
              {selectedModelId === 'veo' ? (
                /* Для Veo: Фиксированное время */
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center opacity-80">
                  <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Фіксовано</span>
                  <span className="text-sm font-black text-white">~ 8 сек</span>
                </div>
              ) : (
                /* Для Sora 2: Выбор 10/15 сек */
                <div className="grid grid-cols-2 gap-2">
                  {['10', '15'].map((sec) => (
                    <button 
                      key={sec} 
                      onClick={() => setSoraDuration(sec as '10' | '15')} 
                      className={`py-3 rounded-xl border text-xs font-bold transition-all ${soraDuration === sec ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-surface text-gray-400'}`}
                    >
                      {sec} сек
                    </button>
                  ))}
                </div>
              )}
            </div>
        
            {/* БЛОК СООТНОШЕНИЯ СТОРОН */}
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-gray-300 ml-1">
                Співвідношення сторін
              </label>
              <div className="grid grid-cols-2 gap-2 w-full"> 
                <button 
                  onClick={() => setSoraLayout(selectedModelId === 'veo' ? '9:16' : 'portrait')} 
                  className={`py-3.5 rounded-2xl border text-[11px] font-bold transition-all ${ 
                    (soraLayout === 'portrait' || soraLayout === '9:16') 
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-white dark:bg-surface border-gray-200 dark:border-white/10 text-gray-400'
                  }`}
                >
                  Вертикальне (9:16)
                </button>
            
                <button 
                  onClick={() => setSoraLayout(selectedModelId === 'veo' ? '16:9' : 'landscape')} 
                  className={`py-3.5 rounded-2xl border text-[11px] font-bold transition-all ${ 
                    (soraLayout === 'landscape' || soraLayout === '16:9') 
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-white dark:bg-surface border-gray-200 dark:border-white/10 text-gray-400'
                  }`}
                >
                  Горизонтальне (16:9)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Настройка звука в видео */}
        {mode === 'video' && templateId === 'default' && (
          <div className="space-y-2 mt-4 animate-in fade-in duration-500">
            <label className="text-xs font-bold dark:text-gray-400 ml-1 uppercase tracking-wider">
              Аудіосупровід
            </label>
            
            {selectedModelId === 'kling' ? (
              /* ДЛЯ KLING: Интерактивный переключатель */
              <div 
                onClick={() => setWithSound(!withSound)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  withSound 
                  ? 'bg-primary/10 border-primary/30 text-white' 
                  : 'bg-white/5 border-white/10 text-white/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${withSound ? 'bg-primary text-white' : 'bg-white/10 text-gray-500'}`}>
                    {withSound ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </div>
                  <span className="text-sm font-bold">{withSound ? 'Зі звуком' : 'Без звуку'}</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${withSound ? 'bg-primary' : 'bg-gray-600'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${withSound ? 'left-6' : 'left-1'}`} />
                </div>
              </div>
            ) : (
              /* ДЛЯ SORA И VEO: Просто информационная метка */
              <div className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/10 rounded-2xl opacity-80">
                <div className="p-2 rounded-full bg-green-500/20 text-green-500">
                  <Volume2 size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">Звук включено</span>
                  <span className="text-[10px] text-gray-500">Ця модель завжди генерує відео зі звуком</span>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'image' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-gray-300 ml-1">Співвідношення сторін</label>
              <div className="grid grid-cols-4 gap-2">
                {['1:1', '9:16', '16:9', '3:4', '4:3', '3:2', '2:3', '5:4', '4:5', '21:9', 'auto'].map((ratio) => (
                  <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`py-2 rounded-lg border text-[10px] font-bold transition-all ${aspectRatio === ratio ? 'bg-primary border-primary text-white shadow-sm' : 'bg-white dark:bg-surface border-gray-200 dark:border-white/10 text-gray-400'}`}>{ratio}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-gray-300 ml-1">Формат файлу</label>
              <div className="flex gap-6 p-1">
                {['png', 'jpeg'].map((f) => (
                  <button key={f} onClick={() => setFileFormat(f as any)} className="flex items-center gap-2 group cursor-pointer">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${fileFormat === f ? 'border-primary bg-primary' : 'border-gray-300 dark:border-white/20'}`}>{fileFormat === f && <div className="w-2 h-2 bg-white rounded-full" />}</div>
                    <span className={`text-sm font-medium uppercase ${fileFormat === f ? 'text-primary' : 'text-gray-400'}`}>{f}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <button onClick={handleGenerate} disabled={isGenerating} className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95 ${isGenerating ? 'bg-neutral-800 text-gray-500' : 'bg-gradient-to-r from-primary to-secondary text-white shadow-primary/40'}`}>
            {isGenerating ? <span>{t.gen_btn_generating}</span> : (
              <span className="flex items-center gap-2">{t.gen_btn_generate} 
                <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg">
                  <CoinsIcon className="w-4 h-4 text-yellow-400" /><span className="text-sm font-bold">{currentCost}</span>
                </div>
              </span>
            )}
        </button>

        {statusMessage && <div className="p-4 rounded-xl text-center text-sm bg-white dark:bg-surface text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-white/5">{statusMessage}</div>}
      </div>
      
      <LowBalanceModal isOpen={isLowBalanceOpen} onClose={() => setIsLowBalanceOpen(false)} balance={currentCredits} lang={lang} onGetMore={onGetMore} />
    </div>
  );
};

export default Generator;
