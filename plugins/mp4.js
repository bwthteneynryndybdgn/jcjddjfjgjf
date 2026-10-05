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
    desc: "Download audio from YouTube with full details",
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

        // Initial reaction (Loading)
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        let targetUrl = q.trim();
        let videoInfo = null;

        // Agar user ne name diya hai ya link, dono sorat mein yt-search se details nikal lenge
        try {
            let search = await yts(targetUrl.startsWith("http") ? targetUrl : targetUrl);
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

        // (Optional) Agar aap chahte hain ke audio se pehle song ki DP (Thumbnail) bheji jaye:
        if (thumbUrl) {
            await client.sendMessage(from, {
                image: { url: thumbUrl },
                caption: `📥 *Downloading Audio... Please wait.*`
            }, { quoted: message });
        }

        // Send Audio File with Details Caption
        const options = {
            audio: { url: audioDownloadUrl },
            mimetype: 'audio/mp4',
            ptt: false,
            caption: captionText
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
