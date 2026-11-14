import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const API_KEY = 'VajiraOfc'; // Replace with your actual API key
const BASE_URL = 'https://vajiraofc-apis.vercel.app/api/fitgirls';

cmd({
    pattern: "fitgirl",
    alias: ["fg", "repack", "pcgame"],
    desc: "Search FitGirl Repacks and get download links",
    category: "downloader",
    react: "🎮",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) {
            return reply(
                `🎮 *FitGirl Repacks Search*\n\n` +
                `Usage:\n` +
                `• .fitgirl <game name>\n` +
                `• .fitgirl cyberpunk 2077\n\n` +
                `_Note: Returns download page links only._`
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const encodedQuery = encodeURIComponent(text.trim());
        const searchUrl = `${BASE_URL}?q=${encodedQuery}&apikey=${API_KEY}`;

        const response = await axios.get(searchUrl, { timeout: 30000 });
        const data = response.data;

        if (!data?.status || !data?.results || data.results.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ No games found matching your search.");
        }

        // Get the first result's detail page
        const firstResult = data.results[0];
        const detailUrl = `${BASE_URL}-detail?url=${encodeURIComponent(firstResult.url)}&apikey=${API_KEY}`;

        const detailResponse = await axios.get(detailUrl, { timeout: 30000 });
        const detail = detailResponse.data;

        if (!detail?.status || !detail?.data) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to fetch game details.");
        }

        const game = detail.data;
        const specs = game.specifications || {};

        // Build formatted message with categorized links
        let msg = `🎮 *${game.gameTitle}*\n\n`;
        msg += `📦 *Original Size:* ${specs.originalSize || 'N/A'}\n`;
        msg += `💾 *Repack Size:* ${specs.repackSize || 'N/A'}\n`;
        msg += `🔗 *Source:* ${firstResult.url}\n\n`;

        // Add primary download links (FileKeeper / Paste)
        const filekeeperLinks = game.categorizedLinks?.filekeeper || [];
        const pasteLinks = game.categorizedLinks?.paste || [];

        if (filekeeperLinks.length > 0) {
            msg += `📥 *Direct Downloads (FileKeeper):*\n`;
            // Show first 5 parts to avoid hitting WhatsApp character limits
            filekeeperLinks.slice(0, 5).forEach((link, i) => {
                msg += `├ ${i + 1}. ${link.label}\n`;
                msg += `│   ${link.url}\n`;
            });
            if (filekeeperLinks.length > 5) {
                msg += `└ ...and ${filekeeperLinks.length - 5} more parts\n\n`;
            } else {
                msg += `\n`;
            }
        }

        if (pasteLinks.length > 0) {
            msg += `📋 *Mirror Links (Paste):*\n`;
            pasteLinks.forEach(link => {
                msg += `├ ${link.label}\n`;
                msg += `│   ${link.url}\n`;
            });
            msg += `\n`;
        }

        // Add torrent option if available
        const torrents = game.categorizedLinks?.TorrentTrackers || [];
        if (torrents.length > 0) {
            msg += `🧲 *Torrent Options:*\n`;
            torrents.forEach(t => {
                msg += `├ ${t.label}: ${t.url}\n`;
            });
            msg += `\n`;
        }

        msg += `⚠️ _Use IDM/JDownloader for reliable downloads._\n`;
        msg += `_Files are multi-part RAR archives. Extract after downloading all parts._`;

        await reply(msg);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("FitGirl Error:", error.response?.status || error.message);
        reply(`❌ Error: ${error.response?.data?.message || error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
