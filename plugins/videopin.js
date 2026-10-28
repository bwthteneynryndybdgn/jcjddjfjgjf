//---------------------------------------------------------------------------
//           KAMRAN-MD - YOUTUBE SEARCH & DIRECT DOWNLOADER (FIXED)
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

async function getBuffer(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'DNT': 1,
        'Upgrade-Insecure-Requests': 1,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Referer': 'https://www.youtube.com/'
      },
      timeout: 60000
    });
    return Buffer.from(response.data);
  } catch (err) {
    console.error("Buffer download error:", err.message);
    return null;
  }
}

cmd({
    pattern: "download75",
    alias: ["ytsearch53", "yts74", "ytdl643"],
    use: '.download75 <query or url>',
    desc: "Search and download YouTube video safely",
    category: "downloader",
    react: "📥",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, react }) => {
    try {
        const query = String(text || "").trim();
        if (!query) {
            let helpMsg = `❖ ── ✦ *${toStylistUpper('YouTube Downloader')}* ✦ ── ❖\n\n`;
            helpMsg += `╔═════ ⌈ *⚡ ${toStylistUpper('Usage Guide')}* ⌋ ═════✧\n`;
            helpMsg += `║ 📌 *${toStylistUpper('Example')}:*\n`;
            helpMsg += `║ • .download75 song pal\n`;
            helpMsg += `╚══════════════════════✧\n\n`;
            helpMsg += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;
            return reply(helpMsg);
        }

        await react("🔍");
        await reply(`🔍 _${toStylistUpper('Searching YouTube for')} *"${query}"*..._`);

        let videoUrl = query;
        let topVideoTitle = query;
        let channelName = "YouTube";
        let durationStr = "N/A";
        let thumbUrl = "";

        // Agar query URL nahi hai toh yt-search se link nikalein
        if (!query.includes("http")) {
            const searchResult = await yts(query);
            const videos = searchResult?.videos;
            if (!videos || videos.length === 0) {
                await react("❌");
                return reply(`🛸 *${toStylistUpper('No Results Found!')}*`);
            }
            topVideoTitle = videos[0].title;
            videoUrl = videos[0].url;
            channelName = videos[0].author?.name || "YouTube";
            durationStr = videos[0].timestamp || "N/A";
            thumbUrl = videos[0].thumbnail;
        }

        await react("🚀");
        await reply(`🚀 *${toStylistUpper('Resolving Video Download Link')}...*`);

        const apiUrl = `https://apiii-xrina.my.id/download/youtube-dl?url=${encodeURIComponent(videoUrl)}`;
        const dlRes = await axios.get(apiUrl, { timeout: 30000 });
        const dlData = dlRes.data;

        if (!dlData || !dlData.status || !dlData.data?.data) {
            await react("❌");
            return reply(`❌ *${toStylistUpper('Failed to fetch video download links.')}*`);
        }

        const videoInfo = dlData.data.data;
        const medias = videoInfo.medias;

        if (!medias || medias.length === 0) {
            await react("❌");
            return reply(`❌ *${toStylistUpper('No media formats available.')}*`);
        }

        // 360p ya 480p select karein taaki size chhota ho aur foran download ho jaye
        const selectedMedia = medias.find(v => v.quality === "360p" || v.quality === "480p") || medias[0];
        const directVideoUrl = selectedMedia?.url;

        if (!directVideoUrl) {
            await react("❌");
            return reply(`❌ *${toStylistUpper('Direct video stream URL not found.')}*`);
        }

        const finalTitle = videoInfo.title ? videoInfo.title.trim() : topVideoTitle;
        const cleanFileName = `${finalTitle.replace(/[^a-zA-Z0-9 ]/g, "_").trim()}.mp4`;

        let finalCaption = `❖ ── ✦ *${toStylistUpper(finalTitle)}* ✦ ── ❖\n\n`;
        finalCaption += `👤 *${toStylistUpper('Channel')}:* ${channelName}\n`;
        finalCaption += `⏱️ *${toStylistUpper('Duration')}:* ${durationStr}\n`;
        finalCaption += `📦 *${toStylistUpper('Quality')}:* ${selectedMedia.quality || 'N/A'}\n\n`;
        finalCaption += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

        await reply(`📥 _${toStylistUpper('Downloading video to buffer, please wait')}..._`);

        // Video ko buffer mein download karna taaki 403 error na aaye
        const videoBuffer = await getBuffer(directVideoUrl);
        if (!videoBuffer) {
            await react("❌");
            return reply(`❌ *${toStylistUpper('Failed to download video buffer from source.')}*`);
        }

        const thumbBuffer = await getBuffer(videoInfo.imageUrl || thumbUrl);

        let documentPayload = {
            document: videoBuffer,
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
        console.error("Downloader Error:", e.message);
        await react("❌");
        return reply(`❌ *${toStylistUpper('Error Processing Request')}:* ${e.message}`);
    }
});
