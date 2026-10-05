//---------------------------------------------------------------------------
//           KAMRAN-MD - YOUTUBE AUDIO DOWNLOADER (MULTI-API FALLBACK)
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';
import yts from 'yt-search';

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

      let ytUrl = q;
      let songTitle = "YouTube Audio";
      let songThumb = "https://i.imgur.com/Te4kE0x.jpeg";
      let channelName = "Unknown";
      let duration = "N/A";

      // If query is not a direct URL, search using yt-search
      if (!q.startsWith("http")) {
        const search = await yts(q);
        const video = search.videos?.[0];
        if (!video) {
          await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
          return reply("❌ No YouTube video found for your query.");
        }
        ytUrl = video.url;
        songTitle = video.title;
        songThumb = video.thumbnail;
        channelName = video.author.name;
        duration = video.timestamp;
      }

      let finalUrl = null;

      // Method 1: Try Vajira API with URL
      try {
        const assembledApiKey = ["Vajira", "Ofc"].join("");
        const apiUrl = `https://vajiraofc-apis.vercel.app/api/ytmp3?apikey=${assembledApiKey}&url=${encodeURIComponent(ytUrl)}&quality=128`;
        const res1 = await axios.get(apiUrl, { timeout: 25000 });
        const data1 = res1.data?.result || res1.data?.data || res1.data;
        finalUrl = data1?.download || data1?.dl || data1?.mp3 || data1?.url;
        if (data1?.title && songTitle === "YouTube Audio") songTitle = data1.title;
        if (data1?.thumbnail) songThumb = data1.thumbnail;
      } catch (err1) {
        console.error("API 1 failed, trying fallback...", err1.message);
      }

      // Method 2: Fallback to Siputzx API if method 1 fails
      if (!finalUrl) {
        try {
          const fallbackUrl = `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(ytUrl)}`;
          const res2 = await axios.get(fallbackUrl, { timeout: 25000 });
          const data2 = res2.data?.data || res2.data?.result || res2.data;
          finalUrl = data2?.dl || data2?.download || data2?.url;
          if (data2?.title && songTitle === "YouTube Audio") songTitle = data2.title;
          if (data2?.thumb || data2?.thumbnail) songThumb = data2.thumb || data2.thumbnail;
        } catch (err2) {
          console.error("API 2 failed:", err2.message);
        }
      }

      if (!finalUrl) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Failed to fetch audio download link from all servers. Try another song!");
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
              sourceUrl: ytUrl,
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
