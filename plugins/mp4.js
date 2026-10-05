// plugins/song.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "song7",
    alias: ["play", "ytmp7", "audio7", "song8"],
    react: '🎵',
    desc: "Download audio from YouTube using Link or Song Name with DP and Details",
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
        let videoInfo = null;

        // Agar user ne direct link nahi diya, toh yt-search se link aur details nikalenge
        if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
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
                return await client.sendMessage(from, {
                    text: "❌ *YouTube search karne me error aayi!*"
                }, { quoted: message });
            }
        } else {
            // Agar link diya hai toh bhi details nikal lo taake thumbnail mil sake
            try {
                let search = await yts(targetUrl);
                if (search?.videos && search.videos.length > 0) {
                    videoInfo = search.videos[0];
                }
            } catch (err) {
                console.error("Details fetch error:", err);
            }
        }

        // API Endpoint with YouTube URL
        const apiUrl = `https://eliteprotech-apis.zone.id/download/ytmp3?url=${encodeURIComponent(targetUrl)}`;

        const response = await axios.get(apiUrl);
        const data = response.data;

        // API response validation & correct property path extraction
        if (!data || !data.status || !data.download || !data.download.downloadUrl) {
            return await client.sendMessage(from, {
                text: "❌ *Audio download link nahi mil saki!* Kripya dubara koshish karein."
            }, { quoted: message });
        }

        const songTitle = data.download.title || videoInfo?.title || "YouTube Audio";
        const audioDownloadUrl = data.download.downloadUrl;
        const duration = videoInfo?.timestamp || "N/A";
        const author = videoInfo?.author?.name || "N/A";
        const thumbUrl = videoInfo?.thumbnail || "";

        // Details caption text
        const detailsText = `╭━━━〔 *🎵 YOUTUBE DOWNLOADER* 〕━━━┈⊷
┃ 📌 *Title:* ${songTitle}
┃ ⏱️ *Duration:* ${duration}
┃ 👤 *Channel:* ${author}
╰━━━━━━━━━━━━━━━━━━━━━━━┈⊷
> ${DESCRIPTION}`;

        // 1️⃣ Sabse pehle DP (Thumbnail) aur Detail message bhejein
        if (thumbUrl) {
            await client.sendMessage(from, {
                image: { url: thumbUrl },
                caption: detailsText
            }, { quoted: message });
        } else {
            await client.sendMessage(from, {
                text: detailsText
            }, { quoted: message });
        }

        // 2️⃣ Uske baad MP3 Audio file bhejein jo sabhi taraf show ho
        const options = {
            audio: { url: audioDownloadUrl },
            mimetype: 'audio/mp4',
            fileName: `${songTitle}.mp3`,
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
