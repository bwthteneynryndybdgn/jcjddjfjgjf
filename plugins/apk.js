// DR KAMRAN 

import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

cmd({
    pattern: "apk",
    desc: "Download any application or APK file",
    category: "download",
    react: "📥",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        if (!q) {
            return reply(
                `╔════════════════════════╗\n` +
                `║   📥 KAMRAN-MD APK DOWNLOADER   \n` +
                `╚════════════════════════╝\n\n` +
                `❌ *Kripya kisi app ka naam dein!*\n\n` +
                `> 📌 *Example:* \`.apk WhatsApp\`\n` +
                `> ⚡ *Version:* \`10.00\``
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const url = `https://api.princetechn.com/api/download/apkdl?apikey=prince&appName=${encodeURIComponent(q)}`;
        const response = await axios.get(url, { timeout: 60000 });
        
        if (response.data) {
            const resData = response.data.result || response.data;
            
            const appName = resData.appname || resData.name || resData.appName || q;
            const appSize = resData.size || resData.fileSize || "Unknown";
            const appPackage = resData.package || resData.bundleId || resData.packagename || "Unknown";
            
            // Image ke JSON ke mutabiq keys match kar di hain (`download_url` aur `appicon`)
            const downloadUrl = resData.download_url || resData.dllink || resData.download || resData.link || resData.url;
            const appIcon = resData.appicon || resData.icon || resData.image || "";

            if (!downloadUrl) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply(`❌ *App download link nahi mila!*`);
            }

            const appBox = `
╔════════════════════════╗
║   📥 KAMRAN-MD APK DOWNLOADER   
╚════════════════════════╝

📌 *App Name:* ${appName}
📦 *Package:* \`${appPackage}\`
💾 *Size:* ${appSize}

> ⚡ *Version:* \`10.00\`
> 👑 *Powered by KAMRAN MD*`.trim();

            if (appIcon) {
                await conn.sendMessage(from, { 
                    image: { url: appIcon }, 
                    caption: appBox 
                }, { quoted: mek });
            } else {
                await reply(appBox, {
                    contextInfo: { 
                        forwardingScore: 999, 
                        isForwarded: true, 
                        forwardedNewsletterMessageInfo: { 
                            newsletterJid: '120363418144382782@newsletter', 
                            newsletterName: 'DR KAMRAN', 
                            serverMessageId: 143 
                        } 
                    }
                });
            }

            // Send APK Document File
            await conn.sendMessage(from, { 
                document: { url: downloadUrl }, 
                mimetype: 'application/vnd.android.package-archive', 
                fileName: `${appName}.apk`,
                caption: `> *📥 Here is your APK file:* ${appName}`
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } else {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ *API se koi data nahi mila, app ka naam theek se likhein!*");
        }

    } catch (e) {
        console.error("APK Command Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`❌ *Error occurred:* \`\`\`${e.message}\`\`\``);
    }
});
