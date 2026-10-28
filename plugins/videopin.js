import yts from 'yt-search';
import fetch from 'node-fetch';
import { cmd } from '../command.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "ytmp465",
    alias: ["video65", "ytv766"],
    desc: "Download YouTube video using Evogb API as Document",
    category: "downloader",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, socket, sock }) => {
    const client = socket || sock || conn;
    const chatId = from || m.chat;

    if (!text) {
        return reply(`⚠️ *Ingresa un enlace de YouTube o nombre del video.*`);
    }

    try {
        await client.sendMessage(chatId, { react: { text: "⏳", key: mek.key } });

        let res = await yts(text);
        let vid = res.videos[0];
        if (!vid) {
            await client.sendMessage(chatId, { react: { text: "❌", key: mek.key } });
            return reply(`⚠️ *No se encontró el video.*`);
        }

        let apiUrl = `https://api.evogb.org/dl/ytmp4?url=${encodeURIComponent(vid.url)}&quality=720&key=sasuke`;
        let response = await fetch(apiUrl);
        let json = await response.json();

        if (!json.status || !json.data || !json.data.dl) {
            await client.sendMessage(chatId, { react: { text: "❌", key: mek.key } });
            return reply(`❌ *Error al procesar el video.*`);
        }

        let cap = `🛸 *[ KAMRAN-MD ]* 🌌\n\n🎶 *Título:* ${vid.title}\n📁 *Formato:* MP4 (720p Document)\n\n⚙️ *KAMRAN-MD • Descargando...* 🌀`;

        // Thumbnail aur caption bhejna
        await client.sendMessage(chatId, { image: { url: vid.thumbnail }, caption: cap }, { quoted: mek });

        // Clean filename for document
        let cleanFileName = `${vid.title.replace(/[\\/:*?"<>|]/g, '').trim().substring(0, 100)}.mp4`;

        // Strictly Document format mein video send karna
        await client.sendMessage(chatId, { 
            document: { url: json.data.dl }, 
            mimetype: 'video/mp4',
            fileName: cleanFileName,
            caption: `🎬 *${vid.title}*\n\n> *© KAMRAN-MINI-BOT ッ*`
        }, { quoted: mek });

        await client.sendMessage(chatId, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error('[YTMP4 ERROR]', e);
        await client.sendMessage(chatId, { react: { text: "❌", key: mek.key } });
        return reply(`❌ Error: ${e.message}`);
    }
});
