const KIE_API_KEY = import.meta.env.VITE_KIE_API_KEY;

const ENDPOINTS = {
  KLING_GENERATE: import.meta.env.VITE_KLING_GENERATE_URL,
  KLING_STATUS: import.meta.env.VITE_KLING_STATUS_URL,
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

// --- РЕЕСТР СТОИМОСТИ (легко менять здесь) ---
export const TEMPLATE_COSTS: Record<string, number> = {
  '1': 25,      // Видео 10 сек + звук = 25 кредитов
  '2': 10,      // Видео 5 сек = 10 кредитов
  'default': 15 // Свободная генерация = 15 кредитов
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

// 2. Создаем одну универсальную функцию-диспетчер
export const generateByTemplateId = async (templateId: string, prompt: string, imageUrl: string) => {
  // Ищем функцию по ID. Если ID нет в списке — берем стандартный generateTemplate2
  const action = templateActions[templateId] || generateTemplate2;
  return await action(prompt, imageUrl);
};

// --- ЭКСПОРТЫ ДЛЯ ШАБЛОНОВ: КОНЕЦ ---

export const updateVideoInDb = async (taskId: string, status: string, videoUrl: string | null) => {
  try {
    await fetch('https://server.vidiai.top/api/update_video_status.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, status, video_url: videoUrl }),
    });
  } catch (error) {
    console.error("Ошибка БД:", error);
  }
};

export const saveVideoToHistory = async (taskId: string, prompt: string, title: string, tgId: number, imageUrl: string | null, aspectRatio: string) => {
  try {
    await fetch('https://server.vidiai.top/api/save_media.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, prompt, title, telegram_id: tgId, imageUrl, aspectRatio }),
    });
  } catch (error) {
    console.error("Ошибка сохранения:", error);
  }
};

export const getTaskStatus = async (taskId: string) => {
  const response = await fetch(`${ENDPOINTS.KLING_STATUS}?taskId=${taskId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${KIE_API_KEY}` }
  });
  const result = await response.json();
  if ((result.code === 200 || result.code === 0) && result.data) {
    const data = result.data;
    let videoUrl = null;
    if (data.resultJson) {
      const parsed = JSON.parse(data.resultJson);
      videoUrl = parsed.resultUrls?.[0] || null;
    }
    return {
      status: data.state === 'success' || data.state === 'completed' ? 'succeeded' : data.state, 
      video_url: videoUrl
    };
  }
  return { status: 'error' };
};

export const getUserHistory = async () => {
  const response = await fetch(`${import.meta.env.VITE_SERVER_BASE_URL}/get_history.php`);
  const result = await response.json();
  return result.status === 'success' ? result.videos : [];
};
