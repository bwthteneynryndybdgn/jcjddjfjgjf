// plugins/song.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "song",
    alias: ["play", "ytmp3", "audio", "song2"],
    react: '🎵',
    desc: "Download YouTube audio with thumbnail and details first",
    category: "downloader",
    filename: __filename
}, async (client, message, m, { from, prefix, command, q }) => {
    try {
        if (!q) {
            return await client.sendMessage(from, {
                text: `*🍁 Kripya YouTube link ya song ka naam dein!*\n\n*Example:* ${prefix + command} pal pal`
            }, { quoted: message });
        }

        // Loading reaction
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        let targetUrl = q.trim();
        let videoInfo = null;

        // Agar link nahi diya toh yt-search se song dhoondh lo
        if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            let search = await yts(targetUrl);
            let videos = search?.videos || search?.all;
            
            if (!videos || videos.length === 0) {
                return await client.sendMessage(from, {
                    text: "❌ *Koi song nahi mila!* Sahi naam ya link dein."
                }, { quoted: message });
            }
            videoInfo = videos[0];
            targetUrl = videoInfo.url;
        } else {
            let search = await yts(targetUrl);
            if (search?.videos && search.videos.length > 0) {
                videoInfo = search.videos[0];
            }
        }

        // API se MP3 download link lena
        const apiUrl = `https://eliteprotech-apis.zone.id/download/ytmp3?url=${encodeURIComponent(targetUrl)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || !data.status || !data.download || !data.download.downloadUrl) {
            return await client.sendMessage(from, {
                text: "❌ *Audio download link nahi mil saki!*"
            }, { quoted: message });
        }

        const songTitle = data.download.title || videoInfo?.title || "YouTube Audio";
        const audioDownloadUrl = data.download.downloadUrl;
        const duration = videoInfo?.timestamp || "N/A";
        const author = videoInfo?.author?.name || "N/A";
        const thumbUrl = videoInfo?.thumbnail || "";

        // Details caption text
        const detailsText = `🎵 *Title:* ${songTitle}\n⏱️ *Duration:* ${duration}\n👤 *Channel:* ${author}`;

        // 1. Sabse pehle DP (Thumbnail image) aur Detail message bhejo
        if (thumbUrl) {
            await client.sendMessage(from, {
                image: { url: thumbUrl },
                caption: detailsText
            }, { quoted: message });
        } else {
            await client.sendMessage(from, { text: detailsText }, { quoted: message });
        }

        // 2. Uske baad MP3 Audio file proper format ke sath bhejo taake sabko show ho
        await client.sendMessage(from, {
            audio: { url: audioDownloadUrl },
            mimetype: 'audio/mp4',
            fileName: `${songTitle}.mp3`,
            ptt: false
        }, { quoted: message });

        // Success reaction
        await client.sendMessage(from, { react: { text: '🎵', key: message.key } });

    } catch (error) {
        console.error("Song Error:", error);
        await client.sendMessage(from, {
            text: "❌ Error: " + (error.message || error)
        }, { quoted: message });
    }
});
