import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

const searchSessions = new Map();

// ==================== FAST YOUTUBE SEARCH FUNCTION ====================
async function searchYoutube(query) {
  const url = 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false';
  const payload = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20240514.01.00',
        hl: 'en',
        gl: 'US',
      }
    },
    query: query
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': '2.20240514.01.00',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 7000
    });

    const data = response.data;
    const results = [];
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    
    if (contents && Array.isArray(contents)) {
      for (const section of contents) {
        const items = section.itemSectionRenderer?.contents || section.richGridRenderer?.contents;
        if (items && Array.isArray(items)) {
          for (const item of items) {
            const videoRenderer = item.videoRenderer || item.richItemRenderer?.content?.videoRenderer;
            if (videoRenderer && videoRenderer.videoId) {
              const videoId = videoRenderer.videoId;
              results.push({
                title: videoRenderer.title?.runs?.map(r => r.text).join('') || 'No Title',
                channel: videoRenderer.ownerText?.runs?.map(r => r.text).join('') || 'Unknown',
                views: videoRenderer.viewCountText?.simpleText || '0 views',
                duration: videoRenderer.lengthText?.simpleText || 'LIVE',
                url: `https://www.youtube.com/watch?v=${videoId}`,
                thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
              });
            }
          }
        }
      }
    }
    return results;
  } catch (error) {
    console.error('Search Error:', error.message);
    throw error;
  }
}

// ==================== FAST YMCDN SCRAPER FUNCTIONS ====================
function extractVideoId(url) {
    if (!url) return null;
    let match = null;
    
    if (url.includes('youtube.com/shorts/') || url.includes('youtu.be/')) {
        match = /\/([a-zA-Z0-9\-_]{11})/.exec(url);
    } else if (url.includes('youtube.com')) {
        match = /v=([a-zA-Z0-9\-_]{11})/.exec(url);
    } else {
        match = /[a-zA-Z0-9\-_]{11}/.exec(url);
    }
    
    return match ? match[1] : null;
}

async function scrapeYtmp3(youtubeUrl, format = 'mp4') {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
        throw new Error('Invalid YouTube URL: Could not extract video ID.');
    }
    
    const lowerFormat = format.toLowerCase();
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Origin': 'https://id.ytmp3.mobi',
        'Referer': 'https://id.ytmp3.mobi/'
    };

    try {
        const initUrl = `https://a.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Math.random()}`;
        const initRes = await fetch(initUrl, { headers });
        const initJson = await initRes.json();

        let convertUrl = initJson.convertURL;
        let convertRequestUrl = `${convertUrl}&v=${videoId}&f=${lowerFormat}&_=${Math.random()}`;
        let convertJson;
        
        while (true) {
            const convertRes = await fetch(convertRequestUrl, { headers });
            convertJson = await convertRes.json();
            if (convertJson.redirect > 0 && convertJson.redirectURL) {
                convertRequestUrl = `${convertJson.redirectURL}&v=${videoId}&f=${lowerFormat}&_=${Math.random()}`;
                continue;
            }
            break;
        }

        const progressUrl = convertJson.progressURL;
        const downloadUrl = convertJson.downloadURL;
        let title = convertJson.title || 'YouTube';

        let progress = 0;
        let pollCount = 0;
        // Fast polling (every 500ms)
        while (progress < 3 && pollCount < 120) {
            await new Promise(resolve => setTimeout(resolve, 500));
            pollCount++;
            const progressRes = await fetch(progressUrl, { headers });
            const progressJson = await progressRes.json();
            progress = progressJson.progress;
            if (progressJson.title) title = progressJson.title;
        }

        return { title, downloadUrl };
    } catch (error) {
        throw new Error(error?.message || String(error));
    }
}

function cleanName(name = 'file') {
    return String(name).replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 150);
}

async function downloadBuffer(url) {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://id.ytmp3.mobi/'
        }
    });
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

function checkFFmpeg() {
    return new Promise(resolve => {
        const ffmpeg = spawn('ffmpeg', ['-version']);
        ffmpeg.on('error', () => resolve(false));
        ffmpeg.on('close', code => resolve(code === 0));
    });
}

function compressMP4(inputBuffer) {
    return new Promise((resolve, reject) => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kamran-ytmp4-'));
        const inputPath = path.join(tempDir, 'input.mp4');
        const outputPath = path.join(tempDir, 'output.mp4');

        try {
            fs.writeFileSync(inputPath, inputBuffer);
            const args = [
                '-y', '-i', inputPath,
                '-c:v', 'libx264',
                '-vf', 'scale=w=1280:h=720:force_original_aspect_ratio=decrease:force_divisible_by=2',
                '-preset', 'ultrafast', '-crf', '28', // ultrafast for maximum speed
                '-c:a', 'aac', '-b:a', '96k',
                '-pix_fmt', 'yuv420p',
                '-movflags', '+faststart',
                '-map_metadata', '-1',
                outputPath
            ];

            const ffmpeg = spawn('ffmpeg', args);
            ffmpeg.on('error', error => { cleanup(); reject(error); });

            ffmpeg.on('close', code => {
                if (code !== 0) { cleanup(); reject(new Error(`FFmpeg code ${code}`)); return; }
                try {
                    const result = fs.readFileSync(outputPath);
                    cleanup();
                    resolve(result);
                } catch (error) { cleanup(); reject(error); }
            });

            function cleanup() {
                try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
                try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
                try { fs.rmdirSync(tempDir); } catch {}
            }
        } catch (error) { cleanup(); reject(error); }
    });
}

// ==================== COMMAND: .DRAMA (FAST SEARCH, DP & SELECTION) ====================
cmd({
    pattern: "drama",
    alias: ["movie", "longvid"],
    desc: "Search dramas with DP and select Video or Document",
    category: "downloader",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;

    try {
        if (!text) {
            return reply(
                `🎬 *KAMRAN-MD DRAMA SEARCH*\n\n` +
                `❌ *Please provide a drama name!*\n\n` +
                `💡 *Example:* \`.drama pakistani drama ep 1\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        const results = await searchYoutube(text.trim());

        if (!results || results.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ No results found for "${text}".`);
        }

        const topResults = results.slice(0, 5);
        let messageText = `╭──「 *KAMRAN-MD DRAMA SEARCH* 」\n`;
        messageText += `│ 🔍 *Query:* ${text}\n`;
        messageText += `╰─────────────────────────\n\n`;

        topResults.forEach((video, index) => {
            messageText += `*${index + 1}.* ${video.title}\n`;
            messageText += `👤 *Channel:* ${video.channel} | ⏱ ${video.duration} | 👁 ${video.views}\n\n`;
        });

        messageText += `📌 *Reply with a number (1-5) to select drama!*`;

        const sentMsg = await conn.sendMessage(from, {
            image: { url: topResults[0].thumbnail },
            caption: messageText
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

        searchSessions.set(sentMsg.key.id, {
            results: topResults,
            from: from,
            step: 'select_video'
        });

    } catch (e) {
        console.error('[DRAMA SEARCH ERROR]', e);
        reply(`❌ Error: ${e?.message || e}`);
    }
});


// ==================== INTERACTIVE REPLY HANDLER FOR .DRAMA ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        if (!body) return;
        const text = body.trim();

        const quotedMsg = mek.message?.extendedTextMessage?.contextInfo;
        if (!quotedMsg) return;

        const stanzaId = quotedMsg.stanzaId;
        if (!searchSessions.has(stanzaId)) return;

        const session = searchSessions.get(stanzaId);
        if (session.from !== from) return;

        // Step 2: Format Selection (1. Video, 2. Document)
        if (session.step === 'select_format') {
            if (!['1', '2'].includes(text)) return;

            const targetUrl = session.videoUrl;
            const targetTitle = session.title;
            searchSessions.delete(stanzaId);

            await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
            await conn.sendMessage(from, { text: `📥 Downloading *${targetTitle}* fastly via YMCDN...` }, { quoted: mek });

            const res = await scrapeYtmp3(targetUrl, 'mp4');
            const buffer = await downloadBuffer(res.downloadUrl);
            const safeTitle = cleanName(res.title);

            if (text === '1') {
                // Option 1: Fast Compressed Video
                let finalBuf = buffer;
                if (await checkFFmpeg()) {
                    try { finalBuf = await compressMP4(buffer); } catch {}
                }
                await conn.sendMessage(from, {
                    video: finalBuf,
                    mimetype: 'video/mp4',
                    caption: `🎥 *${res.title}*\n> Powered by KAMRAN-MD`
                }, { quoted: mek });

            } else if (text === '2') {
                // Option 2: Document File
                await conn.sendMessage(from, {
                    document: buffer,
                    mimetype: 'video/mp4',
                    fileName: `${safeTitle}.mp4`,
                    caption: `📁 *${res.title}*\n> Powered by KAMRAN-MD`
                }, { quoted: mek });
            }

            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            return;
        }

        // Step 1: User selected drama number (1-5)
        if (session.step === 'select_video') {
            const choice = parseInt(text);
            if (isNaN(choice) || choice < 1 || choice > session.results.length) return;

            const selectedVideo = session.results[choice - 1];
            searchSessions.delete(stanzaId);

            const formatMenu = 
                `╭───────────────────────╮\n` +
                `  🎬 *${selectedVideo.title}*\n` +
                `╰───────────────────────╯\n\n` +
                `📌 *Format select karein (Reply karein):*\n\n` +
                `1️⃣ *Video (MP4)*\n` +
                `2️⃣ *Document File (MP4)*\n\n` +
                `> Powered by KAMRAN-MD`;

            const formatMsg = await conn.sendMessage(from, { text: formatMenu }, { quoted: mek });

            searchSessions.set(formatMsg.key.id, {
                videoUrl: selectedVideo.url,
                title: selectedVideo.title,
                from: from,
                step: 'select_format'
            });
        }

    } catch (err) {
        console.error("Drama Selection Error:", err);
        await conn.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
