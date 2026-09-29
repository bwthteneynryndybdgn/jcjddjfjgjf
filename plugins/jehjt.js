import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { cmd } from '../command.js';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);

// Yahan Indonesian URL ko English Akinator URL se replace kar diya hai
const BASE_URL = 'https://en.akinator.com';

const THEMES = {
  characters: 1,
  animals: 14,
  objects: 2
};

const ANSWERS = {
  yes: 0,
  no: 1,
  idk: 2,
  probably: 3,
  'probably not': 4
};

/* ============================================================
 * SESSION MANAGEMENT
 * ========================================================== */

if (!global.akinatorSessions) {
  global.akinatorSessions = new Map();
}

const getUserId = (m) => m.sender || m.chat;
const getSession = (m) => global.akinatorSessions.get(getUserId(m));
const setSession = (m, data) => global.akinatorSessions.set(getUserId(m), data);
const deleteSession = (m) => global.akinatorSessions.delete(getUserId(m));

/* ============================================================
 * COOKIE HANDLERS
 * ========================================================== */

function updateCookies(jar, headers) {
  const setCookies = headers && headers['set-cookie'];
  if (!setCookies) return;

  for (let c of setCookies) {
    const kv = c.split(';')[0];
    const index = kv.indexOf('=');
    if (index === -1) continue;

    const key = kv.slice(0, index).trim();
    const value = kv.slice(index + 1).trim();
    jar[key] = value;
  }
}

function cookieString(jar) {
  return Object.keys(jar)
    .map((key) => `${key}=${jar[key]}`)
    .join('; ');
}

/* ============================================================
 * AKINATOR CORE FUNCTIONS
 * ========================================================== */

async function startGame(theme = 'characters', childMode = false) {
  try {
    const sid = THEMES[theme] || THEMES.characters;
    const jar = {};

    const homeRes = await axios.get(`${BASE_URL}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      validateStatus: () => true
    });
    updateCookies(jar, homeRes.headers);

    const res = await axios.post(`${BASE_URL}/game`, `sid=${sid}&cm=${childMode}`, {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': cookieString(jar),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      validateStatus: () => true
    });
    updateCookies(jar, res.headers);

    const $ = cheerio.load(res.data);
    const question = $('#question-label').text().trim();
    const sessionMatch = res.data.match(/name="session"[^>]*value="([^"]+)"/);
    const signatureMatch = res.data.match(/name="signature"[^>]*value="([^"]+)"/);
    const akitudeMatch = res.data.match(/akitude[^"]*"[^"]*([^/]+\.png)/);

    const session = sessionMatch ? sessionMatch[1] : null;
    const signature = signatureMatch ? signatureMatch[1] : null;
    const akitude = akitudeMatch ? akitudeMatch[1] : 'defi.png';

    if (!session || !signature) {
      return { status: false, error: 'Failed to retrieve Akinator session/signature.' };
    }

    return {
      status: true,
      session,
      signature,
      question,
      step: 0,
      progression: 0,
      akitude,
      sid,
      theme,
      childMode,
      cookies: jar
    };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

async function answerGame(game, ans) {
  try {
    let answerId;

    if (typeof ans === 'number') {
      answerId = ans;
    } else {
      const answerKey = String(ans).toLowerCase();
      answerId = typeof ANSWERS[answerKey] !== 'undefined' ? ANSWERS[answerKey] : -1;
    }

    if (answerId === -1) {
      return { status: false, error: 'Invalid answer.' };
    }

    const payload = new URLSearchParams({
      step: String(game.step),
      progression: String(game.progression),
      sid: String(game.sid),
      cm: String(game.childMode),
      answer: String(answerId),
      session: game.session,
      signature: game.signature
    }).toString();

    const res = await axios.post(`${BASE_URL}/answer`, payload, {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': cookieString(game.cookies || {}),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      validateStatus: () => true
    });

    if (res.headers) updateCookies(game.cookies || {}, res.headers);

    let data;
    try {
      data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    } catch (e) {
      return { status: false, error: 'Failed to read Akinator response.' };
    }

    if (data.completion === 'KO') {
      return { status: false, error: 'Akinator session has expired.' };
    }

    if (data.id_proposition) {
      return {
        status: true,
        won: true,
        name: data.name_proposition,
        description: data.description_proposition,
        photo: data.photo,
        pseudo: data.pseudo
      };
    }

    return {
      status: true,
      won: false,
      question: data.question,
      step: parseInt(data.step),
      progression: parseFloat(data.progression),
      akitude: data.akitude
    };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

async function backGame(game) {
  try {
    const payload = new URLSearchParams({
      step: String(game.step),
      progression: String(game.progression),
      sid: String(game.sid),
      cm: String(game.childMode),
      session: game.session,
      signature: game.signature
    }).toString();

    const res = await axios.post(`${BASE_URL}/cancel_answer`, payload, {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': cookieString(game.cookies || {}),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      validateStatus: () => true
    });

    let data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    return {
      status: true,
      question: data.question,
      step: parseInt(data.step),
      progression: parseFloat(data.progression),
      akitude: data.akitude
    };
  } catch (e) {
    return { status: false, error: 'Failed to read Akinator response.' };
  }
}

async function excludeGame(game) {
  try {
    const payload = new URLSearchParams({
      step: String(game.step),
      progression: String(game.progression),
      sid: String(game.sid),
      cm: String(game.childMode),
      session: game.session,
      signature: game.signature,
      step_last_proposition: String(game.step)
    }).toString();

    const res = await axios.post(`${BASE_URL}/exclude`, payload, {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': cookieString(game.cookies || {}),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      validateStatus: () => true,
      maxRedirects: 5
    });

    try {
      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      return {
        status: true,
        question: data.question,
        step: parseInt(data.step),
        progression: parseFloat(data.progression),
        akitude: data.akitude
      };
    } catch (e) {
      const $ = cheerio.load(res.data);
      const question = $('#question-label').text().trim();

      if (!question) {
        return { status: false, error: 'Akinator rejected the exclude request.' };
      }

      const newSession = res.data.match(/name="session"[^>]*value="([^"]+)"/);
      const newSignature = res.data.match(/name="signature"[^>]*value="([^"]+)"/);

      return {
        status: true,
        question,
        step: 0,
        progression: 0,
        akitude: 'defi.png',
        newSession: newSession ? newSession[1] : game.session,
        newSignature: newSignature ? newSignature[1] : game.signature
      };
    }
  } catch (e) {
    return { status: false, error: e.message };
  }
}

/* ============================================================
 * MESSAGE TEMPLATES (ENGLISH)
 * ========================================================== */

function questionText(game, usedPrefix, command) {
  return `╭───〔 🎩 AKINATOR 〕───
│
│ ❓ ${game.question}
│
│ 1. Yes
│ 2. No
│ 3. Don't know
│ 4. Probably
│ 5. Probably not
│
│ Progress: ${game.progression}%
│ Step: ${game.step}
│
╰─────────────────────

Reply with:
${usedPrefix}${command} 1
${usedPrefix}${command} 2
${usedPrefix}${command} 3
${usedPrefix}${command} 4
${usedPrefix}${command} 5

Type ${usedPrefix}${command} stop to quit.`;
}

/* ============================================================
 * CORE AKINATOR LOGIC
 * ========================================================== */

async function executeAkinator(conn, mek, m, args, reply, usedPrefix, command) {
  const sub = args[0] ? String(args[0]).toLowerCase() : '';

  // --- STOP ---
  if (sub === 'stop' || sub === 'cancel') {
    if (!getSession(m)) return reply('❌ You are not currently playing Akinator.');
    deleteSession(m);
    return reply('🛑 Akinator game stopped.');
  }

  // --- BACK ---
  if (sub === 'back' || sub === 'mundur') {
    const gameBack = getSession(m);
    if (!gameBack) return reply('❌ No active Akinator game found.');

    try {
      const resultBack = await backGame(gameBack);
      if (!resultBack.status) {
        deleteSession(m);
        return reply(`❌ ${resultBack.error}`);
      }

      Object.assign(gameBack, {
        question: resultBack.question,
        step: resultBack.step,
        progression: resultBack.progression,
        akitude: resultBack.akitude
      });
      setSession(m, gameBack);
      return reply(questionText(gameBack, usedPrefix, command));
    } catch (e) {
      return reply(`❌ Error going back:\n${e.message}`);
    }
  }

  // --- EXCLUDE ---
  if (sub === 'exclude') {
    const gameExclude = getSession(m);
    if (!gameExclude) return reply('❌ No active Akinator game found.');

    try {
      const resultExclude = await excludeGame(gameExclude);
      if (!resultExclude.status) {
        deleteSession(m);
        return reply(`❌ ${resultExclude.error}`);
      }

      if (resultExclude.newSession) {
        gameExclude.session = resultExclude.newSession;
        gameExclude.signature = resultExclude.newSignature;
      }

      Object.assign(gameExclude, {
        question: resultExclude.question,
        step: resultExclude.step,
        progression: resultExclude.progression,
        akitude: resultExclude.akitude
      });

      setSession(m, gameExclude);
      return reply(questionText(gameExclude, usedPrefix, command));
    } catch (e) {
      return reply(`❌ Error excluding:\n${e.message}`);
    }
  }

  // --- ANSWER ---
  const validNumbers = ['1', '2', '3', '4', '5'];
  if (validNumbers.includes(sub) || typeof ANSWERS[sub] !== 'undefined') {
    const gameAnswer = getSession(m);
    if (!gameAnswer) {
      return reply(`❌ No active game.\n\nStart with:\n${usedPrefix}${command}`);
    }

    const answerMap = {
      '1': 'yes',
      '2': 'no',
      '3': 'idk',
      '4': 'probably',
      '5': 'probably not'
    };
    const answer = answerMap[sub] || sub;

    try {
      const resultAnswer = await answerGame(gameAnswer, answer);
      if (!resultAnswer.status) {
        deleteSession(m);
        return reply(`❌ ${resultAnswer.error}`);
      }

      // -- WIN --
      if (resultAnswer.won) {
        deleteSession(m);
        let text = `╭───〔 🎩 AKINATOR 〕───\n` +
                   `│\n` +
                   `│ 🎯 I guessed it!\n` +
                   `│\n` +
                   `│ 👤 ${resultAnswer.name || 'Unknown'}\n` +
                   `│\n` +
                   `│ 📝 ${resultAnswer.description || 'No description available'}\n` +
                   `│\n` +
                   `╰─────────────────────`;

        if (resultAnswer.pseudo) text += `\n\n👨‍💻 Pseudo: ${resultAnswer.pseudo}`;

        if (resultAnswer.photo) {
          try {
            return await conn.sendMessage(
              m.chat,
              { image: { url: resultAnswer.photo }, caption: text },
              { quoted: m }
            );
          } catch (e) {
            return reply(text);
          }
        }
        return reply(text);
      }

      // -- NEXT QUESTION --
      Object.assign(gameAnswer, {
        question: resultAnswer.question,
        step: resultAnswer.step,
        progression: resultAnswer.progression,
        akitude: resultAnswer.akitude
      });
      setSession(m, gameAnswer);
      return reply(questionText(gameAnswer, usedPrefix, command));

    } catch (e) {
      return reply(`❌ An error occurred while answering:\n${e.message}`);
    }
  }

  // --- START ---
  if (!sub || sub === 'start' || sub === 'mulai') {
    if (getSession(m)) {
      return reply(`⚠️ You already have an active Akinator game.\n\nAnswer with:\n${usedPrefix}${command} 1-5\n\nOr type:\n${usedPrefix}${command} stop`);
    }

    const theme = args[1] ? String(args[1]).toLowerCase() : 'characters';
    if (!THEMES[theme]) {
      return reply(`❌ Invalid theme.\n\nAvailable themes:\n• characters\n• animals\n• objects`);
    }

    await reply('🎩 Summoning Akinator...');

    try {
      const newGame = await startGame(theme, false);
      if (!newGame.status) return reply(`❌ ${newGame.error}`);

      setSession(m, newGame);
      return reply(questionText(newGame, usedPrefix, command));
    } catch (e) {
      return reply(`❌ Failed to start Akinator:\n${e.message}`);
    }
  }

  // --- HELP ---
  return reply(`🎩 *AKINATOR*\n\n` +
                 `How to play:\n${usedPrefix}${command}\n\n` +
                 `Answers:\n1. Yes\n2. No\n3. Don't know\n4. Probably\n5. Probably not\n\n` +
                 `Commands:\n${usedPrefix}${command} back\n${usedPrefix}${command} exclude\n${usedPrefix}${command} stop`);
}

/* ============================================================
 * AUTO AKINATOR LISTENER (BODY HOOK)
 * ========================================================== */

cmd({
  on: "body"
}, async (conn, mek, m, { from, body }) => {
  try {
    if (!body) return;
    const rawText = body.trim().toLowerCase();
    const triggers = ['akinator', 'yakinator'];

    const matchedTrigger = triggers.find(t => rawText === t || rawText.startsWith(t + ' '));
    if (matchedTrigger) {
      const argsText = body.slice(matchedTrigger.length).trim();
      const args = argsText ? argsText.split(' ') : [];
      const prefix = config.PREFIX || '.';
      await executeAkinator(
        conn,
        mek,
        m,
        args,
        (text) => conn.sendMessage(from, { text }, { quoted: mek }),
        prefix,
        matchedTrigger
      );
    }
  } catch (error) {
    console.error("Auto-Body Akinator Error:", error);
  }
});

/* ============================================================
 * AKINATOR COMMAND (Prefix Version)
 * ========================================================== */

cmd({
  pattern: "akinator",
  alias: ["yakinator"],
  desc: "Play Akinator game",
  category: "game",
  react: "🎩",
  filename: __filename
}, async (conn, mek, m, extra) => {
  const { args, reply, usedPrefix, command } = extra;
  await executeAkinator(conn, mek, m, args, reply, usedPrefix || config.PREFIX || '.', command || 'akinator');
});
