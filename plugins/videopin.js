//---------------------------------------------------------------------------
//           KAMRAN-MD - PINTEREST DIRECT VIDEO DOWNLOADER PLUGIN
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

async function getThumbnailBuffer(url) {
  if (!url) return null;
  try {
    const { data } = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
    return Buffer.from(data);
  } catch (err) {
    return null;
  }
}

cmd({
    pattern: "pinsearch2",
    alias: ["pinterest", "pinvid"],
    use: '.pinsearch <query>',
    desc: "Directly search and download top video from Pinterest via API",
    category: "downloader",
    react: "📌",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, react }) => {
    try {
        const query = String(text || "").trim();
        if (!query) {
            let helpMsg = `❖ ── ✦ *${toStylistUpper('Pinterest Video Downloader')}* ✦ ── ❖\n\n`;
            helpMsg += `╔═════ ⌈ *⚡ ${toStylistUpper('Usage Guide')}* ⌋ ═════✧\n`;
            helpMsg += `║ 📌 *${toStylistUpper('Example')}:*\n`;
            helpMsg += `║ • .pinsearch Cat\n`;
            helpMsg += `╚══════════════════════✧\n\n`;
            helpMsg += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;
            return reply(helpMsg);
        }

        await react("🔍");
        await reply(`🔍 _${toStylistUpper('Searching Pinterest video for')} *"${query}"*..._`);

        const searchApiUrl = `https://api.nexray.eu.cc/search/pinterestvideo?q=${encodeURIComponent(query)}`;
        const response = await axios.get(searchApiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status || !resData.result || resData.result.length === 0) {
            await react("❌");
            return reply(`🛸 *${toStylistUpper('No Results Found!')}*\n${toStylistUpper('Pinterest par')} *"${query}"* ${toStylistUpper('se related koi video nahi mili.')}`);
        }

        // Direct top/first result utha li jaye gi bina kisi selection ke
        const selectedVideo = resData.result[0];
        if (!selectedVideo || !selectedVideo.url) {
            await react("❌");
            return reply(`❌ *${toStylistUpper('Failed to fetch video details from the top result.')}*`);
        }

        await react("🚀");
        await reply(`🚀 *${toStylistUpper('Resolving Pinterest Video')}...* \n${toStylistUpper('Please wait!')}`);

        // Downloader API call to get direct playable/downloadable link
        const dlApiUrl = `https://api.nexray.eu.cc/downloader/pinterest?url=${encodeURIComponent(selectedVideo.url)}`;
        const dlRes = await axios.get(dlApiUrl, { timeout: 30000 });
        const dlData = dlRes.data;

        const directVideoUrl = dlData?.result?.url || dlData?.result?.video_url || dlData?.url || selectedVideo.video_url;

        if (!directVideoUrl) {
            await react("❌");
            return reply(`❌ *${toStylistUpper('Failed to fetch direct video download link.')}*`);
        }

        const videoTitle = selectedVideo.title && selectedVideo.title.trim() ? selectedVideo.title.trim() : 'Pinterest Video';
        const cleanFileName = `${videoTitle.replace(/[^a-zA-Z0-9 ]/g, "_").trim()}.mp4`;

        let finalCaption = `❖ ── ✦ *${toStylistUpper(videoTitle)}* ✦ ── ❖\n\n`;
        if (selectedVideo.description && selectedVideo.description.trim()) {
            const shortDesc = selectedVideo.description.length > 200 ? selectedVideo.description.substring(0, 200) + '...' : selectedVideo.description;
            finalCaption += `📌 *${toStylistUpper('Description')}:* ${shortDesc}\n\n`;
        }
        if (selectedVideo.board) {
            finalCaption += `📁 *${toStylistUpper('Board')}:* ${selectedVideo.board}\n\n`;
        }
        finalCaption += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

        const thumbBuffer = await getThumbnailBuffer(selectedVideo.thumbnail);

        // Sending as Document to bypass any HLS / streaming encryption or playback errors
        let documentPayload = {
            document: { url: directVideoUrl },
            mimetype: "video/mp4",
            fileName: cleanFileName,
            caption: finalCaption,
            contextInfo: { mentionedJid: [mek.sender] }
        };

        if (thumbBuffer && Buffer.isBuffer(thumbBuffer)) {
            documentPayload.jpegThumbnail = thumbBuffer.toString('base64');
        }

        await conn.sendMessage(from, documentPayload, { quoted: mek });
        await react("✅");

    } catch (e) {
        console.error("Pinterest Search Error:", e.message);
        await react("❌");
        return reply(`❌ *${toStylistUpper('Error Processing Request')}:* ${e.message}`);
    }
});
