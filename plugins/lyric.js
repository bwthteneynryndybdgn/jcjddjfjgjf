import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "drama74",
    alias: ["pakdrama53", "dramas64"],
    use: '.drama <drama name>',
    desc: "Search exact drama using yt-search and directly download full episode in 1080p Video using NexRay API",
    category: "downloader",
    react: "📺",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = String(text || "").trim();
        if (!query) {
            return reply(`⚠️ *DRAMA SEARCH*\n\nUsage:\n• .drama <drama name>\nMisal ke tor par: .drama Mohabbat Episode 01`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Using yt-search package instead of VajiraOfc search API
        const searchRes = await yts(query);
        const rawResults = searchRes?.videos || searchRes || [];

        if (!rawResults || rawResults.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Is naam ka koyi drama nahi mila.`);
        }

        // Filter for full episodes (duration >= 20 minutes) to avoid short clips/teasers
        const validEpisodes = rawResults.filter(item => {
            const seconds = item.seconds || 0;
            return seconds >= 1200; // 1200 seconds = 20 minutes
        });

        const selectedDrama = validEpisodes.length > 0 ? validEpisodes[0] : rawResults[0];
        const videoUrl = selectedDrama.url || `https://youtube.com/watch?v=${selectedDrama.videoId}`;
        const dramaTitle = selectedDrama.title || query;

        await conn.sendMessage(from, { text: `> *KAMRAN-MD DRAMA DOWNLOADER* 📺\n\n📌 *Found:* ${dramaTitle}\n_1080p video download ho rahi hai, barae meharbani intezar karein..._` }, { quoted: mek });

        // Fetch direct 1080p download link using NexRay API
        const api = `https://api.nexray.eu.cc/downloader/v1/ytmp4?url=${encodeURIComponent(videoUrl)}&resolusi=1080`;
        const { data } = await axios.get(api, { 
            timeout: 90000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const resData = data?.result || data;
        const downloadUrl = resData?.url || resData?.downloadUrl;
        const finalTitle = resData?.title || dramaTitle;

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Drama download link nahi mila: ${finalTitle}`);
        }

        // Send strictly as Direct Video message format in 1080p
        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            mimetype: 'video/mp4',
            caption: `📺 *${finalTitle}*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("[DRAMA ERROR]", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }, { quoted: mek });
        return reply(`❌ Error: ${e.message}`);
    }
});
