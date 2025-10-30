// api/tainacan/filters.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

const TAINACAN_API_BASE = 'https://tainacan.ufsm.br/acervo-artistico/wp-json/tainacan/v2';
const COLLECTION_ID = 2174;
const PER_PAGE = 100; // Fetch 100 items per request

interface ApiResponse {
  items?: Array<{ metadata?: Record<string, { value?: unknown }> }>;
}

async function fetchAllItems(res: VercelResponse) {
  let allItems: Array<{ metadata?: Record<string, { value?: unknown }> }> = [];
  
  // 1. Fetch the first page to get total pages from headers
  const firstPageUrl = `${TAINACAN_API_BASE}/items?collection_id=${COLLECTION_ID}&perpage=${PER_PAGE}&page=1`;
  console.log('Fetching first page:', firstPageUrl);
  const firstPageResponse = await fetch(firstPageUrl);

  if (!firstPageResponse.ok) {
    console.error(`Failed to fetch first page: ${firstPageResponse.statusText}`);
    res.status(firstPageResponse.status).json({ error: `Failed to fetch initial data: ${firstPageResponse.statusText}` });
    return null;
  }

  const firstPageJson = (await firstPageResponse.json()) as ApiResponse;
  // O endpoint retorna um objeto com propriedade `items` contendo o array
  const firstPageItems = Array.isArray(firstPageJson.items) ? firstPageJson.items : [];
  allItems = allItems.concat(firstPageItems);

  const totalPages = parseInt(firstPageResponse.headers.get('x-wp-totalpages') || '1', 10);
  console.log(`Total pages to fetch: ${totalPages}`);

  if (totalPages <= 1) {
    return allItems;
  }

  // 2. Create an array of promises for the remaining pages
  const pagePromises: Promise<unknown>[] = [];
  for (let currentPage = 2; currentPage <= totalPages; currentPage++) {
    const pageUrl = `${TAINACAN_API_BASE}/items?collection_id=${COLLECTION_ID}&perpage=${PER_PAGE}&page=${currentPage}`;
    console.log(`Adding page to promise queue: ${currentPage}`);
    pagePromises.push(fetch(pageUrl).then(response => {
      if (!response.ok) {
        console.warn(`Skipping failed page ${currentPage}: ${response.statusText}`);
        return {}; // Return empty object for failed pages
      }
      return response.json();
    }));
  }

  // 3. Execute all promises in parallel
  try {
    const remainingPagesResults = await Promise.all(pagePromises);
    for (const pageJsonRaw of remainingPagesResults) {
      const pageJson = pageJsonRaw as ApiResponse;
      const items = Array.isArray(pageJson.items) ? pageJson.items : [];
      allItems = allItems.concat(items);
    }
  } catch (error) {
    console.error('Error fetching subsequent pages:', error);
    // Return whatever we have managed to fetch so far
  }
  
  console.log(`Total items fetched: ${allItems.length}`);
  return allItems;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const allItems = await fetchAllItems(res);

    if (!allItems) {
      // fetchAllItems already handled the response
      return;
    }

    const authors = new Set<string>();
    const dates = new Set<string>();
    const types = new Set<string>();

    for (const item of allItems) {
      const metadata = (item.metadata || {}) as Record<string, { value?: unknown }>;

      const author = (metadata['taxonomia']?.value as Array<{ name: string }>)?.[0]?.name;
      if (author) {
        authors.add(author);
      }
      
      const dateValue = metadata['data-da-obra-2']?.value;
      if (dateValue) {
        dates.add(String(dateValue));
      }
      
      const typeName = (metadata['tecnica-3']?.value as { name?: string })?.name;
      if (typeName) {
        types.add(typeName);
      }
    }

    const sortedAuthors = Array.from(authors).sort();
    const sortedDates = Array.from(dates).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const sortedTypes = Array.from(types).sort();
    
    console.log(`Found unique authors: ${sortedAuthors.length}, dates: ${sortedDates.length}, types: ${sortedTypes.length}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    res.status(200).json({
      authors: sortedAuthors,
      dates: sortedDates,
      types: sortedTypes,
    });

  } catch (e) {
    const error = e as { message?: string };
    console.error('Error in filters handler:', e);
    res.status(500).json({ error: `Failed to process filter options: ${error?.message || String(e)}` });
  }
}
