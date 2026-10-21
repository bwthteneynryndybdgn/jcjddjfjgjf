//---------------------------------------------------------------------------
//           KAMRAN-MD - THENKIRI MOVIE SEARCH & DOWNLOAD PLUGIN
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
    alias: ["nkiri6", "film", "downloadmovie"],
    react: "🎬",
    desc: "Search movies or download selected movie as document.",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, text, reply }) => {
    try {
      const q = text ? text.trim() : "";

      if (!q) {
        return reply(
          `🎬 *Movie Downloader (${AUTHOR})*\n\n` +
          `*Usage 1 (Search):* \`.movie <movie name>\`\n` +
          `*Usage 2 (Download):* \`.movie <movie url>\`\n` +
          `*Example:* \`.movie Ricky Stanicky\``
        );
      }

      await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      // Agar user ne direct link diya hai, toh seedha document download karo
      if (q.startsWith("http") && q.includes("thenkiri.com")) {
        const detailsUrl = `https://vajiraofc-apis.vercel.app/api/thenkiri/details?apikey=${API_KEY}&url=${encodeURIComponent(q)}`;
        const res = await axios.get(detailsUrl, { timeout: 25000 });
        const result = res.data?.data;

        if (!result || !result.directDownloadUrl) {
          await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
          return reply("❌ Movie ka direct download link nahi mil saka!");
        }

        const movieTitle = result.title || "Movie";
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
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

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

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        return;
      }

      // Agar query text hai, toh pehle search list dikhao
      const searchUrl = `https://vajiraofc-apis.vercel.app/api/thenkiri/search?apikey=${API_KEY}&q=${encodeURIComponent(q)}`;
      const searchRes = await axios.get(searchUrl, { timeout: 25000 });
      const results = searchRes.data?.results || [];

      if (results.length === 0) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Is naam se koi movie nahi mili!");
      }

      let searchListText = `🎬 *THENKIRI MOVIE SEARCH RESULTS* 🎬\n\n*Query:* ${q}\n━━━━━━━━━━━━━━━━━━\n\n`;

      const limit = Math.min(results.length, 5);
      for (let i = 0; i < limit; i++) {
        const movie = results[i];
        searchListText += `*${movie.id}. ${movie.title}*\n`;
        searchListText += `🔗 *Link:* \`${movie.url}\`\n`;
        searchListText += `━━━━━━━━━━━━━━━━━━\n`;
      }

      searchListText += `\n_💡 Tip: List mein se kisi bhi movie ko document mein download karne ke liye uska link copy karke \`.movie <link>\` bhejein!_\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${AUTHOR}`;

      await conn.sendMessage(from, { text: searchListText }, { quoted: mek });
      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error("Movie Command Error:", e);
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply(`⚠️ *Error:* ${e.message || "Something went wrong."}`);
    }
  }
);
