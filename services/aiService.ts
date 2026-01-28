// Константы теперь берем из .env
const KIE_API_KEY = import.meta.env.VITE_KIE_API_KEY;

const ENDPOINTS = {
  KLING_GENERATE: import.meta.env.VITE_KLING_GENERATE_URL,
  KLING_STATUS: import.meta.env.VITE_KLING_STATUS_URL,
};

// Функция для сохранения задачи в твою БД
export const saveVideoToHistory = async (taskId: string, prompt: string, title: string) => {
  try {
    const response = await fetch('https://server.vidiai.top/api/save_video.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task_id: taskId,
        prompt: prompt,
        title: title // Передаем название шаблона сюда
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("Ошибка сохранения в историю:", error);
    throw error;
  }
};

export const getUserHistory = async () => {
  const response = await fetch(`${import.meta.env.VITE_SERVER_BASE_URL}/get_history.php`);
  const result = await response.json();
  
  if (result.status === 'success') {
    return result.videos; // Возвращаем массив видео из базы
  }
  return [];
};

export const generateVideo = async (params: { 
  prompt: string, 
  imageUrl?: string, 
  modelType?: 'kling' | 'other'
}) => {
  
  if (!params.modelType || params.modelType === 'kling') {
    const response = await fetch(ENDPOINTS.KLING_GENERATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'kling/v2-1-standard',
        input: {
          "prompt": params.prompt,
          "image_url": params.imageUrl || "", 
          "duration": "5"
        }
      })
    });
    
    const result = await response.json();

    // Извлекаем ID задачи
    const taskId = result.data?.taskId || result.data?.jobId;

    if (!taskId) {
      if (result.code === 402) {
          throw new Error("Недостатньо кредитів на Kie.ai. Будь ласка, поповніть рахунок.");
      }
      throw new Error(result.message || result.msg || 'Failed to create task');
    }
    
    return taskId; 
  }
};

export const getTaskStatus = async (taskId: string) => {
  const response = await fetch(`${ENDPOINTS.KLING_STATUS}?taskId=${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${KIE_API_KEY}`
    }
  });

  const result = await response.json();
  
  if ((result.code === 200 || result.code === 0) && result.data) {
    const data = result.data;
    let videoUrl = null;

    if (data.resultJson) {
      try {
        const parsedResult = JSON.parse(data.resultJson);
        videoUrl = parsedResult.resultUrls?.[0] || null;
      } catch (e) {
        console.error("Ошибка парсинга resultJson:", e);
      }
    }

    return {
      // Маппинг статусов для твоего Generator.tsx
      status: data.state === 'success' || data.state === 'completed' ? 'succeeded' : data.state, 
      video_url: videoUrl
    };
  }
  
  return { status: 'error' };
};
