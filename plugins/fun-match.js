import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

// Command for random boy selection
cmd({
  pattern: "bacha",
  alias: ["boy", "larka"],
  desc: "Randomly selects a boy from the group",
  react: "👦",
  category: "fun",
  filename: __filename
}, async (conn, mek, m, { from, isGroup, reply, sender }) => {
  try {
    if (!isGroup) return reply("❌ This command can only be used in groups!");

    // Manually fetch group metadata to prevent undefined errors
    const groupMetadata = await conn.groupMetadata(from).catch(() => null);
    if (!groupMetadata || !groupMetadata.participants) {
      return reply("❌ Failed to fetch group participants!");
    }

    const participants = groupMetadata.participants;
    
    // Filter out bot and get random participant
    const eligible = participants.filter(p => !p.id.includes(conn.user.id.split('@')[0]));
    
    if (eligible.length < 1) return reply("❌ No eligible participants found!");

    const randomUser = eligible[Math.floor(Math.random() * eligible.length)];
    
    await conn.sendMessage(
      from,
      { 
        text: `👦 *Yeh lo tumhara Bacha!* \n\n@${randomUser.id.split('@')[0]} is your handsome boy! 😎\n\n> Powered by KAMRAN-MD`, 
        mentions: [randomUser.id] 
      },
      { quoted: mek }
    );

  } catch (error) {
    console.error("KAMRAN-MD Bacha Error:", error);
    reply(`❌ Error: ${error.message}`);
  }
});

// Command for random girl selection
cmd({
  pattern: "bachi",
  alias: ["girl", "kuri", "larki"],
  desc: "Randomly selects a girl from the group",
  react: "👧",
  category: "fun",
  filename: __filename
}, async (conn, mek, m, { from, isGroup, reply, sender }) => {
  try {
    if (!isGroup) return reply("❌ This command can only be used in groups!");

    // Manually fetch group metadata to prevent undefined errors
    const groupMetadata = await conn.groupMetadata(from).catch(() => null);
    if (!groupMetadata || !groupMetadata.participants) {
      return reply("❌ Failed to fetch group participants!");
    }

    const participants = groupMetadata.participants;
    
    // Filter out bot and get random participant
    const eligible = participants.filter(p => !p.id.includes(conn.user.id.split('@')[0]));
    
    if (eligible.length < 1) return reply("❌ No eligible participants found!");

    const randomUser = eligible[Math.floor(Math.random() * eligible.length)];
    
    await conn.sendMessage(
      from,
      { 
        text: `👧 *Yeh lo tumhari Bachi!* \n\n@${randomUser.id.split('@')[0]} is your beautiful girl! 💖\n\n> Powered by KAMRAN-MD`, 
        mentions: [randomUser.id] 
      },
      { quoted: mek }
    );

  } catch (error) {
    console.error("KAMRAN-MD Bachi Error:", error);
    reply(`❌ Error: ${error.message}`);
  }
});
