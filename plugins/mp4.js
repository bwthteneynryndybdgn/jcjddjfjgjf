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
    desc: "Download YouTube Song as MP3 with Thumbnail",
    category: "downloader",
    filename: __filename
}, async (client, message, m, { from, prefix, command, q }) => {
    try {
        // 1. Input Check
        if (!q) {
            return await client.sendMessage(from, {
                text: `❌ *Please provide a song name!*\n\n*Example:*\n${prefix + command} Pal Lyrical Video`
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

        // 4. Send Audio WITH External Ad Reply (The Blue Card Look)
        await client.sendMessage(from, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mp4',
            ptt: false, // False means normal music player
            contextInfo: {
                externalAdReply: {
                    title: `🎵 ${title}`,
                    body: `📺 ${channel}`, 
                    thumbnailUrl: thumb,   
                    sourceUrl: `https://youtube.com/watch?v=${videoId}`,
                    mediaType: 1,
                    renderLargerThumbnail: true 
                }
            }
        }, { quoted: message });

        // 5. Send Details Caption Below (Like in Screenshot)
        const botName = config.BOT_NAME || 'KAMRAN-MD';
        const detailsCaption = `*${botName.toUpperCase()} AUDIO PLAYER*\n🎵\n\n🎶 *Title:* ${title}\n\n👤 *Artist/Channel:* ${channel}\n\n📁 *Status:* Audio downloaded successfully!`;

        await client.sendMessage(from, {
            text: detailsCaption,
            contextInfo: {
                mentionedJid: [m.sender]
            }
        }, { quoted: message });

        // Success Reaction
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error("YT Play Error:", error);
        await client.sendMessage(from, {
            text: `❌ *Error:* ${error.message}`
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});
