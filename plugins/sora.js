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

// ==================== 1. SORA / SORA2 COMMAND ====================
cmd({
    pattern: "sora",
    alias: ["sora2"],
    use: '.sora <aap ka prompt>',
    desc: "Generate AI videos using Sora / Veo backend",
    category: "ai",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    const query = String(text || "").trim();
    if (!query) {
        return reply(`*🎬 KAMRAN-MD Sora Video*\n\nExample:\n• .${command} a cute cat walking in the rain\n\n_May take 1–5 minutes._`);
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    await reply('🎬 *KAMRAN-MD* is generating video using Sora backend… please wait.');

    try {
        const data = await safeFetch(`${API}/veo3?prompt=${encodeURIComponent(query)}`, 60000);
        const url = pickVideo(data);
        if (url) {
            await conn.sendMessage(from, { video: { url }, caption: `🎬 *KAMRAN-MD Sora Video*\n${query}` }, { quoted: mek });
            return await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        }
        throw new Error("Video URL nahi mila.");
    } catch (e) {
        console.error('Sora failed:', e.message);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`❌ Video generation fail ho gayi: ${e.message}`);
    }
});

// ==================== 2. VEO / VEOVID COMMAND ====================
cmd({
    pattern: "veo",
    alias: ["veovid"],
    use: '.veo <aap ka prompt>',
    desc: "Generate AI videos using Veo3-v3 async poll",
    category: "ai",
    react: "🎥",
    filename: __filename
},
async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    const query = String(text || "").trim();
    if (!query) {
        return reply(`*🎥 KAMRAN-MD Veo Video*\n\nExample:\n• .${command} futuristic cyberpunk city drone shot\n\n_May take a few minutes._`);
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    await reply('🎥 *KAMRAN-MD* is processing your Veo video task… please wait.');

    try {
        const create = await safeFetch(`${API}/Veo3-v3?prompt=${encodeURIComponent(query)}`, 30000);
        const taskId = create?.id || create?.taskId || create?.task_id || create?.result?.id;
        
        if (taskId) {
            for (let i = 0; i < 24; i++) {
                await new Promise(r => setTimeout(r, 5000));
                try {
                    const st = await safeFetch(`${API}/Veo3-v3-status?id=${encodeURIComponent(taskId)}`, 20000);
                    const u = pickVideo(st);
                    if (u) {
                        await conn.sendMessage(from, { video: { url: u }, caption: `🎥 *KAMRAN-MD Veo Video*\n${query}` }, { quoted: mek });
                        return await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
                    }
                    if (st?.status === 'failed' || st?.error) break;
                } catch {}
            }
        }
        throw new Error("Task timeout ya fail ho gaya.");
    } catch (e) {
        console.error('Veo failed:', e.message);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`❌ Veo video error: ${e.message}`);
    }
});

// ==================== 3. AIVIDEO COMMAND ====================
cmd({
    pattern: "aivideo",
    alias: ["freeaivideo"],
    use: '.aivideo <aap ka prompt>',
    desc: "Generate AI videos using FreeAIVideos API",
    category: "ai",
    react: "🎞️",
    filename: __filename
},
async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    const query = String(text || "").trim();
    if (!query) {
        return reply(`*🎞️ KAMRAN-MD AI Video*\n\nExample:\n• .${command} cinematic landscape with flying cars\n\n_May take 1–10 minutes._`);
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    await reply('🎞️ *KAMRAN-MD* is generating AI video… this can take several minutes.');

    try {
        const data = await safeFetch(
            `${API}/Ai-video?prompt=${encodeURIComponent(query)}&maxWait=300`,
            320000
        );
        const url = pickVideo(data);
        if (url) {
            await conn.sendMessage(from, { video: { url }, caption: `🎞️ *KAMRAN-MD AI Video*\n${query}` }, { quoted: mek });
            return await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        }
        throw new Error("Video API se response nahi mila.");
    } catch (e) {
        console.error('Ai-video failed:', e.message);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`❌ AI Video generation unavailable: ${e.message}`);
    }
});
