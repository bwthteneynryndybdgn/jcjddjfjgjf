//---------------------------------------------------------------------------
//           KAMRAN-MD - YOUTUBE SEARCH & DIRECT DOWNLOADER (YT-SEARCH)
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import yts from 'yt-search';
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
    pattern: "video54",
    alias: ["ytv65", "download75"],
    use: '.ytsearch <query>',
    desc: "Search YouTube via yt-search and directly download the top video",
    category: "downloader",
    react: "🔍",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, react }) => {
    try {
        const query = String(text || "").trim();
        if (!query) {
            let helpMsg = `❖ ── ✦ *${toStylistUpper('YouTube Search Downloader')}* ✦ ── ❖\n\n`;
            helpMsg += `╔═════ ⌈ *⚡ ${toStylistUpper('Usage Guide')}* ⌋ ═════✧\n`;
            helpMsg += `║ 📌 *${toStylistUpper('Example')}:*\n`;
            helpMsg += `║ • .ytsearch Naat Sharif\n`;
            helpMsg += `╚══════════════════════✧\n\n`;
            helpMsg += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;
            return reply(helpMsg);
        }

        await react("🔍");
        await reply(`🔍 _${toStylistUpper('Searching YouTube for')} *"${query}"*..._`);

        // yt-search package ka istemal
        const searchResult = await yts(query);
        const videos = searchResult?.videos;

        if (!videos || videos.length === 0) {
            await react("❌");
            return reply(`🛸 *${toStylistUpper('No Results Found!')}*\n${toStylistUpper('YouTube par')} *"${query}"* ${toStylistUpper('se related koi video nahi mili.')}`);
        }

        const topVideo = videos[0];
        const videoUrl = topVideo?.url;

        if (!videoUrl) {
            await react("❌");
            return reply(`❌ *${toStylistUpper('Failed to extract video link from yt-search results.')}*`);
        }

        await react("🚀");
        await reply(`🚀 *${toStylistUpper('Resolving Video Download Link')}...*`);

        const dlApiUrl = `https://apiii-xrina.my.id/download/youtube-dl?url=${encodeURIComponent(videoUrl)}`;
        const dlRes = await axios.get(dlApiUrl, { timeout: 30000 });
        const dlData = dlRes.data;

        if (!dlData || !dlData.status || !dlData.data?.data) {
            await react("❌");
            return reply(`❌ *${toStylistUpper('Failed to fetch direct download links for the video.')}*`);
        }

        const videoInfo = dlData.data.data;
        const medias = videoInfo.medias;

        if (!medias || medias.length === 0) {
            await react("❌");
            return reply(`❌ *${toStylistUpper('No downloadable media formats available.')}*`);
        }

        const selectedMedia = medias.find(v => v.quality === "480p" || v.quality === "360p") || medias[0];
        const directVideoUrl = selectedMedia?.url;

        if (!directVideoUrl) {
            await react("❌");
            return reply(`❌ *${toStylistUpper('Direct video URL not found.')}*`);
        }

        const videoTitle = videoInfo.title ? videoInfo.title.trim() : (topVideo.title || 'YouTube Video');
        const cleanFileName = `${videoTitle.replace(/[^a-zA-Z0-9 ]/g, "_").trim()}.mp4`;

        let finalCaption = `❖ ── ✦ *${toStylistUpper(videoTitle)}* ✦ ── ❖\n\n`;
        finalCaption += `👤 *${toStylistUpper('Channel')}:* ${topVideo.author?.name || 'YouTube'}\n`;
        finalCaption += `⏱️ *${toStylistUpper('Duration')}:* ${topVideo.timestamp || videoInfo.duration || 'N/A'}\n`;
        finalCaption += `📦 *${toStylistUpper('Quality')}:* ${selectedMedia.quality || 'N/A'}\n\n`;
        finalCaption += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

        const thumbBuffer = await getThumbnailBuffer(videoInfo.imageUrl || topVideo.thumbnail);

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
        console.error("YT-Search Downloader Error:", e.message);
        await react("❌");
        return reply(`❌ *${toStylistUpper('Error Processing Request')}:* ${e.message}`);
    }
});
