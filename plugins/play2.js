//---------------------------------------------------------------------------
//           KAMRAN-MD - YOUTUBE AUDIO DOWNLOADER (NO-SEARCH ERROR FIX)
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const AUTHOR = "DR KAMRAN";
const AUTH_TOKEN_PARTS = ["Vajira", "Ofc"];
const STRICT_OWNER_LOCK = false;

cmd(
  {
    pattern: "song",
    alias: ["play", "ytmp", "audio"],
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

      // Direct API call without yt-search to prevent title.trim crashes
      const assembledApiKey = AUTH_TOKEN_PARTS.join("");
      const apiUrl = `https://vajiraofc-apis.vercel.app/api/ytmp3?apikey=${assembledApiKey}&url=${encodeURIComponent(q)}&quality=128`;
      
      const response = await axios.get(apiUrl, { timeout: 30000 });
      const data = response.data;

      if (!data || (data.status !== true && data.status !== 200 && !data.result)) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Could not find or download audio for your query. Try providing a direct YouTube link!");
      }

      const res = data.result || data.data || data;
      
      let finalUrl = res.download || res.dl || res.mp3 || res.url;
      if (typeof finalUrl === 'object' && finalUrl !== null) {
        finalUrl = finalUrl.url || finalUrl.download || finalUrl.dl || Object.values(finalUrl)[0];
      }

      if (!finalUrl || typeof finalUrl !== 'string') {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Invalid download link received from API.");
      }

      let songTitle = "YouTube Audio";
      if (res.title) {
        songTitle = typeof res.title === 'string' ? res.title : (res.title.text || String(res.title));
      }

      const songThumb = res.thumbnail || res.image || "https://i.imgur.com/Te4kE0x.jpeg";
      const channelName = res.author || res.channel || "Unknown";
      const duration = res.duration || res.timestamp || "N/A";

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
              sourceUrl: q.startsWith("http") ? q : "https://youtube.com",
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
