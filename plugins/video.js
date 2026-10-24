import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);

// ==================== HELPER FUNCTION FOR DOWNLOAD WITH THUMBNAIL ====================
async function sendMediaAsDoc(conn, mek, from, selectedMedia, typeName) {
    const videoUrl = selectedMedia.url || `https://youtube.com/watch?v=${selectedMedia.videoId}`;
    const mediaTitle = selectedMedia.title || typeName;
    const thumbnail = selectedMedia.thumbnail || selectedMedia.image || "";

    await conn.sendMessage(from, { text: `> *KAMRAN-MD ${typeName.toUpperCase()} DOWNLOADER* 📥\n\n📌 *Found:* ${mediaTitle}\n_Document aur thumbnail download ho raha hai, intezar karein..._` }, { quoted: mek });

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

    // Sending document with thumbnail preview
    let docPayload = {
        document: { url: downloadUrl },
        mimetype: 'video/mp4',
        fileName: `${finalTitle.replace(/[/\\?%*:|"<>]/g, '').trim()}.mp4`,
        caption: `📥 *${finalTitle}*`
    };

    if (thumbnail) {
        try {
            // Fetch thumbnail buffer for preview
            const thumbBuffer = await axios.get(thumbnail, { responseType: 'arraybuffer' }).then(res => res.data);
            if (thumbBuffer) {
                docPayload.jpegThumbnail = thumbBuffer.toString('base64');
            }
        } catch (err) {
            console.log("Thumbnail fetch error:", err.message);
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
    desc: "Search exact drama and download full episode as Document with Thumbnail",
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

        await sendMediaAsDoc(conn, mek, from, selected, "drama");
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== 2. CARTOON COMMAND ====================
cmd({
    pattern: "cartoon",
    alias: ["cartoons", "kids"],
    use: '.cartoon <cartoon name>',
    desc: "Search exact cartoon and download full episode as Document with Thumbnail",
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

        await sendMediaAsDoc(conn, mek, from, selected, "cartoon");
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== 3. VIDEO COMMAND ====================
cmd({
    pattern: "video",
    alias: ["ytmp4", "song"],
    use: '.video <song or video name>',
    desc: "Search and download any video or song as Document with Thumbnail",
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
        await sendMediaAsDoc(conn, mek, from, selected, "video");
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});
