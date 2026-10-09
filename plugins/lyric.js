// plugins/song.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play1",
    alias: ["ytplay1", "song1", "plays1", "song2"],
    desc: "Search and download songs from YouTube via Nexray API (Buffer Fix)",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a song name or search query!\n\n` +
                `Example:\n` +
                `• .play song pal`
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the Nexray API endpoint
        const encodedQuery = encodeURIComponent(text.trim());
        const apiUrl = `https://api.nexray.eu.cc/downloader/ytplay?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // Check if API returned success and result object
        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not find any results for that song.");
        }

        const info = resData.result;
        const audioUrl = info.download_url;
        const title = info.title || text;
        const thumbnail = info.thumbnail || '';
        const duration = info.duration || '';
        const author = info.channel || '';

        if (!audioUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve the MP3 download link from the API response.");
        }

        // Prepare info caption
        let caption = `🎶 *Title:* ${title}\n`;
        if (author) caption += `👤 *Artist/Channel:* ${author}\n`;
        if (duration) caption += `⏱️ *Duration:* ${duration}\n`;
        caption += `📁 *Status:* Downloading audio buffer...`;

        // Send thumbnail and details first
        if (thumbnail) {
            await conn.sendMessage(from, { 
                image: { url: thumbnail }, 
                caption: caption 
            }, { quoted: mek });
        } else {
            await reply(caption);
        }

        // Stream error fix: Audio file ko pehle buffer me download karenge
        const audioBufferRes = await axios.get(audioUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            timeout: 60000
        });

        const audioBuffer = Buffer.from(audioBufferRes.data);

        // Send the audio file using Buffer
        await conn.sendMessage(from, {
            audio: audioBuffer,
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
