//---------------------------------------------------------------------------
//           KAMRAN-MD - THENKIRI INTERACTIVE MOVIE PLUGIN
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTHOR = "KAMRAN-MINI-BOT";
const API_KEY = "VajiraOfc";

// Global session store for TheNkiri search & download steps
const nkiriSessions = global.nkiriSessions || (global.nkiriSessions = {});

async function getThumbnailBuffer(url) {
  if (!url) return null;
  try {
    const { data } = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(data);
  } catch (err) {
    return null;
  }
}

cmd({
    pattern: "movie6",
    alias: ["nkiri", "film", "downloadmovie"],
    desc: "Search and download movies from TheNkiri via API",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, react }) => {
    try {
        const q = text ? text.trim() : "";

        if (!q) {
            return reply(
                "❌ *Opps! Title Missing* ❌\n\n" +
                "Please provide a movie name to search!\n" +
                "📌 *Example:* `.movie 2026`"
            );
        }

        // STEP 2: Handle Download / Quality Selection if session is active
        if (nkiriSessions[from] && nkiriSessions[from].step === 'quality' && /^\d+$/.test(q)) {
            const session = nkiriSessions[from];
            const dlIndex = parseInt(q) - 1;
            const downloadUrl = session.downloadUrl;

            if (dlIndex < 0 || dlIndex !== 0 || !downloadUrl) {
                return reply("❌ Ghalat number select kiya hai! Baraye meharbani sahi option bhejein.");
            }

            await react("📥");
            await reply(`🚀 *Processing TheNkiri File...* \nUploading document. Please wait!`);

            const cleanFileName = `${(session.movieTitle || "Movie").replace(/[^a-zA-Z0-9 ]/g, "_")}.mp4`;

            let finalCaption = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            finalCaption += `┃ 🎬 *${session.movieTitle}* \n`;
            finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
            finalCaption += `┃ 📦 *Size:* ${session.movieSize || 'N/A'}\n`;
            finalCaption += `┃ 🎥 *Quality:* ${session.movieQuality || 'HD'}\n`;
            finalCaption += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
            finalCaption += `> *© ${AUTHOR} ッ*`;

            const thumbBuffer = await getThumbnailBuffer(session.posterImg);
            let documentPayload = {
                document: { url: downloadUrl },
                mimetype: "video/mp4",
                fileName: cleanFileName,
                caption: finalCaption
            };

            if (thumbBuffer && Buffer.isBuffer(thumbBuffer)) {
                documentPayload.jpegThumbnail = thumbBuffer;
            }

            await conn.sendMessage(from, documentPayload, { quoted: mek });
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            delete nkiriSessions[from];
            return;
        }

        // STEP 1: Handle Movie Selection from Search List
        if (nkiriSessions[from] && nkiriSessions[from].step === 'movie' && /^\d+$/.test(q)) {
            const session = nkiriSessions[from];
            const movieIndex = parseInt(q) - 1;
            const results = session.results;

            if (movieIndex < 0 || movieIndex >= results.length) {
                return reply("❌ Ghalat number select kiya hai! Baraye meharbani list mein se sahi movie number bhejein.");
            }

            const selected = results[movieIndex];
            await react("⏳");

            const detailsApiUrl = `https://vajiraofc-apis.vercel.app/api/thenkiri/details`;
            const detailResponse = await axios.get(detailsApiUrl, {
                params: { apikey: API_KEY, url: selected.url },
                timeout: 30000
            });

            if (detailResponse.status !== 200 || !detailResponse.data || !detailResponse.data.success) {
                await react("❌");
                return reply("❌ *Error:* Failed to pull details for this item.");
            }

            const movieDetails = detailResponse.data.data || {};
            const directUrl = movieDetails.directDownloadUrl;

            if (!directUrl) {
                await react("❌");
                return reply("❌ *Sorry:* No direct download link was located for this selection.");
            }

            nkiriSessions[from] = {
                step: 'quality',
                downloadUrl: directUrl,
                movieTitle: movieDetails.title || selected.title,
                movieSize: movieDetails.size || 'N/A',
                movieQuality: movieDetails.quality || 'HD',
                posterImg: movieDetails.imageUrl || selected.imageUrl
            };

            let cap = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            cap += `┃ 🎥 *${movieDetails.title || selected.title}*\n`;
            cap += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
            cap += `📋 *Genres:* \`${movieDetails.genres || 'N/A'}\`\n`;
            cap += `📅 *Year:* ${movieDetails.year || 'N/A'}\n`;
            cap += `📦 *Size:* ${movieDetails.size || 'N/A'}\n`;
            cap += `🎥 *Quality:* ${movieDetails.quality || 'HD'}\n\n`;
            cap += `┌───────── DOWNLOAD ─────────┐\n`;
            cap += `┃ 🔥 *[1]* Download Movie as Document\n`;
            cap += `└────────────────────────────┘\n\n`;
            cap += `⚡ *Reply with [1]* to start downloading.\n\n`;
            cap += `> *© ${AUTHOR} ッ*`;

            const detailImg = movieDetails.imageUrl || "https://placehold.co/600x400?text=No+Poster";
            await conn.sendMessage(from, { image: { url: detailImg }, caption: cap }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            return;
        }

        // NEW SEARCH REQUEST
        await react("🔍");
        await reply(`🔍 _Searching for *"${q}"* on TheNkiri servers..._`);

        const searchApiUrl = `https://vajiraofc-apis.vercel.app/api/thenkiri/search`;
        const response = await axios.get(searchApiUrl, {
            params: { apikey: API_KEY, q: q },
            timeout: 30000
        });

        if (response.status !== 200 || !response.data || !response.data.success) {
            await react("❌");
            return reply("🛸 *API Error:* Server responded with an invalid status.");
        }

        const results = response.data.results || [];
        if (results.length === 0) {
            await react("❌");
            return reply(`🛸 *No Results Found!*\nTheNkiri par *"${q}"* naam ki koi movie nahi mili.`);
        }

        const limit = Math.min(results.length, 5);
        nkiriSessions[from] = {
            step: 'movie',
            results: results.slice(0, limit)
        };

        let listText = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
        listText += `┃ 🎬  *THENKIRI SEARCH*  🎬 ┃\n`;
        listText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
        listText += `🔎 *Query:* \`${q.toUpperCase()}\`\n`;
        listText += `✨ *Results Found:* ${limit}\n\n`;
        listText += `┌─────────────────────┐\n`;

        for (let i = 0; i < limit; i++) {
            const v = results[i];
            const title = v.title || 'Unknown Title';
            listText += `┃ 🎥 *[${i + 1}]* _${title}_\n`;
            if (i !== limit - 1) listText += `┃─────────────────────┃\n`;
        }

        listText += `└─────────────────────┘\n\n`;
        listText += `⚡ *Reply with the item number* to view movie details.\n\n`;
        listText += `> *© ${AUTHOR} ッ*`;

        const firstImage = "https://placehold.co/600x400?text=TheNkiri+Movies";
        await conn.sendMessage(from, { image: { url: firstImage }, caption: listText }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("TheNkiri Downloader error:", e.message);
        await react("❌");
        return reply(`❌ *Error Processing Request:* ${e.message}`);
    }
});
