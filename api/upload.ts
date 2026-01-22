import type { VercelRequest, VercelResponse } from '@vercel/node';
import FormData from 'form-data';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false, // Обязательно для передачи файлов
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Исправляем CORS: разрешаем запросы с твоего фронтенда
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // В Vercel лучше использовать стандартный поток данных для пересылки
    const externalResponse = await axios.post('https://server.vidiai.top/api/save_file.php', req, {
      headers: {
        'content-type': req.headers['content-type'],
      },
    });

    // Возвращаем фронтенду то, что ответил PHP скрипт (ссылку на файл)
    return res.status(200).json(externalResponse.data);
  } catch (error: any) {
    console.error('Upload error:', error.message);
    return res.status(500).json({ error: 'Failed to upload to main server' });
  }
}
