/*
# Name : Remini / AI Upscale Image
# Type : ESM (KAMRAN-MD Style)
*/

import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { cmd } from '../command.js';
import { fileURLToPath } from 'url';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "remini",
    alias: ["enhance", "hd", "upscale", "unblur"],
    react: '🪄',
    desc: "Enhance or upscale replied image using AI",
    category: "tools",
    use: ".remini [reply to image]",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    let tempFilePath = null;
    try {
        const quoted = m.msg?.contextInfo?.quotedMessage || m.quoted;

        if (!quoted) {
            return reply('❌ Please reply to an image!');
        }

        const mimeType = quoted.imageMessage?.mimetype || m.quoted?.mimetype || '';
        if (mimeType && !mimeType.includes('image')) {
            return reply('❌ Please reply to a valid image file.');
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Media buffer download helper
        let mediaBuffer;
        try {
            if (m.quoted && typeof m.quoted.download === 'function') {
                mediaBuffer = await m.quoted.download();
            } else {
                let type = Object.keys(quoted)[0];
                let content = quoted[type];
                const stream = await downloadContentFromMessage(content, type.replace('Message', '').toLowerCase());
                let chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                mediaBuffer = Buffer.concat(chunks);
            }
        } catch (downloadErr) {
            console.error('Download error:', downloadErr);
        }

        if (!mediaBuffer || mediaBuffer.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply('❌ Media download karne me asamarth!');
        }

        tempFilePath = path.join(os.tmpdir(), `remini_${Date.now()}.jpg`);
        fs.writeFileSync(tempFilePath, mediaBuffer);

        let enhancedUrl = null;

        // Method 1: Try free stable upscale API endpoint
        try {
            const form = new FormData();
            form.append('image', fs.createReadStream(tempFilePath));
            
            const res = await axios.post('https://api.v-api.xyz/remini', form, {
                headers: {
                    ...form.getHeaders(),
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                },
                timeout: 45000
            });

            if (res.data && (res.data.url || res.data.image || res.data.result)) {
                enhancedUrl = res.data.url || res.data.image || res.data.result;
            }
        } catch (e1) {
            console.error('API Method 1 failed, trying fallback...', e1.message);
        }

        // Method 2: Fallback to alternative free enhancer API if method 1 fails
        if (!enhancedUrl) {
            try {
                const base64Data = mediaBuffer.toString('base64');
                const form2 = new FormData();
                form2.append('image', base64Data);

                const res2 = await axios.post('https://itzpire.com/tools/remini', {
                    image: base64Data
                }, {
                    timeout: 45000
                });

                if (res2.data && res2.data.status && res2.data.data) {
                    enhancedUrl = res2.data.data.url || res2.data.data.result;
                }
            } catch (e2) {
                console.error('API Method 2 failed:', e2.message);
            }
        }

        // Method 3: Direct ImgBB + upscale service fallback if needed
        if (!enhancedUrl) {
            const base64Data = mediaBuffer.toString('base64');
            const imgbbForm = new FormData();
            imgbbForm.append('key', 'e4b536bbf102cfccc5d8758489052547');
            imgbbForm.append('image', base64Data);

            const imgbbRes = await axios.post('https://api.imgbb.com/1/upload', imgbbForm, {
                headers: imgbbForm.getHeaders(),
                timeout: 30000
            });

            if (imgbbRes.data && imgbbRes.data.success) {
                const uploadedImgUrl = imgbbRes.data.data.url;
                // Using public free upscale proxy
                enhancedUrl = `https://api.siputzx.my.id/api/tools/remini?url=${encodeURIComponent(uploadedImgUrl)}`;
            }
        }

        if (!enhancedUrl) {
            throw new Error("Sabhi AI enhancement servers filhal busy hain ya limit exceed ho gayi hai.");
        }

        // Send enhanced image
        await conn.sendMessage(from, {
            image: { url: enhancedUrl },
            caption: `✨ *Remini / Enhanced Image Success!*\n\n> © 𝐏ᴏᴡᴇʀᴇᴅ 𝐁𝐘 KAMRAN-MD`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Remini Error:", error);
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try { fs.unlinkSync(tempFilePath); } catch {}
        }
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* \`\`\`${error.message || error}\`\`\``);
    } finally {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try { fs.unlinkSync(tempFilePath); } catch {}
        }
    }
});
