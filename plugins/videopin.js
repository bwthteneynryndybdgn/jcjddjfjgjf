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

// ==================== HELPER FUNCTION FOR DETAILS & MEDIA ====================
async function sendMediaWithDetails(conn, mek, from, selectedMedia, typeName, isDocument = true) {
    const videoUrl = selectedMedia.url || `https://youtube.com/watch?v=${selectedMedia.videoId}`;
    const mediaTitle = selectedMedia.title || typeName;
    const thumbnail = selectedMedia.thumbnail || selectedMedia.image || "";
    const duration = selectedMedia.timestamp || selectedMedia.duration || "N/A";
    const views = selectedMedia.views ? selectedMedia.views.toLocaleString() : "N/A";
    const authorName = selectedMedia.author?.name || "Unknown Channel";

    // Styled Info Card
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

    // New Working API integration
    const api = `https://apiii-xrina.my.id/download/youtube-dl?url=${encodeURIComponent(videoUrl)}`;
    const { data } = await axios.get(api, { 
        timeout: 90000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    const resData = data?.data?.data || data?.result || data;
    const medias = resData?.medias || [];
    
    // 360p ya 480p format select karna (jo unlocked ho)
    const selectedMediaFormat = medias.find(v => v.quality === '360p' && !v.locked && v.url) ||
                                medias.find(v => v.quality === '480p' && !v.locked && v.url) ||
                                medias.find(v => !v.locked && v.url && v.format?.includes('mp4'));

    const downloadUrl = selectedMediaFormat?.url;
    const finalTitle = resData?.title || mediaTitle;

    if (!downloadUrl) {
        return conn.sendMessage(from, { text: `❌ *${toStylistUpper('Download link not found')}:* ${finalTitle}` });
    }

    let finalCaption = `❖ ── ✦ *${toStylistUpper(typeName)}* ✦ ── ❖\n\n`;
    finalCaption += `╔═════ ⌈ *⚡ ${toStylistUpper('File Info')}* ⌋ ═════✧\n`;
    finalCaption += `║ 📌 *${toStylistUpper('Title')}:* ${finalTitle}\n`;
    finalCaption += `╚══════════════════════✧\n\n`;
    finalCaption += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

    if (isDocument) {
        let docPayload = {
            document: { url: downloadUrl },
            mimetype: 'video/mp4',
            fileName: `${finalTitle.replace(/[/\\?%*:|"<>]/g, '').trim()}.mp4`,
            caption: finalCaption,
            contextInfo: { mentionedJid: [mek.sender] }
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
    } else {
        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            mimetype: 'video/mp4',
            caption: finalCaption,
            contextInfo: { mentionedJid: [mek.sender] }
        }, { quoted: mek });
    }

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
}

// ==================== 1. DRAMA COMMAND (Document) ====================
cmd({
    pattern: "drama644",
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
    pattern: "video655",
    alias: ["ytmp4655", "song656"],
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
