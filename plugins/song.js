// plugins/song.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "song2",
    alias: ["play2", "ytmp32", "audio2"],
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
                text: `*🍁 Please provide a YouTube link or song name!*\n\n*Example:* ${prefix + command} https://youtu.be/yCUQSto0Bwc`
            }, { quoted: message });
        }

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "Powered by Bot";

        // Initial reaction or message
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        // API Endpoint
        let targetUrl = q.trim();
        // Agar query direct YouTube link nahi hai toh aap chahe toh search handle kar sakte hain ya direct API mein bhej sakte hain
        const apiUrl = `https://jerrycoder.oggyapi.workers.dev/down/ytmp3?url=${encodeURIComponent(targetUrl)}`;

        const response = await axios.get(apiUrl);
        const data = response.data;

        // API response ke structure ke mutabiq download URL ya buffer nikalna hoga
        // Aam tor par aisi APIs JSON mein download link ya direct buffer deti hain. 
        // Agar API direct audio URL return karti hai toh usko fetch karenge:
        
        const audioDownloadUrl = data.downloadUrl || data.url || data.result || targetUrl; // API ke format ke mutabiq adjust karein

        if (!audioDownloadUrl) {
            return await client.sendMessage(from, {
                text: "❌ *Audio download link nahi mil saki!* Kripya dubara koshish karein."
            }, { quoted: message });
        }

        // Send audio buffer or URL
        const options = {
            audio: { url: audioDownloadUrl },
            mimetype: 'audio/mp4',
            ptt: false,
            caption: `> ${DESCRIPTION}`
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
