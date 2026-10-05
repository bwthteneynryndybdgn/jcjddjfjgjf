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
    desc: "Upload media (image/video/audio/document) to Catbox and ImgBB",
    category: "downloader",
    react: "📤",
    filename: __filename
}, async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    const reactKey = m.key

    try {
        // Check if quoted message exists
        const quoted = m.quoted || (m.msg && m.msg.contextInfo && m.msg.contextInfo.quotedMessage);
        const quotedMsg = m.msg?.contextInfo?.quotedMessage;

        if (!quotedMsg) {
            await conn.sendMessage(from, { react: { text: '❌', key: reactKey } }).catch(() => {});
            return reply("❌ *Please reply to an image, video, audio, or document.*");
        }

        const mime = quotedMsg.imageMessage?.mimetype ||
                     quotedMsg.videoMessage?.mimetype ||
                     quotedMsg.audioMessage?.mimetype ||
                     quotedMsg.documentMessage?.mimetype;

        if (!mime) {
            await conn.sendMessage(from, { react: { text: '❌', key: reactKey } }).catch(() => {});
            return reply("❌ *Please reply to a valid media file (image/video/audio/document).*");
        }

        await conn.sendMessage(from, { react: { text: "⌛", key: reactKey } });

        let mediaType;
        let msgKey;

        if (quotedMsg.imageMessage) {
            mediaType = 'image';
            msgKey = quotedMsg.imageMessage;
        } else if (quotedMsg.videoMessage) {
            mediaType = 'video';
            msgKey = quotedMsg.videoMessage;
        } else if (quotedMsg.audioMessage) {
            mediaType = 'audio';
            msgKey = quotedMsg.audioMessage;
        } else if (quotedMsg.documentMessage) {
            mediaType = 'document';
            msgKey = quotedMsg.documentMessage;
        }

        // Download media buffer using Baileys downloadMediaMessage helper or stream
        let buffer;
        try {
            // Using downloadMediaMessage if available in conn, or fallback to direct stream download
            if (typeof conn.downloadMediaMessage === 'function') {
                buffer = await conn.downloadMediaMessage({
                    key: m.msg.contextInfo.stanzaId ? { remoteJid: from, id: m.msg.contextInfo.stanzaId, participant: m.msg.contextInfo.participant } : mek,
                    message: quotedMsg
                });
            } else {
                const stream = await conn.downloadAndSaveMediaMessage(quotedMsg, 'temp_media');
                buffer = fs.readFileSync(stream);
                try { fs.unlinkSync(stream); } catch {}
            }
        } catch (downloadErr) {
            console.error('Download media error:', downloadErr);
            // Fallback manual stream download if helper fails
            const stream = await conn.downloadContentFromMessage(msgKey, mediaType);
            let chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            buffer = Buffer.concat(chunks);
        }

        if (!buffer || buffer.length === 0) {
            throw new Error('Failed to download media buffer.');
        }

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
            console.error('Catbox upload error:', catboxError);
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
            console.error('ImgBB upload error:', imgbbError);
            imgbbUrl = '❌ Upload failed';
        }

        // Cleanup temp file
        try { if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch {}

        // Prepare message text
        const txt = `
🔗 *KAMRAN-MD 𝗨ʀʟ 𝗖ᴏɴᴠᴇɴᴛᴇʀ*

📂 *ᴛʏᴘᴇ:* ${typeStr}
📊 *ꜱɪᴢᴇ:* ${fileSize}

📦 *ᴄᴀᴛʙᴏx ᴜʀʟ:*
${catboxUrl}

📦 *ɪᴍɢʙʙ ᴜʀʟ:*
${imgbbUrl}

> *𝐏𝙾𝚆𝙴𝚁𝙴𝙳 𝐁𝐘 KAMRAN-MD*`.trim();

        // Determine thumbnail for preview
        let thumbnailUrl = "https://cdn-icons-png.flaticon.com/512/337/337946.png";
        if (catboxUrl && !catboxUrl.includes('❌') && catboxUrl.match(/\.(jpeg|jpg|gif|png)$/i)) {
            thumbnailUrl = catboxUrl;
        } else if (imgbbUrl && !imgbbUrl.includes('❌')) {
            thumbnailUrl = imgbbUrl;
        }

        // Fake Quote for Style
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
        await conn.sendMessage(from, { react: { text: "❌", key: reactKey } }).catch(() => {});
        reply("❌ *Error uploading media.*");
    }
});
