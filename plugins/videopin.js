//---------------------------------------------------------------------------
//           KAMRAN-MD - YOUTUBE VIDEO DOWNLOADER (XRINA API)
//---------------------------------------------------------------------------

import axios from 'axios';
import { fileURLToPath } from 'url';
import path from 'path';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cleanName(name = 'video') {
    return String(name)
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 150);
}

cmd({
    pattern: "ytmp4655",
    alias: ["video543", "ytv655"],
    desc: "Download YouTube Video strictly via Xrina API",
    category: "downloader",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, socket, sock }) => {
    const client = socket || sock || conn;
    const chatId = from || m.chat;

    if (!text) {
        return reply(
            `❌ *Opps! URL Missing* ❌\n\n` +
            `YouTube video ka link dein!\n` + 
            `📌 *Contoh:* \`.ytmp4 https://youtu.be/xxxx\``
        );
    }
    
    await reply('_⏳ Fetching video from Xrina API..._');

    try {
        const apiUrl = `https://apiii-xrina.my.id/download/youtube-dl?url=${encodeURIComponent(text.trim())}`;

        const { data } = await axios.get(apiUrl, { timeout: 60000 });
        if (!data || !data.status || !data.data || !data.data.data) {
            throw new Error('API se data hasil karne mein nakami hui.');
        }

        const resData = data.data.data;
        const title = resData.title || 'YouTube Video';
        const medias = resData.medias || [];

        // Sirf MP4 video formats filter karein
        const videoMedias = medias.filter(v => v.url && v.format && v.format.includes('.mp4'));
        
        if (videoMedias.length === 0) {
            throw new Error('Is video ke liye koi MP4 format nahi mila.');
        }

        // Sab se behtareen quality (ya pehli available video) select karein
        const selectedVideo = videoMedias[0];
        const downloadUrl = selectedVideo.url;
        const safeTitle = cleanName(title);

        await client.sendMessage(
            chatId, 
            { 
                document: { url: downloadUrl }, 
                mimetype: 'video/mp4', 
                fileName: `${safeTitle}.mp4`, 
                caption: `🎬 *${title}*\n kualitas: ${selectedVideo.quality || 'N/A'}\n\n> *© KAMRAN-MINI-BOT ッ*` 
            }, 
            { quoted: mek }
        );

    } catch (e) {
        console.error('[YTMP4 ERROR]', e);
        return reply('❌ Gagal: ' + (e?.message || e));
    }
});
