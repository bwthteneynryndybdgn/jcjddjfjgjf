import { fileURLToPath } from 'url';
import axios from 'axios';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const API = "https://api.rifkyshre.biz.id";
const ROUTE = "/scrape/gag2-stock";

async function gag2Fetch() {
  const res = await axios.get(`${API}${ROUTE}`, {
    timeout: 30000,
    validateStatus: () => true,
    headers: {
      Accept: "application/json",
      Origin: "https://code.rifkyshre.biz.id",
      Referer: "https://code.rifkyshre.biz.id/",
    },
  });
  if (!res.data?.status) {
    return {
      ok: false,
      error: res.data?.error ?? `HTTP ${res.status}`,
    };
  }
  return { ok: true, data: res.data.data };
}

function formatStock(d) {
  const lines = [];
  lines.push(`*🌱 GAG2 STOCK STATUS*`);
  lines.push("");
  lines.push(`⏰ *Restock in:* ${d.restockInLabel}`);
  lines.push(`🔄 *Rotation:* ${d.rotationId}`);
  lines.push(`📊 *Status:* ${d.status}`);
  lines.push("");
  
  if (d.weather?.active) {
    lines.push(`⛅ *WEATHER:* ${d.weather.type.toUpperCase()}`);
    if (Array.isArray(d.weather.effects)) {
      for (const eff of d.weather.effects) lines.push(`   ✨ ${eff}`);
    }
    lines.push("");
  }
  
  if (d.seeds?.length) {
    lines.push(`🌱 *SEEDS (${d.seeds.length}):*`);
    for (const s of d.seeds) lines.push(`   • ${s.name} × ${s.quantity}`);
    lines.push("");
  }
  
  if (d.gear?.length) {
    lines.push(`⚙️ *GEAR (${d.gear.length}):*`);
    for (const g of d.gear) lines.push(`   • ${g.name} × ${g.quantity}`);
    lines.push("");
  }
  
  if (d.crates?.length) {
    lines.push(`📦 *CRATES (${d.crates.length}):*`);
    for (const c of d.crates) lines.push(`   • ${c.name} × ${c.quantity}`);
  }

  lines.push("\n> *𝐊𝐀𝐌𝐑𝐀𝐍 𝐌𝐃*");
  return lines.join("\n");
}

cmd({
    pattern: "gagstock",
    alias: ["gag2", "gag2stock", "stockgag"],
    desc: "Check Grow a Garden 2 Stock Status",
    category: "tools",
    react: "🌱",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const r = await gag2Fetch();
        if (!r.ok) {
            return reply(`❌ Error: ${r.error}`);
        }
        await reply(formatStock(r.data));
    } catch (e) {
        return reply(`❌ Error fetching stock: ${e.message}`);
    }
});
