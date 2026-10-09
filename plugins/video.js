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

// Rebix API Integration (Primary Source)
async function getRebixVideoByUrl(youtubeUrl) {
    const apiUrl = `https://api-rebix.vercel.app/api/ytv?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    const data = res?.data;
    
    // Response validation based on your JSON structure
    const downloadUrl = data?.results?.downloadUrl || data?.results?.[0]?.downloadUrl;
    
    if (data?.status && downloadUrl) {
        return { 
            download: downloadUrl, 
            title: data?.results?.title || "YouTube Video" 
        };
    }
    throw new Error('Rebix API failed');
}

cmd({
    pattern: "video",
    alias: ["ytmp4", "vids", "ytv"],
    react: '📥',
    desc: "Download YouTube videos via Rebix API as document (1GB+ support)",
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
                text: `*🍁 Please provide a YouTube link or video name!*\n\n*Example:* ${prefix + command} tamako market amv`
            }, { quoted: message });
        }

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "AWAIS CYBER";

        // Loading reactions
        const loadEmojis = ['📥', '⏳', '🎥'];
        for (const emoji of loadEmojis) {
            await client.sendMessage(from, { react: { text: emoji, key: message.key } });
        }

        let videoUrl = '';
        let videoTitle = 'YouTube Video';
        let videoThumbnail = '';
        
        if (q.includes('youtube.com') || q.includes('youtu.be')) {
            videoUrl = q;
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

        if (videoThumbnail) {
            await client.sendMessage(from, {
                image: { url: videoThumbnail },
                caption: `🎥 Downloading: *${videoTitle}*`
            }, { quoted: message });
        }

        // Fetching video using Rebix API
        let videoData;
        try {
            videoData = await getRebixVideoByUrl(videoUrl);
        } catch (err) {
            throw new Error('All download sources failed.');
        }

        const finalTitle = videoData.title || videoTitle;

        // Send as Document to support large files safely (1GB+)
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
