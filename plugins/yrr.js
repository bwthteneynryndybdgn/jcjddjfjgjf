// plugins/yt.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';
import { prepareWAMessageMedia } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);

// Global temporary memory cache (Database fallback)
if (!global.ytCache) global.ytCache = {};

const CLOUDINARY_IMAGE = 'https://res.cloudinary.com/di2a9lenz/image/upload/v1786909227/omegatech_ai_media/upload-1786909226872.jpg';

async function getYTData(url) {
    const apiUrl = `https://api.omegatech.app/api/download/ytultra?action=download&url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(apiUrl, { timeout: 30000 });
    if (!data.success) throw new Error('Failed to fetch YouTube data');
    return data.data;
}

async function showTypeSelector(conn, chatId, data, url, usedPrefix, command, taggedUsers = []) {
    try {
        let imageMessage;
        try {
            if (data.thumbnail) {
                const imgResp = await axios.get(data.thumbnail, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(imgResp.data);
                const media = await prepareWAMessageMedia({ image: buffer }, { upload: conn.waUploadToServer });
                imageMessage = media.imageMessage;
            } else {
                const imgResp = await axios.get(CLOUDINARY_IMAGE, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(imgResp.data);
                const media = await prepareWAMessageMedia({ image: buffer }, { upload: conn.waUploadToServer });
                imageMessage = media.imageMessage;
            }
        } catch (e) {}

        global.ytCache[chatId] = {
            data: data,
            url: url,
            timestamp: Date.now()
        };

        const buttons = [
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: "🎬 Video (MP4)",
                    sections: [{
                        title: "Download Video",
                        highlight_label: "📹",
                        rows: [{ id: `${usedPrefix}ytmp4 ${url}`, title: "Download as Video", description: "Choose quality after" }]
                    }]
                })
            },
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: "🎵 Audio (MP3)",
                    sections: [{
                        title: "Download Audio",
                        highlight_label: "🎧",
                        rows: [{ id: `${usedPrefix}ytmp3 ${url}`, title: "Download as Audio", description: "Choose bitrate after" }]
                    }]
                })
            },
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "❌ Cancel",
                    url: "https://wa.me/23288461957",
                    webview_interaction: true,
                    icon: "default"
                })
            }
        ];

        const interactiveMsg = {
            interactiveMessage: {
                header: {
                    title: `📥 ${data.title.substring(0, 40)}${data.title.length > 40 ? '...' : ''}`,
                    hasMediaAttachment: !!imageMessage
                },
                body: {
                    text: `🎬 *${data.title}*\n\n📊 *Available:*\n🎬 Video: ${(data.mp4 || []).length} qualities\n🎵 Audio: ${(data.mp3 || []).length} qualities\n\n📌 *Choose download type:*`
                },
                footer: {
                    text: "🔹 Powered by Omegatech • YouTube"
                },
                contextInfo: {
                    mentionedJid: taggedUsers,
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363403299118246@newsletter',
                        serverMessageId: 142,
                        newsletterName: 'Lady-Trish Channel'
                    }
                },
                nativeFlowMessage: {
                    buttons: buttons
                }
            }
        };

        if (imageMessage) {
            interactiveMsg.interactiveMessage.header.imageMessage = imageMessage;
        }

        await conn.relayMessage(
            chatId,
            interactiveMsg,
            {
                additionalNodes: [
                    {
                        tag: "biz",
                        attrs: {},
                        content: [
                            {
                                tag: "interactive",
                                attrs: { type: "native_flow", v: "1" },
                                content: [{
                                    tag: "native_flow",
                                    attrs: { v: "9", name: "mixed" }
                                }]
                            }
                        ]
                    }
                ]
            }
        );
        return true;
    } catch (e) {
        console.error('Type selector error:', e);
        return false;
    }
}

async function showQualitySelector(conn, chatId, data, type, url, usedPrefix, taggedUsers = []) {
    try {
        const mediaList = type === 'video' ? (data.mp4 || []) : (data.mp3 || []);
        if (mediaList.length === 0) {
            await conn.sendMessage(chatId, { text: `⚠️ No ${type} qualities available.` });
            return false;
        }

        let imageMessage;
        try {
            if (data.thumbnail) {
                const imgResp = await axios.get(data.thumbnail, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(imgResp.data);
                const media = await prepareWAMessageMedia({ image: buffer }, { upload: conn.waUploadToServer });
                imageMessage = media.imageMessage;
            } else {
                const imgResp = await axios.get(CLOUDINARY_IMAGE, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(imgResp.data);
                const media = await prepareWAMessageMedia({ image: buffer }, { upload: conn.waUploadToServer });
                imageMessage = media.imageMessage;
            }
        } catch (e) {}

        const qualityRows = mediaList.map((q, idx) => {
            const cmdName = type === 'video' ? 'ytmp4' : 'ytmp3';
            return {
                id: `${usedPrefix}${cmdName} ${url} --quality ${idx}`,
                title: type === 'video' ? `🎬 ${q.quality}` : `🎵 ${q.quality}`,
                description: `${q.format.toUpperCase()}`
            };
        });

        const qualityButton = {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
                title: `📥 Select ${type === 'video' ? 'Video Quality' : 'Audio Quality'}`,
                sections: [{
                    title: `${type === 'video' ? 'Video' : 'Audio'} Options (${mediaList.length})`,
                    highlight_label: type === 'video' ? "📹" : "🎧",
                    rows: qualityRows
                }]
            })
        };

        const cancelButton = {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
                display_text: "❌ Cancel",
                url: "https://wa.me/23288461957",
                webview_interaction: true,
                icon: "default"
            })
        };

        const interactiveMsg = {
            interactiveMessage: {
                header: {
                    title: `${type === 'video' ? '🎬' : '🎵'} ${data.title.substring(0, 35)}${data.title.length > 35 ? '...' : ''}`,
                    hasMediaAttachment: !!imageMessage
                },
                body: {
                    text: `📌 *Select ${type === 'video' ? 'video' : 'audio'} quality:*\n\n🎬 ${data.title}\n📊 ${mediaList.length} qualities available`
                },
                footer: {
                    text: "🔹 Powered by Omegatech • YouTube"
                },
                contextInfo: {
                    mentionedJid: taggedUsers,
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363418144382782@newsletter',
                        serverMessageId: 142,
                        newsletterName: 'KAMI-MD'
                    }
                },
                nativeFlowMessage: {
                    buttons: [qualityButton, cancelButton]
                }
            }
        };

        if (imageMessage) {
            interactiveMsg.interactiveMessage.header.imageMessage = imageMessage;
        }

        await conn.relayMessage(
            chatId,
            interactiveMsg,
            {
                additionalNodes: [
                    {
                        tag: "biz",
                        attrs: {},
                        content: [
                            {
                                tag: "interactive",
                                attrs: { type: "native_flow", v: "1" },
                                content: [{
                                    tag: "native_flow",
                                    attrs: { v: "9", name: "mixed" }
                                }]
                            }
                        ]
                    }
                ]
            }
        );
        return true;
    } catch (e) {
        console.error('Quality selector error:', e);
        return false;
    }
}

async function downloadAndSend(conn, chatId, data, type, qualityIndex, message, client) {
    try {
        const mediaList = type === 'video' ? (data.mp4 || []) : (data.mp3 || []);
        const selected = mediaList[qualityIndex];

        if (!selected) {
            await client.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return await client.sendMessage(chatId, { text: '❌ Invalid quality selection.' }, { quoted: message });
        }

        await client.sendMessage(chatId, { text: `⬇️ Downloading ${type} in ${selected.quality}...` }, { quoted: message });
        await client.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        if (type === 'video') {
            await conn.sendMessage(chatId, {
                video: { url: selected.url },
                caption: `🎬 *${data.title}*\n📹 Quality: ${selected.quality}\n📁 Format: ${selected.format.toUpperCase()}\n🔹 Source: YouTube\n\n📢 @Lady-Trish Channel`,
                mimetype: 'video/mp4',
                fileName: selected.filename || `${data.title}.mp4`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363418144382782@newsletter',
                        serverMessageId: 142,
                        newsletterName: 'KAMI-MD'
                    }
                }
            }, { quoted: message });
        } else {
            await conn.sendMessage(chatId, {
                audio: { url: selected.url },
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: selected.filename || `${data.title}.mp3`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363403299118246@newsletter',
                        serverMessageId: 142,
                        newsletterName: 'Lady-Trish Channel'
                    }
                }
            }, { quoted: message });
        }

        await client.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        await client.sendMessage(chatId, { text: `✅ *Download Complete!*\n\n🎬 ${data.title}\n📥 ${selected.quality}\n🔹 Enjoy!` }, { quoted: message });

    } catch (e) {
        console.error('Download error:', e);
        await client.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await client.sendMessage(chatId, { text: `❌ Failed to download: ${e.message || 'Unknown error'}` }, { quoted: message });
    }
}

cmd({
    pattern: "yta16",
    alias: ["ytmp412", "ytmp312"],
    react: '📥',
    desc: "Download YouTube videos and audio with quality selection",
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
                text: `📥 *YouTube Downloader*\n\nDownload YouTube videos and audio.\n\n📝 *Usage:*\n${prefix}yt <url> - Choose type\n${prefix}ytmp4 <url> - Download video\n${prefix}ytmp3 <url> - Download audio\n\n📌 *Examples:*\n${prefix}yt https://youtu.be/xxxxx\n${prefix}ytmp4 https://youtu.be/xxxxx\n${prefix}ytmp3 https://youtu.be/xxxxx\n\n⚡ *Powered by Omegatech*`
            }, { quoted: message });
        }

        const fullText = q;

        // Check for quality selection
        const qualityMatch = fullText.match(/^(https?:\/\/[^\s]+)\s*--quality\s+(\d+)/i);
        if (qualityMatch) {
            const url = qualityMatch[1];
            const qualityIndex = parseInt(qualityMatch[2]);

            const cache = global.ytCache[from];
            let data;

            if (cache && cache.url === url) {
                data = cache.data;
            } else {
                await client.sendMessage(from, { text: '⏳ Fetching data...' }, { quoted: message });
                data = await getYTData(url);
            }

            const cmdType = command.toLowerCase();
            const type = (cmdType === 'ytmp3') ? 'audio' : 'video';

            await downloadAndSend(client, from, data, type, qualityIndex, message, client);
            return;
        }

        // Extract URL
        const urlMatch = fullText.match(/(https?:\/\/[^\s]+)/i);
        if (!urlMatch) {
            return await client.sendMessage(from, { text: '❌ Please provide a valid YouTube URL.' }, { quoted: message });
        }

        const url = urlMatch[0];

        if (!/youtube\.com|youtu\.be/i.test(url)) {
            return await client.sendMessage(from, { text: '❌ Please provide a valid YouTube URL.' }, { quoted: message });
        }

        const cmdLower = command.toLowerCase();

        // ytmp4 or ytmp3 - show quality selector directly
        if (cmdLower === 'ytmp4' || cmdLower === 'ytmp3') {
            await client.sendMessage(from, { text: '⏳ Fetching download data...' }, { quoted: message });
            const data = await getYTData(url);

            global.ytCache[from] = {
                data: data,
                url: url,
                timestamp: Date.now()
            };

            const type = (cmdLower === 'ytmp3') ? 'audio' : 'video';
            const sent = await showQualitySelector(client, from, data, type, url, prefix, [message.sender]);

            if (!sent) {
                const mediaList = type === 'video' ? (data.mp4 || []) : (data.mp3 || []);
                let msg = `📥 *${data.title}*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
                msg += `*Available ${type === 'video' ? 'Video' : 'Audio'} Qualities:*\n`;
                mediaList.forEach((qItem, i) => {
                    msg += `${i+1}. ${qItem.quality} (${qItem.format})\n`;
                });
                msg += `\n💡 Reply with: ${prefix}${cmdLower} ${url} --quality <number>`;
                await client.sendMessage(from, { text: msg }, { quoted: message });
            }
            return;
        }

        // yt - show type selector
        if (cmdLower === 'yt') {
            await client.sendMessage(from, { text: '⏳ Fetching YouTube data...' }, { quoted: message });
            const data = await getYTData(url);

            const sent = await showTypeSelector(client, from, data, url, prefix, command, [message.sender]);
            if (!sent) {
                let msg = `📥 *${data.title}*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
                msg += `🎬 Video: ${(data.mp4 || []).length} qualities\n`;
                msg += `🎵 Audio: ${(data.mp3 || []).length} qualities\n\n`;
                msg += `💡 Choose type:\n`;
                msg += `  ${prefix}ytmp4 ${url}\n`;
                msg += `  ${prefix}ytmp3 ${url}`;
                await client.sendMessage(from, { text: msg }, { quoted: message });
            }
            return;
        }

    } catch (e) {
        console.error('YouTube error:', e);
        await client.sendMessage(from, { text: `❌ Error: ${e.message || 'Unknown error'}` }, { quoted: message });
    }
});
