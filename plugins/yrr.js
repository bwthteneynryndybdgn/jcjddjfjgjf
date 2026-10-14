import { cmd } from "../command.js";
import config from '../config.js';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// Define song keywords jo trigger karenge
const songKeywords = ["play", "song", "audio", "music", "play2", "ytplay", "song2"];

// No prefix body handler for auto song play
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
    // Agar aap group mein bhi chalana chahte hain toh is line ko hata sakte hain
    if (isGroup) return;

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

    // Agar keyword aur gaane ka naam dono mil jayein
    if (matchedKeyword && query) {
      // ⏳ React - processing
      await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

      // Call the API endpoint
      const encodedQuery = encodeURIComponent(query);
      const apiUrl = `https://api.azbry.com/api/download/ytplay2?q=${encodedQuery}`;
      
      const response = await axios.get(apiUrl, { timeout: 30000 });
      const resData = response.data;

      if (!resData || !resData.status || !resData.result) {
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
        return reply("❌ Is gaane ka koi result nahi mila.");
      }

      const info = resData.result;
      const audioUrl = info.download;        // API download link
      const title = info.title || query;
      const thumbnail = info.thumbnail || '';
      const duration = info.duration || '';     
      const author = info.channel || '';       // Channel name

      if (!audioUrl) {
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
        return reply("❌ MP3 download link retrieve karne mein nakamyab.");
      }

      // Prepare info caption
      let caption = `🎶 *Title:* ${title}\n`;
      if (author) caption += `👤 *Channel:* ${author}\n`;
      if (duration) caption += `⏱️ *Duration:* ${duration}\n`;
      caption += `📁 *Status:* Downloading audio...`;

      // Send thumbnail and details first
      if (thumbnail) {
        await client.sendMessage(from, { 
          image: { url: thumbnail }, 
          caption: caption 
        }, { quoted: message });
      } else {
        await reply(caption);
      }

      // Send the audio file automatically
      await client.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: 'audio/mp4',
        ptt: false 
      }, { quoted: message });

      // ✅ React - success
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
