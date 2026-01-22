import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

export const config = {
  api: { bodyParser: false }, // Отключаем стандартный парсер для работы с файлами
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Разрешаем CORS (исправляем твою ошибку)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const form = formidable();

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Parse error' });

    const file = Array.isArray(files.photo) ? files.photo[0] : files.photo;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    try {
      // 2. Пересылаем файл на твой основной сервер vidiai.top
      const formData = new FormData();
      formData.append('photo', fs.createReadStream(file.filepath));

      const response = await axios.post('https://vidiai.top/api/save_file.php', formData, {
        headers: formData.getHeaders(),
      });

      // 3. Возвращаем фронтенду итоговую ссылку
      res.status(200).json(response.data);
    } catch (error) {
      res.status(500).json({ error: 'External server error' });
    }
  });
}
