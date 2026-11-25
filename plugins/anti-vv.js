// plugins/anti-vv.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);

const positiveKeywords = ["nice", "good", "cute", "🌝", "🥵", "💋", "👍", "🌚", "wow", "😩", "super"];

const MEDIA_TYPE_MAP = {
    imageMessage: 'image',
    videoMessage: 'video',
    audioMessage: 'audio',
    ptvMessage: 'video',
    stickerMessage: 'sticker',
    documentMessage: 'document'
};

function unwrapMessageContainer(msg) {
    let curr = msg?.message || msg;
    while (curr && typeof curr === 'object') {
        if (curr.viewOnceMessage?.message) {
            curr = curr.viewOnceMessage.message;
        } else if (curr.viewOnceMessageV2?.message) {
            curr = curr.viewOnceMessageV2.message;
        } else if (curr.viewOnceMessageV2Extension?.message) {
            curr = curr.viewOnceMessageV2Extension.message;
        } else if (curr.ephemeralMessage?.message) {
            curr = curr.ephemeralMessage.message;
        } else if (curr.documentWithCaptionMessage?.message) {
            curr = curr.documentWithCaptionMessage.message;
        } else {
            break;
        }
    }
    return curr;
}

function getQuotedMessage(m) {
    const raw =
        m?.quoted?.message ||
        m?.quoted ||
        m?.msg?.contextInfo?.quotedMessage ||
        null;
    if (!raw) return null;
    return unwrapMessageContainer(raw);
}

function getMediaKeyAndContent(quoted) {
    const unwrapped = unwrapMessageContainer(quoted);
    if (!unwrapped || typeof unwrapped !== 'object') return null;

    for (const key of Object.keys(unwrapped)) {
        if (MEDIA_TYPE_MAP[key] && unwrapped[key]) {
            return {
                msgKey: key,
                mediaType: MEDIA_TYPE_MAP[key],
                content: unwrapped[key]
            };
        }
    }

    // Fallback if quoted itself is already the inner media content object
    if (quoted?.ptt !== undefined || quoted?.mimetype?.startsWith('audio/')) {
        return {
            msgKey: 'audioMessage',
            mediaType: 'audio',
            content: quoted
        };
    }

    return null;
}

function hasMediaLocator(content) {
    return Boolean(content && (content.url || content.directPath));
}

async function hydrateFromStores(m, client, currentResolved) {
    if (hasMediaLocator(currentResolved?.content)) {
        return currentResolved;
    }

    const stanzaId = m?.msg?.contextInfo?.stanzaId || m?.quoted?.id || m?.quoted?.key?.id;
    const chatJid = m?.quoted?.chat || m?.chat || m?.from;
    const storeCandidates = [client?.store, m?.store, globalThis?.store].filter(Boolean);

    for (const store of storeCandidates) {
        if (typeof store.loadMessage === 'function' && stanzaId && chatJid) {
            try {
                const storedMsg = await store.loadMessage(chatJid, stanzaId);
                const resolvedFromStore = getMediaKeyAndContent(storedMsg);
                if (hasMediaLocator(resolvedFromStore?.content)) {
                    return resolvedFromStore;
                }
            } catch (_) {
                // Continue checking other stores
            }
        }

        const chatMessages = store?.messages?.[chatJid];
        if (chatMessages && stanzaId) {
            const candidate =
                typeof chatMessages.get === 'function'
                    ? chatMessages.get(stanzaId)
                    : chatMessages[stanzaId];
            const resolvedFromCache = getMediaKeyAndContent(candidate);
            if (hasMediaLocator(resolvedFromCache?.content)) {
                return resolvedFromCache;
            }
        }
    }

    return currentResolved;
}

async function downloadMediaBuffer(quoted, m, client) {
    try {
        const resolved = await hydrateFromStores(m, client, getMediaKeyAndContent(quoted));

        if (hasMediaLocator(resolved?.content) && m?.quoted && typeof m.quoted.download === 'function') {
            try {
                const buf = await m.quoted.download();
                if (buf && buf.length > 0) return buf;
            } catch (err) {
                const msg = String(err?.message || '');
                if (!msg.includes('No valid media URL or directPath')) {
                    throw err;
                }
            }
        }

        if (!hasMediaLocator(resolved?.content)) {
            return null;
        }

        const stream = await downloadContentFromMessage(resolved.content, resolved.mediaType);
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        return buffer.length > 0 ? buffer : null;
    } catch (err) {
        const msg = String(err?.message || '');
        if (msg.includes('No valid media URL or directPath')) {
            return null;
        }
        console.error("Download Buffer Error:", err);
        return null;
    }
}

async function sendRetrievedMedia({
    client,
    targetJid,
    replyJid,
    triggerMsg,
    contextSource,
    userConfig,
    missingQuoteText = "*🍁 Please reply to a view once or media message!*",
    unsupportedText = "❌ Only image, video, and audio/voice messages are supported"
}) {
    const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";
    const quoted = getQuotedMessage(contextSource);

    if (!quoted) {
        return await client.sendMessage(replyJid, {
            text: missingQuoteText
        }, { quoted: triggerMsg });
    }

    let resolved = getMediaKeyAndContent(quoted);
    if (!resolved) {
        return await client.sendMessage(replyJid, {
            text: unsupportedText
        }, { quoted: triggerMsg });
    }

    resolved = await hydrateFromStores(contextSource, client, resolved);

    const buffer = await downloadMediaBuffer(quoted, contextSource, client);
    if (!buffer || buffer.length === 0) {
        return await client.sendMessage(replyJid, {
            text: "❌ *Media download karne me asamarth! (No media URL/directPath)*"
        }, { quoted: triggerMsg });
    }

    const originalCaption =
        contextSource?.quoted?.text ||
        resolved.content?.caption ||
        '';

    const options = { quoted: triggerMsg };
    let messageContent = {};

    if (resolved.mediaType === "image") {
        messageContent = {
            image: buffer,
            caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
            mimetype: resolved.content?.mimetype || "image/jpeg"
        };
    } else if (resolved.mediaType === "video") {
        messageContent = {
            video: buffer,
            caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
            mimetype: resolved.content?.mimetype || "video/mp4"
        };
    } else if (resolved.mediaType === "audio") {
        messageContent = {
            audio: buffer,
            mimetype: resolved.content?.mimetype || "audio/ogg; codecs=opus",
            ptt: resolved.content?.ptt !== undefined ? Boolean(resolved.content.ptt) : true
        };
    } else {
        return await client.sendMessage(replyJid, {
            text: unsupportedText
        }, { quoted: triggerMsg });
    }

    await client.sendMessage(targetJid, messageContent, options);
}

// No prefix keyword handler for view once messages (owner only)
cmd({
    'on': "body"
}, async (client, message, m, {
    from,
    body,
    isCreator,
    userConfig
}) => {
    try {
        if (!isCreator) return;

        const messageText = (body || "").trim().toLowerCase();
        const hasExactKeywordOnly = positiveKeywords.includes(messageText);
        if (!hasExactKeywordOnly) return;

        const source = getQuotedMessage(m) ? m : message;
        if (!getQuotedMessage(source)) return;

        await sendRetrievedMedia({
            client,
            targetJid: message.sender || from,
            replyJid: from,
            triggerMsg: message,
            contextSource: source,
            userConfig
        });
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

        const source = getQuotedMessage(m) ? m : message;
        await sendRetrievedMedia({
            client,
            targetJid: from,
            replyJid: from,
            triggerMsg: message,
            contextSource: source,
            userConfig
        });
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

        const source = getQuotedMessage(m) ? m : message;
        await sendRetrievedMedia({
            client,
            targetJid: from,
            replyJid: from,
            triggerMsg: message,
            contextSource: source,
            userConfig
        });
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

        const source = getQuotedMessage(m) ? m : message;
        await sendRetrievedMedia({
            client,
            targetJid: message.sender || from,
            replyJid: from,
            triggerMsg: message,
            contextSource: source,
            userConfig
        });
    } catch (error) {
        console.error("vv2 Error:", error);
        await client.sendMessage(from, {
            text: "❌ Error fetching message:\n" + error.message
        }, { quoted: message });
    }
});
