//---------------------------------------------------------------------------
//           KAMRAN-MD - MOVIEBOX PRO STREAM PLUGIN
//---------------------------------------------------------------------------

import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';
import { prepareWAMessageMedia } from '@whiskeysockets/baileys';
import { randomUUID } from 'crypto';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTHOR = "KAMRAN-MINI-BOT";
const CLOUDINARY_IMAGE = 'https://res.cloudinary.com/di2a9lenz/image/upload/v1786909227/omegatech_ai_media/upload-1786909226872.jpg';

async function searchMovies(query) {
    const url = `https://api.omegatech.app/api/movie/MovieBox-pro?action=search&keyword=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, { timeout: 30000 });
    if (!data.success) throw new Error('Search failed');
    return data.data;
}

async function getMovieDetail(subjectId, detailPath) {
    const url = `https://api.omegatech.app/api/movie/MovieBox-pro?action=detail&keyword=&subjectId=${subjectId}&detailPath=${encodeURIComponent(detailPath)}`;
    const { data } = await axios.get(url, { timeout: 30000 });
    if (!data.success) throw new Error('Failed to fetch details');
    return data.data;
}

async function getStreamData(subjectId, detailPath, season = 0, episode = 0) {
    const url = `https://api.omegatech.app/api/movie/MovieBox-pro?action=download&subjectId=${subjectId}&detailPath=${encodeURIComponent(detailPath)}&se=${season}&ep=${episode}`;
    const { data } = await axios.get(url, { timeout: 30000 });
    if (!data.success) throw new Error('Failed to get stream data');
    return data;
}

function buildPlayerHtml({ title, year, rating, quality, streamUrl, posterBase64, isSeries, season, episode, totalEpisodes, qualities }) {
    const safeTitle = escapeHtml(title);
    const safeYear = escapeHtml(year || '');
    const safeRating = escapeHtml(rating || '');
    const safeQuality = escapeHtml(quality || '');
    const safeStreamUrl = escapeHtml(streamUrl || '');
    const safePoster = posterBase64 || CLOUDINARY_IMAGE;

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>🎬 ${safeTitle}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{margin:0;background:#090a0f;font-family:Arial,Helvetica,sans-serif;color:#fff;touch-action:manipulation;min-height:100vh;display:flex;align-items:center;justify-content:center}
.player-wrap{width:100%;max-width:480px;margin:auto;padding:12px}
.player{position:relative;overflow:hidden;background:#111318;border:1px solid rgba(255,255,255,.12);border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,.55)}
.bg{position:absolute;inset:-25px;background:url('${safePoster}') center/cover;filter:blur(22px);opacity:.38;transform:scale(1.15);pointer-events:none}
.bg-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,6,10,.35),rgba(5,6,10,.72));pointer-events:none}
.content{position:relative;padding:16px;z-index:2}
.video-frame{position:relative;width:100%;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#000;box-shadow:0 12px 35px rgba(0,0,0,.45)}
.video-frame video{width:100%;height:100%;display:block;background:#000;object-fit:contain}
.big-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.25);transition:opacity .3s;z-index:3;cursor:pointer}
.big-btn{width:64px;height:64px;border:0;border-radius:50%;background:#fff;color:#08090d;display:flex;align-items:center;justify-content:center;padding:0;box-shadow:0 6px 18px rgba(0,0,0,.35);cursor:pointer}
.big-btn svg{width:28px;height:28px;fill:currentColor}
.info{padding-top:14px;display:flex;justify-content:space-between;align-items:center}
.title-group{flex:1;min-width:0}
.song-title{font-size:18px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.artist{font-size:13px;opacity:.6;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.badge-group{display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap}
.badge{padding:3px 8px;border-radius:10px;font-size:9px;font-weight:600;background:rgba(255,255,255,.08)}
.badge.rating{color:#ffd700}
.badge.quality{color:#4fc3f7}
.badge.episode{color:#ff6fae}
.progress{margin-top:16px}
input[type=range]{width:100%;height:4px;accent-color:#fff;cursor:pointer;background:rgba(255,255,255,.15);border-radius:4px;-webkit-appearance:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#fff;cursor:pointer}
.times{display:flex;justify-content:space-between;font-size:10px;opacity:.55;margin-top:6px;font-variant-numeric:tabular-nums}
.controls{display:flex;align-items:center;justify-content:center;gap:18px;margin-top:12px}
.side-btn{width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#fff;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer}
.play-btn{width:54px;height:54px;border:0;border-radius:50%;background:linear-gradient(135deg,#ff6fae,#a855f7);color:#fff;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;box-shadow:0 4px 25px rgba(168,85,247,.3)}
.play-btn svg{width:24px;height:24px;fill:currentColor}
.bottom{display:flex;align-items:center;justify-content:space-between;margin-top:12px;gap:12px;flex-wrap:wrap}
.episode-nav{display:flex;align-items:center;gap:8px}
.episode-nav button{padding:4px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#fff;font-size:10px;cursor:pointer}
.episode-nav span{font-size:11px;opacity:.6}
.quality-select select{padding:4px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#fff;font-size:10px;cursor:pointer}
.icon-btn{width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.06);color:#fff;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer}
.volume{width:80px}
.note{margin-top:10px;text-align:center;font-size:9px;color:rgba(255,255,255,.12);letter-spacing:.5px}
</style>
</head>
<body>
<div class="player-wrap">
<div class="player">
<div class="bg"></div>
<div class="bg-overlay"></div>
<div class="content">
<div class="video-frame" id="videoFrame">
<video id="video" playsinline webkit-playsinline preload="auto" autoplay controls poster="${safePoster}">
<source src="${safeStreamUrl}" type="video/mp4">
</video>
<div class="big-play" id="bigPlay" style="display:none" onclick="toggleVideo()">
<button class="big-btn" type="button" onclick="event.stopPropagation();toggleVideo()">
<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
</button>
</div>
</div>
<div class="info">
<div class="title-group">
<div class="song-title">${safeTitle}</div>
<div class="artist">${safeYear} • ${isSeries ? 'Series' : 'Movie'}</div>
</div>
<div class="badge-group">
<span class="badge rating">⭐ ${safeRating}</span>
<span class="badge quality">${safeQuality}</span>
${isSeries ? `<span class="badge episode">S${season} E${episode}</span>` : ''}
</div>
</div>
<div class="progress">
<input type="range" id="progress" min="0" max="100" value="0" step="0.1">
<div class="times"><span id="current">0:00</span><span id="duration">--:--</span></div>
</div>
<div class="controls">
<button class="side-btn" id="prevBtn"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 5h2.5v14H6z"/><path d="M20 5.5v13a.6.6 0 0 1-.93.5L10 13.1a.6.6 0 0 1 0-1l9.07-5.9a.6.6 0 0 1 .93.5z"/></svg></button>
<button class="play-btn" id="playBtn"><svg id="playIcon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><svg id="pauseIcon" viewBox="0 0 24 24" style="display:none"><rect x="7" y="5" width="3.8" height="14" rx="1"/><rect x="13.2" y="5" width="3.8" height="14" rx="1"/></svg></button>
<button class="side-btn" id="nextBtn"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M15.5 5H18v14h-2.5z"/><path d="M4 5.5v13a.6.6 0 0 0 .93.5L14 13.1a.6.6 0 0 0 0-1L4.93 6.2A.6.6 0 0 0 4 6.7z"/></svg></button>
</div>
<div class="bottom">
<div class="episode-nav">
${isSeries ? `<button id="prevEp">◀</button><span id="epInfo">S${season} E${episode}</span><button id="nextEp">▶</button>` : ''}
</div>
<div class="quality-select">
<select id="qualitySelect">
${qualities.map(q => `<option value="${q.streamUrl}" ${q.quality === safeQuality ? 'selected' : ''}>${q.quality}</option>`).join('')}
</select>
</div>
<div style="display:flex;align-items:center;gap:8px">
<button class="icon-btn" id="muteBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m19 9-5 6"/><path d="m14 9 5 6"/></svg></button>
<input class="volume" id="volume" type="range" min="0" max="1" step="0.01" value="0.8">
</div>
</div>
<div class="note">♡ Powered by Omegatech</div>
</div>
</div>
</div>
<script>
(function(){
const video=document.getElementById('video');
const playBtn=document.getElementById('playBtn');
const playIcon=document.getElementById('playIcon');
const pauseIcon=document.getElementById('pauseIcon');
const bigPlay=document.getElementById('bigPlay');
const progress=document.getElementById('progress');
const current=document.getElementById('current');
const durationEl=document.getElementById('duration');
const prevBtn=document.getElementById('prevBtn');
const nextBtn=document.getElementById('nextBtn');
const muteBtn=document.getElementById('muteBtn');
const volume=document.getElementById('volume');
const qualitySelect=document.getElementById('qualitySelect');
const prevEp=document.getElementById('prevEp');
const nextEp=document.getElementById('nextEp');

function format(sec){if(!Number.isFinite(sec))return'0:00';const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=Math.floor(sec%60);if(h>0)return h+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');return m+':'+String(s).padStart(2,'0');}

function updateUI(){
  if(video.paused){
    playIcon.style.display='block';
    pauseIcon.style.display='none';
    if(bigPlay) bigPlay.style.display='flex';
  }else{
    playIcon.style.display='none';
    pauseIcon.style.display='block';
    if(bigPlay) bigPlay.style.display='none';
  }
}

function updateProgress(){
  if(!Number.isFinite(video.duration)||video.duration<=0)return;
  const p=Math.max(0,Math.min(100,(video.currentTime/video.duration)*100));
  progress.value=p;
  current.textContent=format(video.currentTime);
}

video.addEventListener('loadedmetadata',function(){
  if(Number.isFinite(video.duration)){
    durationEl.textContent=format(video.duration);
  }
});

video.addEventListener('timeupdate',updateProgress);
video.addEventListener('play',updateUI);
video.addEventListener('pause',updateUI);
video.addEventListener('ended',function(){
  progress.value=0;
  current.textContent='0:00';
  updateUI();
});

video.addEventListener('canplay', function() {
  video.play().catch(function(e){});
});

playBtn.addEventListener('click',function(){
  if(video.paused){video.play().catch(function(e){});}else{video.pause();}
});

progress.addEventListener('input',function(){
  if(!Number.isFinite(video.duration)||video.duration<=0)return;
  video.currentTime=(this.value/100)*video.duration;
});

prevBtn.addEventListener('click',function(){video.currentTime=Math.max(0,video.currentTime-10);});
nextBtn.addEventListener('click',function(){video.currentTime=Math.min(video.duration,video.currentTime+10);});
muteBtn.addEventListener('click',function(){video.muted=!video.muted;});
volume.addEventListener('input',function(){video.volume=this.value;if(video.volume>0)video.muted=false;});

function toggleVideo(){if(video.paused){video.play().catch(function(e){});}else{video.pause();}}
window.toggleVideo=toggleVideo;

if(qualitySelect){
  qualitySelect.addEventListener('change',function(){
    const url=this.value;
    if(url){video.src=url;video.load();video.play().catch(function(e){});}
  });
}

if(prevEp){
  prevEp.addEventListener('click',function(){
    const urlParams=new URLSearchParams(window.location.search);
    const ep=parseInt(urlParams.get('ep')||'${episode}');
    if(ep>1) window.location.href=window.location.pathname+'?se=${season}&ep='+(ep-1);
  });
}
if(nextEp){
  nextEp.addEventListener('click',function(){
    const urlParams=new URLSearchParams(window.location.search);
    const ep=parseInt(urlParams.get('ep')||'${episode}');
    if(ep<${totalEpisodes||999}) window.location.href=window.location.pathname+'?se=${season}&ep='+(ep+1);
  });
}
})();
</script>
</body>
</html>`;
}

function escapeHtml(text = '') {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

async function sendHtmlPlayer(conn, chatId, html) {
  const responseId = randomUUID();
  await conn.relayMessage(chatId, {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          unifiedResponse: {
            data: Buffer.from(JSON.stringify({
              __typename: 'GenAIUnifiedResponse',
              response_id: responseId,
              sections: [{
                __typename: 'GenAIUnifiedResponseSection',
                view_model: {
                  __typename: 'GenAISingleLayoutViewModel',
                  primitive: {
                    __typename: 'FOAHtmlPrimitiveDemoDONOTUSE',
                    trusted_sources: [],
                    payload: html
                  }
                }
              }]
            })).toString('base64')
          },
          contextInfo: {
            isForwarded: true,
            forwardOrigin: 4
          }
        }
      }
    }
  }, {
    additionalAttributes: { type: 'text' },
    edit: false
  });
}

async function showSearchResults(conn, chatId, query, results, usedPrefix, command, taggedUsers = []) {
    try {
        let imageMessage;
        try {
            const imgResp = await axios.get(CLOUDINARY_IMAGE, { responseType: 'arraybuffer' });
            const media = await prepareWAMessageMedia({ image: Buffer.from(imgResp.data) }, { upload: conn.waUploadToServer });
            imageMessage = media.imageMessage;
        } catch (e) {}

        const rows = results.slice(0, 20).map((item, idx) => ({
            id: `${usedPrefix}${command} ${query} --select ${idx}`,
            title: `${item.title} (${item.releaseDate ? item.releaseDate.split('-')[0] : 'N/A'})`,
            description: `${item.subjectType === 2 ? 'Series' : 'Movie'} ⭐${item.imdbRatingValue || 'N/A'}`
        }));

        const selectButton = {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
                title: "🎬 Select Movie/Series",
                sections: [{
                    title: `Results for "${query}" (${results.length})`,
                    highlight_label: "📽️ Choose",
                    rows: rows
                }]
            })
        };

        const interactiveMsg = {
            interactiveMessage: {
                header: { title: `🎬 Search Results: "${query}"`, hasMediaAttachment: !!imageMessage },
                body: { text: `📌 *Found ${results.length} results*\nSelect a movie/series from the dropdown below.` },
                footer: { text: "🔹 Powered by Omegatech • MovieBox" },
                contextInfo: {
                    mentionedJid: taggedUsers,
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363403299118246@newsletter',
                        serverMessageId: 142,
                        newsletterName: 'Lady-Trish Channel'
                    }
                },
                nativeFlowMessage: { buttons: [selectButton] }
            }
        };

        if (imageMessage) interactiveMsg.interactiveMessage.header.imageMessage = imageMessage;

        await conn.relayMessage(chatId, interactiveMsg, {
            additionalNodes: [{
                tag: "biz", attrs: {},
                content: [{ tag: "interactive", attrs: { type: "native_flow", v: "1" }, content: [{ tag: "native_flow", attrs: { v: "9", name: "mixed" } }] }]
            }]
        });
        return true;
    } catch (e) {
        return false;
    }
}

async function showSeasonEpisodeSelector(conn, chatId, movieData, query, usedPrefix, command, taggedUsers = []) {
    try {
        const seasons = movieData.seasons || [];
        if (seasons.length === 0) return false;

        let imageMessage;
        try {
            if (movieData.poster) {
                const imgResp = await axios.get(movieData.poster, { responseType: 'arraybuffer' });
                const media = await prepareWAMessageMedia({ image: Buffer.from(imgResp.data) }, { upload: conn.waUploadToServer });
                imageMessage = media.imageMessage;
            }
        } catch (e) {}

        const seasonRows = seasons.slice(0, 10).map((s) => ({
            id: `${usedPrefix}${command} "${query}" --se ${s.se}`,
            title: `Season ${s.se}`,
            description: `${s.maxEp || 0} episodes`
        }));

        const seasonButton = {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
                title: "📺 Select Season",
                sections: [{ title: `${movieData.title} - Seasons`, highlight_label: "📺", rows: seasonRows }]
            })
        };

        const interactiveMsg = {
            interactiveMessage: {
                header: { title: `📺 ${movieData.title}`, hasMediaAttachment: !!imageMessage },
                body: { text: `📌 *Select a season to watch:*\n\n⭐ Rating: ${movieData.rating}\n📅 Year: ${movieData.year}\n📊 ${seasons.length} seasons available` },
                footer: { text: "🔹 Powered by Omegatech • MovieBox" },
                contextInfo: { mentionedJid: taggedUsers, forwardingScore: 999, isForwarded: true },
                nativeFlowMessage: { buttons: [seasonButton] }
            }
        };

        if (imageMessage) interactiveMsg.interactiveMessage.header.imageMessage = imageMessage;

        await conn.relayMessage(chatId, interactiveMsg, {
            additionalNodes: [{
                tag: "biz", attrs: {},
                content: [{ tag: "interactive", attrs: { type: "native_flow", v: "1" }, content: [{ tag: "native_flow", attrs: { v: "9", name: "mixed" } }] }]
            }]
        });
        return true;
    } catch (e) {
        return false;
    }
}

async function showEpisodeSelector(conn, chatId, movieData, seasonNum, query, usedPrefix, command, taggedUsers = []) {
    try {
        const season = movieData.seasons.find(s => s.se === seasonNum);
        if (!season) {
            await conn.sendMessage(chatId, { text: `⚠️ Season ${seasonNum} not found.` });
            return true;
        }

        const totalEpisodes = season.maxEp || 0;
        let imageMessage;
        try {
            if (movieData.poster) {
                const imgResp = await axios.get(movieData.poster, { responseType: 'arraybuffer' });
                const media = await prepareWAMessageMedia({ image: Buffer.from(imgResp.data) }, { upload: conn.waUploadToServer });
                imageMessage = media.imageMessage;
            }
        } catch (e) {}

        const episodeRows = [];
        for (let i = 1; i <= Math.min(totalEpisodes, 20); i++) {
            episodeRows.push({
                id: `${usedPrefix}${command} "${query}" --se ${seasonNum} --ep ${i}`,
                title: `Episode ${i}`,
                description: `Season ${seasonNum} • Episode ${i}`
            });
        }

        const episodeButton = {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
                title: `📺 Season ${seasonNum} Episodes`,
                sections: [{ title: `${movieData.title} - Season ${seasonNum}`, highlight_label: "📺", rows: episodeRows }]
            })
        };

        const interactiveMsg = {
            interactiveMessage: {
                header: { title: `📺 ${movieData.title} - S${seasonNum}`, hasMediaAttachment: !!imageMessage },
                body: { text: `📌 *Select an episode to stream:*\n\n📊 ${totalEpisodes} episodes available` },
                footer: { text: "🔹 Powered by Omegatech • MovieBox" },
                contextInfo: { mentionedJid: taggedUsers, forwardingScore: 999, isForwarded: true },
                nativeFlowMessage: { buttons: [episodeButton] }
            }
        };

        if (imageMessage) interactiveMsg.interactiveMessage.header.imageMessage = imageMessage;

        await conn.relayMessage(chatId, interactiveMsg, {
            additionalNodes: [{
                tag: "biz", attrs: {},
                content: [{ tag: "interactive", attrs: { type: "native_flow", v: "1" }, content: [{ tag: "native_flow", attrs: { v: "9", name: "mixed" } }] }]
            }]
        });
        return true;
    } catch (e) {
        return false;
    }
}

const handler = async (conn, mek, m, { from, text, usedPrefix, command, reply }) => {
    const chatId = from || m.chat;
    const sender = m.sender;

    if (!text) {
        return reply(`🎬 *Movie & Series Stream*\n\nSearch and stream movies/series.\n\n📝 *Usage:*\n${usedPrefix + command} <query>\n\n📌 *Example:*\n${usedPrefix + command} Inception`);
    }

    try {
        let query = text;
        let selectIndex = null;
        let seasonNum = null;
        let episodeNum = null;

        const selectMatch = text.match(/^(.*?)\s*--select\s+(\d+)/i);
        if (selectMatch) { query = selectMatch[1].trim(); selectIndex = parseInt(selectMatch[2]); }

        const seasonMatch = text.match(/^(.*?)\s*--se\s+(\d+)/i);
        if (seasonMatch) { query = seasonMatch[1].trim(); seasonNum = parseInt(seasonMatch[2]); }

        const episodeMatch = text.match(/^(.*?)\s*--ep\s+(\d+)/i);
        if (episodeMatch) { query = episodeMatch[1].trim(); episodeNum = parseInt(episodeMatch[2]); }

        if (selectIndex !== null) {
            const searchData = global.db.data.movieSearch?.[sender];
            if (!searchData || !searchData.results) return reply('⚠️ No search results found. Please search again.');
            const selected = searchData.results[selectIndex];
            if (!selected) return reply('❌ Invalid selection.');

            await reply(`⏳ Fetching details for "${selected.title}"...`);

            const detail = await getMovieDetail(selected.subjectId, selected.detailPath);
            const subject = detail.subject;
            const seasons = detail.resource?.seasons || [];
            const isSeries = subject.subjectType === 2;

            if (!global.db.data.movieData) global.db.data.movieData = {};
            global.db.data.movieData[sender] = {
                subjectId: selected.subjectId,
                detailPath: selected.detailPath,
                title: subject.title,
                year: subject.releaseDate ? subject.releaseDate.split('-')[0] : 'N/A',
                rating: subject.imdbRatingValue || 'N/A',
                poster: subject.cover?.url || CLOUDINARY_IMAGE,
                isSeries: isSeries,
                seasons: seasons,
                totalEpisodes: seasons.length > 0 ? Math.max(...seasons.map(s => s.maxEp || 0)) : 0
            };

            if (isSeries && seasons.length > 0) {
                await showSeasonEpisodeSelector(conn, chatId, {
                    title: subject.title,
                    year: subject.releaseDate ? subject.releaseDate.split('-')[0] : 'N/A',
                    rating: subject.imdbRatingValue || 'N/A',
                    poster: subject.cover?.url || CLOUDINARY_IMAGE,
                    seasons: seasons
                }, query, usedPrefix, command, [sender]);
                return;
            }

            const streamData = await getStreamData(selected.subjectId, selected.detailPath, 0, 0);
            const qualities = streamData.qualities || [];
            let defaultQuality = qualities.find(q => q.quality === '480p') || qualities[0] || {};
            let streamUrl = defaultQuality.streamUrl || qualities[0]?.streamUrl || streamData.bestQualityUrl;

            if (!streamUrl) return reply('❌ No stream URL available for this title.');

            let posterBase64 = '';
            if (subject.cover?.url) {
                try {
                    const thumbRes = await axios.get(subject.cover.url, { responseType: 'arraybuffer', timeout: 10000 });
                    posterBase64 = 'data:image/jpeg;base64,' + Buffer.from(thumbRes.data).toString('base64');
                } catch (e) {}
            }

            const html = buildPlayerHtml({
                title: subject.title,
                year: subject.releaseDate ? subject.releaseDate.split('-')[0] : 'N/A',
                rating: subject.imdbRatingValue || 'N/A',
                quality: defaultQuality.quality || '480p',
                streamUrl: streamUrl,
                posterBase64: posterBase64,
                isSeries: false,
                season: 0,
                episode: 0,
                totalEpisodes: 1,
                qualities: qualities
            });

            await sendHtmlPlayer(conn, chatId, html);
            await reply('✅ Streaming started!');
            return;
        }

        if (seasonNum !== null && episodeNum === null) {
            const movieData = global.db.data.movieData?.[sender];
            if (!movieData) return reply('⚠️ No movie data found. Please search first.');
            await showEpisodeSelector(conn, chatId, movieData, seasonNum, query, usedPrefix, command, [sender]);
            return;
        }

        if (seasonNum !== null && episodeNum !== null) {
            const movieData = global.db.data.movieData?.[sender];
            if (!movieData) return reply('⚠️ No movie data found. Please search first.');

            const streamData = await getStreamData(movieData.subjectId, movieData.detailPath, seasonNum, episodeNum);
            const qualities = streamData.qualities || [];
            let defaultQuality = qualities.find(q => q.quality === '480p') || qualities[0] || {};
            let streamUrl = defaultQuality.streamUrl || qualities[0]?.streamUrl || streamData.bestQualityUrl;

            if (!streamUrl) return reply('❌ No stream URL available for this episode.');

            let posterBase64 = '';
            if (movieData.poster) {
                try {
                    const thumbRes = await axios.get(movieData.poster, { responseType: 'arraybuffer', timeout: 10000 });
                    posterBase64 = 'data:image/jpeg;base64,' + Buffer.from(thumbRes.data).toString('base64');
                } catch (e) {}
            }

            const html = buildPlayerHtml({
                title: `${movieData.title} - S${seasonNum} E${episodeNum}`,
                year: movieData.year,
                rating: movieData.rating,
                quality: defaultQuality.quality || '480p',
                streamUrl: streamUrl,
                posterBase64: posterBase64,
                isSeries: true,
                season: seasonNum,
                episode: episodeNum,
                totalEpisodes: movieData.totalEpisodes || 999,
                qualities: qualities
            });

            await sendHtmlPlayer(conn, chatId, html);
            await reply(`✅ Season ${seasonNum} Episode ${episodeNum} streaming started!`);
            return;
        }

        const searchResult = await searchMovies(text);
        const items = searchResult?.raw?.items || [];
        if (items.length === 0) return reply(`❌ No results found for *${text}*`);

        if (!global.db.data.movieSearch) global.db.data.movieSearch = {};
        global.db.data.movieSearch[sender] = { results: items, query: text, timestamp: Date.now() };

        await showSearchResults(conn, chatId, text, items, usedPrefix, command, [sender]);
    } catch (e) {
        console.error('Movie error:', e);
        await reply(`❌ Error: ${e.message || 'Unknown error'}`);
    }
};

cmd({
    pattern: "movie09",
    alias: ["akwam", "film09"],
    desc: "Search and stream movies/series",
    category: "downloader",
    filename: __filename
}, handler);

export default handler;
