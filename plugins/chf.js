import { cmd } from '../command.js';
import { fileURLToPath } from 'url';
import { generateWAMessageFromContent, downloadContentFromMessage } from '@whiskeysockets/baileys';
import axios from 'axios';
import * as Crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);

const streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
};

// Quoted ko unwrap karo (viewOnce, ephemeral)
function getUnwrapped(quoted) {
    if (!quoted) return null;
    let msg = quoted;
    if (msg.ephemeralMessage) msg = msg.ephemeralMessage.message;
    if (msg.viewOnceMessage) msg = msg.viewOnceMessage.message;
    if (msg.viewOnceMessageV2) msg = msg.viewOnceMessageV2.message;
    if (msg.viewOnceMessageV2Extension) msg = msg.viewOnceMessageV2Extension.message;
    if (msg.documentWithCaptionMessage) msg = msg.documentWithCaptionMessage.message;
    return msg;
}

async function uploadToChannel(conn, buffer, mediaType) {
    const mediaConn = await conn.query({
        tag: 'iq',
        attrs: { type: 'get', xmlns: 'w:m', to: 's.whatsapp.net' },
        content: [{ tag: 'media_conn', attrs: {} }]
    });

    const connNode = mediaConn.content[0];
    const auth = encodeURIComponent(connNode.attrs.auth);
    const host = connNode.attrs.hostname;

    const pathMap = {
        image: '/newsletter/newsletter-image',
        video: '/newsletter/newsletter-video',
        audio: '/newsletter/newsletter-audio',
        document: '/newsletter/newsletter-document',
        sticker: '/newsletter/newsletter-image'
    };
    
    const path = pathMap[mediaType];
    if (!path) throw new Error("Unsupported type: " + mediaType);

    const uploadUrl = `https://${host}${path}?auth=${auth}&server_thumb_gen=1`;

    const res = await axios.post(uploadUrl, buffer, {
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': buffer.length,
            'Origin': 'https://web.whatsapp.com'
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    });

    if (!res.data?.direct_path) {
        throw new Error("Upload failed: " + JSON.stringify(res.data));
    }
    return res.data;
}

cmd({
    pattern: "cforward",
    alias: ["cfrd", "cfwd"],
    desc: "Forward messages to groups and channels (Fixed)",
    category: "owner",
    filename: __filename
}, async (client, message, match, { isCreator, reply }) => {
    try {
        if (!isCreator) return await reply("*📛 Owner Only Command*");
        if (!message.quoted) return await reply("*🍁 Please reply to a message to forward*");

        let textInput = "";
        if (typeof match === "string" && match.trim()) textInput = match.trim();
        else if (typeof match === "object" && match?.text) textInput = match.text.trim();
        else if (message.text) textInput = message.text.trim();

        if (!textInput) return await reply("*🍁 Usage:* `.cforward jid1,jid2`\nReply to a message first!");

        const rawJids = textInput.split(/[, \n]+/).map(j => j.trim()).filter(Boolean);
        
        const validJids = rawJids.map(jid => {
            if (jid.includes('whatsapp.com/channel/')) {
                const m = jid.match(/channel\/([a-zA-Z0-9]+)/);
                if (m) return `${m[1]}@newsletter`;
            }
            if (jid.endsWith('@g.us') || jid.endsWith('@s.whatsapp.net') || jid.endsWith('@newsletter')) return jid;
            if (/^\d+$/.test(jid)) return `${jid}@g.us`;
            return null;
        }).filter(Boolean).slice(0, 50);

        if (!validJids.length) return await reply("❌ No valid JIDs found.");
        const uniqueJids = [...new Set(validJids)];
        await reply(`🔄 Forwarding to ${uniqueJids.length} chats...`);

        const rawQuoted = message.msg?.contextInfo?.quotedMessage;
        const quotedContent = getUnwrapped(rawQuoted);
        if (!quotedContent) return await reply("❌ Could not extract quoted content");

        const mediaKey = Object.keys(quotedContent).find(k => 
            ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].includes(k)
        );

        let successCount = 0;

        for (const jid of uniqueJids) {
            try {
                const isNewsletter = jid.endsWith('@newsletter');
                // deep clone without JSON.stringify
                let messageContent = structuredClone ? structuredClone(quotedContent) : JSON.parse(JSON.stringify(quotedContent));

                if (isNewsletter && mediaKey) {
                    const mediaType = mediaKey.replace('Message', '').toLowerCase();
                    const dlType = mediaType === 'sticker' ? 'image' : mediaType;
                    
                    const stream = await downloadContentFromMessage(quotedContent[mediaKey], dlType);
                    const buffer = await streamToBuffer(stream);
                    if (!buffer?.length) throw new Error("Download buffer empty");

                    const uploadRes = await uploadToChannel(client, buffer, mediaType);

                    const mediaObj = messageContent[mediaKey];
                    mediaObj.url = uploadRes.url;
                    mediaObj.directPath = uploadRes.direct_path;
                    mediaObj.fileSha256 = Buffer.from(uploadRes.file_sha256, 'base64');
                    mediaObj.fileEncSha256 = Buffer.from(uploadRes.file_enc_sha256, 'base64');
                    mediaObj.fileLength = buffer.length;
                    mediaObj.mediaKey = Buffer.from(uploadRes.media_key ? uploadRes.media_key : Crypto.randomBytes(32)).length === 32 ? Buffer.from(uploadRes.media_key || Crypto.randomBytes(32).toString('base64'), 'base64') : Crypto.randomBytes(32);
                    
                    // thumbnail wagera rehne do
                }

                const forwardData = generateWAMessageFromContent(jid, messageContent, { userJid: client.user.id });
                await client.relayMessage(jid, forwardData.message, { messageId: forwardData.key.id });
                
                successCount++;
                await new Promise(r => setTimeout(r, 1200));
            } catch (err) {
                console.error(`Forward error to ${jid}:`, err);
            }
        }

        await reply(`✅ *Forward Complete!*\n\n📤 Success: ${successCount}/${uniqueJids.length}`);

    } catch (error) {
        console.error("Forward Error:", error);
        await reply(`💢 Error: ${error.message}`);
    }
});
