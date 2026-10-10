// plugins/play.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);

function formatDuration(val) {
	if (!val || val === '-' || val === 'N/A') return '-';
	if (typeof val === 'string' && val.includes(':')) return val;
	const sec = parseInt(val, 10);
	if (isNaN(sec)) return String(val);
	const h = Math.floor(sec / 3600);
	const m = Math.floor((sec % 3600) / 60);
	const s = sec % 60;
	if (h > 0) {
		return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}
	return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function getThumbJpegBuffer(url) {
	if (!url) return null;
	try {
		const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
		const rawBuf = Buffer.from(res.data);
		return await sharp(rawBuf)
			.resize(300, 300, { fit: 'cover' })
			.toFormat('jpeg', { quality: 75 })
			.toBuffer();
	} catch (e) {
		return null;
	}
}

cmd({
    pattern: "play53",
    alias: ["ytmp343", "ytplay65"],
    react: '🎵',
    desc: "Download YouTube audio via API",
    category: "downloader",
    filename: __filename
}, async (client, message, m, { from, prefix, command, q, userConfig }) => {
	const reply = async (text) => {
		return await client.sendMessage(from, { text }, { quoted: message });
	};

	const quotedText = message.quoted ? (message.quoted.text || message.quoted.caption || message.quoted.description || message.quoted.msg?.caption || message.quoted.msg?.text || '') : '';
	const rawInput = (q || quotedText || '').trim();
	const urlMatch = rawInput.match(/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s]+/i);
	const targetQuery = urlMatch ? urlMatch[0] : rawInput;

	if (!targetQuery) {
		return reply(`Masukan judul lagu yang ingin dicari atau link YouTube!\n\nContoh: \`${prefix + command} Evaluasi - Hindia\`\nAtau reply pesan yang berisi judul/link YouTube!`);
	}

	const sendReact = (emoji) => client.sendMessage(from, { react: { text: emoji, key: message.key } }).catch(() => {});

	if (global.mess?.wait) reply(global.mess.wait);
	await sendReact('🕒');

	try {
		const isUrl = /^https?:\/\//i.test(targetQuery);
		let targetUrl = targetQuery;
		let title = '';
		let thumbnail = '';
		let duration = '';
		let channel = '';
		let views = 'N/A';

		if (!isUrl) {
            // Direct API endpoint without global.API error
			const searchApi = `https://kyzz.biz.id/api/search/yts?q=${encodeURIComponent(targetQuery)}`;
			const searchRes = await axios.get(searchApi, { timeout: 12000 });
			const searchData = searchRes.data;

			if (!searchData?.status || !Array.isArray(searchData?.results) || searchData.results.length === 0) {
				await sendReact('✖️');
				return reply(`Lagu *${targetQuery}* tidak ditemukan.`);
			}

			const first = searchData.results[0];
			targetUrl = first.url || `https://youtu.be/${first.id}`;
			title = first.title || '';
			thumbnail = first.thumbnails && first.thumbnails[0] ? first.thumbnails[0].url : (first.image || '');
			duration = typeof first.duration === 'object' ? (first.duration?.text || '') : String(first.duration || '');
			channel = typeof first.channel === 'object' ? (first.channel?.name || '') : String(first.channel || '');
			views = first.view_count ? Number(first.view_count).toLocaleString() : (first.views || 'N/A');
		}

		const dlApi = `https://kyzz.biz.id/api/download/ytmp3?url=${encodeURIComponent(targetUrl)}`;
		const [dlRes, thumbBuffer] = await Promise.all([
			axios.get(dlApi, { timeout: 35000 }),
			thumbnail ? getThumbJpegBuffer(thumbnail) : Promise.resolve(null)
		]);

		const dlData = dlRes.data;
		if (!dlData?.status || !dlData?.result?.downloadUrl) {
			await sendReact('✖️');
			return reply(`Gagal mengunduh audio untuk lagu *${title || targetQuery}*.`);
		}

		const audioUrl = dlData.result.downloadUrl;
		const trackTitle = title || dlData.result.title || 'YouTube Music';
		const trackChannel = channel || 'YouTube';
		const rawDuration = duration || dlData.result.duration || 'N/A';
		const trackDuration = formatDuration(rawDuration);

		const captionText = `🎵 *${trackTitle}*\n\n» Channel : ${trackChannel}\n» Durasi : ${trackDuration}\n» Views : ${views}\n» Link : ${targetUrl}`;

		if (client && typeof client.sendButtons === 'function') {
			await client.sendButtons(from, {
				location: {
					degreesLatitude: 0,
					degreesLongitude: 0,
					name: trackTitle,
					address: `Channel: ${trackChannel} • Durasi: ${trackDuration}`,
					jpegThumbnail: thumbBuffer
				},
				text: '',
				footer: captionText
			}, { quoted: message });
		} else {
			await client.sendMessage(from, {
				location: {
					degreesLatitude: 0,
					degreesLongitude: 0,
					name: trackTitle,
					address: `Channel: ${trackChannel} • Durasi: ${trackDuration}`,
					jpegThumbnail: thumbBuffer
				},
				caption: captionText
			}, { quoted: message });
		}

		await client.sendMessage(from, {
			audio: { url: audioUrl },
			mimetype: 'audio/mpeg',
			fileName: `${trackTitle.replace(/[\\/:*?"<>|]/g, '')}.mp3`,
			ptt: false
		}, { quoted: message });

		await sendReact('✅');
	} catch (e) {
		console.error('[PLAY ERROR]', e);
		await sendReact('✖️');
		return reply(e.message || String(e));
	}
});
