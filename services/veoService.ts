const KIE_API_KEY = 'da0d7cfd03a440fa71bf1701dae4ee6f';

const ENDPOINTS = {
  KLING_GENERATE: 'https://api.kie.ai/api/v1/jobs/createTask',
  KLING_STATUS: 'https://api.kie.ai/api/v1/jobs/recordInfo',
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
          "image_url": params.imageUrl ? [params.imageUrl] : [], 
          "duration": "5"
        }
      })
    });
    
    const result = await response.json();

    // 1. Извлекаем ID именно из data.taskId
    const taskId = result.data?.taskId;

    // 2. Если ID нет — обрабатываем ошибку
    if (!taskId) {
      console.error("Kie.ai Full Error Response:", result);
      
      // Специальное сообщение для ошибки баланса (402)
      if (result.code === 402) {
          throw new Error("Недостаточно кредитов на Kie.ai. Пожалуйста, пополните счет.");
      }
      
      throw new Error(result.message || result.error || 'Failed to create task');
    }
    
    // 3. ВОЗВРАЩАЕМ ПРАВИЛЬНУЮ ПЕРЕМЕННУЮ
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
  
  if (result.code === 200 && result.data) {
    const data = result.data;
    let videoUrl = null;

    // Распаковываем resultJson, так как Kie.ai присылает его строкой
    if (data.resultJson) {
      try {
        const parsedResult = JSON.parse(data.resultJson);
        videoUrl = parsedResult.resultUrls?.[0] || null;
      } catch (e) {
        console.error("Ошибка парсинга resultJson:", e);
      }
    }

    return {
      // Маппинг: твой Generator.tsx ждет 'succeeded', а Kie.ai шлет 'success'
      status: data.state === 'success' ? 'succeeded' : data.state, 
      video_url: videoUrl
    };
  }
  
  return { status: 'error' };
};
