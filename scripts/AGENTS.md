# CRAWLING PIPELINE

Standalone Node.js scripts. Run locally (NOT on Vercel). Require Chrome with remote debugging.

## SCRIPTS

| Script | Purpose | Usage |
|--------|---------|-------|
| `scrape-meta-ads.mjs` | Crawl Meta Ad Library → extract ads → AVIF images → Supabase | `node scripts/scrape-meta-ads.mjs --connect --port=9333 올리브영 무신사` |
| `optimize-images.mjs` | Batch download+convert existing FB CDN URLs to AVIF | `node scripts/optimize-images.mjs --port=9333` |

## CRITICAL: --connect MODE ONLY

```bash
# 1. Launch Chrome with debugging (MUST use separate profile)
"C:\Program Files\Google\Chrome\Application\chrome.exe" \
  --remote-debugging-port=9333 \
  --user-data-dir="C:/Users/LGS_002/chrome-scraper" \
  --no-first-run "about:blank"

# 2. Run crawler
node scripts/scrape-meta-ads.mjs --connect --port=9333 키워드1 키워드2
```

- `--connect` = vanilla puppeteer (NOT puppeteer-extra)
- Headless/stealth = Facebook detects → 0 results
- Real Chrome = Facebook sees normal browser → full results

## SCRAPE-META-ADS.MJS FLOW

```
Connect to Chrome (port 9333)
  ↓ for each keyword:
  Navigate facebook.com/ads/library/?country=KR&q={keyword}
  ↓ Enable CDP Network interception
  ↓ Wait networkidle2 + 8s for JS rendering
  ↓ Extract ads via text parsing (라이브러리 ID: delimiter)
  ↓ Scroll 8 rounds (load more ads)
  ↓ For each ad image in CDP cache:
  ↓   Skip if <150px (logo, not creative)
  ↓   sharp → AVIF (quality:50, max 600x600)
  ↓   Upload to Supabase Storage (ad-images bucket)
  ↓ Upsert all ads to scraped_ads table
```

## FLAGS

| Flag | Purpose |
|------|---------|
| `--connect` | Connect to existing Chrome (required for Meta) |
| `--port=N` | Chrome debugging port (default 9333) |
| `--headful` | Show browser window (standalone mode) |
| `META_SCRAPER_MAX_ADS_PER_KEYWORD=N` | Override per-keyword limit (default 40, use 9999 for all) |

## WHY FACEBOOK CDN IMAGES BREAK

- FB CDN URLs contain expiration tokens (`oh=`, `oe=`)
- Expire within hours → broken images on site
- Solution: CDP intercepts during crawl → sharp AVIF → Supabase Storage (permanent)
- fetch() from server = 403 (FB blocks). CDP capture during page load = works.

## DEPS

`puppeteer`, `puppeteer-extra`, `puppeteer-extra-plugin-stealth` (stealth only for standalone mode), `sharp`, `@supabase/supabase-js`
