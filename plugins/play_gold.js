// plugins/play_gold.js
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const toGold = (t) => t ? t.split('').map(c => ({a:'𝒶',b:'𝒷',c:'𝒸',d:'𝒹',e:'ℯ',f:'𝒻',g:'ℊ',h:'𝒽',i:'𝒾',j:'𝒿',k:'𝓀',l:'𝓁',m:'𝓂',n:'𝓃',o:'ℴ',p:'𝓅',q:'𝓆',r:'𝓇',s:'𝓈',t:'𝓉',u:'𝓊',v:'𝓋',w:'𝓌',x:'𝓍',y:'𝓎',z:'𝓏'}[c.toLowerCase()] || c)).join('') : '';

cmd({ pattern: "playgold", alias: ["pg"], react: "👑", desc: "Gold Luxury Play", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, text, reply }) => {
    if (!text) return reply(`👑 *${toGold('GOLD PLAYER')}*\n\n${toGold('Enter song')}`);
    await conn.sendMessage(from, { react: { text: "👑", key: mek.key } });
    try {
        const res = await axios.get(`https://api.azbry.com/api/download/ytplay2?q=${encodeURIComponent(text.trim())}`, { timeout: 30000 });
        const info = res.data.result;
        if (!info?.download) throw new Error("Gold link missing");
        
        await conn.sendMessage(from, {
            audio: { url: info.download }, mimetype: 'audio/mp4', ptt: false,
            contextInfo: { externalAdReply: { title: `👑 ${toGold(info.title)}`, body: toGold(info.channel), thumbnailUrl: info.thumbnail, sourceUrl: `https://youtube.com/watch?v=${info.videoId}`, mediaType: 1, renderLargerThumbnail: true } }
        }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "🏆", key: mek.key } });
    } catch (e) { reply(`❌ ${e.message}`); }
});
