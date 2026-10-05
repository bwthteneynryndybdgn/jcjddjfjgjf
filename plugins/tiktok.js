import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

/**
 * Scraper function for SaveTik
 */
async function tiktokScraper(url) {
    try {
        const r = await axios.post(
            'https://savetik.co/api/ajaxSearch',
            new URLSearchParams({ q: url, lang: 'id' }).toString(),
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                    origin: 'https://savetik.co',
                    referer: 'https://savetik.co/id1'
                }
            }
        );
        const $ = cheerio.load(r.data.data);
        return {
            title: $('h3').first().text().trim() || 'TikTok Media',
            thumbnail: $('.image-tik img').attr('src') || $('.thumbnail img').attr('src') || null,
            mp4: $('.dl-action a:contains("MP4")').not(':contains("HD")').attr('href') || null,
            mp4_hd: $('.dl-action a:contains("HD")').attr('href') || null,
            mp3: $('.dl-action a:contains("MP3")').attr('href') || null,
            foto: $('.photo-list a[href*="snapcdn"]').map((_, e) => $(e).attr('href')).get()
        };
    } catch (e) {
        return { status: 'error', msg: e.message };
    }
}

// --- MAIN COMMAND ---

cmd({
    pattern: "tiktok",
    alias: ["tt", "ttdl"],
    react: "📥",
    desc: "Download TikTok videos or photos directly.",
    category: "downloader",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        if (!q) return reply(`*Usage:* ${prefix}tiktok <link>\n*Example:* ${prefix}tiktok https://vt.tiktok.com/ZSfEbDw89/`);

        const targetChat = conn.decodeJid(from);
        
        // Search Reaction
        await conn.sendMessage(targetChat, { react: { text: "🔍", key: m.key } });

        const data = await tiktokScraper(q.trim());

        if (data.status === 'error' || (!data.mp4 && !data.mp4_hd && data.foto.length === 0)) {
            return reply("❌ Failed to fetch TikTok media. Link invalid or private.");
        }

        // Caption template
        const caption = `🎬 *TIKTOK DOWNLOADER* 🎬\n\n📌 *Title:* ${data.title}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ ᴍᴅ`;

        // Check if it's a Video or Photo Slideshow
        if (data.mp4 || data.mp4_hd) {
            // Sending Video Directly
            await conn.sendMessage(targetChat, {
                video: { url: data.mp4_hd || data.mp4 },
                caption: caption,
                mimetype: "video/mp4"
            }, { quoted: mek });

        } else if (data.foto && data.foto.length > 0) {
            // Sending Slideshow Photos Directly
            reply(`📸 *Slideshow Detected!* Sending ${data.foto.length} photos...`);
            for (let img of data.foto) {
                await conn.sendMessage(targetChat, { image: { url: img } }, { quoted: mek });
            }
        }

        // Success Reaction
        await conn.sendMessage(targetChat, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("TikTok Error:", e);
        reply("❌ An unexpected error occurred.");
    }
});
