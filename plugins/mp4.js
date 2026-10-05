// plugins/song.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "song",
    alias: ["play", "ytmp3", "audio", "song2"],
    react: '🎵',
    desc: "Download audio with details first, then audio",
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

        // Initial loading reaction
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        let targetUrl = q.trim();
        let videoInfo = null;

        // Search & fetch details using yt-search
        try {
            let search = await yts(targetUrl);
            let videos = search?.videos || search?.all;
            
            if (!videos || videos.length === 0) {
                return await client.sendMessage(from, {
                    text: "❌ *Koi song nahi mila!* Kripya sahi naam ya link dein."
                }, { quoted: message });
            }
            
            videoInfo = videos[0];
            targetUrl = videoInfo.url;
        } catch (searchErr) {
            console.error("YTS Search Error:", searchErr);
        }

        // API Endpoint with YouTube URL
        const apiUrl = `https://eliteprotech-apis.zone.id/download/ytmp3?url=${encodeURIComponent(targetUrl)}`;

        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || !data.status || !data.download || !data.download.downloadUrl) {
            return await client.sendMessage(from, {
                text: "❌ *Audio download link nahi mil saki!* Kripya dubara koshish karein."
            }, { quoted: message });
        }

        const songTitle = data.download.title || videoInfo?.title || "YouTube Audio";
        const audioDownloadUrl = data.download.downloadUrl;
        const duration = videoInfo?.timestamp || data.download.duration || "N/A";
        const views = videoInfo?.views ? videoInfo.views.toLocaleString() : "N/A";
        const author = videoInfo?.author?.name || "N/A";
        const thumbUrl = videoInfo?.thumbnail || "";

        // Detailed caption format
        const captionText = `╭━━━〔 *🎵 YOUTUBE DOWNLOADER* 〕━━━┈⊷
┃ 📌 *Title:* ${songTitle}
┃ ⏱️ *Duration:* ${duration}
┃ 👀 *Views:* ${views}
┃ 👤 *Channel:* ${author}
┃ 🔗 *Link:* ${targetUrl}
╰━━━━━━━━━━━━━━━━━━━━━━━┈⊷
> ${DESCRIPTION}`;

        // 1️⃣ Step 1: Sabse pehle DP (Thumbnail) aur Detail message bhejein
        if (thumbUrl) {
            await client.sendMessage(from, {
                image: { url: thumbUrl },
                caption: captionText
            }, { quoted: message });
        } else {
            await client.sendMessage(from, {
                text: captionText
            }, { quoted: message });
        }

        // 2️⃣ Step 2: Uske baad MP3 Audio file bhejein
        const options = {
            audio: { url: audioDownloadUrl },
            mimetype: 'audio/mp4',
            ptt: false
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
