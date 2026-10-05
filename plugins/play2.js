//---------------------------------------------------------------------------
//           KAMRAN-MD - YOUTUBE AUDIO DOWNLOADER (FIXED STRUCTURE)
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const AUTHOR = "KAMRAN-MD";

cmd(
  {
    pattern: "song",
    alias: ["play", "ytmp3", "audio"],
    react: "🎵",
    desc: "Search and download audio from YouTube.",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, text, reply }) => {
    try {
      const q = text ? text.trim() : "";

      if (!q) {
        return reply(`🎵 *Audio Downloader (${AUTHOR})*\n\nUsage: \`.song <song name or link>\`\nExample: \`.song karan aujla\``);
      }

      await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      let targetUrl = q;
      let songTitle = "YouTube Audio";
      let songThumb = "https://i.imgur.com/Te4kE0x.jpeg";
      let channelName = "Unknown";
      let duration = "N/A";

      // If query is not a direct URL, search first using reliable search endpoint
      if (!q.startsWith("http")) {
        try {
          const searchRes = await axios.get(`https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(q)}`, { timeout: 15000 });
          const videos = searchRes.data?.data || searchRes.data?.result || [];
          if (videos.length > 0) {
            targetUrl = videos[0].url || videos[0].link;
            songTitle = videos[0].title || songTitle;
            songThumb = videos[0].thumbnail || videos[0].image || songThumb;
            channelName = videos[0].author?.name || videos[0].artist || channelName;
            duration = videos[0].duration || duration;
          }
        } catch (searchErr) {
          console.error("Search API error:", searchErr.message);
        }
      }

      let finalUrl = null;

      // Method 1: Try Exonity API
      try {
        const api1 = `https://exonity.tech/api/v1/ytmp3?url=${encodeURIComponent(targetUrl)}`;
        const res1 = await axios.get(api1, { timeout: 20000 });
        finalUrl = res1.data?.result?.download || res1.data?.download || res1.data?.url;
        if (res1.data?.result?.title) songTitle = res1.data.result.title;
      } catch (e1) {
        console.error("API 1 failed:", e1.message);
      }

      // Method 2: Fallback to Siputzx API
      if (!finalUrl) {
        try {
          const api2 = `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(targetUrl)}`;
          const res2 = await axios.get(api2, { timeout: 20000 });
          finalUrl = res2.data?.data?.dl || res2.data?.result?.dl || res2.data?.url;
          if (res2.data?.data?.title) songTitle = res2.data.data.title;
        } catch (e2) {
          console.error("API 2 failed:", e2.message);
        }
      }

      if (!finalUrl) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Audio download link nahi mil saki. Kripya direct YouTube link try karein!");
      }

      // Send Info & Audio Thumbnail
      const infoText = `
🎵 *YT AUDIO DOWNLOADER* 🎵

📌 *Title:* ${songTitle}
🎬 *Channel:* ${channelName}
⏱️ *Duration:* ${duration}

_📥 Sending your audio file..._

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${AUTHOR}`;

      await conn.sendMessage(from, { image: { url: songThumb }, caption: infoText }, { quoted: mek });
      await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      // Send Audio File
      await conn.sendMessage(
        from,
        {
          audio: { url: finalUrl },
          mimetype: "audio/mpeg",
          ptt: false,
          caption: `✅ *${songTitle}*\n\n*🚀 Powered by ${AUTHOR}*`,
          contextInfo: {
            externalAdReply: {
              title: "YT AUDIO DOWNLOADER",
              body: songTitle,
              thumbnailUrl: songThumb,
              sourceUrl: targetUrl,
              mediaType: 2,
              renderLargerThumbnail: true
            }
          }
        },
        { quoted: mek }
      );

      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error("Song Command Fatal Error:", e);
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key }});
      reply(`⚠️ *Error:* ${e.message || "Something went wrong."}`);
    }
  }
);
