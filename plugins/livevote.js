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

        // DEBUG: Log the entire response to your console to see the actual structure
        console.log("API Response:", JSON.stringify(resData, null, 2));

        // Check if API returned success
        if (!resData || !resData.status) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ API returned an error or no status.");
        }

        const info = resData.result;
        
        if (!info) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ No results found in API response.");
        }

        // Extract metadata
        const title = info.title || text;
        const thumbnail = info.thumbnail || '';
        const duration = info.duration_timestamp || info.duration || '';
        const author = info.author || info.channel || '';

        // Try multiple possible keys for the MP3 URL
        // Common keys: mp3, download, url, link, audio
        let audioUrl = info.mp3 || info.download || info.url || info.link || info.audio;

        // If still not found, check if it's nested deeper (e.g., result.media.mp3)
        if (!audioUrl && info.media) {
            audioUrl = info.media.mp3 || info.media.download || info.media.url;
        }

        if (!audioUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            // Helpful error message showing available keys
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
