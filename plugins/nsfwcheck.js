//---------------------------------------------------------------------------
//           KAMRAN-MD - THENKIRI INTERACTIVE MOVIE SELECTOR
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const AUTHOR = "KAMRAN-MD";
const API_KEY = "VajiraOfc";

// Temporary memory store for search results (per chat)
const searchSession = {};

cmd(
  {
    pattern: "movie6",
    alias: ["nkiri6", "film", "downloadmovie"],
    react: "🎬",
    desc: "Search movies and download by selecting number.",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, text, reply }) => {
    try {
      const q = text ? text.trim() : "";

      if (!q) {
        return reply(
          `🎬 *Movie Downloader (${AUTHOR})*\n\n` +
          `*Usage:* \`.movie <movie name>\`\n` +
          `*Example:* \`.movie 2026\``
        );
      }

      await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      // Agar user ne koi number select kiya hai aur session mein movies maujood hain
      if (/^\d+$/.test(q) && searchSession[from]) {
        const index = parseInt(q) - 1;
        const moviesList = searchSession[from];

        if (index < 0 || index >= moviesList.length) {
          await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
          return reply("❌ Ghalat number select kiya hai! Baraye meharbani list mein se sahi number bhejein.");
        }

        const selectedMovie = moviesList[index];
        const detailsUrl = `https://vajiraofc-apis.vercel.app/api/thenkiri/details?apikey=${API_KEY}&url=${encodeURIComponent(selectedMovie.url)}`;

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const res = await axios.get(detailsUrl, { timeout: 25000 });
        const result = res.data?.data;

        if (!result || !result.directDownloadUrl) {
          await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
          return reply("❌ Movie ka direct download link nahi mil saka!");
        }

        const movieTitle = result.title || selectedMovie.title;
        const downloadUrl = result.directDownloadUrl;
        const posterUrl = result.imageUrl || "https://i.imgur.com/Te4kE0x.jpeg";

        const captionText = `
🎬 *MOVIE DOWNLOADED* 🎬

📌 *Title:* ${movieTitle}
🎭 *Genre:* ${result.genres || "N/A"}
📦 *Size:* ${result.size || "N/A"}
🎥 *Quality:* ${result.quality || "N/A"}

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${AUTHOR}`;

        await conn.sendMessage(from, { image: { url: posterUrl }, caption: captionText }, { quoted: mek });

        // Send as Document file
        await conn.sendMessage(
          from,
          {
            document: { url: downloadUrl },
            mimetype: "video/mp4",
            fileName: `${movieTitle}.mp4`,
            caption: `✅ *${movieTitle}*\n\n*🚀 Powered by ${AUTHOR}*`
          },
          { quoted: mek }
        );

        // Clear session after download
        delete searchSession[from];
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        return;
      }

      // Nayi search query ke liye results fetch karna
      const searchUrl = `https://vajiraofc-apis.vercel.app/api/thenkiri/search?apikey=${API_KEY}&q=${encodeURIComponent(q)}`;
      const searchRes = await axios.get(searchUrl, { timeout: 25000 });
      const results = searchRes.data?.results || [];

      if (results.length === 0) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Is naam se koi movie nahi mili!");
      }

      const limit = Math.min(results.length, 5);
      searchSession[from] = results.slice(0, limit);

      let searchListText = `🎬 *THENKIRI MOVIE SEARCH RESULTS* 🎬\n\n*Query:* ${q}\n━━━━━━━━━━━━━━━━━━\n\n`;

      for (let i = 0; i < limit; i++) {
        searchListText += `*${i + 1}.* ${searchSession[from][i].title}\n`;
      }

      searchListText += `\n━━━━━━━━━━━━━━━━━━\n_💡 Reply with the number (e.g. \`1\`, \`2\`, etc.) to download that movie as a Document!_\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${AUTHOR}`;

      await conn.sendMessage(from, { text: searchListText }, { quoted: mek });
      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error("Movie Interactive Error:", e);
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply(`⚠️ *Error:* ${e.message || "Something went wrong."}`);
    }
  }
);
