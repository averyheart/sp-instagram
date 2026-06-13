// boot.js — shared React entry point
// Reads ?character= from the script src to know which profile to load.
// Add a new character by creating a new folder with an index.html
// pointing to this file with ?character=yourcharactername

import React from "https://esm.sh/react@18";
import ReactDOM from "https://esm.sh/react-dom@18/client";
import htm from "https://esm.sh/htm@3";

const html = htm.bind(React.createElement);

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const REPO_BASE     = "https://raw.githubusercontent.com/averyheart/sp-companion-ig/main";
const COMPANION_URL = "https://saucepan.ai/companion/placeholder";

// Detect character from script src query string
const scriptSrc  = document.currentScript?.src || "";
const urlParams  = new URL(scriptSrc).searchParams;
const CHARACTER  = urlParams.get("character") || "luca";
const DATA_URL   = `${REPO_BASE}/characters/${CHARACTER}/posts.json`;
const IMG_BASE   = `${REPO_BASE}/characters/${CHARACTER}/images`;

function imgSrc(src) {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  return `${IMG_BASE}/${src}`;
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
function fmt(n) {
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000)    return (n / 1000).toFixed(1) + "K";
  return n;
}

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function getDailyStoryImages(posts, count = 3) {
  if (!posts?.length) return [];
  const now  = new Date();
  const seed = now.getUTCFullYear() * 10000 + (now.getUTCMonth() + 1) * 100 + now.getUTCDate();
  const rng  = seededRandom(seed);
  return [...posts].sort(() => rng() - 0.5).slice(0, count).map(p => p.src);
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
const HeartIcon = ({ filled }) => html`<svg width="22" height="22" viewBox="0 0 24 24" fill=${filled ? "#e05555" : "none"} stroke=${filled ? "#e05555" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
const CommentIcon = () => html`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
const ShareIcon = () => html`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
const BookmarkIcon = ({ filled }) => html`<svg width="22" height="22" viewBox="0 0 24 24" fill=${filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
const VerifiedIcon = () => html`<svg width="15" height="15" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#4a9eff"/><polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>`;
const LocationIcon = () => html`<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style=${{ opacity: 0.45 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const LockIcon = () => html`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style=${{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
const BackArrow = () => html`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
const DotsIcon = () => html`<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>`;
const ChevLeft  = () => html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
const ChevRight = () => html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

// ─── STORY VIEWER ─────────────────────────────────────────────────────────────
function StoryViewer({ images, label, avatar, username, onClose }) {
  const [index, setIndex]       = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const timer = React.useRef(null);
  const DURATION = 4000;

  React.useEffect(() => {
    setProgress(0);
    const start = Date.now();
    timer.current = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timer.current);
        if (index < images.length - 1) setIndex(i => i + 1);
        else onClose();
      }
    }, 30);
    return () => clearInterval(timer.current);
  }, [index]);

  React.useEffect(() => {
    const onKey = e => {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowRight") { clearInterval(timer.current); if (index < images.length - 1) setIndex(i => i + 1); else onClose(); }
      if (e.key === "ArrowLeft")  { clearInterval(timer.current); if (index > 0) setIndex(i => i - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length]);

  return html`
    <div style=${{ position:"fixed", inset:0, background:"#000", zIndex:300, display:"flex", flexDirection:"column" }}>
      <div style=${{ display:"flex", gap:3, padding:"12px 12px 0" }}>
        ${images.map((_, i) => html`
          <div key=${i} style=${{ flex:1, height:2, background:"rgba(255,255,255,0.2)", borderRadius:2, overflow:"hidden" }}>
            <div style=${{ height:"100%", background:"#fff", borderRadius:2, width: i < index ? "100%" : i === index ? `${progress}%` : "0%" }}/>
          </div>
        `)}
      </div>
      <div style=${{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px" }}>
        <img src=${imgSrc(avatar)} alt=${username} style=${{ width:34, height:34, borderRadius:"50%", objectFit:"cover" }}/>
        <div style=${{ flex:1 }}>
          <div style=${{ fontSize:13, fontWeight:600, color:"#fff", fontFamily:"'DM Sans',sans-serif" }}>${username}</div>
          <div style=${{ fontSize:11, color:"rgba(255,255,255,0.5)", fontFamily:"'DM Sans',sans-serif" }}>${label}</div>
        </div>
        <button onClick=${onClose} style=${{ background:"none", border:"none", color:"#fff", fontSize:22, cursor:"pointer" }}>✕</button>
      </div>
      <div style=${{ flex:1, position:"relative", overflow:"hidden" }}>
        <img src=${imgSrc(images[index])} alt="" style=${{ width:"100%", height:"100%", objectFit:"cover" }}/>
        <div onClick=${() => { clearInterval(timer.current); if (index > 0) setIndex(i => i - 1); }} style=${{ position:"absolute", inset:"0 60% 0 0", cursor:"pointer" }}/>
        <div onClick=${() => { clearInterval(timer.current); if (index < images.length - 1) setIndex(i => i + 1); else onClose(); }} style=${{ position:"absolute", inset:"0 0 0 40%", cursor:"pointer" }}/>
      </div>
    </div>
  `;
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return html`
    <div style=${{ padding:"18px" }}>
      <div style=${{ display:"flex", alignItems:"center", gap:22, marginBottom:14 }}>
        <div style=${{ width:88, height:88, borderRadius:"50%", background:"#1e1e1e" }}/>
        <div style=${{ flex:1, display:"flex", gap:26, justifyContent:"center" }}>
          ${[0,1,2].map(i => html`
            <div key=${i} style=${{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style=${{ width:32, height:18, borderRadius:4, background:"#1e1e1e" }}/>
              <div style=${{ width:48, height:10, borderRadius:4, background:"#181818" }}/>
            </div>
          `)}
        </div>
      </div>
      <div style=${{ width:120, height:14, borderRadius:4, background:"#1e1e1e", marginBottom:8 }}/>
      <div style=${{ width:"80%", height:12, borderRadius:4, background:"#181818", marginBottom:16 }}/>
      <div style=${{ display:"flex", gap:8, marginBottom:18 }}>
        <div style=${{ flex:1, height:34, borderRadius:9, background:"#1e1e1e" }}/>
        <div style=${{ flex:1, height:34, borderRadius:9, background:"#181818" }}/>
      </div>
      <div style=${{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:2, marginTop:20 }}>
        ${Array(9).fill(0).map((_,i) => html`<div key=${i} style=${{ aspectRatio:"1", background:"#181818" }}/>`)}
      </div>
    </div>
  `;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
function InstagramProfile() {
  const [data, setData]               = React.useState(null);
  const [loading, setLoading]         = React.useState(true);
  const [error, setError]             = React.useState(null);
  const [following, setFollowing]     = React.useState(false);
  const [likedPosts, setLikedPosts]   = React.useState({});
  const [savedPosts, setSavedPosts]   = React.useState({});
  const [openPost, setOpenPost]       = React.useState(null);
  const [storyViewer, setStoryViewer] = React.useState(null);

  React.useEffect(() => {
    fetch(`${DATA_URL}?t=${Date.now()}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(json => { setData(json); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const profile    = data?.profile    || {};
  const posts      = data?.posts      || [];
  const highlights = data?.highlights || [];
  const dailyStoryImages = getDailyStoryImages(posts, 3);
  const openIdx = posts.findIndex(p => p.id === openPost?.id);

  React.useEffect(() => {
    const onKey = e => {
      if (!openPost) return;
      if (e.key === "Escape")      setOpenPost(null);
      if (e.key === "ArrowLeft"  && openIdx > 0)             setOpenPost(posts[openIdx - 1]);
      if (e.key === "ArrowRight" && openIdx < posts.length-1) setOpenPost(posts[openIdx + 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPost, openIdx, posts]);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
    @keyframes slideUp { from{transform:translateY(18px);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes pulse   { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
    .ig { font-family:'DM Sans',sans-serif; background:#0e0e0e; min-height:100vh; color:#ede9e3; max-width:480px; margin:0 auto; }
    .ig-top { display:flex; align-items:center; gap:10px; padding:13px 16px; position:sticky; top:0; background:rgba(14,14,14,0.94); backdrop-filter:blur(14px); z-index:20; }
    .ig-top-back { background:none; border:none; color:#ede9e3; cursor:pointer; padding:0; display:flex; align-items:center; transition:opacity 0.15s; flex-shrink:0; text-decoration:none; }
    .ig-top-back:hover { opacity:0.7; }
    .ig-top-name { font-family:'DM Serif Display',serif; font-size:17px; letter-spacing:-0.2px; flex:1; }
    .ig-top-dots { background:none; border:none; color:#ede9e3; cursor:pointer; padding:0; display:flex; align-items:center; opacity:0.6; }
    .ig-profile { padding:18px 18px 0; }
    .ig-profile-row { display:flex; align-items:center; gap:22px; margin-bottom:14px; }
    .ig-av-outer { width:88px; height:88px; border-radius:50%; cursor:pointer; flex-shrink:0; background:conic-gradient(from 0deg,#c8a068,#e8c89a,#8b5e2c,#d4a055,#c8a068); padding:2.5px; transition:transform 0.2s,box-shadow 0.2s; }
    .ig-av-outer:hover { transform:scale(1.04); box-shadow:0 0 18px rgba(200,160,104,0.35); }
    .ig-av-inner { width:100%; height:100%; border-radius:50%; border:2.5px solid #0e0e0e; overflow:hidden; background:#1a1a1a; }
    .ig-av-inner img { width:100%; height:100%; object-fit:cover; }
    .ig-stats { display:flex; gap:26px; flex:1; justify-content:center; }
    .ig-stat { display:flex; flex-direction:column; align-items:center; gap:1px; }
    .ig-stat-num { font-family:'DM Serif Display',serif; font-size:19px; line-height:1; }
    .ig-stat-lbl { font-size:11px; color:#6a6560; font-weight:400; letter-spacing:0.03em; }
    .ig-name { display:flex; align-items:center; gap:5px; font-weight:600; font-size:13.5px; margin-bottom:4px; }
    .ig-bio  { font-size:12.5px; color:#7a7470; line-height:1.55; margin-bottom:14px; }
    .ig-actions { display:flex; gap:8px; margin-bottom:18px; }
    .ig-btn { flex:1; padding:7.5px 0; border-radius:9px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; border:none; transition:all 0.18s; text-decoration:none; display:flex; align-items:center; justify-content:center; }
    .ig-btn-fon  { background:#c8a068; color:#0e0e0e; }
    .ig-btn-fon:hover  { background:#d4ae78; }
    .ig-btn-foff { background:#1e1e1e; color:#ede9e3; border:1px solid #2c2c2c; }
    .ig-btn-foff:hover { background:#252525; }
    .ig-btn-msg  { background:#1e1e1e; color:#ede9e3; border:1px solid #2c2c2c; }
    .ig-btn-msg:hover  { background:#252525; }
    .ig-hl-row { display:flex; gap:14px; padding:0 18px 18px; overflow-x:auto; scrollbar-width:none; }
    .ig-hl-row::-webkit-scrollbar { display:none; }
    .ig-hl { display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer; flex-shrink:0; }
    .ig-hl-ring { width:62px; height:62px; border-radius:50%; border:1.5px solid #2e2e2e; padding:3px; transition:transform 0.2s; }
    .ig-hl-ring:hover { transform:scale(1.06); }
    .ig-hl-ring img { width:100%; height:100%; border-radius:50%; object-fit:cover; background:#1a1a1a; }
    .ig-hl-lbl { font-size:10.5px; color:#7a7470; max-width:64px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ig-divider { height:1px; background:rgba(255,255,255,0.06); }
    .ig-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; }
    .ig-cell { aspect-ratio:1; overflow:hidden; cursor:pointer; position:relative; background:#181818; }
    .ig-cell img { width:100%; height:100%; object-fit:cover; transition:transform 0.3s,filter 0.3s; }
    .ig-cell:hover img { transform:scale(1.05); filter:brightness(0.7); }
    .ig-cell-over { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; gap:14px; opacity:0; transition:opacity 0.22s; font-size:12.5px; font-weight:600; color:#fff; }
    .ig-cell:hover .ig-cell-over { opacity:1; }
    .ig-cell-stat { display:flex; align-items:center; gap:5px; }
    .ig-empty { grid-column:1/-1; padding:60px 18px; text-align:center; color:#333; font-size:13px; }
    .ig-error { padding:40px 18px; text-align:center; color:#6a6560; font-size:13px; line-height:1.6; }
    .sk { animation:pulse 1.4s ease-in-out infinite; }
    .lb-bg { position:fixed; inset:0; background:rgba(0,0,0,0.9); backdrop-filter:blur(10px); z-index:100; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.16s ease; }
    .lb { background:#161616; border-radius:14px; width:min(430px,95vw); max-height:94vh; overflow:hidden; display:flex; flex-direction:column; position:relative; border:1px solid rgba(255,255,255,0.07); animation:slideUp 0.2s ease; }
    .lb-post-header { display:flex; align-items:center; gap:10px; padding:12px 14px; flex-shrink:0; border-bottom:1px solid rgba(255,255,255,0.05); }
    .lb-post-av { width:34px; height:34px; border-radius:50%; object-fit:cover; flex-shrink:0; background:#1a1a1a; }
    .lb-post-info { flex:1; min-width:0; }
    .lb-post-uname { font-size:13px; font-weight:600; color:#ede9e3; display:flex; align-items:center; gap:4px; }
    .lb-post-loc { font-size:10.5px; color:#555; display:flex; align-items:center; gap:3px; margin-top:2px; }
    .lb-post-dots { background:none; border:none; color:#ede9e3; opacity:0.5; cursor:pointer; padding:0; display:flex; }
    .lb-img { width:100%; aspect-ratio:1; object-fit:cover; flex-shrink:0; display:block; }
    .lb-scroll { overflow-y:auto; flex:1; }
    .lb-scroll::-webkit-scrollbar { width:3px; }
    .lb-scroll::-webkit-scrollbar-thumb { background:#2a2a2a; border-radius:3px; }
    .lb-body { padding:12px 14px 0; }
    .lb-actions { display:flex; align-items:center; gap:14px; margin-bottom:10px; }
    .lb-actions button { background:none; border:none; color:#ede9e3; cursor:pointer; padding:0; display:flex; align-items:center; transition:transform 0.15s; }
    .lb-actions button:hover { transform:scale(1.12); }
    .lb-likes   { font-size:13px; font-weight:600; margin-bottom:5px; }
    .lb-caption { font-size:13px; color:#b0aaa3; line-height:1.55; margin-bottom:4px; }
    .lb-caption strong { color:#ede9e3; font-weight:600; }
    .lb-date    { font-size:10.5px; color:#3a3632; text-transform:uppercase; letter-spacing:0.07em; margin-bottom:12px; }
    .lb-comments { border-top:1px solid rgba(255,255,255,0.06); padding:12px 14px; }
    .lb-comment { display:flex; gap:8px; margin-bottom:10px; }
    .lb-c-av { width:28px; height:28px; border-radius:50%; flex-shrink:0; background:#222; display:flex; align-items:center; justify-content:center; font-size:10px; color:#888; font-weight:700; }
    .lb-c-user { font-size:12px; font-weight:600; color:#ede9e3; margin-bottom:2px; }
    .lb-c-text { font-size:12.5px; color:#a0998f; line-height:1.45; }
    .lb-limited { display:flex; align-items:flex-start; gap:8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:10px; padding:10px 12px; margin-top:4px; }
    .lb-limited-text { font-size:11.5px; color:#6a6560; line-height:1.5; }
    .lb-nav { position:absolute; top:calc(50% - 60px); transform:translateY(-50%); background:rgba(255,255,255,0.1); border:none; color:#fff; width:34px; height:34px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s; backdrop-filter:blur(4px); z-index:2; }
    .lb-nav:hover { background:rgba(255,255,255,0.22); }
    .lb-nav.prev { left:-44px; }
    .lb-nav.next { right:-44px; }
    @media(max-width:560px){ .lb-nav.prev{left:8px} .lb-nav.next{right:8px} }
  `;

  return html`
    <>
      <style>${css}</style>
      <div class="ig">
        <div class="ig-top">
          <a href=${COMPANION_URL} class="ig-top-back"><${BackArrow}/></a>
          <span class="ig-top-name">${profile.username || "—"}</span>
          <button class="ig-top-dots"><${DotsIcon}/></button>
        </div>

        ${loading && html`<div class="sk"><${Skeleton}/></div>`}
        ${error && !loading && html`<div class="ig-error"><div style=${{ fontSize:28, marginBottom:10 }}>⚠️</div>Could not load profile.<br/><span style=${{ fontSize:11, color:"#444" }}>${error}</span></div>`}

        ${!loading && !error && data && html`
          <>
            <div class="ig-profile">
              <div class="ig-profile-row">
                <div class="ig-av-outer" onClick=${() => dailyStoryImages.length && setStoryViewer({ images: dailyStoryImages, label: "Today" })}>
                  <div class="ig-av-inner">
                    ${profile.avatar && html`<img src=${imgSrc(profile.avatar)} alt=${profile.name}/>`}
                  </div>
                </div>
                <div class="ig-stats">
                  <div class="ig-stat"><span class="ig-stat-num">${posts.length}</span><span class="ig-stat-lbl">posts</span></div>
                  <div class="ig-stat"><span class="ig-stat-num">${profile.followers || "0"}</span><span class="ig-stat-lbl">followers</span></div>
                  <div class="ig-stat"><span class="ig-stat-num">${profile.following || "0"}</span><span class="ig-stat-lbl">following</span></div>
                </div>
              </div>
              <div class="ig-name">${profile.name}${profile.verified && html`<${VerifiedIcon}/>`}</div>
              <div class="ig-bio">${profile.bio}</div>
              <div class="ig-actions">
                <button class=${`ig-btn ${following ? "ig-btn-foff" : "ig-btn-fon"}`} onClick=${() => setFollowing(f => !f)}>
                  ${following ? "Following" : "Follow"}
                </button>
                <a href=${COMPANION_URL} class="ig-btn ig-btn-msg">Message</a>
              </div>
            </div>

            ${highlights.length > 0 && html`
              <div class="ig-hl-row">
                ${highlights.map(hl => html`
                  <div class="ig-hl" key=${hl.id} onClick=${() => setStoryViewer({ images: hl.images, label: hl.label })}>
                    <div class="ig-hl-ring"><img src=${imgSrc(hl.cover)} alt=${hl.label}/></div>
                    <span class="ig-hl-lbl">${hl.label}</span>
                  </div>
                `)}
              </div>
            `}

            <div class="ig-divider"/>

            <div class="ig-grid">
              ${posts.length === 0
                ? html`<div class="ig-empty"><div style=${{ fontSize:28, marginBottom:10, opacity:0.3 }}>📷</div>No posts yet.</div>`
                : posts.map(post => html`
                  <div class="ig-cell" key=${post.id} onClick=${() => setOpenPost(post)}>
                    <img src=${imgSrc(post.src)} alt=${post.caption} loading="lazy"/>
                    <div class="ig-cell-over">
                      <span class="ig-cell-stat"><${HeartIcon} filled=${true}/> ${fmt(post.likes)}</span>
                      <span class="ig-cell-stat"><${CommentIcon}/> ${fmt(post.commentCount)}</span>
                    </div>
                  </div>
                `)
              }
            </div>
          </>
        `}
      </div>

      ${openPost && html`
        <div class="lb-bg" onClick=${() => setOpenPost(null)}>
          <div class="lb" onClick=${e => e.stopPropagation()}>
            ${openIdx > 0             && html`<button class="lb-nav prev" onClick=${() => setOpenPost(posts[openIdx-1])}><${ChevLeft}/></button>`}
            ${openIdx < posts.length-1 && html`<button class="lb-nav next" onClick=${() => setOpenPost(posts[openIdx+1])}><${ChevRight}/></button>`}

            <div class="lb-post-header">
              <img class="lb-post-av" src=${imgSrc(profile.avatar)} alt=${profile.name}/>
              <div class="lb-post-info">
                <div class="lb-post-uname">${profile.username}${profile.verified && html`<${VerifiedIcon}/>`}</div>
                ${openPost.location && html`<div class="lb-post-loc"><${LocationIcon}/> ${openPost.location}</div>`}
              </div>
              <button class="lb-post-dots"><${DotsIcon}/></button>
            </div>

            <img class="lb-img" src=${imgSrc(openPost.src)} alt=${openPost.caption}/>

            <div class="lb-scroll">
              <div class="lb-body">
                <div class="lb-actions">
                  <button onClick=${() => setLikedPosts(p => ({ ...p, [openPost.id]: !p[openPost.id] }))}><${HeartIcon} filled=${!!likedPosts[openPost.id]}/></button>
                  <button><${CommentIcon}/></button>
                  <button><${ShareIcon}/></button>
                  <div style=${{ flex:1 }}/>
                  <button onClick=${() => setSavedPosts(p => ({ ...p, [openPost.id]: !p[openPost.id] }))}><${BookmarkIcon} filled=${!!savedPosts[openPost.id]}/></button>
                </div>
                <div class="lb-likes">${fmt(openPost.likes + (likedPosts[openPost.id] ? 1 : 0))} likes</div>
                <div class="lb-caption"><strong>${profile.username} </strong>${openPost.caption}</div>
                <div class="lb-date">${openPost.date} ago</div>
              </div>
              <div class="lb-comments">
                ${(openPost.comments || []).map((c, i) => html`
                  <div class="lb-comment" key=${i}>
                    <div class="lb-c-av">${c.user.replace("@","").slice(0,2).toUpperCase()}</div>
                    <div>
                      <div class="lb-c-user">${c.user}</div>
                      <div class="lb-c-text">${c.text}</div>
                    </div>
                  </div>
                `)}
                <div class="lb-limited">
                  <${LockIcon}/>
                  <div class="lb-limited-text">Comments on this post have been limited. Only people ${profile.username} follows can comment.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `}

      ${storyViewer && html`
        <${StoryViewer}
          images=${storyViewer.images}
          label=${storyViewer.label}
          avatar=${profile.avatar || ""}
          username=${profile.username || ""}
          onClose=${() => setStoryViewer(null)}
        />
      `}
    </>
  `;
}

// ─── MOUNT ───────────────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(html`<${InstagramProfile}/>`);
