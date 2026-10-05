//---------------------------------------------------------------------------
//           KAMRAN-MD - YOUTUBE AUDIO DOWNLOADER (VAJIRA API DIRECT)
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
    desc: "Search and download audio from YouTube using Vajira API.",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, text, reply }) => {
    try {
      const q = text ? text.trim() : "";

      if (!q) {
        return reply(`🎵 *Audio Downloader (${AUTHOR})*\n\nUsage: \`.song <song name or link>\`\nExample: \`.song matata\``);
      }

      await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      let targetUrl = q;
      let songTitle = "YouTube Audio";
      let songThumb = "https://i.imgur.com/Te4kE0x.jpeg";
      let channelName = "YouTube";
      let duration = "N/A";

      // If query is not a direct URL, search first using reliable search endpoint to get YouTube link
      if (!q.startsWith("http")) {
        try {
          const searchRes = await axios.get(`https://delirius-api-oficial.vercel.app/search/ytsearch?q=${encodeURIComponent(q)}`, { timeout: 15000 });
          const videos = searchRes.data?.data || searchRes.data?.result || [];
          if (videos.length > 0) {
            targetUrl = videos[0].url || videos[0].link;
            songTitle = videos[0].title || songTitle;
            songThumb = videos[0].image || videos[0].thumbnail || songThumb;
            channelName = videos[0].author?.name || channelName;
            duration = videos[0].timestamp || videos[0].duration || duration;
          }
        } catch (searchErr) {
          console.error("Search API error:", searchErr.message);
        }
      }

      let finalUrl = null;

      // Call Vajira API with the resolved YouTube URL and API Key
      try {
        const apiKey = ["Vajira", "Ofc"].join("");
        const apiUrl = `https://vajiraofc-apis.vercel.app/api/ytmp3?apikey=${apiKey}&url=${encodeURIComponent(targetUrl)}&quality=128`;
        
        const res = await axios.get(apiUrl, { timeout: 30000 });
        const resData = res.data;

        if (resData && resData.status === 200 && resData.data) {
          finalUrl = resData.data.download?.url || resData.data.url;
          if (resData.data.title && resData.data.title !== "Unknown Title") {
            songTitle = resData.data.title;
          }
        }
      } catch (apiErr) {
        console.error("Vajira API error:", apiErr.message);
      }

      // Fallback to alternative API if Vajira fails
      if (!finalUrl) {
        try {
          const fallbackRes = await axios.get(`https://api.v-api.xyz/ytmp3?url=${encodeURIComponent(targetUrl)}`, { timeout: 25000 });
          finalUrl = fallbackRes.data?.url || fallbackRes.data?.dl || fallbackRes.data?.download;
        } catch (fbErr) {
          console.error("Fallback API error:", fbErr.message);
        }
      }

      if (!finalUrl) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Audio download link nahi mil saki. Kripya direct YouTube link try karein!");
      }

      // Send Info & Thumbnail
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
