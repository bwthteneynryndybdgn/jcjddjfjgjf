import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== AUTO BODY PLAY LISTENER ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;

        const rawText = body.trim();
        const lowerText = rawText.toLowerCase();
        
        // Auto trigger agar message "play " ya "song " se start ho
        if (lowerText.startsWith('play ') || lowerText.startsWith('song ')) {
            const query = rawText.split(' ').slice(1).join(' ').trim();
            if (query) {
                await executePlay(conn, mek, from, query);
            }
        }
    } catch (error) {
        console.error("Auto-Body Play Error:", error);
    }
});

// ==================== PLAY COMMAND (Prefix Version) ====================
cmd({
    pattern: "play17",
    alias: ["ytplay17", "song17", "plays17"],
    use: '.play17 <song name>',
    desc: "Search and download songs from YouTube via API",
    category: "downloader",
    react: "🎵",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a song name or search query!\n\n` +
                `Example:\n` +
                `• .play17 Song pal`
            );
        }

        await executePlay(conn, mek, from, text.trim());
    } catch (e) {
        console.error("Error in play17 command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

// ==================== CORE PLAY LOGIC ====================
async function executePlay(conn, mek, from, searchQuery) {
    try {
        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the API endpoint
        const encodedQuery = encodeURIComponent(searchQuery);
        const apiUrl = `https://api.azbry.com/api/download/ytplay2?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // Check if API returned success and result object
        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return await conn.sendMessage(from, { text: "❌ Could not find any results for that song." }, { quoted: mek });
        }

        const info = resData.result;
        
        const audioUrl = info.download;
        const title = info.title || searchQuery;
        const thumbnail = info.thumbnail || '';
        const duration = info.duration || '';
        const author = info.channel || '';

        if (!audioUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return await conn.sendMessage(from, { text: "❌ Failed to retrieve the MP3 download link from the API response." }, { quoted: mek });
        }

        // Prepare info caption
        let caption = `> *KAMRAN-MD AUDIO PLAYER* 🎵\n\n`;
        caption += `🎶 *Title:* ${title}\n`;
        if (author) caption += `👤 *Artist/Channel:* ${author}\n`;
        if (duration) caption += `⏱️ *Duration:* ${duration}\n`;
        caption += `📁 *Status:* Audio downloaded successfully!`;

        // Send thumbnail and details first
        if (thumbnail) {
            await conn.sendMessage(from, { 
                image: { url: thumbnail }, 
                caption: caption 
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { 
                text: caption 
            }, { quoted: mek });
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
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        await conn.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: mek });
    }
}
