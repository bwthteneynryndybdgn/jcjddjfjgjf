// plugins/song.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "song",
    alias: ["play", "ytmp3", "audio", "song2"],
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

        // API response validation
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

        // Stream error fix: Audio ko pehle buffer me download karenge
        const audioBufferRes = await axios.get(audioDownloadUrl, { 
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            timeout: 60000 
        });

        const audioBuffer = Buffer.from(audioBufferRes.data);

        // Send audio buffer directly
        const options = {
            audio: audioBuffer,
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
