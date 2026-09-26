import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

/////////////////////////////
// 🎭 KAMRAN MD TRICK SYSTEM
/////////////////////////////

cmd({
    pattern: "trick",
    react: "🎭",
    desc: "Basic trick message",
    category: "trick",
    filename: __filename
}, async (conn, mek, m, { reply }) => {

    reply("🎭 This is just a trick command 😄");
});

cmd({
    pattern: "joke",
    react: "😂",
    category: "trick",
    filename: __filename
}, async (conn, mek, m, { reply }) => {

    let jokes = [
        "😂 Teacher: Homework kahan hai? Student: WhatsApp crash ho gaya 😎",
        "🤣 Main lazy nahi hoon, main energy saving mode pe hoon",
        "😆 Mobile ka charger hi mera best friend hai"
    ];

    reply(jokes[Math.floor(Math.random() * jokes.length)]);
});

cmd({
    pattern: "fakehack",
    react: "💻",
    category: "trick",
    filename: __filename
}, async (conn, mek, m, { reply }) => {

    let steps = [
        "Hacking WhatsApp...",
        "Accessing servers...",
        "Bypassing security...",
        "Getting data...",
        "❌ Just kidding! This is fake 😂"
    ];

    reply(steps.join("\n"));
});

cmd({
    pattern: "hack",
    react: "🕵️",
    category: "trick",
    filename: __filename
}, async (conn, mek, m, { reply }) => {

    reply("🕵️ System hacked successfully (just for fun 😄)");
});

cmd({
    pattern: "prank",
    react: "🤣",
    category: "trick",
    filename: __filename
}, async (conn, mek, m, { reply }) => {

    reply("🤣 You got pranked! Nothing happened 😂");
});

cmd({
    pattern: "troll",
    react: "😜",
    category: "trick",
    filename: __filename
}, async (conn, mek, m, { reply }) => {

    reply("😜 You are officially trolled!");
});

cmd({
    pattern: "magic",
    react: "🪄",
    category: "trick",
    filename: __filename
}, async (conn, mek, m, { reply }) => {

    let result = ["🪄 Abracadabra!", "✨ Magic happened!", "🎩 Nothing in your hand!"];

    reply(result[Math.floor(Math.random() * result.length)]);
});

cmd({
    pattern: "luck",
    react: "🍀",
    category: "trick",
    filename: __filename
}, async (conn, mek, m, { reply }) => {

    let chance = Math.floor(Math.random() * 100);

    reply(`🍀 Your luck level: ${chance}%`);
});

cmd({
    pattern: "truth",
    react: "🧠",
    category: "trick",
    filename: __filename
}, async (conn, mek, m, { reply }) => {

    let truths = [
        "🧠 You are smarter than you think",
        "😄 Smile, it’s free medicine",
        "🔥 Hard work beats talent"
    ];

    reply(truths[Math.floor(Math.random() * truths.length)]);
});

cmd({
    pattern: "fakeerror",
    react: "⚠️",
    category: "trick",
    filename: __filename
}, async (conn, mek, m, { reply }) => {

    reply("⚠️ ERROR 404: Brain not found 😂");
});

cmd({
    pattern: "coinflip",
    react: "🪙",
    category: "trick",
    filename: __filename
}, async (conn, mek, m, { reply }) => {

    let result = Math.random() > 0.5 ? "HEADS 🪙" : "TAILS 🪙";

    reply(`🪙 Coin Flip Result: ${result}`);
});

cmd({
    pattern: "scream",
    react: "😱",
    category: "trick",
    filename: __filename
}, async (conn, mek, m, { reply }) => {

    reply("😱 AAAAAAAHHHHHH!!! (just prank 😆)");
});

cmd({
    pattern: "silent",
    react: "🤫",
    category: "trick",
    filename: __filename
}, async (conn, mek, m, { reply }) => {

    reply("🤫 Silent mode activated... no one is talking 😶");
});


