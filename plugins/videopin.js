//---------------------------------------------------------------------------
//           KAMRAN-MD - YOUTUBE DOWNLOADER 2 (OMEGATECH API FIXED)
//---------------------------------------------------------------------------

import axios from 'axios';
import { cmd } from '../command.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const API_BASE = 'https://api.omegatech.app/api/download/ytultra';

const axiosConfig = {
    timeout: 30000,
    headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
};

function isYouTubeUrl(str) {
  return /youtube\.com|youtu\.be/i.test(str);
}

async function searchYT(query) {
  const res = await axios.get(`${API_BASE}?action=search&query=${encodeURIComponent(query)}`, axiosConfig);
  if (!res.data?.success) throw new Error('Search failed');
  return res.data.data;
}

async function getDownloadData(videoUrl) {
  const res = await axios.get(`${API_BASE}?action=download&url=${encodeURIComponent(videoUrl)}`, axiosConfig);
  if (!res.data?.success) throw new Error('Download info failed');
  return res.data.data;
}

function pickBestAudio(mp3List) {
  if (!mp3List || mp3List.length === 0) return null;
  const priority = ['320kbps', '256kbps', '192kbps', '160kbps', '128kbps', '96kbps', '64kbps'];
  for (const q of priority) {
    const found = mp3List.find(x => String(x.quality).toLowerCase().includes(q.toLowerCase()));
    if (found) return found;
  }
  return mp3List[0];
}

function pickBestVideo(mp4List) {
  if (!mp4List || mp4List.length === 0) return null;
  const priority = ['1080p', '720p', '480p', '360p', '240p', '144p'];
  for (const q of priority) {
    const found = mp4List.find(x => String(x.quality).toLowerCase().includes(q.toLowerCase()));
    if (found) return found;
  }
  return mp4List[0];
}

cmd({
    pattern: "yt244",
    alias: ["ytdl2", "ytv2", "yta2"],
    desc: "YouTube video or audio downloader via OmegaTech API",
    category: "downloader",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, socket, sock }) => {
    const client = socket || sock || conn;
    const chatId = from || m.chat;

    try {
        let input = text ? text.trim() : '';

        if (!input && mek.quoted) {
            const quotedText = mek.quoted.text || mek.quoted.caption || '';
            const found = quotedText.split(/\s+/).find(x => isYouTubeUrl(x));
            if (found) input = found;
        }

        if (!input) {
            return reply(
                `🎬 *KAMRAN-MD YOUTUBE DOWNLOADER 2* 🎬\n\n` +
                `Usage:\n` +
                `  .yt2 <youtube-url>    Download audio\n` +
                `  .yt2 <url> v          Download video\n` +
                `  .yt2 <query>          Search YouTube\n\n` +
                `> *© KAMRAN-MINI-BOT ッ*`
            );
        }

        if (isYouTubeUrl(input)) {
            const parts = input.split(/\s+/);
            const url = parts.find(x => isYouTubeUrl(x));
            const wantVideo = parts.some(x => x.toLowerCase() === 'v' || x.toLowerCase() === 'video');

            await client.sendMessage(chatId, { react: { text: '⏳', key: mek.key } });
            await reply(`⏳ _Fetching YouTube info from API..._`);

            const data = await getDownloadData(url);

            if (wantVideo) {
                const best = pickBestVideo(data.mp4 || []);
                if (!best) throw new Error('No video formats available');

                await reply(`🎬 *${data.title || 'Video'}*\nQuality: ${best.quality}\n\n⏳ _Uploading video..._`);

                let cleanFileName = `${(data.title || 'video').replace(/[\\/:*?"<>|]/g, '').slice(0, 40)}.mp4`;

                await client.sendMessage(chatId, {
                    video: { url: best.url },
                    caption:
                        `🎬 *${data.title || 'YouTube Video'}*` +
                        `\n👤 Channel: ${data.channel || 'Unknown'}` +
                        `\n📺 Quality: ${best.quality}\n\n> *© KAMRAN-MINI-BOT ッ*`,
                    mimetype: 'video/mp4',
                    fileName: best.filename || cleanFileName
                }, { quoted: mek });
            } else {
                const best = pickBestAudio(data.mp3 || []);
                if (!best) throw new Error('No audio formats available');

                await reply(`🎵 *${data.title || 'Audio'}*\nQuality: ${best.quality}\n\n⏳ _Uploading audio..._`);

                let cleanFileName = `${(data.title || 'audio').replace(/[\\/:*?"<>|]/g, '').slice(0, 40)}.mp3`;

                await client.sendMessage(chatId, {
                    audio: { url: best.url },
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    fileName: best.filename || cleanFileName
                }, { quoted: mek });
            }

            await client.sendMessage(chatId, { react: { text: '✅', key: mek.key } });
            return;
        }

        await client.sendMessage(chatId, { react: { text: '⏳', key: mek.key } });
        await reply(`🔍 Searching YouTube for: *${input}*...`);

        const searchData = await searchYT(input);
        const results = searchData.results || [];

        if (results.length === 0) {
            await client.sendMessage(chatId, { react: { text: '❌', key: mek.key } });
            return reply(`❌ No results found for "${input}"`);
        }

        let list = '';
        results.slice(0, 10).forEach((r, i) => {
            list += `*${i + 1}.* ${r.title}\n`;
            list += `   ⏱️ ${r.duration || '?'} | 👤 ${r.channel?.name || 'Unknown'}\n\n`;
        });

        await reply(
            `🔎 *SEARCH RESULTS FOR:* "${input}"\n\n` +
            `${list}` +
            `📌 _Reply or send the YouTube URL to download it._\n\n` +
            `> *© KAMRAN-MINI-BOT ッ*`
        );

        await client.sendMessage(chatId, { react: { text: '✅', key: mek.key } });

    } catch (error) {
        console.error('[YT2 ERROR]', error);
        try { await client.sendMessage(chatId, { react: { text: '❌', key: mek.key } }); } catch (e) {}
        return reply(`❌ YouTube error: ${error.message}`);
    }
});
