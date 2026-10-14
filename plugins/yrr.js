import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play111",
    alias: ["ytplay111", "song111", "plays111"],
    desc: "Search and download songs from YouTube via Xrina API",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (client, message, m, { from, q, text, reply }) => {
    try {
        const query = text || q;
        if (!query) {
            return reply(
                `⚠️ Please provide a song name or search query!\n\n` +
                `Example:\n` +
                `• .play Song pal`
            );
        }

        // Loading reaction
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        // Call the API endpoint
        const encodedQuery = encodeURIComponent(query.trim());
        const apiUrl = `https://apiii-xrina.my.id/download/play?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // Check if API returned success and data object
        if (!resData || !resData.status || !resData.data) {
            await client.sendMessage(from, { react: { text: '❌', key: message.key } });
            return client.sendMessage(from, { text: "❌ Could not find any results for that song." }, { quoted: message });
        }

        const info = resData.data;
        const audioUrl = info.music; 
        const title = info.title || query;
        const thumbnail = info.cover || ''; 
        const duration = info.duration || ''; 
        const author = info.author?.nickname || ''; 

        if (!audioUrl) {
            await client.sendMessage(from, { react: { text: '❌', key: message.key } });
            return client.sendMessage(from, { text: "❌ Failed to retrieve the MP3 download link from the API response." }, { quoted: message });
        }

        // Prepare info caption
        let caption = `🎶 *Title:* ${title}\n`;
        if (author) caption += `👤 *Artist/Channel:* ${author}\n`;
        if (duration) caption += `⏱️ *Duration:* ${duration}\n`;
        caption += `📁 *Status:* Downloading audio...`;

        // Send thumbnail and details first
        if (thumbnail) {
            await client.sendMessage(from, { 
                image: { url: thumbnail }, 
                caption: caption 
            }, { quoted: message });
        } else {
            await client.sendMessage(from, { text: caption }, { quoted: message });
        }

        // Send the audio file using direct mp3 link
        await client.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            ptt: false 
        }, { quoted: message });

        // Success reaction
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    }caught (error) {
        console.error("YTPlay Error:", error);
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
        return client.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: message });
    }
});
