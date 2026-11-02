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
        'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': '',
        's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': '', 'z': 'ᴢ'
    };
    return text.split('').map(char => map[char.toLowerCase()] || char).join('');
};

// Upload to ImgBB to get public URL
async function uploadToImgBB(buffer) {
    try {
        const formData = new FormData();
        formData.append('image', buffer, {
            filename: 'image.png',
            contentType: 'image/png'
        });

        // ImgBB API (Free, no key required for basic upload)
        const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: formData.getHeaders(),
            timeout: 30000
        });

        if (response.data && response.data.data && response.data.data.url) {
            return response.data.data.url;
        }
        throw new Error('Upload failed');
    } catch (e) {
        console.error('ImgBB Upload Error:', e);
        throw new Error('Failed to upload image');
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
        // 1. Check if user replied to an image OR provided URL
        const isReplyImage = message.quoted && message.quoted.mtype.includes('image');
        const hasUrl = q && q.includes('http');
        
        if (!isReplyImage && !hasUrl) {
            return await client.sendMessage(from, {
                text: `❖─── ✦ *${toStylistUpper('AI Background Changer')}* ✦ ───❖\n\n║ ⚠️ ${toStylistUpper('Reply to image OR provide image URL!')}\n\n║  ${toStylistUpper('Examples:')}\n║ • Reply photo + .bgchange beach\n║ • .bgedit https://i.ibb.co/... sunset\n║ • .bgedit white studio background\n╚══════════════════════✧`
            }, { quoted: message });
        }

        // 2. Get the prompt
        let prompt = q || "background change";
        let imageUrl = '';

        // React: Processing
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        // 3. Handle Image Source
        if (hasUrl) {
            // User provided URL directly
            imageUrl = q.trim();
            prompt = q.replace(imageUrl, '').trim() || "background change";
        } else if (isReplyImage) {
            // User replied to image - Download and Upload
            await client.sendMessage(from, { text: ` *${toStylistUpper('Uploading image...')}*` }, { quoted: message });
            
            const quotedMsg = message.quoted;
            const buffer = await quotedMsg.download();
            
            if (!buffer || buffer.length === 0) {
                throw new Error("Failed to download image");
            }

            // Upload to get public URL
            imageUrl = await uploadToImgBB(buffer);
        }

        if (!imageUrl) {
            throw new Error("No image URL available");
        }

        // 4. Call Prexzy AI Image Edit API
        await client.sendMessage(from, { text: `🎨 *${toStylistUpper('Processing with AI...')}*\n\n║ Prompt: ${prompt}` }, { quoted: message });

        const apiUrl = `https://prexzyapis.com/ai/imageedit?prompt=${encodeURIComponent(prompt)}&image=${encodeURIComponent(imageUrl)}`;
        
        const response = await axios.get(apiUrl, { timeout: 120000 }); // 2 min timeout for AI
        const resData = response.data;

        // 5. Validate Response
        if (!resData || !resData.status || !resData.image_url) {
            throw new Error(resData.message || "AI processing failed");
        }

        const resultImageUrl = resData.image_url;
        const requestId = resData.request_id || "";

        // 6. Send Result
        const caption = `❖─── ✦ *${toStylistUpper('AI Background Changed')}* ✦ ───❖

═════ ⌈ *🎨 ${toStylistUpper('Edit Details')}*  ═════✧
║ ️ *${toStylistUpper('Prompt')}:* ${toStylistUpper(prompt)}
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
            text: `❖───  *${toStylistUpper('AI Error')}* ✦ ───❖\n\n║ ❌ ${toStylistUpper(error.message || 'Failed to process image')}\n\n║ 💡 ${toStylistUpper('Try:')}\n║ • Check image size (should be < 5MB)\n║ • Use simpler prompt\n║ • Try again later\n╚══════════════════════✧`
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});
