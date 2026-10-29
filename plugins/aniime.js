//---------------------------------------------------------------------------
//           KAMRAN-MD - AIO ALL-IN-ONE DOCUMENT DOWNLOADER
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

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

cmd({
    pattern: "aio74",
    alias: ["download53", "dl64", "all54"],
    use: '.aio <media_url>',
    desc: "Download videos/media from any supported platform as document via AIO API",
    category: "downloader",
    react: "📥",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, react }) => {
    try {
        const targetUrl = String(text || "").trim();
        if (!targetUrl || !targetUrl.includes("http")) {
            let helpMsg = `❖ ── ✦ *${toStylistUpper('AIO Document Downloader')}* ✦ ── ❖\n\n`;
            helpMsg += `╔═════ ⌈ *⚡ ${toStylistUpper('Usage Guide')}* ⌋ ═════✧\n`;
            helpMsg += `║ 📌 *${toStylistUpper('Example')}:*\n`;
            helpMsg += `║ • .aio https://youtu.be/...\n`;
            helpMsg += `╚══════════════════════✧\n\n`;
            helpMsg += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;
            return reply(helpMsg);
        }

        await react("🔍");
        await conn.sendPresenceUpdate('composing', from);
        await reply(`🔍 _${toStylistUpper('Fetching media details from AIO API')}..._`);

        const apiUrl = `https://prexzyapis.com/download/aio?url=${encodeURIComponent(targetUrl)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status) {
            await react("❌");
            return reply(`🛸 *${toStylistUpper('Failed to fetch media from AIO API!')}*`);
        }

        // Result ya data object ko handle karna
        const mediaInfo = resData.result || resData.data || resData;
        const directVideoUrl = mediaInfo.url || mediaInfo.videoUrl || mediaInfo.download || (mediaInfo.medias && mediaInfo.medias[0]?.url);

        if (!directVideoUrl) {
            await react("❌");
            return reply(`❌ *${toStylistUpper('Direct download link not found in API response.')}*`);
        }

        const mediaTitle = mediaInfo.title ? mediaInfo.title.trim() : 'Downloaded Media';
        const cleanFileName = `${mediaTitle.replace(/[^a-zA-Z0-9 ]/g, "_").trim()}.mp4`;

        let finalCaption = `❖ ── ✦ *${toStylistUpper(mediaTitle)}* ✦ ── ❖\n\n`;
        if (mediaInfo.duration) {
            finalCaption += `⏱️ *${toStylistUpper('Duration')}:* ${mediaInfo.duration}\n`;
        }
        finalCaption += `📁 *${toStylistUpper('Format')}:* Document (.mp4)\n\n`;
        finalCaption += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

        await react("📥");
        await conn.sendPresenceUpdate('composing', from);
        await reply(`🚀 *${toStylistUpper('Preparing document for chat')}...*`);

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
        console.error("AIO Downloader Error:", e.message);
        await react("❌");
        return reply(`❌ *${toStylistUpper('Error Processing Request')}:* ${e.message}`);
    }
});
