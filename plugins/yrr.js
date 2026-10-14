import { cmd } from "../command.js";
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;

        const rawText = body.trim().toLowerCase();
        
        // Yeh check karega ki message kis keyword se start ho raha hai (jaise play, song, music, etc.)
        const songKeywords = ['play', 'song', 'audio', 'music', 'play2', 'ytplay'];
        let query = "";
        let matched = false;

        for (let keyword of songKeywords) {
            if (rawText === keyword || rawText.startsWith(keyword + " ")) {
                matched = true;
                query = rawText.slice(keyword.length).trim();
                break;
            }
        }

        if (matched && query) {
            // ⏳ Loading reaction
            await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

            const encodedQuery = encodeURIComponent(query);
            const apiUrl = `https://apiii-xrina.my.id/download/play?q=${encodedQuery}`;
            
            const response = await axios.get(apiUrl, { timeout: 30000 });
            const resData = response.data;

            if (!resData || !resData.status || !resData.data) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return;
            }

            const info = resData.data;
            const audioUrl = info.media?.[0] || info.music || '';
            const title = info.title || query;
            const thumbnail = info.cover || '';
            const duration = info.duration || '';     
            const author = info.author?.nickname || '';

            if (!audioUrl) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return;
            }

            let caption = `🎶 *Title:* ${title}\n`;
            if (author) caption += `👤 *Channel:* ${author}\n`;
            if (duration) caption += `⏱️ *Duration:* ${duration}\n`;
            caption += `📁 *Status:* Downloading audio...`;

            // Thumbnail aur details bhejein
            if (thumbnail) {
                await conn.sendMessage(from, { 
                    image: { url: thumbnail }, 
                    caption: caption 
                }, { quoted: mek });
            } else {
                await conn.sendMessage(from, { text: caption }, { quoted: mek });
            }

            // Audio file bhejein
            await conn.sendMessage(from, {
                audio: { url: audioUrl },
                mimetype: 'audio/mp4',
                ptt: false 
            }, { quoted: mek });

            // ✅ Success reaction
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        }
    } catch (error) {
        console.error("Auto-Body Song Error:", error);
    }
});
