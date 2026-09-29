import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

/**
 * Extract YouTube Video ID from URL or Short Link
 */
function extractVideoId(url) {
  if (!url) return null;
  let match = null;
  if (url.includes("youtube.com/shorts/") || url.includes("youtu.be/")) {
    match = /\/([a-zA-Z0-9\-_]{11})/.exec(url);
  } else if (url.includes("youtube.com")) {
    match = /v=([a-zA-Z0-9\-_]{11})/.exec(url);
  } else {
    match = /[a-zA-Z0-9\-_]{11}/.exec(url);
  }
  return match ? match[1] : null;
}

/**
 * Main Scraping Function for YTMP3 Mobi API
 */
async function scrapeYtmp3(youtubeUrl, format = 'mp3') {
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) {
    throw new Error('غلط یوٹیوب لنک! ویڈیو ID ایکسٹریکٹ نہیں ہو سکی۔');
  }

  const lowerFormat = format.toLowerCase();
  if (lowerFormat !== 'mp3' && lowerFormat !== 'mp4') {
    throw new Error('غلط فارمیٹ! صرف "mp3" یا "mp4" کی اجازت ہے۔');
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://id.ytmp3.mobi',
    'Referer': 'https://id.ytmp3.mobi/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site'
  };

  // 1. Initialize session
  const initUrl = `https://a.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Math.random()}`;
  const initRes = await fetch(initUrl, { headers });
  if (!initRes.ok) throw new Error(`Init request failed: ${initRes.status}`);
  const initJson = await initRes.json();
  if (initJson.error > 0) throw new Error(`Init API Error: ${initJson.error}`);

  // 2. Request conversion
  let convertUrl = initJson.convertURL;
  let convertRequestUrl = `${convertUrl}&v=${videoId}&f=${lowerFormat}&_=${Math.random()}`;
  let convertJson;

  while (true) {
    const convertRes = await fetch(convertRequestUrl, { headers });
    if (!convertRes.ok) throw new Error(`Convert request failed: ${convertRes.status}`);
    convertJson = await convertRes.json();
    if (convertJson.error > 0) throw new Error(`Convert API Error: ${convertJson.error}`);

    if (convertJson.redirect > 0 && convertJson.redirectURL) {
      convertRequestUrl = `${convertJson.redirectURL}&v=${videoId}&f=${lowerFormat}&_=${Math.random()}`;
      continue;
    }
    break;
  }

  const progressUrl = convertJson.progressURL;
  const downloadUrl = convertJson.downloadURL;
  let title = convertJson.title || 'YouTube Content';

  if (!progressUrl) throw new Error('Progress URL نہیں ملا۔');

  // 3. Poll progress
  let progress = 0;
  let pollCount = 0;
  const maxPolls = 60;

  while (progress < 3 && pollCount < maxPolls) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    pollCount++;

    const progressRes = await fetch(progressUrl, { headers });
    if (!progressRes.ok) throw new Error(`Progress request failed: ${progressRes.status}`);
    const progressJson = await progressRes.json();
    if (progressJson.error > 0) throw new Error(`Progress API Error: ${progressJson.error}`);

    progress = progressJson.progress;
    if (progressJson.title) title = progressJson.title;
  }

  if (progress < 3) throw new Error('ڈاؤن لوڈ ٹائم آؤٹ ہو گیا (60 سیکنڈ سے زیادہ ہو گئے)۔');

  return {
    status: 'success',
    videoId,
    title,
    format: lowerFormat,
    downloadUrl
  };
}

// ==================== 1. MP3 / SONG COMMAND ====================
cmd({
    pattern: "song2",
    alias: ["ytmp32", "play2", "audio2"],
    react: "🎵",
    desc: "Download MP3 audio from YouTube URL",
    category: "download",
    use: ".song <YouTube URL>",
    filename: fileURLToPath(import.meta.url)
}, async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) {
            await react('❌');
            return reply("❌ *برائے مہربانی یوٹیوب کا لنک فراہم کریں!*\n\n*مثال:* `.song https://youtu.be/xxx`");
        }

        await reply("⏳ *آڈیو پروسیس کی جا رہی ہے، برائے مہربانی انتظار کریں...*");

        const data = await scrapeYtmp3(q, 'mp3');

        if (data.status !== 'success' || !data.downloadUrl) {
            throw new Error(data.message || 'ڈاؤن لوڈ لنک حاصل کرنے میں ناکامی۔');
        }

        await react('📥');

        // Send Audio File
        await conn.sendMessage(m.chat, {
            audio: { url: data.downloadUrl },
            mimetype: 'audio/mp4',
            fileName: `${data.title}.mp3`,
            caption: `🎵 *Title:* ${data.title}\n\n> *Powered By Bot*`
        }, { quoted: mek });

        await react('✅');

    } catch (error) {
        console.error("Song Download Error:", error);
        await react('❌');
        return reply(`❌ *خرابی:* ${error.message}`);
    }
});

// ==================== 2. MP4 / VIDEO COMMAND ====================
cmd({
    pattern: "video2",
    alias: ["ytmp42", "v2"],
    react: "🎬",
    desc: "Download MP4 video from YouTube URL",
    category: "download",
    use: ".video <YouTube URL>",
    filename: fileURLToPath(import.meta.url)
}, async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) {
            await react('❌');
            return reply("❌ *برائے مہربانی یوٹیوب کا لنک فراہم کریں!*\n\n*مثال:* `.video https://youtu.be/xxx`");
        }

        await reply("⏳ *ویڈیو ڈاؤن لوڈ اور پروسیس کی جا رہی ہے...*");

        const data = await scrapeYtmp3(q, 'mp4');

        if (data.status !== 'success' || !data.downloadUrl) {
            throw new Error(data.message || 'ڈاؤن لوڈ لنک حاصل کرنے میں ناکامی۔');
        }

        await react('📥');

        // Send Video File
        await conn.sendMessage(m.chat, {
            video: { url: data.downloadUrl },
            caption: `🎬 *Title:* ${data.title}\n\n> *Powered By Bot*`,
            mimetype: 'video/mp4'
        }, { quoted: mek });

        await react('✅');

    } catch (error) {
        console.error("Video Download Error:", error);
        await react('❌');
        return reply(`❌ *خرابی:* ${error.message}`);
    }
});
