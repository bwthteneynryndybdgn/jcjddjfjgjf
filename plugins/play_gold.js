// plugins/multi_play.js
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// --- FONT STYLES ---
const fonts = {
    small: (t) => t ? t.toLowerCase().split('').map(c => ({a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'s',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'}[c] || c)).join('') : '',
    bold: (t) => t ? t.split('').map(c => ({a:'𝐚',b:'𝐛',c:'𝐜',d:'𝐝',e:'𝐞',f:'𝐟',g:'𝐠',h:'𝐡',i:'𝐢',j:'𝐣',k:'𝐤',l:'𝐥',m:'𝐦',n:'𝐧',o:'𝐨',p:'𝐩',q:'𝐪',r:'𝐫',s:'𝐬',t:'𝐭',u:'𝐮',v:'𝐯',w:'𝐰',x:'𝐱',y:'𝐲',z:'𝐳'}[c.toLowerCase()] || c)).join('') : '',
    retro: (t) => t ? t.split('').map(c => ({a:'𝕒',b:'𝕓',c:'𝕔',d:'𝕕',e:'𝕖',f:'𝕗',g:'𝕘',h:'𝕙',i:'𝕚',j:'𝕛',k:'𝕜',l:'𝕝',m:'𝕞',n:'𝕟',o:'𝕠',p:'𝕡',q:'𝕢',r:'𝕣',s:'𝕤',t:'𝕥',u:'𝕦',v:'𝕧',w:'𝕨',x:'𝕩',y:'𝕪',z:'𝕫'}[c.toLowerCase()] || c)).join('') : '',
    gold: (t) => t ? t.split('').map(c => ({a:'𝒶',b:'𝒷',c:'𝒸',d:'𝒹',e:'ℯ',f:'𝒻',g:'ℊ',h:'𝒽',i:'𝒾',j:'𝒿',k:'𝓀',l:'𝓁',m:'𝓂',n:'𝓃',o:'ℴ',p:'𝓅',q:'𝓆',r:'𝓇',s:'𝓈',t:'𝓉',u:'𝓊',v:'𝓋',w:'𝓌',x:'𝓍',y:'𝓎',z:'𝓏'}[c.toLowerCase()] || c)).join('') : ''
};

// --- CORE PLAY FUNCTION ---
const processPlay = async (conn, mek, from, text, styleName, emoji, reactSuccess) => {
    if (!text) return conn.sendMessage(from, { text: `⚠️ Please provide a song name!\nEx: .${styleName} Pal` }, { quoted: mek });
    
    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    
    try {
        const res = await axios.get(`https://api.azbry.com/api/download/ytplay2?q=${encodeURIComponent(text.trim())}`, { timeout: 30000 });
        const info = res.data.result;
        if (!info?.download) throw new Error("Link not found");

        const botName = config.BOT_NAME || 'KAMRAN-MD';
        const font = fonts[styleName] || ((t) => t); // Default to normal if style missing
        
        // Formatting Details for the Card
        const cardTitle = `${emoji} ${font(info.title.substring(0, 40))}`;
        const cardBody = `👤 ${font(info.channel)} | 🎧 MP3`;

        // Send Audio with Photo & Details (ExternalAdReply)
        await conn.sendMessage(from, {
            audio: { url: info.download },
            mimetype: 'audio/mp4',
            ptt: false,
            contextInfo: {
                externalAdReply: {
                    title: cardTitle,       // Song Title (Stylish)
                    body: cardBody,         // Artist/Channel Details (Stylish)
                    thumbnailUrl: info.thumbnail, // PHOTO
                    sourceUrl: `https://youtube.com/watch?v=${info.videoId}`,
                    mediaType: 1,
                    renderLargerThumbnail: true // Badi Photo
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: reactSuccess, key: mek.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
};

// --- 9 DIFFERENT COMMANDS ---

// 1. Classic Small Caps
cmd({ pattern: "play2", alias: ["song2"], react: "🎵", desc: "Classic Stylish Play", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, text }) => processPlay(conn, mek, from, text, 'small', '🎵', '✅'));

// 2. Bold Serif
cmd({ pattern: "playbold", alias: ["pb"], react: "🔥", desc: "Bold Font Play", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, text }) => processPlay(conn, mek, from, text, 'bold', '🔥', '🎶'));

// 3. Minimal Clean
cmd({ pattern: "playmini", alias: ["pm"], react: "✨", desc: "Minimal Play", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, text }) => processPlay(conn, mek, from, text, null, '✨', '✅')); // null = normal text

// 4. Premium Luxury
cmd({ pattern: "playpro", alias: ["pp"], react: "💎", desc: "Premium Play", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, text }) => processPlay(conn, mek, from, text, 'small', '💎', '✨'));

// 5. Speed Focused
cmd({ pattern: "playfast", alias: ["pf"], react: "⚡", desc: "Fast Play", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, text }) => processPlay(conn, mek, from, text, 'bold', '⚡', '🚀'));

// 6. Aesthetic Vibe
cmd({ pattern: "playvibe", alias: ["pv"], react: "🌙", desc: "Aesthetic Play", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, text }) => processPlay(conn, mek, from, text, 'retro', '🌙', '💫'));

// 7. HD Quality
cmd({ pattern: "playhd", alias: ["phd"], react: "🎧", desc: "HD Audio Play", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, text }) => processPlay(conn, mek, from, text, 'bold', '🎧', '🔊'));

// 8. Retro/Vintage
cmd({ pattern: "playretro", alias: ["pr"], react: "📻", desc: "Retro Play", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, text }) => processPlay(conn, mek, from, text, 'retro', '📻', '🎞️'));

// 9. Gold Luxury
cmd({ pattern: "playgold", alias: ["pg"], react: "👑", desc: "Gold Luxury Play", category: "downloader", filename: __filename }, 
async (conn, mek, m, { from, text }) => processPlay(conn, mek, from, text, 'gold', '👑', '🏆'));
