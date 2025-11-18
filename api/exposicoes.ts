import type { VercelRequest, VercelResponse } from '@vercel/node';
import { promises as fs } from 'fs';
import path from 'path';

const EXPOS_PATH = path.resolve(process.cwd(), 'public', 'exposicoes');

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        const names = await fs.readdir(EXPOS_PATH);
        const jsons = names.filter((n) => n.toLowerCase().endsWith('.json'));

        const exposicoes = await Promise.all(
          jsons.map(async (file) => {
            try {
              const content = await fs.readFile(path.join(EXPOS_PATH, file), 'utf-8');
              const json = JSON.parse(content);
              return {
                id: file.replace(/\.json$/i, ''),
                name: json.name || json.title || file.replace(/\.json$/i, ''),
                description: json.description || '',
                fileName: file,
                createdAt: json.createdAtIso || json.createdAt || '',
                author: json.author || null,
                status: 'published',
              };
            } catch (e) {
              return null;
            }
          })
        );

        res.status(200).json(exposicoes.filter(Boolean));
        return;
      } catch (e) {
        res.status(500).json({ error: 'Failed to read exposicoes folder' });
        return;
      }
    }

    // /api/exposicoes/:id or /api/exposicoes?id={id}
    const expoMatch =
      url.pathname.match(/^\/api\/exposicoes\/([^\/]+)$/) ||
      (url.pathname === '/api/exposicoes' && url.searchParams.get('id')
        ? ['/api/exposicoes', url.searchParams.get('id') as string]
        : null);
    if (expoMatch && req.method === 'GET') {
      const id = expoMatch[1];
      const fileName = `${id}.json`;
      try {
        const content = await fs.readFile(path.join(EXPOS_PATH, fileName), 'utf-8');
        const json = JSON.parse(content);
        const metadata = {
          id,
          name: json.name || id,
          description: json.description || '',
          fileName,
          createdAt: json.createdAtIso || json.createdAt || '',
        };
        res.status(200).json({ metadata, data: json });
        return;
      } catch (e) {
        res.status(404).json({ error: 'Exposição não encontrada' });
        return;
      }
    }

    // POST /api/exposicoes/save or /api/exposicoes?action=save
    if (
      (url.pathname === '/api/exposicoes/save' ||
        (url.pathname === '/api/exposicoes' && url.searchParams.get('action') === 'save')) &&
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

      const outfile = path.join(EXPOS_PATH, metadata.fileName);
      try {
        // Se o 'data' é texto JSON, vamos parsear para poder injetar metadata
        let parsed = null;
        if (typeof data === 'string') {
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            // não é JSON válido, grava como texto cru
            parsed = null;
          }
        } else if (typeof data === 'object') {
          parsed = data;
        }

        // Se for JSON, mesclar meta
        if (parsed && typeof parsed === 'object') {
          parsed.name = metadata.name || parsed.name || metadata.fileName.replace(/\.json$/i, '');
          parsed.createdAtIso = metadata.createdAt || parsed.createdAtIso || new Date().toISOString();
          if (metadata.description) parsed.description = metadata.description;
          if (metadata.author) parsed.author = metadata.author;
          await fs.writeFile(outfile, JSON.stringify(parsed, null, 2), 'utf-8');
        } else {
          const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
          await fs.writeFile(outfile, content, 'utf-8');
        }
        // Also write a metadata file to accompany the data if needed
        const expoMeta = {
          name: metadata.name,
          createdAtIso: metadata.createdAt || new Date().toISOString(),
          author: metadata.author || null,
          ...(metadata.description ? { description: metadata.description } : {}),
        };
        // We do not store metadata separately to keep JSON file self-contained
        res.status(200).json({ ok: true });
        return;
      } catch (e) {
        res.status(500).json({ error: 'Failed to save file' });
        return;
      }
    }

    // DELETE /api/exposicoes/:id
    if (expoMatch && req.method === 'DELETE') {
      const id = expoMatch[1];
      const fileName = `${id}.json`;
      try {
        await fs.unlink(path.join(EXPOS_PATH, fileName));
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
