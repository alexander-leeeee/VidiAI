const KIE_API_KEY = 'da0d7cfd03a440fa71bf1701dae4ee6f';
const SERVER_URL = 'https://vidiai.top';

// Перечень доступных URL для разных задач
const ENDPOINTS = {
  KLING_GENERATE: 'https://api.kie.ai/api/v1/jobs/createTask',
  KLING_STATUS: 'https://api.kie.ai/api/v1/jobs/getTask',
  // Сюда можно будет добавить другие сервисы
};

export const generateVideo = async (params: { 
  prompt: string, 
  image?: { data: string, mimeType: string },
  modelType?: 'kling' | 'other' // Добавляем переключатель
}) => {
  
  // Логика для Kie.ai (Kling)
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
          "image_urls": [ `data:${params.image?.mimeType};base64,${params.image?.data}` ],
          "duration": "5"
        }
      })
    });
    const result = await response.json();
    return result.taskId;
  }

  // Здесь можно добавить блок else if для других URL/сервисов
};
