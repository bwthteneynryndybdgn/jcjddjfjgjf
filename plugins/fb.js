// plugins/fb.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// Helper function for Stylist Badi ABC Text
const toStylistUpper = (text) => {
    if (!text || typeof text !== 'string') return '';
    const uppercaseMap = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
        'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
        's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
        'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ғ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ',
        'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ',
        'S': 's', 'T': 'ᴛ', 'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ'
    };
    return text.split('').map(char => uppercaseMap[char] || char).join('');
};

cmd({
    pattern: "fb",
    alias: ["facebook", "fbdl"],
    react: '📥',
    desc: "Download video from Facebook using Link",
    category: "downloader",
    filename: __filename
}, async (client, message, m, { 
    from, 
    prefix, 
    command, 
    args, 
    q, 
    isCreator,
    userConfig
}) => {
    try {
        if (!q) {
            return await client.sendMessage(from, {
                text: `❌ *${toStylistUpper('Please provide a Facebook video link!')}*\n\n*${toStylistUpper('Example')}:* ${prefix + command} https://www.facebook.com/share/v/...`
            }, { quoted: message });
        }

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "Powered by Bot";

        // Initial reaction
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        let targetUrl = q.trim();

        if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            return await client.sendMessage(from, {
                text: `❌ *${toStylistUpper('Please provide a valid URL!')}*`
            }, { quoted: message });
        }

        // Aapki Facebook API Endpoint
        const apiUrl = `https://techxkamran.onrender.com/api/download/facebook?url=${encodeURIComponent(targetUrl)}`;

        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // API response validation
        if (!resData || !resData.status || !resData.data || !resData.data.downloads) {
            return await client.sendMessage(from, {
                text: `❌ *${toStylistUpper('Video download link not found!')}*`
            }, { quoted: message });
        }

        const videoData = resData.data;
        const videoTitle = videoData.title || "Facebook Video";
        
        // HD ya sabse pehla available download link nikalna
        let downloadUrl = null;
        let selectedQuality = "SD";

        const hdDownload = videoData.downloads.find(d => d.resolution === "HD" && d.url && d.url !== "/");
        if (hdDownload) {
            downloadUrl = hdDownload.url;
            selectedQuality = "HD";
        } else {
            const validDownload = videoData.downloads.find(d => d.url && d.url !== "/");
            if (validDownload) {
                downloadUrl = validDownload.url;
                selectedQuality = validDownload.resolution || "SD";
            }
        }

        if (!downloadUrl) {
            return await client.sendMessage(from, {
                text: `❌ *${toStylistUpper('No working download link found!')}*`
            }, { quoted: message });
        }

        // Styled Caption
        let caption = `❖ ── ✦ *${toStylistUpper('Facebook Downloader')}* ✦ ── ❖

╔═════ ⌈ *⚡ ${toStylistUpper('Video Details')}* ⌋ ═════✧
║ 📌 *${toStylistUpper('Title')}:* ${videoTitle}
║ 🎥 *${toStylistUpper('Quality')}:* ${selectedQuality}
╚══════════════════════✧

> 💫 _${DESCRIPTION}_`;

        // Send Video
        const options = {
            video: { url: downloadUrl },
            caption: caption,
            mimetype: 'video/mp4',
            contextInfo: {
                mentionedJid: [message.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363418144382782@newsletter',
                    newsletterName: "Kamran-Md",
                    serverMessageId: 143
                }
            }
        };

        await client.sendMessage(from, options, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error("Facebook Download Error:", error);
        let errorMsg = error?.message || error;
        await client.sendMessage(from, {
            text: `❌ *${toStylistUpper('Error downloading video')}:*\n` + errorMsg
        }, { quoted: message });
    }
});
