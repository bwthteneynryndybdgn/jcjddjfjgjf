import { fileURLToPath } from 'url'
import { cmd } from '../command.js'
import axios from 'axios'

const __filename = fileURLToPath(import.meta.url)

cmd({
    pattern: "tiktok",
    alias: ["tt", "ttdl"],
    desc: "Download TikTok videos without watermark using KamranTech API",
    category: "downloader",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    const reactKey = m.key

    try {
        if (!text || !text.trim() || !text.includes('tiktok')) {
            await conn.sendMessage(from, { react: { text: '❌', key: reactKey } }).catch(() => {})
            return reply(
                `╭─❏ 「 TIKTOK DOWNLOADER 」\n` +
                `│ Please provide a valid TikTok URL!\n` +
                `│ Example: ${usedPrefix + command} https://vt.tiktok.com/ZSbxYd9FU/\n` +
                `╰───────────────\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
            )
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: reactKey } })

        const tiktokUrl = text.trim()
        const apiKey = "KAMRAN-MASTER-2026"
        const apiUrl = `https://kamrantech-apis.vercel.app/api/download/tiktok?url=${encodeURIComponent(tiktokUrl)}&key=${apiKey}`
        
        const response = await axios.get(apiUrl, { timeout: 30000, validateStatus: () => true })
        const json = response.data

        if (!json || !json.status || !json.data) {
            await conn.sendMessage(from, { react: { text: "❌", key: reactKey } }).catch(() => {})
            return reply(
                `╭─❏ 「 TIKTOK DOWNLOADER 」\n` +
                `│ Failed to fetch TikTok video. Link might be invalid.\n` +
                `╰───────────────\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
            )
        }

        // API response ke mutabiq video download link (no watermark) extract karna
        const videoData = json.data
        const videoUrl = videoData.nowm || videoData.url || videoData.video || videoData.download || (typeof videoData === 'string' ? videoData : null)

        if (!videoUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: reactKey } }).catch(() => {})
            return reply(
                `╭─❏ 「 TIKTOK DOWNLOADER 」\n` +
                `│ Video download link not found in API response.\n` +
                `╰───────────────\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
            )
        }

        const title = videoData.title || videoData.desc || "TikTok_Video"
        const author = videoData.author || videoData.nickname || "Unknown"

        await conn.sendMessage(from, { react: { text: "📤", key: reactKey } })

        // Send as Document / Video
        const safeFileName = `${title.replace(/[<>:"/\\|?*]/g, '_').substring(0, 50)}.mp4`
        await conn.sendMessage(
            from,
            {
                document: { url: videoUrl },
                fileName: safeFileName,
                mimetype: "video/mp4",
                caption: `╭─❏ 「 TIKTOK DOWNLOAD 」\n` +
                         `│ 📝 *Caption:* ${title}\n` +
                         `│ 👤 *Author:* ${author}\n` +
                         `╰───────────────\n` +
                         `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
            },
            { quoted: mek }
        )

        await conn.sendMessage(from, { react: { text: "✅", key: reactKey } })

    } catch (error) {
        console.error('TikTok download error:', error)
        await conn.sendMessage(from, { react: { text: "❌", key: reactKey } }).catch(() => {})
        reply(
            `╭─❏ 「 ERROR 」\n` +
            `│ TikTok download failed.\n` +
            `│ ${error.message || error}\n` +
            `╰───────────────\n` +
            `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
        )
    }
})
