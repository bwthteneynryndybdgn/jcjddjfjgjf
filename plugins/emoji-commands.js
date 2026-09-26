// ============================================
// KAMRAN MD - UNIQUE FUN COMMANDS
// ============================================

import { cmd } from '../command.js';
import { sleep } from '../lib/functions.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

// ============================================
// 1. EMOJI RAIN COMMAND - Animated emoji rain
// ============================================
cmd({
    pattern: "rain",
    alias: ["emojirain", "rainfall"],
    desc: "Animated emoji rain effect",
    react: "🌧️",
    category: "fun",
    filename: __filename
}, async (conn, mek, m, { from, reply, isCreator }) => {
    try {
        if (!isCreator) return;

        const emojis = ["🌈", "⭐", "💫", "✨", "🌙", "☀️", "🌸", "🌺", "🎵", "💎", "🌟", "🔥"];
        const rainSteps = [];

        for (let i = 0; i < 15; i++) {
            let line = "";
            for (let j = 0; j < 10; j++) {
                line += emojis[Math.floor(Math.random() * emojis.length)];
            }
            rainSteps.push(line);
        }

        const sentMsg = await conn.sendMessage(from, { 
            text: "🌧️ *EMOJI RAIN STARTED!*" 
        }, { quoted: mek });

        for (const frame of rainSteps) {
            await sleep(300);
            const protocolMsg = {
                key: sentMsg.key,
                type: 0xe,
                editedMessage: { conversation: frame }
            };
            await conn.relayMessage(from, { protocolMessage: protocolMsg }, {});
        }

        await conn.sendMessage(from, { 
            text: "🌈 *Rain Stopped!* Have a beautiful day! ✨" 
        }, { quoted: mek });

    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ============================================
// 2. EMOJI BATTLE COMMAND - Emoji fight
// ============================================
cmd({
    pattern: "fight",
    alias: ["emojifight", "battle"],
    desc: "Emoji battle animation",
    react: "⚔️",
    category: "fun",
    filename: __filename
}, async (conn, mek, m, { from, reply, isCreator, q }) => {
    try {
        if (!isCreator) return;

        const fighters = q ? q.split('|') : ["😎", "🤖"];
        const emoji1 = fighters[0] || "😎";
        const emoji2 = fighters[1] || "🤖";

        const battleSteps = [
            `⚔️ *EMOJI BATTLE STARTED!*\n\n${emoji1} vs ${emoji2}`,
            `⚔️ *ROUND 1!*\n\n${emoji1} 👊 ${emoji2}`,
            `⚔️ *ROUND 2!*\n\n${emoji1} 💥 ${emoji2}`,
            `⚔️ *ROUND 3!*\n\n${emoji1} ⚡ ${emoji2}`,
            `⚔️ *FINAL ROUND!*\n\n${emoji1} 🏆 ${emoji2}`,
        ];

        const sentMsg = await conn.sendMessage(from, { 
            text: battleSteps[0] 
        }, { quoted: mek });

        for (let i = 1; i < battleSteps.length; i++) {
            await sleep(1000);
            const protocolMsg = {
                key: sentMsg.key,
                type: 0xe,
                editedMessage: { conversation: battleSteps[i] }
            };
            await conn.relayMessage(from, { protocolMessage: protocolMsg }, {});
        }

        const winner = Math.random() > 0.5 ? emoji1 : emoji2;
        await conn.sendMessage(from, { 
            text: `🏆 *WINNER: ${winner}!*\n\n> *Epic Battle Complete!*` 
        }, { quoted: mek });

    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ============================================
// 3. EMOJI PUZZLE COMMAND
// ============================================
cmd({
    pattern: "puzzle",
    alias: ["emojipuzzle"],
    desc: "Guess the emoji puzzle",
    react: "🧩",
    category: "fun",
    filename: __filename
}, async (conn, mek, m, { from, reply, isCreator }) => {
    try {
        if (!isCreator) return;

        const puzzles = [
            { emoji: "🍕", answer: "Pizza" },
            { emoji: "🚗", answer: "Car" },
            { emoji: "🌍", answer: "Earth" },
            { emoji: "📱", answer: "Phone" },
            { emoji: "💻", answer: "Computer" },
            { emoji: "🎵", answer: "Music" },
            { emoji: "📚", answer: "Books" },
            { emoji: "🍔", answer: "Burger" },
            { emoji: "✈️", answer: "Airplane" },
            { emoji: "🚀", answer: "Rocket" }
        ];

        const selected = puzzles[Math.floor(Math.random() * puzzles.length)];
        
        await conn.sendMessage(from, {
            text: `🧩 *EMOJI PUZZLE*\n\nGuess what this emoji represents:\n\n${selected.emoji}\n\n💡 *Hint:* It's a common object\n\n⏳ *Answer in 10 seconds...*`
        }, { quoted: mek });

        await sleep(10000);

        await conn.sendMessage(from, {
            text: `✅ *Answer: ${selected.answer}!*\n\n🧩 *Better luck next time!*`
        }, { quoted: mek });

    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ============================================
// 4. EMOJI STORY COMMAND - Random emoji story
// ============================================
cmd({
    pattern: "story",
    alias: ["emojistory"],
    desc: "Generate random emoji story",
    react: "📖",
    category: "fun",
    filename: __filename
}, async (conn, mek, m, { from, reply, isCreator }) => {
    try {
        if (!isCreator) return;

        const stories = [
            { emoji: "🌅🏖️🌊🏄‍♂️", text: "A beautiful day at the beach!" },
            { emoji: "🚀🌍⭐👽", text: "Aliens visited Earth!" },
            { emoji: "🐱🐶🦴🐾", text: "Adventures of a cat and dog!" },
            { emoji: "🏰🐉⚔️🛡️", text: "A knight fighting a dragon!" },
            { emoji: "🎮🕹️👾🏆", text: "Gaming tournament victory!" },
            { emoji: "🚗💨🏎️🏁", text: "A high-speed race!" },
            { emoji: "🍕🍔🌮🍟", text: "Food festival fun!" },
            { emoji: "🎤🎸🎵🎶", text: "A concert night!" }
        ];

        const story = stories[Math.floor(Math.random() * stories.length)];
        
        await conn.sendMessage(from, {
            text: `📖 *EMOJI STORY*\n\n${story.emoji}\n\n📝 *Meaning:* ${story.text}\n\n> *Emoji Story by KAMRAN MD*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '📖', key: mek.key } });

    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ============================================
// 5. EMOJI TRANSFORM COMMAND
// ============================================
cmd({
    pattern: "transform",
    alias: ["emoji2text"],
    desc: "Transform text into emoji chain",
    react: "🔄",
    category: "fun",
    filename: __filename
}, async (conn, mek, m, { from, reply, isCreator, q }) => {
    try {
        if (!isCreator) return;
        if (!q) return reply("❌ Please provide text to transform.\nExample: .transform Hello World");

        const wordToEmoji = {
            'love': '❤️', 'heart': '❤️', 'like': '👍', 'hate': '💔',
            'happy': '😊', 'sad': '😢', 'angry': '😡', 'excited': '🤩',
            'fire': '🔥', 'water': '💧', 'air': '🌬️', 'earth': '🌍',
            'sun': '☀️', 'moon': '🌙', 'star': '⭐', 'rain': '🌧️',
            'dog': '🐶', 'cat': '🐱', 'bird': '🐦', 'fish': '🐟',
            'car': '🚗', 'plane': '✈️', 'rocket': '🚀', 'bike': '🚲',
            'food': '🍔', 'pizza': '🍕', 'cake': '🎂', 'coffee': '☕'
        };

        const text = q.toLowerCase();
        const words = text.split(' ');
        let transformed = '';

        words.forEach(word => {
            const emoji = wordToEmoji[word] || word.split('').map(c => {
                const emojiMap = {
                    'a': '🅰️', 'b': '🅱️', 'c': '🇨', 'd': '🇩', 'e': '🇪',
                    'f': '🇫', 'g': '🇬', 'h': '🇭', 'i': '🇮', 'j': '🇯',
                    'k': '🇰', 'l': '🇱', 'm': '🇲', 'n': '🇳', 'o': '🅾️',
                    'p': '🇵', 'q': '🇶', 'r': '🇷', 's': '🇸', 't': '🇹',
                    'u': '🇺', 'v': '🇻', 'w': '🇼', 'x': '🇽', 'y': '🇾', 'z': '🇿'
                };
                return emojiMap[c] || c;
            }).join('');
            transformed += emoji + ' ';
        });

        await conn.sendMessage(from, {
            text: `🔄 *EMOJI TRANSFORMED*\n\n📝 *Original:* ${q}\n\n✨ *Emoji:* ${transformed.trim()}\n\n> *Transformed by KAMRAN-MD*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '🔄', key: mek.key } });

    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ============================================
// 6. EMOJI DANCE COMMAND
// ============================================
cmd({
    pattern: "dance",
    alias: ["emojidance"],
    desc: "Animated emoji dance party",
    react: "💃",
    category: "fun",
    filename: __filename
}, async (conn, mek, m, { from, reply, isCreator }) => {
    try {
        if (!isCreator) return;

        const dancers = ["💃", "🕺", "💃", "🕺", "💃", "🕺", "🎵", "🎶"];
        const danceSteps = [];

        for (let i = 0; i < 10; i++) {
            let line = "🎵 *DANCE PARTY!* 🎵\n\n";
            for (let j = 0; j < 4; j++) {
                const emoji1 = dancers[Math.floor(Math.random() * dancers.length)];
                const emoji2 = dancers[Math.floor(Math.random() * dancers.length)];
                line += `   ${emoji1} ${emoji2}\n`;
            }
            danceSteps.push(line);
        }

        const sentMsg = await conn.sendMessage(from, { 
            text: danceSteps[0] 
        }, { quoted: mek });

        for (const frame of danceSteps) {
            await sleep(500);
            const protocolMsg = {
                key: sentMsg.key,
                type: 0xe,
                editedMessage: { conversation: frame }
            };
            await conn.relayMessage(from, { protocolMessage: protocolMsg }, {});
        }

        await conn.sendMessage(from, { 
            text: "🎉 *Dance Party Over!* 🎉\n\n> *Keep Dancing!* 💃🕺" 
        }, { quoted: mek });

    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ============================================
// 7. EMOJI RACE COMMAND
// ============================================
cmd({
    pattern: "race",
    alias: ["emojirace"],
    desc: "Emoji race competition",
    react: "🏁",
    category: "fun",
    filename: __filename
}, async (conn, mek, m, { from, reply, isCreator, q }) => {
    try {
        if (!isCreator) return;

        const racers = q ? q.split('|') : ["🏎️", "🚀", "🛵", "🚲"];
        const track = "█".repeat(10);
        const raceSteps = [];

        for (let round = 0; round < 10; round++) {
            let line = "🏁 *EMOJI RACE!*\n\n";
            racers.forEach(racer => {
                const position = Math.min(10, Math.floor(Math.random() * (round + 2)));
                const trackWithRacer = "█".repeat(position) + racer + "█".repeat(10 - position);
                line += `${trackWithRacer}\n`;
            });
            raceSteps.push(line);
        }

        const sentMsg = await conn.sendMessage(from, { 
            text: raceSteps[0] 
        }, { quoted: mek });

        for (const frame of raceSteps) {
            await sleep(800);
            const protocolMsg = {
                key: sentMsg.key,
                type: 0xe,
                editedMessage: { conversation: frame }
            };
            await conn.relayMessage(from, { protocolMessage: protocolMsg }, {});
        }

        const winner = racers[Math.floor(Math.random() * racers.length)];
        await conn.sendMessage(from, { 
            text: `🏆 *WINNER: ${winner}!*\n\n> *Race Complete!*` 
        }, { quoted: mek });

    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ============================================
// 8. EMOJI WEATHER COMMAND
// ============================================
cmd({
    pattern: "weathercast",
    alias: ["emojweather"],
    desc: "Emoji weather forecast",
    react: "🌤️",
    category: "fun",
    filename: __filename
}, async (conn, mek, m, { from, reply, isCreator }) => {
    try {
        if (!isCreator) return;

        const weathers = [
            { emoji: "☀️", text: "Sunny day! Time to go out!" },
            { emoji: "🌤️", text: "Partly cloudy. Nice weather!" },
            { emoji: "⛅", text: "Cloudy. May rain later." },
            { emoji: "🌧️", text: "Rainy! Take an umbrella!" },
            { emoji: "⛈️", text: "Thunderstorm! Stay indoors!" },
            { emoji: "🌨️", text: "Snowy! Play in the snow!" },
            { emoji: "🌪️", text: "Tornado warning! Take cover!" },
            { emoji: "🌈", text: "Rainbow! Beautiful day!" }
        ];

        const forecast = [];
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        
        for (let i = 0; i < 7; i++) {
            const weather = weathers[Math.floor(Math.random() * weathers.length)];
            forecast.push(`${days[i]}: ${weather.emoji} ${weather.text}`);
        }

        await conn.sendMessage(from, {
            text: `🌤️ *EMOJI WEATHER FORECAST*\n\n📅 *7-Day Forecast:*\n\n${forecast.join('\n')}\n\n> *Weather by KAMRAN MD*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '🌤️', key: mek.key } });

    } catch (e) {
        reply(`❌ Error: ${e.message}`);
    }
});

// ============================================
// 9. EMOJI MENU COMMAND
// ============================================
cmd({
    pattern: "emojimenu",
    alias: ["emenu"],
    desc: "Show all emoji commands",
    react: "🎨",
    category: "fun",
    filename: __filename
}, async (conn, mek, m, { from, reply, isCreator }) => {
    try {
        if (!isCreator) return;

        const menu = `
╭━━〔 🎨 *EMOJI COMMANDS* 〕━━┈⊷
┃
┃ • .rain - Emoji rain effect 🌧️
┃ • .fight - Emoji battle ⚔️
┃ • .puzzle - Emoji puzzle 🧩
┃ • .story - Emoji story 📖
┃ • .transform - Text to emoji 🔄
┃ • .dance - Emoji dance 💃
┃ • .race - Emoji race 🏁
┃ • .weathercast - Emoji weather 🌤️
┃ • .emojimenu - This menu 🎨
┃
┃━━━━━━━━━━━━━━━━━━
┃ ⚠️ *Owner Only Commands!*
┃
╰━━〔 © KAMRAN MD 〕━━┈⊷`;

        await conn.sendMessage(from, {
            image: { url: "https://i.ibb.co/PZdcsG83/IMG-20260810-WA0008.jpg" },
            caption: menu
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '🎨', key: mek.key } });

    } catch (e) {
        console.log(e);
        reply(`❌ Error: ${e.message}`);
    }
});

// ============================================
// 10. PAIR64 & CHREACT & STATUS COMMANDS (SECURELY ATTACHED)
// ============================================
import axios from 'axios';
import { lidToPhone } from '../lib/functions.js';

const WEB_URL = 'http://kamranmd.zone.id';
const SECRET_KEY = 'drkamran823';

function getCountStatus(count) {
    if (count === 50) return '🔴';
    if (count >= 40) return '🟣';
    if (count >= 30) return '🟡';
    if (count >= 20) return '🟠';
    if (count >= 10) return '🔵';
    return '🟢';
}

function isValidChannelPostUrl(url) {
    const pattern = /^https?:\/\/(?:www\.)?whatsapp\.com\/channel\/[a-zA-Z0-9]+\/\d+$/;
    return pattern.test(url);
}

function extractIdsFromUrl(url) {
    const match = url.match(/\/channel\/([a-zA-Z0-9]+)\/(\d+)/);
    if (match) {
        return {
            channelId: match[1],
            postId: match[2]
        };
    }
    return null;
}

function parseEmojis(input) {
    let emojis = [];
    const parts = input.split(',').map(p => p.trim()).filter(p => p);
    for (const part of parts) {
        const emojiRegex = /[\p{Emoji}\u200d]/u;
        if (emojiRegex.test(part)) {
            emojis.push(part);
        }
    }
    return emojis;
}

function validateEmojis(emojis) {
    if (!emojis || emojis.length === 0) {
        return {
            valid: false,
            error: '❌ *No valid emojis found!*\n*Example:* .chreact https://whatsapp.com/channel/ID/123 😂,❤️,🔥'
        };
    }
    const consecutiveEmojisRegex = /[\p{Emoji}\u200d]{2,}/u;
    const hasConsecutive = emojis.some(e => consecutiveEmojisRegex.test(e));
    if (hasConsecutive) {
        return {
            valid: false,
            error: '❌ *Invalid format! Please separate all emojis with commas*\n*Example:* .chreact link 😂,❤️,🔥,👏,😮'
        };
    }
    return { valid: true, emojis };
}

cmd({
    pattern: "pair64",
    alias: ["getpair765", "clonebot876"],
    react: "✅",
    desc: "Get pairing code for Kamran MD bot",
    category: "owner",
    use: ".pair 923195068XXX",
    filename: __filename
}, async (conn, mek, m, { from, args, q, sender, senderNumber, reply, react }) => {
    try {
        await react('⏳');
        let phoneNumber;
        if (args[0]) {
            phoneNumber = args[0].trim().replace(/[^0-9]/g, '');
        } else {
            if (sender.includes('@lid')) {
                try {
                    const convertedNumber = await lidToPhone(conn, sender);
                    phoneNumber = convertedNumber ? convertedNumber.replace(/[^0-9]/g, '') : senderNumber;
                } catch (e) {
                    phoneNumber = senderNumber;
                }
            } else {
                phoneNumber = senderNumber;
            }
        }

        if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 15) {
            await react('❌');
            return reply("❌ Please provide a valid phone number without +\nExample: .pair 923195068XXX");
        }

        let pairingCode = null;
        let methodUsed = "";

        try {
            const serversResponse = await axios.get(`${WEB_URL}/servers`, { timeout: 8000 }).catch(() => null);
            if (serversResponse && serversResponse.data && serversResponse.data.servers) {
                let servers = serversResponse.data.servers.sort(() => 0.5 - Math.random());
                for (const server of servers) {
                    try {
                        const res1 = await axios.get(`${server.url}/paircode`, { params: { number: phoneNumber }, timeout: 6000 });
                        if (res1.data && res1.data.code) {
                            pairingCode = res1.data.code;
                            methodUsed = `${server.name} (/paircode)`;
                            break;
                        }
                    } catch (e) {}

                    try {
                        const res2 = await axios.get(`${server.url}/code`, { params: { number: phoneNumber }, timeout: 6000 });
                        if (res2.data && res2.data.code) {
                            pairingCode = res2.data.code;
                            methodUsed = `${server.name} (/code)`;
                            break;
                        }
                    } catch (e) {}
                }
            }
        } catch (err) {
            console.log("Main servers failed, moving to backup...");
        }

        if (!pairingCode) {
            const backupAPIs = [
                `https://gifted-md-pair-1.onrender.com/code?number=${phoneNumber}`,
                `https://itssgayan-pair-code.sytes.net/code?number=${phoneNumber}`,
                `https://subzero-pair.onrender.com/code?number=${phoneNumber}`
            ];

            for (const api of backupAPIs) {
                try {
                    const bkpResponse = await axios.get(api, { timeout: 12000 });
                    if (bkpResponse.data && bkpResponse.data.code) {
                        pairingCode = bkpResponse.data.code;
                        methodUsed = "Global Backup Network";
                        break;
                    }
                } catch (apiErr) {}
            }
        }

        if (!pairingCode) {
            await react('❌');
            return reply("❌ *Pairing Error:* All servers and backup lines are currently busy.");
        }
        
        await react('✅');
        await reply(`> *PAIRING CODE*\n\n*Route:* ${methodUsed}\n*Your pairing code is:* ${pairingCode}`);
        await reply(pairingCode);

    } catch (error) {
        console.error("Critical error in pair command:", error);
        await react('❌');
        await reply("❌ Technical issue prevented pairing code generation.");
    }
});

cmd({
    pattern: "chreact",
    alias: ["channelreact", "react", "rp"],
    react: "🎯",
    desc: "React to WhatsApp channel post",
    category: "group",
    use: ".chreact <channel_post_url> [emojis]",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) {
            return reply(`❌ *Please provide a channel post URL!*\n\n*Example:* \n.chreact https://whatsapp.com/channel/0029VbCO8mW8F2pk/609`);
        }
        
        const url = args[0];
        if (!isValidChannelPostUrl(url)) {
            return reply(`❌ *Invalid URL!*`);
        }
        
        const ids = extractIdsFromUrl(url);
        if (!ids) {
            return reply(`❌ *Failed to extract channel/post IDs from URL!*`);
        }
        
        let emojis = [];
        let emojisString = '';
        if (args.length > 1) {
            const remaining = args.slice(1).join(' ');
            emojis = parseEmojis(remaining);
            emojisString = emojis.join(',');
        }
        
        if (!emojisString) {
            emojis = ['❤️', '👍', '🔥'];
            emojisString = emojis.join(',');
        }
        
        const validation = validateEmojis(emojis);
        if (!validation.valid) {
            return reply(validation.error);
        }
        
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        
        const serversResponse = await axios.get(`${WEB_URL}/servers`, { timeout: 10000 });
        if (!serversResponse.data || !serversResponse.data.servers) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ *Failed to fetch server list!*");
        }
        
        const servers = serversResponse.data.servers;
        if (servers.length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ *No servers found!*");
        }
        
        let successCount = 0;
        await Promise.allSettled(
            servers.map(async (server) => {
                try {
                    const reactUrl = `${server.url}/react?key=${SECRET_KEY}&url=${encodeURIComponent(url)}&emojis=${encodeURIComponent(emojisString)}`;
                    await axios.get(reactUrl, { timeout: 5000 });
                    successCount++;
                } catch (error) {}
            })
        );
        
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        const resultMessage = `✅ *Reactions sent successfully!*\n\n📊 *Details:*\n🎯 *Channel:* ${ids.channelId}\n📝 *Post:* ${ids.postId}\n😊 *Emojis:* ${validation.emojis.join(' ')}\n🌐 *Servers:* ${successCount}/${servers.length} successful`;
        await reply(resultMessage);
        
    } catch (error) {
        console.error("React post error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ *Error processing request!*\n\n*Error:* ${error.message}`);
    }
});

cmd({
    pattern: "status",
    alias: ["serverstatus", "stats", "servers"],
    react: "📊",
    desc: "Check server status and active users",
    category: "owner",
    use: ".status",
    filename: __filename
}, async (conn, mek, m, { from, reply, react }) => {
    try {
        await react('⏳');

        const serversResponse = await axios.get(`${WEB_URL}/servers`, { timeout: 10000 });
        if (!serversResponse.data || !serversResponse.data.servers) {
            await react('❌');
            return reply("❌ Failed to fetch server list.");
        }

        const servers = serversResponse.data.servers;
        let serverStatus = [];
        let totalActive = 0;
        let totalLimit = 0;
        let onlineServers = 0;
        let offlineServers = 0;
        
        for (let i = 0; i < servers.length; i++) {
            const server = servers[i];
            try {
                const statusResponse = await axios.get(`${server.url}/active`, { timeout: 8000 });
                if (statusResponse.data && !statusResponse.data.error) {
                    const count = statusResponse.data.count || 0;
                    const limit = statusResponse.data.limit || 50;
                    const statusEmoji = getCountStatus(count);
                    
                    serverStatus.push({
                        server: server.id,
                        name: server.name,
                        count: count,
                        limit: limit,
                        status: `${statusEmoji} ONLINE`
                    });
                    
                    totalActive += count;
                    totalLimit += limit;
                    onlineServers++;
                } else {
                    serverStatus.push({
                        server: server.id,
                        name: server.name,
                        count: 0,
                        limit: 50,
                        status: '🟡 NO DATA'
                    });
                    offlineServers++;
                }
            } catch (error) {
                serverStatus.push({
                    server: server.id,
                    name: server.name,
                    count: 0,
                    limit: 50,
                    status: '🔴 OFFLINE'
                });
                offlineServers++;
            }
        }

        await react('✅');

        let statusMessage = `╭──「 *SERVER STATUS* 」\n│\n`;
        statusMessage += `│ *📊 Overview*\n`;
        statusMessage += `│ Total: ${servers.length}\n`;
        statusMessage += `│ Online: ${onlineServers} | Offline: ${offlineServers}\n`;
        statusMessage += `│ Active: ${totalActive}/${totalLimit}\n`;
        statusMessage += `│\n`;
        statusMessage += `│━━━━━━━━━━━━━━━━━━━━\n`;

        serverStatus.forEach((s) => {
            let statusIcon = s.status.split(' ')[0];
            let statusText = s.status.split(' ')[1];
            statusMessage += `│ ${s.name.padEnd(8)}: ${s.count.toString().padStart(2)}/${s.limit} ${statusIcon} ${statusText}\n`;
        });

        statusMessage += `╰─────────────────`;

        await reply(statusMessage);

    } catch (error) {
        console.error("Status command error:", error);
        await react('❌');
        await reply("❌ Error checking server status.");
    }
});
