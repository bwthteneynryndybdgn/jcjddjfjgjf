import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

const API = 'https://api.omegatech.app/api/movie/MovieBox-pro';
const OFF = 'https://api.omegatech.app/api/movie/Moviebox_off';

// Global storage for movie selection flow
global.movieFlow = global.movieFlow || {};

cmd({
    pattern: "moviebox75",
    alias: ["film65", "moviebox76", "mb77"],
    use: '.movie Avatar',
    desc: "Search movies and get stream/download links from MovieBox",
    category: "downloader",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    try {
        const query = String(text || "").trim();
        if (!query) {
            return reply(`*🎬 KAMRAN-MD MovieBox*\n\nSearch:\n• .${command} Avatar\n\n_Reply with a number for stream links._`);
        }

        global.movieFlow[from] = global.movieFlow[from] || {};

        // Reply flow: pick result based on number reply
        if (m.quoted && global.movieFlow[from][m.sender] && /^\d+$/.test(query)) {
            const list = global.movieFlow[from][m.sender];
            const item = list[parseInt(query) - 1];
            if (!item) return reply('❌ Invalid number.');

            await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

            try {
                const sid = item.subjectId;
                let streams = [];
                
                if (item.proxyStream || item.proxyDownload) {
                    streams.push({ label: 'Stream (proxy)', url: item.proxyStream });
                    streams.push({ label: 'Download (proxy)', url: item.proxyDownload });
                }

                try {
                    const { data } = await axios.get(OFF, {
                        params: { action: 'play', subjectId: sid, season: item.season || 0, episode: 0 },
                        timeout: 25000,
                        headers: { 'User-Agent': 'KAMRAN-MD/1.0' }
                    });
                    const arr = data?.data?.streams || data?.streams || [];
                    arr.forEach((s, i) => {
                        const u = s.trapUrl || s.url || s.hls || s.dash;
                        if (u) streams.push({ label: s.resolutions || s.format || `Source ${i + 1}`, url: u });
                    });
                } catch {}

                let cap = `*🎬 ${item.title}*\n`;
                if (item.genre) cap += `🎭 ${item.genre}\n`;
                if (item.imdbRatingValue || item.imdb) cap += `⭐ ${item.imdbRatingValue || item.imdb}\n`;
                if (item.releaseDate) cap += `📅 ${item.releaseDate}\n\n`;

                if (streams.length) {
                    streams.slice(0, 12).forEach((s, i) => {
                        if (s.url) cap += `🔗 *${s.label || i + 1}*:\n${s.url}\n\n`;
                    });
                } else {
                    cap += '_No direct streams found. Try another title._';
                }

                delete global.movieFlow[from][m.sender];
                const cover = item.cover?.url || item.cover;

                if (cover) {
                    await conn.sendMessage(from, { image: { url: cover }, caption: cap.trim() }, { quoted: mek });
                } else {
                    await reply(cap.trim());
                }

                return await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

            } catch (e) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply('❌ Failed: ' + (e.message || e));
            }
        }

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const { data } = await axios.get(API, {
            params: { action: 'search', keyword: query },
            timeout: 25000,
            headers: { 'User-Agent': 'KAMRAN-MD/1.0' }
        });

        const results = data?.data?.results || data?.results || [];
        if (!results.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply('❌ No movies found on MovieBox.');
        }

        const top = results.slice(0, 10);
        global.movieFlow[from][m.sender] = top;

        let msg = `*🎬 MovieBox Search:* ${query}\n\n`;
        top.forEach((v, i) => {
            const type = v.subjectType === 2 ? 'Series' : 'Movie';
            msg += `*${i + 1}.* ${v.title} (${type})\n`;
            if (v.imdbRatingValue) msg += `   ⭐ ${v.imdbRatingValue} · ${v.releaseDate || ''}\n`;
        });
        msg += `\n_Reply with a number for stream / download links._`;

        await conn.sendMessage(from, { text: msg }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error('[MOVIE ERROR]', e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply('❌ Movie search failed: ' + (e.message || e));
    }
});
