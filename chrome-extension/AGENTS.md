# CHROME EXTENSION

Standalone Manifest V3 Chrome Extension. Vanilla JS — no npm, no build step.

## OVERVIEW

Saves ads from Meta Ads Library and Instagram to snipit boards via the Next.js API.
Separate from the crawling pipeline (scripts/) — this is for individual user saves.

## FILES

| File | Purpose |
|------|---------|
| `manifest.json` | Manifest V3 — permissions: activeTab, storage. Hosts: facebook.com, instagram.com |
| `popup.html/js` | Login, board selection, save button (320px popup) |
| `content.js` | Extracts ad data from Meta/Instagram DOM, injects "스니핏에 저장" button |
| `background.js` | Service worker — message routing |
| `styles.css` | Brand gradient: `#334FFF → #687DFF` |
| `icons/` | Placeholder — needs 16x16, 48x48, 128x128 PNGs |

## CONFIG

`popup.js` line 1: `const SNIPIT_URL = "http://localhost:3000"` — change for production (`https://snipit-clone.vercel.app`).

## LOADING

`chrome://extensions/` → Developer Mode → "Load unpacked" → this folder
