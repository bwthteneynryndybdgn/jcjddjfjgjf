// plugins/channel_forward.js
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);

// Helper for Stylish Text
const toStylistUpper = (text) => {
    if (!text || typeof text !== 'string') return '';
    const map = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
        'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
        's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    };
    return text.split('').map(char => map[char.toLowerCase()] || char).join('');
};

cmd({
    pattern: "fxorward",
    alias: ["chforward", "sendch", "fwd"],
    react: '📢',
    desc: "Forward media to your WhatsApp Channel",
    category: "channel",
    filename: __filename
}, async (client, message, m, { from, prefix, command, q, isCreator }) => {
    
    // 1. Check if user is replying to a message
    if (!message.quoted) {
        return await client.sendMessage(from, {
            text: `❌ *${toStylistUpper('Please reply to a photo, video, or voice note!')}*\n\n*${toStylistUpper('Example')}:*\n1. Send/Forward a video to bot\n2. Reply to it with ${prefix + command}`
        }, { quoted: message });
    }

    try {
        // React: Processing
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        // 2. Get Channel ID from Config (Important: User must set this in config.js)
        // Agar config mein CHANNEL_ID nahi hai, toh error dega
        const channelId = config.CHANNEL_ID || "120363418144382782@newsletter"; // Default fallback
        
        // 3. Prepare the message to forward
        // Hum quoted message ke content ko copy karke channel par bhejenge
        const quotedMsg = message.quoted;
        
        // Message type detect karna (Image, Video, Audio, Document)
        let messageType = quotedMsg.mtype;
        
        // Caption agar text hai toh
        let captionText = quotedMsg.caption || "";
        if(captionText) {
            captionText += `\n\n> 📢 _Forwarded via ${config.BOT_NAME || 'Bot'}_`;
        } else {
            captionText = `> 📢 _Forwarded via ${config.BOT_NAME || 'Bot'}_`;
        }

        // 4. Send to Channel based on Type
        let sendOptions = {
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: channelId,
                    newsletterName: config.BOT_NAME || "Channel Name",
                    serverMessageId: 1
                }
            }
        };

        if (messageType.includes('image')) {
            await client.sendMessage(channelId, {
                image: await quotedMsg.download(),
                caption: captionText,
                ...sendOptions
            });
        } 
        else if (messageType.includes('video')) {
            await client.sendMessage(channelId, {
                video: await quotedMsg.download(),
                caption: captionText,
                mimetype: 'video/mp4',
                ...sendOptions
            });
        } 
        else if (messageType.includes('audio')) {
            await client.sendMessage(channelId, {
                audio: await quotedMsg.download(),
                mimetype: 'audio/mp4',
                ptt: false, // Voice note as audio file
                ...sendOptions
            });
        } 
        else if (messageType.includes('ptv')) { 
             // PTV means View Once Video or Voice Note usually
             await client.sendMessage(channelId, {
                audio: await quotedMsg.download(),
                mimetype: 'audio/mp4',
                ptt: true, // Voice note style
                ...sendOptions
            });
        }
        else if (messageType.includes('document')) {
            await client.sendMessage(channelId, {
                document: await quotedMsg.download(),
                mimetype: quotedMsg.mimetype,
                fileName: quotedMsg.fileName || "File",
                caption: captionText,
                ...sendOptions
            });
        }
        else {
            // For simple text messages
            await client.sendMessage(channelId, {
                text: `${quotedMsg.text}\n\n> 📢 _Forwarded via Bot_`,
                ...sendOptions
            });
        }

        // Success Reaction & Reply
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
        await client.sendMessage(from, {
            text: `✅ *${toStylistUpper('Successfully forwarded to Channel!')}*`
        }, { quoted: message });

    } catch (error) {
        console.error("Channel Forward Error:", error);
        await client.sendMessage(from, {
            text: `❌ *${toStylistUpper('Error forwarding')}:*\nMake sure I am an admin in the channel and CHANNEL_ID is set in config.`
        }, { quoted: message });
    }
});
