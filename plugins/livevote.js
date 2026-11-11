import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play533",
    alias: ["ytplay", "song", "plays"],
    desc: "Search and download songs from YouTube via FAA API",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a song name or search query!\n\n` +
                `Example:\n` +
                `• .play Song pal`
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the API endpoint
        const encodedQuery = encodeURIComponent(text.trim());
        const apiUrl = `https://api.nexray.web.id/downloader/ytplay?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // DEBUG: Check your bot's console/terminal to see the exact API structure
        console.log("API Response:", JSON.stringify(resData, null, 2));

        // Check if API returned success
        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not find any results for that song.");
        }

        const info = resData.result;
        
        // Extract metadata safely
        const title = info.title || text;
        const thumbnail = info.thumbnail || '';
        const duration = info.duration_timestamp || info.duration || '';
        const author = info.author || info.channel || '';

        // FIX: Try multiple possible keys for the MP3 URL
        // APIs often change keys between 'mp3', 'download', 'url', 'link', or nested objects
        let audioUrl = info.mp3 || 
                       info.download || 
                       info.url || 
                       info.link || 
                       info.audio ||
                       (info.media && (info.media.mp3 || info.media.download || info.media.url));

        // If still no URL, check if the API returned an error message in the result
        if (!audioUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            // Show available keys to help debugging
            const availableKeys = Object.keys(info).join(', ');
            return reply(`❌ Failed to retrieve MP3 link.\nAvailable keys in response: ${availableKeys}`);
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

        // Send the audio file using direct mp3 link
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
