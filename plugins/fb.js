// plugins/fb.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

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
                text: `*🍁 Please provide a Facebook video link!*\n\n*Example:* ${prefix + command} https://www.facebook.com/share/v/...`
            }, { quoted: message });
        }

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "Powered by Bot";

        // Initial reaction
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        let targetUrl = q.trim();

        if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            return await client.sendMessage(from, {
                text: "❌ *Kripya ek valid Facebook link dein!*"
            }, { quoted: message });
        }

        // Aapki Facebook API Endpoint
        const apiUrl = `https://techxkamran.vercel.app/api/download/facebook?url=${encodeURIComponent(targetUrl)}`;

        const response = await axios.get(apiUrl, { timeout: 30000 });
        const resData = response.data;

        // API response validation
        if (!resData || !resData.status || !resData.data || !resData.data.downloads) {
            return await client.sendMessage(from, {
                text: "❌ *Facebook video download link nahi mil saki!*"
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
            // Agar HD na mile toh koi bhi valid SD link utha lein
            const validDownload = videoData.downloads.find(d => d.url && d.url !== "/");
            if (validDownload) {
                downloadUrl = validDownload.url;
                selectedQuality = validDownload.resolution || "SD";
            }
        }

        if (!downloadUrl) {
            return await client.sendMessage(from, {
                text: "❌ *Video ki koi bhi working download link nahi mili!*"
            }, { quoted: message });
        }

        // Message caption
        let caption = `*📥 FACEBOOK VIDEO DOWNLOADER* 📥\n\n`;
        caption += `*▪ Title:* ${videoTitle}\n`;
        caption += `*▪ Quality:* ${selectedQuality}\n\n`;
        caption += `> ${DESCRIPTION}`;

        // Send Video
        const options = {
            video: { url: downloadUrl },
            caption: caption,
            mimetype: 'video/mp4'
        };

        await client.sendMessage(from, options, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error("Facebook Download Error:", error);
        let errorMsg = error?.message || error;
        await client.sendMessage(from, {
            text: "❌ Error downloading Facebook video:\n" + errorMsg
        }, { quoted: message });
    }
});
