# BE-09: The Polite Scraper

A small, polite scraping pipeline that collects 60 books from [Books to Scrape](https://books.toscrape.com) — a public practice sandbox — and turns messy HTML into clean, validated JSON.

## Target Classification
- **Site**: books.toscrape.com — a sandbox built for scraping practice
- **Scope**: First 3 catalogue pages, 60 books
- **robots.txt**: No disallow rules for the paths we use
- **Data collected**: Title, price, availability, rating, description
- I will not reuse this code on another site without checking its rules and terms first.

## Run
```bash
npm install
node src/index.js
```

## How it works
- Fetches 3 catalogue pages, discovers 60 unique book URLs
- Fetches each book page with a 500ms delay between requests
- Sends an honest User-Agent header identifying this scraper
- Caches all HTML locally — reruns read from cache, not the network
- Validates every record against a Zod schema before storing
- Failed records go to `output/errors.json`, never into `output/books.json`
- Produces `output/run-report.json` at the end of every run

## Politeness rules
- User-Agent: `FlyRankInternshipA9/1.0`
- 500ms delay between real requests
- 10 second timeout per request
- Status code checked before parsing
- Cache used on reruns — site only feels it once

## Record schema
| Field | Type | Notes |
|---|---|---|
| title | string | Book title |
| product_url | string | Absolute URL |
| price_text | string | Raw e.g. £51.77 |
| price_gbp | number | Parsed float |
| availability_text | string | Raw availability |
| rating_text | string | e.g. Three |
| description | string/null | null if missing |
| source_page | string | Catalogue page URL |
| fetched_at | string | ISO timestamp |

## Sample run-report.json
```json
{
  "start_time": "2026-08-16T13:44:39.129Z",
  "duration_ms": 50997,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 0
}
```

## Ethics note
Always use an official API when one exists. Never bypass logins, paywalls, or blocks. Collect only what you need. This scraper only targets a public practice sandbox built for this exact purpose.

## Limitation
No retry logic on transient failures — a single timeout will mark a page as failed.