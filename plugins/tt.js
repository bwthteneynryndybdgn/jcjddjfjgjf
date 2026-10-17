import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

const UA = "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/138 Mobile Safari/537.36";

function cleanYoutubeUrl(value) {
  try {
    const u = new URL(String(value).trim());
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (!/^(youtube\.com|m\.youtube\.com|youtu\.be)$/.test(host)) return "";
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/watch?v=${encodeURIComponent(id)}` : "";
    }
    if (u.pathname === "/watch" && u.searchParams.get("v")) {
      return `https://www.youtube.com/watch?v=${encodeURIComponent(u.searchParams.get("v"))}`;
    }
    if (u.pathname.startsWith("/shorts/")) {
      const id = u.pathname.split("/").filter(Boolean)[1];
      return id ? `https://www.youtube.com/watch?v=${encodeURIComponent(id)}` : "";
    }
    return "";
  } catch {
    return "";
  }
}

function isYoutubeUrl(value) {
  return !!cleanYoutubeUrl(value);
}

function textOf(node) {
  if (typeof node === "string") return node;
  if (!node || typeof node !== "object") return "";
  if (typeof node.simpleText === "string") return node.simpleText;
  if (Array.isArray(node.runs)) return node.runs.map(x => x?.text || "").join("");
  return "";
}

async function searchYoutube(query) {
  const endpoint = "https://www.youtube.com/youtubei/v1/search?prettyPrint=false";
  const body = {
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20260904.01.00",
        hl: "id",
        gl: "ID",
      },
    },
    query: String(query).trim(),
  };

  const { data } = await axios.post(endpoint, body, {
    timeout: 25000,
    headers: {
      "user-agent": UA,
      accept: "application/json",
      "content-type": "application/json",
      origin: "https://www.youtube.com",
      referer: "https://www.youtube.com/",
    },
  });

  const hits = [];
  const seen = new Set();
  const walk = node => {
    if (!node || typeof node !== "object" || hits.length >= 8) return;
    const v = node.videoRenderer;
    if (v?.videoId && !seen.has(v.videoId)) {
      seen.add(v.videoId);
      hits.push({
        id: v.videoId,
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
        title: textOf(v.title) || "YouTube Video",
        channel: textOf(v.ownerText) || textOf(v.longBylineText) || "YouTube",
        thumb: v.thumbnail?.thumbnails?.at(-1)?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        duration: textOf(v.lengthText) || "",
      });
    }
    for (const value of Object.values(node)) walk(value);
  };
  walk(data);

  if (!hits.length) throw new Error("Video YouTube tidak ditemukan");
  return hits[0];
}

async function getOembed(url) {
  try {
    const { data } = await axios.get("https://www.youtube.com/oembed", {
      params: { url, format: "json" },
      timeout: 10000,
      headers: { "user-agent": UA },
    });
    return {
      title: data?.title || "YouTube Video",
      channel: data?.author_name || "YouTube",
      thumb: data?.thumbnail_url || "",
    };
  } catch {
    return null;
  }
}

function youtubeId(value) {
  try {
    const u = new URL(String(value).trim());
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.split("/").filter(Boolean)[0] || "";
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "shorts" || parts[0] === "embed") return parts[1] || "";
    }
  } catch {}
  return "";
}

function qualityNumber(value) {
  const m = String(value || "").match(/(\d{3,4})p/i);
  return m ? Number(m[1]) : 0;
}

async function getPlayableStream(youtubeUrl) {
  const id = youtubeId(youtubeUrl);
  if (!id) return null;

  const pipedInstances = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
  ];

  for (const base of pipedInstances) {
    try {
      const { data } = await axios.get(`${base}/streams/${encodeURIComponent(id)}`, {
        timeout: 12000,
        headers: { "user-agent": UA, accept: "application/json" },
      });

      const streams = Array.isArray(data?.videoStreams) ? data.videoStreams : [];
      const candidates = streams
        .filter(x => x?.url && x?.videoOnly === false && /^video\/mp4(?:;|$)/i.test(String(x?.mimeType || "")))
        .sort((a, b) => qualityNumber(b.quality) - qualityNumber(a.quality));

      if (candidates[0]?.url) {
        return {
          url: candidates[0].url,
          mime: String(candidates[0].mimeType || "video/mp4").split(";")[0],
          duration: Number(data?.duration) > 0 ? Number(data.duration) : 0,
        };
      }
    } catch (e) {
      console.warn(`[YTPLAY] Piped resolver failed (${base}):`, e?.message || e);
    }
  }
  return null;
}

cmd({
    pattern: "yteplay",
    alias: ["ytp"],
    use: '.ytplay <judul/link>',
    desc: "Search and play YouTube video with direct streaming links",
    category: "downloader",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, text, reply }) => {
    try {
        const query = String(text || "").trim();
        if (!query) {
            return reply(`⚠️ *YT PLAY*\n\nUsage:\n• .ytplay <judul>\n• .ytplay <youtube link>`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let meta;
        if (isYoutubeUrl(query)) {
            const url = cleanYoutubeUrl(query);
            meta = { url, title: "YouTube Video", channel: "YouTube", thumb: "" };
            const o = await getOembed(url);
            if (o) Object.assign(meta, o);
        } else {
            meta = await searchYoutube(query);
        }

        if (!meta?.url) throw new Error("Video YouTube tidak ditemukan");

        const stream = await getPlayableStream(meta.url);

        let caption = `> *KAMRAN-MD YOUTUBE PLAYER* 🎬\n\n`;
        caption += `📌 *Title:* ${meta.title || "YouTube Video"}\n`;
        caption += `👤 *Channel:* ${meta.channel || "YouTube"}\n`;
        if (meta.duration) caption += `⏱️ *Duration:* ${meta.duration}\n`;
        caption += `🔗 *Watch Link:* ${meta.url}\n\n`;
        
        if (stream && stream.url) {
            caption += `📥 *Direct Download Link:* ${stream.url}\n\n`;
            caption += `_Aap upar diye gaye link se video direct play ya download kar sakte hain!_`;
        } else {
            caption += `_Direct stream filhal dastiyab nahi hai, aap YouTube link par click karke dekh sakte hain._`;
        }

        if (meta.thumb) {
            await conn.sendMessage(from, { 
                image: { url: meta.thumb }, 
                caption: caption 
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { text: caption }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (e) {
        console.error("[YTPLAY]", e?.stack || e?.message || e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`❌ *YT PLAY ERROR*\n\n${e?.message || "Gagal memproses video."}`);
    }
});
