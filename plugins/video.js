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

// 1. Video Command
cmd({
    pattern: "video",
    alias: ["ytmp4", "vids", "ytv"],
    react: '📥',
    desc: "Download YouTube videos via Rebix API as direct video message",
    category: "downloader",
    filename: __filename
}, async (client, message, m, { from, prefix, command, q, userConfig }) => {
    try {
        if (!q) {
            return await client.sendMessage(from, {
                text: `*🍁 Please provide a YouTube link or video name!*\n\n*Example:* ${prefix + command} tamako market amv`
            }, { quoted: message });
        }

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "AWAIS CYBER";
        await client.sendMessage(from, { react: { text: '📥', key: message.key } });

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

        const apiUrl = `https://api-rebix.vercel.app/api/ytv?url=${encodeURIComponent(videoUrl)}`;
        const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
        const data = res?.data;
        const downloadUrl = data?.results?.downloadUrl || data?.results?.[0]?.downloadUrl;

        if (!data?.status || !downloadUrl) {
            throw new Error('API failed to get download link');
        }

        const finalTitle = data?.results?.title || videoTitle;

        await client.sendMessage(from, {
            video: { url: downloadUrl },
            mimetype: 'video/mp4',
            caption: `*${finalTitle}*\n\n> *${DESCRIPTION}*`
        }, { quoted: message });

        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('Video error:', error);
        await client.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: message });
    }
});

// 2. Drama Command (As Document)
cmd({
    pattern: "drama",
    alias: ["pakdrama", "serial", "episodes"],
    react: '📁',
    desc: "Download Dramas and Episodes as Document File",
    category: "downloader",
    filename: __filename
}, async (client, message, m, { from, prefix, command, q, userConfig }) => {
    try {
        if (!q) {
            return await client.sendMessage(from, {
                text: `*📁 Please provide a Drama name or Episode link!*\n\n*Example:* ${prefix + command} Mahnoor episode 57`
            }, { quoted: message });
        }

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "AWAIS CYBER";
        await client.sendMessage(from, { react: { text: '📁', key: message.key } });

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

        const apiUrl = `https://api-rebix.vercel.app/api/ytv?url=${encodeURIComponent(dramaUrl)}`;
        const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
        const data = res?.data;
        const downloadUrl = data?.results?.downloadUrl || data?.results?.[0]?.downloadUrl;

        if (!data?.status || !downloadUrl) {
            throw new Error('API failed to get download link');
        }

        const finalTitle = data?.results?.title || dramaTitle;

        await client.sendMessage(from, {
            document: { url: downloadUrl },
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
