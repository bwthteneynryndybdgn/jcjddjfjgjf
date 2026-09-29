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

const VIDEO_APIS = (url) => [
  `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(url)}`,
  `https://jerrycoder.oggyapi.workers.dev/down/ytmp4-v1?url=${encodeURIComponent(url)}`,
  `https://eliteprotech-apis.zone.id/ytdown?format=mp4&url=${encodeURIComponent(url)}`,
  `https://xenoytdl-2.vercel.app/api/youtube?url=${encodeURIComponent(url)}`,
];

async function resolveVideoUrl(youtubeUrl) {
  for (const api of VIDEO_APIS(youtubeUrl)) {
    try {
      const res = await axios.get(api, { timeout: 45_000, validateStatus: () => true });
      const data = res.data;

      const candidate =
        data?.result?.mp4 ||
        data?.data?.dl ||
        data?.data?.download ||
        data?.download ||
        data?.url ||
        data?.result?.download_url ||
        data?.result?.video ||
        data?.result?.url ||
        (typeof data?.result === "string" ? data.result : null);

      if (candidate && typeof candidate === "string" && candidate.startsWith("http")) {
        return candidate;
      }
    } catch (err) {
      console.error("[VIDEO API ERROR]", api, err?.message);
    }
  }
  return null;
}

async function handleVideoDocument(conn, mek, m, from, input, reply) {
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
    if (!search?.videos?.length) throw new Error("No results found on YouTube for your search.");
    videoInfo = search.videos[0];
    url = videoInfo.url;
  }

  const title = videoInfo?.title || "YouTube_Video";
  const safeTitle = title.replace(/[\\/:*?"<>|]/g, "").trim();

  const videoDownloadUrl = await resolveVideoUrl(url);
  if (!videoDownloadUrl) throw new Error("Could not extract a download URL from available APIs. Try using a direct YouTube link.");

  await conn.sendMessage(from, { react: { text: "📤", key: mek.key } });

  try {
    // Buffer stream download to bypass CDN restrictions and send safely as document
    const videoStream = await axios.get(videoDownloadUrl, {
      responseType: "arraybuffer",
      timeout: 180_000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const buffer = Buffer.from(videoStream.data);

    await conn.sendMessage(
      from,
      {
        document: buffer,
        mimetype: "video/mp4",
        fileName: `${safeTitle}.mp4`,
        caption: `🎥 *${title}*\n✨ *Sent as Document (KAMRAN-MD)*`
      },
      { quoted: mek }
    );
  } catch (downloadErr) {
    // Fallback: If buffer download fails due to size/network, try sending via direct URL stream
    await conn.sendMessage(
      from,
      {
        document: { url: videoDownloadUrl },
        mimetype: "video/mp4",
        fileName: `${safeTitle}.mp4`,
        caption: `🎥 *${title}*\n✨ *Sent as Document (KAMRAN-MD)*`
      },
      { quoted: mek }
    );
  }

  await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
}

const commands = ["ytmp4", "video2", "mv", "ytvideo", "video3"];

for (const cmdName of commands) {
  cmd({
    pattern: cmdName,
    alias: [cmdName === "video" ? "vid" : "mp4"],
    desc: "Download YouTube videos strictly as a Document",
    category: "downloader",
    react: "🎬",
    filename: __filename
  }, async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    try {
      if (!text || !text.trim()) {
        return reply(`_Usage: ${usedPrefix + command} <query or YouTube URL>_`);
      }
      await handleVideoDocument(conn, mek, m, from, text.trim(), reply);
    } catch (err) {
      console.error(`[${command.toUpperCase()}]`, err?.message || err);
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply(`❌ _*Download Failed*_ : \n\n⚠️️ ${err?.message || "An unexpected error occurred."}`);
    }
  });
}
