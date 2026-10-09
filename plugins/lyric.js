// plugins/song.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json, text/plain, */*'
    }
};

async function tryRequest(getter, attempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await getter();
        } catch (err) {
            lastError = err;
            if (attempt < attempts) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }
    throw lastError;
}

// Rebix Audio API Integration
async function getRebixAudioByUrl(youtubeUrl) {
    const apiUrl = `https://api-rebix.vercel.app/api/yta?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    const data = res?.data;
    
    // Flexible path extraction from your JSON structures
    const downloadUrl = data?.result?.download || data?.downloadUrl || data?.result?.url;
    
    if (data?.status && downloadUrl) {
        return { 
            download: downloadUrl, 
            title: data?.result?.title || data?.title || "YouTube Audio",
            thumbnail: data?.result?.thumbnail || "",
            duration: data?.result?.duration || "Unknown",
            channel: data?.result?.channel || "Unknown"
        };
    }
    throw new Error('Rebix Audio API failed');
}

cmd({
    pattern: "song1",
    alias: ["play1", "ytmp31", "audio1", "song3"],
    react: '🎵',
    desc: "Download audio from YouTube via with thumbnail and details",
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

        // yt-search se details nikalna
        try {
            let search = await yts(targetUrl);
            let videos = search?.videos || search?.all;
            
            if (videos && videos.length > 0) {
                videoDetails = videos[0];
                targetUrl = videoDetails.url;
            }
        } catch (searchErr) {
            console.error("YTS Search Error:", searchErr);
        }

        if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            return await client.sendMessage(from, {
                text: "❌ *Koi song nahi mila!* Kripya sahi naam ya link dein."
            }, { quoted: message });
        }

        // Fetching Audio using Rebix API
        let audioData;
        try {
            audioData = await getRebixAudioByUrl(targetUrl);
        } catch (err) {
            throw new Error('All audio download sources failed.');
        }

        const songTitle = audioData.title || videoDetails?.title || "YouTube Audio";
        const songDuration = audioData.duration !== "Unknown" ? audioData.duration : (videoDetails?.timestamp || "Unknown");
        const channelName = audioData.channel !== "Unknown" ? audioData.channel : (videoDetails?.author?.name || "Unknown");
        const thumbnail = audioData.thumbnail || videoDetails?.thumbnail || "";

        // Message caption with full details
        let caption = `*🎵 YOUTUBE AUDIO DOWNLOADER* 🎵\n\n`;
        caption += `*▪ Title:* ${songTitle}\n`;
        caption += `*▪ Channel:* ${channelName}\n`;
        caption += `*▪ Duration:* ${songDuration}\n\n`;
        caption += `> ${DESCRIPTION}`;

        // Send as audio with preview card
        const options = {
            audio: { url: audioData.download },
            mimetype: 'audio/mp4',
            ptt: false,
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
