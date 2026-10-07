// plugins/song.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "song11",
    alias: ["play11", "ytmp311", "audio11", "song10"],
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

        // Chahe link ho ya naam, yt-search se details zaroor nikalenge taaki Unknown na aaye
        try {
            let search = await yts(targetUrl);
            let videos = search?.videos || search?.all;
            
            if (videos && videos.length > 0) {
                videoDetails = videos[0];
                targetUrl = videoDetails.url; // Agar naam diya tha toh link ban gaya, link diya tha toh verify ho gaya
            }
        } catch (searchErr) {
            console.error("YTS Search Error:", searchErr);
        }

        // Agar search se video nahi mili aur user ne direct link diya hai
        if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            return await client.sendMessage(from, {
                text: "❌ *Koi song nahi mila!* Kripya sahi naam ya link dein."
            }, { quoted: message });
        }

        // Aapki API Endpoint (Timeout ke sath taaki request terminate na ho)
        const apiUrl = `https://techxkamran.vercel.app/api/download/ytmp3?url=${encodeURIComponent(targetUrl)}`;

        const response = await axios.get(apiUrl, { timeout: 30000 });
        const data = response.data;

        // Flexible link extraction
        const audioDownloadUrl = data.downloadUrl || 
                                 data.url || 
                                 data.dl || 
                                 data.download?.downloadUrl || 
                                 data.download?.url || 
                                 data.result?.downloadUrl || 
                                 data.result?.url ||
                                 (typeof data.download === 'string' ? data.download : null);

        if (!audioDownloadUrl) {
            return await client.sendMessage(from, {
                text: "❌ *Audio download link nahi mil saki!* API response me link nahi mili."
            }, { quoted: message });
        }

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
            fileName: `${songTitle.replace(/[/\\?%*:|"<>]/g, '')}.mp3`,
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
