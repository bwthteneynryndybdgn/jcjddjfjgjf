import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SESSION_FILE = path.join(__dirname, 'unliai_sessions.json');

// Session memory storage handlers
function loadSessions() {
    if (!fs.existsSync(SESSION_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
    } catch {
        return {};
    }
}

function saveSessions(sessions) {
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
}

// Main AI Handler
async function askUnlimitedAI(prompt, customChatId = null) {
    const start = Date.now();
    const sessions = loadSessions();

    const isExistingSession = Boolean(customChatId && sessions[customChatId]);

    const currentChatId = isExistingSession ? customChatId : (customChatId || crypto.randomUUID());
    const nextChatId = isExistingSession ? crypto.randomUUID() : currentChatId;

    let deviceId = (isExistingSession && sessions[currentChatId].deviceId)
        ? sessions[currentChatId].deviceId
        : crypto.randomUUID();

    let history = isExistingSession ? sessions[currentChatId].messages : [];

    const nowIso = new Date().toISOString();
    const msgIdUser = crypto.randomUUID();
    const msgIdAssistant = crypto.randomUUID();

    const newUserMessage = {
        id: msgIdUser,
        content: prompt,
        createdAt: nowIso,
        parts: [{ type: "text", text: prompt }],
        role: "user"
    };

    const newAssistantPlaceholder = {
        id: msgIdAssistant,
        content: "",
        createdAt: nowIso,
        parts: [{ type: "text", text: "" }],
        role: "assistant"
    };

    const currentMessages = [...history, newUserMessage, newAssistantPlaceholder];

    const payload = {
        chatId: currentChatId,
        deviceId: deviceId,
        locale: "id",
        messages: currentMessages,
        selectedCharacter: null,
        selectedChatModel: "chat-model-reasoning",
        selectedStory: null
    };

    try {
        const response = await axios.post('https://app.unlimitedai.chat/api/chat', payload, {
            responseType: 'stream',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
                'Origin': 'https://app.unlimitedai.chat',
                'Referer': 'https://app.unlimitedai.chat/id'
            }
        });

        return new Promise((resolve, reject) => {
            let fullText = '';

            response.data.on('data', (chunk) => {
                const lines = chunk.toString().split('\n');
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    try {
                        const parsed = JSON.parse(trimmed);
                        if (parsed.type === 'delta' && parsed.delta) {
                            fullText += parsed.delta;
                        }
                    } catch (e) {
                        // Ignore parse errors from streamed lines
                    }
                }
            });

            response.data.on('end', () => {
                const trimmedResult = fullText.trim();

                newAssistantPlaceholder.content = trimmedResult;
                newAssistantPlaceholder.parts = [{ type: "text", text: trimmedResult }];
                newAssistantPlaceholder.createdAt = new Date().toISOString();

                const updatedMessages = [...history, newUserMessage, newAssistantPlaceholder];

                if (isExistingSession) {
                    sessions[nextChatId] = {
                        deviceId: deviceId,
                        messages: updatedMessages
                    };
                    delete sessions[currentChatId];
                } else {
                    sessions[currentChatId] = {
                        deviceId: deviceId,
                        messages: updatedMessages
                    };
                }

                saveSessions(sessions);

                resolve({
                    status: true,
                    runtime: `${Date.now() - start} ms`,
                    chatId: nextChatId,
                    sessionReset: isExistingSession,
                    result: {
                        prompt: prompt,
                        response: trimmedResult
                    }
                });
            });

            response.data.on('error', (err) => {
                reject({ status: false, error: err.message });
            });
        });

    } catch (e) {
        return {
            status: false,
            error: e.response ? e.response.data : e.message
        };
    }
}

// User active session tracker
const userSessions = new Map();

// ==================== UNLIMITED AI COMMAND ====================
cmd({
    pattern: "unliai",
    alias: ["unlimitedai", "ai2", "thinkai"],
    react: "🧠",
    desc: "Ask Unlimited AI with reasoning and session memory",
    category: "ai",
    use: ".unliai <your prompt>",
    filename: fileURLToPath(import.meta.url)
}, async (conn, mek, m, { from, sender, q, reply, react }) => {
    try {
        if (!q) {
            await react('❌');
            return reply(`❌ *Please provide a prompt!*

*Example:* 
.unliai Explain quantum computing step by step.`);
        }

        await react('⏳');

        // Check if user already has an active session ID
        const userChatId = userSessions.get(sender) || null;

        const aiResponse = await askUnlimitedAI(q, userChatId);

        if (!aiResponse.status || !aiResponse.result?.response) {
            throw new Error(aiResponse.error || "Failed to fetch response from Unlimited AI.");
        }

        // Save new chatId mapped to the user
        userSessions.set(sender, aiResponse.chatId);

        const responseText = `${aiResponse.result.response}\n\n> *© Powered By DR KAMRAN*`;

        await reply(responseText);
        await react('✅');

    } catch (error) {
        console.error("Unlimited AI Error:", error);
        await react('❌');
        await reply(`❌ *Error:* ${error.message}`);
    }
});
