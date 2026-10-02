import { fileURLToPath } from 'url'
import { cmd } from '../command.js'
import axios from 'axios'

const __filename = fileURLToPath(import.meta.url)

cmd({
    pattern: "ai3",
    alias: ["chat3", "gpt3", "deepseek3"],
    desc: "Chat with AI assistant",
    category: "ai",
    react: "⌛",
    filename: __filename
}, async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    const reactKey = m.key

    try {
        if (!text || !text.trim()) {
            await conn.sendMessage(from, { react: { text: '❌', key: reactKey } }).catch(() => {})
            return reply(
                `╭─❏ 「 Eʀʀᴏʀ 」\n` +
                `│ Give me something to work with.\n` +
                `╰───────────────\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
            )
        }

        await conn.sendMessage(from, { react: { text: '⌛', key: reactKey } })

        const apiUrl = `https://api.snowping.cfd/api/aichat/chatbot?text=${encodeURIComponent(text.trim())}&model=deepseek%2Fdeepseek-chat`
        const response = await axios.get(apiUrl, { timeout: 30000, validateStatus: () => true })
        const json = response.data

        if (!json || json.status !== 200 || !json.result) {
            throw new Error(json?.message || 'Gagal mendapatkan respons dari API AI.')
        }

        const aiReply = json.result.response || 'Tidak ada respons.'

        await conn.sendMessage(from, { react: { text: '✅', key: reactKey } })
        
        reply(
            `╭─❏ 「 Cʜᴀᴛ 」\n` +
            `│ ${aiReply}\n` +
            `╰───────────────\n` +
            `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
        )

    } catch (error) {
        console.error('chat error:', error)
        await conn.sendMessage(from, { react: { text: '❌', key: reactKey } }).catch(() => {})
        reply(
            `╭─❏ 「 Eʀʀᴏʀ 」\n` +
            `│ ${error.message || error}\n` +
            `╰───────────────\n` +
            `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 KAMRAN-MD`
        )
    }
})
