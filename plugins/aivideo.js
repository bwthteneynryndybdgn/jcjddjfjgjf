import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const API_BASE = 'https://api-aio.omnifylabs.sbs';

// Updated headers to bypass 403 Forbidden restriction
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  'Origin': 'https://aio.omnifylabs.sbs',
  'Referer': 'https://aio.omnifylabs.sbs/',
  'X-Requested-With': 'XMLHttpRequest',
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

async function resolveMedia(mediaUrl, options = {}) {
  const targetUrl = typeof mediaUrl === 'string' ? mediaUrl.trim() : '';
  if (!targetUrl) throw new Error('URL media tidak boleh kosong.');

  const payload = { url: targetUrl };
  if (options.password && typeof options.password === 'string') {
    payload.password = options.password.trim();
  }

  const response = await fetch(`${API_BASE}/api/v1/media/resolve`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload)
  });

  const json = await response.json().catch(() => null);

  if (!response.ok || json?.status === 'error') {
    const msg = json?.message || `HTTP error dari Omnify AIO! Status: ${response.status}`;
    throw new Error(msg);
  }

  return {
    status: true,
    platform: json?.platform || json?.data?.platform || 'unknown',
    data: json?.data || {}
  };
}

cmd({
    pattern: "aio",
    alias: ["omnify", "dl"],
    desc: "Omnify AIO media downloader",
    category: "downloader",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;

    if (!text) {
        return reply(`Masukkan URL media yang ingin di-download!\n\nContoh: *.aio https://www.tiktok.com/...*`);
    }

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        await reply('⏳ _Sedang mengunduh media, tunggu sebentar..._');

        let options = {};
        let targetUrl = text.trim();
        
        const splitText = text.trim().split(' ');
        if (splitText.length > 1) {
            targetUrl = splitText[0];
            options.password = splitText[1];
        }

        const res = await resolveMedia(targetUrl, options);
        
        if (!res.status || !res.data) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply('❌ Gagal mengambil data media.');
        }

        const { data, platform } = res;
        
        let caption = `*O M N I F Y - ${platform.toUpperCase()}*\n\n`;
        if (data.author?.nickname) caption += `◦ *Author:* ${data.author.nickname}\n`;
        if (data.description) caption += `◦ *Desc:* ${data.description.substring(0, 50)}...\n`;

        if (data.type === 'video' || data.videoUrl || (data.formats && data.formats.some(f => f.type === 'video'))) {
            let targetVideo = data.hdVideoUrl || data.videoUrl;
            if (!targetVideo && data.formats) {
                let formatVideo = data.formats.find(f => f.type === 'video' && !f.hasWatermark) || data.formats.find(f => f.type === 'video');
                if (formatVideo) targetVideo = formatVideo.url;
            }

            if (targetVideo) {
                await conn.sendMessage(from, { video: { url: targetVideo }, caption: caption }, { quoted: mek });
            } else {
                await reply("❌ URL Video tidak ditemukan.");
            }
        } else if (data.type === 'audio' || data.audioUrl || (data.formats && data.formats.some(f => f.type === 'audio'))) {
            let targetAudio = data.audioUrl;
            if (!targetAudio && data.formats) {
                let formatAudio = data.formats.find(f => f.type === 'audio');
                if (formatAudio) targetAudio = formatAudio.url;
            }

            if (targetAudio) {
                await conn.sendMessage(from, { audio: { url: targetAudio }, mimetype: 'audio/mpeg' }, { quoted: mek });
            } else {
                await reply("❌ URL Audio tidak ditemukan.");
            }
        } else {
            await reply(`❌ Tipe media (${data.type}) belum di-support.`);
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("Omnify Error:", err);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        await reply(`❌ *Terjadi Kesalahan:*\n${err.message}`);
    }
});
