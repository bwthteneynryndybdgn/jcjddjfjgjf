// plugins/play.js
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play",
    alias: ["song", "music", "ytaudio"],
    react: '🎵',
    desc: "Download YouTube Song as MP3",
    category: "downloader",
    filename: __filename
}, async (client, message, m, { from, prefix, command, q }) => {
    try {
        if (!q) {
            return await client.sendMessage(from, {
                text: `❌ *Please provide a song name!*\n\n*Example:*\n${prefix + command} Pal Lyrical Video`
            }, { quoted: message });
        }

        await client.sendMessage(from, { react: { text: '🔍', key: message.key } });

        const apiUrl = `https://api.azbry.com/api/download/ytplay2?q=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

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

        const botName = config.BOT_NAME || 'KAMRAN-MD';

        // Sab kuch ek hi message mein - Photo + Details + Audio Player
        await client.sendMessage(from, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mp4',
            ptt: false,
            contextInfo: {
                externalAdReply: {
                    title: `${botName.toUpperCase()} AUDIO PLAYER 🎵`,
                    body: `🎵 Title: ${title}\n👤 Artist/Channel: ${channel}\n📁 Status: Audio downloaded successfully!`,
                    thumbnailUrl: thumb,
                    sourceUrl: `https://youtube.com/watch?v=${videoId}`,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: message });

        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error("YT Play Error:", error);
        await client.sendMessage(from, {
            text: `❌ *Error:* ${error.message}`
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});
