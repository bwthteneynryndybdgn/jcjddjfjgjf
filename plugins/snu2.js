import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "sonu3",
    alias: [],
    desc: "Generate AI music using Sonu 3 API",
    category: "ai",
    react: "🎵",
    filename: __filename,
    limit: true
},
async (conn, mek, m, { from, reply, text, usedPrefix, command }) => {
    try {
        if (!text) {
            return reply(`Masukkan prompt!\nContoh: ${usedPrefix + command} A woman running`);
        }

        // ⏳ React - processing
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        
        // 1000ms delay to ensure react is visible
        await new Promise(resolve => setTimeout(resolve, 1000));

        await reply('Sedang memproses, mohon tunggu...');

        let res = await fetch(`https://omegatech-api.dixonomega.tech/api/ai/sonu3?action=full&prompt=${encodeURIComponent(text)}`);
        let json = await res.json();

        if (!json.success) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply('Gagal mengambil data dari API');
        }

        let { title, tags, duration, thumbnail, url, lyrics, source, attribution } = json;
        let caption = `*SONU 3 AI MUSIC*\n\n`;
        caption += `*Title:* ${title}\n`;
        caption += `*Tags:* ${tags}\n`;
        caption += `*Duration:* ${duration} seconds\n`;
        caption += `*Source:* ${source}\n`;
        caption += `*Attribution:* ${attribution}\n\n`;
        caption += `*Lyrics:*\n${lyrics}`;

        await conn.sendMessage(from, { image: { url: thumbnail }, caption: caption }, { quoted: mek });
        await conn.sendMessage(from, { audio: { url: url }, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: mek });

        // 800ms delay before success react
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // ✅ React - success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in sonu3 command:", e);
        // ❌ React - error
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply('Terjadi kesalahan sistem');
    }
});
