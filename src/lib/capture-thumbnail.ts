import puppeteer, { type Browser, type Page } from "puppeteer-core";

export interface AdDetail {
  imageUrl: string | null;
  imageBuffer: Buffer | null;
  brandName: string | null;
  copyText: string | null;
  externalId: string | null;
  startedAt: string | null;
  platform: string | null;
  mediaType: string | null;
  status: string | null;
  ctaText: string | null;
  landingUrl: string | null;
}

async function getBrowser(): Promise<Browser> {
  // 1. Try local Chrome first
  try {
    return await puppeteer.connect({
      browserURL: "http://127.0.0.1:9333",
      defaultViewport: { width: 1280, height: 900 },
    });
  } catch { /* not available */ }

  // 2. Fallback: serverless chromium (Vercel)
  try {
    const chromium = (await import("@sparticuz/chromium")).default;
    return await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 900 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } catch { /* not available */ }

  throw new Error("No browser available");
}

function closeBrowser(browser: Browser) {
  try { browser.disconnect(); } catch { try { browser.close(); } catch { /* ignore */ } }
}

// --- YouTube ---
export async function captureYoutube(url: string): Promise<AdDetail> {
  const ytMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || url.match(/\/shorts\/([a-zA-Z0-9_-]+)/) || url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  const videoId = ytMatch ? ytMatch[1].split("?")[0] : null;
  return {
    imageUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null,
    imageBuffer: null,
    brandName: null,
    copyText: null,
    externalId: videoId,
    startedAt: null,
    platform: "youtube",
    mediaType: url.includes("/shorts/") ? "reels" : "video",
    status: "active",
    ctaText: null,
    landingUrl: null,
  };
}

// --- Meta Ads Library ---
async function captureMetaDetail(page: Page, url: string): Promise<AdDetail> {
  await page.goto(url, { waitUntil: "networkidle2", timeout: 25000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 4000));

  const parsed = await page.evaluate(() => {
    const text = document.body.innerText || "";
    const lines = text.split("\n").map((l: string) => l.replace(/\s+/g, " ").trim()).filter(Boolean);

    // External ID
    const idMatch = text.match(/라이브러리 ID:\s*(\d+)/);
    const externalId = idMatch ? idMatch[1] : null;

    // Platform
    const platformMatch = text.match(/플랫폼\s*:\s*(.+)/);
    const platformRaw = platformMatch ? platformMatch[1].trim() : "";

    // Started date
    const dateMatch = text.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
    const startedAt = dateMatch ? `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}` : null;

    // Status
    const isActive = /활성|Active/i.test(text) && !/비활성|Inactive/i.test(text);

    // Brand name
    let brandName = "";
    const afterDetail = text.split(/광고 상세 정보 보기/);
    if (afterDetail.length > 1) {
      const detailLines = afterDetail[1].split("\n").map((l: string) => l.trim()).filter(Boolean);
      brandName = detailLines[0] || "";
    }
    if (!brandName) {
      const candidates = lines.filter((l: string) => l.length > 1 && l.length < 40 && !l.includes("라이브러리") && !l.includes("플랫폼") && !l.includes("게재"));
      brandName = candidates[0] || "";
    }

    // Copy text
    const contentLines = lines.filter((l: string) => {
      if (/^라이브러리 ID\s*:/i.test(l)) return false;
      if (/^플랫폼\s*:/i.test(l)) return false;
      if (/^게재 시작\s*:/i.test(l)) return false;
      if (l.length < 20) return false;
      return true;
    });
    const copyText = contentLines.slice(0, 3).join(" ");

    // CTA
    const ctaCandidates = ["자세히 알아보기", "지금 구매하기", "더 알아보기", "신청하기", "가입하기", "다운로드", "설치", "연락하기", "예약하기", "문의하기"];
    const ctaText = ctaCandidates.find((c) => lines.some((l: string) => l.includes(c))) || null;

    // Landing URL
    let landingUrl: string | null = null;
    const anchors = Array.from(document.querySelectorAll("a[href]"));
    for (const a of anchors) {
      const href = (a as HTMLAnchorElement).href;
      try {
        const p = new URL(href);
        if (!p.hostname.endsWith("facebook.com") && !p.hostname.endsWith("fb.com") && !p.hostname.endsWith("instagram.com")) {
          landingUrl = href;
          break;
        }
        const redirect = p.searchParams.get("u");
        if (redirect) { landingUrl = redirect; break; }
      } catch { /* skip */ }
    }

    // Media type
    const hasVideo = /동영상|video/i.test(text);
    const hasCarousel = /슬라이드|carousel/i.test(text);

    // Detect platform from text
    let platform = "meta";
    if (platformRaw.toLowerCase().includes("instagram")) platform = "instagram";

    return {
      externalId,
      brandName,
      copyText,
      startedAt,
      status: isActive ? "active" : "inactive",
      platform,
      mediaType: hasVideo ? "video" : hasCarousel ? "carousel" : "photo",
      ctaText,
      landingUrl,
    };
  });

  // Capture image
  const imageBase64 = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img"))
      .filter((i): i is HTMLImageElement => i instanceof HTMLImageElement && i.naturalWidth > 150 && !!i.src && i.src.includes("scontent"))
      .sort((a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight);
    if (imgs.length === 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = imgs[0].naturalWidth;
    canvas.height = imgs[0].naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(imgs[0], 0, 0);
    try { return canvas.toDataURL("image/png").split(",")[1]; } catch { return null; }
  });

  let imageBuffer: Buffer | null = null;
  if (imageBase64) {
    imageBuffer = Buffer.from(imageBase64, "base64");
  } else {
    const screenshot = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 800, height: 600 } }) as Buffer;
    if (screenshot.length > 10000) imageBuffer = screenshot;
  }

  return {
    ...parsed,
    imageUrl: null,
    imageBuffer,
  };
}

// --- Instagram ---
async function captureInstagramDetail(page: Page, url: string): Promise<AdDetail> {
  await page.goto(url, { waitUntil: "networkidle2", timeout: 25000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 3000));

  const parsed = await page.evaluate(() => {
    const text = document.body.innerText || "";

    // Username (brand)
    let brandName = "";
    const headerLink = document.querySelector("header a[href*='/']");
    if (headerLink) brandName = headerLink.textContent?.trim() || "";
    if (!brandName) {
      const metaTitle = document.querySelector("meta[property='og:title']");
      if (metaTitle) {
        const content = metaTitle.getAttribute("content") || "";
        const match = content.match(/^(.+?)(?:\s+on\s+Instagram|\s*[-|])/);
        brandName = match ? match[1] : content.split(" ")[0];
      }
    }

    // Description
    const metaDesc = document.querySelector("meta[property='og:description']");
    const copyText = metaDesc?.getAttribute("content") || "";

    // Date
    const timeEl = document.querySelector("time[datetime]");
    const startedAt = timeEl?.getAttribute("datetime")?.split("T")[0] || null;

    return { brandName, copyText, startedAt };
  });

  // Capture image
  const imageBase64 = await page.evaluate(() => {
    const video = document.querySelector("article video") as HTMLVideoElement | null;
    if (video?.poster) {
      // Can't fetch poster cross-origin in evaluate, use img fallback
    }
    const imgs = Array.from(document.querySelectorAll("article img, [role='presentation'] img, main img"))
      .filter((i): i is HTMLImageElement =>
        i instanceof HTMLImageElement && i.naturalWidth > 200 && !!i.src &&
        !i.src.includes("profile") && !i.src.includes("avatar") && !i.src.includes("s150x150")
      )
      .sort((a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight);
    if (imgs.length === 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = imgs[0].naturalWidth;
    canvas.height = imgs[0].naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(imgs[0], 0, 0);
    try { return canvas.toDataURL("image/png").split(",")[1]; } catch { return null; }
  });

  let imageBuffer: Buffer | null = null;
  if (imageBase64) {
    imageBuffer = Buffer.from(imageBase64, "base64");
  } else {
    const screenshot = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 600, height: 600 } }) as Buffer;
    if (screenshot.length > 10000) imageBuffer = screenshot;
  }

  const isReel = url.includes("/reel/") || url.includes("/reels/");

  return {
    imageUrl: null,
    imageBuffer,
    brandName: parsed.brandName || null,
    copyText: parsed.copyText || null,
    externalId: url.split("?")[0],
    startedAt: parsed.startedAt || null,
    platform: "instagram",
    mediaType: isReel ? "reels" : "photo",
    status: "active",
    ctaText: null,
    landingUrl: null,
  };
}

// --- Main export ---
export async function captureAdDetail(url: string): Promise<AdDetail> {
  const lower = url.toLowerCase();

  // YouTube: no browser needed
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return captureYoutube(url);
  }

  // Browser needed for Instagram/Meta
  let browser: Browser | null = null;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    let result: AdDetail;
    if (lower.includes("facebook.com/ads/library")) {
      result = await captureMetaDetail(page, url);
    } else if (lower.includes("instagram.com")) {
      result = await captureInstagramDetail(page, url);
    } else {
      // Generic: just screenshot
      await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 2000));
      const screenshot = await page.screenshot({ type: "png" }) as Buffer;
      result = {
        imageUrl: null,
        imageBuffer: screenshot.length > 5000 ? screenshot : null,
        brandName: null, copyText: null, externalId: null, startedAt: null,
        platform: "meta", mediaType: "photo", status: "active", ctaText: null, landingUrl: null,
      };
    }

    await page.close();
    closeBrowser(browser);
    return result;
  } catch (err) {
    if (browser) closeBrowser(browser);
    return {
      imageUrl: null, imageBuffer: null, brandName: null, copyText: null,
      externalId: null, startedAt: null, platform: null, mediaType: null,
      status: null, ctaText: null, landingUrl: null,
    };
  }
}
