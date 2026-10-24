import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);

// ==================== 1. DRAMA COMMAND ====================
cmd({
    pattern: "drama",
    alias: ["pakdrama", "dramas"],
    use: '.drama <drama name>',
    desc: "Search exact drama and download full episode as Document",
    category: "downloader",
    react: "📺",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = String(text || "").trim();
        if (!query) {
            return reply(`⚠️ *DRAMA SEARCH*\n\nUsage:\n• .drama <drama name>\nMisal ke tor par: .drama Mohabbat Episode 01`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const searchRes = await yts(query);
        const rawResults = searchRes?.videos || searchRes || [];

        if (!rawResults || rawResults.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Is naam ka koyi drama nahi mila.`);
        }

        // Filter for full episodes (duration >= 20 minutes)
        const validEpisodes = rawResults.filter(item => {
            const seconds = item.seconds || 0;
            return seconds >= 1200; 
        });

        const selectedDrama = validEpisodes.length > 0 ? validEpisodes[0] : rawResults[0];
        const videoUrl = selectedDrama.url || `https://youtube.com/watch?v=${selectedDrama.videoId}`;
        const dramaTitle = selectedDrama.title || query;

        await conn.sendMessage(from, { text: `> *KAMRAN-MD DRAMA DOWNLOADER* 📺\n\n📌 *Found:* ${dramaTitle}\n_Drama document download ho raha hai, barae meharbani intezar karein..._` }, { quoted: mek });

        const api = `https://api.nexray.eu.cc/downloader/v1/ytmp4?url=${encodeURIComponent(videoUrl)}&resolusi=360`;
        const { data } = await axios.get(api, { 
            timeout: 90000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        const resData = data?.result || data;
        const downloadUrl = resData?.url || resData?.downloadUrl;
        const finalTitle = resData?.title || dramaTitle;

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Drama download link nahi mila: ${finalTitle}`);
        }

        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            mimetype: 'video/mp4',
            fileName: `${finalTitle.replace(/[/\\?%*:|"<>]/g, '').trim()}.mp4`,
            caption: `📺 *${finalTitle}*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("[DRAMA ERROR]", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }, { quoted: mek });
        return reply(`❌ Error: ${e.message}`);
    }
});


// ==================== 2. CARTOON COMMAND ====================
cmd({
    pattern: "cartoon",
    alias: ["cartoons", "kids"],
    use: '.cartoon <cartoon name>',
    desc: "Search exact cartoon and download full episode as Document",
    category: "downloader",
    react: "🧸",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = String(text || "").trim();
        if (!query) {
            return reply(`⚠️ *CARTOON SEARCH*\n\nUsage:\n• .cartoon <cartoon name>\nMisal ke tor par: .cartoon Doraemon`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const searchRes = await yts(query);
        const rawResults = searchRes?.videos || searchRes || [];

        if (!rawResults || rawResults.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Is naam ka koyi cartoon nahi mila.`);
        }

        const validEpisodes = rawResults.filter(item => {
            const seconds = item.seconds || 0;
            return seconds >= 600; // 10 minutes filter for cartoons
        });

        const selectedCartoon = validEpisodes.length > 0 ? validEpisodes[0] : rawResults[0];
        const videoUrl = selectedCartoon.url || `https://youtube.com/watch?v=${selectedCartoon.videoId}`;
        const cartoonTitle = selectedCartoon.title || query;

        await conn.sendMessage(from, { text: `> *KAMRAN-MD CARTOON DOWNLOADER* 🧸\n\n📌 *Found:* ${cartoonTitle}\n_Cartoon document download ho raha hai, barae meharbani intezar karein..._` }, { quoted: mek });

        const api = `https://api.nexray.eu.cc/downloader/v1/ytmp4?url=${encodeURIComponent(videoUrl)}&resolusi=360`;
        const { data } = await axios.get(api, { 
            timeout: 90000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        const resData = data?.result || data;
        const downloadUrl = resData?.url || resData?.downloadUrl;
        const finalTitle = resData?.title || cartoonTitle;

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Cartoon download link nahi mila: ${finalTitle}`);
        }

        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            mimetype: 'video/mp4',
            fileName: `${finalTitle.replace(/[/\\?%*:|"<>]/g, '').trim()}.mp4`,
            caption: `🧸 *${finalTitle}*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("[CARTOON ERROR]", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }, { quoted: mek });
        return reply(`❌ Error: ${e.message}`);
    }
});


// ==================== 3. VIDEO COMMAND ====================
cmd({
    pattern: "video",
    alias: ["ytmp4", "ytv"],
    use: '.video <song or video name>',
    desc: "Search and download any video or song as Document",
    category: "downloader",
    react: "📥",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = String(text || "").trim();
        if (!query) {
            return reply(`⚠️ *VIDEO SEARCH*\n\nUsage:\n• .video <song/video name>\nMisal ke tor par: .video Pal Song`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const searchRes = await yts(query);
        const rawResults = searchRes?.videos || searchRes || [];

        if (!rawResults || rawResults.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Is naam se koyi video nahi mili.`);
        }

        const selectedVideo = rawResults[0];
        const videoUrl = selectedVideo.url || `https://youtube.com/watch?v=${selectedVideo.videoId}`;
        const videoTitle = selectedVideo.title || query;

        await conn.sendMessage(from, { text: `> *KAMRAN-MD VIDEO DOWNLOADER* 📥\n\n📌 *Found:* ${videoTitle}\n_Video document download ho rahi hai, barae meharbani intezar karein..._` }, { quoted: mek });

        const api = `https://api.nexray.eu.cc/downloader/v1/ytmp4?url=${encodeURIComponent(videoUrl)}&resolusi=360`;
        const { data } = await axios.get(api, { 
            timeout: 90000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        const resData = data?.result || data;
        const downloadUrl = resData?.url || resData?.downloadUrl;
        const finalTitle = resData?.title || videoTitle;

        if (!downloadUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ Video download link nahi mila: ${finalTitle}`);
        }

        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            mimetype: 'video/mp4',
            fileName: `${finalTitle.replace(/[/\\?%*:|"<>]/g, '').trim()}.mp4`,
            caption: `📥 *${finalTitle}*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("[VIDEO ERROR]", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }, { quoted: mek });
        return reply(`❌ Error: ${e.message}`);
    }
});
