import { fileURLToPath } from 'url';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "tourl",
    alias: ["url", "upload"],
    desc: "Upload replied media to Catbox and ImgBB",
    category: "downloader",
    react: "📤",
    filename: __filename
}, async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    const reactKey = m.key

    try {
        const quoted = m.quoted || m.msg?.contextInfo?.quotedMessage;
        
        if (!quoted) {
            await conn.sendMessage(from, { react: { text: '❌', key: reactKey } }).catch(() => {});
            return reply("❌ *Please reply to an image, video, audio, or document.*");
        }

        await conn.sendMessage(from, { react: { text: "⌛", key: reactKey } });

        let buffer;
        try {
            if (typeof m.quoted?.download === 'function') {
                buffer = await m.quoted.download();
            } else if (typeof conn.downloadAndSaveMediaMessage === 'function') {
                const mediaMsg = m.msg.contextInfo.quotedMessage;
                const streamPath = await conn.downloadAndSaveMediaMessage(mediaMsg, 'temp_media');
                buffer = fs.readFileSync(streamPath);
                try { fs.unlinkSync(streamPath); } catch {}
            } else if (typeof conn.downloadMediaMessage === 'function') {
                buffer = await conn.downloadMediaMessage(m);
            }
        } catch (err) {
            console.error('Buffer download error:', err);
        }

        if (!buffer || buffer.length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: reactKey } }).catch(() => {});
            return reply("❌ *Media download karne me asamarth! Kripya kisi valid image ya video par reply karein.*");
        }

        const quotedMsg = m.msg?.contextInfo?.quotedMessage || {};
        const mime = quotedMsg.imageMessage?.mimetype ||
                     quotedMsg.videoMessage?.mimetype ||
                     quotedMsg.audioMessage?.mimetype ||
                     quotedMsg.documentMessage?.mimetype ||
                     quotedMsg.stickerMessage?.mimetype || 'image/jpeg';

        let mediaType = 'image';
        if (quotedMsg.videoMessage) mediaType = 'video';
        else if (quotedMsg.audioMessage) mediaType = 'audio';
        else if (quotedMsg.documentMessage) mediaType = 'document';
        else if (quotedMsg.stickerMessage) mediaType = 'sticker';

        const ext = mime.split('/')[1] || 'tmp';
        const tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}.${ext}`);
        fs.writeFileSync(tempFilePath, buffer);

        const fileSize = (buffer.length / 1024 / 1024).toFixed(2) + ' MB';
        const typeStr = mediaType.charAt(0).toUpperCase() + mediaType.slice(1);

        let catboxUrl = '';
        let imgbbUrl = '';

        // Upload to Catbox
        try {
            const catboxForm = new FormData();
            catboxForm.append('fileToUpload', fs.createReadStream(tempFilePath));
            catboxForm.append('reqtype', 'fileupload');

            const catboxResponse = await axios.post('https://catbox.moe/user/api.php', catboxForm, {
                headers: catboxForm.getHeaders(),
                timeout: 30000
            });
            catboxUrl = catboxResponse.data.trim();
        } catch (catboxError) {
            catboxUrl = '❌ Upload failed';
        }

        // Upload to ImgBB
        try {
            const base64Data = buffer.toString('base64');
            const imgbbForm = new FormData();
            imgbbForm.append('key', 'e4b536bbf102cfccc5d8758489052547');
            imgbbForm.append('image', base64Data);

            const imgbbResponse = await axios.post('https://api.imgbb.com/1/upload', imgbbForm, {
                headers: imgbbForm.getHeaders(),
                timeout: 30000
            });

            if (imgbbResponse.data && imgbbResponse.data.success) {
                imgbbUrl = imgbbResponse.data.data.url;
            } else {
                imgbbUrl = '❌ Upload failed';
            }
        } catch (imgbbError) {
            imgbbUrl = '❌ Upload failed';
        }

        try { if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch {}

        const txt = `
🔗 *KAMRAN-MD 𝗨ʀʟ 𝗖ᴏɴᴠᴇɴᴛᴇʀ*

📂 *ᴛʏᴘᴇ:* ${typeStr}
📊 *ꜱɪᴢᴇ:* ${fileSize}

📦 *ᴄᴀᴛʙᴏx ᴜʀʟ:*
${catboxUrl}

📦 *ɪᴍɢʙʙ ᴜʀʟ:*
${imgbbUrl}

> *𝐏𝙾𝚆𝙴𝚁𝙴𝙳 𝐁𝐘 KAMRAN-MD*`.trim();

        let thumbnailUrl = "https://cdn-icons-png.flaticon.com/512/337/337946.png";
        if (catboxUrl && !catboxUrl.includes('❌') && catboxUrl.match(/\.(jpeg|jpg|gif|png)$/i)) {
            thumbnailUrl = catboxUrl;
        } else if (imgbbUrl && !imgbbUrl.includes('❌')) {
            thumbnailUrl = imgbbUrl;
        }

        const metaQuote = {
            key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "META_MEDIA" },
            message: { contactMessage: { displayName: "KAMRAN-MD", vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Upload Service\nORG:Catbox/ImgBB\nEND:VCARD` } }
        };

        await conn.sendMessage(from, {
            text: txt,
            contextInfo: {
                externalAdReply: {
                    title: "Media Uploaded Successfully!",
                    body: "Dual Upload Service",
                    thumbnailUrl: thumbnailUrl,
                    sourceUrl: catboxUrl && !catboxUrl.includes('❌') ? catboxUrl : (imgbbUrl && !imgbbUrl.includes('❌') ? imgbbUrl : ''),
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: metaQuote });

        await conn.sendMessage(from, { react: { text: "✅", key: reactKey } });

    } catch (e) {
        console.error("Tourl Error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: reactKey } }).catch(() => {});
        reply("❌ *Error uploading media.*");
    }
});
