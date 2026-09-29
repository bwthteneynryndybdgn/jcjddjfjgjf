import axios from 'axios';
import { cmd } from '../command.js'; // اپنے فائل پاتھ (path) کے مطابق ایڈجسٹ کریں

const headers = {
    'Content-Type': 'application/json',
    'Origin': 'https://heck.ai',
    'Referer': 'https://heck.ai/',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
    'Accept': '*/*'
};

// Memory Storage for Sessions per User/Chat
const userSessions = new Map();

// Session Create Function
export async function createSession(title) {
    try {
        const response = await axios.post(
            'https://api.heckai.weight-wave.com/api/ha/v1/session/create',
            { title },
            { headers }
        );
        return response.data?.id;
    } catch (error) {
        throw new Error('Failed to create session: ' + (error.response?.data || error.message));
    }
}

// Send Message Stream Parser Function
export async function sendMessageAI(sessionId, question) {
    try {
        const payload = {
            model: "openai/gpt-5.4-mini",
            question: question,
            language: "English",
            previousQuestion: null,
            previousAnswer: null,
            sessionId: sessionId
        };

        const response = await axios.post(
            'https://api.heckai.weight-wave.com/api/ha/v1/chat',
            payload,
            { headers, responseType: 'text' }
        );

        const rawData = response.data;
        const lines = rawData.split('\n');
        
        let fullText = '';

        for (const line of lines) {
            if (line.startsWith('data:')) {
                const content = line.replace(/^data:\s?/, '');
                
                if (
                    content.includes('[ANSWER_START]') || 
                    content.includes('[ANSWER_DONE]') || 
                    content.includes('[RELATE_Q_START]') || 
                    content.includes('[RELATE_Q_DONE]')
                ) {
                    continue;
                }
                
                fullText += content;
            }
        }

        return fullText.trim();
    } catch (error) {
        throw new Error('Failed to send message: ' + (error.response?.data || error.message));
    }
}

// ==========================================
//          WHATSAPP BOT COMMANDS
// ==========================================

// 1. Chat AI Command
cmd({
    pattern: "heckai",
    alias: ["gpt5", "ai", "heck"],
    desc: "Chat with Heck AI (GPT 5.4 Mini Model)",
    category: "ai",
    filename: import.meta.url
},
async (conn, mek, m, { q, reply, react, sender }) => {
    try {
        if (!q) {
            await react("❌");
            return reply("⚠️ *براہ کرم اپنا سوال یا پرامپٹ لکھیں!*\n\n*مثال:* `.heckai Write a poem about space`");
        }

        await react("🧠");

        // Check if session already exists for this sender, else create one
        let sessionId = userSessions.get(sender);

        if (!sessionId) {
            sessionId = await createSession(q);
            userSessions.set(sender, sessionId);
        }

        const aiResponse = await sendMessageAI(sessionId, q);

        if (!aiResponse) {
            await react("❌");
            return reply("❌ *AI کی طرف سے کوئی جواب موصول نہیں ہوا۔*");
        }

        await reply(aiResponse);
        await react("✅");

    } catch (err) {
        console.error("HeckAI Error:", err);
        await react("❌");
        await reply(`❌ *Error:* ${err.message}`);
    }
});

// 2. Clear Session Command (Session Reset کرنے کے لیے)
cmd({
    pattern: "clearchat",
    alias: ["resetchat", "resetai"],
    desc: "Reset ongoing Heck AI conversation session",
    category: "ai",
    filename: import.meta.url
},
async (conn, mek, m, { reply, react, sender }) => {
    if (userSessions.has(sender)) {
        userSessions.delete(sender);
        await react("🧹");
        return reply("✅ *آپ کی پرانی AI چیٹ ہسٹری / سیشن ری سیٹ کر دیا گیا ہے!*");
    } else {
        await react("❓");
        return reply("ℹ️ *آپ کا پہلے سے کوئی ایکٹو سیشن موجود نہیں ہے۔*");
    }
});
