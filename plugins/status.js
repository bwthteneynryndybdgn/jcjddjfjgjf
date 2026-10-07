// JawadTech

import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';
import { lidToPhone } from '../lib/functions.js';

const __filename = fileURLToPath(import.meta.url);

// Base API URL
const API_URL = 'https://kamranmd.zone.id/servers';
const CHREACT_KEY = 'drkamran823';

// Function to get status emoji based on count
function getCountStatus(count) {
    if (count === 50) return '🔴';
    if (count >= 40) return '🟣';
    if (count >= 30) return '🟡';
    if (count >= 20) return '🟠';
    if (count >= 10) return '🔵';
    return '🟢';
}

// Parse emojis
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

// Validate emojis format
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

// Parse server selection (supports #1/2/3, &5, &6+9 formats)
function parseServerSelection(input) {
    if (!input) return { type: 'all', servers: null };

    const specificMatch = input.match(/^#([\d\/]+)$/);
    if (specificMatch) {
        const numbers = specificMatch[1].split('/').map(n => parseInt(n)).filter(n => !isNaN(n) && n > 0);
        if (numbers.length > 0) {
            return { type: 'specific', servers: numbers };
        }
    }

    const firstMatch = input.match(/^&(\d+)$/);
    if (firstMatch) {
        const count = parseInt(firstMatch[1]);
        if (count > 0) {
            return { type: 'first', count: count };
        }
    }

    const rangeMatch = input.match(/^&(\d+)\+(\d+)$/);
    if (rangeMatch) {
        const start = parseInt(rangeMatch[1]);
        const end = parseInt(rangeMatch[2]);
        if (start > 0 && end > 0 && start <= end) {
            return { type: 'range', start: start, end: end };
        }
    }

    return { type: 'all', servers: null };
}

// Get servers based on selection
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

// Get server selection explanation
function getServerSelectionExplanation(selection, totalServers) {
    if (!selection || selection.type === 'all') return `🌐 *All ${totalServers} servers*`;
    if (selection.type === 'specific') return `🎯 *Specific servers:* #${selection.servers.join('/')}`;
    if (selection.type === 'first') return `🎯 *First ${selection.count} servers*`;
    if (selection.type === 'range') return `🎯 *Servers ${selection.start} to ${selection.end}*`;
    return `🌐 *All ${totalServers} servers*`;
}

// Validate channel post URL format
function isValidChannelPostUrl(url) {
    const pattern = /^https?:\/\/(?:www\.)?whatsapp\.com\/channel\/[a-zA-Z0-9]+\/\d+$/;
    return pattern.test(url);
}

// Extract channel ID and post ID from URL
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

// ==================== STATUS COMMAND ====================
cmd({
    pattern: "status2",
    alias: ["serverstatus", "stats2", "servers"],
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
                    serverStatus.push({ server: server.id, name: server.name, count, limit, status: `${statusEmoji} ONLINE` });
                    totalActive += count;
                    totalLimit += limit;
                    onlineServers++;
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

        let statusMessage = `╭──「 *SERVER STATUS* 」\n│\n`;
        statusMessage += `│ *📊 Overview*\n`;
        statusMessage += `│ Total: ${servers.length}\n`;
        statusMessage += `│ Online: ${onlineServers} | Offline: ${offlineServers}\n`;
        statusMessage += `│ Active: ${totalActive}/${totalLimit}\n`;
        statusMessage += `│\n│━━━━━━━━━━━━━━━━━━━━\n`;

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

// ==================== CHREACT COMMAND ====================
cmd({
    pattern: "chreact",
    alias: ["channelreact", "react2", "rp2"],
    react: "🎯",
    desc: "React to WhatsApp channel post with server selection",
    category: "group",
    use: ".chreact <channel_post_url> [emojis] [server_selection]",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) {
            return reply(`❌ *Please provide a channel post URL!*

📌 *Usage:* .chreact <url> [emojis] [selection]
*Examples:*
.chreact link ❤️,🔥 #1/2/3
.chreact link ❤️,🔥 &5`);
        }

        const url = args[0];
        if (!isValidChannelPostUrl(url)) {
            return reply(`❌ *Invalid URL format!*\n*Example:* https://whatsapp.com/channel/xxx/123`);
        }

        const ids = extractIdsFromUrl(url);
        if (!ids) return reply(`❌ *Failed to extract channel/post IDs from URL!*`);

        let emojis = [];
        let emojisString = '';
        let selection = null;

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
            return reply("❌ *Failed to fetch server list!*");
        }

        const servers = serversResponse.data.servers;
        if (servers.length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ *No servers found!*");
        }

        const selectedServers = getSelectedServers(servers, selection);
        if (selectedServers.length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(`❌ *No valid servers selected!*`);
        }

        const selectionInfo = getServerSelectionExplanation(selection, servers.length);
        const resultMessage = `✅ *Reactions sent successfully!*

📊 *Details:*
🎯 *Channel:* ${ids.channelId}
📝 *Post:* ${ids.postId}
😊 *Emojis:* ${validation.emojis.join(' ')}
🖥️ ${selectionInfo}

> *Powered By KAMRAN-MD*`;

        await reply(resultMessage);
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

        // ✅ Correct chreact URL format: {server.url}/chreact?key=...&url=...&emojis=...
        for (const server of selectedServers) {
            const reactUrl = `${server.url}/chreact?key=${CHREACT_KEY}&url=${encodeURIComponent(url)}&emojis=${encodeURIComponent(emojisString)}`;
            axios.get(reactUrl, { timeout: 5000 }).catch(() => {});
        }

    } catch (error) {
        console.error("React post error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ *Error processing request!*\n\n*Error:* ${error.message}`);
    }
});

// ==================== PAIR COMMAND ====================
cmd({
    pattern: "pair",
    alias: ["getpair", "clonebot"],
    react: "✅",
    desc: "Get pairing code for KAMRAN-MD bot",
    category: "owner",
    use: ".pair 923147168XXX",
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
                    if (convertedNumber) {
                        phoneNumber = convertedNumber.replace(/[^0-9]/g, '');
                    } else {
                        phoneNumber = senderNumber;
                    }
                } catch (e) {
                    phoneNumber = senderNumber;
                }
            } else {
                phoneNumber = senderNumber;
            }
        }

        if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 15) {
            await react('❌');
            return reply(`❌ Please provide a valid phone number without +\n\n📌 *Usage:* .pair 923427582XXX`);
        }

        const serversResponse = await axios.get(API_URL, { timeout: 10000 });

        if (!serversResponse.data || !serversResponse.data.servers) {
            await react('❌');
            return reply("❌ *Failed to fetch server list!*");
        }

        const servers = serversResponse.data.servers;

        if (servers.length === 0) {
            await react('❌');
            return reply("❌ *No servers available!*");
        }

        // 🔀 SHUFFLE THE SERVERS
        const shuffledServers = [...servers];
        for (let i = shuffledServers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledServers[i], shuffledServers[j]] = [shuffledServers[j], shuffledServers[i]];
        }

        // 🎯 PICK 1 RANDOM SERVER FROM SHUFFLED LIST
        const selectedServer = shuffledServers[0];
        const selectedServerUrl = selectedServer.url;

        console.log(`🎲 Randomly selected server: ${selectedServer.name} (${selectedServer.id})`);

        const response = await axios.get(`${selectedServerUrl}/code`, {
            params: { number: phoneNumber },
            timeout: 20000
        });

        if (!response.data || !response.data.code) {
            await react('❌');
            return reply("❌ Failed to retrieve pairing code. Please try again later.");
        }

        const pairingCode = response.data.code;

        await react('✅');
        await reply(`> *KAMRAN-MD PAIRING CODE*\n\n*Your pairing code is:* ${pairingCode}`);
        await reply(pairingCode);

    } catch (error) {
        console.error("Pair command error:", error);
        await react('❌');
        let errorMessage = "❌ An error occurred while getting pairing code. Please try again later.";
        if (error.response) errorMessage = `❌ Server error: ${error.response.status}`;
        else if (error.request) errorMessage = "❌ No response from server. Server might be offline.";
        await reply(errorMessage);
    }
});
