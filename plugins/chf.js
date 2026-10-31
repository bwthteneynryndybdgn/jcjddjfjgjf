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
    pattern: "forward",
    alias: ["chforward", "sendch", "fwd"],
    react: '📢',
    desc: "Forward media to any WhatsApp Channel",
    category: "channel",
    filename: __filename
}, async (client, message, m, { from, prefix, command, args, q, isCreator }) => {
    
    // 1. Check if user replied to a message
    if (!message.quoted) {
        return await client.sendMessage(from, {
            text: `❌ *${toStylistUpper('Reply to a photo/video/voice!')}*\n\n*${toStylistUpper('How to use')}:*\n1. Send media to bot\n2. Reply with: ${prefix + command} <channel_id>\n\n*${toStylistUpper('Example')}:*\n${prefix + command} 120363414372628604@newsletter`
        }, { quoted: message });
    }

    // 2. Get Channel ID from Command Arguments
    let channelId = q?.trim();
    
    // Agar user ne channel ID nahi diya, toh config se le
    if (!channelId) {
        channelId = config.CHANNEL_ID;
    }
    
    // Agar dono jagah ID nahi hai
    if (!channelId) {
        return await client.sendMessage(from, {
            text: `❌ *${toStylistUpper('Channel ID missing!')}*\n\n*${toStylistUpper('Usage')}:*\n${prefix + command} <channel_id>\n\n*${toStylistUpper('Example')}:*\n${prefix + command} 120363414372628604@newsletter`
        }, { quoted: message });
    }

    // Ensure ID format is correct (@newsletter)
    if (!channelId.includes('@newsletter')) {
        channelId = channelId + '@newsletter';
    }

    try {
        // React: Processing
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        const quotedMsg = message.quoted;
        let messageType = quotedMsg.mtype;
        
        // Download Media
        const buffer = await quotedMsg.download();
        if (!buffer) throw new Error("Media download failed");

        // Prepare Caption
        let userCaption = quotedMsg.caption || "";
        const botFooter = `\n\n> 📢 _${toStylistUpper('Sent via Bot')}_`;
        
        // 3. Send to Channel based on Type
        if (messageType.includes('image')) {
            await client.sendMessage(channelId, {
                image: buffer,
                caption: userCaption + botFooter
            });
        } 
        else if (messageType.includes('video')) {
            await client.sendMessage(channelId, {
                video: buffer,
                caption: userCaption + botFooter,
                mimetype: 'video/mp4'
            });
        } 
        else if (messageType.includes('audio')) {
            // Voice Note or Audio File
            await client.sendMessage(channelId, {
                audio: buffer,
                mimetype: 'audio/mp4',
                ptt: messageType.includes('ptv')
            });
        } 
        else if (messageType.includes('document')) {
            await client.sendMessage(channelId, {
                document: buffer,
                mimetype: quotedMsg.mimetype,
                fileName: quotedMsg.fileName || "File",
                caption: userCaption + botFooter
            });
        }
        else if (messageType === 'extendedTextMessage' || messageType === 'conversation') {
            // Text Message
            await client.sendMessage(channelId, {
                text: `${quotedMsg.text}${botFooter}`
            });
        }
        else {
            throw new Error("Unsupported format");
        }

        // Success Message
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
        await client.sendMessage(from, {
            text: `✅ *${toStylistUpper('Sent to Channel Successfully!')}*\n\n*${toStylistUpper('Channel')}:* ${channelId}`
        }, { quoted: message });

    } catch (error) {
        console.error("Channel Forward Error:", error);
        
        let errorMsg = error.message;
        if (errorMsg.includes("item-not-found")) {
            errorMsg = "Bot is not Admin in Channel or Channel ID is wrong.";
        } else if (errorMsg.includes("not-authorized")) {
            errorMsg = "Bot doesn't have permission to post.";
        }
        
        await client.sendMessage(from, {
            text: `❌ *${toStylistUpper('Failed')}:*\n${errorMsg}`
        }, { quoted: message });
    }
});
