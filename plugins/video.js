import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);

// ==================== HELPER FUNCTION FOR DETAIL & DOCUMENT ====================
async function sendMediaWithDetails(conn, mek, from, selectedMedia, typeName) {
    const videoUrl = selectedMedia.url || `https://youtube.com/watch?v=${selectedMedia.videoId}`;
    const mediaTitle = selectedMedia.title || typeName;
    const thumbnail = selectedMedia.thumbnail || selectedMedia.image || "";
    const duration = selectedMedia.timestamp || selectedMedia.duration || "N/A";
    const views = selectedMedia.views ? selectedMedia.views.toLocaleString() : "N/A";
    const authorName = selectedMedia.author?.name || "Unknown Channel";

    // 1. Pehle detailed card (Thumbnail image aur info ke sath) bhejenge
    let infoText = `> *KAMRAN-MD ${typeName.toUpperCase()} DETAILS* 📺\n\n`;
    infoText += `📌 *Title:* ${mediaTitle}\n`;
    infoText += `👤 *Channel:* ${authorName}\n`;
    infoText += `⏱️ *Duration:* ${duration}\n`;
    infoText += `👁️ *Views:* ${views}\n\n`;
    infoText += `_Document file download ho rahi hai, barae meharbani intezar karein..._`;

    if (thumbnail) {
        await conn.sendMessage(from, { 
            image: { url: thumbnail }, 
            caption: infoText 
        }, { quoted: mek });
    } else {
        await conn.sendMessage(from, { text: infoText }, { quoted: mek });
    }

    // 2. NexRay API se video download link lena
    const api = `https://api.nexray.eu.cc/downloader/v1/ytmp4?url=${encodeURIComponent(videoUrl)}&resolusi=360`;
    const { data } = await axios.get(api, { 
        timeout: 90000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    const resData = data?.result || data;
    const downloadUrl = resData?.url || resData?.downloadUrl;
    const finalTitle = resData?.title || mediaTitle;

    if (!downloadUrl) {
        return conn.sendMessage(from, { text: `❌ Download link nahi mila: ${finalTitle}` });
    }

    // 3. Akhir mein strictly Document format mein video bhejna
    let docPayload = {
        document: { url: downloadUrl },
        mimetype: 'video/mp4',
        fileName: `${finalTitle.replace(/[/\\?%*:|"<>]/g, '').trim()}.mp4`,
        caption: `📥 *${finalTitle}*`
    };

    if (thumbnail) {
        try {
            const thumbBuffer = await axios.get(thumbnail, { responseType: 'arraybuffer' }).then(res => res.data);
            if (thumbBuffer) {
                docPayload.jpegThumbnail = thumbBuffer.toString('base64');
            }
        } catch (err) {
            console.log("Thumbnail error:", err.message);
        }
    }

    await conn.sendMessage(from, docPayload, { quoted: mek });
    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
}

// ==================== 1. DRAMA COMMAND ====================
cmd({
    pattern: "drama",
    alias: ["pakdrama", "dramas"],
    use: '.drama <drama name>',
    desc: "Search drama, show details with photo, and download as Document",
    category: "downloader",
    react: "📺",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = String(text || "").trim();
        if (!query) return reply(`⚠️ Usage: .drama <drama name>`);

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        const searchRes = await yts(query);
        const rawResults = searchRes?.videos || searchRes || [];
        if (!rawResults.length) return reply(`❌ Koyi drama nahi mila.`);

        const validEpisodes = rawResults.filter(item => (item.seconds || 0) >= 1200);
        const selected = validEpisodes.length > 0 ? validEpisodes[0] : rawResults[0];

        await sendMediaWithDetails(conn, mek, from, selected, "drama");
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== 2. CARTOON COMMAND ====================
cmd({
    pattern: "cartoon",
    alias: ["cartoons", "kids"],
    use: '.cartoon <cartoon name>',
    desc: "Search cartoon, show details with photo, and download as Document",
    category: "downloader",
    react: "🧸",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = String(text || "").trim();
        if (!query) return reply(`⚠️ Usage: .cartoon <cartoon name>`);

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        const searchRes = await yts(query);
        const rawResults = searchRes?.videos || searchRes || [];
        if (!rawResults.length) return reply(`❌ Koyi cartoon nahi mila.`);

        const validEpisodes = rawResults.filter(item => (item.seconds || 0) >= 600);
        const selected = validEpisodes.length > 0 ? validEpisodes[0] : rawResults[0];

        await sendMediaWithDetails(conn, mek, from, selected, "cartoon");
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== 3. VIDEO COMMAND ====================
cmd({
    pattern: "video",
    alias: ["ytmp4", "song"],
    use: '.video <song or video name>',
    desc: "Search video, show details with photo, and download as Document",
    category: "downloader",
    react: "📥",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = String(text || "").trim();
        if (!query) return reply(`⚠️ Usage: .video <song name>`);

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        const searchRes = await yts(query);
        const rawResults = searchRes?.videos || searchRes || [];
        if (!rawResults.length) return reply(`❌ Koyi video nahi mili.`);

        const selected = rawResults[0];
        await sendMediaWithDetails(conn, mek, from, selected, "video");
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});
