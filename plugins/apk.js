import { fileURLToPath } from 'url'
import { cmd } from '../command.js'
import axios from 'axios'

const __filename = fileURLToPath(import.meta.url)

cmd({
    pattern: "apk",
    alias: ["modapk", "downloadapk"],
    desc: "Search and download APK files from Aptoide",
    category: "downloader",
    react: "⌛",
    filename: __filename
}, async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    const reactKey = m.key

    try {
        if (!text || !text.trim()) {
            await conn.sendMessage(from, { react: { text: '❌', key: reactKey } }).catch(() => {})
            return reply(
                `╭─❏ 「 APK 」\n` +
                `│ Provide an app name, you brainless creature!\n` +
                `╰───────────────\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
            )
        }

        await conn.sendMessage(from, { react: { text: "⌛", key: reactKey } })

        const query = text.trim()
        const apiUrl = `https://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(query)}`
        
        const response = await axios.get(apiUrl, { timeout: 30000, validateStatus: () => true })
        const data = response.data

        if (!data?.datalist?.list?.length) {
            await conn.sendMessage(from, { react: { text: "❌", key: reactKey } }).catch(() => {})
            return reply(
                `╭─❏ 「 APK 」\n` +
                `│ App not found!\n` +
                `╰───────────────\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
            )
        }

        const app = data.datalist.list[0]
        const apkUrl = app.file?.path

        if (!apkUrl) {
            await conn.sendMessage(from, { react: { text: "❌", key: reactKey } }).catch(() => {})
            return reply(
                `╭─❏ 「 APK 」\n` +
                `│ APK download link not available!\n` +
                `╰───────────────\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
            )
        }

        await conn.sendMessage(
            from,
            {
                document: { url: apkUrl },
                fileName: `${app.name || 'app'}.apk`,
                mimetype: "application/vnd.android.package-archive",
                caption: `╭─❏ 「 APK DOWNLOADER 」\n│ 📱 *Name:* ${app.name}\n│ 📦 *Package:* ${app.package || 'N/A'}\n╰───────────────\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
            },
            { quoted: mek }
        )

        await conn.sendMessage(from, { react: { text: "✅", key: reactKey } })

    } catch (error) {
        console.error('APK error:', error)
        await conn.sendMessage(from, { react: { text: "❌", key: reactKey } }).catch(() => {})
        reply(
            `╭─❏ 「 APK ERROR 」\n` +
            `│ APK download failed, not my problem.\n` +
            `│ ${error.message || error}\n` +
            `╰───────────────\n` +
            `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
        )
    }
})
