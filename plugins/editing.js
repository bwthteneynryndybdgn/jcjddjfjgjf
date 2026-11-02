// plugins/bgchange.js
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// Stylish Text Helper
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
    pattern: "bgchange",
    alias: ["background", "bgedit", "aibg"],
    react: '🎨',
    desc: "Change image background using AI",
    category: "ai",
    filename: __filename
}, async (client, message, m, { from, prefix, command, q }) => {
    try {
        // 1. Check if user replied to an image
        if (!message.quoted || !message.quoted.mtype.includes('image')) {
            return await client.sendMessage(from, {
                text: `❖─── ✦ *${toStylistUpper('AI Background Changer')}* ✦ ───❖\n\n║ ⚠️ ${toStylistUpper('Please reply to an image!')}\n\n║  ${toStylistUpper('Example:')}\n║ • Send photo → Reply with:\n║   .bgchange beach sunset\n║   .bgchange white studio\n╚══════════════════════✧`
            }, { quoted: message });
        }

        // 2. Get the prompt (what background to change to)
        if (!q) {
            return await client.sendMessage(from, {
                text: `❖─── ✦ *${toStylistUpper('Missing Prompt')}* ✦ ───❖\n\n║ ⚠️ ${toStylistUpper('Describe new background!')}\n\n║  ${toStylistUpper('Examples:')}\n║ • .bgchange paris eiffel tower\n║ • .bgchange neon cyberpunk city\n║ • .bgchange snowy mountains\n╚══════════════════════✧`
            }, { quoted: message });
        }

        // React: Processing
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        // 3. Download the quoted image and convert to base64 or get URL
        // Note: Prexzy API needs direct image URL. We'll download and re-upload 
        // OR use the quoted message's media URL if available.
        // For simplicity, we'll try to get media URL first, else download
        
        let imageUrl = '';
        try {
            // Try to get direct media URL from WhatsApp (works in some bots)
            imageUrl = message.quoted.msg?.url || message.quoted.msg?.mediaUrl;
        } catch(e) {}

        // If no direct URL, we need to handle this differently
        // Since Prexzy API requires public URL, let's inform user
        // OR we can use a temporary upload service. For now, let's assume 
        // the bot framework provides a way to get URL or we use a workaround.
        
        // WORKAROUND: Many WA bots can't directly send local buffer to external API 
        // without uploading first. Let's check if quoted has url property.
        // If not, we might need to skip or ask user to provide URL.
        
        // BETTER APPROACH: Use the quoted message's download capability 
        // But since API needs URL, let's try to construct it or use a known method.
        // Actually, many modern WA bot frameworks allow getting media URL via:
        // message.quoted.msg.url (if sent from web) or we need to upload.
        
        // FOR THIS CODE: Let's assume the framework supports getting URL 
        // OR we use a simple trick: Some APIs accept base64, but Prexzy needs URL.
        // Let's try to get URL from contextInfo if forwarded, else error.
        
        // REVISED: Let's check if quoted message has 'url' in msg object
        const quotedMsg = message.quoted;
        imageUrl = quotedMsg.msg?.url || quotedMsg.msg?.mediaUrl || '';
        
        // If still empty, we cannot proceed with URL-based API
        if (!imageUrl) {
            // Fallback: Try to see if it's a sticker or has other props
            // Or simply tell user limitation
            return await client.sendMessage(from, {
                text: `❖─── ✦ *${toStylistUpper('Error')}* ✦ ───❖\n\n║ ❌ ${toStylistUpper('Cannot get image URL.')}\n║ 💡 ${toStylistUpper('Try sending image as link or ensure bot has media access.')}\n╚══════════════════════✧`
            }, { quoted: message });
        }

        // 4. Call Prexzy AI Image Edit API
        const apiUrl = `https://prexzyapis.com/ai/imageedit?prompt=${encodeURIComponent(q.trim())}&image=${encodeURIComponent(imageUrl)}`;
        
        const response = await axios.get(apiUrl, { timeout: 60000 }); // Longer timeout for AI
        const resData = response.data;

        // 5. Validate Response based on your JSON structure
        if (!resData || !resData.status || !resData.image_url) {
            throw new Error(resData.message || "AI processing failed");
        }

        const resultImageUrl = resData.image_url;
        const requestId = resData.request_id || "";

        // 6. Send Result Image with Stylish Caption
        const caption = `❖─── ✦ *${toStylistUpper('AI Background Changed')}* ✦ ───❖

╔═════ ⌈ *🎨 ${toStylistUpper('Edit Details')}* ⌋ ═════✧
║ 🖼️ *${toStylistUpper('Prompt')}:* ${toStylistUpper(q)}
║ 🔗 *${toStylistUpper('Request ID')}:* ${requestId.substring(0, 8)}...
║ ✅ *${toStylistUpper('Status')}:* ${toStylistUpper('Success')}
╚══════════════════════✧

> 💫 _${toStylistUpper(config.DESCRIPTION || 'Powered by Prexzy AI')}_`;

        await client.sendMessage(from, {
            image: { url: resultImageUrl },
            caption: caption
        }, { quoted: message });

        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error("BG Change Error:", error);
        await client.sendMessage(from, {
            text: `❖─── ✦ *${toStylistUpper('AI Error')}* ✦ ───❖\n\n║ ❌ ${toStylistUpper(error.message || 'Failed to process image')}\n╚══════════════════════✧`
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});
