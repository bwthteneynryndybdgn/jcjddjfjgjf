import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "drama54",
    alias: ["pakdrama", "dramas54"],
    use: '.drama <drama name>',
    desc: "Search exact drama and directly download the full episode as Video",
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

        // Search strictly using user's query via VajiraOfc Search API
        const searchApi = `https://vajiraofc-apis.vercel.app/api/ytsearch?apikey=VajiraOfc&q=${encodeURIComponent(query)}`;
        const { data: searchRes } = await axios.get(searchApi, { timeout: 30000 });

        const rawResults = searchRes?.results || [];

        if (!rawResults || rawResults.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Is naam ka koyi drama nahi mila.`);
        }

        // Filter for full episodes (duration >= 20 minutes) to avoid teasers/promos
        const validEpisodes = rawResults.filter(item => {
            const durStr = item.description?.duration || "0:00";
            const parts = durStr.split(":");
            if (parts.length === 2) {
                const minutes = parseInt(parts[0]) || 0;
                return minutes >= 20;
            }
            return true;
        });

        const selectedDrama = validEpisodes.length > 0 ? validEpisodes[0] : rawResults[0];
        const videoUrl = selectedDrama.url || `https://youtube.com/watch?v=${selectedDrama.id}`;
        const dramaTitle = selectedDrama.title || query;

        await conn.sendMessage(from, { text: `> *KAMRAN-MD DRAMA DOWNLOADER* 📺\n\n📌 *Found:* ${dramaTitle}\n_Video download ho rahi hai, barae meharbani intezar karein..._` }, { quoted: mek });

        // Fetch direct download link using VajiraOfc YTMP4 API
        const api = `https://vajiraofc-apis.vercel.app/api/ytmp4?apikey=VajiraOfc&url=${encodeURIComponent(videoUrl)}&quality=360`;
        const { data } = await axios.get(api, { 
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const resData = data?.data || data;
        const downloadUrl = resData?.download?.url || resData?.downloadUrl || resData?.url;
        const finalTitle = resData?.title || dramaTitle;

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Drama download link nahi mila: ${finalTitle}`);
        }

        // Send strictly as Direct Video message format
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
