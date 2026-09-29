import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from "axios";
import yts from "yt-search";

const __filename = fileURLToPath(import.meta.url);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractVideoId(input) {
  const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  const watchMatch = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  return null;
}

async function resolveVideoUrl(youtubeUrl) {
  const apiUrl = `https://jerrycoder.oggyapi.workers.dev/down/ytmp4-v1?url=${encodeURIComponent(youtubeUrl)}`;
  try {
    const res = await axios.get(apiUrl, { timeout: 45_000, validateStatus: () => true });
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
    console.error("[YTMP4 API ERROR]", err);
  }
  return null;
}

// ─── Core Handler (As Document Only) ──────────────────────────────────────────

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
    if (!search?.videos?.length) throw new Error("No results found on YouTube.");
    videoInfo = search.videos[0];
    url = videoInfo.url;
  }

  const title = videoInfo?.title || "YouTube_Video";
  const safeTitle = title.replace(/[\\/:*?"<>|]/g, "").trim();

  const videoUrl = await resolveVideoUrl(url);
  if (!videoUrl) throw new Error("Could not extract video download URL right now. Please try again later.");

  await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

  // Download video as buffer so it can be sent strictly as a document
  const videoStream = await axios.get(videoUrl, {
    responseType: "arraybuffer",
    timeout: 120_000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const buffer = Buffer.from(videoStream.data);

  // Send purely as a document file
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

  await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
}

// ─── Commands Register ────────────────────────────────────────────────────────

const commands = ["ytmp4", "video65", "mv", "ytvideo"];

for (const cmdName of commands) {
  cmd({
    pattern: cmdName,
    alias: [cmdName === "video" ? "vid" : "mp4"],
    desc: "Download large/small YouTube videos strictly as a Document",
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
      reply(`❌ _*Download Failed*_ : \n\n⚠️ ${err?.message || "An unexpected error occurred."}`);
    }
  });
}
