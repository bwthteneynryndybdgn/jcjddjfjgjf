// plugins/video.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';
import yts from 'yt-search';

const __filename = fileURLToPath(import.meta.url);

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json, text/plain, */*'
    }
};

async function tryRequest(getter, attempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await getter();
        } catch (err) {
            lastError = err;
            if (attempt < attempts) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }
    throw lastError;
}

async function getEliteProTechVideoByUrl(youtubeUrl) {
    const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp4`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.success && res?.data?.downloadURL) {
        return { download: res.data.downloadURL, title: res.data.title };
    }
    throw new Error('EliteProTech failed');
}

async function getYupraVideoByUrl(youtubeUrl) {
    const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.success && res?.data?.data?.download_url) {
        return { download: res.data.data.download_url, title: res.data.data.title };
    }
    throw new Error('Yupra failed');
}

async function getOkatsuVideoByUrl(youtubeUrl) {
    const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.mp4) {
        return { download: res.data.result.mp4, title: res.data.result.title };
    }
    throw new Error('Okatsu failed');
}

cmd({
    pattern: "video",
    alias: ["ytmp4", "vids", "ytv"],
    react: '📥',
    desc: "Download YouTube videos via multiple APIs as document (1GB+ support)",
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
                text: `*🍁 Please provide a YouTube link or video name!*\n\n*Example:* ${prefix + command} faded song`
            }, { quoted: message });
        }

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "AWAIS CYBER";

        // Loading reactions
        const loadEmojis = ['📥', '⏳', '🎥'];
        for (const emoji of loadEmojis) {
            await client.sendMessage(from, { react: { text: emoji, key: message.key } });
        }

        let videoUrl = '';
        let videoTitle = '';
        let videoThumbnail = '';
        
        if (q.includes('youtube.com') || q.includes('youtu.be')) {
            videoUrl = q;
            videoTitle = 'YouTube Video';
            // Link se details nikalne ke liye yts try karenge
            try {
                let search = await yts({ videoId: q });
                if (search) {
                    videoTitle = search.title || videoTitle;
                    videoThumbnail = search.thumbnail || '';
                }
            } catch (e) {}
        } else {
            const search = await yts(q);
            const videos = search?.videos || search?.all;
            if (!videos || videos.length === 0) {
                return await client.sendMessage(from, { text: '❌ No videos found!' }, { quoted: message });
            }
            videoUrl = videos[0].url;
            videoTitle = videos[0].title;
            videoThumbnail = videos[0].thumbnail;
        }

        // Send Thumbnail/Preview info first
        if (videoThumbnail) {
            await client.sendMessage(from, {
                image: { url: videoThumbnail },
                caption: `🎥 Downloading: *${videoTitle}*`
            }, { quoted: message });
        }

        let videoData;
        let downloadSuccess = false;
        const apiMethods = [
            { name: 'EliteProTech', method: () => getEliteProTechVideoByUrl(videoUrl) },
            { name: 'Yupra', method: () => getYupraVideoByUrl(videoUrl) },
            { name: 'Okatsu', method: () => getOkatsuVideoByUrl(videoUrl) }
        ];
        
        for (const apiMethod of apiMethods) {
            try {
                videoData = await apiMethod.method();
                if (videoData.download) {
                    downloadSuccess = true;
                    break;
                }
            } catch (err) {
                console.log(`${apiMethod.name} failed:`, err.message);
            }
        }
        
        if (!downloadSuccess) throw new Error('All download sources failed.');

        const finalTitle = videoData.title || videoTitle;

        // Send as Document to support large files (up to 1GB+) safely without crashing
        await client.sendMessage(from, {
            document: { url: videoData.download },
            mimetype: 'video/mp4',
            fileName: `${finalTitle.replace(/[^\w\s-]/g, '').substring(0, 100)}.mp4`,
            caption: `*${finalTitle}*\n\n> *${DESCRIPTION}*`,
            contextInfo: {
                externalAdReply: {
                    title: finalTitle,
                    body: `YouTube Video Downloader`,
                    mediaType: 2,
                    thumbnailUrl: videoThumbnail,
                    sourceUrl: videoUrl,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: message });

        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('Video error:', error);
        await client.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: message });
    }
});
