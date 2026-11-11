//---------------------------------------------------------------------------
//           KAMRAN-MD - YOUTUBE PLAY / SONG DOWNLOADER PLUGIN
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

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

cmd({
    pattern: "play344",
    alias: ["ytplay4", "song6", "audio7"],
    use: '.play <song name>',
    desc: "Search song, show details with photo, and download as Audio",
    category: "downloader",
    react: "🎵",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = String(text || "").trim();
        if (!query) return reply(`⚠️ *${toStylistUpper('Usage')}:* .play <song name>`);

        // Step 1: React with loading emoji
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Step 2: Fetch data from NexRay API
        const api = `https://api.nexray.web.id/downloader/ytplay?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(api, { 
            timeout: 60000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        if (!data || !data.status || !data.result) {
            return reply(`❌ *${toStylistUpper('No audio found for your query.')}*`);
        }

        const resData = data.result;
        const mediaTitle = resData.title || query;
        const thumbnail = resData.thumbnail || "";
        const duration = resData.duration || "N/A";
        const views = resData.views || "N/A";
        const authorName = resData.channel || "Unknown Channel";
        const downloadUrl = resData.download_url;

        if (!downloadUrl) {
            return reply(`❌ *${toStylistUpper('Download link not found.')}*`);
        }

        // Step 3: Styled Info Card
        let infoText = `❖ ── ✦ *${toStylistUpper('Song Details')}* ✦ ── ❖\n\n`;
        infoText += `╔═════ ⌈ *⚡ ${toStylistUpper('Media Info')}* ⌋ ═════✧\n`;
        infoText += `║ 📌 *${toStylistUpper('Title')}:* ${mediaTitle}\n`;
        infoText += `║ 👤 *${toStylistUpper('Channel')}:* ${authorName}\n`;
        infoText += `║ ⏱️ *${toStylistUpper('Duration')}:* ${duration}\n`;
        infoText += `║ 👁️ *${toStylistUpper('Views')}:* ${views}\n`;
        infoText += `╚══════════════════════✧\n\n`;
        infoText += `> 💫 _${toStylistUpper('Audio is downloading, please wait...')}_`;

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

        // Step 4: Download Audio Buffer to prevent expiry/streaming issues
        const audioBuffer = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Range': 'bytes=0-'
            },
            timeout: 90000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        }).then(res => res.data);

        // Step 5: Send Audio File
        let finalCaption = `❖ ── ✦ *${toStylistUpper('Song Download')}* ✦ ── ❖\n\n`;
        finalCaption += `╔═════ ⌈ *⚡ ${toStylistUpper('File Info')}* ⌋ ═════✧\n`;
        finalCaption += `║ 📌 *${toStylistUpper('Title')}:* ${mediaTitle}\n`;
        finalCaption += `╚══════════════════════✧\n\n`;
        finalCaption += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: `${mediaTitle.replace(/[/\\?%*:|"<>]/g, '').trim()}.mp3`,
            caption: finalCaption,
            contextInfo: { mentionedJid: [mek.sender] }
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.log("Play command error:", e.message);
        try { await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }); } catch (err) {}
        reply(`❌ Error: ${e.message}`);
    }
});
