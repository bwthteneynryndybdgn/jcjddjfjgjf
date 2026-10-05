import { cmd } from "../command.js";
import config from '../config.js';
import { fileURLToPath } from 'url';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);

const commandKeywords = ["send", "sendme", "do", "give", "bhejo", "bhej", "save", "sand", "sent", "forward"];

cmd({
  'on': "body"
}, async (client, message, store, {
  from,
  body,
  isGroup,
  reply,
  sender,
  userConfig
}) => {
  try {
    const messageText = (body || "").toLowerCase().trim();
    const containsKeyword = commandKeywords.some(word => messageText === word || messageText.includes(word));

    const quoted = message.quoted || message.msg?.contextInfo?.quotedMessage;

    if (containsKeyword && quoted) {
      const remoteJid = message.quoted?.chat || message.msg?.contextInfo?.remoteJid || '';
      
      if (remoteJid === 'status@broadcast' || message.quoted?.isStatus || message.msg?.contextInfo?.participant) {
        
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } }).catch(() => {});

        const quotedMsg = message.quoted || message.msg.contextInfo.quotedMessage;
        const typeKey = Object.keys(quotedMsg.message || quotedMsg)[0] || '';
        const content = quotedMsg.message ? quotedMsg.message[typeKey] : quotedMsg[typeKey];
        const originalCaption = content?.caption || content?.text || '';
        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";

        let buffer = null;
        try {
          if (message.quoted && typeof message.quoted.download === 'function') {
            buffer = await message.quoted.download();
          } else if (content) {
            let mediaType = typeKey.replace('Message', '').toLowerCase();
            if (mediaType === 'ptt') mediaType = 'audio';
            const stream = await downloadContentFromMessage(content, mediaType);
            let chunks = [];
            for await (const chunk of stream) {
              chunks.push(chunk);
            }
            buffer = Buffer.concat(chunks);
          }
        } catch (err) {
          console.error("Status download error:", err);
        }

        if (!buffer || buffer.length === 0) {
          await client.sendMessage(from, { react: { text: '❌', key: message.key } }).catch(() => {});
          return;
        }

        let messageContent = {};

        if (typeKey.includes("image") || content?.mimetype?.includes('image')) {
          messageContent = {
            image: buffer,
            caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : (DESCRIPTION ? `> ${DESCRIPTION}` : ""),
            mimetype: content?.mimetype || "image/jpeg"
          };
        } else if (typeKey.includes("video") || content?.mimetype?.includes('video')) {
          messageContent = {
            video: buffer,
            caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : (DESCRIPTION ? `> ${DESCRIPTION}` : ""),
            mimetype: content?.mimetype || "video/mp4"
          };
        } else if (typeKey.includes("audio") || content?.mimetype?.includes('audio')) {
          messageContent = {
            audio: buffer,
            mimetype: "audio/mp4",
            ptt: content?.ptt || false
          };
        } else {
          const textContent = originalCaption || content?.text || "";
          messageContent = {
            text: textContent ? `${textContent}\n\n> ${DESCRIPTION}` : (DESCRIPTION ? `> ${DESCRIPTION}` : "")
          };
        }

        await client.sendMessage(from, messageContent, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } }).catch(() => {});
      }
    }
  } catch (error) {
    console.error("Status Save Error:", error);
    try {
      await client.sendMessage(from, { react: { text: '❌', key: message.key } }).catch(() => {});
    } catch {}
  }
});
