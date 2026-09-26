import { fileURLToPath } from 'url';
import axios from 'axios';
import fs from 'fs';
import config from '../config.js';
import { cmd, commands } from '../command.js';
import { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } from '../lib/functions.js';

const __filename = fileURLToPath(import.meta.url);

var imgmsg = "*Give me an anime name !*";
var descgs = "It gives details of given anime name.";
var cants = "I cant find this anime.";

//====================================================================================
cmd({
    pattern: "garl",
    alias: ["imgloli"],
    react: '😎',
    desc: "Download anime loli images.",
    category: "anime",
    use: '.loli',
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        let res = await axios.get('https://api.lolicon.app/setu/v2?num=1&r18=0&tag=lolicon');
        let wm = `😎 Random Garl image\n\n*𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃*`;
        await conn.sendMessage(from, { image: { url: res.data.data[0].urls.original }, caption: wm }, { quoted: mek });
    } catch (e) {
        reply(cants);
        console.log(e);
    }
});

//=====================================================================
cmd({
    pattern: "waifu",
    alias: ["imgwaifu"],
    react: '💫',
    desc: "Download anime waifu images.",
    category: "anime",
    use: '.waifu',
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        let res = await axios.get('https://api.waifu.pics/sfw/waifu');
        let wm = `🩵 Random Waifu image\n\n*𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃*`;
        await conn.sendMessage(from, { image: { url: res.data.url }, caption: wm }, { quoted: mek });
    } catch (e) {
        reply(cants);
        console.log(e);
    }
});

//================================================================
cmd({
    pattern: "neko",
    alias: ["imgneko"],
    react: '💫',
    desc: "Download anime neko images.",
    category: "anime",
    use: '.neko',
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        let res = await axios.get('https://api.waifu.pics/sfw/neko');
        let wm = `🩷 Random neko image\n\n*𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃*`;
        await conn.sendMessage(from, { image: { url: res.data.url }, caption: wm }, { quoted: mek });
    } catch (e) {
        reply(cants);
        console.log(e);
    }
});

//=====================================================================
cmd({
    pattern: "megumin",
    alias: ["imgmegumin"],
    react: '💕',
    desc: "Download anime megumin images.",
    category: "anime",
    use: '.megumin',
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        let res = await axios.get('https://api.waifu.pics/sfw/megumin');
        let wm = `❤️‍🔥Random megumin image\n\n*𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃*`;
        await conn.sendMessage(from, { image: { url: res.data.url }, caption: wm }, { quoted: mek });
    } catch (e) {
        reply(cants);
        console.log(e);
    }
});

//================================================================
cmd({
    pattern: "maid",
    alias: ["imgmaid"],
    react: '💫',
    desc: "Download anime maid images.",
    category: "anime",
    use: '.maid',
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        let res = await axios.get('https://api.waifu.im/search/?included_tags=maid');
        let wm = `😎 Random maid image\n\n*𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃*`;
        await conn.sendMessage(from, { image: { url: res.data.images[0].url }, caption: wm }, { quoted: mek });
    } catch (e) {
        reply(cants);
        console.log(e);
    }
});

//=====================================================================
cmd({
    pattern: "awoo",
    alias: ["imgawoo"],
    react: '😎',
    desc: "Download anime awoo images.",
    category: "anime",
    use: '.awoo',
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        let res = await axios.get('https://api.waifu.pics/sfw/awoo');
        let wm = `😎 Random awoo image\n\n*𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃*`;
        await conn.sendMessage(from, { image: { url: res.data.url }, caption: wm }, { quoted: mek });
    } catch (e) {
        reply(cants);
        console.log(e);
    }
});

//========== Anime Girls ==========

cmd({
    pattern: "animegirl",
    desc: "Fetch a random anime girl image.",
    category: "fun",
    react: "🧚🏻",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get('https://api.waifu.pics/sfw/waifu');
        await conn.sendMessage(from, { image: { url: response.data.url }, caption: '*ANIME GIRL IMAGE* 🥳\n\n\n *> 𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃*' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});

cmd({
    pattern: "animegirl1",
    desc: "Fetch a random anime girl image.",
    category: "fun",
    react: "🧚🏻",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get('https://api.waifu.pics/sfw/waifu');
        await conn.sendMessage(from, { image: { url: response.data.url }, caption: 'ANIME GIRL IMAGE 👾\n\n\n > *𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃*' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});

cmd({
    pattern: "animegirl2",
    desc: "Fetch a random anime girl image.",
    category: "fun",
    react: "🧚🏻",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get('https://api.waifu.pics/sfw/waifu');
        await conn.sendMessage(from, { image: { url: response.data.url }, caption: 'ANIME GIRL IMAGE 👾\n\n\n > *𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃*' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});

cmd({
    pattern: "animegirl3",
    desc: "Fetch a random anime girl image.",
    category: "fun",
    react: "🧚🏻",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get('https://api.waifu.pics/sfw/waifu');
        await conn.sendMessage(from, { image: { url: response.data.url }, caption: 'ANIME GIRL IMAGE 👾\n\n\n > *𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃*' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});

cmd({
    pattern: "animegirl4",
    desc: "Fetch a random anime girl image.",
    category: "fun",
    react: "🧚🏻",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get('https://api.waifu.pics/sfw/waifu');
        await conn.sendMessage(from, { image: { url: response.data.url }, caption: 'ANIME GIRL IMAGE 👾\n\n\n > 𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});

cmd({
    pattern: "animegirl5",
    desc: "Fetch a random anime girl image.",
    category: "fun",
    react: "🧚🏻",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get('https://api.waifu.pics/sfw/waifu');
        await conn.sendMessage(from, { image: { url: response.data.url }, caption: 'ANIME GIRL IMAGE 👾\n\n\n > 𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});

//========== Anime Collections ==========

cmd({
    pattern: "anime",
    desc: "anime the bot",
    category: "main",
    react: "⛱️",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        let dec = `> 𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃 ANIME IMGS*`;
        const urls = [
            'https://telegra.ph/file/b26f27aa5daaada031b90.jpg',
            'https://telegra.ph/file/51b44e4b086667361061b.jpg',
            'https://telegra.ph/file/7d165d73f914985542537.jpg',
            'https://telegra.ph/file/3d9732d2657d2d72dc102.jpg',
            'https://telegra.ph/file/8daf7e432a646f3ebe7eb.jpg',
            'https://telegra.ph/file/7514b18ea89da924e7496.jpg',
            'https://telegra.ph/file/ce9cb5acd2cec7693d76b.jpg'
        ];
        for (let url of urls) {
            await conn.sendMessage(from, { image: { url }, caption: dec }, { quoted: mek });
        }
    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});

cmd({
    pattern: "anime1",
    desc: "Anime image pack 1.",
    react: "🧚‍♀️",
    category: "other",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const urls = [
            'https://i.waifu.pics/aD7t0Bc.jpg',
            'https://i.waifu.pics/PQO5wPN.jpg',
            'https://i.waifu.pics/5At1P4A.jpg',
            'https://i.waifu.pics/MjtH3Ha.jpg',
            'https://i.waifu.pics/QQW7VKy.jpg'
        ];
        for (let url of urls) {
            await conn.sendMessage(from, { image: { url }, caption: '> 𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃' }, { quoted: mek });
        }
    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});

cmd({
    pattern: "anime2",
    desc: "Anime image pack 2.",
    react: "🧚‍♀️",
    category: "other",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const urls = [
            'https://i.waifu.pics/0r1Bn88.jpg',
            'https://i.waifu.pics/2Xdpuov.png',
            'https://i.waifu.pics/0hx-3AP.png',
            'https://i.waifu.pics/q054x0_.png',
            'https://i.waifu.pics/4lyqRvd.jpg'
        ];
        for (let url of urls) {
            await conn.sendMessage(from, { image: { url }, caption: '> 𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃' }, { quoted: mek });
        }
    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});

cmd({
    pattern: "anime3",
    desc: "Anime image pack 3.",
    react: "🧚‍♀️",
    category: "other",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const urls = [
            'https://i.waifu.pics/gnpc_Lr.jpeg',
            'https://i.waifu.pics/P6X-ph6.jpg',
            'https://i.waifu.pics/~p5W9~k.png',
            'https://i.waifu.pics/7Apu5C9.jpg',
            'https://i.waifu.pics/OTRfON6.jpg'
        ];
        for (let url of urls) {
            await conn.sendMessage(from, { image: { url }, caption: '> 𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃' }, { quoted: mek });
        }
    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});

cmd({
    pattern: "anime4",
    desc: "Anime image pack 4.",
    react: "🧚‍♀️",
    category: "other",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const urls = [
            'https://i.waifu.pics/aGgUm80.jpg',
            'https://i.waifu.pics/i~RQhRD.png',
            'https://i.waifu.pics/94LH-aU.jpg',
            'https://i.waifu.pics/V8hvqfK.jpg',
            'https://i.waifu.pics/lMiXE7j.png'
        ];
        for (let url of urls) {
            await conn.sendMessage(from, { image: { url }, caption: '> 𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃' }, { quoted: mek });
        }
    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});

cmd({
    pattern: "anime5",
    desc: "Anime image pack 5.",
    react: "🧚‍♀️",
    category: "other",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const urls = [
            'https://i.waifu.pics/-ABlAvr.jpg',
            'https://i.waifu.pics/HNEg0-Q.png',
            'https://i.waifu.pics/3x~ovC6.jpg',
            'https://i.waifu.pics/brv-GJu.jpg',
            'https://i.waifu.pics/FWE8ggD.png'
        ];
        for (let url of urls) {
            await conn.sendMessage(from, { image: { url }, caption: '> 𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃' }, { quoted: mek });
        }
    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});

//========== Dog Image ==========

cmd({
    pattern: "dog",
    desc: "Fetch a random dog image.",
    category: "fun",
    react: "🐶",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get('https://dog.ceo/api/breeds/image/random');
        await conn.sendMessage(from, { image: { url: response.data.message }, caption: '> *𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃*' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`єяяσя ƒєт¢нιηg ∂σg ιмαgє: ${e.message}`);
    }
});
