import { cmd } from '../command.js';
import { fileURLToPath } from 'url';
import { generateWAMessageFromContent, downloadContentFromMessage } from '@whiskeysockets/baileys';
import axios from 'axios';
import * as Crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);

// Helper: Stream to Buffer
const streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
};

// 🔥 CUSTOM UPLOADER (Newsletter Path)
async function uploadToChannel(conn, buffer, mediaType) {
    // 1. Auth & Host fetch karo
    const mediaConn = await conn.query({
        tag: 'iq', attrs: { type: 'set', xmlns: 'w:m', to: 's.whatsapp.net' },
        content: [{ tag: 'media_conn', attrs: {} }]
    });
    const auth = encodeURIComponent(mediaConn.content[0].attrs.auth);
    const host = mediaConn.content[0].attrs.hostname;

    // 2. Path define karo (Newsletter)
    const pathMap = {
        image: '/newsletter/newsletter-image',
        video: '/newsletter/newsletter-video',
        audio: '/newsletter/newsletter-audio',
        document: '/newsletter/newsletter-document'
    };
    const path = pathMap[mediaType];
    if (!path) throw new Error("Unsupported media type");

    // 3. Upload URL
    const uploadUrl = `https://${host}${path}?auth=${auth}&server_thumb_gen=1`;

    // 4. Direct Upload
    const res = await axios.post(uploadUrl, buffer, {
        headers: {
            'Content-Type': 'application/octet-stream',
            'Origin': 'https://web.whatsapp.com'
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    });

    if (!res.data || !res.data.direct_path) {
        throw new Error("Upload failed: No direct_path in response");
    }

    return res.data; // { url, direct_path, file_sha256, ... }
}

cmd({
    pattern: "cforward",
    alias: ["cfrd", "cfwd"],
    desc: "Forward messages to groups and channels",
    category: "owner",
    filename: __filename
}, async (client, message, match, { isCreator, reply }) => {
    try {
        if (!isCreator) return await reply("*📛 Owner Only Command*");
        if (!message.quoted) return await reply("*🍁 Please reply to a message to forward*");

        let textInput = "";
        if (typeof match === "string" && match.trim()) textInput = match.trim();
        else if (typeof match === "object" && match.text) textInput = match.text.trim();
        else if (message.text) textInput = message.text.trim();

        if (!textInput) return await reply("*🍁 Usage:* `.forward jid1,jid2,...`\nReply to a message first!");

        const rawJids = textInput.split(/[, ]+/).map(jid => jid.trim()).filter(Boolean);
        
        const validJids = rawJids.map(jid => {
            if (jid.includes('whatsapp.com/channel/')) {
                const match = jid.match(/channel\/([a-zA-Z0-9]+)/);
                if (match) return `${match[1]}@newsletter`;
            }
            if (jid.endsWith('@g.us') || jid.endsWith('@s.whatsapp.net') || jid.endsWith('@newsletter')) {
                return jid;
            }
            if (/^\d+$/.test(jid)) return `${jid}@g.us`;
            return null;
        }).filter(Boolean).slice(0, 50);

        if (!validJids.length) return await reply("❌ No valid JIDs found.");

        const uniqueJids = [...new Set(validJids)];
        await reply(`🔄 Forwarding to ${uniqueJids.length} chats...`);

        let successCount = 0;
        const quotedContent = message.msg?.contextInfo?.quotedMessage;
        if (!quotedContent) return await reply("❌ Could not extract quoted content");

        const mediaKey = Object.keys(quotedContent).find(k => 
            ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(k)
        );

        for (const [index, jid] of uniqueJids.entries()) {
            try {
                const isNewsletter = jid.endsWith('@newsletter');
                let messageContent = JSON.parse(JSON.stringify(quotedContent)); // Deep Copy

                if (isNewsletter && mediaKey) {
                    // 🟢 CHANNEL WITH CUSTOM UPLOADER
                    const mediaType = mediaKey.replace('Message', '').toLowerCase();
                    const stream = await downloadContentFromMessage(messageContent[mediaKey], mediaType);
                    const buffer = await streamToBuffer(stream);
                    if (!buffer) throw new Error("Download failed");

                    // 🔥 Custom Uploader Call
                    const uploadRes = await uploadToChannel(client, buffer, mediaType);

                    // Content Update
                    const mediaObj = messageContent[mediaKey];
                    mediaObj.url = uploadRes.url;
                    mediaObj.directPath = uploadRes.direct_path;
                    mediaObj.fileSha256 = uploadRes.file_sha256;
                    mediaObj.fileEncSha256 = uploadRes.file_enc_sha256;
                    mediaObj.fileLength = buffer.length;
                    mediaObj.mediaKey = uploadRes.media_key || Crypto.randomBytes(32).toString('base64');

                    // Send
                    const forwardData = generateWAMessageFromContent(jid, messageContent, { userJid: client.user.id });
                    await client.relayMessage(jid, forwardData.message, { messageId: forwardData.key.id });

                } else {
                    // 🟢 NORMAL GROUPS/PERSONAL
                    const forwardData = generateWAMessageFromContent(jid, messageContent, { userJid: client.user.id });
                    await client.relayMessage(jid, forwardData.message, { messageId: forwardData.key.id });
                }

                successCount++;
                await new Promise(r => setTimeout(r, 1500));
            } catch (error) {
                console.error(`Forward error to ${jid}:`, error.message);
            }
        }

        await reply(`✅ *Forward Complete!*\n\n📤 Success: ${successCount}/${uniqueJids.length}`);

    } catch (error) {
        console.error("Forward Error:", error);
        await reply(`💢 Error: ${error.message.substring(0, 100)}`);
    }
});
