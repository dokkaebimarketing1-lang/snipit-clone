// Content script — runs on Meta Ads Library and Instagram pages

const SNIPIT_URL = "https://snipit-clone.vercel.app";
const CONTRIBUTION_DEBOUNCE_MS = 1200;
const CONTRIBUTION_SEND_INTERVAL_MS = 10000;
const sentAdIds = new Set();
let contributionDebounceTimer = null;
let lastContributeSentAt = 0;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getAdData") {
    const data = extractAdData();
    sendResponse({ data });
  }
  return true;
});

function extractAdData() {
  const url = window.location.href;

  if (url.includes("facebook.com/ads/library")) {
    return extractMetaAdData();
  }
  if (url.includes("instagram.com")) {
    return extractInstagramData();
  }

  return null;
}

function extractMetaAdData() {
  try {
    const pageTitle = document.querySelector('[role="heading"]')?.textContent || "";
    const images = Array.from(document.querySelectorAll("img[src*='scontent']")).map((img) => img.src);
    const adTexts = Array.from(document.querySelectorAll('[data-testid="ad_creative_body"]')).map((el) => el.textContent);

    return {
      platform: "meta",
      brandName: pageTitle,
      imageUrl: images[0] || null,
      copyText: adTexts[0] || null,
      externalUrl: window.location.href,
      mediaType: "photo",
    };
  } catch {
    return null;
  }
}

function extractInstagramData() {
  try {
    const images = Array.from(document.querySelectorAll('article img[src*="instagram"]')).map((img) => img.src);
    const username = document.querySelector('header a[href*="/"]')?.textContent || "";

    return {
      platform: "instagram",
      brandName: username,
      imageUrl: images[0] || null,
      copyText: null,
      externalUrl: window.location.href,
      mediaType: "photo",
    };
  } catch {
    return null;
  }
}

function extractVisibleAds() {
  const bodyText = document.body.innerText || "";
  const blocks = bodyText.split(/(?=라이브러리 ID:)/);
  const ads = [];
  const images = Array.from(document.querySelectorAll("img"))
    .filter((img) => img.src && img.src.includes("scontent") && img.naturalWidth > 100 && img.naturalHeight > 100)
    .map((img) => img.src.replace(/stp=dst-jpg_s\d+x\d+[^&]*/g, "stp=dst-jpg_s600x600"));
  let imgIdx = 0;

  for (const block of blocks) {
    const idMatch = block.match(/라이브러리 ID:\s*(\d+)/);
    if (!idMatch) continue;

    const externalId = idMatch[1];
    const dateMatch = block.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
    const startedAt = dateMatch ? dateMatch[0] : null;
    const status = /활성|Active/i.test(block) && !/비활성|Inactive/i.test(block) ? "active" : "inactive";

    let brandName = "";
    const afterDetail = block.split(/광고 상세 정보 보기/);
    if (afterDetail.length > 1) {
      const lines = afterDetail[1].split("\n").map((line) => line.trim()).filter(Boolean);
      brandName = lines[0] || "";
    }
    if (!brandName) {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(
          (line) =>
            line.length > 1
            && line.length < 40
            && !line.includes("라이브러리")
            && !line.includes("플랫폼")
            && !line.includes("게재")
        );
      brandName = lines[0] || "";
    }

    const textLines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.length > 20
          && !line.includes("라이브러리 ID")
          && !line.includes("플랫폼")
          && !line.includes("게재 시작")
      );

    const copyText = textLines.slice(0, 3).join(" ");
    const platform = /instagram|인스타/i.test(block) ? "instagram" : "meta";

    ads.push({
      external_id: externalId,
      brand_name: brandName || "Unknown",
      copy_text: copyText || null,
      image_url: images[imgIdx] || null,
      platform,
      status,
      started_at: startedAt,
      country: "KR",
      source: "extension",
    });
    imgIdx += 1;
  }

  return ads;
}

async function autoCollectAds() {
  if (!window.location.href.includes("facebook.com/ads/library")) return;

  const { contributeEnabled } = await chrome.storage.local.get("contributeEnabled");
  if (!contributeEnabled) return;

  const now = Date.now();
  if (now - lastContributeSentAt < CONTRIBUTION_SEND_INTERVAL_MS) return;

  const ads = extractVisibleAds();
  const unsentAds = ads.filter((ad) => ad.external_id && !sentAdIds.has(ad.external_id));
  if (unsentAds.length === 0) return;

  const batch = unsentAds.slice(0, 50);

  try {
    lastContributeSentAt = now;
    const response = await fetch(`${SNIPIT_URL}/api/crawl/contribute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ads: batch }),
    });

    if (!response.ok) return;

    batch.forEach((ad) => {
      sentAdIds.add(ad.external_id);
    });

    const payload = await response.json().catch(() => ({}));
    const addedCount = typeof payload.saved === "number" ? payload.saved : batch.length;
    const storage = await chrome.storage.local.get("contributeCount");
    const currentCount = Number(storage.contributeCount) || 0;
    await chrome.storage.local.set({ contributeCount: currentCount + addedCount });
  } catch {
    // Ignore contribution errors to avoid disrupting browsing
  }
}

function scheduleAutoCollect() {
  if (contributionDebounceTimer) {
    clearTimeout(contributionDebounceTimer);
  }

  contributionDebounceTimer = setTimeout(() => {
    autoCollectAds();
  }, CONTRIBUTION_DEBOUNCE_MS);
}

function startAutoCollectObserver() {
  if (!window.location.href.includes("facebook.com/ads/library")) return;

  const observer = new MutationObserver(() => {
    scheduleAutoCollect();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("scroll", scheduleAutoCollect, { passive: true });
  scheduleAutoCollect();
}

// Inject save button on Meta Ads Library
function injectSaveButton() {
  if (!window.location.href.includes("facebook.com/ads/library")) return;

  const observer = new MutationObserver(() => {
    const adCards = document.querySelectorAll('[class*="ad"]');
    adCards.forEach((card) => {
      if (card.querySelector(".snipit-save-btn")) return;

      const btn = document.createElement("button");
      btn.className = "snipit-save-btn";
      btn.textContent = "스니핏에 저장";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        chrome.runtime.sendMessage({ action: "openPopup" });
      });
      card.appendChild(btn);
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Initialize
injectSaveButton();
startAutoCollectObserver();
