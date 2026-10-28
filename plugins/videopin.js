//---------------------------------------------------------------------------
//           KAMRAN-MD - MOVIE DOCUMENT DOWNLOADER (STREAM FIXED)
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
    pattern: "movie",
    alias: ["film", "fullmovie"],
    use: '.movie <youtube_url>',
    desc: "Download full movies as high quality documents via API",
    category: "downloader",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, react }) => {
    try {
        const ytUrl = String(text || "").trim();
        if (!ytUrl || !ytUrl.includes("http")) {
            let helpMsg = `❖ ── ✦ *${toStylistUpper('Movie Document Downloader')}* ✦ ── ❖\n\n`;
            helpMsg += `╔═════ ⌈ *⚡ ${toStylistUpper('Usage Guide')}* ⌋ ═════✧\n`;
            helpMsg += `║ 📌 *${toStylistUpper('Example')}:*\n`;
            helpMsg += `║ • .movie https://youtu.be/...\n`;
            helpMsg += `╚══════════════════════✧\n\n`;
            helpMsg += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;
            return reply(helpMsg);
        }

        await react("🔍");
        await reply(`🔍 _${toStylistUpper('Fetching movie information')}..._`);

        const apiUrl = `https://eliteprotech-apis.zone.id/download/ytmp4?url=${encodeURIComponent(ytUrl)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status || !resData.result || !resData.result.url) {
            await react("❌");
            return reply(`🛸 *${toStylistUpper('Failed to fetch movie download link!')}*`);
        }

        const movieInfo = resData.result;
        const directVideoUrl = movieInfo.url;
        const movieTitle = movieInfo.title ? movieInfo.title.trim() : 'Full Movie';
        const fileSizeMb = movieInfo.size ? (movieInfo.size / (1024 * 1024)).toFixed(2) : 'N/A';
        const cleanFileName = `${movieTitle.replace(/[^a-zA-Z0-9 ]/g, "_").trim()}.mp4`;

        let finalCaption = `❖ ── ✦ *${toStylistUpper(movieTitle)}* ✦ ── ❖\n\n`;
        finalCaption += `📦 *${toStylistUpper('File Size')}:* ${fileSizeMb} MB\n`;
        finalCaption += `📁 *${toStylistUpper('Format')}:* Document (.mp4)\n\n`;
        finalCaption += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

        await react("📥");
        await reply(`🚀 *${toStylistUpper('Preparing movie document')}* _(${fileSizeMb} MB)_...\n_${toStylistUpper('Sending to chat, please wait!')}_`);

        // Direct URL bhejne se RAM crash nahi hogi aur heavy movie foran document ban kar chali jayegi
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
        console.error("Movie Downloader Error:", e.message);
        await react("❌");
        return reply(`❌ *${toStylistUpper('Error Processing Request')}:* ${e.message}`);
    }
});
