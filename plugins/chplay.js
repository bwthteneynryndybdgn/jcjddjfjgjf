import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "playch",
    alias: ["playch2"],
    desc: "Search and send audio to newsletter channel as PTT via FAA API",
    category: "downloader",
    react: "🎧",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `🎧 *PLAYCH GUIDE*\n\n` +
                `Please provide a song name or search query!\n\n` +
                `Example:\n` +
                `• .playch Song pal`
            );
        }

        // Loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Call the API endpoint
        const encodedQuery = encodeURIComponent(text.trim());
        const apiUrl = `https://api-faa.my.id/faa/ytplay?query=${encodedQuery}`;
        
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        if (!resData || !resData.status || !resData.result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not find any results for that song.");
        }

        const info = resData.result;
        const audioUrl = info.mp3;
        const title = info.title || text;
        const author = info.author || '';
        const duration = info.duration_timestamp || '';

        if (!audioUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to retrieve the MP3 download link from the API response.");
        }

        let channelId = "120363427771724325@newsletter";

        // Send the audio file as PTT to the channel
        await conn.sendMessage(channelId, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            ptt: true
        });

        // Success reaction and confirmation reply
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

        return reply(
`✅ *PLAYCH SUKSES*

🎵 Judul : ${title}
👤 Artist : ${author}
⏱ Durasi : ${duration}

📢 Send to Channel:
${channelId}`
        );

    } catch (error) {
        console.error("Playch Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
