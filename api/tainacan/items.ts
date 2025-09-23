// api/tainacan/items.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

// Proxy para a API do Tainacan
const TAINACAN_API = 'https://tainacan.ufsm.br/acervo-artistico/wp-json/tainacan/v2/items';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { collection, page = 1, perpage = 36 } = req.query;
    if (!collection) {
      res.status(400).json({ error: 'Missing collection id' });
      return;
    }
    // Monta a URL da API do Tainacan
    const url = `${TAINACAN_API}?collection_id=${collection}&page=${page}&perpage=${perpage}`;
    const upstream = await fetch(url);
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Upstream error: ${upstream.statusText}` });
      return;
    }
    const data = await upstream.json();
    // Libera CORS para o navegador aceitar
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
    // Cache razoável (opcional)
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || e });
  }
}
