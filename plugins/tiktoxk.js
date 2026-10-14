// plugins/tiktok.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);

const LIKE_ICON_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAxn0lEQVR4nO2de3RdV33nf7+993ndKzmWEx6lLR0epYxF6FAwj8nrBqprioefsbfX979v8n8vKz6aKSTXp25I00lPnv7J8RknU9o8pGSI1WdO8tQvU5o8rP81oZ3v0yNfEwG5+vP+u7n7X2vvtGv3vuu1vOqvvOvt3ffv3tvn/zN/6P6C6KipKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSlrLfO4O//+A00r7s9eWdDAAAAAElFTkSuQmCC";
const DISLIKE_ICON_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFgAAABoCAYAAAB17zeZAAANmElEQVR4Ae2d927UShTGTTC9g+ktoXckLuQvpPsq+xDhKfatEH9FRIAA0SH0tvTezD0/K2d1MnHd9SQbXY/ka8eecuabb75zxp7lLnj27FlQNcVxHCxdujR4+/ZtwPWyZcuCN2/eBJs3b07OHz58CD5+/BicOnUq+PHjRxCGYXDx4sVgaGgos6kFCxYEy5cvD5YsWZKaj+e0uXr16mDNmjXBnTt3ghUrViR/0/bWrVuDd+/eJbaQNystXrw4uHz5crBq1apg48aNib07duwIfv/+HSxcuDDgOXbSpzpSdo/rqL2pI2gA9kyCBuAGYM8IeK6+YXADsGcEPFffMLgB2DMCnqtvGNwA7BkBz9U3DG4A9oyA5+obBjcAe0bAc/UNgxuAPSPgufqGwQ3AnhHwXH3D4AZgzwh4rr5hcAOwZwQ8V98w2DPAoef626b+c+b6f3MZsnGkxmQBDS5cuNCSDR2RbOTosKGk5jQvBixkt0wNLQH2ypUrLdldE3369Cn48uVLsltmqu5IdtuM5bXDbhx207CzJm1nDvcYpJUrV3J0OJs0sGDXIRHt69evtx4/fhx9/fo1AfXPnz8BR9XE9qW87VU8Y3uTHJEcY2y1ku1PnW3btmlTAwd0vwC3b9++3Xr48GR0+fPnZJ+a9rSXM3JVRbJoU/bBRbI3bez9+/edLVu2lG22cCC+fftWtq7cfP0A3L53717C3DrAzbUy4yGzhFnz69cvzpFsZBxbtGhRqsRoFcL8jrOxbwbYVQZZ6806h9+/f896lnv/5cupXgXRoBnN1xyPTl46ws9LVVIBh12WWjNBB9/nfv38TIGEWSywISIvu6KTbSulEJDYl8rJhw4YZ8vLz58+UIr3f6pJBodssbkL2pI2L7o9eWdDAAAAAElFTkSuQmCC";

function findChrome() {
  const candidates = ["google-chrome", "chromium", "google-chrome-stable", "chromium-browser"];
  for (const c of candidates) {
    const res = spawnSync("which", [c]);
    if (res.status === 0 && res.stdout.toString().trim()) {
      return res.stdout.toString().trim();
    }
  }
  return null;
}

function formatCount(n) {
  n = Number(n);
  if (isNaN(n)) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "jt";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "rb";
  return String(n);
}

function autoAvatar(seedText) {
  const colors = ["#8B9DC3", "#B6A6CA", "#C9A66B", "#7FA88F", "#A8B5A2", "#C08497", "#8CA3A3", "#B0987A", "#9FA8C9", "#AD8F7C"];
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) { hash = seedText.charCodeAt(i) + ((hash << 5) - hash); }
  const c1 = colors[Math.abs(hash) % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" rx="50" fill="${c1}"/></svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

async function resolveMedia(input, prefix = "tt") {
  if (!input) return null;
  const str = String(input).trim();
  if (str.startsWith("http://") || str.startsWith("https://")) {
    const res = await fetch(str, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`Gagal mengunduh media dari URL: ${str}`);
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const isVideo = ct.includes("video") || /\.(mp4|mov|webm|mkv|m4v)(\?|$)/i.test(str);
    const ext = isVideo ? ".mp4" : (ct.includes("png") ? ".png" : (ct.includes("webp") ? ".webp" : ".jpg"));
    const tmpFile = path.join(os.tmpdir(), `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(tmpFile, buf);
    return {
      type: isVideo ? "video" : "image",
      filePath: tmpFile,
      dataUrl: isVideo ? null : `data:${ct || "image/png"};base64,${buf.toString("base64")}`
    };
  } else {
    const absPath = path.resolve(str);
    if (!fs.existsSync(absPath)) throw new Error(`File media storage tidak ditemukan: ${str}`);
    const isVideo = /\.(mp4|mov|webm|mkv|m4v)$/i.test(absPath);
    let dataUrl = null;
    if (!isVideo) {
      const ext = path.extname(absPath).slice(1).toLowerCase();
      const mime = ext === "png" ? "image/png" : (ext === "webp" ? "image/webp" : (ext === "svg" ? "image/svg+xml" : "image/jpeg"));
      dataUrl = `data:${mime};base64,${fs.readFileSync(absPath).toString("base64")}`;
    }
    return {
      type: isVideo ? "video" : "image",
      filePath: absPath,
      dataUrl
    };
  }
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildHtmlCard(cfg) {
  const bgStyle = cfg.bgDataUrl
    ? `background-image: url('${cfg.bgDataUrl}');`
    : (cfg.transparent ? "background: transparent !important;" : "background-color: #1a1a1a;");

  const imgHtml = cfg.img1DataUrl
    ? `<img class="ig-image" src="${cfg.img1DataUrl}" alt="attachment">`
    : "";

  const creatorBadge = cfg.isCreator
    ? ` · <span class="reply-creator-badge">Pencipta</span>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  html, body {
    margin: 0;
    padding: 0;
    background: transparent !important;
    overflow: hidden;
  }
  #canvas {
    width: 600px;
    height: 900px;
    position: relative;
    background: transparent !important;
    font-family: 'TikTok Sans', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    color: #161823;
    overflow: hidden;
  }
  #videoLayer {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    ${bgStyle}
  }
  #sheet {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: #ffffff;
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -10px 26px rgba(0,0,0,.22);
    padding-bottom: 18px;
  }
  .sheet-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px 20px 14px;
    font-size: 17px;
    font-weight: 700;
    color: #161823;
  }
  .sheet-header-left {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .sheet-sort-lines {
    display: inline-flex;
    flex-direction: column;
    gap: 3px;
    justify-content: center;
    align-items: center;
    margin-left: 4px;
  }
  .sheet-sort-lines span {
    display: block;
    background: #161823;
    border-radius: 2px;
    height: 2px;
  }
  .sheet-sort-lines span:nth-child(1) { width: 18px; }
  .sheet-sort-lines span:nth-child(2) { width: 13px; }
  .sheet-sort-lines span:nth-child(3) { width: 8px; }
  .sheet-x {
    position: absolute;
    right: 20px;
    top: 18px;
    font-size: 19px;
    color: #86898f;
    font-weight: 400;
  }
  .ig-comment {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 6px 20px 16px;
  }
  .ig-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    background: linear-gradient(135deg, #dfe1e4, #eef0f2);
    border: 1px solid #eee;
    margin-top: 1px;
  }
  .ig-body {
    flex: 1;
    min-width: 0;
  }
  .ig-uname {
    font-size: 13px;
    font-weight: 600;
    color: #767a80;
    margin-bottom: 3px;
    line-height: 1.2;
  }
  .ig-text {
    font-size: 15.5px;
    line-height: 1.35;
    color: #161823;
    word-wrap: break-word;
    white-space: pre-wrap;
  }
  .ig-image {
    margin-top: 8px;
    max-width: 220px;
    border-radius: 8px;
    display: block;
    border: 1px solid #eee;
  }
  .ig-bottom-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    overflow: visible;
  }
  .ig-meta-row {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 13px;
    color: #86898f;
  }
  .ig-meta-row .reply {
    font-weight: 600;
    color: #767a80;
  }
  .ig-reactions {
    display: flex;
    align-items: center;
    gap: 14px;
    overflow: visible;
    padding: 2px 0;
  }
  .reaction {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #86898f;
  }
  .reaction img {
    width: 26px;
    height: 26px;
    display: block;
    object-fit: contain;
    flex-shrink: 0;
    overflow: visible;
  }
  .reaction span {
    font-size: 12.5px;
    color: #86898f;
  }
  .reply-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 2px 20px 4px 58px;
  }
  .reply-row .ig-avatar {
    width: 28px;
    height: 28px;
    margin-top: 1px;
  }
  .reply-creator-badge {
    color: #25a1c9;
    font-weight: 600;
  }
</style>
</head>
<body>
<div id="canvas">
  <div id="videoLayer"></div>
  <div id="sheet">
    <div class="sheet-header">
      <span class="sheet-header-left">
        <span>${escapeHtml(cfg.totalComments)}</span>&nbsp;komentar <span class="sheet-sort-lines"><span></span><span></span><span></span></span>
      </span>
      <span class="sheet-x">✕</span>
    </div>
    <div class="ig-comment">
      <img class="ig-avatar" src="${cfg.avatar1}">
      <div class="ig-body">
        <div class="ig-uname">${escapeHtml(cfg.user1)}</div>
        <div class="ig-text">${escapeHtml(cfg.text1)}</div>
        ${imgHtml}
        <div class="ig-bottom-row">
          <div class="ig-meta-row">
            <span>${escapeHtml(cfg.time1)}</span>
            <span class="reply">Balas</span>
          </div>
          <div class="ig-reactions">
            <div class="reaction">
              <img src="${LIKE_ICON_PNG}" alt="like">
              <span>${escapeHtml(cfg.likes)}</span>
            </div>
            <div class="reaction">
              <img src="${DISLIKE_ICON_PNG}" alt="dislike">
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="reply-row">
      <img class="ig-avatar" src="${cfg.avatar2}">
      <div class="ig-body">
        <div class="ig-uname">${escapeHtml(cfg.user2)}${creatorBadge}</div>
        <div class="ig-text">${escapeHtml(cfg.text2)}</div>
        <div class="ig-meta-row" style="margin-top:8px;">
          <span>${escapeHtml(cfg.time2)}</span>
          <span class="reply">Balas</span>
        </div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
}

function renderHtmlToPng(htmlPath, outPngPath, isTransparent = false) {
  const chromePath = findChrome();
  if (!chromePath) throw new Error("Google Chrome atau Chromium tidak ditemukan di sistem");
  const chromeArgs = [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--window-size=600,900",
    "--hide-scrollbars",
    `--screenshot=${outPngPath}`,
    htmlPath
  ];
  if (isTransparent) {
    chromeArgs.splice(5, 0, "--default-background-color=00000000");
  }
  const proc = spawnSync(chromePath, chromeArgs, { stdio: "ignore" });
  if (proc.status !== 0 || !fs.existsSync(outPngPath)) {
    throw new Error(`Gagal merender screenshot dengan ${chromePath}`);
  }
}

cmd({
  pattern: "tiktokcomment",
  alias: ["ttcomment", "ttgen"],
  react: '💬',
  desc: "Generate TikTok comment image or video overlay",
  category: "maker",
  filename: __filename
}, async (client, message, m, { from, q, prefix, command }) => {
  try {
    await client.sendMessage(from, { react: { text: "⏳", key: message.key } });

    // Simple parsing args or defaults
    const user1 = "pacarmuda_william";
    const text1 = q || "joks yg gak akan pernah redup😭";
    const likes = formatCount("386");
    const time1 = "2j";
    const user2 = "itsme_here!!";
    const text2 = "Ngeyel bgt maunya naga😭";
    const time2 = "1j";
    const isCreator = true;
    const totalComments = "604";

    const pfp1 = autoAvatar(user1);
    const pfp2 = autoAvatar(user2);

    const cfg = {
      user1,
      text1,
      likes,
      time1,
      user2,
      text2,
      time2,
      isCreator,
      totalComments,
      avatar1: pfp1,
      avatar2: pfp2,
      img1DataUrl: null,
      bgDataUrl: null,
      transparent: true
    };

    const htmlContent = buildHtmlCard(cfg);
    const tmpHtml = path.join(os.tmpdir(), `tt-card-${Date.now()}-${Math.random().toString(36).slice(2)}.html`);
    fs.writeFileSync(tmpHtml, htmlContent, "utf-8");

    const tmpCardPng = path.join(os.tmpdir(), `tt-card-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
    renderHtmlToPng(tmpHtml, tmpCardPng, true);

    try { fs.unlinkSync(tmpHtml); } catch {}

    const finalOutputPath = path.join(os.tmpdir(), `tiktok-comment-${Date.now()}.png`);
    fs.copyFileSync(tmpCardPng, finalOutputPath);
    try { fs.unlinkSync(tmpCardPng); } catch {}

    await client.sendMessage(
      from,
      {
        image: { url: finalOutputPath },
        caption: `💬 *TikTok Comment Generated*\n\n👤 *${user1}*: ${text1}`
      },
      { quoted: message }
    );

    await client.sendMessage(from, { react: { text: "✅", key: message.key } });

  } catch (err) {
    console.error("TikTok Gen Error:", err);
    await client.sendMessage(from, { react: { text: "❌", key: message.key } });
    await client.sendMessage(from, { text: `❌ Failed to generate TikTok comment: ${err.message || err}` }, { quoted: message });
  }
});
