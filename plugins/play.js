import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "videot",
    alias: ["ytmp4t", "vidt", "mp4t"],
    desc: "Download videos from YouTube using Kamran YTMP4 API",
    category: "downloader",
    react: "🎥",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `⚠️ Please provide a video URL!\n\n` +
                `Example:\n` +
                `• .video https://youtube.com/...`
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const encodedUrl = encodeURIComponent(text.trim());
        const apiUrl = `https://apis-site-kamran.vercel.app/api/download/ytmp4?url=${encodedUrl}&resolution=480`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not fetch video from API.");
        }

        const result = resData.result;
        const title = result.title || "YouTube Video";
        const downloadUrl = result.url; // Direct VPS output link

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Direct video download link not found.");
        }

        let caption = `🎬 *Title:* ${title}\n`;
        if (result.duration) caption += `⏱️ *Duration:* ${result.duration}s\n`;
        if (result.author) caption += `👤 *Author:* ${result.author}\n`;
        caption += `✨ *Creator:* ${resData.creator || "DRKAMRAN"}\n`;
        caption += `📁 *Status:* Sending video...`;

        // Send the video file directly using the clean output url
        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            mimetype: 'video/mp4',
            caption: caption
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Video Command Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
