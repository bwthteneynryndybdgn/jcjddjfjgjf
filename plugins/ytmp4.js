// plugins/ytmp4.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "ytmp443",
    alias: ["ytvideo76", "ytdl88", "youtube"],
    react: '📥',
    desc: "Download large YouTube videos as document (Up to 1GB+)",
    category: "downloader",
    filename: __filename
}, async (client, message, m, { 
    from, 
    prefix, 
    command, 
    args, 
    q, 
    isCreator,
    userConfig
}) => {
    try {
        if (!q) {
            return await client.sendMessage(from, {
                text: `*🍁 Please provide a YouTube video link or Video ID!*\n\n*Example:* ${prefix + command} https://youtu.be/...`
            }, { quoted: message });
        }

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "Powered by Bot";

        // Initial reaction
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        let targetInput = q.trim();

        // Aapki YouTube Downloader API Endpoint
        const apiUrl = `https://techxkamran.vercel.app/api/download/ytmp3?url=${encodeURIComponent(targetInput)}`;

        const response = await axios.get(apiUrl, { timeout: 60000 }); // Badi videos/movies ke liye 60s timeout
        const resData = response.data;

        // API response validation
        if (!resData || !resData.status || !resData.download) {
            return await client.sendMessage(from, {
                text: "❌ *YouTube video download link nahi mil saki!* Kripya link check karein."
            }, { quoted: message });
        }

        const videoTitle = resData.title || "YouTube Video";
        const thumbnail = resData.thumbnail || "";
        const downloadUrl = resData.download;
        const videoId = resData.videoId || "";

        // Message caption
        let caption = `*📥 YOUTUBE VIDEO DOWNLOADER* 📥\n\n`;
        caption += `*▪ Title:* ${videoTitle}\n`;
        caption += `*▪ Platform:* YouTube\n\n`;
        caption += `> ${DESCRIPTION}`;

        // Send as Document so large files (Movies / 1GB+) can be sent safely
        const options = {
            document: { url: downloadUrl },
            mimetype: 'video/mp4',
            fileName: `${videoTitle.replace(/[/\\?%*:|"<>]/g, '').substring(0, 100)}.mp4`,
            caption: caption,
            contextInfo: {
                externalAdReply: {
                    title: videoTitle,
                    body: `YouTube Video Downloader`,
                    mediaType: 2,
                    thumbnailUrl: thumbnail,
                    sourceUrl: videoId ? `https://youtu.be/${videoId}` : targetInput,
                    renderLargerThumbnail: true
                }
            }
        };

        await client.sendMessage(from, options, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error("YouTube Download Error:", error);
        let errorMsg = error?.message || error;
        await client.sendMessage(from, {
            text: "❌ Error downloading YouTube video:\n" + errorMsg
        }, { quoted: message });
    }
});
