import React, { useState } from 'react';
import { generateVideo } from '../services/veoService';
import { SparklesIcon } from './Icons';
import { VideoItem, Language } from '../types';
import { getTranslation } from '../utils/translations';

interface GeneratorProps {
  onVideoGenerated: (video: VideoItem) => void;
  lang: Language;
}

const Generator: React.FC<GeneratorProps> = ({ onVideoGenerated, lang }) => {
  const t = getTranslation(lang);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [statusMessage, setStatusMessage] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setStatusMessage(t.gen_status_init);

    try {
      const url = await generateVideo(prompt, aspectRatio);
      
      if (url) {
        const newVideo: VideoItem = {
          id: Date.now().toString(),
          url: url,
          prompt: prompt,
          isLocal: true
        };
        onVideoGenerated(newVideo);
        setStatusMessage(t.gen_status_done);
        setPrompt(""); 
      }
    } catch (error: any) {
      console.error(error);
      setStatusMessage(t.gen_status_error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-4 pt-6 pb-24 max-w-md mx-auto w-full">
      <div className="mb-8 text-center">
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
              className="w-full bg-white dark:bg-surface border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none h-32 transition-all shadow-sm"
              disabled={isGenerating}
              />
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
                        Vertical (9:16)
                    </button>
                    <button
                        onClick={() => setAspectRatio('16:9')}
                        className={`py-3 rounded-xl border font-medium text-sm transition-all shadow-sm ${
                            aspectRatio === '16:9' 
                            ? 'bg-primary border-primary text-white shadow-primary/30' 
                            : 'bg-white dark:bg-surface border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                    >
                        Landscape (16:9)
                    </button>
                </div>
            </div>

            {/* Generate Button */}
            <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95 ${
                isGenerating || !prompt.trim()
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