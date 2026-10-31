import { cmd } from '../command.js';
import { fileURLToPath } from 'url';
import { generateWAMessageFromContent, downloadContentFromMessage } from '@whiskeysockets/baileys';
import axios from 'axios';
import * as Crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);

// Helper: Stream to Buffer (Media download ke liye)
const streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
};

cmd({
    pattern: "chforward",
    alias: ["chfrd", "cfwd"],
    desc: "Forward messages to groups and channels",
    category: "owner",
    filename: __filename
}, async (client, message, match, { isCreator, reply }) => {
    try {
        if (!isCreator) return await reply("*📛 Owner Only Command*");
        if (!message.quoted) return await reply("*🍁 Please reply to a message to forward*");

        let textInput = typeof match === "string" ? match.trim() : "";
        if (!textInput) return await reply("*🍁 Usage:* `.forward jid1,jid2,...`\nReply to a message first!");

        const rawJids = textInput.split(',').map(jid => jid.trim()).filter(Boolean);
        const validJids = rawJids.map(jid => {
            if (jid.includes('@')) {
                const numbers = jid.match(/\d+/g);
                if (!numbers) return null;
                if (jid.endsWith('@g.us')) return `${numbers.join('')}@g.us`;
                if (jid.endsWith('@s.whatsapp.net')) return `${numbers.join('')}@s.whatsapp.net`;
                if (jid.endsWith('@newsletter')) return `${numbers.join('')}@newsletter`;
            } else if (/^\d+$/.test(jid)) {
                return `${jid}@g.us`;
            }
            return null;
        }).filter(Boolean).slice(0, 50);

        if (!validJids.length) return await reply("❌ No valid JIDs found");
        const uniqueJids = [...new Set(validJids)];
        
        await reply(`🔄 Forwarding to ${uniqueJids.length} chats...`);

        let successCount = 0;
        let failedCount = 0;

        const quotedContent = message.msg?.contextInfo?.quotedMessage;
        if (!quotedContent) return await reply("❌ Could not extract quoted content");

        const mediaKey = Object.keys(quotedContent).find(k => 
            ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(k)
        );

        for (const [index, jid] of uniqueJids.entries()) {
            try {
                const isNewsletter = jid.endsWith('@newsletter');
                let messageContent = JSON.parse(JSON.stringify(quotedContent)); // Deep Copy

                // 🔥 CHANNEL SPECIFIC LOGIC (Local Upload Path)
                if (isNewsletter && mediaKey) {
                    // 1. Media Buffer Download
                    const mediaType = mediaKey.replace('Message', '').toLowerCase();
                    const stream = await downloadContentFromMessage(messageContent[mediaKey], mediaType);
                    const buffer = await streamToBuffer(stream);
                    if (!buffer) throw new Error("Download failed");

                    // 2. Get Auth & Host
                    const mediaConn = await client.query({
                        tag: 'iq', attrs: { type: 'set', xmlns: 'w:m', to: 's.whatsapp.net' },
                        content: [{ tag: 'media_conn', attrs: {} }]
                    });
                    const auth = encodeURIComponent(mediaConn.content[0].attrs.auth);
                    const host = mediaConn.content[0].attrs.hostname;

                    // 3. Define Channel Path
                    const pathMap = {
                        image: '/newsletter/newsletter-image',
                        video: '/newsletter/newsletter-video',
                        audio: '/newsletter/newsletter-audio',
                        document: '/newsletter/newsletter-document'
                    };
                    const path = pathMap[mediaType];
                    if (!path) throw new Error("Unsupported media type for channel");

                    // 4. Upload to Local Path
                    const uploadUrl = `https://${host}${path}?auth=${auth}&server_thumb_gen=1`;
                    const res = await axios.post(uploadUrl, buffer, {
                        headers: {
                            'Content-Type': 'application/octet-stream',
                            'Origin': 'https://web.whatsapp.com'
                        },
                        maxBodyLength: Infinity,
                        maxContentLength: Infinity
                    });

                    if (!res.data || !res.data.direct_path) throw new Error("Upload failed");

                    // 5. Update Content Data
                    const mediaObj = messageContent[mediaKey];
                    mediaObj.url = res.data.url;
                    mediaObj.directPath = res.data.direct_path;
                    mediaObj.fileSha256 = res.data.file_sha256;
                    mediaObj.fileEncSha256 = res.data.file_enc_sha256;
                    mediaObj.fileLength = buffer.length;
                    mediaObj.mediaKey = res.data.media_key || Crypto.randomBytes(32).toString('base64');

                }

                // 🔥 SEND MESSAGE
                const forwardData = generateWAMessageFromContent(jid, messageContent, { 
                    userJid: client.user.id 
                });
                await client.relayMessage(jid, forwardData.message, { 
                    messageId: forwardData.key.id 
                });

                successCount++;
                if ((index + 1) % 5 === 0 && uniqueJids.length > 5) {
                    await reply(`📤 Sent to ${index + 1}/${uniqueJids.length}...`);
                }
                await new Promise(r => setTimeout(r, 1000));
                
            } catch (error) {
                console.error(`Forward error to ${jid}:`, error.message);
                failedCount++;
            }
        }

        await reply(`✅ *Forward Complete!*\n\n📤 Success: ${successCount}\n❌ Failed: ${failedCount}`);

    } catch (error) {
        console.error("Forward Error:", error);
        await reply(`💢 Error: ${error.message.substring(0, 100)}`);
    }
});
