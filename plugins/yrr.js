// plugins/video.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import yts from 'yt-search';

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
  `https://api.nexray.eu.cc/downloader/v1/ytmp4?url=${encodeURIComponent(url)}`,
  `https://jerrycoder.oggyapi.workers.dev/down/ytmp4-v1?url=${encodeURIComponent(url)}`
];

async function resolveVideoUrl(youtubeUrl) {
  for (const api of VIDEO_APIS(youtubeUrl)) {
    try {
      const res = await axios.get(api, { timeout: 40_000, validateStatus: () => true });
      const data = res.data;

      const candidate =
        data?.result?.dl ||
        data?.result?.url ||
        data?.result?.mp4 ||
        data?.data?.dl ||
        data?.data?.download ||
        data?.download ||
        data?.url ||
        data?.result?.download_url ||
        data?.result?.video ||
        (typeof data?.result === "string" ? data.result : null);

      if (!candidate || typeof candidate !== "string" || !candidate.startsWith("http")) continue;

      try {
        const test = await axios.get(candidate, {
          responseType: "stream",
          timeout: 15_000,
          maxRedirects: 10,
          validateStatus: (status) => status === 200 || status === 206,
          headers: { "User-Agent": "Mozilla/5.0" },
        });

        const contentType = test.headers['content-type'] || "";
        if (contentType.includes("html") || contentType.includes("text")) {
          try { test.data.destroy(); } catch {}
          continue;
        }

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

async function handleVideo(input, client, message, from) {
  await client.sendMessage(from, { react: { text: "⬇️", key: message.key } });
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
    // Yahan query ko saaf kiya gaya hai taake lambi text likhne par bhi search bilkul thek chale
    const cleanQuery = input.replace(/^[a-zA-Z0-9]+\s+/, "").trim() || input;
    const search = await yts(cleanQuery);
    const videos = search?.videos || search?.all || [];
    if (!videos.length) throw new Error("YouTube par koi result nahi mila.");
    
    videoInfo = videos[0];
    const vid = videoInfo.videoId || extractVideoId(videoInfo.url);
    if (!vid) throw new Error("Video ID extract nahi ho saki.");
    
    url = `https://www.youtube.com/watch?v=${vid}`;
  }

  const title = videoInfo?.title || "Unknown Video";
  const duration = videoInfo?.duration?.timestamp || videoInfo?.timestamp || "";

  const videoUrl = await resolveVideoUrl(url);
  if (!videoUrl) throw new Error("Filhal video URL extract nahi ho saka. Baraye meharbaani thori der baad koshish karein.");

  await client.sendMessage(
    from,
    {
      video: { url: videoUrl },
      mimetype: "video/mp4",
      fileName: `${title.replace(/[^\w\s-]/g, '')}.mp4`,
      caption: `*🎬 YouTube Video Downloader*\n\n*Title:* ${title}\n*Duration:* ${duration}\n*Link:* ${url}`,
    },
    { quoted: message }
  );
  await client.sendMessage(from, { react: { text: "✅", key: message.key } });
}

for (const [commandName, description] of [
  ["video5", "YouTube se video search aur download karein"],
  ["ytmp4", "YouTube MP4 downloader"],
  ["ytv", "YouTube video downloader"],
  ["mv", "YouTube se music video download karein"],
]) {
  cmd({
    pattern: commandName,
    alias: commandName === "video5" ? ["ytvideo", "mp4"] : [],
    react: '🎥',
    desc: description,
    category: "downloader",
    filename: __filename
  }, async (client, message, m, { from, q, prefix, command }) => {
    if (!q) {
      return await client.sendMessage(from, { text: `_Istemaal ka tareeqa: .${command} <video ka naam ya YouTube link>_` }, { quoted: message });
    }

    try {
      await handleVideo(q.trim(), client, message, from);
    } catch (err) {
      console.error(`[${command.toUpperCase()}]`, err?.message || err);
      await client.sendMessage(from, { text: `❌ _*Download Fail Ho Gaya*_ : \n\n⚠️ ${err?.message || "Koi unexpected error aa gaya hai."}` }, { quoted: message });
    }
  });
}
