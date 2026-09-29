import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "encryptv2",
    alias: ["encryptcode", "obfuscate"],
    desc: "Encrypt or obfuscate JavaScript code using encryptv2 API.",
    category: "tools",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        let code = q ? q.trim() : "";

        if (!code && m.quoted) {
            code = m.quoted.text || m.quoted.caption || "";
        }

        if (!code) {
            return await reply("❌ Please provide JavaScript code to encrypt!\n\n*Usage:* \n.encryptv2 console.log('Hello')");
        }

        await reply("⏳ Encrypting code, please wait...");

        const apiUrl = `https://api.princetechn.com/api/tools/encryptv2?apikey=prince&code=${encodeURIComponent(code)}`;
        
        const response = await axios.get(apiUrl, {
            timeout: 60000,
            validateStatus: status => status >= 200 && status < 500
        });

        if (response.data) {
            let resData = response.data;
            let encryptedCode = '';

            if (typeof resData.result === 'string') {
                encryptedCode = resData.result;
            } else if (resData.result?.encrypted_code) {
                if (typeof resData.result.encrypted_code === 'string') {
                    encryptedCode = resData.result.encrypted_code;
                } else if (resData.result.encrypted_code.error) {
                    return await reply(`❌ API Error: ${resData.result.encrypted_code.details || resData.result.encrypted_code.error}`);
                }
            } else if (resData.result?.code) {
                encryptedCode = resData.result.code;
            }

            if (typeof encryptedCode === 'string' && encryptedCode.length > 0) {
                return await reply(`🔒 *Encrypted Code:*\n\`\`\`javascript\n${encryptedCode}\`\`\``);
            } else {
                return await reply(`📦 *API Response:*\n\`\`\`${JSON.stringify(resData, null, 2)}\`\`\``);
            }
        } else {
            return await reply("❌ API se koi response nahi mila.");
        }

    } catch (e) {
        console.log(e);
        return await reply(`❌ Error occurred: ${e.message}`);
    }
});
