import { cmd } from '../command.js';
import { fileURLToPath } from 'url';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);

const streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
};

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

cmd({
    pattern: "cforward",
    alias: ["cfrd", "cfwd"],
    desc: "Forward messages to groups and channels - Fixed",
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

        if (!textInput) return await reply("*🍁 Usage:* `.cforward jid1,jid2`");

        const rawJids = textInput.split(/[, \n]+/).map(j => j.trim()).filter(Boolean);
        const validJids = [...new Set(rawJids.map(jid => {
            if (jid.includes('whatsapp.com/channel/')) {
                const m = jid.match(/channel\/([a-zA-Z0-9]+)/);
                if (m) return `${m[1]}@newsletter`;
            }
            if (jid.endsWith('@g.us') || jid.endsWith('@s.whatsapp.net') || jid.endsWith('@newsletter')) return jid;
            if (/^\d+$/.test(jid)) return `${jid}@g.us`;
            return null;
        }).filter(Boolean))].slice(0, 50);

        if (!validJids.length) return await reply("❌ No valid JIDs found.");
        await reply(`🔄 Forwarding to ${validJids.length} chats...`);

        const rawQuoted = message.msg?.contextInfo?.quotedMessage;
        const quotedContent = getUnwrapped(rawQuoted);
        if (!quotedContent) return await reply("❌ Could not extract quoted content");

        const mediaKey = Object.keys(quotedContent).find(k => 
            ['imageMessage','videoMessage','audioMessage','documentMessage','stickerMessage'].includes(k)
        );

        let successCount = 0;

        for (const jid of validJids) {
            try {
                if (mediaKey) {
                    const mediaType = mediaKey.replace('Message','').toLowerCase();
                    const dlType = mediaType === 'sticker' ? 'image' : mediaType;
                    const stream = await downloadContentFromMessage(quotedContent[mediaKey], dlType);
                    const buffer = await streamToBuffer(stream);
                    
                    const caption = quotedContent[mediaKey]?.caption || "";
                    const mimetype = quotedContent[mediaKey]?.mimetype;
                    const fileName = quotedContent[mediaKey]?.fileName || "file";

                    if (mediaKey === 'imageMessage') {
                        await client.sendMessage(jid, { image: buffer, caption, mimetype });
                    } else if (mediaKey === 'videoMessage') {
                        await client.sendMessage(jid, { video: buffer, caption, mimetype });
                    } else if (mediaKey === 'audioMessage') {
                        await client.sendMessage(jid, { audio: buffer, mimetype: mimetype || 'audio/mp4', ptt: quotedContent[mediaKey].ptt || false });
                    } else if (mediaKey === 'documentMessage') {
                        await client.sendMessage(jid, { document: buffer, mimetype, fileName, caption });
                    } else if (mediaKey === 'stickerMessage') {
                        await client.sendMessage(jid, { sticker: buffer });
                    }
                } else {
                    // Text / extendedText
                    const text = quotedContent.conversation || quotedContent.extendedTextMessage?.text || "";
                    if (text) await client.sendMessage(jid, { text });
                    else await client.sendMessage(jid, { forward: quotedContent }); // fallback
                }

                successCount++;
                await new Promise(r => setTimeout(r, 1000));
            } catch (e) {
                console.log(`Fail ${jid}:`, e.message);
            }
        }

        await reply(`✅ *Forward Complete!*\n\n📤 Success: ${successCount}/${validJids.length}`);

    } catch (error) {
        console.error(error);
        await reply(`💢 Error: ${error.message}`);
    }
});
