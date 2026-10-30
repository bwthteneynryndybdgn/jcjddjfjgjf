//---------------------------------------------------------------------------
//           KAMRAN-MD - YOUTUBE VIDEO DOCUMENT DOWNLOADER
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "video756",
    alias: ["ytmp444", "ytvideo"],
    use: '.video <youtube_url>',
    desc: "Download YouTube video as a document via Xrina API",
    category: "downloader",
    react: "📥",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, react }) => {
    try {
        const ytUrl = String(text || "").trim();
        if (!ytUrl || !ytUrl.includes("http")) {
            let helpMsg = `❖ ── ✦ *YOUTUBE DOCUMENT DOWNLOADER* ✦ ── ❖\n\n`;
            helpMsg += `📌 *Example:*\n`;
            helpMsg += `• .video https://youtu.be/...\n\n`;
            helpMsg += `> 💫 _Powered by Kamran-Md_`;
            return reply(helpMsg);
        }

        await react("🔍");
        await conn.sendPresenceUpdate('composing', from);
        await reply(`🔍 _Fetching video details from API..._`);

        const apiUrl = `https://apiii-xrina.my.id/download/youtube-dl?url=${encodeURIComponent(ytUrl)}`;
        const response = await fetch(apiUrl);
        const resData = await response.json();

        if (!resData || !resData.status || !resData.data || !resData.data.data) {
            await react("❌");
            return reply(`❌ Failed to fetch video details from API!`);
        }

        const videoInfo = resData.data.data;
        const videoTitle = videoInfo.title ? videoInfo.title.trim() : 'YouTube Video';
        const duration = videoInfo.duration ? `${Math.floor(videoInfo.duration / 60)}:${videoInfo.duration % 60}` : 'N/A';
        
        // Medias array se pehla available video link uthana (jaise 720p ya best quality)
        const medias = videoInfo.medias || [];
        const selectedMedia = medias.find(v => v.quality === "720p" && v.url) || medias.find(v => v.url);

        if (!selectedMedia || !selectedMedia.url) {
            await react("❌");
            return reply(`❌ Direct video download link not found in API response.`);
        }

        const directVideoUrl = selectedMedia.url;
        const fileSizeStr = selectedMedia.sizeStr || 'N/A';
        const cleanFileName = `${videoTitle.replace(/[^a-zA-Z0-9 ]/g, "_").trim()}.mp4`;

        let finalCaption = `❖ ── ✦ *${videoTitle}* ✦ ── ❖\n\n`;
        finalCaption += `⏱️ *Duration:* ${duration}\n`;
        finalCaption += `📦 *File Size:* ${fileSizeStr}\n`;
        finalCaption += `📁 *Format:* Document (.mp4)\n\n`;
        finalCaption += `> 💫 _Powered by Kamran-Md_`;

        await react("📥");
        await conn.sendPresenceUpdate('composing', from);
        await reply(`🚀 _Preparing video document, please wait!_`);

        let documentPayload = {
            document: { url: directVideoUrl },
            mimetype: "video/mp4",
            fileName: cleanFileName,
            caption: finalCaption,
            contextInfo: { mentionedJid: [mek.sender] }
        };

        await conn.sendMessage(from, documentPayload, { quoted: mek });
        await react("✅");

    } catch (e) {
        console.error("YouTube Downloader Error:", e.message);
        await react("❌");
        return reply(`❌ Error Processing Request: ${e.message}`);
    }
});
