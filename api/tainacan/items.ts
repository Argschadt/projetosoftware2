// api/tainacan/items.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

// Proxy para a API do Tainacan
const TAINACAN_API = 'https://tainacan.ufsm.br/acervo-artistico/wp-json/tainacan/v2/items';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const path = url.pathname;

    if (path === '/api/tainacan/items') {
      // Handle main items list
      const { collection, page = 1, perpage = 36, search, fetch_only, order, orderby } = req.query;
      if (!collection) {
        res.status(400).json({ error: 'Missing collection id' });
        return;
      }
      let upstreamUrl = `${TAINACAN_API}?collection_id=${collection}&paged=${page}&perpage=${perpage}`;
      if (search) {
        upstreamUrl += `&search=${encodeURIComponent(search as string)}`;
      }
      if (fetch_only) {
        upstreamUrl += `&fetch_only=${fetch_only}`;
      }
      if (order) {
        upstreamUrl += `&order=${order}`;
      }
      if (orderby) {
        upstreamUrl += `&orderby=${orderby}`;
      }
      console.log('[api/tainacan/items] upstream url ->', upstreamUrl);
      const upstream = await fetch(upstreamUrl);
      if (!upstream.ok) {
        res.status(upstream.status).json({ error: `Upstream error: ${upstream.statusText}` });
        return;
      }
      res.setHeader('x-wp-total', upstream.headers.get('x-wp-total') || '0');
      res.setHeader('x-wp-totalpages', upstream.headers.get('x-wp-totalpages') || '0');
      res.setHeader('Access-Control-Expose-Headers', 'x-wp-total, x-wp-totalpages, x-upstream-url');
      res.setHeader('x-upstream-url', upstreamUrl);
      const data = await upstream.json();
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.status(200).json(data);
    } else if (path.match(/^\/api\/tainacan\/items\/(\d+)$/)) {
      // Handle individual item: /api/tainacan/items/{itemId}
      const match = path.match(/^\/api\/tainacan\/items\/(\d+)$/);
      if (match) {
        const itemId = match[1];
        const upstreamUrl = `${TAINACAN_API}/${itemId}`;
        console.log('[api/tainacan/items/{id}] upstream url ->', upstreamUrl);
        const upstream = await fetch(upstreamUrl);
        if (!upstream.ok) {
          res.status(upstream.status).json({ error: `Upstream error: ${upstream.statusText}` });
          return;
        }
        const data = await upstream.json();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.status(200).json(data);
      }
    } else if (path.match(/^\/api\/tainacan\/items\/(\d+)\/attachments$/)) {
      // Handle attachments: /api/tainacan/items/{itemId}/attachments
      const match = path.match(/^\/api\/tainacan\/items\/(\d+)\/attachments$/);
      if (match) {
        const itemId = match[1];
        const { perpage = 5 } = req.query;
        const upstreamUrl = `${TAINACAN_API}/${itemId}/attachments?perpage=${perpage}`;
        console.log('[api/tainacan/items/attachments] upstream url ->', upstreamUrl);
        const upstream = await fetch(upstreamUrl);
        if (!upstream.ok) {
          res.status(upstream.status).json({ error: `Upstream error: ${upstream.statusText}` });
          return;
        }
        const data = await upstream.json();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.status(200).json(data);
      }
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (e: any) {
    res.status(500).json({ error: e?.message || e });
  }
}
