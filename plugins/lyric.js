import axios from 'axios';
import * as cheerio from 'cheerio';
import { cmd } from '../command.js'; // اپنے بوٹ کے کمانڈ ہینڈلر کا صحیح پاتھ رکھیں

// Scraper Function Exported for ESM
export async function searchLyrics(query) {
    try {
        const url = `https://www.lyrics.com/lyrics/${encodeURIComponent(query)}`;

        const { data } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });

        const $ = cheerio.load(data);
        const results = [];

        $(".sec-lyric.clearfix").each((_, el) => {
            const title = $(el).find(".lyric-meta-title a").text().trim();
            const artist = $(el).find(".lyric-meta-artists a, .lyric-meta-album-artist a").first().text().trim();
            const path = $(el).find(".lyric-meta-title a").attr("href");
            const lyrics = $(el).find(".lyric-body").text().replace(/\s+\n/g, "\n").trim();

            if (title && lyrics) {
                results.push({
                    title,
                    artist: artist || "Unknown Artist",
                    url: path ? `https://www.lyrics.com${path}` : null,
                    lyrics
                });
            }
        });

        return {
            status: true,
            total: results.length,
            result: results
        };
    } catch (error) {
        return {
            status: false,
            message: error.message,
            result: []
        };
    }
}

// ==========================================
//          WHATSAPP BOT COMMAND
// ==========================================

cmd({
    pattern: "lyrics",
    alias: ["lirik", "lyric", "songlyrics"],
    desc: "Search song lyrics from Lyrics.com",
    category: "search",
    filename: import.meta.url
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) {
            await react("❌");
            return reply("⚠️ *براہ کرم گانے کا نام یا کوئی لیرکس لکھیں!*\n\n*مثال:* `.lyrics bulan madu` یا `.lyrics Alan Walker Faded`");
        }

        await react("🎶");

        const data = await searchLyrics(q);

        if (!data.status || !data.result.length) {
            await react("❌");
            return reply("❌ *اس گانے کے لیرکس نہیں مل سکے۔*");
        }

        // Top Result Extracting
        const topResult = data.result[0];

        let caption = `🎵 *LYRICS FINDER*\n\n`;
        caption += `📌 *Title:* ${topResult.title}\n`;
        caption += `👤 *Artist:* ${topResult.artist}\n`;
        if (topResult.url) caption += `🔗 *Source:* ${topResult.url}\n`;
        caption += `\n📜 *Lyrics Preview:*\n\n${topResult.lyrics}\n\n`;

        // If there are more search results, show them as options
        if (data.total > 1) {
            caption += `🔎 *دیگر ملتے جلتے نتائج (${data.total}):*\n`;
            data.result.slice(1, 5).forEach((item, i) => {
                caption += `${i + 2}. ${item.title} - ${item.artist}\n`;
            });
        }

        await reply(caption);
        await react("✅");

    } catch (err) {
        console.error("Lyrics Command Error:", err);
        await react("❌");
        await reply(`❌ *Error:* ${err.message}`);
    }
});
