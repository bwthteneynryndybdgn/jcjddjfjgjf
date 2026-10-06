import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== YOUTUBE SEARCH FUNCTION ====================
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
      timeout: 10000
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

// ==================== ULTRA-FAST YMCDN SCRAPER FUNCTIONS ====================
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
        'Referer': 'https://id.ytmp3.mobi/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site'
    };

    try {
        const initUrl = `https://a.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Math.random()}`;
        const initRes = await fetch(initUrl, { headers });
        
        if (!initRes.ok) {
            throw new Error(`Init request failed with status code ${initRes.status}`);
        }
        
        const initJson = await initRes.json();
        if (initJson.error > 0) {
            throw new Error(`Init API returned error: ${initJson.error}`);
        }

        let convertUrl = initJson.convertURL;
        let convertRequestUrl = `${convertUrl}&v=${videoId}&f=${lowerFormat}&_=${Math.random()}`;
        let convertJson;
        
        while (true) {
            const convertRes = await fetch(convertRequestUrl, { headers });
            if (!convertRes.ok) {
                throw new Error(`Convert request failed with status code ${convertRes.status}`);
            }
            
            convertJson = await convertRes.json();
            if (convertJson.error > 0) {
                throw new Error(`Convert API returned error: ${convertJson.error}`);
            }
            
            if (convertJson.redirect > 0 && convertJson.redirectURL) {
                convertRequestUrl = `${convertJson.redirectURL}&v=${videoId}&f=${lowerFormat}&_=${Math.random()}`;
                continue;
            }
            break;
        }

        const progressUrl = convertJson.progressURL;
        const downloadUrl = convertJson.downloadURL;
        let title = convertJson.title || 'YouTube';

        if (!progressUrl || !downloadUrl) {
            throw new Error('API conversion response is missing progress or download URL.');
        }

        let progress = 0;
        let pollCount = 0;
        const maxPolls = 300;
        
        while (progress < 3 && pollCount < maxPolls) {
            await new Promise(resolve => setTimeout(resolve, 300));
            pollCount++;
            
            const progressRes = await fetch(progressUrl, { headers });
            if (!progressRes.ok) continue;
            
            const progressJson = await progressRes.json();
            if (progressJson.error > 0) continue;
            
            progress = progressJson.progress;
            if (progressJson.title) {
                title = progressJson.title;
            }
        }

        if (progress < 3) {
            throw new Error('Conversion process timed out.');
        }

        return {
            status: 'success',
            videoId,
            title,
            format: lowerFormat,
            downloadUrl
        };
    } catch (error) {
        return {
            status: 'error',
            message: error?.message || String(error)
        };
    }
}

function cleanName(name = 'file') {
    return String(name)
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 150);
}

// ==================== COMMAND: .TVSHOW (STYLISH TV SHOW DOWNLOAD) ====================
cmd({
    pattern: "tvshow",
    alias: ["playtvshow", "dltvshow"],
    desc: "Fast auto search with stylish info card and download TV show video as document safely",
    category: "downloader",
    react: "📺",
    filename: __filename
}, async (conn, mek, m, extra) => {
    const { from, text, reply } = extra;

    let tempFile = null;

    try {
        if (!text) {
            return reply(
                `📺 *KAMRAN-MD TV SHOW DOWNLOADER*\n\n` +
                `❌ *Please provide a TV show name or YouTube link!*\n\n` +
                `💡 *Example:* \`.tvshow mr bean animated series episode 1\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⚡", key: mek.key } });

        let showUrl = text.trim();
        let showInfo = null;

        if (!showUrl.includes("youtube.com") && !showUrl.includes("youtu.be")) {
            const searchResults = await searchYoutube(showUrl);
            
            if (!searchResults || searchResults.length === 0) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply(`❌ No TV show found for "${showUrl}".`);
            }
            
            showInfo = searchResults[0];
            showUrl = showInfo.url;

            let infoText = `📺 *TV SHOW DOWNLOADER*\n\n`;
            infoText += `🗂 *Title:* ${showInfo.title}\n`;
            infoText += `📺 *Channel:* ${showInfo.channel}\n`;
            infoText += `⏱ *Duration:* ${showInfo.duration}\n\n`;
            infoText += `_Status: Downloading TV Show..._\n\n`;
            infoText += `> Powered by KAMRAN-MD`;

            await conn.sendMessage(from, {
                image: { url: showInfo.thumbnail },
                caption: infoText
            }, { quoted: mek });
        } else {
            await reply('_⚡ Fast downloading TV show via YMCDN, please wait..._');
        }

        const res = await scrapeYtmp3(showUrl, 'mp4');
        if (res.status === 'error') {
            throw new Error(res.message);
        }

        const { title, downloadUrl } = res;
        const safeTitle = cleanName(title || 'TVShow');

        tempFile = path.join(os.tmpdir(), `tvshow_${Date.now()}.mp4`);
        
        const response = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://id.ytmp3.mobi/'
            }
        });

        const writer = fs.createWriteStream(tempFile);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        await conn.sendMessage(from, {
            document: { url: tempFile },
            mimetype: 'video/mp4',
            fileName: `${safeTitle}.mp4`,
            caption: `📺 *${title}*\n\n> Powered by KAMRAN-MD`
        }, { quoted: mek });

        try {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch {}
        if (global.gc) { global.gc(); }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error('[TVSHOW ERROR]', e);
        try {
            if (tempFile && fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch {}
        if (global.gc) { global.gc(); }

        reply(`❌ Error: ${e?.message || e}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
