import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'veo-3.1-fast-generate-preview';

export const generateVideo = async (
  prompt: string, 
  aspectRatio: '16:9' | '9:16' = '9:16'
): Promise<string | null> => {
  
  // Directly use the environment variable. 
  // It is assumed the host sets process.env.API_KEY correctly.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    let operation = await ai.models.generateVideos({
      model: MODEL_NAME,
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    // Polling loop
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
      console.log('Generation status:', operation.metadata);
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!videoUri) {
      throw new Error("No video URI returned from API");
    }

    const downloadUrl = `${videoUri}&key=${process.env.API_KEY}`;
    
    const response = await fetch(downloadUrl);
    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Video generation failed:", error);
    throw error;
  }
};