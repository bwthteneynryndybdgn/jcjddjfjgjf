// plugins/insta.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "insta",
    alias: ["instagram", "ig", "igdl"],
    react: '📥',
    desc: "Download video or photo from Instagram using Link",
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
                text: `*🍁 Please provide an Instagram link!*\n\n*Example:* ${prefix + command} https://www.instagram.com/reel/...`
            }, { quoted: message });
        }

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "Powered by Bot";

        // Initial reaction
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        let targetUrl = q.trim();

        if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            return await client.sendMessage(from, {
                text: "❌ *Kripya ek valid Instagram link dein!*"
            }, { quoted: message });
        }

        // Aapki Instagram API Endpoint
        const apiUrl = `https://techxkamran.vercel.app/api/download/instagram?url=${encodeURIComponent(targetUrl)}`;

        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // API response validation & correct path extraction based on your JSON format
        if (!resData || resData.status !== 200 || !resData.result || !resData.result.items || resData.result.items.length === 0) {
            return await client.sendMessage(from, {
                text: "❌ *Instagram media ki download link nahi mil saki!*"
            }, { quoted: message });
        }

        const mediaItem = resData.result.items[0];
        const downloadUrl = mediaItem.download_url;

        if (!downloadUrl) {
            return await client.sendMessage(from, {
                text: "❌ *Media download URL empty hai!*"
            }, { quoted: message });
        }

        // Message caption
        let caption = `*📥 INSTAGRAM DOWNLOADER* 📥\n\n`;
        caption += `> ${DESCRIPTION}`;

        // Send Media (Video or Image)
        const isImage = mediaItem.media_type === "image" || (typeof downloadUrl === 'string' && (downloadUrl.includes('.jpg') || downloadUrl.includes('.png') || downloadUrl.includes('.jpeg')));

        if (isImage) {
            await client.sendMessage(from, {
                image: { url: downloadUrl },
                caption: caption
            }, { quoted: message });
        } else {
            await client.sendMessage(from, {
                video: { url: downloadUrl },
                caption: caption,
                mimetype: 'video/mp4'
            }, { quoted: message });
        }

        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error("Instagram Download Error:", error);
        let errorMsg = error?.message || error;
        await client.sendMessage(from, {
            text: "❌ Error downloading Instagram media:\n" + errorMsg
        }, { quoted: message });
    }
});
