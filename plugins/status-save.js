import { cmd } from "../command.js";
import config from '../config.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

// Define the command keywords
const commandKeywords = ["send", "sendme", "do", "give", "bhejo", "bhej", "save", "sand", "sent", "forward"];

// No prefix keyword handler for saving status in IB and Groups
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

    // Check if keyword matches and user is replying to a status broadcast
    if (containsKeyword && message.quoted && (message.quoted.chat === 'status@broadcast' || message.quoted.remoteJid === 'status@broadcast')) {
      
      // ⏳ React - processing
      await client.sendMessage(from, { react: { text: '⏳', key: message.key } }).catch(() => {});

      const quotedMsg = message.quoted;
      const mtype = quotedMsg.mtype || Object.keys(quotedMsg.message || {})[0] || '';
      const originalCaption = quotedMsg.text || quotedMsg.caption || quotedMsg.msg?.text || '';
      const options = { quoted: message };
      const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";

      let buffer = null;

      // Robust media buffer downloader
      try {
        if (typeof quotedMsg.download === 'function') {
          buffer = await quotedMsg.download();
        } else if (client.downloadAndSaveMediaMessage) {
          const streamPath = await client.downloadAndSaveMediaMessage(quotedMsg, 'temp_status');
          buffer = fs.readFileSync(streamPath);
          try { fs.unlinkSync(streamPath); } catch {}
        } else if (quotedMsg.message) {
          const typeKey = Object.keys(quotedMsg.message)[0];
          const stream = await client.downloadContentFromMessage(quotedMsg.message[typeKey], typeKey.replace('Message', '').toLowerCase());
          let chunks = [];
          for await (const chunk of stream) {
            chunks.push(chunk);
          }
          buffer = Buffer.concat(chunks);
        }
      } catch (err) {
        console.error("Status Buffer Download Error:", err);
      }

      let messageContent = {};

      if (mtype.includes("image") || quotedMsg.imageMessage) {
        messageContent = {
          image: buffer || quotedMsg.imageMessage,
          caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : (DESCRIPTION ? `> ${DESCRIPTION}` : ""),
          mimetype: quotedMsg.mimetype || "image/jpeg"
        };
      } else if (mtype.includes("video") || quotedMsg.videoMessage) {
        messageContent = {
          video: buffer || quotedMsg.videoMessage,
          caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : (DESCRIPTION ? `> ${DESCRIPTION}` : ""),
          mimetype: quotedMsg.mimetype || "video/mp4"
        };
      } else if (mtype.includes("audio") || quotedMsg.audioMessage) {
        messageContent = {
          audio: buffer || quotedMsg.audioMessage,
          mimetype: "audio/mp4",
          ptt: quotedMsg.ptt || false
        };
      } else {
        const textContent = originalCaption || quotedMsg.text || "";
        messageContent = {
          text: textContent ? `${textContent}\n\n> ${DESCRIPTION}` : (DESCRIPTION ? `> ${DESCRIPTION}` : "")
        };
      }

      // Forward status to chat (IB or Group)
      await client.sendMessage(from, messageContent, options);
      
      // ✅ React - success
      await client.sendMessage(from, { react: { text: '✅', key: message.key } }).catch(() => {});
    }
  } catch (error) {
    console.error("Keyword Status Save Error:", error);
    if (message && message.key) {
      try {
        await client.sendMessage(from, { react: { text: '❌', key: message.key } }).catch(() => {});
      } catch {}
    }
  }
});
