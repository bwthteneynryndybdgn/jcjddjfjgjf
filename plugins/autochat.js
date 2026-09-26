import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "tts2",
    alias: ["texttospeech", "speak", "voice"],
    desc: "Convert text into speech audio using AI TTS API.",
    category: "ai",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        let text = q ? q.trim() : "";

        if (!text && m.quoted) {
            text = m.quoted.text || m.quoted.caption || "";
        }

        if (!text) {
            return await reply("❌ Please provide text for text-to-speech!\n\n*Usage:* \n.tts Hello! This is a test.");
        }

        const apiUrl = `https://api.princetechn.com/api/ai/tts?apikey=prince&text=${encodeURIComponent(text)}&voice=en_us_female`;
        
        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            validateStatus: status => status >= 200 && status < 500
        });

        if (response.data) {
            let contentType = response.headers['content-type'] || '';
            
            if (contentType.includes('application/json')) {
                let jsonStr = Buffer.from(response.data).toString('utf-8');
                let jsonObj = JSON.parse(jsonStr);
                return await reply(`❌ API Error: ${jsonObj.message || JSON.stringify(jsonObj)}`);
            }

            let audioBuffer = Buffer.from(response.data);

            return await conn.sendMessage(from, { 
                audio: audioBuffer, 
                mimetype: 'audio/mp4', 
                ptt: false 
            }, { quoted: mek });

        } else {
            return await reply("❌ TTS API se koi response nahi mila.");
        }

    } catch (e) {
        console.log(e);
        return await reply(`❌ Error occurred: ${e.message}`);
    }
});
