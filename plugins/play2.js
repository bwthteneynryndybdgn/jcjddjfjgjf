//---------------------------------------------------------------------------
//           KAMRAN-MD - YOUTUBE AUDIO DOWNLOADER (STABLE ESM)
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const AUTHOR = "DR KAMRAN";
const STRICT_OWNER_LOCK = false;

cmd(
  {
    pattern: "song",
    alias: ["play", "ytmp3", "audio"],
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

      const usedPrefix = prefix || ".";
      const usedCommand = command || "song";

      if (!q) {
        return reply(`🎵 *Audio Downloader (${AUTHOR})*\n\nUsage: \`${usedPrefix + usedCommand} <song name or link>\`\nExample: \`${usedPrefix + usedCommand} karan aujla song\``);
      }

      await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      let targetUrl = q;
      let songTitle = "YouTube Audio";
      let songThumb = "https://i.imgur.com/Te4kE0x.jpeg";
      let channelName = "Unknown";
      let duration = "N/A";

      // If query is not a direct URL, fetch video details using reliable search API
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

      // Method 1: Try Vajira API
      try {
        const assembledApiKey = ["Vajira", "Ofc"].join("");
        const apiUrl = `https://vajiraofc-apis.vercel.app/api/ytmp3?apikey=${assembledApiKey}&url=${encodeURIComponent(targetUrl)}&quality=128`;
        const res1 = await axios.get(apiUrl, { timeout: 25000 });
        const data1 = res1.data?.result || res1.data?.data || res1.data;
        finalUrl = data1?.download || data1?.dl || data1?.mp3 || data1?.url;
        if (data1?.title) songTitle = data1.title;
        if (data1?.thumbnail || data1?.thumb) songThumb = data1.thumbnail || data1.thumb;
      } catch (err1) {
        console.error("API 1 failed, trying fallback...", err1.message);
      }

      // Method 2: Fallback to Siputzx Download API
      if (!finalUrl) {
        try {
          const fallbackUrl = `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(targetUrl)}`;
          const res2 = await axios.get(fallbackUrl, { timeout: 25000 });
          const data2 = res2.data?.data || res2.data?.result || res2.data;
          finalUrl = data2?.dl || data2?.download || data2?.url;
          if (data2?.title) songTitle = data2.title;
          if (data2?.thumb || data2?.thumbnail) songThumb = data2.thumb || data2.thumbnail;
        } catch (err2) {
          console.error("API 2 failed:", err2.message);
        }
      }

      if (!finalUrl) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Failed to fetch audio download link. Try providing a direct YouTube link!");
      }

      // Send Info & Audio
      const infoText = `
🎵 *YT AUDIO DOWNLOADER* 🎵

📌 *Title:* ${songTitle}
🎬 *Channel:* ${channelName}
⏱️ *Duration:* ${duration}

_📥 Sending your audio file..._

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${AUTHOR}`;

      await conn.sendMessage(from, { image: { url: songThumb }, caption: infoText }, { quoted: mek });
      await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      await conn.sendMessage(
        from,
        {
          audio: { url: finalUrl },
          mimetype: "audio/mpeg",
          ptt: false, 
          caption: `✅ *${songTitle}*\n\n*🚀 Secured & Powered by ${AUTHOR}*`,
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
