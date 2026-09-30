import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from "axios";
import yts from "yt-search";

const __filename = fileURLToPath(import.meta.url);

function extractVideoId(input) {
  const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const watchMatch = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  return null;
}

async function fetchXenoApi(youtubeUrl, format) {
  const apiUrl = `https://xenoytdl-2.vercel.app/api/youtube?url=${encodeURIComponent(youtubeUrl)}&format=${format}&upload=false`;
  const res = await axios.get(apiUrl, { timeout: 45_000, validateStatus: () => true });
  return res.data;
}

async function handleDownload(conn, mek, m, from, input, format, reply) {
  await conn.sendMessage(from, { react: { text: "⬇️", key: mek.key } });
  let url = input;
  let videoInfo = null;

  const id = extractVideoId(input);
  if (id) {
    url = `https://www.youtube.com/watch?v=${id}`;
    try {
      const info = await yts({ videoId: id });
      if (info) videoInfo = info;
    } catch {}
  } else {
    const search = await yts(input);
    if (!search?.videos?.length) throw new Error("No results found on YouTube.");
    videoInfo = search.videos[0];
    url = videoInfo.url;
  }

  const title = videoInfo?.title || "Media_File";
  const safeTitle = title.replace(/[\\/:*?"<>|]/g, "").trim();
  const thumbnail = videoInfo?.thumbnail || videoInfo?.image || "";
  const author = videoInfo?.author?.name || "Unknown";

  const apiData = await fetchXenoApi(url, format);
  
  const downloadUrl = 
    apiData?.result?.download_url || 
    apiData?.result?.url || 
    apiData?.download || 
    apiData?.url || 
    (typeof apiData?.result === "string" ? apiData.result : null);

  if (!downloadUrl) {
    throw new Error("Could not extract download URL from Xeno API.");
  }

  await conn.sendMessage(from, { react: { text: "📤", key: mek.key } });

  if (format === 'mp3') {
    await conn.sendMessage(
      from,
      {
        audio: { url: downloadUrl },
        mimetype: "audio/mpeg",
        ptt: true, // Voice note format
        fileName: `${safeTitle}.mp3`,
        contextInfo: {
          externalAdReply: {
            title,
            body: author,
            mediaType: 2,
            thumbnailUrl: thumbnail,
            sourceUrl: url,
            renderLargerThumbnail: true,
            showAdAttribution: false,
          },
        },
      },
      { quoted: mek }
    );
  } else {
    // Send video strictly as Document
    await conn.sendMessage(
      from,
      {
        document: { url: downloadUrl },
        mimetype: "video/mp4",
        fileName: `${safeTitle}.mp4`,
        caption: `🎥 *${title}*\n✨ *Sent as Document (KAMRAN-MD)*`
      },
      { quoted: mek }
    );
  }

  await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
}

// ─── Commands Register ────────────────────────────────____________________

cmd({
  pattern: "song65",
  alias: ["play5", "yta5", "ytmp3"],
  desc: "Download YouTube audio as Voice Note using Xeno API",
  category: "downloader",
  react: "🎵",
  filename: __filename
}, async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
  try {
    if (!text || !text.trim()) return reply(`_Usage: ${usedPrefix + command} <song name or URL>_`);
    await handleDownload(conn, mek, m, from, text.trim(), 'mp3', reply);
  } catch (err) {
    console.error(`[SONG ERROR]`, err);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    reply(`❌ _*Download Failed*_ : \n\n⚠️ ${err?.message || err}`);
  }
});

cmd({
  pattern: "video75",
  alias: ["ytmp454", "mv65", "video3"],
  desc: "Download YouTube video as Document using Xeno API",
  category: "downloader",
  react: "🎬",
  filename: __filename
}, async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
  try {
    if (!text || !text.trim()) return reply(`_Usage: ${usedPrefix + command} <video name or URL>_`);
    await handleDownload(conn, mek, m, from, text.trim(), 'mp4', reply);
  } catch (err) {
    console.error(`[VIDEO ERROR]`, err);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    reply(`❌ _*Download Failed*_ : \n\n⚠️ ${err?.message || err}`);
  }
});
