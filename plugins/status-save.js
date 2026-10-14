import { cmd } from "../command.js";
import config from '../config.js';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==========================================
// 1. STATUS SAVER HANDLER (Fixed)
// ==========================================
const commandKeywords = ["send", "sendme", "do", "give", "bhejo", "bhej", "save", "sand", "sent", "forward"];

cmd({
  'on': "body"
}, async (client, message, store, {
  from,
  body,
  isGroup,
  reply,
  userConfig
}) => {
  try {
    if (isGroup) return;
    
    // 🔥 Yahin par error aa raha tha! Agar message quoted nahi hai toh yahin se return ho jaye
    if (!message.quoted) return;

    const messageText = body ? body.toLowerCase() : "";
    const containsKeyword = commandKeywords.some(word => messageText.includes(word));

    if (containsKeyword && message.quoted?.chat === 'status@broadcast') {
      await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

      const mtype = message.quoted.mtype;
      const originalCaption = message.quoted.text || message.quoted.msg?.text || '';
      const options = { quoted: message };
      const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";

      let messageContent = {};
      let buffer = null;

      if (["imageMessage", "videoMessage", "audioMessage"].includes(mtype)) {
        buffer = await message.quoted.download();
      }

      switch (mtype) {
        case "imageMessage":
          messageContent = {
            image: buffer,
            caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : (DESCRIPTION ? `> ${DESCRIPTION}` : ""),
            mimetype: message.quoted.mimetype || "image/jpeg"
          };
          break;
        case "videoMessage":
          messageContent = {
            video: buffer,
            caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : (DESCRIPTION ? `> ${DESCRIPTION}` : ""),
            mimetype: message.quoted.mimetype || "video/mp4"
          };
          break;
        case "audioMessage":
          messageContent = {
            audio: buffer,
            mimetype: "audio/mp4",
            ptt: message.quoted.ptt || false
          };
          break;
        case "conversation":
        case "extendedTextMessage":
          const textContent = originalCaption || message.quoted.msg?.conversation || "";
          messageContent = {
            text: textContent ? `${textContent}\n\n> ${DESCRIPTION}` : (DESCRIPTION ? `> ${DESCRIPTION}` : "")
          };
          break;
        default:
          await client.sendMessage(from, { react: { text: '❌', key: message.key } });
          return;
      }

      await client.sendMessage(from, messageContent, options);
      await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    }
  } catch (error) {
    console.error("Keyword Status Save Error:", error);
  }
});


// ==========================================
// 2. AUTO SONG PLAYER HANDLER
// ==========================================
const songKeywords = ["play3", "song3", "audio2", "music", "play2", "ytplay2", "song4"];

cmd({
  'on': "body"
}, async (client, message, store, {
  from,
  body,
  isGroup,
  reply
}) => {
  try {
    if (isGroup) return;

    const messageText = body ? body.toLowerCase().trim() : "";
    let matchedKeyword = null;
    let query = "";

    for (let keyword of songKeywords) {
      if (messageText.startsWith(keyword + " ") || messageText === keyword) {
        matchedKeyword = keyword;
        query = messageText.slice(keyword.length).trim();
        break;
      }
    }

    if (matchedKeyword && query) {
      await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

      const encodedQuery = encodeURIComponent(query);
      const apiUrl = `https://apiii-xrina.my.id/download/play?q=${encodedQuery}`;
      
      const response = await axios.get(apiUrl, { timeout: 30000 });
      const resData = response.data;

      if (!resData || !resData.status || !resData.data) {
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
        return reply("❌ Is gaane ka koi result nahi mila.");
      }

      const info = resData.data;
      const audioUrl = info.media?.[0] || info.music || '';
      const title = info.title || query;
      const thumbnail = info.cover || '';
      const duration = info.duration || '';     
      const author = info.author?.nickname || '';

      if (!audioUrl) {
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
        return reply("❌ MP3 download link nahi mila.");
      }

      let caption = `🎶 *Title:* ${title}\n`;
      if (author) caption += `👤 *Channel:* ${author}\n`;
      if (duration) caption += `⏱️ *Duration:* ${duration}\n`;
      caption += `📁 *Status:* Downloading audio...`;

      if (thumbnail) {
        await client.sendMessage(from, { 
          image: { url: thumbnail }, 
          caption: caption 
        }, { quoted: message });
      } else {
        await reply(caption);
      }

      await client.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: 'audio/mp4',
        ptt: false 
      }, { quoted: message });

      await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    }
  } catch (error) {
    console.error("Auto Song Play Error:", error);
    try {
      if (message && message.key) {
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
      }
    } catch (reactError) {
      console.error("Failed to send error reaction:", reactError);
    }
  }
});
