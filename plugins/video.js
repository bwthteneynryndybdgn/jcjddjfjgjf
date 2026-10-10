// plugins/drama.js - ESM Version
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
        'Accept': 'application/json, text/plain, '*/*'
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

// Rebix API Integration for Normal Video Command
async function getRebixVideoByUrl(youtubeUrl) {
    const apiUrl = `https://api-rebix.vercel.app/api/ytv?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    const data = res?.data;
    
    const downloadUrl = data?.results?.downloadUrl || data?.results?.[0]?.downloadUrl;
    
    if (data?.status && downloadUrl) {
        return { 
            download: downloadUrl, 
            title: data?.results?.title || "YouTube Video" 
        };
    }
    throw new Error('Rebix API failed');
}

// Rebix API Integration for Drama Document Command (Using 480p/720p stable format)
async function getRebixDramaByUrl(youtubeUrl) {
    // 480 format taake video mukamal aur achi quality mein aaye (KBs wala error khatam)
    const apiUrl = `https://api-rebix.vercel.app/api/ytdl?format=480&url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    const data = res?.data;
    
    const downloadUrl = data?.result?.download || data?.results?.downloadUrl;
    
    if (data?.status && downloadUrl) {
        return { 
            download: downloadUrl, 
            title: data?.result?.title || data?.results?.title || "Drama Video" 
        };
    }
    throw new Error('Rebix API failed to fetch drama link');
}

// 1. Existing Video Command
cmd({
    pattern: "video",
    alias: ["ytmp4", "vids", "ytv"],
    react: '📥',
    desc: "Download YouTube videos via Rebix API as direct video message",
    category: "downloader",
    filename: __filename
}, async (client, message, m, { 
    from, prefix, command, args, q, isCreator, userConfig 
}) => {
    try {
        if (!q) {
            return await client.sendMessage(from, {
                text: `*🍁 Please provide a YouTube link or video name!*\n\n*Example:* ${prefix + command} tamako market amv`
            }, { quoted: message });
        }

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "AWAIS CYBER";
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

        let videoData;
        try {
            videoData = await getRebixVideoByUrl(videoUrl);
        } catch (err) {
            throw new Error('All download sources failed.');
        }

        const finalTitle = videoData.title || videoTitle;

        await client.sendMessage(from, {
            video: { url: videoData.download },
            mimetype: 'video/mp4',
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


// 2. Dedicated Drama Command (Sends as Document File with correct size/quality)
cmd({
    pattern: "drama",
    alias: ["pakdrama", "serial", "episodes"],
    react: '📁',
    desc: "Download Dramas and Episodes as Document File",
    category: "downloader",
    filename: __filename
}, async (client, message, m, { 
    from, prefix, command, args, q, isCreator, userConfig 
}) => {
    try {
        if (!q) {
            return await client.sendMessage(from, {
                text: `*📁 Please provide a Drama name or Episode link to download as Document!*\n\n*Example:* ${prefix + command} Mahnoor episode 57`
            }, { quoted: message });
        }

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "AWAIS CYBER";
        const loadEmojis = ['📁', '⏳', '📥'];
        for (const emoji of loadEmojis) {
            await client.sendMessage(from, { react: { text: emoji, key: message.key } });
        }

        let dramaUrl = '';
        let dramaTitle = 'Drama Episode';
        let dramaThumbnail = '';
        
        if (q.includes('youtube.com') || q.includes('youtu.be')) {
            dramaUrl = q;
            try {
                let search = await yts({ videoId: q });
                if (search) {
                    dramaTitle = search.title || dramaTitle;
                    dramaThumbnail = search.thumbnail || '';
                }
            } catch (e) {}
        } else {
            const search = await yts(q);
            const videos = search?.videos || search?.all;
            if (!videos || videos.length === 0) {
                return await client.sendMessage(from, { text: '❌ Drama not found!' }, { quoted: message });
            }
            dramaUrl = videos[0].url;
            dramaTitle = videos[0].title;
            dramaThumbnail = videos[0].thumbnail;
        }

        if (dramaThumbnail) {
            await client.sendMessage(from, {
                image: { url: dramaThumbnail },
                caption: `📁 Preparing Drama Document: *${dramaTitle}*`
            }, { quoted: message });
        }

        let dramaData;
        try {
            dramaData = await getRebixDramaByUrl(dramaUrl);
        } catch (err) {
            throw new Error('Failed to download the drama.');
        }

        const finalTitle = dramaData.title || dramaTitle;

        // Send as Document File with proper size
        await client.sendMessage(from, {
            document: { url: dramaData.download },
            mimetype: 'video/mp4',
            fileName: `${finalTitle}.mp4`,
            caption: `📁 *${finalTitle}*\n\n> *${DESCRIPTION}*`
        }, { quoted: message });

        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('Drama error:', error);
        await client.sendMessage(from, { text: `❌ Drama Error: ${error.message}` }, { quoted: message });
    }
});
