# CHROME EXTENSION

Standalone Manifest V3 Chrome Extension. Vanilla JS — no npm, no build step.

## OVERVIEW

Saves ads from Meta Ads Library and Instagram to snipit boards via the Next.js API.

## FILES

| File | Purpose |
|------|---------|
| `manifest.json` | Manifest V3 — permissions: activeTab, storage. Hosts: facebook.com/ads/library, instagram.com |
| `popup.html` | Extension popup UI (320px) — login, board selection, save button |
| `popup.js` | Popup logic — auth state from chrome.storage, board loading, save flow |
| `content.js` | Content script — extracts ad data from Meta/Instagram DOM, injects "스니핏에 저장" button |
| `background.js` | Service worker — message routing between popup and content scripts |
| `styles.css` | Popup + injected button styles. Brand gradient: `#334FFF → #687DFF` |
| `icons/` | Placeholder — needs 16x16, 48x48, 128x128 PNGs |

## DATA FLOW

```
Content Script (Meta/Instagram page)
  ↓ chrome.runtime.onMessage → extracts DOM data
Popup.js
  ↓ POST /api/save-ad with { boardId, adData }
Next.js API → Supabase
```

## CONFIGURATION

`popup.js` line 1: `const SNIPIT_URL = "http://localhost:3000"` — change for production.

## LOADING IN CHROME

1. `chrome://extensions/` → Developer Mode ON
2. "Load unpacked" → select this `chrome-extension/` folder
3. Pin extension in toolbar
