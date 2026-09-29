import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomPercent = () => Math.floor(Math.random() * 101);

// ==========================================
// 🎨 TEXT & FONT STYLES (50+ Commands)
// ==========================================

const fonts = [
    { name: "tiny", fn: t => t.replace(/[a-z]/g, c => "ᵃᵇᶜᵈᵉfᵍʰⁱʲᵏˡᵐⁿᵒᵖ𐞥ʳˢᵗᵘᵛʷˣʸᶻ"[c.charCodeAt(0)-97] || c) },
    { name: "circle", fn: t => t.replace(/[a-z]/g, c => String.fromCodePoint(c.charCodeAt(0) + 9333)) },
    { name: "square", fn: t => t.replace(/[a-z]/g, c => String.fromCodePoint(c.charCodeAt(0) + 127232)) },
    { name: "gothic", fn: t => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 120361 : 120367))) },
    { name: "cursive", fn: t => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 120049 : 120055))) },
    { name: "double", fn: t => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 120153 : 120159))) },
    { name: "bubble", fn: t => t.split('').map(c => c + '💭').join('') },
    { name: "firetext", fn: t => `🔥 ${t} 🔥` },
    { name: "startext", fn: t => `⭐ ${t} ⭐` },
    { name: "hearttext", fn: t => `❤️ ${t} ❤️` },
    { name: "cloudtext", fn: t => `☁️ ${t} ☁️` },
    { name: "matrix", fn: t => t.split('').map(c => `01${c}`).join(' ') },
    { name: "upsidedown", fn: t => t.split('').reverse().join('') },
    { name: "spacing", fn: t => t.split('').join('   ') },
    { name: "dash", fn: t => t.split('').join('-') },
    { name: "dot", fn: t => t.split('').join('.') },
    { name: "underline", fn: t => t.split('').map(c => c + '\u0332').join('') },
    { name: "overline", fn: t => t.split('').map(c => c + '\u0305').join('') },
    { name: "strikethrough", fn: t => t.split('').map(c => c + '\u0336').join('') },
    { name: "slash", fn: t => t.split('').map(c => c + '\u0338').join('') },
    { name: "fancy1", fn: t => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 119737 : 119743))) },
    { name: "fancy2", fn: t => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 119789 : 119795))) },
    { name: "fancy3", fn: t => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 119841 : 119847))) },
    { name: "fancy4", fn: t => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 119893 : 119899))) },
    { name: "fancy5", fn: t => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 119945 : 119951))) },
    { name: "fancy6", fn: t => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 119997 : 120003))) },
    { name: "fancy7", fn: t => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 120101 : 120107))) },
    { name: "fancy8", fn: t => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 120205 : 120211))) },
    { name: "fancy9", fn: t => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 120257 : 120263))) },
    { name: "fancy10", fn: t => t.replace(/[a-zA-Z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' ? 120309 : 120315))) }
];

fonts.forEach((f) => {
    cmd({ pattern: f.name, desc: `Font style ${f.name}`, category: "text", filename: __filename }, async (c, mek, m, { q, reply }) => {
        if (!q) return reply("❌ Please provide text!");
        try { reply(`${f.fn(q)}\n\n> Powered by KAMRAN MD`); } catch { reply(q); }
    });
});

// ==========================================
// 🎮 FUN, GAMES & RATINGS (50+ Commands)
// ==========================================

const funList = [
    "truth", "dare", "hack", "gayrate", "lesbianrate", "handsome", "cute", "smart", "dumb", "pro",
    "noob", "legend", "god", "devil", "angel", "king", "queen", "boss", "hero", "villain",
    "sociopath", "psycho", "genius", "crazy", "funny", "sad", "angry", "happy", "rich", "poor",
    "single", "taken", "crush", "lover", "hater", "friend", "enemy", "bitch", "chad", "sigma",
    "alpha", "beta", "sigma", "omega", "wizard", "ninja", "samurai", "pirate", "alien", "zombie"
];

funList.forEach((act) => {
    cmd({ pattern: act, desc: `Check ${act} status`, category: "fun", filename: __filename }, async (c, mek, m, { reply }) => {
        const target = m.quoted ? `@${m.quoted.sender.split('@')[0]}` : 'You';
        reply(`🎲 *${act.toUpperCase()}* for ${target}: ${randomPercent()}%\n\n> Powered by KAMRAN MD`);
    });
});

cmd({ pattern: "coinflip", desc: "Flip a coin", category: "fun", filename: __filename }, async (c, mek, m, { reply }) => {
    reply(`🪙 Coin Result: ${getRandom(["Heads", "Tails"])}\n\n> Powered by KAMRAN MD`);
});

cmd({ pattern: "roll", desc: "Roll dice", category: "fun", filename: __filename }, async (c, mek, m, { reply }) => {
    reply(`🎲 Dice Result: ${Math.floor(Math.random() * 6) + 1}\n\n> Powered by KAMRAN MD`);
});
