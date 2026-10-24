import { fileURLToPath } from 'url';
import { cmd } from '../command.js';
import crypto from 'crypto';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);

const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const base = 'https://chatgpt.com/backend-anon';

function baseCfg() {
	const cores = [8, 12, 16, 24];
	const screens = [3000, 4000, 6000];
	const core = cores[Math.floor(Math.random() * cores.length)];
	const screen = screens[Math.floor(Math.random() * screens.length)];
	return [
		core + screen,
		new Date().toString(),
		4294705152,
		0,
		ua,
		'https://cdn.oaistatic.com/assets/main.js',
		'dpl=abc',
		'en-US',
		'en-US,en',
		0,
		'webdriver-false',
		'location',
		crypto.randomUUID()
	];
}

function solvePow(seed, diff) {
	const cfg = baseCfg();
	for (let i = 0; i < 500000; i++) {
		cfg[3] = i;
		const b64 = Buffer.from(JSON.stringify(cfg)).toString('base64');
		const hash = crypto.createHash('sha3-512').update(seed + b64).digest('hex');
		if (hash.slice(0, diff.length) <= diff) {
			return 'gAAAAAB' + b64;
		}
	}
	return 'wQ8jGT' + Buffer.from(seed).toString('base64');
}

function parseSse(raw) {
	let answer = '';
	let convId = '';
	const lines = raw.split('\n');
	for (const line of lines) {
		if (!line.startsWith('data: ')) continue;
		const payload = line.slice(6).trim();
		if (payload === '[DONE]') break;
		let j;
		try {
			j = JSON.parse(payload);
		} catch {
			continue;
		}
		if (j.conversation_id) convId = j.conversation_id;
		const msg = j.message;
		if (msg && msg.author && msg.author.role === 'assistant') {
			const parts = msg.content && msg.content.parts;
			if (parts && typeof parts[0] === 'string') answer = parts[0];
		}
	}
	return { answer, convId };
}

async function askChatGPT(prompt) {
	const deviceId = crypto.randomUUID();
	const initP = 'gAAAAAC' + Buffer.from(JSON.stringify(baseCfg())).toString('base64');

	const reqRes = await fetch(base + '/sentinel/chat-requirements', {
		method: 'POST',
		headers: {
			'user-agent': ua,
			'content-type': 'application/json',
			accept: '*/*',
			'oai-device-id': deviceId,
			'oai-language': 'en-US',
			origin: 'https://chatgpt.com',
			referer: 'https://chatgpt.com/'
		},
		body: JSON.stringify({ p: initP })
	});

	if (!reqRes.ok) return { ok: false, status: reqRes.status, stage: 'requirements' };
	const req = await reqRes.json();

	const powToken = req.proofofwork ? solvePow(req.proofofwork.seed, req.proofofwork.difficulty) : null;
	const body = {
		action: 'next',
		messages: [
			{
				id: crypto.randomUUID(),
				author: { role: 'user' },
				content: { content_type: 'text', parts: [prompt] },
				metadata: {}
			}
		],
		parent_message_id: crypto.randomUUID(),
		model: 'auto',
		timezone_offset_min: -420,
		history_and_training_disabled: true,
		conversation_mode: { kind: 'primary_assistant' },
		websocket_request_id: crypto.randomUUID()
	};

	const res = await fetch(base + '/conversation', {
		method: 'POST',
		headers: {
			'user-agent': ua,
			'content-type': 'application/json',
			accept: 'text/event-stream',
			'oai-device-id': deviceId,
			'oai-language': 'en-US',
			'openai-sentinel-chat-requirements-token': req.token,
			...(powToken ? { 'openai-sentinel-proof-token': powToken } : {}),
			origin: 'https://chatgpt.com',
			referer: 'https://chatgpt.com/'
		},
		body: JSON.stringify(body)
	});

	if (!res.ok) return { ok: false, status: res.status, stage: 'conversation' };
	const txt = await res.text();
	const parsed = parseSse(txt);
	return { ok: true, ...parsed };
}

// Helper function jo sabhi alag commands ke liye request handle kare gi
async function handleAIQuery(conn, mek, m, { from, text, reply, command }) {
    try {
        const query = String(text || "").trim();
        if (!query) {
            return reply(`⚠️ Koyi sawal likhein!\n\nMisal ke tor par:\n• .${command} Node.js kya hai?`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const result = await askChatGPT(query);

        if (!result.ok || !result.answer) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ AI se jawab lene mein nakami hui. (Status: ${result.status || 'Unknown'})`);
        }

        let responseText = `> *KAMRAN-MD ${command.toUpperCase()}* 🤖\n\n`;
        responseText += `${result.answer}`;

        await conn.sendMessage(from, { text: responseText }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(`[${command.toUpperCase()} ERROR]`, e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`❌ Error: ${e.message}`);
    }
}

// ==================== INDIVIDUAL COMMANDS ====================

cmd({ pattern: "ai", desc: "Ask anything using AI", category: "ai", react: "🤖", filename: __filename }, handleAIQuery);
cmd({ pattern: "gpt", desc: "Ask anything using GPT", category: "ai", react: "🤖", filename: __filename }, handleAIQuery);
cmd({ pattern: "gpt4", desc: "Ask anything using GPT-4", category: "ai", react: "🤖", filename: __filename }, handleAIQuery);
cmd({ pattern: "gpt4o", desc: "Ask anything using GPT-4o", category: "ai", react: "🤖", filename: __filename }, handleAIQuery);
cmd({ pattern: "chatgpt", desc: "Ask anything using ChatGPT", category: "ai", react: "🤖", filename: __filename }, handleAIQuery);
cmd({ pattern: "chatgpt4", desc: "Ask anything using ChatGPT-4", category: "ai", react: "🤖", filename: __filename }, handleAIQuery);
cmd({ pattern: "deepseek", desc: "Ask anything using DeepSeek", category: "ai", react: "🤖", filename: __filename }, handleAIQuery);
cmd({ pattern: "deepseekr1", desc: "Ask anything using DeepSeek R1", category: "ai", react: "🤖", filename: __filename }, handleAIQuery);
cmd({ pattern: "gemini", desc: "Ask anything using Gemini", category: "ai", react: "🤖", filename: __filename }, handleAIQuery);
cmd({ pattern: "gemini15", desc: "Ask anything using Gemini 1.5", category: "ai", react: "🤖", filename: __filename }, handleAIQuery);
cmd({ pattern: "gemini20", desc: "Ask anything using Gemini 2.0", category: "ai", react: "🤖", filename: __filename },link => handleAIQuery);
cmd({ pattern: "claude", desc: "Ask anything using Claude", category: "ai", react: "🤖", filename: __filename }, handleAIQuery);
cmd({ pattern: "claude35sonnet", desc: "Ask anything using Claude 3.5 Sonnet", category: "ai", react: "🤖", filename: __filename }, handleAIQuery);
cmd({ pattern: "grok", desc: "Ask anything using Grok", category: "ai", react: "🤖", filename: __filename }, handleAIQuery);
cmd({ pattern: "copilot", desc: "Ask anything using Copilot", category: "ai", react: "🤖", filename: __filename }, handleAIQuery);
cmd({ pattern: "qwen", desc: "Ask anything using Qwen", category: "ai", react: "🤖", filename: __filename }, handleAIQuery);
cmd({ pattern: "o1", desc: "Ask anything using OpenAI o1", category: "ai", react: "🤖", filename: __filename }, handleAIQuery);
cmd({ pattern: "o3", desc: "Ask anything using OpenAI o3", category: "ai", react: "🤖", filename: __filename }, handleAIQuery);
