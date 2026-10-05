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

    // Universal quoted message retriever for both IB and Groups
    const quoted = message.quoted || message.msg?.contextInfo?.quotedMessage || message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (containsKeyword && quoted) {
      const remoteJid = message.quoted?.chat || message.msg?.contextInfo?.remoteJid || '';
      
      const isStatusMessage = remoteJid === 'status@broadcast' || 
                              message.quoted?.isStatus || 
                              message.msg?.contextInfo?.isStatus ||
                              quoted.imageMessage || 
                              quoted.videoMessage || 
                              quoted.audioMessage ||
                              quoted.protocolMessage?.editedMessage?.imageMessage;

      if (isStatusMessage || quoted) {
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } }).catch(() => {});

        const quotedMsg = message.quoted || quoted;
        const typeKey = Object.keys(quotedMsg.message || quotedMsg)[0] || '';
        const content = quotedMsg.message ? quotedMsg.message[typeKey] : quotedMsg[typeKey];
        const originalCaption = content?.caption || content?.text || quotedMsg.text || '';
        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";

        let buffer = null;
        try {
          if (message.quoted && typeof message.quoted.download === 'function') {
            buffer = await message.quoted.download();
          } else if (content) {
            let mediaType = typeKey.replace('Message', '').toLowerCase();
            if (mediaType === 'ptt' || mediaType.includes('audio')) mediaType = 'audio';
            else if (mediaType.includes('image')) mediaType = 'image';
            else if (mediaType.includes('video')) mediaType = 'video';

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

        if (typeKey.includes("image") || content?.mimetype?.includes('image') || quoted.imageMessage) {
          messageContent = {
            image: buffer,
            caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : (DESCRIPTION ? `> ${DESCRIPTION}` : ""),
            mimetype: content?.mimetype || quoted.imageMessage?.mimetype || "image/jpeg"
          };
        } else if (typeKey.includes("video") || content?.mimetype?.includes('video') || quoted.videoMessage) {
          messageContent = {
            video: buffer,
            caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : (DESCRIPTION ? `> ${DESCRIPTION}` : ""),
            mimetype: content?.mimetype || quoted.videoMessage?.mimetype || "video/mp4"
          };
        } else if (typeKey.includes("audio") || content?.mimetype?.includes('audio') || quoted.audioMessage) {
          messageContent = {
            audio: buffer,
            mimetype: "audio/mp4",
            ptt: content?.ptt || quoted.audioMessage?.ptt || false
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
