// plugins/song.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

async function handleSong(input, client, message, from) {
  await client.sendMessage(from, { react: { text: "⬇️", key: message.key } });
  
  const apiUrl = `https://api.azbry.com/api/download/ytplay2?q=${encodeURIComponent(input)}`;
  const res = await axios.get(apiUrl, { timeout: 40_000, validateStatus: () => true }).catch(() => null);

  if (!res || !res.data || !res.data.status || !res.data.result || !res.data.result.download) {
    throw new Error("Audio download link extract nahi ho saka. Baraye meharbaani dobarah koshish karein.");
  }

  const songData = res.data.result;
  const title = songData.title || "Unknown Song";
  const author = songData.channel || "Unknown Artist";
  const thumbnail = songData.thumbnail || "";
  const audioUrl = songData.download;
  const url = songData.url || `https://www.youtube.com/watch?v=${songData.videoId}`;

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

for (const [commandName, description] of [
  ["song17", "Search & download audio from YouTube"],
  ["play17", "Search & play audio from YouTube"],
  ["yta17", "YouTube audio downloader"],
  ["ytmp3", "YouTube MP3 downloader"],
]) {
  cmd({
    pattern: commandName,
    alias: commandName === "song17" ? ["ytplay", "audio", "play17"] : [],
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
