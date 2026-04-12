import puppeteer from "puppeteer-core";

async function getChromiumModule() {
  const mod = await import("@sparticuz/chromium");
  return mod.default;
}

export async function captureThumbnail(url: string): Promise<Buffer | null> {
  // YouTube: no browser needed
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const ytMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || url.match(/\/shorts\/([a-zA-Z0-9_-]+)/) || url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (ytMatch) {
      const thumbUrl = `https://img.youtube.com/vi/${ytMatch[1].split("?")[0]}/hqdefault.jpg`;
      const res = await fetch(thumbUrl);
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    }
    return null;
  }

  // Instagram / Facebook: need browser
  let browser;
  try {
    // Try connecting to local Chrome first (dev mode)
    try {
      browser = await puppeteer.connect({
        browserURL: "http://127.0.0.1:9333",
        defaultViewport: { width: 1280, height: 900 },
      });
    } catch {
      // Fallback: launch serverless chromium (Vercel)
      const chr = await getChromiumModule();
      browser = await puppeteer.launch({
        args: chr.args,
        defaultViewport: { width: 1280, height: 900 },
        executablePath: await chr.executablePath(),
        headless: true,
      });
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 3000));

    // Try to extract the main image via canvas
    const imageBase64 = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("article img, main img, img"))
        .filter((i): i is HTMLImageElement =>
          i instanceof HTMLImageElement &&
          i.naturalWidth > 200 &&
          !!i.src &&
          !i.src.includes("profile") &&
          !i.src.includes("avatar") &&
          !i.src.includes("s150x150")
        )
        .sort((a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight);

      if (imgs.length === 0) {
        // Try video poster
        const video = document.querySelector("video");
        if (video?.poster) {
          const canvas = document.createElement("canvas");
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = video.poster;
          return null; // poster fetch is async, fallback to screenshot
        }
        return null;
      }

      const target = imgs[0];
      const canvas = document.createElement("canvas");
      canvas.width = target.naturalWidth;
      canvas.height = target.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(target, 0, 0);
      try {
        return canvas.toDataURL("image/png").split(",")[1];
      } catch {
        return null;
      }
    });

    let buffer: Buffer;
    if (imageBase64) {
      buffer = Buffer.from(imageBase64, "base64");
    } else {
      // Fallback: screenshot
      buffer = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 800, height: 600 } }) as Buffer;
    }

    await page.close();
    // Only disconnect if we connected (not launched)
    try { browser.disconnect(); } catch { await browser.close(); }

    return buffer.length > 5000 ? buffer : null;
  } catch {
    try { if (browser) { browser.disconnect(); } } catch { /* ignore */ }
    return null;
  }
}
