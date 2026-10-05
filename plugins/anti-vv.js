// plugins/viewonce.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);

const positiveKeywords = ["nice", "good", "cute", "🌝", "🥵", "💋", "👍", "🌚", "wow", "😩", "super"];

// Helper function to extract quoted message safely across different bot bases
function getQuotedMessage(m) {
    return m.quoted || m.msg?.contextInfo?.quotedMessage || null;
}

// Universal media downloader helper function
async function downloadMediaBuffer(quoted, m) {
    try {
        if (m.quoted && typeof m.quoted.download === 'function') {
            return await m.quoted.download();
        }
        
        const type = Object.keys(quoted)[0];
        let content = quoted[type];
        if (content && content.message) {
            content = content.message[Object.keys(content.message)[0]];
        }
        
        let dataType = type.replace('Message', '').toLowerCase();
        if (dataType === 'audio' || dataType === 'ptt') {
            dataType = 'audio';
        }

        const stream = await downloadContentFromMessage(content, dataType);
        let chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    } catch (err) {
        console.error("Download Buffer Error:", err);
        return null;
    }
}

// No prefix keyword handler for view once messages (owner only)
cmd({
    'on': "body"
}, async (client, message, m, {
    from,
    body,
    isCreator,
    reply,
    sender,
    userConfig
}) => {
    try {
        if (!isCreator) return;

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";
        const messageText = body.trim().toLowerCase();
        const hasExactKeywordOnly = positiveKeywords.includes(messageText);
        
        const quoted = getQuotedMessage(message);
        if (hasExactKeywordOnly && quoted) {
            const buffer = await downloadMediaBuffer(quoted, message);
            if (!buffer || buffer.length === 0) return;

            const mtype = message.quoted?.mtype || Object.keys(quoted)[0];
            const originalCaption = message.quoted?.text || quoted[Object.keys(quoted)[0]]?.caption || '';
            const options = { quoted: message };

            let messageContent = {};
            if (mtype.includes("image")) {
                messageContent = {
                    image: buffer,
                    caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                    mimetype: "image/jpeg"
                };
            } else if (mtype.includes("video")) {
                messageContent = {
                    video: buffer,
                    caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                    mimetype: "video/mp4"
                };
            } else if (mtype.includes("audio") || mtype.includes("ptt")) {
                messageContent = {
                    audio: buffer,
                    mimetype: "audio/mp4",
                    ptt: quoted.audioMessage?.ptt || quoted.ptt || false
                };
            } else {
                return;
            }

            await client.sendMessage(message.sender, messageContent, options);
        }
    } catch (error) {
        console.error("View Once Keyword Error:", error);
    }
});

// Command handler for manual retrieval (vv3)
cmd({
    pattern: "vv3",
    react: '🐳',
    desc: "Retrieve view once or media messages (Owner Only)",
    category: "owner",
    filename: __filename
}, async (client, message, m, {
    from,
    isCreator,
    userConfig
}) => {
    try {
        if (!isCreator) return;

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";
        const quoted = getQuotedMessage(m);

        if (!quoted) {
            return await client.sendMessage(from, {
                text: "*🍁 Please reply to a view once or media message!*"
            }, { quoted: message });
        }

        const buffer = await downloadMediaBuffer(quoted, m);

        if (!buffer || buffer.length === 0) {
            return await client.sendMessage(from, { text: "❌ *Media download karne me asamarth!*" }, { quoted: message });
        }

        const mtype = m.quoted?.mtype || Object.keys(quoted)[0];
        const originalCaption = m.quoted?.text || quoted[Object.keys(quoted)[0]]?.caption || '';
        const options = { quoted: message };

        let messageContent = {};
        if (mtype.includes("image")) {
            messageContent = {
                image: buffer,
                caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                mimetype: "image/jpeg"
            };
        } else if (mtype.includes("video")) {
            messageContent = {
                video: buffer,
                caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                mimetype: "video/mp4"
            };
        } else if (mtype.includes("audio") || mtype.includes("ptt")) {
            messageContent = {
                audio: buffer,
                mimetype: "audio/mp4",
                ptt: quoted.audioMessage?.ptt || quoted.ptt || false
            };
        } else {
            return await client.sendMessage(from, {
                text: "❌ Only image, video, and audio/voice messages are supported"
            }, { quoted: message });
        }

        await client.sendMessage(from, messageContent, options);
    } catch (error) {
        console.error("vv3 Error:", error);
        await client.sendMessage(from, {
            text: "❌ Error retrieving message:\n" + error.message
        }, { quoted: message });
    }
});

// ==================== VV COMMAND ====================
cmd({
    pattern: "vv",
    alias: ["viewonce", 'retrive'],
    react: '🐳',
    desc: "Owner Only - retrieve quoted message back to user",
    category: "owner",
    filename: __filename
}, async (client, message, m, { 
    from, 
    isCreator,
    userConfig
}) => {
    try {
        if (!isCreator) {
            return await client.sendMessage(from, {
                text: "*📛 This is an owner command.*"
            }, { quoted: message });
        }

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";
        const quoted = getQuotedMessage(m);

        if (!quoted) {
            return await client.sendMessage(from, {
                text: "*🍁 Please reply to a view once or media message!*"
            }, { quoted: message });
        }

        const buffer = await downloadMediaBuffer(quoted, m);

        if (!buffer || buffer.length === 0) {
            return await client.sendMessage(from, { text: "❌ *Media download karne me asamarth!*" }, { quoted: message });
        }

        const mtype = m.quoted?.mtype || Object.keys(quoted)[0];
        const originalCaption = m.quoted?.text || quoted[Object.keys(quoted)[0]]?.caption || '';
        const options = { quoted: message };

        let messageContent = {};
        if (mtype.includes("image")) {
            messageContent = {
                image: buffer,
                caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                mimetype: "image/jpeg"
            };
        } else if (mtype.includes("video")) {
            messageContent = {
                video: buffer,
                caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                mimetype: "video/mp4"
            };
        } else if (mtype.includes("audio") || mtype.includes("ptt")) {
            messageContent = {
                audio: buffer,
                mimetype: "audio/mp4",
                ptt: quoted.audioMessage?.ptt || quoted.ptt || false
            };
        } else {
            return await client.sendMessage(from, {
                text: "❌ Only image, video, and audio/voice messages are supported"
            }, { quoted: message });
        }

        await client.sendMessage(from, messageContent, options);
    } catch (error) {
        console.error("vv Error:", error);
        await client.sendMessage(from, {
            text: "❌ Error fetching message:\n" + error.message
        }, { quoted: message });
    }
});

// ==================== VV2 COMMAND ====================
cmd({
    pattern: "vv2",
    alias: ["wah", "ohh", "oho", "🙂", "😂", "❤️", "💋", "🥵", "🌚", "😒", "nice", "ok"],
    desc: "Owner Only - retrieve quoted message back to user",
    category: "owner",
    filename: __filename
}, async (client, message, m, { 
    from, 
    isCreator,
    userConfig
}) => {
    try {
        if (!isCreator) return;

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";
        const quoted = getQuotedMessage(m);

        if (!quoted) {
            return await client.sendMessage(from, {
                text: "*🍁 Please reply to a view once or media message!*"
            }, { quoted: message });
        }

        const buffer = await downloadMediaBuffer(quoted, m);

        if (!buffer || buffer.length === 0) {
            return await client.sendMessage(from, { text: "❌ *Media download karne me asamarth!*" }, { quoted: message });
        }

        const mtype = m.quoted?.mtype || Object.keys(quoted)[0];
        const originalCaption = m.quoted?.text || quoted[Object.keys(quoted)[0]]?.caption || '';
        const options = { quoted: message };

        let messageContent = {};
        if (mtype.includes("image")) {
            messageContent = {
                image: buffer,
                caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                mimetype: "image/jpeg"
            };
        } else if (mtype.includes("video")) {
            messageContent = {
                video: buffer,
                caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                mimetype: "video/mp4"
            };
        } else if (mtype.includes("audio") || mtype.includes("ptt")) {
            messageContent = {
                audio: buffer,
                mimetype: "audio/mp4",
                ptt: quoted.audioMessage?.ptt || quoted.ptt || false
            };
        } else {
            return await client.sendMessage(from, {
                text: "❌ Only image, video, and audio/voice messages are supported"
            }, { quoted: message });
        }

        await client.sendMessage(message.sender, messageContent, options);
    } catch (error) {
        console.error("vv Error:", error);
        await client.sendMessage(from, {
            text: "❌ Error fetching message:\n" + error.message
        }, { quoted: message });
    }
});
