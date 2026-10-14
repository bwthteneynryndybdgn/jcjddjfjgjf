import { cmd } from "../command.js";
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// Yahan aap apne saare pasandida keywords daal sakte hain (jaise play2, play, song, music, etc.)
const songKeywords = ["play2", "play", "song", "audio", "music2", "play17", "ytplay17", "song17", "plays17"];

cmd({
  'on': "body"
}, async (client, message, store, {
  from,
  body,
  isGroup,
  reply
}) => {
  try {
    const messageText = body ? body.toLowerCase().trim() : "";
    let matchedKeyword = null;
    let query = "";

    // Check karein ki message kis keyword se shuru ho raha hai
    for (let keyword of songKeywords) {
      if (messageText.startsWith(keyword + " ") || messageText === keyword) {
        matchedKeyword = keyword;
        query = messageText.slice(keyword.length).trim();
        break;
      }
    }

    // Agar keyword aur gaane ka naam mil jaye
    if (matchedKeyword && query) {
      // ⏳ Loading reaction
      await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

      const encodedQuery = encodeURIComponent(query);
      const apiUrl = `https://apiii-xrina.my.id/download/play?q=${encodedQuery}`;
      
      const response = await axios.get(apiUrl, { timeout: 30000 });
      const resData = response.data;

      if (!resData || !resData.status || !resData.data) {
        await client.sendMessage(from, { react: { text: '❌', key: message.key } };
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

      // Thumbnail aur details bhejein
      if (thumbnail) {
        await client.sendMessage(from, { 
          image: { url: thumbnail }, 
          caption: caption 
        }, { quoted: message });
      } else {
        await reply(caption);
      }

      // Audio file bhejein
      await client.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: 'audio/mp4',
        ptt: false 
      }, { quoted: message });

      // ✅ Success reaction
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
