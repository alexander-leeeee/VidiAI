const KIE_API_KEY = import.meta.env.VITE_KIE_API_KEY;

const ENDPOINTS = {
  // Kling
  KLING_GENERATE: import.meta.env.VITE_KLING_GENERATE_URL || 'https://api.kie.ai/api/v1/jobs/createTask',
  KLING_STATUS: import.meta.env.VITE_KLING_STATUS_URL || 'https://api.kie.ai/api/v1/jobs/recordInfo',

  // Veo
  VEO_GENERATE: import.meta.env.VITE_VEO_GENERATE_URL || 'https://api.kie.ai/api/v1/veo/generate',
  VEO_STATUS: import.meta.env.VITE_VEO_STATUS_URL || 'https://api.kie.ai/api/v1/veo/record-info',
  
  // Nano Banana
  IMAGE_GENERATE: import.meta.env.VITE_IMAGE_GENERATE_URL || 'https://api.kie.ai/api/v1/jobs/createTask',
  IMAGE_STATUS: import.meta.env.VITE_IMAGE_STATUS_URL || 'https://api.kie.ai/api/v1/jobs/recordInfo',

  // Suno
  MUSIC_GENERATE: import.meta.env.VITE_MUSIC_GENERATE_URL || 'https://api.kie.ai/api/v1/generate',
  MUSIC_STATUS: import.meta.env.VITE_MUSIC_STATUS_URL || 'https://api.kie.ai/api/v1/generate/record-info'
};

export const syncUserWithDb = async (tgId: number, username: string) => {
  const response = await fetch(`${import.meta.env.VITE_SERVER_BASE_URL}/sync_user.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegram_id: tgId, username })
  });
  return await response.json();
};

// Функция списания кредитов в БД
export const deductCreditsInDb = async (tgId: number, amount: number) => {
  await fetch(`${import.meta.env.VITE_SERVER_BASE_URL}/deduct_credits.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegram_id: tgId, amount })
  });
};

const baseGenerateNano = async (payload: any) => {
  // Используем эндпоинт из .env
  const response = await fetch(ENDPOINTS.IMAGE_GENERATE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIE_API_KEY}`
    },
    body: JSON.stringify(payload)
  });
  
  const result = await response.json();
  const taskId = result.data?.taskId || result.data?.jobId;

  if (!taskId) {
    if (result.code === 402) throw new Error("Недостатньо кредитів на Kie.ai.");
    throw new Error(result.message || 'Failed to create image task');
  }
  
  return taskId;
};

/**
 * Універсальна функція для генерації зображень Nano Banana
 */
export const generateNanoImage = async (params: {
  prompt: string,
  quality: 'standard' | 'pro' | 'edit',
  aspectRatio: string,
  outputFormat: 'png' | 'jpeg',
  imageUrl?: string // Передаємо тільки для режиму 'edit'
}) => {
  // 1. Динамічно вибираємо модель залежно від якості
  let modelName = "google/nano-banana";
  if (params.quality === 'pro') modelName = "nano-banana-pro";
  if (params.quality === 'edit') modelName = "google/nano-banana-edit";

  // 2. Формуємо запит до API
  return baseGenerateNano({
    model: modelName,
    input: {
      "prompt": params.prompt,
      "aspect_ratio": params.aspectRatio,
      "output_format": params.outputFormat,
      // Додаємо посилання на фото, якщо воно є (для режиму стилізації)
      ...(params.imageUrl && { "image_url": params.imageUrl })
    }
  });
};

/**
 * Універсальна функція для генерації відео (Sora 2 / Veo)
 */
export const generateUniversalVideo = async (params: {
  prompt: string,
  duration: '10' | '15',
  aspectRatio: '9:16' | '16:9' | 'auto',
  imageUrl?: string,
  method: 'text' | 'image',
  modelId: string,
  includeSound?: boolean
}) => {
  const isVeo = params.modelId === 'veo';
  // Выбираем эндпоинт на основе модели
  const endpoint = isVeo ? ENDPOINTS.VEO_GENERATE : ENDPOINTS.KLING_GENERATE;
  
  let payload: any = {};

  if (isVeo) {
    // 1. Убираем неопределенность: если пришло auto или пусто — ставим 9:16
    let safeRatio = params.aspectRatio;
    if (!safeRatio || safeRatio.toLowerCase() === 'auto') {
      safeRatio = '9:16';
    }

    payload = {
      model: 'veo3_fast',
      prompt: params.prompt || "Animate this image",
      aspect_ratio: safeRatio, // Теперь сюда попадет только "9:16" или "16:9"
      seeds: Math.floor(Math.random() * 100000),
      // Используем IMAGE_TO_VIDEO для фото или TEXT_2_VIDEO для текста
      generationType: (params.method === 'image' && params.imageUrl) ? 'IMAGE_TO_VIDEO' : 'TEXT_2_VIDEO',
      watermark: 'VidiAI'
    };

    if (params.method === 'image' && params.imageUrl) {
      payload.imageUrl = params.imageUrl; 
    }
  } else if (params.modelId === 'sora-2') {
    // 2. ЛОГИКА ДЛЯ SORA 2
    const isImageMode = params.method === 'image' && params.imageUrl;
    // Sora не понимает 'auto', поэтому подстраховываемся
    const soraRatio = params.aspectRatio === '9:16' ? 'portrait' : 'landscape';

    payload = {
      model: isImageMode ? 'sora-2-image-to-video' : 'sora-2-text-to-video',
      input: {
        "prompt": params.prompt,
        "aspect_ratio": soraRatio,
        "n_frames": params.duration, 
        "remove_watermark": true,
        "sound": true // Sora всегда со звуком
      }
    };

    if (isImageMode) {
      payload.input.image_urls = [params.imageUrl];
    }
  } else {
    throw new Error("Ця модель тимчасово недоступна.");
  }

  // 3. ОТПРАВКА ЗАПРОСА
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIE_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  
  // У Veo taskId может лежать прямо в data
  const taskId = result.data?.taskId || result.data?.jobId || result.data;

  if (!taskId || (typeof taskId !== 'string' && typeof taskId !== 'number')) {
    if (result.code === 402) throw new Error("Недостатньо кредитів на Kie.ai.");
    throw new Error(result.message || 'Failed to create task');
  }
  
  // Добавляем префикс, чтобы getTaskStatus знал, какой статус проверять
  return isVeo ? `veo_${taskId}` : taskId;
};

/**
 * Універсальна функція для генерації музики (Suno V5)
 */
export const generateUniversalMusic = async (params: {
  prompt: string,
  title?: string,
  style?: string,
  lyrics?: string,
  vocalGender: 'male' | 'female' | 'random',
  instrumental: boolean,
  isCustom: boolean
}) => {
  let finalGender: 'm' | 'f' = 'm'; 
  if (params.vocalGender === 'random') {
    finalGender = Math.random() > 0.5 ? 'm' : 'f';
  } else {
    finalGender = params.vocalGender === 'female' ? 'f' : 'm';
  }

  let payload: any = {
    model: 'V5',
    instrumental: params.instrumental,
    customMode: params.isCustom,
    callBackUrl: 'https://server.vidiai.top/api/music_callback.php'
  };

  if (params.isCustom) {
    if (!params.style?.trim()) throw new Error("Стиль музики обов'язковий!");
    if (!params.title?.trim()) throw new Error("Назва треку обов'язкова!");
    
    payload.style = params.style;
    payload.title = params.title;
    
    if (params.instrumental) {
      payload.prompt = params.prompt || params.style; 
    } else {
      if (!params.lyrics?.trim()) throw new Error("Текст пісні (Lyrics) обов'язковий!");
      payload.prompt = params.lyrics;
      payload.vocalGender = finalGender;
    }
  } else {
    if (!params.prompt?.trim()) throw new Error("Опис пісні обов'язковий!");
    payload.prompt = params.prompt;
    if (!params.instrumental) {
      payload.vocalGender = finalGender;
    }
  }

  const response = await fetch(ENDPOINTS.MUSIC_GENERATE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIE_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  const taskId = result.data?.taskId || result.data?.jobId || (result.data && result.data[0]?.taskId);

  if (!taskId) {
    throw new Error(result.message || 'Не вдалося створити завдання на музику');
  }
  
  // Возвращаем ID с префиксом, чтобы getTaskStatus знал, что это музыка
  return `music_${taskId}`;
};

// --- РЕЕСТР СТОИМОСТИ (легко менять здесь) ---
export const TEMPLATE_COSTS: Record<string, number> = {
  '1': 25,            // Видео 10 сек + звук
  '2': 10,            // Видео 5 сек
  
  // НОВЫЕ РУЧНЫЕ РЕЖИМЫ
  'manual_music': 10, // Генерация музыки

  // Изображения
  'image_standard': 5,
  'image_pro': 10,
  'image_edit': 15,
    
  // Цены для Sora 2 (примерные)
  'sora_10': 30, // 10 секунд
  'sora_15': 45, // 15 секунд

  // Цены для Veo
  'veo': 60, // Устанавливаем цену для Veo (например, 35 монет)
  
  'default': 15       // Запасной вариант
};

// Функция для получения цены по ID
export const getCostByTemplateId = (id: string | undefined): number => {
  return TEMPLATE_COSTS[id || 'default'] || TEMPLATE_COSTS['default'];
};

// --- ВНУТРЕННЯЯ ФУНКЦИЯ (не экспортируем, она нужна только здесь) ---
// Помогает отправить запрос с любыми параметрами
const baseGenerateKling = async (payload: any) => {
  const response = await fetch(ENDPOINTS.KLING_GENERATE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIE_API_KEY}`
    },
    body: JSON.stringify(payload)
  });
  
  const result = await response.json();
  const taskId = result.data?.taskId || result.data?.jobId;

  if (!taskId) {
    if (result.code === 402) throw new Error("Недостатньо кредитів на Kie.ai.");
    throw new Error(result.message || 'Failed to create task');
  }
  
  return taskId;
};

// --- ЭКСПОРТЫ ДЛЯ ШАБЛОНОВ: НАЧАЛО ---

// Шаблон №1: Kling 2.6 (10 сек, звук)
export const generateTemplate1 = async (prompt: string, imageUrl: string) => {
  return baseGenerateKling({
    model: 'kling-2.6/image-to-video',
    input: {
      "prompt": prompt,
      "image_urls": imageUrl, 
      "sound": true,
      "duration": "10"
    }
  });
};

// Шаблон №2: Твой новый шаблон (например, 5 сек, без звука)
export const generateTemplate2 = async (prompt: string, imageUrl: string) => {
  return baseGenerateKling({
    model: 'kling/v2-1-standard',
    input: {
      "prompt": prompt,
      "image_url": imageUrl, 
      "sound": false,
      "duration": "5"
    }
  });
};

// 1. Создаем карту соответствия (какой ID какой функцией генерируется)
const templateActions: Record<string, (prompt: string, imageUrl: string) => Promise<string>> = {
  '1': generateTemplate1, // Первый шаблон — 10 сек + звук
  '2': generateTemplate2, // Второй шаблон — 5 сек без звука
  '3': generateTemplate1, // Третий шаблон может тоже использовать настройки первого
  // Сюда ты просто дописываешь новые ID по мере появления шаблонов
};

/**
 * Універсальна функція-диспетчер
 */
export const generateByTemplateId = async (templateId: string, prompt: string, imageUrl: string, options?: any) => {
  // 1. ПРОВЕРКА НА РУЧНОЙ РЕЖИМ (Sora 10/15 сек)
  // В Generator.tsx мы формируем ID как `sora_${soraDuration}`
  if (templateId.startsWith('sora_')) {
    return await generateUniversalVideo({
      prompt: prompt,
      imageUrl: imageUrl,
      duration: options?.duration || '10',
      aspectRatio: options?.aspectRatio || '9:16',
      method: options?.method || 'image',
      modelId: options?.modelId || 'sora-2'
    });
  }

  // 2. ЛОГИКА ШАБЛОНОВ (Showcase)
  // Ищем функцию по ID (1, 2, 3...). Если ID нет в списке — берем стандартный шаблон
  const action = templateActions[templateId] || generateTemplate2;
  return await action(prompt, imageUrl, options);
};

// --- ЭКСПОРТЫ ДЛЯ ШАБЛОНОВ: КОНЕЦ ---
export const updateVideoInDb = async (
  taskId: string, 
  status: string, 
  videoUrl: string | null, 
  alternativeUrl?: string | null,
  errorMsg?: string
) => {
  try {
    // 1. Очищаем ID от префиксов 'music_' или 'veo_'
    const cleanId = taskId.replace('music_', '').replace('veo_', '');

    const response = await fetch('https://server.vidiai.top/api/update_media_status.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        task_id: cleanId, // 2. Отправляем чистый ID, который PHP найдет в базе
        status: status, 
        video_url: videoUrl,
        alternative_url: alternativeUrl,
        error_description: errorMsg 
      }),
    });
    
    const result = await response.json();
    console.log("Результат оновлення бази:", result);
  } catch (error) {
    console.error("Помилка БД при оновленні статусу:", error);
  }
};

export const saveVideoToHistory = async (
  taskId: string, 
  prompt: string, 
  title: string, 
  tgId: number, 
  imageUrl: string | null, 
  aspectRatio: string,
  contentType: string = 'video'
) => {
  try {
    // 1. Очищаем ID от префиксов, чтобы в базе он был чистым
    const cleanId = taskId.replace('music_', '').replace('veo_', '');

    await fetch('https://server.vidiai.top/api/save_media.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        task_id: cleanId, // 2. Отправляем чистый ID
        prompt, 
        title, 
        telegram_id: tgId, 
        imageUrl, 
        aspectRatio,
        type: contentType
      }),
    });
  } catch (error) {
    console.error("Помилка збереження історії:", error);
  }
};

export const getTaskStatus = async (taskId: string) => {
  const isMusicTask = taskId.startsWith('music_');
  const isVeoTask = taskId.startsWith('veo_');

  // 1. Выбираем правильный эндпоинт
  let endpoint = ENDPOINTS.KLING_STATUS;
  if (isMusicTask) endpoint = ENDPOINTS.MUSIC_STATUS;
  if (isVeoTask) endpoint = ENDPOINTS.VEO_STATUS;

  // 2. Очищаем ID от префиксов
  const cleanTaskId = taskId.replace('music_', '').replace('veo_', '');

  try {
    const response = await fetch(`${endpoint}?taskId=${cleanTaskId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${KIE_API_KEY}` }
    });

    const result = await response.json();

    if ((result.code === 200 || result.code === 0) && result.data) {
      const data = result.data;
      
      // Получаем текстовый статус и проверяем флаги Kie AI
      const rawState = (data.status || data.state || 'processing').toLowerCase();
      
      // Улучшенная проверка на успех (включая successFlag для Veo)
      const isSucceeded = 
        ['success', 'completed', 'finished', 'succeeded'].includes(rawState) || 
        data.successFlag === 1 || 
        data.successFlag === "1"; 

      const isFailed = ['fail', 'failed', 'error'].includes(rawState) || data.successFlag === -1;

      if (isFailed) {
        return { status: 'failed', error_msg: data.failMsg || result.msg || "Error" };
      }

      // ЛОГИКА ДЛЯ МУЗЫКИ
      if (isMusicTask && data.response?.sunoData && data.response.sunoData.length > 0) {
        return {
          status: isSucceeded ? 'succeeded' : rawState,
          video_url: data.response.sunoData[0]?.audioUrl,
          alternative_url: data.response.sunoData[1]?.audioUrl
        };
      }

      // ЛОГИКА ДЛЯ ВИДЕО И ФОТО (Veo, Sora, Kling, Nano)
      // Проверяем все возможные поля, включая вложенный response.resultUrls из твоего лога
      let rawUrl = data.response?.resultUrls || data.resultUrl || data.url || data.videoUrl || data.imageUrl || null;

      // Если это массив, берем первый элемент
      let finalUrl = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;

      // Резервная проверка через resultJson (для старых моделей Kling)
      if (!finalUrl && data.resultJson) {
        try {
          const parsed = JSON.parse(data.resultJson);
          const jsonUrl = parsed.resultUrls?.[0] || parsed.url || null;
          finalUrl = Array.isArray(jsonUrl) ? jsonUrl[0] : jsonUrl;
        } catch (e) {
          console.error("Помилка парсингу resultJson:", e);
        }
      }

      // ЛОГ ДЛЯ ОТЛАДКИ
      console.log(`[DEBUG] Task: ${taskId} | Success: ${isSucceeded} | URL: ${finalUrl}`);

      return {
        status: isSucceeded ? 'succeeded' : rawState,
        video_url: finalUrl 
      };
    }
    
    return { status: 'error', error_msg: result.message || "Unknown API Error" };
  } catch (error) {
    console.error("Ошибка при запросе статуса:", error);
    return { status: 'error', error_msg: "Network error" };
  }
};

export const getUserHistory = async () => {
  const response = await fetch(`${import.meta.env.VITE_SERVER_BASE_URL}/get_history.php`);
  const result = await response.json();
  return result.status === 'success' ? result.videos : [];
};
