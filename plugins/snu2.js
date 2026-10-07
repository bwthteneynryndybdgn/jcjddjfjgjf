// plugins/song.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "song10",
    alias: ["play10", "ytmp310", "audio10", "song11"],
    react: '🎵',
    desc: "Download audio from YouTube with details and thumbnail",
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
                text: `*🍁 Please provide a YouTube link or song name!*\n\n*Example:* ${prefix + command} pal pal`
            }, { quoted: message });
        }

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "Powered by Bot";

        // Initial reaction
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        let targetUrl = q.trim();
        let videoDetails = null;

        // yt-search se details aur URL nikalna
        try {
            let search = await yts(targetUrl.startsWith("http") ? { videoId: targetUrl } : targetUrl);
            let videos = search?.videos || search?.all;
            
            if (!videos || videos.length === 0) {
                return await client.sendMessage(from, {
                    text: "❌ *Koi song nahi mila!* Kripya sahi naam ya link dein."
                }, { quoted: message });
            }
            
            videoDetails = videos[0];
            targetUrl = videoDetails.url;
        } catch (searchErr) {
            console.error("YTS Search Error:", searchErr);
            if (!targetUrl.startsWith("http")) {
                return await client.sendMessage(from, {
                    text: "❌ *YouTube search karne me error aayi!*"
                }, { quoted: message });
            }
        }

        // Aapki apni API Endpoint with YouTube URL
        const apiUrl = `https://techxkamran.vercel.app/api/download/ytmp3?url=${encodeURIComponent(targetUrl)}`;

        const response = await axios.get(apiUrl);
        const data = response.data;

        // API response validation (Aapki API ke response format ke mutabiq adjust kiya gaya hai)
        if (!data || (!data.downloadUrl && !data.download?.downloadUrl && !data.url)) {
            return await client.sendMessage(from, {
                text: "❌ *Audio download link nahi mil saki!* Kripya dubara koshish karein."
            }, { quoted: message });
        }

        // Agar aapki API khud title ya download link alag format me deti hai toh ye handle kar lega
        const audioDownloadUrl = data.downloadUrl || data.download?.downloadUrl || data.url;
        const songTitle = videoDetails?.title || data.title || "YouTube Audio";
        const songDuration = videoDetails?.timestamp || data.duration || "Unknown";
        const songViews = videoDetails?.views ? videoDetails.views.toLocaleString() : "Unknown";
        const channelName = videoDetails?.author?.name || data.channel || "Unknown";
        const thumbnail = videoDetails?.thumbnail || data.thumbnail || "";

        // Message caption with full details
        let caption = `*🎵 YOUTUBE AUDIO DOWNLOADER* 🎵\n\n`;
        caption += `*▪ Title:* ${songTitle}\n`;
        caption += `*▪ Channel:* ${channelName}\n`;
        caption += `*▪ Duration:* ${songDuration}\n`;
        caption += `*▪ Views:* ${songViews}\n\n`;
        caption += `> ${DESCRIPTION}`;

        // Send as document to show thumbnail/DP properly
        const options = {
            document: { url: audioDownloadUrl },
            mimetype: 'audio/mp3',
            fileName: `${songTitle}.mp3`,
            caption: caption,
            contextInfo: {
                externalAdReply: {
                    title: songTitle,
                    body: `Channel: ${channelName} | Duration: ${songDuration}`,
                    mediaType: 2,
                    thumbnailUrl: thumbnail,
                    sourceUrl: targetUrl,
                    renderLargerThumbnail: true
                }
            }
        };

        await client.sendMessage(from, options, { quoted: message });
        await client.sendMessage(from, { react: { text: '🎵', key: message.key } });

    } catch (error) {
        console.error("YouTube MP3 Error:", error);
        let errorMsg = error?.message || error;
        await client.sendMessage(from, {
            text: "❌ Error downloading song:\n" + errorMsg
        }, { quoted: message });
    }
});
