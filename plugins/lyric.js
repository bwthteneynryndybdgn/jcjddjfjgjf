// plugins/song.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play1",
    alias: ["ytplay1", "song1", "plays1", "song2"],
    desc: "Search and download songs from YouTube via Nexray v1 MP3 API",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a song name or YouTube link!\n\n` +
                `Example:\n` +
                `• .play pal song`
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let targetUrl = text.trim();

        // Agar user ne naam diya hai toh pehle yt-search se link nikal lenge
        if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            try {
                let search = await yts(targetUrl);
                let videos = search?.videos || search?.all;
                if (videos && videos.length > 0) {
                    targetUrl = videos[0].url;
                }
            } catch (e) {
                console.error("YTS Error:", e);
            }
        }

        if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not find any matching video for that search query.");
        }

        // Nexray v1 MP3 API Endpoint
        const apiUrl = `https://api.nexray.eu.cc/downloader/v1/ytmp3?url=${encodeURIComponent(targetUrl)}`;
        
        const response = await axios.get(apiUrl, { timeout: 45000 });
        const resData = response.data;

        // Check if API returned success and result
        if (!resData || !resData.status || !resData.result || !resData.result.url) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve the MP3 download link from the API.");
        }

        const info = resData.result;
        const audioUrl = info.url;
        const title = info.title || "YouTube Audio";
        const thumbnail = info.thumbnail || '';
        const durationSec = info.duration || 0;
        
        // Duration seconds ko MM:SS format me convert karna
        const minutes = Math.floor(durationSec / 60);
        const seconds = durationSec % 60;
        const duration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        const author = info.author || '';

        // Prepare info caption
        let caption = `🎶 *Title:* ${title}\n`;
        if (author) caption += `👤 *Artist/Channel:* ${author}\n`;
        if (durationSec > 0) caption += `⏱️ *Duration:* ${duration}\n`;
        caption += `📁 *Status:* Sending audio...`;

        // Send thumbnail and details first
        if (thumbnail) {
            await conn.sendMessage(from, { 
                image: { url: thumbnail }, 
                caption: caption 
            }, { quoted: mek });
        } else {
            await reply(caption);
        }

        // Send the audio file directly using the working URL
        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            ptt: false
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("YTPlay Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
