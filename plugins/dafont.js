import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);

async function dafont(query) {
	const res = await fetch('https://www.dafont.com/search.php?q=' + encodeURIComponent(query));

	if (!res.ok) throw new Error(`Status ${res.status}`);

	const data = await res.text();
	const $ = cheerio.load(data);
	const result = [];

	$('.lv1left.dfbg').each((_, el) => {
		const text = $(el).text().replace(/\s+/g, ' ').trim();

		const name = text.split(' by ')[0];
		const creator = text.split(' by ')[1] || '-';

		const total_down = $(el).parent().find('.light').first().text().trim();

		const link = $(el).parent().find('a.dl').attr('href');

		if (link) {
			result.push({
				name,
				creator,
				total_down,
				link: 'https:' + link,
			});
		}
	});

	return result;
}

cmd({
    pattern: "dafont",
    alias: [],
    desc: "Search and download fonts from Dafont",
    category: "downloader",
    react: "🔤",
    filename: __filename,
    limit: true
},
async (conn, mek, m, { from, reply, args, usedPrefix, command }) => {
    try {
        let cmd = args[0]?.toLowerCase();

        if (!cmd) {
            return reply(
                `*Gunakan Salah Satu Command Ini*\n\n` +
                `1 *.dafont search [nama_font]*\n` +
                `   Untuk mencari font berdasarkan nama.\n\n` +
                `2 *.dafont dl [link_download]*\n` +
                `   Untuk mengunduh font dari link hasil pencarian.\n\n` +
                `*Example :*\n` +
                `.dafont search fancy\n` +
                `.dafont dl https://dl.dafont.com/dl/?f=fancy_nancy_2`
            );
        }

        switch (cmd) {
            case 'search': {
                if (!args[1]) {
                    return reply('Mau Cari Apa Di Dafont?');
                }
                const query = args[1];

                // ⏳ React - processing
                await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
                await new Promise(resolve => setTimeout(resolve, 1000));

                let result = await dafont(query);
                if (!result.length) {
                    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
                    return reply(`Font "${query}" tidak ditemukan`);
                }

                let teks = `*『 DAFONT SEARCH 』*`;

                result.slice(0, 10).forEach((font, i) => {
                    teks += `\n\n*${i + 1}. ${font.name}*\n✍️ Creator : ${font.creator}\n⬇️ Download : ${font.total_down}\n🔗 ${font.link}`;
                });

                teks += `\n\nGunakan:\n*.dafont dl [link_download]*`;
                await reply(teks);

                // 800ms delay before success react
                await new Promise(resolve => setTimeout(resolve, 800));
                await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
                break;
            }

            case 'dl': {
                if (!args[1]) {
                    return reply('Mana Link Nya?');
                }
                const url = args[1];
                if (!url.startsWith('https://dl.dafont.com/')) {
                    return reply('❌ Link tidak valid');
                }

                // ⏳ React - processing
                await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
                await new Promise(resolve => setTimeout(resolve, 1000));

                const res = await fetch(url);

                if (!res.ok) {
                    await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
                    return reply(`Terjadi kesalahan ${res.statusText}`);
                }

                const buffer = Buffer.from(await res.arrayBuffer());
                const name = url.split('=').pop();

                await conn.sendMessage(
                    from,
                    {
                        document: buffer,
                        mimetype: 'application/zip',
                        fileName: `${name}.zip`,
                    },
                    { quoted: mek }
                );

                // 800ms delay before success react
                await new Promise(resolve => setTimeout(resolve, 800));
                await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
                break;
            }

            default:
                await reply('*Subcommand Yang Tersedia :*\n.dafont search\n.dafont dl');
        }

    } catch (e) {
        console.error("Error in dafont command:", e);
        // ❌ React - error
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ Terjadi kesalahan: ${e.message}`);
    }
});
