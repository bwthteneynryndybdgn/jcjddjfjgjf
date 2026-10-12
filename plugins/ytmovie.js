// plugins/downloader.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';
import yts from 'yt-search';
import { File } from 'megajs';
import fs from 'fs';
import path from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);

// ─── YouTube Song Helpers ────────────────────────────────────────────────────

function extractVideoId(input) {
  const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  const watchMatch = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  return null;
}

const APIS = (url) => [
  `https://api.nexray.eu.cc/downloader/v1/ytmp3?url=${encodeURIComponent(url)}`,
  `https://kiraxmd-api.vercel.app/api/play?query=${encodeURIComponent(url)}`,
  `https://xenoytdl-2.vercel.app/api/youtube?url=${encodeURIComponent(url)}`,
  `https://jerrycoder.oggyapi.workers.dev/down/ytmp3-v1?url=${encodeURIComponent(url)}`,
  `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(url)}`,
];

async function resolveAudioUrl(youtubeUrl) {
  for (const api of APIS(youtubeUrl)) {
    try {
      const res = await axios.get(api, { timeout: 40_000, validateStatus: () => true });
      const data = res.data;

      const candidate =
        data?.result?.url ||
        data?.result?.mp3 ||
        data?.data?.dl ||
        data?.data?.download ||
        data?.download ||
        data?.url ||
        data?.result?.download_url ||
        data?.result?.audio ||
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

async function handleSong(input, client, message, from) {
  await client.sendMessage(from, { react: { text: "⬇️", key: message.key } });
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
  const duration = songInfo?.duration?.timestamp || "";
  const thumbnail = songInfo?.thumbnail || songInfo?.image || "";

  const audioUrl = await resolveAudioUrl(url);
  if (!audioUrl) throw new Error("Could not extract audio URL right now. Please try again later.");

  // Send Audio with externalAdReply preview card
  await client.sendMessage(
    from,
    {
      audio: { url: audioUrl },
      mimetype: "audio/mpeg",
      ptt: false,
      fileName: `${title.replace(/[^\w\s-]/g, '')}.mp3`,
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
    { quoted: message }
  );
  await client.sendMessage(from, { react: { text: "🎵", key: message.key } });
}

// ─── 1. YouTube Song Commands ───────────────────────────────────────────────

for (const [commandName, description] of [
  ["song15", "Search & download audio from YouTube"],
  ["play15", "Search & play audio from YouTube"],
  ["yta", "YouTube audio downloader"],
  ["ytmp3", "YouTube MP3 downloader"],
]) {
  cmd({
    pattern: commandName,
    alias: commandName === "song15" ? ["ytplay15", "audio15", "plays15"] : [],
    react: '🎵',
    desc: description,
    category: "downloader",
    filename: __filename
  }, async (client, message, m, { from, q, prefix, command }) => {
    if (!q) {
      return await client.sendMessage(from, { text: `_Usage: .${command} <song name or YouTube URL>_` }, { quoted: message });
    }

    try {
      await handleSong(q.trim(), client, message, from);
    } catch (err) {
      console.error(`[${command.toUpperCase()}]`, err?.message || err);
      await client.sendMessage(from, { text: `❌ _*Download Failed*_ : \n\n⚠️ ${err?.message || "An unexpected error occurred."}` }, { quoted: message });
    }
  });
}

// ─── 2. YouTube Search Command (.yts) ───────────────────────────────────────

cmd({
  pattern: "yts2",
  alias: ["ytsearch2"],
  react: '🔍',
  desc: "Search YouTube videos",
  category: "search",
  filename: __filename
}, async (client, message, m, { from, q }) => {
  if (!q) return await client.sendMessage(from, { text: "Please provide a search query" }, { quoted: message });
  
  try {
    const res = await yts(q, { pages: 1 });
    const results = res && res.videos
      ? res.videos.map((v) => ({
          id: v.videoId,
          title: v.title,
          url: v.url,
          thumbnail: v.thumbnail,
          channel: v.author && v.author.name,
          publishedAt: v.ago,
        }))
      : [];

    if (!results.length) return await client.sendMessage(from, { text: "❌ No results found" }, { quoted: message });
    
    let replyText = `*YouTube results for "${q}":*\n\n`;
    results.forEach((v, i) => {
      replyText += `⬢ ${i + 1}. ${v.title}\n   Channel: ${v.channel || ""}\n   Published: ${v.publishedAt || ""}\n   Link: ${v.url}\n\n`;
    });

    await client.sendMessage(from, { image: { url: results[0].thumbnail }, caption: replyText }, { quoted: message });
  } catch (e) {
    await client.sendMessage(from, { text: "❌ Search failed." }, { quoted: message });
  }
});

// ─── 3. GitClone Command ────────────────────────────────────────────────────

cmd({
  pattern: "gitclone2",
  alias: ["githubdl2"],
  react: '📦',
  desc: "Download GitHub repository as zip",
  category: "downloader",
  filename: __filename
}, async (client, message, m, { from, q }) => {
  if (!q) return await client.sendMessage(from, { text: "❌ Provide a GitHub link.\n\nExample:\n.gitclone https://github.com/username/repository" }, { quoted: message });
  
  try {
    const link = q.split(/\s+/)[0];
    const regex = /github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?/i;
    const match = link.match(regex);
    if (!match) return await client.sendMessage(from, { text: "⚠️ Invalid GitHub repository format." }, { quoted: message });
    
    const [, username, repo] = match;
    const zipUrl = `https://api.github.com/repos/${username}/${repo}/zipball`;
    
    const head = await fetch(zipUrl, { method: "HEAD" });
    if (!head.ok) return await client.sendMessage(from, { text: "Repository not found or private." }, { quoted: message });
    
    const filename = `${repo}.zip`;
    await client.sendMessage(
      from,
      {
        document: { url: zipUrl },
        fileName: filename,
        mimetype: "application/zip",
        caption: `GitHub: ${username}/${repo}`,
      },
      { quoted: message }
    );
    await client.sendMessage(from, { react: { text: "✅", key: message.key } });
  } catch (err) {
    console.error("GitClone Error:", err);
    await client.sendMessage(from, { react: { text: "❌", key: message.key } });
    await client.sendMessage(from, { text: "❌ Failed to download repository. Please try again later." }, { quoted: message });
  }
});

// ─── 4. APK Downloader Command ──────────────────────────────────────────────

cmd({
  pattern: "apk2",
  alias: ["appdl2"],
  react: '📱',
  desc: "Download APK files using NexOracle API",
  category: "downloader",
  filename: __filename
}, async (client, message, m, { from, q }) => {
  if (!q) return await client.sendMessage(from, { text: "*🏷️ Please provide an app name.*" }, { quoted: message });
  
  try {
    await client.sendMessage(from, { react: { text: "⏳", key: message.key } });
    const apiUrl = `https://api.nexoracle.com/downloader/apk`;
    const params = { apikey: "free_key@maher_apis", q };
    const res = await axios.get(apiUrl, { params }).catch(() => null);
    
    if (!res || !res.data || res.data.status !== 200 || !res.data.result) {
      await client.sendMessage(from, { react: { text: "❌", key: message.key } });
      return await client.sendMessage(from, { text: "❌ Unable to find the APK. Please try again later." }, { quoted: message });
    }
    
    const { name, lastup, package: pkg, size, icon, dllink } = res.data.result;
    
    await client.sendMessage(
      from,
      {
        image: { url: icon },
        caption: `\`「 APK DOWNLOADED 」\`\nName: ${name}\nUpdated: ${lastup}\nPackage: ${pkg}\nSize: ${size}\nSending APK...`,
      },
      { quoted: message }
    );
    
    const apkRes = await axios.get(dllink, { responseType: "arraybuffer" }).catch(() => null);
    if (!apkRes || !apkRes.data) {
      await client.sendMessage(from, { react: { text: "❌", key: message.key } });
      return await client.sendMessage(from, { text: "❌ Failed to download the APK." }, { quoted: message });
    }
    
    await client.sendMessage(
      from,
      {
        document: Buffer.from(apkRes.data),
        mimetype: "application/vnd.android.package-archive",
        fileName: `${name}.apk`,
        caption: "APK file",
      },
      { quoted: message }
    );
    await client.sendMessage(from, { react: { text: "✅", key: message.key } });
  } catch (err) {
    console.error("APK Error:", err);
    await client.sendMessage(from, { react: { text: "❌", key: message.key } });
    await client.sendMessage(from, { text: "❌ Unable to fetch APK details." }, { quoted: message });
  }
});

// ─── 5. Mega.nz Downloader Command ──────────────────────────────────────────

cmd({
  pattern: "mega",
  alias: ["megadl"],
  react: '☁️',
  desc: "Download files from Mega.nz",
  category: "downloader",
  filename: __filename
}, async (client, message, m, { from, q }) => {
  if (!q) return await client.sendMessage(from, { text: "❌ Please provide a Mega.nz link!" }, { quoted: message });
  
  try {
    await client.sendMessage(from, { react: { text: "⏳", key: message.key } });
    const file = File.fromURL(q);
    const data = await new Promise((resolve, reject) =>
      file.download((err, data) => (err ? reject(err) : resolve(data)))
    );
    
    const fileName = file.name || `mega_file_${Date.now()}`;
    const savePath = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(savePath, data);
    
    await client.sendMessage(
      from,
      {
        document: fs.readFileSync(savePath),
        fileName,
        mimetype: "application/octet-stream",
        caption: `Downloaded from Mega.nz: ${fileName}`,
      },
      { quoted: message }
    );
    
    fs.unlinkSync(savePath);
    await client.sendMessage(from, { react: { text: "✅", key: message.key } });
  } catch (err) {
    console.error("MegaDL Error:", err);
    await client.sendMessage(from, { react: { text: "❌", key: message.key } });
    await client.sendMessage(from, { text: "❌ Failed to download from Mega.nz." }, { quoted: message });
  }
});
