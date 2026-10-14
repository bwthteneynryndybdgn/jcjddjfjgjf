// plugins/tiktok.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const LIKE_ICON_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAxn0lEQVR4nO2de3RdV33nf7+993ndKzmWEx6lLR0epYxF6FAwj8nxMPIhaDrwuqQWbMG3ZRmaCAlViaQyLYkW7Icn3tjy5LfSgIZ5Kzy6ExKckU7DHStYgjjPkh5GAgQbB6BeqCFAeJYiaV7z2vv/Zs/7jnStSPdeyVdvc9nLa2VyLrnnHfn2/u7f/v32b/waQEpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKylrl/wPC1z8AWE0ZswAAAABJRU5ErkJggg==";
const DISLIKE_ICON_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFgAAABoCAYAAAB17zeZAAANmElEQVR4Ae2d927UShTGTTC9g+ktoXckLuQvpPsq+xDhKfatEH9FRIAA0SH0tvTezD0/K2d1MnHd9SQbXY/ka8eecuabb75zxp7lLnj27FlQNcVxHCxdujR4+/ZtwPWyZcuCN2/eBJs3b07OHz58CD5+/BicOnUq+PHjRxCWYXDx4sVgaGgos6kFCxYEy5cvD5YsWZKaj+e0uXr16mDNmjXBnTt3ghUrViR/0/bWrVuDd+/eJbaQNystXrw4uHz5crBq1apg48aNib07duwIfv/+HSxcuDDgOXbSpzpSdo/rqL2pI2gA9kyCBuAGYM8IeK6+YXADsGcEPFffMLgB2DMCnqtvGNwA7BkBz9U3DG4A9oyA5+obBjcAe0bAc/UNgxuAPSPgufqGwQ3AnhHwXH3D4AZgzwh4rr5hcAOwZwQ8V98w2DPAoef626b+c+b6f3MZsnGkxmQBDS5cvNCSDR2RbOTosKGk5jQvBixkt0wNLQH2ypUrLdldE3369Cn48uVLsltmqu5IdtuM5bXDbhx207CzJm1nDvcYpJUrV3J0OJs0sGDXIRHt69evtx4/fhx9/fo1AfXPnz8BR9XE9qW87VX8Y3uTHJEcY2y1ku1PnW3btmlTAwd0vwC3b9++3Xr48GH0+fPnZJ+a9rSXM3JVRbLuQ/J fieldValue...

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

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  html, body { margin: 0; padding: 0; background: transparent !important; overflow: hidden; }
  #canvas { width: 600px; height: 900px; position: relative; background: transparent !important; font-family: sans-serif; color: #161823; overflow: hidden; }
  #videoLayer { position: absolute; inset: 0; background-size: cover; background-position: center; ${bgStyle} }
  #sheet { position: absolute; left: 0; right: 0; bottom: 0; background: #ffffff; border-radius: 20px 20px 0 0; box-shadow: 0 -10px 26px rgba(0,0,0,.22); padding-bottom: 18px; }
  .sheet-header { display: flex; align-items: center; justify-content: center; padding: 18px 20px 14px; font-size: 17px; font-weight: 700; color: #161823; }
  .ig-comment { display: flex; align-items: flex-start; gap: 10px; padding: 6px 20px 16px; }
  .ig-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1px solid #eee; }
  .ig-body { flex: 1; min-width: 0; }
  .ig-uname { font-size: 13px; font-weight: 600; color: #767a80; margin-bottom: 3px; }
  .ig-text { font-size: 15.5px; line-height: 1.35; color: #161823; word-wrap: break-word; white-space: pre-wrap; }
  .ig-bottom-row { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
  .ig-meta-row { display: flex; align-items: center; gap: 16px; font-size: 13px; color: #86898f; }
  .ig-reactions { display: flex; align-items: center; gap: 14px; }
  .reaction { display: flex; align-items: center; gap: 5px; color: #86898f; }
  .reaction img { width: 26px; height: 26px; object-fit: contain; }
  .reply-row { display: flex; align-items: flex-start; gap: 10px; padding: 2px 20px 4px 58px; }
  .reply-row .ig-avatar { width: 28px; height: 28px; }
  .reply-creator-badge { color: #25a1c9; font-weight: 600; }
</style>
</head>
<body>
<div id="canvas">
  <div id="videoLayer"></div>
  <div id="sheet">
    <div class="sheet-header"><span>${escapeHtml(cfg.totalComments)} komentar</span></div>
    <div class="ig-comment">
      <img class="ig-avatar" src="${cfg.avatar1}">
      <div class="ig-body">
        <div class="ig-uname">${escapeHtml(cfg.user1)}</div>
        <div class="ig-text">${escapeHtml(cfg.text1)}</div>
        <div class="ig-bottom-row">
          <div class="ig-meta-row"><span>${escapeHtml(cfg.time1)}</span><span style="font-weight:600;color:#767a80;">Balas</span></div>
          <div class="ig-reactions">
            <div class="reaction"><img src="${LIKE_ICON_PNG}"><span>${escapeHtml(cfg.likes)}</span></div>
            <div class="reaction"><img src="${DISLIKE_ICON_PNG}"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="reply-row">
      <img class="ig-avatar" src="${cfg.avatar2}">
      <div class="ig-body">
        <div class="ig-uname">${escapeHtml(cfg.user2)} ${cfg.isCreator ? '· <span class="reply-creator-badge">Pencipta</span>' : ''}</div>
        <div class="ig-text">${escapeHtml(cfg.text2)}</div>
        <div class="ig-meta-row" style="margin-top:8px;"><span>${escapeHtml(cfg.time2)}</span></div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
}

function renderHtmlToPng(htmlPath, outPngPath) {
  const chromePath = findChrome();
  if (!chromePath) throw new Error("Google Chrome ya Chromium system par nahi mila.");
  const proc = spawnSync(chromePath, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
    "--window-size=600,900", `--screenshot=${outPngPath}`, htmlPath
  ], { stdio: "ignore" });
  if (proc.status !== 0 || !fs.existsSync(outPngPath)) {
    throw new Error("Screenshot render karne mein nakami hui.");
  }
}

// ─── Bot Command ────────────────────────────────────────────────────────────

cmd({
  pattern: "tiktokcomment",
  alias: ["ttcomment", "tt"],
  react: '💬',
  desc: "Generate TikTok comment card",
  category: "generator",
  filename: __filename
}, async (client, message, m, { from, q, command }) => {
  try {
    await client.sendMessage(from, { react: { text: "⏳", key: message.key } });

    // Simple argument parsing or defaults
    const user1 = "pacarmuda_william";
    const text1 = q ? q.trim() : "joks yg gak akan pernah redup😭";
    const likes = "386";
    const time1 = "2j";
    const user2 = "itsme_here!!";
    const text2 = "Ngeyel bgt maunya naga😭";
    const time2 = "1j";
    const isCreator = true;
    const totalComments = "604";

    const pfp1 = autoAvatar(user1);
    const pfp2 = autoAvatar(user2);

    const cfg = {
      user1, text1, likes, time1, user2, text2, time2, isCreator, totalComments,
      avatar1: pfp1, avatar2: pfp2, bgDataUrl: null, transparent: false
    };

    const htmlContent = buildHtmlCard(cfg);
    const tmpHtml = path.join(os.tmpdir, `tt-card-${Date.now()}.html`);
    const tmpPng = path.join(os.tmpdir, `tt-card-${Date.now()}.png`);

    fs.writeFileSync(tmpHtml, htmlContent, "utf-8");
    renderHtmlToPng(tmpHtml, tmpPng);

    try { fs.unlinkSync(tmpHtml); } catch {}

    await client.sendMessage(
      from,
      {
        image: { url: tmpPng },
        caption: `*🎬 TikTok Comment Generated*\n\n*User:* ${user1}\n*Comment:* ${text1}`
      },
      { quoted: message }
    );

    try { fs.unlinkSync(tmpPng); } catch {}
    await client.sendMessage(from, { react: { text: "✅", key: message.key } });
  } catch (err) {
    console.error("[TIKTOK COMMENT ERROR]", err);
    await client.sendMessage(from, { react: { text: "❌", key: message.key } });
    await client.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: message });
  }
});
