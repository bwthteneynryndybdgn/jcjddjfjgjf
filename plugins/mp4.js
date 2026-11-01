// plugins/yt_play.js
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// Helper for Stylish Text
const toStylistUpper = (text) => {
    if (!text || typeof text !== 'string') return '';
    const map = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
        'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
        's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    };
    return text.split('').map(char => map[char.toLowerCase()] || char).join('');
};

cmd({
    pattern: "play",
    alias: ["song", "music", "ytaudio"],
    react: '🎵',
    desc: "Download YouTube Song as MP3",
    category: "downloader",
    filename: __filename
}, async (client, message, m, { from, prefix, command, q }) => {
    try {
        // 1. Input Check
        if (!q) {
            return await client.sendMessage(from, {
                text: `❌ *${toStylistUpper('Please provide a song name!')}*\n\n*${toStylistUpper('Example')}:*\n${prefix + command} Pal Lyrical Video`
            }, { quoted: message });
        }

        // React: Searching
        await client.sendMessage(from, { react: { text: '🔍', key: message.key } });

        // 2. API Call
        const apiUrl = `https://api.azbry.com/api/download/ytplay2?q=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // 3. Validation
        if (!resData || !resData.status || !resData.result) {
            throw new Error("Song not found or API error");
        }

        const result = resData.result;
        const title = result.title || "Unknown Title";
        const channel = result.channel || "Unknown Channel";
        const thumb = result.thumbnail || "";
        const downloadUrl = result.download;
        const videoId = result.videoId;

        if (!downloadUrl) {
            throw new Error("Download link not available");
        }

        // 4. Prepare Caption
        const caption = `❖ ── ✦ *${toStylistUpper('YouTube Player')}* ✦ ── ❖

╔═════ ⌈ *🎵 ${toStylistUpper('Song Info')}* ⌋ ═════✧
║ 📌 *${toStylistUpper('Title')}:* ${title}
║ 📺 *${toStylistUpper('Channel')}:* ${channel}
║ ⏱️ *${toStylistUpper('Format')}:* MP3 Audio
╚══════════════════════✧

> 💫 _${config.DESCRIPTION || 'Powered by Bot'}_`;

        // 5. Send Audio with Thumbnail
        await client.sendMessage(from, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mp4',
            ptt: false, // Set true if you want voice note style
            contextInfo: {
                externalAdReply: {
                    title: title,
                    body: channel,
                    thumbnailUrl: thumb,
                    sourceUrl: `https://youtube.com/watch?v=${videoId}`,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: message });

        // Also send the caption separately or with document if preferred
        // Here sending caption as a follow-up message for better look
        await client.sendMessage(from, { text: caption }, { quoted: message });

        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error("YT Play Error:", error);
        await client.sendMessage(from, {
            text: `❌ *${toStylistUpper('Error')}:*\n${error.message}`
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});
