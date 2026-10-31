// plugins/ch_forward.js
import { fileURLToPath } from 'url';
import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
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
    pattern: "chforward",
    alias: ["sendch", "cfwd", "cchannel"],
    desc: "Forward media/text to WhatsApp Channel",
    category: "channel",
    filename: __filename
}, async (client, message, match, { from, reply, isCreator }) => {
    try {
        // 1. Check if replied to a message
        if (!message.quoted) {
            return await reply(`❌ *${toStylistUpper('Please reply to a message!')}*\n\n*${toStylistUpper('Usage')}:*\n.chforward <channel_id>\n.or just .chforward if ID is in config`);
        }

        // 2. Get Channel ID
        let channelId = "";
        
        // Agar user ne command ke saath ID di hai
        if (match && typeof match === 'string' && match.trim() !== "") {
            channelId = match.trim();
        } 
        // Agar nahi diya, toh config se le
        else if (config.CHANNEL_ID) {
            channelId = config.CHANNEL_ID;
        }

        // Validate ID
        if (!channelId) {
            return await reply(`❌ *${toStylistUpper('Channel ID Missing!')}*\nProvide ID in command or config.js`);
        }

        // Ensure @newsletter suffix
        if (!channelId.includes('@newsletter')) {
            channelId = channelId + '@newsletter';
        }

        // React: Processing
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        // 3. Prepare Content
        const quotedMsg = message.quoted;
        const contentType = Object.keys(quotedMsg.message)[0]; // e.g., imageMessage, videoMessage
        
        // Create a copy of the message object to forward
        // Note: For channels, we often need to strip some contextInfo to avoid errors
        let msgContent = { ...quotedMsg.message };
        
        // Add a small footer caption if it's media with text support
        if (contentType === 'imageMessage' || contentType === 'videoMessage' || contentType === 'documentMessage') {
            const originalCaption = msgContent[contentType]?.caption || "";
            const footer = `\n\n> 📢 _${toStylistUpper('Sent via Bot')}_`;
            msgContent[contentType].caption = originalCaption + footer;
        } else if (contentType === 'conversation' || contentType === 'extendedTextMessage') {
             // For text, we create a new object because we can't easily append to quoted text structure in relay
             // So we will handle text separately below
        }

        // 4. Send to Channel
        // Method 1: Using relayMessage (Best for preserving exact media format)
        try {
            if (contentType === 'conversation' || contentType === 'extendedTextMessage') {
                // For Text, simple sendMessage is safer
                const text = quotedMsg.text || "";
                await client.sendMessage(channelId, {
                    text: `${text}\n\n> 📢 _${toStylistUpper('Sent via Bot')}_`
                });
            } else {
                // For Media (Image, Video, Audio, Sticker, etc.)
                // We use relayMessage to keep the original quality and type
                const waMsg = generateWAMessageFromContent(channelId, msgContent, {
                    userJid: client.user.id
                });
                
                await client.relayMessage(channelId, waMsg.message, {
                    messageId: waMsg.key.id
                });
            }

            // Success
            await client.sendMessage(from, { react: { text: '✅', key: message.key } });
            await reply(`✅ *${toStylistUpper('Successfully Sent to Channel!')}*\n\nID: ${channelId}`);

        } catch (err) {
            console.error("Relay Error:", err);
            // Fallback: If relay fails, try direct sendMessage for media
            if (contentType === 'imageMessage') {
                await client.sendMessage(channelId, {
                    image: await quotedMsg.download(),
                    caption: msgContent.imageMessage.caption
                });
            } else if (contentType === 'videoMessage') {
                await client.sendMessage(channelId, {
                    video: await quotedMsg.download(),
                    caption: msgContent.videoMessage.caption
                });
            } else {
                throw err; // Re-throw if fallback also not applicable
            }
            
            await client.sendMessage(from, { react: { text: '✅', key: message.key } });
            await reply(`✅ *${toStylistUpper('Sent via Fallback Method!')}*`);
        }

    } catch (error) {
        console.error("Channel Forward Error:", error);
        let errorMsg = error.message;
        if (errorMsg.includes("item-not-found")) {
            errorMsg = "Bot is not Admin in this Channel.";
        }
        await reply(`❌ *${toStylistUpper('Failed')}:*\n${errorMsg}`);
    }
});
