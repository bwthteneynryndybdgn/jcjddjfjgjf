// plugins/ai.js - ESM Version
import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);

// ==================== GLOBAL AUTO CHAT STATE ====================
let globalAutoChatEnabled = false;

// ==================== AUTO CHAT LISTENER (BODY HOOK) ====================
cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isGroup }) => {
    try {
        if (!body) return;

        // 1. STRICTLY IB ONLY: Groups mein bilkul kaam nahi karega
        if (isGroup) return;

        // 2. INFINITE LOOP PROTECTION: Bot khud ke messages ka reply nahi dega
        if (m.key && m.key.fromMe) return;

        // 3. Ignore command prefixes
        const prefix = /^[./!#]/;
        if (prefix.test(body.trim())) return;

        // 4. Check if Global Auto Chat is enabled
        if (!globalAutoChatEnabled) return;

        // Process message through AI engine automatically
        await fetchAndReplyAI(conn, mek, from, body);

    } catch (error) {
        console.error("Auto-Chat Error:", error);
    }
});

// ==================== AUTO CHAT ON/OFF COMMAND ====================
cmd({
    pattern: "autochat",
    alias: ["aichat", "chatbot"],
    desc: "Turn global auto AI chat on or off for all IB chats",
    category: "ai",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { isGroup, args, reply }) => {
    try {
        if (isGroup) {
            return await reply("❌ Auto-Chat can only be controlled in IB, not in groups!");
        }

        const status = args[0] ? args[0].toLowerCase() : '';

        if (status === 'on' || status === 'enable') {
            globalAutoChatEnabled = true;
            return await reply("✅ Global Auto AI Chat has been turned ON for all IB chats! (Supports All Languages)");
        } else if (status === 'off' || status === 'disable') {
            globalAutoChatEnabled = false;
            return await reply("❌ Global Auto AI Chat has been turned OFF.");
        } else {
            const currentState = globalAutoChatEnabled ? "ON 🟢" : "OFF 🔴";
            return await reply(`🤖 Global Auto-Chat Status: ${currentState}\n\nUsage:\n• .autochat on to enable\n• .autochat off to disable`);
        }
    } catch (err) {
        console.error(err);
        await reply("❌ Failed to toggle auto chat.");
    }
});

// ==================== MANUAL AI COMMAND (.ai) ====================
cmd({
    pattern: "ai",
    alias: ["gpt", "chatgpt", "deepai", "blackbox"],
    desc: "Ask anything to AI chatbot via FAA APIs (IB Only).",
    category: "ai",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, text, usedPrefix, command, isGroup, reply }) => {
    try {
        if (isGroup) {
            return await reply("❌ AI commands can only be used in IB, not in groups!");
        }

        if (!text?.trim()) {
            return reply(
                `❌ Please provide a prompt or question!\n\n` +
                `Example:\n` +
                `• ${usedPrefix + command} Hello, who are you?\n` +
                `• ${usedPrefix + command} coding ke baray mein batao`
            );
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        await fetchAndReplyAI(conn, mek, from, text.trim());

    } catch (err) {
        console.error("AI Command Error:", err);
        reply(`❌ Error: ${err.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});

// ==================== CORE AI FETCH ENGINE ====================
async function fetchAndReplyAI(conn, mek, from, queryText) {
    try {
        // Professional instruction jo AI ko force karegi ke user ki language mein direct jawab de
        const smartPrompt = `User message: "${queryText}". Reply directly to this message in the exact same language or script used by the user. Do not explain the language, just provide the direct answer.`;
        const encodedQuery = encodeURIComponent(smartPrompt);
        
        const deepAiUrl = `https://api-faa.my.id/faa/deep-ai?text=${encodedQuery}`;
        const blackboxUrl = `https://api-faa.my.id/faa/blackbox?query=${encodedQuery}`;

        let aiResult = "";

        const extractText = (data) => {
            if (!data) return "";
            if (typeof data === 'string') return data;
            
            if (typeof data === 'object') {
                let candidate = data.result || data.response || data.message || data.text || data.data || data.content;
                
                if (typeof candidate === 'string') return candidate;
                if (typeof candidate === 'object' && candidate !== null) {
                    return candidate.result || candidate.response || candidate.message || candidate.text || JSON.stringify(candidate, null, 2);
                }
                
                if (data.data) return extractText(data.data);
                
                return JSON.stringify(data, null, 2);
            }
            return String(data);
        };

        // Try DeepAI first
        try {
            const response = await axios.get(deepAiUrl, { timeout: 30000 });
            aiResult = extractText(response.data);
        } catch (e) {
            console.log("DeepAI API failed, trying Blackbox fallback...");
        }

        // If DeepAI fails, try Blackbox fallback
        if (!aiResult || !aiResult.trim() || aiResult.includes("[object Object]")) {
            try {
                const responseFallback = await axios.get(blackboxUrl, { timeout: 30000 });
                aiResult = extractText(responseFallback.data);
            } catch (err) {
                console.error("Blackbox fallback also failed:", err.message);
            }
        }

        if (!aiResult || aiResult.includes("[object Object]") || aiResult.trim() === "") {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return await conn.sendMessage(from, { text: "❌ Could not get a valid response from AI." }, { quoted: mek });
        }

        await conn.sendMessage(from, { 
            text: `🤖 *KAMRAN-MD AI*\n\n${aiResult}` 
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("AI Fetch Engine Error:", error.message);
    }
}
