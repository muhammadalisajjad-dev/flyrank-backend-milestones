const axios = require('axios');
const cheerio = require('cheerio');
const { z } = require('zod');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://books.toscrape.com';
const USER_AGENT = 'FlyRankInternshipA9/1.0 (https://github.com/muhammadalisajjad-dev/flyrank-backend-milestones)';
const DELAY_MS = 500;

// ── Schema ────────────────────────────────────────────────────────
const BookSchema = z.object({
  title: z.string(),
  product_url: z.string().url(),
  price_text: z.string(),
  price_gbp: z.number(),
  availability_text: z.string(),
  rating_text: z.string(),
  description: z.string().nullable(),
  source_page: z.string().url(),
  fetched_at: z.string()
});

// ── Helpers ───────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function cachePathFor(url) {
  const safe = url.replace(/[^a-z0-9]/gi, '_').slice(0, 80);
  return path.join('cache', safe + '.html');
}

async function fetchPage(url) {
  const cachePath = cachePathFor(url);
  if (fs.existsSync(cachePath)) {
    console.log(`CACHE HIT: ${url}`);
    return fs.readFileSync(cachePath, 'utf8');
  }
  console.log(`FETCH: ${url}`);
  const res = await axios.get(url, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 10000
  });
  if (res.status !== 200) throw new Error(`Bad status ${res.status} for ${url}`);
  fs.writeFileSync(cachePath, res.data, 'utf8');
  await sleep(DELAY_MS);
  return res.data;
}

const ratingMap = { One:1, Two:2, Three:3, Four:4, Five:5 };

// ── Stage 2: discover catalogue pages ────────────────────────────
async function discoverBooks() {
  const bookUrls = [];
  let pageUrl = `${BASE_URL}/catalogue/page-1.html`;
  let pageCount = 0;

  while (pageUrl && pageCount < 3) {
    const html = await fetchPage(pageUrl);
    const $ = cheerio.load(html);
    pageCount++;

    $('article.product_pod h3 a').each((_, el) => {
      const href = $(el).attr('href').replace('../', '');
      bookUrls.push(`${BASE_URL}/catalogue/${href}`);
    });

    const nextHref = $('li.next a').attr('href');
    pageUrl = nextHref ? `${BASE_URL}/catalogue/${nextHref}` : null;
  }

  const unique = [...new Set(bookUrls)];
  console.log(`catalogue_pages=${pageCount}, discovered=${bookUrls.length}, unique_urls=${unique.length}`);
  return unique;
}

// ── Stage 3: extract raw record ───────────────────────────────────
async function extractBook(url, sourcePage) {
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const title = $('div.product_main h1').text().trim();
  const price_text = $('p.price_color').first().text().trim();
  const availability_text = $('p.availability').first().text().trim();
  const rating_text = $('p.star-rating').first().attr('class')?.replace('star-rating ', '') || '';
  const descEl = $('#product_description ~ p');
  const description = descEl.length ? descEl.text().trim() : null;

  return {
    title,
    product_url: url,
    price_text,
    price_gbp: parseFloat(price_text.replace('£', '')),
    availability_text,
    rating_text,
    description,
    source_page: sourcePage,
    fetched_at: new Date().toISOString()
  };
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  const goodBooks = [];
  const errors = [];
  let cacheHits = 0;
  let fetchCount = 0;
  let failedPages = 0;

  // patch fetchPage to count
  const origFetch = fetchPage;

  const bookUrls = await discoverBooks();

  for (const url of bookUrls) {
    try {
      const raw = await extractBook(url, url);
      const result = BookSchema.safeParse(raw);
      if (result.success) {
        goodBooks.push(result.data);
      } else {
        errors.push({ url, error: result.error.message, raw });
      }
    } catch (err) {
      console.error(`FAILED: ${url} — ${err.message}`);
      failedPages++;
      errors.push({ url, error: err.message });
    }
  }

  // deduplicate by product_url
  const seen = new Set();
  const deduped = goodBooks.filter(b => {
    if (seen.has(b.product_url)) return false;
    seen.add(b.product_url);
    return true;
  });

  fs.writeFileSync('output/books.json', JSON.stringify(deduped, null, 2));
  fs.writeFileSync('output/errors.json', JSON.stringify(errors, null, 2));

  const report = {
    start_time: new Date(startTime).toISOString(),
    duration_ms: Date.now() - startTime,
    valid_records: deduped.length,
    invalid_records: errors.filter(e => e.raw).length,
    failed_pages: failedPages,
  };
  fs.writeFileSync('output/run-report.json', JSON.stringify(report, null, 2));

  console.log('\n── Run Report ──');
  console.log(JSON.stringify(report, null, 2));
}

main().catch(console.error);