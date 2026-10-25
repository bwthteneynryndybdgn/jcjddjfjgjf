//---------------------------------------------------------------------------
//           KAMRAN-MD - SERVER MANAGEMENT & UTILITIES PLUGIN
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import { lidToPhone } from '../lib/functions.js';

const __filename = fileURLToPath(import.meta.url);

// Base API URL
const API_URL = 'http://kamranmd.zone.id/servers';
const CHREACT_KEY = 'drkamran823';

// Helper function for Stylist Badi ABC Text
const toStylistUpper = (text) => {
    if (!text || typeof text !== 'string') return '';
    const uppercaseMap = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
        'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
        's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
        'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ғ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ',
        'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ',
        'S': 's', 'T': 'ᴛ', 'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ'
    };
    return text.split('').map(char => uppercaseMap[char] || char).join('');
};

// ==================== HELPER FUNCTIONS ====================

function getCountStatus(count) {
    if (count === 50) return '🔴';
    if (count >= 40) return '🟣';
    if (count >= 30) return '🟡';
    if (count >= 20) return '🟠';
    if (count >= 10) return '🔵';
    return '🟢';
}

function parseEmojis(input) {
    let emojis = [];
    const parts = input.split(',').map(p => p.trim()).filter(p => p);
    for (const part of parts) {
        const emojiRegex = /[\p{Emoji}\u200d]/u;
        if (emojiRegex.test(part)) emojis.push(part);
    }
    return emojis;
}

function validateEmojis(emojis) {
    if (!emojis || emojis.length === 0) {
        return { valid: false, error: `❌ *${toStylistUpper('No valid emojis found!')}*\n*${toStylistUpper('Example')}:* .chreact https://whatsapp.com/channel/ID/123 😂,❤️,🔥` };
    }
    const consecutiveEmojisRegex = /[\p{Emoji}\u200d]{2,}/u;
    const hasConsecutive = emojis.some(e => consecutiveEmojisRegex.test(e));
    if (hasConsecutive) {
        return { valid: false, error: `❌ *${toStylistUpper('Invalid format! Please separate all emojis with commas')}*\n*${toStylistUpper('Example')}:* .chreact link 😂,❤️,🔥,👏,😮` };
    }
    return { valid: true, emojis };
}

function parseServerSelection(input) {
    if (!input) return { type: 'all', servers: null };
    const specificMatch = input.match(/^#([\d\/]+)$/);
    if (specificMatch) {
        const numbers = specificMatch[1].split('/').map(n => parseInt(n)).filter(n => !isNaN(n) && n > 0);
        if (numbers.length > 0) return { type: 'specific', servers: numbers };
    }
    const firstMatch = input.match(/^&(\d+)$/);
    if (firstMatch) {
        const count = parseInt(firstMatch[1]);
        if (count > 0) return { type: 'first', count: count };
    }
    const rangeMatch = input.match(/^&(\d+)\+(\d+)$/);
    if (rangeMatch) {
        const start = parseInt(rangeMatch[1]);
        const end = parseInt(rangeMatch[2]);
        if (start > 0 && end > 0 && start <= end) return { type: 'range', start: start, end: end };
    }
    return { type: 'all', servers: null };
}

function getSelectedServers(servers, selection) {
    if (!selection || selection.type === 'all') return servers;
    if (selection.type === 'specific') {
        const selected = [];
        for (const num of selection.servers) {
            if (num <= servers.length) selected.push(servers[num - 1]);
        }
        return selected;
    }
    if (selection.type === 'first') return servers.slice(0, selection.count);
    if (selection.type === 'range') {
        const start = Math.max(0, selection.start - 1);
        const end = Math.min(servers.length, selection.end);
        return servers.slice(start, end);
    }
    return servers;
}

function getServerSelectionExplanation(selection, totalServers) {
    if (!selection || selection.type === 'all') return `🌐 *${toStylistUpper('All')} ${totalServers} ${toStylistUpper('servers')}*`;
    if (selection.type === 'specific') return `🎯 *${toStylistUpper('Specific servers')}:* #${selection.servers.join('/')}`;
    if (selection.type === 'first') return `🎯 *${toStylistUpper('First')} ${selection.count} ${toStylistUpper('servers')}*`;
    if (selection.type === 'range') return `🎯 *${toStylistUpper('Servers')} ${selection.start} ${toStylistUpper('to')} ${selection.end}*`;
    return `🌐 *${toStylistUpper('All')} ${totalServers} ${toStylistUpper('servers')}*`;
}

function isValidChannelPostUrl(url) {
    const pattern = /^https?:\/\/(?:www\.)?whatsapp\.com\/channel\/[a-zA-Z0-9]+\/\d+$/;
    return pattern.test(url);
}

function extractIdsFromUrl(url) {
    const match = url.match(/\/channel\/([a-zA-Z0-9]+)\/(\d+)/);
    if (match) {
        return { channelId: match[1], postId: match[2] };
    }
    return null;
}

// ==================== STATUS COMMAND ====================
cmd({
    pattern: "status64",
    alias: ["serverstatus64", "stats64", "servers65"],
    react: "📊",
    desc: "Check server status and active users",
    category: "owner",
    use: ".status",
    filename: __filename
}, async (conn, mek, m, { from, reply, react }) => {
    try {
        await react('⏳');
        const serversResponse = await axios.get(API_URL, { timeout: 10000 });
        if (!serversResponse.data || !serversResponse.data.servers) {
            await react('❌');
            return reply(`❌ *${toStylistUpper('Failed to fetch server list.')}*`);
        }
        const servers = serversResponse.data.servers;
        let serverStatus = [];
        let totalActive = 0, totalLimit = 0, onlineServers = 0, offlineServers = 0;

        for (let i = 0; i < servers.length; i++) {
            const server = servers[i];
            try {
                const statusResponse = await axios.get(`${server.url}/active`, { timeout: 8000 });
                if (statusResponse.data && !statusResponse.data.error) {
                    const count = statusResponse.data.count || 0;
                    const limit = statusResponse.data.limit || 50;
                    const statusEmoji = getCountStatus(count);
                    serverStatus.push({ server: server.id, name: server.name, count, limit, status: `${statusEmoji} ONLINE` });
                    totalActive += count; totalLimit += limit; onlineServers++;
                } else {
                    serverStatus.push({ server: server.id, name: server.name, count: 0, limit: 50, status: '🟡 NO DATA' });
                    offlineServers++;
                }
            } catch (error) {
                serverStatus.push({ server: server.id, name: server.name, count: 0, limit: 50, status: '🔴 OFFLINE' });
                offlineServers++;
            }
        }

        await react('✅');
        let statusMessage = `❖ ── ✦ *${toStylistUpper('Server Status')}* ✦ ── ❖\n\n`;
        statusMessage += `╔═════ ⌈ *⚡ ${toStylistUpper('Overview')}* ⌋ ═════✧\n`;
        statusMessage += `║ 📊 *${toStylistUpper('Total')}:* ${servers.length}\n`;
        statusMessage += `║ 🟢 *${toStylistUpper('Online')}:* ${onlineServers} | 🔴 *${toStylistUpper('Offline')}:* ${offlineServers}\n`;
        statusMessage += `║ ⚡ *${toStylistUpper('Active')}:* ${totalActive}/${totalLimit}\n`;
        statusMessage += `╚══════════════════════✧\n\n`;
        statusMessage += `╔═════ ⌈ *📂 ${toStylistUpper('Server List')}* ⌋ ═════✧\n`;

        serverStatus.forEach((s, idx) => {
            let statusIcon = s.status.split(' ')[0];
            let statusText = s.status.split(' ')[1];
            statusMessage += `║ ${s.name.padEnd(8)}: ${s.count.toString().padStart(2)}/${s.limit} ${statusIcon} ${statusText}\n`;
            if (idx !== serverStatus.length - 1) statusMessage += `║─────────────────────║\n`;
        });

        statusMessage += `╚══════════════════════✧\n\n`;
        statusMessage += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

        await conn.sendMessage(from, { 
            text: statusMessage,
            contextInfo: { mentionedJid: [mek.sender] }
        }, { quoted: mek });

    } catch (error) {
        console.error("Status command error:", error);
        await react('❌');
        await reply(`❌ *${toStylistUpper('Error checking server status.')}*`);
    }
});

// ==================== CHREACT COMMAND ====================
cmd({
    pattern: "chreact63",
    alias: ["channelreact65", "react75", "rp54"],
    react: "🎯",
    desc: "React to WhatsApp channel post with server selection",
    category: "group",
    use: ".chreact <channel_post_url> [emojis] [server_selection]",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) return reply(`❌ *${toStylistUpper('Please provide a channel post URL!')}*\n\n📌 *${toStylistUpper('Usage')}:* .chreact <url> [emojis] [selection]`);

        const url = args[0];
        if (!isValidChannelPostUrl(url)) return reply(`❌ *${toStylistUpper('Invalid URL format!')}*`);

        const ids = extractIdsFromUrl(url);
        if (!ids) return reply(`❌ *${toStylistUpper('Failed to extract channel/post IDs from URL!')}*`);

        let emojis = [], emojisString = '', selection = null;
        const remainingArgs = args.slice(1);
        let emojiArgs = [];

        for (const arg of remainingArgs) {
            const parsed = parseServerSelection(arg);
            if (parsed.type !== 'all') selection = parsed;
            else emojiArgs.push(arg);
        }

        if (emojiArgs.length > 0) {
            const emojiText = emojiArgs.join(' ');
            emojis = parseEmojis(emojiText);
            emojisString = emojis.join(',');
        }

        if (!emojisString) {
            emojis = ['❤️', '👍', '🔥'];
            emojisString = emojis.join(',');
        }

        const validation = validateEmojis(emojis);
        if (!validation.valid) return reply(validation.error);

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        const serversResponse = await axios.get(API_URL, { timeout: 10000 });
        if (!serversResponse.data || !serversResponse.data.servers) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(`❌ *${toStylistUpper('Failed to fetch server list!')}*`);
        }

        const servers = serversResponse.data.servers;
        if (servers.length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(`❌ *${toStylistUpper('No servers found!')}*`);
        }

        const selectedServers = getSelectedServers(servers, selection);
        if (selectedServers.length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(`❌ *${toStylistUpper('No valid servers selected!')}*`);
        }

        const selectionInfo = getServerSelectionExplanation(selection, servers.length);
        
        let resultMessage = `❖ ── ✦ *${toStylistUpper('Reactions Sent')}* ✦ ── ❖\n\n`;
        resultMessage += `╔═════ ⌈ *⚡ ${toStylistUpper('Details')}* ⌋ ═════✧\n`;
        resultMessage += `║ 🎯 *${toStylistUpper('Channel')}:* ${ids.channelId}\n`;
        resultMessage += `║ 📝 *${toStylistUpper('Post')}:* ${ids.postId}\n`;
        resultMessage += `║ 😊 *${toStylistUpper('Emojis')}:* ${validation.emojis.join(' ')}\n`;
        resultMessage += `║ 🖥️ ${selectionInfo}\n`;
        resultMessage += `╚══════════════════════✧\n\n`;
        resultMessage += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

        await reply(resultMessage);
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

        for (const server of selectedServers) {
            const reactUrl = `${server.url}/chreact?key=${CHREACT_KEY}&url=${encodeURIComponent(url)}&emojis=${encodeURIComponent(emojisString)}`;
            axios.get(reactUrl, { timeout: 5000 }).catch(() => {});
        }

    } catch (error) {
        console.error("React post error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ *${toStylistUpper('Error processing request')}!*\n\n*Error:* ${error.message}`);
    }
});

// ==================== PAIR COMMAND ====================
cmd({
    pattern: "pair64",
    alias: ["getpair64", "clonebot64"],
    react: "✅",
    desc: "Get pairing code for KAMRAN-MD bot",
    category: "owner",
    use: ".pair 923427582XXX",
    filename: __filename
}, async (conn, mek, m, { from, args, sender, senderNumber, reply, react }) => {
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
            return reply(`❌ *${toStylistUpper('Please provide a valid phone number without +')}*\n\n📌 *${toStylistUpper('Example')}:* .pair 923427582XXX`);
        }

        const serversResponse = await axios.get(API_URL, { timeout: 10000 });
        if (!serversResponse.data || !serversResponse.data.servers) {
            await react('❌');
            return reply(`❌ *${toStylistUpper('Failed to fetch server list!')}*`);
        }
        const servers = serversResponse.data.servers;
        if (servers.length === 0) {
            await react('❌');
            return reply(`❌ *${toStylistUpper('No servers available!')}*`);
        }

        const shuffledServers = [...servers];
        for (let i = shuffledServers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledServers[i], shuffledServers[j]] = [shuffledServers[j], shuffledServers[i]];
        }

        const selectedServer = shuffledServers[0];
        const response = await axios.get(`${selectedServer.url}/code`, {
            params: { number: phoneNumber },
            timeout: 20000
        });

        if (!response.data || !response.data.code) {
            await react('❌');
            return reply(`❌ *${toStylistUpper('Failed to retrieve pairing code. Please try again later.')}*`);
        }

        const pairingCode = response.data.code;
        await react('✅');
        
        let pairMsg = `❖ ── ✦ *${toStylistUpper('Kamran-Md Pairing Code')}* ✦ ── ❖\n\n`;
        pairMsg += `╔═════ ⌈ *⚡ ${toStylistUpper('Code Info')}* ⌋ ═════✧\n`;
        pairMsg += `║ 🔑 *${toStylistUpper('Pairing Code')}:* \`${pairingCode}\`\n`;
        pairMsg += `╚══════════════════════✧\n\n`;
        pairMsg += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

        await reply(pairMsg);
        await reply(pairingCode);

    } catch (error) {
        console.error("Pair command error:", error);
        await react('❌');
        let errorMessage = `❌ *${toStylistUpper('An error occurred while getting pairing code. Please try again later.')}*`;
        if (error.response) errorMessage = `❌ Server error: ${error.response.status}`;
        else if (error.request) errorMessage = `❌ *${toStylistUpper('No response from server. Server might be offline.')}*`;
        await reply(errorMessage);
    }
});

// ==================== VOTE COMMAND ====================
cmd({
    pattern: "vote",
    alias: ["chvote", "pollvote"],
    react: "🗳️",
    desc: "Vote on WhatsApp channel poll with server selection",
    category: "group",
    use: ".vote <channel_post_url> <option> [server_selection]",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) {
            return reply(`❌ *${toStylistUpper('Please provide a channel post URL!')}*

📌 *${toStylistUpper('Usage')}:* .vote <url> <option> [selection]
*${toStylistUpper('Examples')}:*
.vote https://whatsapp.com/channel/xxx/107 1
.vote https://whatsapp.com/channel/xxx/107 1 #1/2/3`);
        }

        const url = args[0];
        if (!isValidChannelPostUrl(url)) return reply(`❌ *${toStylistUpper('Invalid URL format!')}*\n*Example:* https://whatsapp.com/channel/xxx/123`);

        const ids = extractIdsFromUrl(url);
        if (!ids) return reply(`❌ *${toStylistUpper('Failed to extract channel/post IDs from URL!')}*`);

        const option = args[1];
        if (!option) return reply(`❌ *${toStylistUpper('Please provide an option!')}*\n*Example:* .vote <url> 1`);

        let selection = null;
        if (args[2]) {
            const parsed = parseServerSelection(args[2]);
            if (parsed.type !== 'all') selection = parsed;
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const serversResponse = await axios.get(API_URL, { timeout: 10000 });
        if (!serversResponse.data || !serversResponse.data.servers) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(`❌ *${toStylistUpper('Failed to fetch server list!')}*`);
        }

        const servers = serversResponse.data.servers;
        if (servers.length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(`❌ *${toStylistUpper('No servers found!')}*`);
        }

        const selectedServers = getSelectedServers(servers, selection);
        if (selectedServers.length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(`❌ *${toStylistUpper('No valid servers selected!')}*`);
        }

        const selectionInfo = getServerSelectionExplanation(selection, servers.length);
        
        let resultMessage = `❖ ── ✦ *${toStylistUpper('Vote Sent Successfully')}* ✦ ── ❖\n\n`;
        resultMessage += `╔═════ ⌈ *⚡ ${toStylistUpper('Details')}* ⌋ ═════✧\n`;
        resultMessage += `║ 🎯 *${toStylistUpper('Channel')}:* ${ids.channelId}\n`;
        resultMessage += `║ 📝 *${toStylistUpper('Post')}:* ${ids.postId}\n`;
        resultMessage += `║ 🗳️ *${toStylistUpper('Option')}:* ${option}\n`;
        resultMessage += `║ 🖥️ ${selectionInfo}\n`;
        resultMessage += `╚══════════════════════✧\n\n`;
        resultMessage += `> 💫 _${toStylistUpper('Powered by Kamran-Md')}_`;

        await reply(resultMessage);
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

        for (const server of selectedServers) {
            const voteUrl = `${server.url}/vote?key=${CHREACT_KEY}&url=${encodeURIComponent(url)}&option=${encodeURIComponent(option)}`;
            axios.get(voteUrl, { timeout: 5000 }).catch(() => {});
        }

    } catch (error) {
        console.error("Vote command error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ *${toStylistUpper('Error processing request')}!*\n\n*Error:* ${error.message}`);
    }
});
