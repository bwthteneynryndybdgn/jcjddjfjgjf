import axios from 'axios';
import * as cheerio from 'cheerio';
import { cmd } from '../command.js'; // اپنے بوٹ کے کمانڈ ہینڈلر کا صحیح پاتھ رکھیں

const kemkes = "https://kemkes.go.id/";

function clean(t) {
  return t.replace(/\s+/g, " ").trim();
}

function extractMeta(text) {
  const date = text.match(/\d{1,2}\s\w+\s\d{4}/);
  const views = text.match(/[\d,.]+(?=\s*$)/);
  return {
    date: date ? date[0] : null,
    views: views ? views[0] : null
  };
}

// Core Scraper Function Exported for ESM
export async function fetchKemkesNews() {
  try {
    const { data } = await axios.get(`${kemkes}id/category/rilis-berita`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0"
      }
    });

    const $ = cheerio.load(data);
    let results = [];

    $(".row > div, .col-sm-6, .col-md-6").each((i, el) => {
      const container = $(el);

      const a = container.find("a").first();
      const img = container.find("img").first();
      const titleRaw = a.text();
      const link = a.attr("href");

      if (!titleRaw || !link) return;

      const title = clean(titleRaw);
      if (title.length < 20) return;

      const meta = extractMeta(title);
      let thumbnail = img.attr("src") || null;

      if (thumbnail && !thumbnail.startsWith("http")) {
        thumbnail = "https://kemkes.go.id" + thumbnail;
      }

      results.push({
        title: title
          .replace(meta.date || "", "")
          .replace(meta.views || "", "")
          .trim(),
        date: meta.date,
        views: meta.views,
        link: link.startsWith("http")
          ? link
          : "https://kemkes.go.id" + link,
        thumbnail
      });
    });

    // Deduplication
    const cleanData = [...new Map(results.map(v => [v.link, v])).values()];

    return {
      success: true,
      total: cleanData.length,
      data: cleanData
    };

  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

// ==========================================
//          WHATSAPP BOT COMMAND
// ==========================================

cmd({
    pattern: "kemkesnews",
    alias: ["beritakemkes", "healthnews", "kemkes"],
    desc: "Fetch latest health news releases from Kemkes RI",
    category: "news",
    filename: import.meta.url
},
async (conn, mek, m, { reply, react }) => {
    try {
        await react("📰");

        const res = await fetchKemkesNews();

        if (!res.success || !res.data.length) {
            await react("❌");
            return reply("❌ *صحت سے متعلق خبریں حاصل کرنے میں ناکامی ہوئی:* " + (res.error || "No data"));
        }

        const newsList = res.data.slice(0, 5); // WhatsApp پر بھیجنے کے لیے ٹاپ 5 خبریں

        let caption = `🏥 *KEMENKES RI HEALTH NEWS*\n\n`;
        caption += `📊 *Total Articles Found:* ${res.total}\n\n`;

        newsList.forEach((item, i) => {
            caption += `*${i + 1}. ${item.title}*\n`;
            if (item.date) caption += `📅 *Date:* ${item.date}\n`;
            if (item.views) caption += `👁️ *Views:* ${item.views}\n`;
            caption += `🔗 *Read More:* ${item.link}\n\n`;
        });

        // First image as header thumbnail if available
        const firstThumbnail = newsList.find(v => v.thumbnail)?.thumbnail;

        if (firstThumbnail) {
            await conn.sendMessage(m.chat, {
                image: { url: firstThumbnail },
                caption: caption
            }, { quoted: mek });
        } else {
            await reply(caption);
        }

        await react("✅");

    } catch (err) {
        console.error("Kemkes News Command Error:", err);
        await react("❌");
        await reply(`❌ *Error:* ${err.message}`);
    }
});
