// plugins/song.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "song3",
    alias: ["play2", "ytmp32", "audio2", "song2"],
    react: '🎵',
    desc: "Download audio from YouTube using API",
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
                text: `*🍁 Please provide a YouTube link!*\n\n*Example:* ${prefix + command} https://youtu.be/6_E7eJySKYs`
            }, { quoted: message });
        }

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "Powered by Bot";

        // Initial reaction
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        let targetUrl = q.trim();
        // Agar user ne direct link nahi diya toh aapki API ke mutabiq link hona zaroori hai
        if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            return await client.sendMessage(from, {
                text: "❌ *Kripya valid YouTube link provide karein!* (Text search is API ke liye supported nahi hai)"
            }, { quoted: message });
        }

        // Aapka naya API endpoint ya purana wala jo URL accept kare
        const apiUrl = `https://eliteprotech-apis.zone.id/download/ytmp3?url=${encodeURIComponent(targetUrl)}`;

        const response = await axios.get(apiUrl);
        const data = response.data;

        // API response validation & correct property path extraction
        if (!data || !data.status || !data.download || !data.download.downloadUrl) {
            return await client.sendMessage(from, {
                text: "❌ *Audio download link nahi mil saki!* Kripya dubara koshish karein."
            }, { quoted: message });
        }

        const songTitle = data.download.title || "YouTube Audio";
        const audioDownloadUrl = data.download.downloadUrl;

        // Send audio buffer or URL with title
        const options = {
            audio: { url: audioDownloadUrl },
            mimetype: 'audio/mp4',
            ptt: false,
            caption: `*🎵 Title:* ${songTitle}\n\n> ${DESCRIPTION}`
        };

        await client.sendMessage(from, options, { quoted: message });
        await client.sendMessage(from, { react: { text: '🎵', key: message.key } });

    } catch (error) {
        console.error("YouTube MP3 Error:", error);
        await client.sendMessage(from, {
            text: "❌ Error downloading song:\n" + error.message
        }, { quoted: message });
    }
});
