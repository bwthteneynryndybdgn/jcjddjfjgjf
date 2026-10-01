import { fileURLToPath } from 'url'
import { cmd } from '../command.js'
import axios from 'axios'
import FormData from 'form-data'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)

cmd({
    pattern: "hdvideo",
    alias: ["unblurvideo", "vhd"],
    desc: "Enhance and unblur videos to HD (2K) using AI",
    category: "tools",
    react: "✨",
    filename: __filename
}, async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    try {
        const quoted = m.quoted ? m.quoted : m
        const mime = (quoted.msg || quoted).mimetype || ''

        if (!/video/.test(mime)) {
            return reply(`⚠️ *Format salah!*\n\nSilakan balas (quote) video dengan perintah *${usedPrefix + command}*`)
        }

        await reply(`⏳ Sedang memproses video, mohon tunggu sebentar (bisa memakan waktu beberapa menit)...`)
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } })

        const videoBuffer = await quoted.download()
        const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        const SERIAL = crypto.createHash('md5').update(UA + Date.now()).digest('hex')

        const headers = (extra = {}) => Object.assign({
            'accept': '*/*',
            'product-serial': SERIAL,
            'user-agent': UA,
            'Referer': 'https://unblurimage.ai/'
        }, extra)

        // 1. Register File
        const fileName = crypto.randomBytes(3).toString('hex') + '_video.mp4'
        const formReg = new FormData()
        formReg.append('video_file_name', fileName)
        
        const reg = await axios.post('https://api.unblurimage.ai/api/upscaler/v1/ai-video-enhancer/upload-video', formReg, {
            headers: Object.assign(headers(), formReg.getHeaders())
        })

        const { url: ossUrl, object_name: objectName } = reg.data.result

        // 2. Upload to OSS
        await axios.put(ossUrl, videoBuffer, {
            headers: { 'Content-Type': 'video/mp4', 'User-Agent': UA }
        })

        // 3. Create Job
        const formJob = new FormData()
        formJob.append('original_video_file', `https://cdn.unblurimage.ai/${objectName}`)
        formJob.append('resolution', '')
        formJob.append('is_preview', 'false')

        const create = await axios.post('https://api.unblurimage.ai/api/upscaler/v2/ai-video-enhancer/create-job', formJob, {
            headers: Object.assign(headers(), formJob.getHeaders())
        })

        const jobId = create.data.result?.job_id
        if (!jobId) {
            throw new Error('Gagal membuat tugas pemrosesan video.')
        }

        // 4. Polling Job
        let outputUrl = null
        for (let i = 0; i < 60; i++) { // Max 5 menit
            await new Promise(resolve => setTimeout(resolve, 5000))
            const check = await axios.get(`https://api.unblurimage.ai/api/upscaler/v2/ai-video-enhancer/get-job/${jobId}`, {
                headers: headers()
            })
            if (check.data.result?.output_url) {
                outputUrl = check.data.result.output_url
                break
            }
        }

        if (!outputUrl) {
            throw new Error('Proses timeout atau gagal mendapatkan hasil video.')
        }

        await conn.sendMessage(
            from, 
            { 
                video: { url: outputUrl }, 
                caption: '✅ *Video Berhasil di-Enhance (HD/2K)*\n✨ *Powered by KAMRAN-MD*' 
            }, 
            { quoted: mek }
        )

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } })

    } catch (e) {
        console.error('[HDVIDEO ERROR]', e)
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } })
        reply(`❌ Terjadi kesalahan saat memproses video:\n${e.message || e}`)
    }
})
