import { promises as fs } from 'fs';
import path from 'path';

const EXPOS_PATH = path.resolve(process.cwd(), 'public', 'exposicoes');
const INDEX_FILE = path.join(EXPOS_PATH, 'index.json');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function readIndex() {
  const content = await fs.readFile(INDEX_FILE, 'utf-8');
  return JSON.parse(content);
}

async function writeIndex(data) {
  await fs.writeFile(INDEX_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export default async function handler(req, res) {
  try {
    setCors(res);

    // Basic CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }

    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathParts = url.pathname.replace(/^\//, '').split('/');

    // /api/exposicoes/list or /api/exposicoes?action=list
    if (
      url.pathname === '/api/exposicoes/list' ||
      (url.pathname === '/api/exposicoes' && url.searchParams.get('action') === 'list')
    ) {
      try {
        const exposicoes = await readIndex();
        res.status(200).json(exposicoes);
        return;
      } catch (e) {
        res.status(500).json({ error: 'Failed to read index' });
        return;
      }
    }

    // /api/exposicoes/:id or /api/exposicoes?id={id}
    const expoMatch =
      url.pathname.match(/^\/api\/exposicoes\/([^\/]+)$/) ||
      (url.pathname === '/api/exposicoes' && url.searchParams.get('id')
        ? ['/api/exposicoes', url.searchParams.get('id')]
        : null);
    if (expoMatch && req.method === 'GET') {
      const id = expoMatch[1];
      try {
        const exposicoes = await readIndex();
        const expo = exposicoes.find(e => e.id === id);
        if (!expo) {
          res.status(404).json({ error: 'Exposição não encontrada' });
          return;
        }
        // Para compatibilidade, retornar metadata e data
        res.status(200).json({
          metadata: expo,
          data: expo.data || expo // se não tiver data separada, usar o próprio objeto
        });
        return;
      } catch (e) {
        res.status(404).json({ error: 'Exposição não encontrada' });
        return;
      }
    }

    // POST /api/exposicoes/save or /api/exposicoes?action=save
    if (
      (url.pathname === '/api/exposicoes/save' ||
        (url.pathname === '/api/exposicoes' && (url.searchParams.get('action') === 'save' || req.method === 'POST'))) &&
      req.method === 'POST'
    ) {
      // Espera JSON: { metadata: { ... }, data: string or object }
      const body = req.body;
      if (!body) {
        return res.status(400).json({ error: 'Missing body' });
      }

      const metadata = body.metadata;
      const data = body.data;
      if (!metadata || !metadata.fileName) {
        return res.status(400).json({ error: 'Missing metadata or fileName' });
      }

      try {
        const exposicoes = await readIndex();

        // Parse data if it's a string
        let parsedData = null;
        if (typeof data === 'string') {
          try {
            parsedData = JSON.parse(data);
          } catch (e) {
            parsedData = null;
          }
        } else if (typeof data === 'object') {
          parsedData = data;
        }

        // Create the new exposition object
        const newExpo = {
          id: metadata.id,
          name: metadata.name,
          description: metadata.description || '',
          fileName: metadata.fileName,
          createdAt: metadata.createdAt || new Date().toISOString(),
          author: metadata.author || null,
          status: metadata.status || 'published',
          data: parsedData // Store the full data
        };

        // Add to array (replace if exists)
        const existingIndex = exposicoes.findIndex(e => e.id === metadata.id);
        if (existingIndex >= 0) {
          exposicoes[existingIndex] = newExpo;
        } else {
          exposicoes.push(newExpo);
        }

        await writeIndex(exposicoes);
        res.status(200).json({ ok: true });
        return;
      } catch (e) {
        res.status(500).json({ error: 'Failed to save' });
        return;
      }
    }

    // DELETE /api/exposicoes/:id
    if (expoMatch && req.method === 'DELETE') {
      const id = expoMatch[1];
      try {
        const exposicoes = await readIndex();
        const filtered = exposicoes.filter(e => e.id !== id);
        if (filtered.length === exposicoes.length) {
          res.status(404).json({ error: 'Exposição não encontrada' });
          return;
        }
        await writeIndex(filtered);
        res.status(200).json({ ok: true });
      } catch (e) {
        res.status(500).json({ error: 'Failed to delete' });
      }
      return;
    }

    res.status(404).json({ error: 'Not found' });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
