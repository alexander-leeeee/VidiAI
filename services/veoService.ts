const KIE_API_KEY = 'da0d7cfd03a440fa71bf1701dae4ee6f';

const ENDPOINTS = {
  KLING_GENERATE: 'https://api.kie.ai/api/v1/jobs/createTask',
  KLING_STATUS: 'https://api.kie.ai/api/v1/jobs/recordInfo',
};

export const generateVideo = async (params: { 
  prompt: string, 
  imageUrl?: string, // Меняем с image на imageUrl
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
        model: 'kling-2.6/image-to-video',
        input: {
          "prompt": params.prompt,
          // Передаем массив прямых ссылок, как требует API Kie.ai
          "image_urls": params.imageUrl ? [params.imageUrl] : [], 
          "sound": true,
          "duration": "10"
        }
      })
    });
    
    const result = await response.json();
    if (result.taskId) return result.taskId;
    throw new Error(result.error || 'Failed to create task');
  }
};

// Добавляем экспорт этой функции для проверки готовности видео
export const getTaskStatus = async (taskId: string) => {
  const response = await fetch(`${ENDPOINTS.KLING_STATUS}?taskId=${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${KIE_API_KEY}`
    }
  });
  return await response.json();
};
