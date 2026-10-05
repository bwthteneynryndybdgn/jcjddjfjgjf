// plugins/viewonce.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);

const positiveKeywords = ["nice", "good", "cute", "🌝", "🥵", "💋", "👍", "🌚", "wow", "😩", "super"];

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
        
        if (hasExactKeywordOnly && message.quoted) {
            const buffer = await message.quoted.download();
            const mtype = message.quoted.mtype;
            const originalCaption = message.quoted.text || '';
            const options = { quoted: message };

            let messageContent = {};
            switch (mtype) {
                case "imageMessage":
                    messageContent = {
                        image: buffer,
                        caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                        mimetype: message.quoted.mimetype || "image/jpeg"
                    };
                    break;
                case "videoMessage":
                    messageContent = {
                        video: buffer,
                        caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                        mimetype: message.quoted.mimetype || "video/mp4"
                    };
                    break;
                case "audioMessage":
                    messageContent = {
                        audio: buffer,
                        mimetype: message.quoted.mimetype || "audio/mp4",
                        ptt: message.quoted.ptt || false
                    };
                    break;
                default:
                    return;
            }

            await client.sendMessage(message.sender, messageContent, options);
        }
    } catch (error) {
        console.error("View Once Keyword Error:", error);
    }
});

cmd({
    pattern: "vv3",
    react: '🐳',
    desc: "Retrieve view once messages (Owner Only)",
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

        if (!m.quoted) {
            return await client.sendMessage(from, {
                text: "*🍁 Please reply to a view once or media message!*"
            }, { quoted: message });
        }

        const buffer = await m.quoted.download();
        const mtype = m.quoted.mtype;
        const originalCaption = m.quoted.text || '';
        const options = { quoted: message };

        let messageContent = {};
        switch (mtype) {
            case "imageMessage":
                messageContent = {
                    image: buffer,
                    caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                    mimetype: m.quoted.mimetype || "image/jpeg"
                };
                break;
            case "videoMessage":
                messageContent = {
                    video: buffer,
                    caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                    mimetype: m.quoted.mimetype || "video/mp4"
                };
                break;
            case "audioMessage":
                messageContent = {
                    audio: buffer,
                    mimetype: m.quoted.mimetype || "audio/mp4",
                    ptt: m.quoted.ptt || false
                };
                break;
            default:
                return await client.sendMessage(from, {
                    text: "❌ Only image, video, and audio messages are supported"
                }, { quoted: message });
        }

        await client.sendMessage(from, messageContent, options);
    } catch (error) {
        console.error("vv Error:", error);
        await client.sendMessage(from, {
            text: "❌ Error retrieving message:\n" + error.message
        }, { quoted: message });
    }
});

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

        if (!m.quoted) {
            return await client.sendMessage(from, {
                text: "*🍁 Please reply to a view once or media message!*"
            }, { quoted: message });
        }

        const buffer = await m.quoted.download();
        const mtype = m.quoted.mtype;
        const originalCaption = m.quoted.text || '';
        const options = { quoted: message };

        let messageContent = {};
        switch (mtype) {
            case "imageMessage":
                messageContent = {
                    image: buffer,
                    caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                    mimetype: m.quoted.mimetype || "image/jpeg"
                };
                break;
            case "videoMessage":
                messageContent = {
                    video: buffer,
                    caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                    mimetype: m.quoted.mimetype || "video/mp4"
                };
                break;
            case "audioMessage":
                messageContent = {
                    audio: buffer,
                    mimetype: m.quoted.mimetype || "audio/mp4",
                    ptt: m.quoted.ptt || false
                };
                break;
            default:
                return await client.sendMessage(from, {
                    text: "❌ Only image, video, and audio messages are supported"
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

        if (!m.quoted) {
            return await client.sendMessage(from, {
                text: "*🍁 Please reply to a view once or media message!*"
            }, { quoted: message });
        }

        const buffer = await m.quoted.download();
        const mtype = m.quoted.mtype;
        const originalCaption = m.quoted.text || '';
        const options = { quoted: message };

        let messageContent = {};
        switch (mtype) {
            case "imageMessage":
                messageContent = {
                    image: buffer,
                    caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                    mimetype: m.quoted.mimetype || "image/jpeg"
                };
                break;
            case "videoMessage":
                messageContent = {
                    video: buffer,
                    caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : `> ${DESCRIPTION}`,
                    mimetype: m.quoted.mimetype || "video/mp4"
                };
                break;
            case "audioMessage":
                messageContent = {
                    audio: buffer,
                    mimetype: m.quoted.mimetype || "audio/mp4",
                    ptt: m.quoted.ptt || false
                };
                break;
            default:
                return await client.sendMessage(from, {
                    text: "❌ Only image, video, and audio messages are supported"
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
