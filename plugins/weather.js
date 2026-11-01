// plugins/weather.js
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import config from '../config.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// Stylish Text Helper
const toStylistUpper = (text) => {
    if (!text || typeof text !== 'string') return '';
    const map = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
        'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
        's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    };
    return text.split('').map(char => map[char.toLowerCase()] || char).join('');
};

cmd({
    pattern: "weather",
    alias: ["wa", "mosam"],
    react: '🌤️',
    desc: "Check live weather of any city",
    category: "search",
    filename: __filename
}, async (client, message, m, { from, prefix, command, q }) => {
    try {
        // 1. Input Check
        if (!q) {
            return await client.sendMessage(from, {
                text: `❖─── ✦ *${toStylistUpper('Weather Checker')}* ✦ ───❖\n\n║ ⚠️ ${toStylistUpper('Please provide a city name!')}\n\n║  ${toStylistUpper('Example:')}\n║ • .weather Islamabad\n║ • .weather Lahore\n╚══════════════════════✧`
            }, { quoted: message });
        }

        // React: Searching
        await client.sendMessage(from, { react: { text: '🔍', key: message.key } });

        // 2. API Call (Shizo Top Weather API)
        const apiUrl = `https://api.shizo.top/tools/weather?apikey=shizo&city=${encodeURIComponent(q.trim())}`;
        const response = await axios.get(apiUrl, { timeout: 15000 });
        const resData = response.data;

        // 3. Validation based on your JSON structure
        if (!resData || !resData.status || !resData.data) {
            throw new Error("City not found or API error");
        }

        const data = resData.data;
        
        // Extracting values from your specific JSON format
        const city = data.city || q;
        const country = data.country || "Unknown";
        const temp = data.temperature || "N/A";
        const feelsLike = data.feels_like || "N/A";
        const humidity = data.humidity || "N/A";
        const windSpeed = data.wind?.speed || "N/A";
        const condition = data.weather?.[0]?.description || "Unknown";
        const iconCode = data.weather?.[0]?.icon || "";

        // Map OpenWeather icon codes to Emojis for better look
        let weatherEmoji = "🌡️";
        if (iconCode.includes('01')) weatherEmoji = "☀️";
        else if (iconCode.includes('02')) weatherEmoji = "⛅";
        else if (iconCode.includes('03') || iconCode.includes('04')) weatherEmoji = "☁️";
        else if (iconCode.includes('09') || iconCode.includes('10')) weatherEmoji = "🌧️";
        else if (iconCode.includes('11')) weatherEmoji = "⛈️";
        else if (iconCode.includes('13')) weatherEmoji = "❄️";
        else if (iconCode.includes('50')) weatherEmoji = "🌫️";

        // 4. Stylish Caption Design
        const caption = `❖─── ✦ *${toStylistUpper('Live Weather Update')}* ✦ ───❖

╔═════ ⌈ *${weatherEmoji} ${toStylistUpper(city.toUpperCase())}* ⌋ ═════✧
║ 📍 *${toStylistUpper('Country')}:* ${country}
║ 🌡️ *${toStylistUpper('Temperature')}:* ${temp}°C
║ 🥵 *${toStylistUpper('Feels Like')}:* ${feelsLike}°C
║ 💧 *${toStylistUpper('Humidity')}:* ${humidity}%
║ 💨 *${toStylistUpper('Wind Speed')}:* ${windSpeed} m/s
║ ☁️ *${toStylistUpper('Condition')}:* ${toStylistUpper(condition)}
╚══════════════════════✧

> 💫 _${toStylistUpper(config.DESCRIPTION || 'Powered by Bot')}_`;

        // 5. Send Message
        await client.sendMessage(from, { text: caption }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error("Weather Error:", error);
        await client.sendMessage(from, {
            text: `❖─── ✦ *${toStylistUpper('Error')}* ✦ ───❖\n\n║ ❌ ${toStylistUpper(error.message || 'Failed to fetch weather')}\n╚══════════════════════✧`
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});
