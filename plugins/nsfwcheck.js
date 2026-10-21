//---------------------------------------------------------------------------
//           KAMRAN-MD - THENKIRI MOVIE DOWNLOADER PLUGIN
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const AUTHOR = "KAMRAN-MD";
const API_KEY = "VajiraOfc";

cmd(
  {
    pattern: "movie6",
    alias: ["nkiri7", "film", "downloadmovie"],
    react: "🎬",
    desc: "Search and get download links for Hollywood movies from TheNkiri.",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, text, reply }) => {
    try {
      const q = text ? text.trim() : "";

      if (!q) {
        return reply(
          `🎬 *Movie Downloader (${AUTHOR})*\n\n` +
          `*Usage:* \`.movie <movie name or url>\`\n` +
          `*Example 1:* \`.movie Ricky Stanicky\`\n` +
          `*Example 2:* \`.movie https://thenkiri.com/ricky-stanicky-2024-download-hollywood-movie/\``
        );
      }

      await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      // Check if user provided a direct movie URL from TheNkiri
      if (q.startsWith("http") && q.includes("thenkiri.com")) {
        const detailsUrl = `https://vajiraofc-apis.vercel.app/api/thenkiri/details?apikey=${API_KEY}&url=${encodeURIComponent(q)}`;
        const res = await axios.get(detailsUrl, { timeout: 25000 });
        const result = res.data?.data;

        if (!result) {
          await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
          return reply("❌ Movie details fetch karne mein nakamy rahi!");
        }

        const movieInfo = `
🎬 *MOVIE DETAILS* 🎬

📌 *Title:* ${result.title || "N/A"}
🎭 *Genre:* ${result.genres || "N/A"}
📦 *Size:* ${result.size || "N/A"}
🎥 *Quality:* ${result.quality || "N/A"}
📅 *Year:* ${result.year || "N/A"}

🔗 *Direct Download Link:*
${result.directDownloadUrl || result.downloadPageLink || "N/A"}

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${AUTHOR}`;

        const posterUrl = result.imageUrl || "https://i.imgur.com/Te4kE0x.jpeg";

        await conn.sendMessage(from, { image: { url: posterUrl }, caption: movieInfo }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        return;
      }

      // Otherwise, perform a search query
      const searchUrl = `https://vajiraofc-apis.vercel.app/api/thenkiri/search?apikey=${API_KEY}&q=${encodeURIComponent(q)}`;
      const searchRes = await axios.get(searchUrl, { timeout: 25000 });
      const results = searchRes.data?.results || [];

      if (results.length === 0) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Is naam se koi movie nahi mili!");
      }

      let searchListText = `🎬 *THENKIRI MOVIE SEARCH* 🎬\n\n*Query:* ${q}\n━━━━━━━━━━━━━━━━━━\n\n`;

      const limit = Math.min(results.length, 5);
      for (let i = 0; i < limit; i++) {
        const movie = results[i];
        searchListText += `*${movie.id}. ${movie.title}*\n`;
        searchListText += `🔗 *Link:* \`${movie.url}\`\n`;
        searchListText += `━━━━━━━━━━━━━━━━━━\n`;
      }

      searchListText += `\n_💡 Tip: Kisi bhi movie ki details aur direct download link ke liye uska link copy karke \`.movie <link>\` bhejein!_\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${AUTHOR}`;

      await conn.sendMessage(from, { text: searchListText }, { quoted: mek });
      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error("Movie Command Error:", e);
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply(`⚠️ *Error:* ${e.message || "Something went wrong."}`);
    }
  }
);
