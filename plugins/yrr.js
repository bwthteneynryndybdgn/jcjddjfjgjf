import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== AUTO SONG LISTENER (BODY HOOK) ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;

        const rawText = body.trim().toLowerCase();
        const songKeywords = ['play', 'song', 'audio', 'music', 'play2', 'ytplay', 'song17'];
        
        let query = "";
        let matched = false;

        for (let keyword of songKeywords) {
            if (rawText === keyword || rawText.startsWith(keyword + " ")) {
                matched = true;
                query = body.trim().slice(keyword.length).trim();
                break;
            }
        }

        // Triggers automatically in both Inbox and Groups
        if (matched && query) {
            await executeSongDownload(conn, mek, from, query);
        }
    } catch (error) {
        console.error("Auto-Body Song Error:", error);
    }
});

// ==================== SONG DOWNLOAD COMMAND (Prefix Version) ====================
cmd({
    pattern: "play2",
    alias: ["song2", "audio3", "music4", "play0"],
    use: '.play <song name>',
    desc: "Search and download songs from YouTube automatically.",
    category: "downloader",
    react: "🎵",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(`⚠️ Please provide a song name!\n\nExample:\n• .play Song pal`);
        }
        await executeSongDownload(conn, mek, from, text.trim());
    } catch (e) {
        console.error("Error in song command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

// ==================== CORE SONG DOWNLOAD LOGIC ====================
async function executeSongDownload(conn, mek, from, query) {
    try {
        // ⏳ Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const encodedQuery = encodeURIComponent(query);
        const apiUrl = `https://apiii-xrina.my.id/download/play?q=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status || !resData.data) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return;
        }

        const info = resData.data;
        const audioUrl = info.media?.[0] || info.music || '';
        const title = info.title || query;
        const thumbnail = info.cover || '';
        const duration = info.duration || '';     
        const author = info.author?.nickname || '';

        if (!audioUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return;
        }

        let caption = `🎶 *Title:* ${title}\n`;
        if (author) caption += `👤 *Channel:* ${author}\n`;
        if (duration) caption += `⏱️ *Duration:* ${duration}\n`;
        caption += `📁 *Status:* Downloading audio...`;

        // Send thumbnail and details first
        if (thumbnail) {
            await conn.sendMessage(from, { 
                image: { url: thumbnail }, 
                caption: caption 
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { text: caption }, { quoted: mek });
        }

        // Send the audio file
        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            ptt: false 
        }, { quoted: mek });

        // ✅ Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Error in executeSongDownload:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
}
