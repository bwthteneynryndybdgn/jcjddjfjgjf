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

// ==================== ALL-IN-ONE AI COMMAND REGISTRATION ====================
const aiAliases = [
    "ai4", "bot", "gpt4", "gpt2", "gpt3", "gpt35turbo", "gpt4", "gpt4turbo", "gpt4o", "gpt4omini",
    "gpt4vision", "gpt4all", "gpt5", "gpt5mini", "chatgpt", "chatgpt35", "chatgpt4", "chatgpt4o",
    "chatgpt4turbo", "chatgptplus", "chatgptelite", "o1", "o1mini", "o1preview", "o3", "o3mini",
    "o4", "o4mini", "o5", "o5mini", "copilot", "mscopilot", "elitecopilot", "deepseek", "deepseekv2",
    "deepseekv3", "deepseekv4", "deepseekr1", "deepseekr2", "deepseekcoder", "deepseekcoder2",
    "deepseekmath", "deepseekllm", "deepseekvl", "deepseekchat", "gemini", "geminipro", "geminiultra",
    "gemininano", "gemini15", "gemini15pro", "gemini15flash", "gemini20", "gemini20flash", "gemini25",
    "gemini25pro", "gemini25flash", "gemini3", "gemini3pro", "gemini3flash", "gemini3ultra", "bard",
    "palm", "palm2", "grok", "grok1", "grok15", "grok2", "grok2mini", "grok3", "grok3mini",
    "grok4", "grok4mini", "grokbeta", "grokvision", "claude", "claude1", "claude2", "claudeinstant",
    "claude3", "claude3opus", "claude3sonnet", "claude3haiku", "claude35", "claude35sonnet",
    "claude35haiku", "claude37", "claude37sonnet", "claude4", "claude4opus", "claude4sonnet",
    "claudeopus", "claudesonnet", "claudehaiku", "qwen", "qwen15", "qwen2", "qwen25", "qwen3",
    "qwencoder", "qwenmath", "qwenvl", "qwenmax", "qwenplus", "qwenturbo"
];

cmd({
    pattern: "ai2",
    alias: aiAliases,
    use: '.ai <aap ka sawal>',
    desc: "Access anonymous AI models and chat assistants",
    category: "ai",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, text, reply, command }) => {
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

        let responseText = `> *KAMRAN-MD AI (${command.toUpperCase()})* 🤖\n\n`;
        responseText += `${result.answer}`;

        await conn.sendMessage(from, { text: responseText }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("[AI COMMAND ERROR]", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(`❌ Error: ${e.message}`);
    }
});
