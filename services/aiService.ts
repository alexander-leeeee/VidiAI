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
 * Універсальна функція для генерації відео (Sora 2 / Veo / Kling 2.1)
 */
export const generateUniversalVideo = async (params: {
  prompt: string,
  duration: '10' | '15',
  aspectRatio: string,
  imageUrl?: string,
  method: 'reference' | 'start-end' | 'text' | 'image', // Добавили 'image' для совместимости
  modelId: string,
  includeSound?: boolean
}) => {
  const isVeo = params.modelId === 'veo';
  const isKling = params.modelId === 'kling'; // ПРОВЕРКА НА КЛИНГ
  
  // Выбор эндпоинта: Veo идет на свой, остальные (Sora/Kling) на createTask
  const endpoint = isVeo ? ENDPOINTS.VEO_GENERATE : ENDPOINTS.KLING_GENERATE;
  
  let payload: any = {};

  if (isVeo) {
    // ЛОГИКА VEO (Массив ссылок)
    const urls = params.imageUrl ? params.imageUrl.split(',').filter(u => u.trim()) : [];
    let genType = 'TEXT_2_VIDEO';
    if (params.method === 'reference' && urls.length > 0) genType = 'REFERENCE_2_VIDEO';
    else if (params.method === 'start-end' && urls.length === 2) genType = 'FIRST_AND_LAST_FRAMES_2_VIDEO';

    payload = {
      model: 'veo3_fast',
      prompt: params.prompt || "Cinematic animation",
      aspect_ratio: params.aspectRatio === 'auto' ? '9:16' : params.aspectRatio,
      seeds: Math.floor(Math.random() * 100000),
      generationType: genType,
      imageUrls: urls,
      watermark: 'VidiAI'
    };

  } else if (isKling) {
    // НОВАЯ ЛОГИКА KLING 2.1 STANDARD
    payload = {
      model: 'kling/v2-1-standard',
      input: {
        "prompt": params.prompt,
        "image_url": params.imageUrl || "", // Kling 2.1 ждет одну строку
        "duration": params.duration || "5", // У этой версии фиксировано 5 сек
        "negative_prompt": "blur, distort, and low quality",
        "cfg_scale": 0.5
      }
    };

  } else if (params.modelId === 'sora-2') {
    // ЛОГИКА SORA 2
    const isImageMode = params.method !== 'text' && params.imageUrl;
    const soraRatio = params.aspectRatio === '9:16' ? 'portrait' : 'landscape';

    payload = {
      model: isImageMode ? 'sora-2-image-to-video' : 'sora-2-text-to-video',
      input: {
        "prompt": params.prompt,
        "aspect_ratio": soraRatio,
        "n_frames": params.duration, 
        "sound": true,
        ...(isImageMode && { "image_urls": params.imageUrl?.split(',') })
      }
    };
  }

  // ОТПРАВКА ЗАПРОСА
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIE_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  const taskId = result.data?.taskId || result.data?.jobId || result.data;

  if (!taskId || (typeof taskId !== 'string' && typeof taskId !== 'number')) {
    if (result.code === 402) throw new Error("Недостатньо кредитів на Kie.ai.");
    throw new Error(result.message || 'Failed to create task');
  }
  
  // ПРОВЕРЯЕМ: если запрос шел на VEO_GENERATE, только тогда добавляем префикс
  const finalId = endpoint === ENDPOINTS.VEO_GENERATE ? `veo_${taskId}` : taskId;

  return finalId;
}

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
  '1': 50,            // Видео 10 сек + звук
  '2': 50,            // Видео 5 сек
  '3': 50,
  '4': 50,
  '5': 50,
  
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

  // Цены для Kling 2.1
  'kling': 20,

  // Запасной вариант
  'default': 30
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

// Шаблон №2: 
export const generateTemplate2 = async (prompt: string, imageUrl: string) => {
  return baseGenerateKling({
    model: 'kling-2.6/motion-control',
    input: {
      "prompt": prompt,
      "input_urls": [imageUrl],
      "video_urls": ["https://server.vidiai.top/uploads/videos/dancing-trend-1.mp4"],
      "character_orientation": "video",
      "mode": "720p"
    }
  });
};

// 1. Создаем карту соответствия (какой ID какой функцией генерируется)
const templateActions: Record<string, (prompt: string, imageUrl: string) => Promise<string>> = {
  '1': generateTemplate1, // Первый шаблон — 10 сек + звук
  '2': generateTemplate2, // Второй шаблон — 5 сек без звука
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
  title: string, // Просто принимаем строку
  tgId: number, 
  imageUrl: string | null, 
  aspectRatio: string,
  contentType: string = 'video'
) => {
  try {
    const cleanId = taskId.replace('music_', '').replace('veo_', '');
    const baseUrl = import.meta.env.VITE_SERVER_BASE_URL; // Используем твой env

    await fetch(`${baseUrl}/save_media.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        task_id: cleanId, 
        prompt, 
        title: title, // Сюда прилетит готовое имя, например "Трендовий танець #1"
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

  // 1. Очищаем ID от префиксов
  const cleanTaskId = taskId.replace('music_', '').replace('veo_', '').trim();

  // 2. Выбор эндпоинта строго из .env с защитой от "ложного veo"
  let endpoint = '';

  if (isMusicTask) {
    endpoint = ENDPOINTS.MUSIC_STATUS;
  } else if (isVeoTask && cleanTaskId.length < 30) {
    // Если это реально короткий ID от Veo
    endpoint = ENDPOINTS.VEO_STATUS;
  } else {
    // Для Kling (af301...) и Nano Banana всегда используем этот путь
    endpoint = ENDPOINTS.KLING_STATUS;
  }

  // ДИАГНОСТИКА: Проверь, что теперь здесь .../jobs/recordInfo
  console.log(`[ROUTING] Using Endpoint: ${endpoint} for ID: ${cleanTaskId}`);

  try {
    const response = await fetch(`${endpoint}?taskId=${cleanTaskId}`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'Accept': 'application/json'
      }
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
      // 1. Сначала ищем в стандартных полях
      let rawUrl = data.response?.resultUrls || data.resultUrl || data.url || data.videoUrl || data.imageUrl || null;
      
      // 2. Резервная проверка через resultJson (Критично для Kling 2.6 / Motion Control и старых моделей)
      if (!rawUrl && data.resultJson) {
        try {
          const parsed = JSON.parse(data.resultJson);
          // Достаем массив или строку из любых возможных полей внутри JSON
          rawUrl = parsed.resultUrls || parsed.url || null;
        } catch (e) {
          console.error("Помилка парсингу resultJson:", e);
        }
      }
      
      // 3. Финальная очистка: если получили массив — берем первый элемент, если строку — берем её
      let finalUrl = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;
      
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
