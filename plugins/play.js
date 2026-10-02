import { fileURLToPath } from 'url'
import { cmd } from '../command.js'
import axios from 'axios'
import yts from 'yt-search'

const __filename = fileURLToPath(import.meta.url)

cmd({
    pattern: "play89",
    alias: ["ply", "playy", "pl"],
    desc: "Search & download songs from YouTube as audio and document",
    category: "downloader",
    react: "⌛",
    filename: __filename
}, async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    const reactKey = m.key

    try {
        const query = text ? text.trim() : ''

        if (!query) {
            await conn.sendMessage(from, { react: { text: '❌', key: reactKey } }).catch(() => {})
            return reply(
                `╭─❏ 「 PLAY 」\n` +
                `│ You forgot to type something, genius.\n` +
                `│ Give me a song name OR a YouTube link.\n` +
                `│ Example: ${usedPrefix + command} harlem shake\n` +
                `│ Or: ${usedPrefix + command} https://youtu.be/dQw4w9WgXcQ\n` +
                `╰───────────────\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
            )
        }

        const isYoutubeLink = /(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?[a-zA-Z0-9_-]{11})/gi.test(query)

        let targetUrl = query
        let songInfo = null

        if (isYoutubeLink) {
            const match = query.match(/(?:youtu\.be\/|watch\?v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/)
            if (match && match[1]) {
                try {
                    const info = await yts({ videoId: match[1] })
                    if (info) songInfo = info
                } catch {}
            }
        } else {
            // yt-search integration for query text
            const search = await yts(query)
            if (!search || !search.videos || search.videos.length === 0) {
                await conn.sendMessage(from, { react: { text: '❌', key: reactKey } })
                return reply(
                    `╭─❏ 「 PLAY 」\n` +
                    `│ No song found for "${query}".\n` +
                    `│ Your music taste is as bad as your search skills.\n` +
                    `╰───────────────\n` +
                    `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
                )
            }
            songInfo = search.videos[0]
            targetUrl = songInfo.url
        }

        let audioUrl, filename, thumbnail, sourceUrl

        // Try primary Sidycoders API
        try {
            const response = await axios.get(`https://api.sidycoders.xyz/api/ytdl?url=${encodeURIComponent(targetUrl)}&format=mp3&apikey=memberdycoders`, {
                timeout: 30000,
                validateStatus: () => true
            })
            const data = response.data
            if (data && data.status && data.cdn) {
                audioUrl = data.cdn
                filename = data.title || songInfo?.title || "Unknown YouTube Song"
                thumbnail = songInfo?.thumbnail || ""
                sourceUrl = targetUrl
            }
        } catch {}

        // Fallback to Apiziaul API if primary fails
        if (!audioUrl) {
            try {
                const response = await axios.get(`https://apiziaul.vercel.app/api/downloader/ytplaymp3?query=${encodeURIComponent(songInfo?.title || query)}`, {
                    timeout: 30000,
                    validateStatus: () => true
                })
                const data = response.data
                if (data && data.status && data.result?.downloadUrl) {
                    audioUrl = data.result.downloadUrl
                    filename = data.result.title || songInfo?.title || "Unknown Song"
                    thumbnail = data.result.thumbnail || songInfo?.thumbnail || ""
                    sourceUrl = data.result.videoUrl || targetUrl
                }
            } catch {}
        }

        if (!audioUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: reactKey } })
            return reply(
                `╭─❏ 「 PLAY 」\n` +
                `│ Can't download that song right now.\n` +
                `│ The link or API is currently unavailable.\n` +
                `╰───────────────\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
            )
        }

        await conn.sendMessage(from, { react: { text: '✅', key: reactKey } })

        // Send as Audio with thumbnail ad reply
        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${filename}.mp3`,
            contextInfo: thumbnail ? {
                externalAdReply: {
                    title: filename.substring(0, 30),
                    body: "KAMRAN-MD",
                    thumbnailUrl: thumbnail,
                    sourceUrl: sourceUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            } : undefined
        }, { quoted: mek })

        // Send as Document
        const safeFileName = filename.replace(/[<>:"/\\|?*]/g, '_')
        await conn.sendMessage(from, {
            document: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${safeFileName}.mp3`,
            caption: `╭─❏ 「 PLAY 」\n│ ${filename}\n╰───────────────\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
        }, { quoted: mek })

    } catch (error) {
        console.error('Play error:', error)
        await conn.sendMessage(from, { react: { text: '❌', key: reactKey } }).catch(() => {})
        reply(
            `╭─❏ 「 PLAY ERROR 」\n` +
            `│ Play failed. The universe rejects your music taste.\n` +
            `╰───────────────\n` +
            `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
        )
    }
})
