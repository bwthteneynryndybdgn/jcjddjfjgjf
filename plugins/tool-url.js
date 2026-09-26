// DR KAMRAN 

import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const API = 'https://pone.rs/upload.php';

function getExtFromMime(mime = '') {
    if (mime.includes('image/jpeg')) return '.jpg';
    if (mime.includes('image/png')) return '.png';
    if (mime.includes('image/webp')) return '.webp';
    if (mime.includes('image/gif')) return '.gif';
    if (mime.includes('video/mp4')) return '.mp4';
    if (mime.includes('video/webm')) return '.webm';
    if (mime.includes('audio/mpeg')) return '.mp3';
    if (mime.includes('audio/ogg')) return '.ogg';
    if (mime.includes('audio/mp4')) return '.m4a';
    if (mime.includes('application/pdf')) return '.pdf';
    if (mime.includes('application/zip')) return '.zip';
    return '.bin';
}

async function uploadPone(buffer, filename = 'file.bin') {
    const form = new FormData();
    form.append('files[]', buffer, { filename });

    try {
        const res = await axios.post(API, form, {
            headers: {
                ...form.getHeaders(),
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36',
                accept: '*/*',
                origin: 'https://pone.rs',
                referer: 'https://pone.rs/'
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            validateStatus: () => true
        });

        const data = res.data;
        const url = data?.files?.[0]?.url?.replaceAll('\\/', '/') || null;

        return {
            status: Boolean(data?.success && url),
            code: res.status,
            result_url: url
        };
    } catch (err) {
        return {
            status: false,
            code: err.response?.status || 500,
            result_url: null,
            error: err.message
        };
    }
}

cmd({
    pattern: "tourl",
    alias: ["tolink", "upload"],
    desc: "Upload media and convert to URL",
    category: "tools",
    react: "🔗",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        // Masla ye tha ke bot 'quoted' ya 'mek' ke andar specific media message object (jaise imageMessage, viewOnceMessage, etc.) ko direct detect nahi kar paa raha tha.
        // Neeche ab saare nested objects aur quoted message structures ko properly handle karne ke liye robust check laga diya hai:
        const targetMsg = quoted ? quoted : mek;
        
        // Quoted message agar viewOnce ya nested ho toh uske message object ko target karo
        const realMsg = targetMsg.msg || targetMsg.message || targetMsg;
        
        const mime = realMsg.mimetype || 
                     targetMsg.mimetype || 
                     realMsg.imageMessage?.mimetype || 
                     realMsg.videoMessage?.mimetype || 
                     realMsg.documentMessage?.mimetype || 
                     realMsg.audioMessage?.mimetype || '';

        if (!mime) {
            return reply(
                `╔════════════════════════╗\n` +
                `║   🔗 KAMRAN-MD TOURL 🔗   \n` +
                `╚════════════════════════╝\n\n` +
                `❌ *Kripya kisi media (image, video, audio, document) ko reply ya send karein!*\n\n` +
                `> 📌 *Example:* \`.tourl\` (replying to media)\n` +
                `> ⚡ *Version:* \`12.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Media download function ko direct aur safe tareeqe se call karna
        let buffer;
        try {
            if (typeof targetMsg.download === 'function') {
                buffer = await targetMsg.download();
            } else if (typeof conn.downloadMediaMessage === 'function') {
                buffer = await conn.downloadMediaMessage(targetMsg);
            } else {
                buffer = await conn.downloadAndSaveMediaMessage(targetMsg);
            }
        } catch (err) {
            buffer = await conn.downloadMediaMessage(mek);
        }

        if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 1) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *Gagal download media, buffer kosong!*");
        }

        let filename =
            realMsg.fileName ||
            targetMsg.fileName ||
            `KAMRAN-MD-${Date.now()}${getExtFromMime(mime)}`;

        filename = path.basename(filename);

        const result = await uploadPone(buffer, filename);

        if (!result.status) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ *Upload gagal!*\n\nCode: ${result.code || '-'}\nError: ${result.error || 'Tidak diketahui'}`);
        }

        const urlBox = `
╔════════════════════════╗
║   🔗 KAMRAN-MD TOURL UPLOAD   
╚════════════════════════╝

📦 *File:* ${filename}
🔗 *URL:* ${result.result_url}

> ⚡ *Version:* \`12.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

        await reply(urlBox, {
            contextInfo: { 
                forwardingScore: 999, 
                isForwarded: true, 
                forwardedNewsletterMessageInfo: { 
                    newsletterJid: '120363418144382782@newsletter', 
                    newsletterName: 'DR KAMRAN', 
                    serverMessageId: 143 
                } 
            }
        });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ *Kuch galat ho gaya, kripya thodi der baad koshish karein!*");
    }
});
                
