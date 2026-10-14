import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "", // 👈 Khali pattern taaki bina prefix/full stop ke chale
    alias: ["play", "song", "audio", "music", "play17", "ytplay17", "song17", "plays17"],
    desc: "Auto search and download songs from YouTube via FAA API",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return; // Agar text khali ho toh ignore karega

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the API endpoint automatically
        const encodedQuery = encodeURIComponent(text.trim());
        const apiUrl = `https://api.azbry.com/api/download/ytplay2?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // Check if API returned success and result object
        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not find any results for that song.");
        }

        const info = resData.result;
        
        // Correct API keys mapping
        const audioUrl = info.download;        // Direct download link from API
        const title = info.title || text;
        const thumbnail = info.thumbnail || '';
        const duration = info.duration || '';     
        const author = info.channel || '';       // Channel name from API

        if (!audioUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve the MP3 download link from the API response.");
        }

        // Prepare info caption
        let caption = `🎶 *Title:* ${title}\n`;
        if (author) caption += `👤 *Artist/Channel:* ${author}\n`;
        if (duration) caption += `⏱️ *Duration:* ${duration}\n`;
        caption += `📁 *Status:* Downloading audio...`;

        // Send thumbnail and details first
        if (thumbnail) {
            await conn.sendMessage(from, { 
                image: { url: thumbnail }, 
                caption: caption 
            }, { quoted: mek });
        } else {
            await reply(caption);
        }

        // Send the audio file automatically
        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            ptt: false 
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("YTPlay Error:", error);
    }
});
