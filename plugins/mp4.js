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

const APIS = (url) => [
  `https://kiraxmd-api.vercel.app/api/play?query=${encodeURIComponent(url)}`,
  `https://xenoytdl-2.vercel.app/api/youtube?url=${encodeURIComponent(url)}`,
  `https://jerrycoder.oggyapi.workers.dev/down/ytmp3-v1?url=${encodeURIComponent(url)}`,
  `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(url)}`,
  `https://eliteprotech-apis.zone.id/ytdown?format=mp3&url=${encodeURIComponent(url)}`,
];

async function resolveAudioUrl(youtubeUrl) {
  for (const api of APIS(youtubeUrl)) {
    try {
      const res = await axios.get(api, { timeout: 40_000, validateStatus: () => true });
      const data = res.data;

      const candidate =
        data?.result?.mp3 ||
        data?.data?.dl ||
        data?.data?.download ||
        data?.download ||
        data?.url ||
        data?.result?.download_url ||
        data?.result?.audio ||
        data?.result?.url ||
        (typeof data?.result === "string" ? data.result : null);

      if (!candidate || typeof candidate !== "string" || !candidate.startsWith("http")) continue;

      try {
        const test = await axios.get(candidate, {
          responseType: "stream",
          timeout: 15_000,
          maxRedirects: 10,
          validateStatus: () => true,
          headers: { "User-Agent": "Mozilla/5.0" },
        });

        if (test.status === 200 || test.status === 206) {
          try { test.data.destroy(); } catch {}
          return candidate;
        }
        try { test.data.destroy(); } catch {}
      } catch {}
    } catch {}
  }
  return null;
}

// ─── Core Handler ─────────────────────────────────────────────────────────────

async function handleSong(conn, mek, m, from, input, reply) {
  await conn.sendMessage(from, { react: { text: "⬇️", key: mek.key } });
  let url = input;
  let songInfo = null;

  const id = extractVideoId(input);
  if (id) {
    url = `https://www.youtube.com/watch?v=${id}`;
    try {
      const info = await yts({ videoId: id });
      if (info) songInfo = info;
    } catch {}
  } else {
    const search = await yts(input);
    if (!search?.videos?.length) throw new Error("No results found on YouTube.");
    songInfo = search.videos[0];
    url = songInfo.url;
  }

  const title = songInfo?.title || "Unknown Song";
  const author = songInfo?.author?.name || "Unknown Artist";
  const thumbnail = songInfo?.thumbnail || songInfo?.image || "";

  const audioUrl = await resolveAudioUrl(url);
  if (!audioUrl) throw new Error("Could not extract audio URL right now. Please try again later.");

  await conn.sendMessage(
    from,
    {
      audio: { url: audioUrl },
      mimetype: "audio/mpeg",
      ptt: false, // Voice note / recording format
      fileName: `${title}.mp3`,
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
  await conn.sendMessage(from, { react: { text: "🎵", key: mek.key } });
}

// ─── Commands Register ────────────────────────────────────────────────────────

const commands = ["song", "play", "yta", "ytmp3"];

for (const cmdName of commands) {
  cmd({
    pattern: cmdName,
    alias: [cmdName === "play6" ? "audio" : "yt"],
    desc: "Search & download audio from YouTube as Voice Note",
    category: "downloader",
    react: "🎶",
    filename: __filename
  }, async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    try {
      if (!text || !text.trim()) {
        return reply(`_Usage: ${usedPrefix + command} <song name or YouTube URL>_`);
      }
      await handleSong(conn, mek, m, from, text.trim(), reply);
    } catch (err) {
      console.error(`[${command.toUpperCase()}]`, err?.message || err);
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply(`❌ _*Download Failed*_ : \n\n⚠️ ${err?.message || "An unexpected error occurred."}`);
    }
  });
}
