/*
# Name : Unblur Image
# Type : ESM (KAMRAN-MD / FATIMA-MD Style)
# Url : https://unblurimage.ai/
*/

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { cmd } from '../command.js';
import { fileURLToPath } from 'url';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "unblur",
    alias: ["enhancepic", "remini"],
    react: '🪄',
    desc: "Unblur or enhance replied image using AI",
    category: "tools",
    use: ".unblur [reply to image]",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    let tempFilePath = null;
    try {
        const quoted = m.msg?.contextInfo?.quotedMessage || m.quoted;

        if (!quoted) {
            return reply('❌ Kripya kisi image par reply karein!');
        }

        const mimeType = quoted.imageMessage?.mimetype || m.quoted?.mimetype || '';
        if (!mimeType || !mimeType.includes('image')) {
            return reply('❌ Yeh valid image nahi hai. Kripya kisi image par reply karein.');
        }

        const edit = async (text, key) => {
            try {
                await conn.relayMessage(
                    from,
                    {
                        protocolMessage: {
                            key,
                            type: 14,
                            editedMessage: {
                                conversation: text
                            }
                        }
                    },
                    {}
                );
            } catch {}
        };

        const statusMsg = await conn.sendMessage(from, { text: '⏳ Mengunduh gambar / Image download ho rahi hai...' }, { quoted: mek });

        // Media download buffer
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
            return reply('❌ Media download karne me asamarth!');
        }

        tempFilePath = path.join(os.tmpdir(), `unblur_${Date.now()}.jpg`);
        fs.writeFileSync(tempFilePath, mediaBuffer);

        try {
            await edit('✨ Image upload ho rahi hai AI server par...', statusMsg.key);

            const BASE = 'https://api.unwatermark.ai/api/web/unblurimage/v1/image-unblur-v2';

            const headers = {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
                'Origin': 'https://unblurimage.ai',
                'Referer': 'https://unblurimage.ai/',
                'Accept': '*/*',
                'product-code': '067003',
                'product-serial': 'uigbeo'
            };

            const form = new FormData();
            form.append(
                'original_image_file',
                fs.createReadStream(tempFilePath),
                {
                    filename: path.basename(tempFilePath),
                    contentType: 'image/jpeg'
                }
            );

            const upload = await axios.post(
                `${BASE}/create-job`,
                form,
                {
                    headers: {
                        ...headers,
                        ...form.getHeaders()
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    timeout: 120000
                }
            );

            const uploadResult = upload.data;
            const jobId =
                uploadResult?.job_id ||
                uploadResult?.jobId ||
                uploadResult?.data?.job_id ||
                uploadResult?.data?.jobId ||
                uploadResult?.result?.job_id ||
                uploadResult?.result?.jobId;

            if (!jobId) {
                return edit(`Job ID nahi mili.\n\n${JSON.stringify(uploadResult, null, 2)}`, statusMsg.key);
            }

            await edit(`🚀 Job ID: ${jobId}\n🔄 Image unblur ho rahi hai, kripya intezar karein...`, statusMsg.key);

            let result;
            let imageUrl = null;

            for (let i = 1; i <= 30; i++) {
                await new Promise(resolve => setTimeout(resolve, 3000));

                try {
                    const response = await axios.get(
                        `${BASE}/get-job/${jobId}`,
                        {
                            headers: {
                                ...headers,
                                'Content-Type': 'application/json; charset=UTF-8'
                            },
                            timeout: 30000
                        }
                    );

                    result = response.data;
                    imageUrl =
                        result?.output_url ||
                        result?.outputUrl ||
                        result?.image_url ||
                        result?.imageUrl ||
                        result?.data?.output_url ||
                        result?.data?.outputUrl ||
                        result?.data?.image_url ||
                        result?.data?.imageUrl ||
                        result?.result?.output_url ||
                        result?.result?.outputUrl ||
                        result?.result?.image_url ||
                        result?.result?.imageUrl;

                    const status =
                        result?.status ||
                        result?.data?.status ||
                        result?.result?.status ||
                        'processing';

                    if (imageUrl) {
                        await conn.sendMessage(from, {
                            image: { url: imageUrl },
                            caption: `✨ *Unblur Image Success!*\n\n> © 𝐏ᴏᴡᴇʀᴇᴅ 𝐁𝐘 KAMRAN-MD`
                        }, { quoted: mek });

                        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
                        return;
                    }

                    if (['failed', 'error', 'cancelled'].includes(String(status).toLowerCase())) {
                        return edit(`❌ Process fail ho gaya.\nStatus: ${status}`, statusMsg.key);
                    }

                    await edit(
                        `⏳ Processing...\nJob ID: ${jobId}\nStatus: ${status}\nAttempt:${i}/30`,
                        statusMsg.key
                    );

                } catch (err) {
                    // Continue checking loop
                }
            }

            await edit(`⏰ Timeout: Image process hone me zyada samay lag gaya.`, statusMsg.key);

        } finally {
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                try { fs.unlinkSync(tempFilePath); } catch {}
            }
        }

    } catch (error) {
        console.error("Unblur Error:", error);
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try { fs.unlinkSync(tempFilePath); } catch {}
        }
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* \`\`\`${error.message || error}\`\`\``);
    }
});
