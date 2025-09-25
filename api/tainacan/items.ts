// api/tainacan/items.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

// Proxy para a API do Tainacan
const TAINACAN_API = 'https://tainacan.ufsm.br/acervo-artistico/wp-json/tainacan/v2/items';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { collection, page = 1, perpage = 36, search } = req.query;
    if (!collection) {
      res.status(400).json({ error: 'Missing collection id' });
      return;
    }
  // Monta a URL da API do Tainacan
  // O endpoint do Tainacan usa o parâmetro 'paged' para navegação (não 'page'),
  // portanto reencaminhamos 'page' do cliente como 'paged' para o upstream.
  let url = `${TAINACAN_API}?collection_id=${collection}&paged=${page}&perpage=${perpage}`;
    // Log para debugging local - mostra qual URL estamos chamando no upstream
    console.log('[api/tainacan/items] upstream url ->', url);
    if (search) {
      url += `&search=${encodeURIComponent(search as string)}`;
    }
    const upstream = await fetch(url);
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Upstream error: ${upstream.statusText}` });
      return;
    }

  // Repassar os headers de paginação para o cliente
    res.setHeader('x-wp-total', upstream.headers.get('x-wp-total') || '0');
    res.setHeader('x-wp-totalpages', upstream.headers.get('x-wp-totalpages') || '0');
  // Expor cabeçalhos de paginação e nosso cabeçalho debug local
  res.setHeader('Access-Control-Expose-Headers', 'x-wp-total, x-wp-totalpages, x-upstream-url');
  // Header auxiliar de debug local para inspecionar qual URL foi usada upstream
  res.setHeader('x-upstream-url', url);

    const data = await upstream.json();
    // Libera CORS para o navegador aceitar
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  // Desabilita cache no proxy durante o desenvolvimento para evitar respostas stale
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || e });
  }
}
