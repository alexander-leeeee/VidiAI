import React, { useState, useEffect, useRef } from 'react';
import { generateVideo } from '../services/veoService';
import { SparklesIcon, PhotoIcon, TrashIcon } from './Icons';
import { VideoItem, Language } from '../types';
import { getTranslation } from '../utils/translations';

interface GeneratorProps {
  onVideoGenerated: (video: VideoItem) => void;
  lang: Language;
  initialPrompt?: string;
}

interface ImageFile {
  preview: string;
  data: string; // base64
  mimeType: string;
}

const Generator: React.FC<GeneratorProps> = ({ onVideoGenerated, lang, initialPrompt }) => {
  const t = getTranslation(lang);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!prompt.trim() && !selectedImage) return;

    setIsGenerating(true);
    setStatusMessage(t.gen_status_init);

    try {
      const url = await generateVideo({
        prompt, 
        aspectRatio, 
        image: selectedImage ? { data: selectedImage.data, mimeType: selectedImage.mimeType } : undefined
      });
      
      if (url) {
        const newVideo: VideoItem = {
          id: Date.now().toString(),
          url: url,
          prompt: prompt,
          isLocal: true
        };
        onVideoGenerated(newVideo);
        setStatusMessage(t.gen_status_done);
        // Do not clear prompt immediately so user can iterate
      }
    } catch (error: any) {
      console.error(error);
      setStatusMessage(t.gen_status_error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-4 pt-6 pb-24 max-w-md mx-auto w-full overflow-y-auto no-scrollbar">
      <div className="mb-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-tr from-primary to-secondary rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg shadow-purple-900/50">
           <SparklesIcon />
        </div>
        <h2 className="text-2xl font-bold dark:text-white text-gray-900 mb-2">{t.gen_title}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t.gen_subtitle}</p>
      </div>

      <div className="space-y-6">
          {/* Prompt Input */}
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

          {/* Image Upload */}
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
                     <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                     />
                 </div>
             ) : (
                 <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 group">
                     <img src={selectedImage.preview} alt="Reference" className="w-full h-48 object-cover opacity-80" />
                     <button 
                        onClick={() => {
                            setSelectedImage(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors backdrop-blur-sm"
                     >
                         <TrashIcon />
                     </button>
                 </div>
             )}
          </div>

          {/* Settings */}
          <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{t.gen_label_format}</label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setAspectRatio('9:16')}
                        className={`py-3 rounded-xl border font-medium text-sm transition-all shadow-sm ${
                            aspectRatio === '9:16' 
                            ? 'bg-primary border-primary text-white shadow-primary/30' 
                            : 'bg-white dark:bg-surface border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                    >
                        {t.gen_fmt_vertical}
                    </button>
                    <button
                        onClick={() => setAspectRatio('16:9')}
                        className={`py-3 rounded-xl border font-medium text-sm transition-all shadow-sm ${
                            aspectRatio === '16:9' 
                            ? 'bg-primary border-primary text-white shadow-primary/30' 
                            : 'bg-white dark:bg-surface border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                    >
                        {t.gen_fmt_landscape}
                    </button>
                </div>
            </div>

            {/* Generate Button */}
            <button
                onClick={handleGenerate}
                disabled={isGenerating || (!prompt.trim() && !selectedImage)}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95 ${
                isGenerating || (!prompt.trim() && !selectedImage)
                    ? 'bg-gray-200 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary to-secondary text-white shadow-primary/40 hover:brightness-110'
                }`}
            >
                {isGenerating ? (
                <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{t.gen_btn_generating}</span>
                </>
                ) : (
                <>
                    <SparklesIcon />
                    <span>{t.gen_btn_generate}</span>
                </>
                )}
            </button>

            {/* Status Text */}
            {statusMessage && (
                <div className={`p-4 rounded-xl text-center text-sm ${isGenerating ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200 animate-pulse' : 'bg-white dark:bg-surface text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-white/5'}`}>
                {statusMessage}
                {isGenerating && <p className="text-xs mt-1 opacity-70">1-2 min</p>}
                </div>
            )}
      </div>
    </div>
  );
};

export default Generator;