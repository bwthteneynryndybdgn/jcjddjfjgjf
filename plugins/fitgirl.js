import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const API_KEY = process.env.FITGIRL_API_KEY || 'VajiraOfc';
const BASE_URL = 'https://vajiraofc-apis.vercel.app/api/fitgirls';
const WHATSAPP_MAX_SIZE = 1.8 * 1024 * 1024 * 1024; // 1.8GB safe limit

cmd({
    pattern: "fitgirl",
    alias: ["fg", "repack", "pcgame"],
    desc: "Search & Auto-download small FitGirl repacks",
    category: "downloader",
    react: "🎮",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply(`🎮 *Usage:* .fitgirl <game name>\n_Small files (<1.8GB) auto-download, large files send links._`);

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Step 1: Search
        const searchRes = await axios.get(`${BASE_URL}?q=${encodeURIComponent(text)}&apikey=${API_KEY}`, { timeout: 30000 });
        if (!searchRes.data?.results?.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Game not found.");
        }

        // Step 2: Get Details
        const firstResult = searchRes.data.results[0];
        const detailRes = await axios.get(`${BASE_URL}-detail?url=${encodeURIComponent(firstResult.url)}&apikey=${API_KEY}`, { timeout: 30000 });
        const game = detailRes.data?.data;
        if (!game) throw new Error("Detail fetch failed");

        const specs = game.specifications || {};
        const filekeeperLinks = game.categorizedLinks?.filekeeper || [];

        // Step 3: Check if we can auto-download
        // Parse repack size to check against WhatsApp limit
        const sizeMatch = specs.repackSize?.match(/(\d+\.?\d*)\s*(MB|GB)/i);
        let sizeInBytes = 0;
        if (sizeMatch) {
            const val = parseFloat(sizeMatch[1]);
            const unit = sizeMatch[2].toUpperCase();
            sizeInBytes = unit === 'GB' ? val * 1024 * 1024 * 1024 : val * 1024 * 1024;
        }

        const canAutoDownload = sizeInBytes > 0 && sizeInBytes <= WHATSAPP_MAX_SIZE && filekeeperLinks.length === 1;

        if (canAutoDownload) {
            // ✅ AUTO DOWNLOAD MODE
            const targetLink = filekeeperLinks[0].url;
            await reply(`📥 *Downloading ${specs.repackSize}...*\n_This may take a few minutes._`);

            const fileRes = await axios.get(targetLink, {
                responseType: 'arraybuffer',
                timeout: 300000, // 5 min timeout for download
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://fitgirl-repacks.site/'
                }
            });

            const fileName = filekeeperLinks[0].label.endsWith('.rar') 
                ? filekeeperLinks[0].label 
                : `${game.gameTitle}.rar`;

            await conn.sendMessage(from, {
                document: fileRes.data,
                mimetype: 'application/x-rar-compressed',
                fileName: fileName,
                caption: `🎮 *${game.gameTitle}*\n📦 Size: ${specs.repackSize}\n\n✅ Downloaded via Bot`
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

        } else {
            // ❌ LINK MODE (Too big or multi-part)
            let msg = `🎮 *${game.gameTitle}*\n\n`;
            msg += `📦 Original: ${specs.originalSize || 'N/A'}\n`;
            msg += `💾 Repack: ${specs.repackSize || 'N/A'}\n`;
            msg += `⚠️ _File too large/multi-part for auto-download_\n\n`;

            if (filekeeperLinks.length > 0) {
                msg += `📥 *Download Links:*\n`;
                filekeeperLinks.forEach((l, i) => {
                    msg += `${i + 1}. [${l.label}](${l.url})\n`;
                });
                msg += `\n`;
            }

            const torrents = game.categorizedLinks?.TorrentTrackers || [];
            if (torrents.length > 0) {
                msg += `🧲 *Torrent:* ${torrents[0].url}\n`;
            }

            msg += `\n💡 _Use IDM/JDownloader for best results._`;
            await reply(msg);
            await conn.sendMessage(from, { react: { text: "🔗", key: mek.key } });
        }

    } catch (error) {
        console.error("FitGirl Error:", error.message);
        reply(`❌ Error: ${error.response?.data?.message || error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
