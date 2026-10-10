// plugins/movie.js - ESM Version
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

// Advanced ytvi API for High Quality Movies
async function getRebixMovieByUrl(youtubeUrl) {
    const apiUrl = `https://api-rebix.vercel.app/api/ytvi?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    const data = res?.data;
    
    const downloadUrl = data?.results?.[0]?.downloadUrl || data?.audResults?.downloadUrl;
    
    if (data?.status && downloadUrl) {
        return { 
            download: downloadUrl, 
            title: data?.title || "Movie Video",
            quality: data?.results?.[0]?.quality || "HD"
        };
    }
    throw new Error('Movie API failed to fetch download link');
}

cmd({
    pattern: "movie",
    alias: ["film", "movies"],
    react: '🎬',
    desc: "Download Movies as Document File in High Quality",
    category: "downloader",
    filename: __filename
}, async (client, message, m, { 
    from, prefix, command, args, q, isCreator, userConfig 
}) => {
    try {
        if (!q) {
            return await client.sendMessage(from, {
                text: `*🎬 Please provide a Movie name or YouTube link!*\n\n*Example:* ${prefix + command} Haunted Mansion Movie`
            }, { quoted: message });
        }

        const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "AWAIS CYBER";
        const loadEmojis = ['🎬', '⏳', '📥'];
        for (const emoji of loadEmojis) {
            await client.sendMessage(from, { react: { text: emoji, key: message.key } });
        }

        let movieUrl = '';
        let movieTitle = 'Movie Video';
        let movieThumbnail = '';
        
        if (q.includes('youtube.com') || q.includes('youtu.be')) {
            movieUrl = q;
            try {
                let search = await yts({ videoId: q });
                if (search) {
                    movieTitle = search.title || movieTitle;
                    movieThumbnail = search.thumbnail || '';
                }
            } catch (e) {}
        } else {
            const search = await yts(q);
            const videos = search?.videos || search?.all;
            if (!videos || videos.length === 0) {
                return await client.sendMessage(from, { text: '❌ Movie not found!' }, { quoted: message });
            }
            movieUrl = videos[0].url;
            movieTitle = videos[0].title;
            movieThumbnail = videos[0].thumbnail;
        }

        if (movieThumbnail) {
            await client.sendMessage(from, {
                image: { url: movieThumbnail },
                caption: `🎬 Preparing Movie Document: *${movieTitle}*`
            }, { quoted: message });
        }

        let movieData;
        try {
            movieData = await getRebixMovieByUrl(movieUrl);
        } catch (err) {
            throw new Error('Failed to fetch movie download link.');
        }

        const finalTitle = movieData.title || movieTitle;

        // Send as Document File (.mp4)
        await client.sendMessage(from, {
            document: { url: movieData.download },
            mimetype: 'video/mp4',
            fileName: `${finalTitle}.mp4`,
            caption: `🎬 *${finalTitle}* (${movieData.quality})\n\n> *${DESCRIPTION}*`
        }, { quoted: message });

        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('Movie error:', error);
        await client.sendMessage(from, { text: `❌ Movie Error: ${error.message}` }, { quoted: message });
    }
});
