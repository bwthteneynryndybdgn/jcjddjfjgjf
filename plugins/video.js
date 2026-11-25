//---------------------------------------------------------------------------
//           KAMRAN-MD - DRAMA, CARTOON & VIDEO DOWNLOADER PLUGIN
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);

// Helper function for Stylist Badi ABC Text
const toStylistUpper = (text) => {
    if (!text || typeof text !== 'string') return '';
    const uppercaseMap = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
        'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
        's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
        'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ғ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ',
        'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ',
        'S': 's', 'T': 'ᴛ', 'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ'
    };
    return text.split('').map(char => uppercaseMap[char] || char).join('');
};

function extractDownloadInfo(payload, fallbackTitle) {
    const root = payload?.data?.data || payload?.result?.data || payload?.result || payload?.data || payload || {};
    const dlObj = root?.download || payload?.download || {};

    const downloadUrl =
        dlObj?.url ||
        dlObj?.downloadUrl ||
        root?.url ||
        root?.downloadUrl ||
        root?.download_url ||
        root?.mp4 ||
        payload?.url ||
        payload?.downloadUrl ||
        payload?.download_url ||
        null;

    const title =
        root?.title ||
        dlObj?.title ||
        payload?.title ||
        fallbackTitle;

    const fileName =
        dlObj?.filename ||
        dlObj?.fileName ||
        root?.filename ||
        root?.fileName ||
        `${title}.mp4`;

    const quality =
        dlObj?.quality ||
        root?.quality ||
        null;

    return { downloadUrl, title, fileName, quality };
}

// ==================== HELPER FUNCTION FOR DETAILS & MEDIA ====================
async function sendMediaWithDetails(conn, mek, from, selectedMedia, typeName, isDocument = true) {
    const videoUrl = selectedMedia.url || `https://youtube.com/watch?v=${selectedMedia.videoId}`;
    const mediaTitle = selectedMedia.title || typeName;
    const thumbnail = selectedMedia.thumbnail || selectedMedia.image || (selectedMedia.videoId ? `https://i.ytimg.com/vi/${selectedMedia.videoId}/hqdefault.jpg` : "");
    const duration = selectedMedia.timestamp || selectedMedia.duration || "N/A";
    const views = selectedMedia.views ? selectedMedia.views.toLocaleString() : "N/A";
    const authorName = selectedMedia.author?.name || "Unknown Channel";

    let infoText = `❖ ── ✦ *${toStylistUpper(typeName)} Details* ✦ ── ❖\n\n`;
    infoText += `╔═════ ⌈ *⚡ ${toStylistUpper('Media Info')}* ⌋ ═════✧\n`;
    infoText += `║ 📌 *${toStylistUpper('Title')}:* ${mediaTitle}\n`;
    infoText += `║ 👤 *${toStylistUpper('Channel')}:* ${authorName}\n`;
    infoText += `║ ⏱️ *${toStylistUpper('Duration')}:* ${duration}\n`;
    infoText += `║ 👁️ *${toStylistUpper('Views')}:* ${views}\n`;
    infoText += `╚══════════════════════✧\n\n`;
    infoText += `> 💫 _${toStylistUpper('Video is downloading, please wait...')}_`;

    if (thumbnail) {
        await conn.sendMessage(from, {
            image: { url: thumbnail },
            caption: infoText,
            contextInfo: { mentionedJid: [mek.sender] }
        }, { quoted: mek });
    } else {
        await conn.sendMessage(from, {
            text: infoText,
            contextInfo: { mentionedJid: [mek.sender] }
        }, { quoted: mek });
    }

    const api = `https://jerrycoder.oggyapi.workers.dev/down/ytmp4?url=${encodeURIComponent(videoUrl)}`;
    const { data } = await axios.get(api, {
        timeout: 90000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*'
        }
    });

    const { downloadUrl, title: finalTitle, fileName: rawFileName, quality } = extractDownloadInfo(data, mediaTitle);

    if (!downloadUrl || typeof downloadUrl !== 'string' || !downloadUrl.startsWith('http')) {
        return conn.sendMessage(from, { text: `❌ *${toStylistUpper('Download link not found')}:* ${finalTitle}` }, { quoted: mek });
    }

    const safeFileName = String(rawFileName || `${finalTitle}.mp4`).replace(/[/\\?%*:|"<>]/g, '').trim() || 'video.mp4';

    let finalCaption = `❖ ── ✦ *${toStylistUpper(typeName)}* ✦ ── ❖\n\n`;
    finalCaption += `╔═════ ⌈ *⚡ ${toStylistUpper('File Info')}* ⌋ ═════✧\n`;
    finalCaption += `║ 📌 *${toStylistUpper('Title')}:* ${finalTitle}\n`;
    if (quality) finalCaption += `║ 🎞️ *${toStylistUpper('Quality')}:* ${quality}\n`;
    finalCaption += `╚══════════════════════✧\n\n`;
    finalCaption += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

    let thumbBase64 = "";
    if (isDocument && thumbnail) {
        try {
            const thumbBuffer = await axios.get(thumbnail, { responseType: 'arraybuffer', timeout: 20000 }).then(res => res.data);
            if (thumbBuffer) {
                thumbBase64 = Buffer.from(thumbBuffer).toString('base64');
            }
        } catch (err) {
            console.log("Thumbnail error:", err.message);
        }
    }

    try {
        const videoBuffer = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Referer': 'https://jerrycoder.oggyapi.workers.dev/'
            },
            timeout: 120000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        }).then(res => res.data);

        if (isDocument) {
            const docPayload = {
                document: videoBuffer,
                mimetype: 'video/mp4',
                fileName: safeFileName,
                caption: finalCaption,
                contextInfo: { mentionedJid: [mek.sender] }
            };
            if (thumbBase64) docPayload.jpegThumbnail = thumbBase64;
            await conn.sendMessage(from, docPayload, { quoted: mek });
        } else {
            await conn.sendMessage(from, {
                video: videoBuffer,
                mimetype: 'video/mp4',
                caption: finalCaption,
                contextInfo: { mentionedJid: [mek.sender] }
            }, { quoted: mek });
        }
    } catch (err) {
        console.log("Buffer send error, falling back to URL:", err.message);
        if (isDocument) {
            const docPayload = {
                document: { url: downloadUrl },
                mimetype: 'video/mp4',
                fileName: safeFileName,
                caption: finalCaption,
                contextInfo: { mentionedJid: [mek.sender] }
            };
            if (thumbBase64) docPayload.jpegThumbnail = thumbBase64;
            await conn.sendMessage(from, docPayload, { quoted: mek });
        } else {
            await conn.sendMessage(from, {
                video: { url: downloadUrl },
                mimetype: 'video/mp4',
                caption: finalCaption,
                contextInfo: { mentionedJid: [mek.sender] }
            }, { quoted: mek });
        }
    }

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
}

// ==================== 1. DRAMA COMMAND (Document) ====================
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
        if (!query) return reply(`⚠️ *${toStylistUpper('Usage')}:* .drama <drama name>`);

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        const searchRes = await yts(query);
        const rawResults = searchRes?.videos || searchRes || [];
        if (!rawResults.length) return reply(`❌ *${toStylistUpper('No drama found.')}*`);

        const validEpisodes = rawResults.filter(item => (item.seconds || 0) >= 1200);
        const selected = validEpisodes.length > 0 ? validEpisodes[0] : rawResults[0];

        await sendMediaWithDetails(conn, mek, from, selected, "Drama", true);
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== 2. CARTOON COMMAND (Document) ====================
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
        if (!query) return reply(`⚠️ *${toStylistUpper('Usage')}:* .cartoon <cartoon name>`);

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        const searchRes = await yts(query);
        const rawResults = searchRes?.videos || searchRes || [];
        if (!rawResults.length) return reply(`❌ *${toStylistUpper('No cartoon found.')}*`);

        const validEpisodes = rawResults.filter(item => (item.seconds || 0) >= 600);
        const selected = validEpisodes.length > 0 ? validEpisodes[0] : rawResults[0];

        await sendMediaWithDetails(conn, mek, from, selected, "Cartoon", true);
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== 3. VIDEO COMMAND (Direct Video) ====================
cmd({
    pattern: "video",
    alias: ["ytmp4", "song"],
    use: '.video <song or video name>',
    desc: "Search video, show details with photo, and download as Direct Video",
    category: "downloader",
    react: "📥",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = String(text || "").trim();
        if (!query) return reply(`⚠️ *${toStylistUpper('Usage')}:* .video <song name>`);

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        const searchRes = await yts(query);
        const rawResults = searchRes?.videos || searchRes || [];
        if (!rawResults.length) return reply(`❌ *${toStylistUpper('No video found.')}*`);

        const selected = rawResults[0];
        await sendMediaWithDetails(conn, mek, from, selected, "Video", false);
    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});
