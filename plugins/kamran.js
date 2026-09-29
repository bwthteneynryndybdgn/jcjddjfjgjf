//---------------------------------------------------------------------------
//           KAMRAN-MD - YOUTUBE AUDIO DOWNLOADER (SECURE & LOCKED)
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import yts from 'yt-search';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const AUTHOR = "DR KAMRAN";
const AUTH_TOKEN_PARTS = ["Vajira", "Ofc"];
const STRICT_OWNER_LOCK = false;

function normalizeYouTubeUrl(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
  return match ? `https://youtube.com/watch?v=${match[1]}` : null;
}

async function fetchAudioData(url, retries = 2) {
  try {
    const assembledApiKey = AUTH_TOKEN_PARTS.join("");
    const apiUrl = `https://vajiraofc-apis.vercel.app/api/ytmp3?apikey=${assembledApiKey}&url=${encodeURIComponent(url)}&quality=128`;
    
    const response = await axios.get(apiUrl, { timeout: 25000 });
    const data = response.data;

    if (data && (data.status === true || data.status === 200)) {
      const res = data.result || data.data || data;
      
      let finalUrl = res.download || res.dl || res.mp3 || res.url;
      
      if (typeof finalUrl === 'object' && finalUrl !== null) {
        finalUrl = finalUrl.url || finalUrl.download || finalUrl.dl || Object.values(finalUrl)[0];
      }

      // Safe title parsing
      const safeTitle = typeof res.title === 'string' ? res.title : "YouTube Audio";

      if (typeof finalUrl === 'string' && finalUrl.length > 0) {
        return {
          audio_url: finalUrl,
          title: safeTitle,
          thumbnail: res.thumbnail || res.image
        };
      }
    }
    
    throw new Error("API security validation or response failed.");
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return fetchAudioData(url, retries - 1);
    }
    console.error(`[${AUTHOR} SECURE CORE] Error:`, error.message);
    return null;
  }
}

// --- MAIN COMMAND: SONG / AUDIO ---

cmd(
  {
    pattern: "song",
    alias: ["ytmp3", "audio76", "play87", "play"],
    react: "🎵",
    desc: "Search and download audio from YouTube.",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply, isOwner, prefix, command }) => {
    try {
      if (STRICT_OWNER_LOCK && !isOwner) {
        return reply(`❌ *Access Denied:* This protected module belongs exclusively to *${AUTHOR}*.`);
      }

      if (!q) return reply(`🎵 *Audio Downloader (${AUTHOR} SECURE)*\n\nUsage: \`${prefix + command} <song name or link>\`\nExample: \`${prefix + command} pal pal song\``);

      await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      let ytdata;
      const cleanUrl = normalizeYouTubeUrl(q);

      if (cleanUrl) {
        const videoIdMatch = cleanUrl.match(/v=([a-zA-Z0-9_-]{11})/);
        if (videoIdMatch) {
          const searchResults = yts({ videoId: videoIdMatch[1] });
          ytdata = await searchResults;
        }
      } 
      
      if (!ytdata || !ytdata.url) {
        const searchResults = await yts(q);
        if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
          return reply("❌ No audio found for your query!");
        }
        ytdata = searchResults.videos[0];
      }

      if (!ytdata || !ytdata.url) {
        return reply("❌ Could not retrieve audio details. Try searching with a direct link or different keywords.");
      }

      // Safe string conversion for title to prevent trim error
      const videoTitle = typeof ytdata.title === 'string' ? ytdata.title : "YouTube Audio";
      const channelName = ytdata.author?.name || ytdata.author || 'Unknown';
      const videoDuration = ytdata.timestamp || ytdata.duration || 'N/A';
      const videoViews = ytdata.views ? ytdata.views.toLocaleString() : 'N/A';

      const infoText = `
🎵 *YT AUDIO DOWNLOADER* 🎵

📌 *Title:* ${videoTitle}
🎬 *Channel:* ${channelName}
⏱️ *Duration:* ${videoDuration}
👁️ *Views:* ${videoViews}

_📥 Downloading your audio file securely..._

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${AUTHOR}`;

      await conn.sendMessage(from, { image: { url: ytdata.thumbnail || ytdata.image }, caption: infoText }, { quoted: mek });
      await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      const dlData = await fetchAudioData(ytdata.url);

      if (!dlData || !dlData.audio_url) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Secure audio link could not be generated. Please try again later.");
      }

      await conn.sendMessage(
        from,
        {
          audio: { url: dlData.audio_url },
          mimetype: "audio/mpeg",
          ptt: false, 
          caption: `✅ *${dlData.title}*\n\n*🚀 Secured & Powered by ${AUTHOR}*`,
          contextInfo: {
            externalAdReply: {
              title: "YT AUDIO DOWNLOADER",
              body: dlData.title,
              thumbnailUrl: ytdata.thumbnail || ytdata.image,
              sourceUrl: ytdata.url,
              mediaType: 2,
              renderLargerThumbnail: true
            }
          }
        },
        { quoted: mek }
      );

      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error("Secure Audio DL Error:", e);
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply(`⚠️ *Error:* ${e.message || "Something went wrong."}`);
    }
  }
);
