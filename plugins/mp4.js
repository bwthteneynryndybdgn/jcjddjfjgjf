// plugins/play.js
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js'; // Bot name ke liye config import kiya
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play",
    alias: ["ytplay", "song", "plays"],
    desc: "Search and download songs from YouTube",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a song name or search query!\n\n` +
                `Example:\n` +
                `• .play Pal lyrical video`
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the API endpoint (AzBry API)
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
        
        // Mapping keys according to AzBry API response
        const audioUrl = info.download; 
        const title = info.title || text;
        const thumbnail = info.thumbnail || '';
        const channel = info.channel || ''; 

        if (!audioUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve the MP3 download link from the API response.");
        }

        // Prepare info caption
        let caption = `🎶 *Title:* ${title}\n`;
        if (channel) caption += `👤 *Artist/Channel:* ${channel}\n`;
        caption += `📁 *Status:* Downloading audio...`;

        // 1. Send thumbnail and details first (Image Message)
        if (thumbnail) {
            await conn.sendMessage(from, { 
                image: { url: thumbnail }, 
                caption: caption 
            }, { quoted: mek });
        } else {
            await reply(caption);
        }

        // 2. Send the audio file using direct mp3 link
        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            ptt: false // Set true if you want voice note style
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("YTPlay Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
