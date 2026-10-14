import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== AUTO BODY VIDEO LISTENER ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;

        const rawText = body.trim();
        const lowerText = rawText.toLowerCase();
        
        // Allowed triggers for auto body video download
        const triggers = ['video ', 'ytmp4 ', 'movie ', 'mp4 '];
        
        const matchedTrigger = triggers.find(t => lowerText.startsWith(t));

        if (matchedTrigger) {
            const query = rawText.slice(matchedTrigger.length).trim();
            if (query) {
                await executeVideo(conn, mek, from, query);
            }
        }
    } catch (error) {
        console.error("Auto-Body Video Error:", error);
    }
});

// ==================== VIDEO COMMAND (Prefix Version) ====================
cmd({
    pattern: "video3",
    alias: ["ytmp43", "mp43", "movie3", "ytvideo3"],
    use: '.video <youtube url>',
    desc: "Download videos from YouTube via API",
    category: "downloader",
    react: "🎥",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a YouTube video URL!\n\n` +
                `Example:\n` +
                `• .video https://youtu.be/...`
            );
        }

        await executeVideo(conn, mek, from, text.trim());
    } catch (e) {
        console.error("Error in video command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

// ==================== CORE VIDEO LOGIC ====================
async function executeVideo(conn, mek, from, videoUrl) {
    try {
        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the API endpoint
        const encodedUrl = encodeURIComponent(videoUrl);
        const apiUrl = `https://apiii-xrina.my.id/download/ytmp4?url=${encodedUrl}&quality=360`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // Check if API returned success and data object
        if (!resData || !resData.status || !resData.data || !resData.data.download_url) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return await conn.sendMessage(from, { text: "❌ Could not retrieve the video download link from the API." }, { quoted: mek });
        }

        const info = resData.data;
        
        const downloadUrl = info.download_url;
        const title = info.title || "YouTube Video";
        const quality = info.quality || "360p";
        const creator = resData.creator || "Rin imup";

        // Prepare info caption
        let caption = `> *KAMRAN-MD VIDEO PLAYER* 🎬\n\n`;
        caption += `📌 *Title:* ${title}\n`;
        caption += `⚙️ *Quality:* ${quality}\n`;
        caption += `🛠️ *Creator:* ${creator}\n\n`;
        caption += `📁 *Status:* Video downloading...`;

        // Send details first
        await conn.sendMessage(from, { text: caption }, { quoted: mek });

        // Send the video file using direct download link
        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            mimetype: 'video/mp4',
            caption: title
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("YTMP4 Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        await conn.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: mek });
    }
}
