// plugins/viewonce.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);

const positiveKeywords = ["nice", "good", "cute", "🌝", "🥵", "💋", "👍", "🌚", "wow", "😩", "super"];

// Helper function to extract quoted message safely across different bot bases
function getQuotedMessage(m) {
    return m.quoted || m.msg?.contextInfo?.quotedMessage || null;
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
            let buffer;
            try {
                if (message.quoted && typeof message.quoted.download === 'function') {
                    buffer = await message.quoted.download();
                } else {
                    const type = Object.keys(quoted)[0];
                    const stream = await client.downloadContentFromMessage(quoted[type], type.replace('Message', '').toLowerCase());
                    let chunks = [];
                    for await (const chunk of stream) {
                        chunks.push(chunk);
                    }
                    buffer = Buffer.concat(chunks);
                }
            } catch (err) {
                console.error("Download error:", err);
                return;
            }

            if (!buffer) return;

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
                    ptt: quoted.audioMessage?.ptt || false
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

        let buffer;
        try {
            if (m.quoted && typeof m.quoted.download === 'function') {
                buffer = await m.quoted.download();
            } else {
                const type = Object.keys(quoted)[0];
                const stream = await client.downloadContentFromMessage(quoted[type], type.replace('Message', '').toLowerCase());
                let chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                buffer = Buffer.concat(chunks);
            }
        } catch (err) {
            console.error("Download error:", err);
        }

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
                ptt: quoted.audioMessage?.ptt || false
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

        let buffer;
        try {
            if (m.quoted && typeof m.quoted.download === 'function') {
                buffer = await m.quoted.download();
            } else {
                const type = Object.keys(quoted)[0];
                const stream = await client.downloadContentFromMessage(quoted[type], type.replace('Message', '').toLowerCase());
                let chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                buffer = Buffer.concat(chunks);
            }
        } catch (err) {
            console.error("Download error:", err);
        }

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
                ptt: quoted.audioMessage?.ptt || false
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

        let buffer;
        try {
            if (m.quoted && typeof m.quoted.download === 'function') {
                buffer = await m.quoted.download();
            } else {
                const type = Object.keys(quoted)[0];
                const stream = await client.downloadContentFromMessage(quoted[type], type.replace('Message', '').toLowerCase());
                let chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                buffer = Buffer.concat(chunks);
            }
        } catch (err) {
            console.error("Download error:", err);
        }

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
                ptt: quoted.audioMessage?.ptt || false
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
