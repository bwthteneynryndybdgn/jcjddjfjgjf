import { cmd } from '../command.js';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "play",
    alias: ["song", "audio", "ytmp3"],
    desc: "Download songs from YouTube using VajiraOfc API.",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {

    if (!text) return reply("❌ Please provide a song name or YouTube URL!\n\n*Example:* `.play Faded` or `.play https://youtu.be/qF-JLqKtr2Q`");

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let query = text.trim();
        let ytUrl = query;

        // Agar user ne direct link nahi diya, toh aap chahein toh direct text bhi API ko bhej sakte hain 
        // kyunki kuch APIs text query ko bhi direct handle kar leti hain, ya phir aap yahan user ko link dene ka keh sakte hain.
        // Lekin agar aapki API sirf YouTube URL maangti hai, toh hum check lagate hain:
        
        if (!query.includes("youtu.be") && !query.includes("youtube.com")) {
            // Agar aapke paas yt-search nahi chal raha, toh aap user ko guide kar sakte hain ke direct link dein
            // Ya hum ek alternative public search API use kar sakte hain. 
            // Lekin sabse asan tareeqa yeh hai ke user ko link provide karne ka bole agar link na ho:
            
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Please provide a *valid YouTube link* for this command!\n\n*Example:* `.play https://youtu.be/xxxxxx`");
        }

        // Call VajiraOfc API
        let apiUrl = `https://vajiraofc-apis.vercel.app/api/ytmp3?apikey=VajiraOfc&url=${encodeURIComponent(ytUrl)}&quality=92`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API responded with status code ${response.status}`);
        }

        const json = await response.json();

        if (!json || !json.success || !json.data || !json.data.download || !json.data.download.url) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to fetch audio from the API response.");
        }

        const songData = json.data;
        const downloadUrl = songData.download.url;
        const songTitle = songData.title || "Audio Track";
        const quality = songData.download.quality || "92kbps";

        const infoMessage = `🎵 *KAMRAN-MD PLAYER*\n\n` +
            `*Title:* ${songTitle}\n` +
            `*Quality:* ${quality}\n\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `~ *KAMRAN-MD*`;

        // Send audio file
        await conn.sendMessage(from, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mp4',
            fileName: `${songTitle.replace(/[\\/:*?"<>|]/g, '')}.mp3`,
            caption: infoMessage,
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Play Command Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${error.message || "An unexpected error occurred."}`);
    }
});
