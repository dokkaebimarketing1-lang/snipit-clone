// Content script — runs on Meta Ads Library and Instagram pages

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
  } else if (url.includes("instagram.com")) {
    return extractInstagramData();
  }

  return null;
}

function extractMetaAdData() {
  try {
    // Extract ad info from Meta Ads Library page
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
    // Extract post info from Instagram
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
