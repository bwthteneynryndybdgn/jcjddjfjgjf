// plugins/fb.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "fb2",
    alias: ["facebook2", "fbdl2"],
    react: '📥',
    desc: "Download large videos from Facebook as document",
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

        const response = await axios.get(apiUrl, { timeout: 60000 }); // Badi video ke liye timeout 60 seconds kar diya hai
        const resData = response.data;

        // API response validation
        if (!resData || !resData.status || !resData.data || !resData.data.downloads) {
            return await client.sendMessage(from, {
                text: "❌ *Facebook video download link nahi mil saki!*"
            }, { quoted: message });
        }

        const videoData = resData.data;
        const videoTitle = videoData.title || "Facebook Video";
        const thumbnail = videoData.thumbnail || "";
        
        // HD ya sabse behtareen available download link nikalna
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
                text: "❌ *Video ki koi bhi working download link nahi mili!*"
            }, { quoted: message });
        }

        // Message caption
        let caption = `*📥 FACEBOOK VIDEO DOWNLOADER* 📥\n\n`;
        caption += `*▪ Title:* ${videoTitle}\n`;
        caption += `*▪ Quality:* ${selectedQuality}\n\n`;
        caption += `> ${DESCRIPTION}`;

        // Send as Document so large files (up to 1GB+) can be sent without crashing
        const options = {
            document: { url: downloadUrl },
            mimetype: 'video/mp4',
            fileName: `${videoTitle.replace(/[/\\?%*:|"<>]/g, '')}.mp4`,
            caption: caption,
            contextInfo: {
                externalAdReply: {
                    title: videoTitle,
                    body: `Quality: ${selectedQuality} | Facebook Video`,
                    mediaType: 2,
                    thumbnailUrl: thumbnail,
                    sourceUrl: targetUrl,
                    renderLargerThumbnail: true
                }
            }
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
