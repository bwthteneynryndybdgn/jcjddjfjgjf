// plugins/song.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "song1",
    alias: ["play1", "ytmp31", "audio1", "song2"],
    react: '🎵',
    desc: "Download lightweight audio from YouTube using Nexray API",
    category: "downloader",
    filename: __filename
}, async (client, message, m, { 
    from, 
    prefix, 
    command, 
    args, 
    q, 
    isCreator,
    userConfig
}) => {
    try {
        if (!q) {
            return await client.sendMessage(from, {
                text: `*🍁 Please provide a song name or YouTube link!*\n\n*Example:* ${prefix + command} Saraiki song`
            }, { quoted: message });
        }

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "Powered by Bot";

        // Initial reaction
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        let searchQuery = q.trim();

        // Nexray API Endpoint
        const apiUrl = `https://api.nexray.eu.cc/downloader/ytplay?q=${encodeURIComponent(searchQuery)}`;

        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // API response validation & correct path extraction
        if (!resData || !resData.status || !resData.result || !resData.result.download_url) {
            return await client.sendMessage(from, {
                text: "❌ *Koi song nahi mila!* Kripya dusra naam try karein."
            }, { quoted: message });
        }

        const songInfo = resData.result;
        const songTitle = songInfo.title || "YouTube Audio";
        const channelName = songInfo.channel || "Unknown";
        const songDuration = songInfo.duration || "Unknown";
        const songViews = songInfo.views || "Unknown";
        const thumbnail = songInfo.thumbnail || "";
        const audioDownloadUrl = songInfo.download_url;
        const videoUrl = songInfo.url || searchQuery;

        // Message caption with full details
        let caption = `*🎵 YOUTUBE AUDIO DOWNLOADER* 🎵\n\n`;
        caption += `*▪ Title:* ${songTitle}\n`;
        caption += `*▪ Channel:* ${channelName}\n`;
        caption += `*▪ Duration:* ${songDuration}\n`;
        caption += `*▪ Views:* ${songViews}\n\n`;
        caption += `> ${DESCRIPTION}`;

        // Send as standard lightweight MP3 audio message with preview card
        const options = {
            audio: { url: audioDownloadUrl },
            mimetype: 'audio/mp4',
            ptt: false,
            caption: caption,
            contextInfo: {
                externalAdReply: {
                    title: songTitle,
                    body: `Channel: ${channelName} | Duration: ${songDuration}`,
                    mediaType: 2,
                    thumbnailUrl: thumbnail,
                    sourceUrl: videoUrl,
                    renderLargerThumbnail: true
                }
            }
        };

        await client.sendMessage(from, options, { quoted: message });
        await client.sendMessage(from, { react: { text: '🎵', key: message.key } });

    } catch (error) {
        console.error("YouTube Audio Error:", error);
        let errorMsg = error?.message || error;
        await client.sendMessage(from, {
            text: "❌ Error downloading song:\n" + errorMsg
        }, { quoted: message });
    }
});
