import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);

const API = 'https://api.omegatech.app/api/ai';

async function safeFetch(url, timeoutMs = 30000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Lady-Mina/1.0' },
      signal: ctrl.signal
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(t);
  }
}

function pickVideo(data) {
  return data?.result || data?.video || data?.url || data?.data?.url || data?.data?.video || data?.data?.result || null;
}

cmd({
    pattern: "sora",
    alias: ["sora2", "veo", "aivideo"],
    use: '.sora <aap ka prompt>',
    desc: "Generate AI videos using multiple fallback endpoints",
    category: "ai",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    const query = String(text || "").trim();
    if (!query) {
        return reply(`*🎬 KAMRAN-MD AI Video*\n\nExample:\n• .${command} a cute cat walking in the rain\n\n_May take 1–5 minutes._`);
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    await reply('🎬 *KAMRAN-MD* is generating video… please wait.');

    try {
        // 1) Pehle Veo3 endpoint try karein
        try {
            const data = await safeFetch(`${API}/veo3?prompt=${encodeURIComponent(query)}`, 60000);
            const url = pickVideo(data);
            if (url) {
                await conn.sendMessage(from, { video: { url }, caption: `🎬 *KAMRAN-MD Video*\n${query}` }, { quoted: mek });
                return await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            }
        } catch (e) {
            console.error('veo3 failed:', e.message);
        }

        // 2) Dusra Ai-video endpoint try karein
        try {
            const data = await safeFetch(`${API}/Ai-video?prompt=${encodeURIComponent(query)}&maxWait=300`, 120000);
            const url = pickVideo(data);
            if (url) {
                await conn.sendMessage(from, { video: { url }, caption: `🎬 *KAMRAN-MD Video*\n${query}` }, { quoted: mek });
                return await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            }
        } catch (e) {
            console.error('Ai-video failed:', e.message);
        }

        // 3) Teesri option Veo3-v3 status polling try karein
        try {
            const create = await safeFetch(`${API}/Veo3-v3?prompt=${encodeURIComponent(query)}`, 30000);
            const taskId = create?.id || create?.taskId || create?.task_id || create?.result?.id;
            if (taskId) {
                for (let i = 0; i < 12; i++) {
                    await new Promise(r => setTimeout(r, 5000));
                    const st = await safeFetch(`${API}/Veo3-v3-status?id=${encodeURIComponent(taskId)}`, 20000);
                    const u = pickVideo(st);
                    if (u) {
                        await conn.sendMessage(from, { video: { url: u }, caption: `🎬 *KAMRAN-MD Video*\n${query}` }, { quoted: mek });
                        return await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
                    }
                    if (st?.status === 'failed' || st?.error) break;
                }
            }
        } catch (e) {
            console.error('Veo3-v3 failed:', e.message);
        }

        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply('❌ Filhal API server down ya busy hai (HTTP 500). Baraye meharbani kuch der baad try karein.');

    } catch (e) {
        console.error('[VIDEO ERROR]', e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`❌ Error: ${e.message}`);
    }
});
