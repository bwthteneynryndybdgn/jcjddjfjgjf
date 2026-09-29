import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
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
              results.push({
                id: videoRenderer.videoId,
                title: videoRenderer.title?.runs?.map(r => r.text).join('') || 'No Title',
                channel: videoRenderer.ownerText?.runs?.map(r => r.text).join('') || 'Unknown Channel',
                views: videoRenderer.viewCountText?.simpleText || '0 views',
                publishedTime: videoRenderer.publishedTimeText?.simpleText || '',
                duration: videoRenderer.lengthText?.simpleText || 'LIVE',
                url: `https://www.youtube.com/watch?v=${videoRenderer.videoId}`
              });
            }
          }
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Gagal melakukan scraping YouTube:', error.message);
    throw error;
  }
}

// ==================== YOUTUBE SEARCH COMMAND ====================
cmd({
    pattern: "yts",
    alias: ["ytsearch", "youtube"],
    react: "🔍",
    desc: "Search videos on YouTube",
    category: "search",
    use: ".yts javascript tutorial",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        const query = args.join(' ');
        if (!query) {
            return reply(`❌ *Please provide a search query!*\n\n*Example:* \n.yts javascript tutorial`);
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const results = await searchYoutube(query);

        if (!results || results.length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(`❌ Tidak ada hasil yang ditemukan untuk "${query}".`);
        }

        // Limit to top 5 results to avoid long messages
        const topResults = results.slice(0, 5);
        
        let messageText = `╭──「 *YOUTUBE SEARCH* 」\n`;
        messageText += `│\n`;
        messageText += `│ 🔍 *Query:* ${query}\n`;
        messageText += `│ 📊 *Found:* ${results.length} results\n`;
        messageText += `│\n`;
        messageText += `╰─────────────────\n\n`;

        topResults.forEach((video, index) => {
            messageText += `*${index + 1}. ${video.title}*\n`;
            messageText += `👤 *Channel:* ${video.channel}\n`;
            messageText += `⏱ *Duration:* ${video.duration} | 👁 *Views:* ${video.views}\n`;
            messageText += `🔗 *Link:* ${video.url}\n\n`;
        });

        messageText += `> *Powered By KAMRAN MD*`;

        await conn.sendMessage(from, { text: messageText }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error("YouTube search error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ *Error processing request!*\n\n*Error:* ${error.message}`);
    }
});
