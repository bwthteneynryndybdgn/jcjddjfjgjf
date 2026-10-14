import { cmd } from "../command.js";
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// Yahan aap apne pasandida keywords rakh sakte hain
const songKeywords = ["play", "song", "audio", "music", "play2", "ytplay", "song2"];

cmd({
  'on': "body"
}, async (client, message, store, {
  from,
  body,
  isGroup,
  reply
}) => {
  try {
    // Message text ko check karein
    const messageText = body ? body.toLowerCase().trim() : "";
    if (!messageText) return;

    let query = "";
    let isMatched = false;

    // Check karein ki message kisi keyword se start ho raha hai ya nahi
    for (let keyword of songKeywords) {
      if (messageText === keyword || messageText.startsWith(keyword + " ")) {
        isMatched = true;
        query = messageText.slice(keyword.length).trim();
        break;
      }
    }

    // Agar keyword match ho gaya aur gaane ka naam bhi diya hai
    if (isMatched && query) {
      // ⏳ Processing reaction
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

      // Caption tayar karein
      let caption = `🎶 *Title:* ${title}\n`;
      if (author) caption += `👤 *Channel:* ${author}\n`;
      if (duration) caption += `⏱️ *Duration:* ${duration}\n`;
      caption += `📁 *Status:* Downloading audio...`;

      // Pehle thumbnail aur details bhejein
      if (thumbnail) {
        await client.sendMessage(from, { 
          image: { url: thumbnail }, 
          caption: caption 
        }, { quoted: message });
      } else {
        await reply(caption);
      }

      // Phir audio file bhejein
      await client.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: 'audio/mp4',
        ptt: false 
      }, { quoted: message });

      // ✅ Success reaction
      await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    }
  } catch (error) {
    console.error("Independent Auto Song Error:", error);
  }
});
