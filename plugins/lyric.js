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

  // NexRay API integration
  const apiUrl = `https://api.nexray.eu.cc/downloader/v1/ytmp4?url=${encodeURIComponent(url)}&resolusi=1080`;
  const res = await axios.get(apiUrl, { timeout: 40_000, validateStatus: () => true }).catch(() => null);

  if (!res || !res.data) {
    throw new Error("Video download API response nahi de rahi.");
  }

  const data = res.data;
  const videoUrl = 
    data?.result?.url || 
    data?.result?.download || 
    data?.result?.mp4 || 
    data?.url || 
    data?.download;

  if (!videoUrl || typeof videoUrl !== "string" || !videoUrl.startsWith("http")) {
    throw new Error("Video URL extract nahi ho saka.");
  }

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
  ["video86", "YouTube se video search aur download karein"],
  ["ytmp4", "YouTube MP4 downloader"],
  ["ytv", "YouTube video downloader"],
  ["mv", "YouTube se music video download karein"],
]) {
  cmd({
    pattern: commandName,
    alias: commandName === "video86" ? ["ytvideo", "mp4"] : [],
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
