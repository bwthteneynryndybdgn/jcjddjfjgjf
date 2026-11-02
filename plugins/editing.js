// plugins/bgchange.js
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';
import FormData from 'form-data';

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

// FIXED Upload Function for Catbox.moe
async function uploadImage(buffer) {
    try {
        const formData = new FormData();
        
        // ⚠️ YE LINE FIX HAI: Catbox ko batana padta hai ki ye file upload hai
        formData.append('reqtype', 'fileupload'); 
        
        // File append karna
        formData.append('fileToUpload', buffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        });

        const response = await axios.post('https://catbox.moe/user/api.php', formData, {
            headers: {
                ...formData.getHeaders(),
                'Content-Type': 'multipart/form-data'
            },
            timeout: 30000
        });

        const url = response.data.trim();
        if (url && url.startsWith('http')) {
            return url;
        }
        throw new Error(`Upload failed: ${url}`);
    } catch (e) {
        console.error('Catbox Upload Error:', e.response?.data || e.message);
        throw new Error('Failed to upload image to server');
    }
}

cmd({
    pattern: "bgchange",
    alias: ["background", "bgedit", "aibg", "editbg"],
    react: '🎨',
    desc: "Change image background using AI",
    category: "ai",
    filename: __filename
}, async (client, message, m, { from, prefix, command, q }) => {
    try {
        const isReplyImage = message.quoted && message.quoted.mtype.includes('image');
        const hasUrl = q && q.match(/https?:\/\/[^\s]+/);
        
        if (!isReplyImage && !hasUrl) {
            return await client.sendMessage(from, {
                text: `❖─── ✦ *${toStylistUpper('AI Background Changer')}* ✦ ───❖\n\n║ ⚠️ ${toStylistUpper('Reply to image OR provide URL!')}\n\n║  ${toStylistUpper('Examples:')}\n║ • Reply photo + .bgchange beach\n║ • .bgedit https://... sunset\n╚══════════════════════✧`
            }, { quoted: message });
        }

        let prompt = q || "background change";
        let imageUrl = '';

        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        // Handle Image Source
        if (hasUrl) {
            imageUrl = q.match(/https?:\/\/[^\s]+/)[0];
            prompt = q.replace(imageUrl, '').trim() || "background change";
        } else if (isReplyImage) {
            await client.sendMessage(from, { 
                text: `📤 *${toStylistUpper('Uploading image...')}*`,
                edit: message.key 
            });
            
            const buffer = await message.quoted.download();
            if (!buffer || buffer.length === 0) throw new Error("Download failed");
            
            // Upload using Fixed Catbox Function
            imageUrl = await uploadImage(buffer);
        }

        if (!imageUrl) throw new Error("No image URL");

        // Process with Prexzy AI
        await client.sendMessage(from, { 
            text: `🎨 *${toStylistUpper('AI Processing...')}*\nPrompt: ${prompt}`,
            edit: message.key 
        });

        const apiUrl = `https://prexzyapis.com/ai/imageedit?prompt=${encodeURIComponent(prompt)}&image=${encodeURIComponent(imageUrl)}`;
        const response = await axios.get(apiUrl, { timeout: 120000 });
        const resData = response.data;

        if (!resData?.status || !resData?.image_url) {
            throw new Error(resData?.message || "AI processing failed");
        }

        const caption = `❖─── ✦ *${toStylistUpper('Background Changed')}* ✦ ───❖

╔═════ ⌈ *🎨 ${toStylistUpper('Details')}* ⌋ ═════✧
║ 🖼️ *${toStylistUpper('Prompt')}:* ${toStylistUpper(prompt)}
║ 🔗 *${toStylistUpper('ID')}:* ${resData.request_id?.substring(0, 8) || 'N/A'}
║ ✅ *${toStylistUpper('Status')}:* ${toStylistUpper('Success')}
╚══════════════════════✧

> 💫 _${toStylistUpper(config.DESCRIPTION || 'Powered by Prexzy AI')}_`;

        await client.sendMessage(from, {
            image: { url: resData.image_url },
            caption: caption
        }, { quoted: message });

        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error("BG Change Error:", error);
        await client.sendMessage(from, {
            text: `❖─── ✦ *${toStylistUpper('Error')}* ✦ ───❖\n\n║ ❌ ${toStylistUpper(error.message)}\n\n║ 💡 ${toStylistUpper('Tips:')}\n║ • Use clear images (<5MB)\n║ • Simple prompts work best\n║ • Try again in a moment\n╚══════════════════════✧`
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});
