import { cmd } from '../command.js';
import axios from 'axios';

cmd({
    pattern: 'play',
    alias: ['ytplay', 'song', 'music'],
    desc: 'Search and download audio from YouTube',
    category: 'downloader',
    react: '🎵',
    use: '<song name>'
}, async (conn, mek, m, { args, reply, from }) => {
    try {
        // 1. Validate Input
        if (!args[0]) {
            return reply(`*🎵 YouTube Player*\n\nPlease provide a song name.\n\nExample: \`.play Pal Jalebi\``);
        }

        const query = args.join(' ');
        await reply(`*🔍 Searching for:* ${query}...`);

        // 2. Fetch Data from API
        const apiUrl = `https://api.nexray.web.id/downloader/ytplay?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(apiUrl);

        // 3. Check Response Status
        if (!data || !data.status || !data.result) {
            return reply('❌ *Error:* Could not find any results for this song.');
        }

        const result = data.result;
        
        // 4. Prepare Message Content
        const caption = `*🎵 Now Playing*\n\n` +
                        `*Title:* ${result.title}\n` +
                        `*Channel:* ${result.channel}\n` +
                        `*Duration:* ${result.duration}\n` +
                        `*Views:* ${result.views}\n` +
                        `*Uploaded:* ${result.upload_at}\n\n` +
                        `*📥 Downloading Audio...*`;

        // 5. Send Audio
        // We use the direct download_url provided in the JSON
        await conn.sendMessage(from, {
            audio: { url: result.download_url },
            mimetype: 'audio/mpeg',
            contextInfo: {
                externalAdReply: {
                    title: result.title,
                    body: result.channel,
                    thumbnailUrl: result.thumbnail,
                    sourceUrl: result.url,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error('Play Error:', error);
        reply('❌ *Failed to process request.* Please try again later.');
    }
});
