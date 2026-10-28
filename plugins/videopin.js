//---------------------------------------------------------------------------
//           KAMRAN-MD - YTMP4 DOWNLOADER (RYZUMI API)
//---------------------------------------------------------------------------

import axios from 'axios';
import { cmd } from '../command.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "ytmp464",
    alias: ["ytvideo53", "ytv643"],
    desc: "Mengunduh video dari YouTube dengan pilihan resolusi via Ryzumi API",
    category: "downloader",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, command, socket, sock }) => {
    const client = socket || sock || conn;
    const chatId = from || m.chat;

    const args = text ? text.split(" ") : [];
    const videoUrl = args[0];
    let resolution = args[1] || '480';

    if (!videoUrl) {
        return reply(`Umm... Kakak lupa masukkan link YouTube-nya ya? Ketik .${command} <url> [resolusi] yaa~ (˶˃ ᵕ ˂˶)`);
    }

    await conn.sendMessage(chatId, { react: { text: "🕓", key: mek.key } });

    try {
        const axiosConfig = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
            }
        };

        const isInvalidData = (d) => !d || !d.url || d.url === 'Unknown Download URL' || !d.url.startsWith('http');

        let data;
        const baseUrl = 'https://router.ryzumi.net/v1';

        try {
            const apiUrl = `${baseUrl}/api/downloader/ytmp4?url=${encodeURIComponent(videoUrl)}&quality=${resolution}`;
            const res = await axios.get(apiUrl, axiosConfig);
            data = res.data;
            if (isInvalidData(data)) {
                throw new Error('v1 invalid response');
            }
        } catch (v1Error) {
            const apiUrlV2 = `${baseUrl}/api/downloader/v2/ytmp4?url=${encodeURIComponent(videoUrl)}&quality=${resolution}`;
            const res = await axios.get(apiUrlV2, axiosConfig);
            data = res.data;
        }

        if (isInvalidData(data)) {
            throw new Error('Yahhh... Link videonya nggak ketemu atau resolusi ini nggak tersedia di server Ryzumi (╥﹏╥)');
        }

        const safeTitle = (data.title || 'video').replace(/[\\/:*?"<>|]/g, '').slice(0, 50);

        const caption = `Ini videonya buat Kakak~! (๑>ᴗ<๑)\n\n` +
            `🎥 *Title:* ${data.title}\n` +
            `👤 *Author:* ${data.author}\n` +
            `⏳ *Duration:* ${data.lengthSeconds}\n` +
            `📺 *Quality:* ${data.quality || resolution}\n` +
            `👀 *Views:* ${data.views}\n` +
            `📅 *Uploaded:* ${data.uploadDate}\n\n` +
            `> *© KAMRAN-MINI-BOT ッ*`;

        await client.sendMessage(chatId, {
            video: { url: data.url },
            mimetype: 'video/mp4',
            fileName: `${safeTitle}.mp4`,
            caption: caption
        }, { quoted: mek });

        await conn.sendMessage(chatId, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error('YTMP4 Error:', error);
        await conn.sendMessage(chatId, { react: { text: "❌", key: mek.key } });
        const errMsg = error.response?.data?.message || error.message;
        return reply(`Uwaaa gawat! Ryzumi gagal unduh videonya: ${errMsg}.. (╥﹏╥)`);
    }
});
