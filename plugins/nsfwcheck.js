//---------------------------------------------------------------------------
//           KAMRAN-MD - THENKIRI MOVIE DOCUMENT DOWNLOADER
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
    alias: ["nkiri6", "film5", "downloadmovie"],
    react: "📥",
    desc: "Search movie and send as document file.",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, text, reply }) => {
    try {
      const q = text ? text.trim() : "";

      if (!q) {
        return reply(
          `🎬 *Movie Document Downloader (${AUTHOR})*\n\n` +
          `*Usage:* \`.movie <movie name or url>\`\n` +
          `*Example:* \`.movie Ricky Stanicky\``
        );
      }

      await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      let targetDetailsUrl = "";

      // If user provided a direct link
      if (q.startsWith("http") && q.includes("thenkiri.com")) {
        targetDetailsUrl = `https://vajiraofc-apis.vercel.app/api/thenkiri/details?apikey=${API_KEY}&url=${encodeURIComponent(q)}`;
      } else {
        // Step 1: Search movie first
        const searchUrl = `https://vajiraofc-apis.vercel.app/api/thenkiri/search?apikey=${API_KEY}&q=${encodeURIComponent(q)}`;
        const searchRes = await axios.get(searchUrl, { timeout: 25000 });
        const results = searchRes.data?.results || [];

        if (results.length === 0) {
          await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
          return reply("❌ Is naam se koi movie nahi mili!");
        }

        // Step 2: Automatically select the first search result
        const firstMovieUrl = results[0].url;
        targetDetailsUrl = `https://vajiraofc-apis.vercel.app/api/thenkiri/details?apikey=${API_KEY}&url=${encodeURIComponent(firstMovieUrl)}`;
      }

      // Step 3: Fetch movie details and direct download link
      const detailsRes = await axios.get(targetDetailsUrl, { timeout: 25000 });
      const result = detailsRes.data?.data;

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

      // Send Poster Image first with caption info
      await conn.sendMessage(from, { image: { url: posterUrl }, caption: captionText }, { quoted: mek });
      await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      // Send file as Document
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

    } catch (e) {
      console.error("Movie Document Error:", e);
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply(`⚠️ *Error:* ${e.message || "Something went wrong."}`);
    }
  }
);
