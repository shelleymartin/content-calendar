/**
 * DEEPER HEALING · CONTENT CALENDAR
 * Premium light-mode SaaS UI
 *
 * CALENDAR LAYOUT FIX:
 * Root cause of horizontal overflow was three-fold:
 *   1. The outer ViewRouter added 24px padding on both sides, then the
 *      CalendarView used a CSS Grid with `gridTemplateColumns:"1fr 300px"`.
 *      The 1fr column had no max-width constraint so it grew past the viewport.
 *   2. The .cal-grid used `grid-template-columns:repeat(7,1fr)` in CSS but
 *      the parent card had no explicit `width:100%` or `overflow:hidden`, so
 *      when any child (event chip) was wider than 1/7 of the card, it pushed
 *      the grid out.
 *   3. Event chips used `display:flex` with no `min-width:0` on the title
 *      span, so the text prevented the column from shrinking below its content
 *      width — classic flex overflow bug.
 *
 * Fixes applied:
 *   • CalendarView wrapper: `width:100%; min-width:0; overflow:hidden`
 *   • Calendar card: `width:100%; overflow:hidden`
 *   • .cal-grid: `width:100%; table-layout-style: each column exactly 1/7`
 *     Achieved with `grid-template-columns:repeat(7,minmax(0,1fr))` — the
 *     `minmax(0,1fr)` is the critical change; plain `1fr` has an implicit
 *     minimum of `auto` (content size), `minmax(0,1fr)` forces minimum to 0.
 *   • .cal-cell: `width:100%; min-width:0; overflow:hidden`
 *   • .cal-event-title: `min-width:0; overflow:hidden; text-overflow:ellipsis`
 *   • ViewRouter: `padding:20px 20px` (reduced side padding)
 *   • CalendarView: sidebar reduced to 260px, main calendar gets all remaining
 *     space via `minmax(0,1fr)` in the parent grid.
 *   • Main layout: `overflow:hidden` on the main content area to prevent
 *     any child from causing the page to scroll horizontally.
 */

import React, {
  useEffect, useMemo, useState, useCallback,
  useRef, createContext, useContext,
} from "react";
import {
  Activity, AlertCircle, Archive, ArrowRight,
  Calendar, Check, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, ExternalLink, FileText,
  Inbox, Layers, Lightbulb, List,
  Loader2, Menu, Pencil, Plus, Search,
  Trash2, Upload, X, Zap,
  Columns, Target, Home,
} from "lucide-react";
import { supabase, supabaseConfigError } from "./lib/supabase";

// ─── Fonts ────────────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("dh-fonts")) return;
  const l = document.createElement("link");
  l.id = "dh-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap";
  document.head.appendChild(l);
})();

// ─── Global CSS ───────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("dh-css")) return;
  const s = document.createElement("style");
  s.id = "dh-css";
  s.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; overflow: hidden; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #F8F9FA; color: #111827;
      -webkit-font-smoothing: antialiased;
    }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }

    @keyframes fadeIn  { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
    @keyframes slideIn { from{transform:translateX(100%)} to{transform:none} }
    @keyframes scaleIn { from{transform:scale(.97);opacity:0} to{transform:none;opacity:1} }
    @keyframes spin    { to{transform:rotate(360deg)} }
    @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }

    .fade-in  { animation: fadeIn  0.18s ease both; }
    .slide-in { animation: slideIn 0.26s cubic-bezier(.32,.72,0,1) both; }
    .scale-in { animation: scaleIn 0.16s ease both; }
    .spin     { animation: spin 0.8s linear infinite; }
    .pulse-dot{ animation: pulse 1.8s ease infinite; }

    /* ── Critical overflow prevention ── */
    .truncate { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }

    /* ── Buttons ── */
    .btn-primary {
      display:inline-flex; align-items:center; gap:6px; flex-shrink:0;
      padding:7px 15px; border-radius:8px;
      background:#111827; color:#fff;
      font-size:13px; font-weight:600; font-family:'Inter',sans-serif;
      border:none; cursor:pointer;
      transition:background 0.15s, box-shadow 0.15s, transform 0.1s;
      white-space:nowrap;
    }
    .btn-primary:hover  { background:#1F2937; box-shadow:0 4px 12px rgba(17,24,39,.18); }
    .btn-primary:active { transform:scale(.98); }

    .btn-secondary {
      display:inline-flex; align-items:center; gap:5px; flex-shrink:0;
      padding:6px 12px; border-radius:7px;
      background:#fff; color:#374151;
      font-size:12px; font-weight:500; font-family:'Inter',sans-serif;
      border:1px solid #E5E7EB; cursor:pointer;
      transition:background 0.12s, border-color 0.12s;
      white-space:nowrap;
    }
    .btn-secondary:hover { background:#F9FAFB; border-color:#D1D5DB; }
    .btn-secondary:active { transform:scale(.98); }

    .btn-ghost {
      display:inline-flex; align-items:center; gap:4px; flex-shrink:0;
      padding:4px 7px; border-radius:6px;
      background:transparent; color:#6B7280;
      font-size:12px; font-weight:500; font-family:'Inter',sans-serif;
      border:none; cursor:pointer;
      transition:background 0.1s, color 0.1s;
    }
    .btn-ghost:hover { background:#F3F4F6; color:#111827; }

    /* ── Card ── */
    .card {
      background:#fff;
      border:1px solid #E5E7EB;
      border-radius:12px;
      box-shadow:0 1px 3px rgba(0,0,0,.04);
    }
    .card-hover {
      transition:border-color .15s, box-shadow .15s, transform .15s;
      cursor:pointer;
    }
    .card-hover:hover {
      border-color:#C7D2FE;
      box-shadow:0 4px 16px rgba(99,102,241,.1);
      transform:translateY(-1px);
    }

    .row-hover { transition:background .1s; cursor:pointer; }
    .row-hover:hover { background:#F9FAFB; }

    /* ── Sidebar nav ── */
    .nav-item {
      display:flex; align-items:center; gap:9px;
      padding:7px 10px; border-radius:8px;
      background:transparent; color:#6B7280;
      font-size:13px; font-weight:500; font-family:'Inter',sans-serif;
      border:none; cursor:pointer; width:100%; text-align:left;
      transition:background .12s, color .12s;
    }
    .nav-item:hover { background:#F3F4F6; color:#111827; }
    .nav-item.active { background:#EEF2FF; color:#4F46E5; font-weight:600; }
    .nav-item.active svg { color:#4F46E5 !important; }

    /* ── Form field ── */
    .field {
      width:100%; background:#fff; border:1.5px solid #E5E7EB;
      border-radius:8px; padding:9px 12px; font-size:13px;
      color:#111827; font-family:'Inter',sans-serif; outline:none;
      transition:border-color .15s, box-shadow .15s;
    }
    .field:focus { border-color:#6366F1; box-shadow:0 0 0 3px rgba(99,102,241,.1); }
    .field::placeholder { color:#9CA3AF; }

    /* ── Status/platform tags ── */
    .tag { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:600; border:1px solid transparent; white-space:nowrap; flex-shrink:0; }
    .tag-draft     { background:#F3F4F6; color:#6B7280;  border-color:#E5E7EB; }
    .tag-approved  { background:#ECFDF5; color:#065F46;  border-color:#A7F3D0; }
    .tag-scheduled { background:#FFFBEB; color:#92400E;  border-color:#FCD34D; }
    .tag-posted    { background:#EEF2FF; color:#3730A3;  border-color:#C7D2FE; }

    .dot-draft     { background:#9CA3AF; flex-shrink:0; }
    .dot-approved  { background:#10B981; flex-shrink:0; }
    .dot-scheduled { background:#F59E0B; flex-shrink:0; }
    .dot-posted    { background:#6366F1; flex-shrink:0; }

    /* ── Kanban ── */
    .k-col { flex-shrink:0; width:260px; background:#F9FAFB; border:1px solid #E5E7EB; border-radius:12px; display:flex; flex-direction:column; }
    .k-card { background:#fff; border:1px solid #E5E7EB; border-radius:10px; padding:12px; margin:0 8px 8px; cursor:pointer; transition:border-color .15s, box-shadow .15s, transform .15s; }
    .k-card:hover { border-color:#C7D2FE; box-shadow:0 4px 14px rgba(99,102,241,.1); transform:translateY(-1px); }

    /* ── Overlays ── */
    .overlay { position:fixed; inset:0; z-index:40; background:rgba(0,0,0,.16); backdrop-filter:blur(3px); }
    .cmd-wrap { position:fixed; inset:0; z-index:200; display:flex; align-items:flex-start; justify-content:center; padding-top:12vh; background:rgba(0,0,0,.22); backdrop-filter:blur(4px); }

    /* ════════════════════════════════════════════════════════════
       CALENDAR — constrained month grid, no horizontal scroll
       ════════════════════════════════════════════════════════════

       KEY FIX: grid-template-columns uses minmax(0, 1fr) NOT 1fr.
       Plain 1fr has an implicit minimum of "auto" (= content size).
       minmax(0, 1fr) sets the minimum to 0, allowing columns to
       shrink below their content width so long text is clipped,
       not expanded. This is the single most important change.
    ════════════════════════════════════════════════════════════ */

    /* The 7-column month grid */
    .cal-grid {
      /* minmax(0, 1fr) — critical: prevents content from expanding columns */
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      width: 100%;          /* fill parent exactly */
      min-width: 0;         /* allow shrinking */
      overflow: hidden;     /* clip anything that still escapes */
    }

    /* Day-of-week header row — same column math */
    .cal-dow {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      width: 100%;
      min-width: 0;
      border-bottom: 1px solid #F3F4F6;
      background: #FAFAFA;
      flex-shrink: 0;
    }

    /* Individual day cell — FIXED height, two-part layout */
    .cal-cell {
      /* Fixed row height keeps every row uniform */
      height: 108px;
      display: flex;
      flex-direction: column;
      /* Cell must not grow wider than its grid column */
      min-width: 0;
      overflow: hidden;
      border-right: 1px solid #F3F4F6;
      border-bottom: 1px solid #F3F4F6;
      cursor: pointer;
      transition: background 0.1s;
      background: #fff;
    }
    .cal-cell:hover    { background: #FAFAFA; }
    .cal-cell.selected { background: #EEF2FF; }
    .cal-cell.today    { background: #FFFBEB; }
    .cal-cell.blank    { background: #FAFAFA; cursor:default; pointer-events:none; }

    /* ── Cell header: date number — fixed 26px, never moves ── */
    .cal-head {
      flex-shrink: 0;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 6px;
      gap: 4px;
      min-width: 0;
    }

    .cal-day-num {
      font-size: 11px;
      font-weight: 700;
      color: #6B7280;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 5px;
      flex-shrink: 0;
    }
    .cal-day-num.is-today    { background:#FDE68A; color:#92400E; }
    .cal-day-num.is-selected { background:#C7D2FE; color:#4338CA; }
    .cal-day-num.is-both     { background:#6366F1; color:#fff;    }

    .cal-count {
      font-size: 9px;
      font-weight: 600;
      color: #C4B5FD;
      margin-left: auto;
      flex-shrink: 0;
    }

    /* ── Cell body: events — fills remaining 82px, clips overflow ── */
    .cal-body {
      flex: 1;
      min-width: 0;        /* CRITICAL: allows body to shrink with column */
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 0 4px 4px;
    }

    /* Event chip inside a cell */
    .cal-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 5px;
      border-radius: 4px;
      background: #fff;
      border: 1px solid #E5E7EB;
      cursor: pointer;
      transition: border-color 0.12s, background 0.12s;
      /* CRITICAL: chip must not grow wider than the cell body */
      min-width: 0;
      overflow: hidden;
      width: 100%;
      flex-shrink: 0;
    }
    .cal-chip:hover {
      border-color: #A5B4FC;
      background: #EEF2FF;
    }

    .cal-chip-dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      flex-shrink: 0;        /* dot never shrinks */
    }

    /* CRITICAL: title span must have min-width:0 and overflow:hidden
       Without min-width:0, a flex child won't shrink below content size */
    .cal-chip-title {
      font-size: 10px;
      font-weight: 500;
      color: #374151;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;          /* CRITICAL for ellipsis in flex container */
      flex: 1;
    }

    .cal-overflow {
      font-size: 9px;
      font-weight: 600;
      color: #9CA3AF;
      padding: 1px 5px;
      flex-shrink: 0;
    }
  `;
  document.head.appendChild(s);
})();

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES   = ["Draft","Approved","Scheduled","Posted"];
const PLATFORMS  = ["Instagram","TikTok","YouTube","LinkedIn","Facebook"];
const PRIORITIES = ["Low","Medium","High","Urgent"];

const STATUS_META = {
  Draft:     { tagCls:"tag-draft",     dot:"dot-draft",     label:"Draft"     },
  Approved:  { tagCls:"tag-approved",  dot:"dot-approved",  label:"Approved"  },
  Scheduled: { tagCls:"tag-scheduled", dot:"dot-scheduled", label:"Scheduled" },
  Posted:    { tagCls:"tag-posted",    dot:"dot-posted",    label:"Posted"    },
};
const PLATFORM_META = {
  Instagram: { emoji:"📷" },
  TikTok:    { emoji:"🎵" },
  YouTube:   { emoji:"▶"  },
  LinkedIn:  { emoji:"💼" },
  Facebook:  { emoji:"📘" },
};
const PRIORITY_COLOR = {
  Low:"#9CA3AF", Medium:"#F59E0B", High:"#F97316", Urgent:"#EF4444",
};
const NAV_ITEMS = [
  { id:"home",     label:"Home",          icon:Home      },
  { id:"calendar", label:"Calendar",      icon:Calendar  },
  { id:"board",    label:"Board",         icon:Columns   },
  { id:"list",     label:"All Posts",     icon:List      },
  { id:"inbox",    label:"Idea Inbox",    icon:Lightbulb },
  { id:"vault",    label:"Content Vault", icon:Archive   },
  { id:"activity", label:"Activity",      icon:Activity  },
];

// ─── Utils ────────────────────────────────────────────────────────────────────
const fmt = d =>
  [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");
const stripTime = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const normUrl = v => {
  if (!v?.trim()) return "";
  const s = v.trim().startsWith("http") ? v.trim() : `https://${v.trim()}`;
  try { const u=new URL(s); return ["http:","https:"].includes(u.protocol)?u.toString():""; }
  catch { return ""; }
};
const buildGrid = (date, posts) => {
  const y=date.getFullYear(), m=date.getMonth();
  const first=new Date(y,m,1).getDay(), days=new Date(y,m+1,0).getDate();
  const cells = Array(first).fill(null);
  for (let d=1; d<=days; d++) {
    const k = fmt(new Date(y,m,d));
    cells.push({ day:d, date:k, posts:posts.filter(p=>p.date===k) });
  }
  return cells;
};
const relDate = s => {
  if (!s) return "";
  const diff = Math.round((new Date(`${s}T00:00:00`) - stripTime(new Date())) / 864e5);
  if (diff===0) return "Today"; if (diff===1) return "Tomorrow"; if (diff===-1) return "Yesterday";
  if (diff>0&&diff<8) return `In ${diff}d`; if (diff<0&&diff>-8) return `${Math.abs(diff)}d ago`;
  return new Date(`${s}T00:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric"});
};
const seedDB = () => ({ ideas:[], posts:[], vault:[], notifications:[] });

// ─── Context ──────────────────────────────────────────────────────────────────
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [db, setDB]             = useState(seedDB());
  const [view, setView]         = useState("home");
  const [search, setSearch]     = useState("");
  const [selDate, setSelDate]   = useState(new Date());
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState("");
  const [editPost, setEdit]     = useState(null);
  const [sidebar, setSidebar]   = useState(true);
  const [cmdOpen, setCmdOpen]   = useState(false);
  const [quickAdd, setQA]       = useState(false);
  const [filterStatus, setFS]   = useState("all");
  const [filterPlatform, setFP] = useState("all");
  const [sortBy, setSort]       = useState("date");

  useEffect(() => {
    const fn = e => {
      if ((e.metaKey||e.ctrlKey)&&e.key==="k") { e.preventDefault(); setCmdOpen(o=>!o); }
      if ((e.metaKey||e.ctrlKey)&&e.key==="n") { e.preventDefault(); setQA(true); }
      if (e.key==="Escape") { setCmdOpen(false); setQA(false); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const fetchAll = useCallback(async (loader=false) => {
    if (!supabase) return;
    if (loader) setLoading(true);
    setErr("");
    try {
      const [p,i,v,n] = await Promise.all([
        supabase.from("posts").select("*").order("date",{ascending:true}),
        supabase.from("ideas").select("*").order("created_at",{ascending:false}),
        supabase.from("vault").select("*").order("created_at",{ascending:false}),
        supabase.from("notifications").select("*").order("created_at",{ascending:false}),
      ]);
      if(p.error)throw p.error; if(i.error)throw i.error;
      if(v.error)throw v.error; if(n.error)throw n.error;
      setDB({ posts:p.data??[], ideas:i.data??[], vault:v.data??[], notifications:n.data??[] });
    } catch(e) { setErr(e.message||"Could not load data."); }
    finally { if (loader) setLoading(false); }
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let t;
    const deb = () => { clearTimeout(t); t=setTimeout(()=>fetchAll(false),200); };
    fetchAll(true);
    const ch = supabase.channel("dh-v3")
      .on("postgres_changes",{event:"*",schema:"public",table:"posts"},deb)
      .on("postgres_changes",{event:"*",schema:"public",table:"ideas"},deb)
      .on("postgres_changes",{event:"*",schema:"public",table:"vault"},deb)
      .on("postgres_changes",{event:"*",schema:"public",table:"notifications"},deb)
      .subscribe();
    return () => { clearTimeout(t); supabase.removeChannel(ch); };
  }, [fetchAll]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return db.posts
      .filter(p => {
        const mQ = !q || ["title","platform","status","caption","notes","feedback"].some(k=>(p[k]||"").toLowerCase().includes(q));
        const mS = filterStatus==="all" || p.status===filterStatus;
        const mP = filterPlatform==="all" || p.platform===filterPlatform;
        return mQ && mS && mP;
      })
      .sort((a,b) => {
        if (sortBy==="date")   return new Date(a.date)-new Date(b.date);
        if (sortBy==="title")  return (a.title||"").localeCompare(b.title||"");
        if (sortBy==="status") return STATUSES.indexOf(a.status)-STATUSES.indexOf(b.status);
        return 0;
      });
  }, [db.posts, search, filterStatus, filterPlatform, sortBy]);

  const upcoming   = useMemo(() => { const t=fmt(new Date()); return filtered.filter(p=>p.date>=t); }, [filtered]);
  const grid       = useMemo(() => buildGrid(selDate, db.posts), [selDate, db.posts]);
  const byStatus   = useMemo(() => Object.fromEntries(STATUSES.map(s=>[s,filtered.filter(p=>p.status===s)])), [filtered]);
  const completion = useMemo(() => db.posts.length ? Math.round(db.posts.filter(p=>p.status==="Posted").length/db.posts.length*100) : 0, [db.posts]);

  async function notif(msg, type="info", rel=null) {
    if (!supabase) return;
    await supabase.from("notifications").insert([{ message:msg, type, read:false, related_post_id:rel, updated_at:new Date().toISOString() }]);
  }
  async function addPost(post) {
    if (!supabase) return;
    const payload = { title:post.title, date:post.date, platform:post.platform, status:post.status||"Draft", caption:post.caption||"", notes:post.notes||"", video_link:normUrl(post.video_link||""), feedback:post.feedback||"", updated_at:new Date().toISOString() };
    const { data, error } = await supabase.from("posts").insert([payload]).select();
    if (error) { setErr(error.message); return; }
    if (data?.[0]) await notif(`"${data[0].title}" added.`, "success", data[0].id);
    await fetchAll(false);
  }
  async function updatePost(id, fields) {
    if (!supabase) return false;
    const payload = { title:fields.title, date:fields.date, platform:fields.platform, status:fields.status, notes:fields.notes||"", video_link:normUrl(fields.video_link||""), caption:fields.caption||"", feedback:fields.feedback||"", updated_at:new Date().toISOString() };
    const { data, error } = await supabase.from("posts").update(payload).eq("id",id).select();
    if (error) { setErr(error.message); return false; }
    if (data?.[0]) await notif(`"${data[0].title}" updated.`, "info", data[0].id);
    await fetchAll(false); return true;
  }
  async function deletePost(id) {
    if (!supabase) return;
    const post = db.posts.find(p=>p.id===id);
    await supabase.from("posts").delete().eq("id",id);
    if (post) await notif(`"${post.title}" deleted.`, "warning", id);
    setEdit(prev=>prev?.id===id ? null : prev);
    await fetchAll(false);
  }
  async function updateStatus(id, status) {
    if (!supabase) return;
    const { data, error } = await supabase.from("posts").update({ status, updated_at:new Date().toISOString() }).eq("id",id).select();
    if (error) { setErr(error.message); return; }
    if (data?.[0]) await notif(`"${data[0].title}" → ${status}.`, "info", data[0].id);
    setEdit(prev=>prev?.id===id ? {...prev,status} : prev);
    await fetchAll(false);
  }
  async function addIdea(text) {
    if (!supabase||!text.trim()) return;
    await supabase.from("ideas").insert([{ title:text.trim(), platform:"Instagram", notes:"", status:"Idea", updated_at:new Date().toISOString() }]);
    await fetchAll(false);
  }
  async function convertIdea(idea) {
    if (!supabase) return;
    const { data, error } = await supabase.from("posts").insert([{ title:idea.title||"Untitled", date:fmt(new Date()), platform:idea.platform||"Instagram", status:"Draft", caption:idea.notes||"", notes:"", video_link:"", feedback:"", updated_at:new Date().toISOString() }]).select();
    if (error) { setErr(error.message); return; }
    await supabase.from("ideas").delete().eq("id",idea.id);
    await notif(`Post from idea: "${idea.title}"`, "success", data?.[0]?.id??null);
    await fetchAll(false);
  }
  async function addVault(text) {
    if (!supabase||!text.trim()) return;
    await supabase.from("vault").insert([{ title:"Saved Content", platform:"General", content:text.trim(), media_url:"", tags:"", updated_at:new Date().toISOString() }]);
    await fetchAll(false);
  }
  async function deleteVault(id) {
    if (!supabase) return;
    await supabase.from("vault").delete().eq("id",id);
    await fetchAll(false);
  }

  if (supabaseConfigError) {
    return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#F8F9FA"}}>
        <div className="card" style={{padding:32,maxWidth:440}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <AlertCircle style={{width:20,height:20,color:"#F59E0B",flexShrink:0,marginTop:2}}/>
            <div>
              <p style={{fontWeight:600,fontSize:15,color:"#111827",marginBottom:6}}>Supabase not configured</p>
              <p style={{fontSize:13,color:"#6B7280",lineHeight:1.6}}>{supabaseConfigError}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ctx = {
    db, filtered, upcoming, grid, byStatus, completion,
    selDate, setSelDate, view, setView, search, setSearch,
    editPost, setEdit, sidebar, setSidebar, cmdOpen, setCmdOpen,
    quickAdd, setQA, filterStatus, setFS, filterPlatform, setFP, sortBy, setSort,
    addPost, updatePost, deletePost, updateStatus,
    addIdea, convertIdea, addVault, deleteVault,
    loading, err, setErr,
  };

  return (
    <Ctx.Provider value={ctx}>
      {/*
        Root layout: sidebar + main-area side by side.
        overflow:hidden on root prevents any child from causing
        page-level horizontal scroll.
      */}
      <div style={{display:"flex",height:"100vh",width:"100vw",overflow:"hidden",background:"#F8F9FA"}}>
        <Sidebar/>
        {/*
          Main column: flex-column, min-width:0 is CRITICAL here.
          Without min-width:0 on a flex child, the child's minimum
          size is its content size — the calendar grid would push it wide.
          With min-width:0 the column can shrink to give the sidebar its space.
        */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          <TopBar/>
          {quickAdd && <QuickAddBar/>}
          {err && <ErrBanner/>}
          {/*
            main scroll area — overflowY:auto (vertical scroll for tall views),
            overflowX:hidden (never horizontal scroll).
          */}
          <main style={{flex:1,overflowY:"auto",overflowX:"hidden",minWidth:0}}>
            {loading ? <LoadingState/> : <ViewRouter/>}
          </main>
        </div>
        {editPost && <EditPanel/>}
        {cmdOpen  && <CommandPalette/>}
      </div>
    </Ctx.Provider>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar() {
  const { view, setView, sidebar, setSidebar, db, upcoming } = useApp();
  return (
    <aside style={{
      /* Fixed width sidebar — shrink:0 so it never collapses */
      width: sidebar ? 210 : 48,
      flexShrink: 0,
      background:"#fff", borderRight:"1px solid #E5E7EB",
      display:"flex", flexDirection:"column",
      transition:"width 0.2s cubic-bezier(.32,.72,0,1)",
      overflow:"hidden", zIndex:20,
    }}>
      {/* Logo row */}
      <div style={{padding:"12px 8px 8px",borderBottom:"1px solid #F3F4F6",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 6px",borderRadius:8}}>
          <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14,boxShadow:"0 2px 8px rgba(99,102,241,.25)"}}>🌿</div>
          {sidebar && (
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:12,fontWeight:700,color:"#111827",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Deeper Healing</p>
              <p style={{fontSize:10,color:"#9CA3AF",marginTop:1}}>Content OS</p>
            </div>
          )}
          <button onClick={()=>setSidebar(o=>!o)} className="btn-ghost" style={{padding:4,marginLeft:"auto",flexShrink:0}}>
            <Menu style={{width:14,height:14}}/>
          </button>
        </div>
      </div>

      {/* Nav */}
      <div style={{padding:"6px",flex:1,overflowY:"auto"}}>
        {sidebar && <p style={{fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.1em",padding:"4px 8px 4px"}}>Navigation</p>}
        {NAV_ITEMS.map(item => {
          const badge = item.id==="inbox" ? db.ideas.length : 0;
          return (
            <button key={item.id} onClick={()=>setView(item.id)}
              className={`nav-item ${view===item.id?"active":""}`}
              title={item.label}
              style={{marginBottom:1, justifyContent:sidebar?"flex-start":"center", padding:sidebar?"6px 10px":"7px"}}>
              <item.icon style={{width:15,height:15,flexShrink:0,color:view===item.id?"#6366F1":"#9CA3AF"}}/>
              {sidebar && <span style={{flex:1,minWidth:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.label}</span>}
              {sidebar && badge>0 && <span style={{background:"#EEF2FF",color:"#6366F1",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:10,flexShrink:0}}>{badge}</span>}
            </button>
          );
        })}

        {sidebar && (
          <>
            <div style={{height:1,background:"#F3F4F6",margin:"8px 2px"}}/>
            <p style={{fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.1em",padding:"0 8px 4px"}}>Overview</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,padding:"0 2px"}}>
              {[
                {label:"Upcoming",value:upcoming.length,color:"#6366F1",bg:"#EEF2FF"},
                {label:"Posted",  value:db.posts.filter(p=>p.status==="Posted").length,color:"#10B981",bg:"#ECFDF5"},
                {label:"Ideas",   value:db.ideas.length,  color:"#F59E0B",bg:"#FFFBEB"},
                {label:"Vault",   value:db.vault.length,  color:"#8B5CF6",bg:"#F5F3FF"},
              ].map(s=>(
                <div key={s.label} style={{background:s.bg,borderRadius:7,padding:"7px 8px",border:`1px solid ${s.color}20`}}>
                  <p style={{fontSize:17,fontWeight:700,color:s.color,lineHeight:1}}>{s.value}</p>
                  <p style={{fontSize:9,color:"#9CA3AF",marginTop:2,textTransform:"uppercase",letterSpacing:"0.08em"}}>{s.label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* User footer */}
      {sidebar && (
        <div style={{padding:"8px",borderTop:"1px solid #F3F4F6",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:8}} className="row-hover">
            <div style={{width:24,height:24,borderRadius:"50%",background:"linear-gradient(135deg,#6366F1,#8B5CF6)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:700}}>S</div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:12,fontWeight:600,color:"#374151",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Shelley Martin</p>
              <p style={{fontSize:10,color:"#9CA3AF"}}>Admin</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────
function TopBar() {
  const { view, setCmdOpen, setQA, filterStatus, setFS, filterPlatform, setFP, sortBy, setSort } = useApp();
  const label = NAV_ITEMS.find(n=>n.id===view)?.label || "Home";
  const showFilters = ["calendar","board","list"].includes(view);

  return (
    <div style={{height:48,borderBottom:"1px solid #E5E7EB",background:"#fff",display:"flex",alignItems:"center",padding:"0 16px",gap:8,flexShrink:0,minWidth:0,overflow:"hidden"}}>
      {/* Breadcrumb */}
      <div style={{display:"flex",alignItems:"center",gap:5,minWidth:0,flex:"0 0 auto"}}>
        <span style={{fontSize:11,color:"#9CA3AF",whiteSpace:"nowrap"}}>Deeper Healing</span>
        <ChevronRight style={{width:11,height:11,color:"#D1D5DB",flexShrink:0}}/>
        <span style={{fontSize:13,fontWeight:600,color:"#111827",whiteSpace:"nowrap"}}>{label}</span>
      </div>

      <div style={{flex:1}}/>

      {/* Filters */}
      {showFilters && (
        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          {[
            {val:filterStatus,   set:setFS,   opts:["all",...STATUSES],  lbl:"Status"},
            {val:filterPlatform, set:setFP,   opts:["all",...PLATFORMS], lbl:"Platform"},
            {val:sortBy,         set:setSort, opts:["date","title","status"], lbl:"Sort"},
          ].map((f,i)=>(
            <select key={i} value={f.val} onChange={e=>f.set(e.target.value)}
              style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:6,padding:"4px 7px",fontSize:11,color:"#374151",cursor:"pointer",outline:"none",fontFamily:"'Inter',sans-serif",flexShrink:0}}>
              {f.opts.map(o=><option key={o} value={o}>{o==="all"?`All ${f.lbl}`:o}</option>)}
            </select>
          ))}
        </div>
      )}

      {/* Search */}
      <button onClick={()=>setCmdOpen(true)}
        style={{display:"flex",alignItems:"center",gap:7,background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:7,padding:"4px 10px",cursor:"pointer",color:"#9CA3AF",fontSize:12,width:150,fontFamily:"'Inter',sans-serif",flexShrink:0,transition:"border-color 0.15s"}}
        onMouseEnter={e=>e.currentTarget.style.borderColor="#D1D5DB"}
        onMouseLeave={e=>e.currentTarget.style.borderColor="#E5E7EB"}>
        <Search style={{width:11,height:11,flexShrink:0}}/>
        <span style={{flex:1,textAlign:"left"}}>Search…</span>
        <kbd style={{fontSize:10,background:"#F3F4F6",border:"1px solid #E5E7EB",borderRadius:4,padding:"1px 4px",color:"#9CA3AF",flexShrink:0}}>⌘K</kbd>
      </button>

      <button onClick={()=>setQA(q=>!q)} className="btn-primary" style={{fontSize:12,padding:"6px 12px"}}>
        <Plus style={{width:12,height:12}}/>New post
      </button>
    </div>
  );
}

// ─── View router ──────────────────────────────────────────────────────────────
function ViewRouter() {
  const { view } = useApp();
  /*
    Padding: 16px on all sides.
    width:100% + min-width:0 ensures this wrapper never exceeds its parent.
    The calendar view in particular needs these constraints propagated down.
  */
  return (
    <div className="fade-in" style={{padding:"16px",width:"100%",minWidth:0,boxSizing:"border-box"}}>
      {view==="home"     && <HomeView/>}
      {view==="calendar" && <CalendarView/>}
      {view==="board"    && <BoardView/>}
      {view==="list"     && <ListView/>}
      {view==="inbox"    && <InboxView/>}
      {view==="vault"    && <VaultView/>}
      {view==="activity" && <ActivityView/>}
    </div>
  );
}

// ─── Home view ────────────────────────────────────────────────────────────────
function HomeView() {
  const { db, upcoming, completion, setView, setEdit } = useApp();
  const recent = [...db.posts].sort((a,b)=>new Date(b.updated_at||b.date)-new Date(a.updated_at||a.date)).slice(0,5);

  return (
    <div style={{maxWidth:900,margin:"0 auto"}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:24,fontWeight:700,color:"#111827",marginBottom:4,letterSpacing:"-0.3px"}}>
          Deeper Healing Content Calendar
        </h1>
        <p style={{fontSize:13,color:"#6B7280"}}>
          {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
        </p>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:10,marginBottom:14}}>
        {[
          {label:"Total posts",  value:db.posts.length,                                 accent:"#6366F1",bg:"#EEF2FF",icon:FileText    },
          {label:"Upcoming",     value:upcoming.length,                                 accent:"#8B5CF6",bg:"#F5F3FF",icon:Calendar    },
          {label:"Posted",       value:db.posts.filter(p=>p.status==="Posted").length, accent:"#10B981",bg:"#ECFDF5",icon:CheckCircle2 },
          {label:"Completion",   value:`${completion}%`,                               accent:"#F59E0B",bg:"#FFFBEB",icon:Target       },
        ].map(k=>(
          <div key={k.label} className="card" style={{padding:"14px 16px",minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <p style={{fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em"}}>{k.label}</p>
              <div style={{width:26,height:26,borderRadius:7,background:k.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <k.icon style={{width:12,height:12,color:k.accent}}/>
              </div>
            </div>
            <p style={{fontSize:28,fontWeight:700,color:k.accent,lineHeight:1,letterSpacing:"-0.5px"}}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="card" style={{padding:"16px 18px",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <p style={{fontSize:13,fontWeight:600,color:"#374151"}}>Content pipeline</p>
          <p style={{fontSize:12,color:"#9CA3AF"}}>{completion}% complete</p>
        </div>
        <div style={{height:5,background:"#F3F4F6",borderRadius:99,overflow:"hidden",marginBottom:12}}>
          <div style={{height:"100%",width:`${completion}%`,background:"linear-gradient(90deg,#6366F1,#8B5CF6)",borderRadius:99,transition:"width 0.8s ease"}}/>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {STATUSES.map(s=>{
            const count=db.posts.filter(p=>p.status===s).length;
            const sm=STATUS_META[s];
            return (
              <button key={s} onClick={()=>setView("list")} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
                <span className={`tag ${sm.tagCls}`}>
                  <span className={sm.dot} style={{width:5,height:5,borderRadius:"50%"}}/>{s} {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two col */}
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:12}}>
        <div className="card" style={{overflow:"hidden",minWidth:0}}>
          <div style={{padding:"12px 16px 10px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <p style={{fontSize:13,fontWeight:600,color:"#374151"}}>Recent posts</p>
            <button onClick={()=>setView("list")} className="btn-ghost">View all</button>
          </div>
          {recent.length>0 ? recent.map(p=>(
            <div key={p.id} onClick={()=>setEdit(p)} style={{padding:"10px 16px",borderBottom:"1px solid #F9FAFB",display:"flex",alignItems:"center",gap:8,cursor:"pointer",transition:"background 0.1s",minWidth:0}} className="row-hover">
              <span style={{fontSize:15,flexShrink:0}}>{PLATFORM_META[p.platform]?.emoji||"📄"}</span>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:13,fontWeight:500,color:"#111827",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.title}</p>
                <p style={{fontSize:11,color:"#9CA3AF",marginTop:1}}>{relDate(p.date)}</p>
              </div>
              <StatusTag status={p.status} small/>
            </div>
          )) : <EmptyMsg icon="📋" text="No posts yet"/>}
        </div>

        <div className="card" style={{overflow:"hidden",minWidth:0}}>
          <div style={{padding:"12px 16px 10px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <p style={{fontSize:13,fontWeight:600,color:"#374151"}}>Coming up</p>
            <button onClick={()=>setView("calendar")} className="btn-ghost">Calendar</button>
          </div>
          {upcoming.length>0 ? upcoming.slice(0,5).map(p=>{
            const sm=STATUS_META[p.status]||STATUS_META.Draft;
            return (
              <div key={p.id} onClick={()=>setEdit(p)} style={{padding:"10px 16px",borderBottom:"1px solid #F9FAFB",display:"flex",alignItems:"center",gap:8,cursor:"pointer",transition:"background 0.1s",minWidth:0}} className="row-hover">
                <span className={sm.dot} style={{width:7,height:7,borderRadius:"50%",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:500,color:"#111827",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.title}</p>
                  <p style={{fontSize:11,color:"#9CA3AF",marginTop:1}}>{relDate(p.date)} · {p.platform}</p>
                </div>
                <Pencil style={{width:11,height:11,color:"#D1D5DB",flexShrink:0}}/>
              </div>
            );
          }) : <EmptyMsg icon="📅" text="Nothing upcoming"/>}
        </div>
      </div>
    </div>
  );
}

// ─── Calendar view ─────────────────────────────────────────────────────────────
function CalendarView() {
  const { db, upcoming, selDate, setSelDate, grid, setEdit, updateStatus } = useApp();
  const todayKey = fmt(new Date());
  const selKey   = fmt(selDate);
  const dayPosts = db.posts.filter(p=>p.date===selKey).sort((a,b)=>(a.title||"").localeCompare(b.title||""));

  return (
    /*
      Outer wrapper:
        - width:100%  — fills ViewRouter exactly
        - min-width:0 — allows it to shrink, doesn't push parent wide
        - overflow:hidden — final safety net
        - display:grid with minmax(0,1fr) for the calendar column
          so the calendar card never exceeds available space.
    */
    <div style={{
      width:"100%",
      minWidth:0,
      overflow:"hidden",
      display:"grid",
      /* Calendar gets all available space; sidebar is fixed 240px.
         minmax(0,1fr) is critical — same reason as the cell grid. */
      gridTemplateColumns:"minmax(0,1fr) 240px",
      gap:12,
      alignItems:"start",
    }}>

      {/* ── Main calendar card ── */}
      <div className="card" style={{
        /* These three lines are essential */
        width:"100%",
        minWidth:0,
        overflow:"hidden",
        display:"flex",
        flexDirection:"column",
      }}>
        {/* Header */}
        <div style={{padding:"12px 16px 10px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <h2 style={{fontSize:16,fontWeight:700,color:"#111827",letterSpacing:"-0.2px"}}>
            {selDate.toLocaleDateString("en-US",{month:"long",year:"numeric"})}
          </h2>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <button className="btn-secondary" style={{padding:"4px 7px"}}
              onClick={()=>setSelDate(new Date(selDate.getFullYear(),selDate.getMonth()-1,1))}>
              <ChevronLeft style={{width:13,height:13}}/>
            </button>
            <button className="btn-secondary" style={{padding:"4px 10px",fontSize:11}}
              onClick={()=>setSelDate(new Date())}>Today</button>
            <button className="btn-secondary" style={{padding:"4px 7px"}}
              onClick={()=>setSelDate(new Date(selDate.getFullYear(),selDate.getMonth()+1,1))}>
              <ChevronRight style={{width:13,height:13}}/>
            </button>
          </div>
        </div>

        {/*
          Day-of-week header row.
          Uses .cal-dow: grid-template-columns:repeat(7,minmax(0,1fr))
          width:100% — fills the card exactly.
        */}
        <div className="cal-dow">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
            <div key={d} style={{
              padding:"7px 0",
              textAlign:"center",
              fontSize:10,
              fontWeight:600,
              color:"#9CA3AF",
              textTransform:"uppercase",
              letterSpacing:"0.08em",
              /* min-width:0 prevents any label from expanding its column */
              minWidth:0,
              overflow:"hidden",
            }}>
              {d}
            </div>
          ))}
        </div>

        {/*
          Month grid.
          Uses .cal-grid: grid-template-columns:repeat(7,minmax(0,1fr))
          This is the core fix — minmax(0,1fr) instead of 1fr.
        */}
        <div className="cal-grid">
          {grid.map((cell, i) => {
            if (!cell) return <div key={`b-${i}`} className="cal-cell blank"/>;

            const isToday = cell.date === todayKey;
            const isSel   = cell.date === selKey;
            const isBoth  = isToday && isSel;

            const visible  = cell.posts.slice(0, 2);
            const overflow = cell.posts.length - visible.length;

            let cellCls = "cal-cell";
            if (isSel && !isToday) cellCls += " selected";
            if (isToday && !isSel) cellCls += " today";

            let numCls = "cal-day-num";
            if (isBoth)       numCls += " is-both";
            else if (isSel)   numCls += " is-selected";
            else if (isToday) numCls += " is-today";

            return (
              <div key={cell.date}
                className={cellCls}
                onClick={()=>setSelDate(new Date(`${cell.date}T00:00:00`))}>

                {/* Part 1 — date number header: fixed height, never moves */}
                <div className="cal-head">
                  <span className={numCls}>{cell.day}</span>
                  {cell.posts.length > 0 && (
                    <span className="cal-count">{cell.posts.length}</span>
                  )}
                </div>

                {/* Part 2 — event chips: fills remainder, clips overflow */}
                <div className="cal-body">
                  {visible.map(p => {
                    const sm = STATUS_META[p.status]||STATUS_META.Draft;
                    return (
                      <div key={p.id} className="cal-chip"
                        onClick={e=>{ e.stopPropagation(); setEdit(p); }}>
                        <span className={`cal-chip-dot ${sm.dot}`}/>
                        {/* min-width:0 on this span is the critical truncation fix */}
                        <span className="cal-chip-title">{p.title}</span>
                      </div>
                    );
                  })}
                  {overflow > 0 && (
                    <span className="cal-overflow">+{overflow} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <div style={{display:"flex",flexDirection:"column",gap:10,minWidth:0}}>

        {/* Selected day */}
        <div className="card" style={{overflow:"hidden",minWidth:0}}>
          <div style={{padding:"11px 13px 9px",borderBottom:"1px solid #F3F4F6"}}>
            <p style={{fontSize:9,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600,marginBottom:2}}>Selected</p>
            <p style={{fontSize:13,fontWeight:700,color:"#111827"}}>
              {selDate.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}
            </p>
          </div>
          <div style={{padding:"5px 6px",maxHeight:220,overflowY:"auto"}}>
            {dayPosts.length>0 ? dayPosts.map(p=><CalPostRow key={p.id} post={p}/>) : <EmptyMsg icon="📅" text="Nothing here"/>}
          </div>
        </div>

        {/* Queue */}
        <div className="card" style={{overflow:"hidden",minWidth:0}}>
          <div style={{padding:"11px 13px 9px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <p style={{fontSize:9,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600,marginBottom:2}}>Queue</p>
              <p style={{fontSize:13,fontWeight:700,color:"#111827"}}>Coming up</p>
            </div>
            {upcoming.length>0 && <span style={{background:"#EEF2FF",color:"#6366F1",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,flexShrink:0}}>{upcoming.length}</span>}
          </div>
          <div style={{overflowY:"auto",maxHeight:320}}>
            {upcoming.slice(0,8).map(p=>{
              const sm=STATUS_META[p.status]||STATUS_META.Draft;
              return (
                <div key={p.id} onClick={()=>setEdit(p)}
                  style={{padding:"9px 13px",borderBottom:"1px solid #F9FAFB",display:"flex",alignItems:"center",gap:7,cursor:"pointer",transition:"background 0.1s",minWidth:0}}
                  className="row-hover">
                  <span className={sm.dot} style={{width:6,height:6,borderRadius:"50%",flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12,fontWeight:500,color:"#111827",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.title}</p>
                    <p style={{fontSize:10,color:"#9CA3AF",marginTop:1}}>{PLATFORM_META[p.platform]?.emoji} {relDate(p.date)}</p>
                  </div>
                  <Pencil style={{width:10,height:10,color:"#D1D5DB",flexShrink:0}}/>
                </div>
              );
            })}
            {upcoming.length===0 && <EmptyMsg icon="📭" text="Queue is empty"/>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cal post row (expandable, in Selected Day panel) ─────────────────────────
function CalPostRow({ post }) {
  const { setEdit, updateStatus } = useApp();
  const [open, setOpen] = useState(false);
  const sm  = STATUS_META[post.status]||STATUS_META.Draft;
  const pm  = PLATFORM_META[post.platform]||PLATFORM_META.Instagram;
  const url = normUrl(post.video_link);

  return (
    <div style={{borderBottom:"1px solid #F9FAFB",minWidth:0}}>
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 5px",borderRadius:7,transition:"background 0.1s",cursor:"pointer",minWidth:0}} className="row-hover">
        <span className={sm.dot} style={{width:5,height:5,borderRadius:"50%",flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}} onClick={()=>setEdit(post)}>
          <p style={{fontSize:11,fontWeight:600,color:"#111827",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{post.title}</p>
          <p style={{fontSize:9,color:"#9CA3AF",marginTop:1}}>{pm.emoji} {post.platform}</p>
        </div>
        <button onClick={()=>setEdit(post)} className="btn-ghost" style={{padding:3,flexShrink:0}}><Pencil style={{width:10,height:10}}/></button>
        <button onClick={()=>setOpen(o=>!o)} className="btn-ghost" style={{padding:3,flexShrink:0}}>
          <ChevronDown style={{width:10,height:10,transform:open?"rotate(180deg)":"none",transition:"transform 0.15s"}}/>
        </button>
      </div>
      {open && (
        <div className="fade-in" style={{padding:"5px 8px 8px",background:"#F9FAFB",borderRadius:7,marginBottom:3,minWidth:0}}>
          {post.notes    && <MiniField label="Notes"    value={post.notes}/>}
          {url           && <div style={{marginBottom:6}}><p style={{fontSize:9,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Video</p><a href={url} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#6366F1",display:"flex",alignItems:"center",gap:3}}><ExternalLink style={{width:9,height:9}}/>Open</a></div>}
          {post.caption  && <MiniField label="Caption"  value={post.caption}/>}
          {post.feedback && <MiniField label="Feedback" value={post.feedback}/>}
          <div style={{marginTop:6,display:"flex",flexWrap:"wrap",gap:3}}>
            {STATUSES.map(s=>(
              <button key={s} onClick={()=>updateStatus(post.id,s)}
                style={{padding:"2px 8px",borderRadius:5,border:"1px solid",borderColor:post.status===s?"#6366F1":"#E5E7EB",background:post.status===s?"#6366F1":"#fff",color:post.status===s?"#fff":"#6B7280",fontSize:10,fontWeight:600,cursor:"pointer",transition:"all 0.1s"}}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────
function BoardView() {
  const { byStatus, setEdit } = useApp();
  return (
    <div>
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:20,fontWeight:700,color:"#111827",letterSpacing:"-0.3px"}}>Board</h2>
        <p style={{fontSize:13,color:"#6B7280",marginTop:2}}>Manage posts across stages</p>
      </div>
      <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:12}}>
        {STATUSES.map(status=>{
          const posts=byStatus[status]||[];
          const sm=STATUS_META[status];
          return (
            <div key={status} className="k-col">
              <div style={{padding:"10px 12px 8px",borderBottom:"1px solid #E5E7EB",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                <span className={sm.dot} style={{width:7,height:7,borderRadius:"50%"}}/>
                <span style={{fontSize:12,fontWeight:600,color:"#374151"}}>{status}</span>
                <span style={{background:"#F3F4F6",color:"#9CA3AF",fontSize:10,fontWeight:600,padding:"1px 6px",borderRadius:10}}>{posts.length}</span>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"6px 0 8px",minHeight:200}}>
                {posts.map(p=>{
                  const pm=PLATFORM_META[p.platform]||PLATFORM_META.Instagram;
                  const pr=PRIORITY_COLOR[p.priority]||PRIORITY_COLOR.Medium;
                  return (
                    <div key={p.id} className="k-card" onClick={()=>setEdit(p)}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:6,marginBottom:6}}>
                        <p style={{fontSize:12,fontWeight:600,color:"#111827",lineHeight:1.4,flex:1,minWidth:0}}>{p.title}</p>
                        <span style={{fontSize:14,flexShrink:0}}>{pm.emoji}</span>
                      </div>
                      {p.notes && <p style={{fontSize:11,color:"#6B7280",lineHeight:1.5,marginBottom:6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.notes}</p>}
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          <span style={{width:5,height:5,borderRadius:"50%",background:pr}}/>
                          <span style={{fontSize:10,color:"#9CA3AF"}}>{p.priority||"Medium"}</span>
                        </div>
                        {p.date && <span style={{fontSize:10,color:"#9CA3AF"}}>{relDate(p.date)}</span>}
                      </div>
                    </div>
                  );
                })}
                {posts.length===0 && <div style={{padding:"16px 12px",textAlign:"center",color:"#D1D5DB",fontSize:11}}>No posts</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────
function ListView() {
  const { filtered, setEdit, updateStatus, deletePost } = useApp();
  const [expanded, setExpanded] = useState(null);
  return (
    <div>
      <div style={{marginBottom:16,display:"flex",alignItems:"baseline",gap:10}}>
        <h2 style={{fontSize:20,fontWeight:700,color:"#111827",letterSpacing:"-0.3px"}}>All Posts</h2>
        <span style={{fontSize:12,color:"#9CA3AF"}}>{filtered.length} items</span>
      </div>
      <div className="card" style={{overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 100px 90px 80px 44px",gap:6,padding:"8px 16px",borderBottom:"1px solid #F3F4F6"}}>
          {["Title","Platform","Status","Date",""].map(h=>(
            <p key={h} style={{fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em"}}>{h}</p>
          ))}
        </div>
        {filtered.length>0 ? filtered.map(p=>{
          const pm=PLATFORM_META[p.platform]||PLATFORM_META.Instagram;
          const sm=STATUS_META[p.status]||STATUS_META.Draft;
          const isExp=expanded===p.id;
          return (
            <div key={p.id} style={{borderBottom:"1px solid #F9FAFB"}}>
              <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 100px 90px 80px 44px",gap:6,padding:"10px 16px",alignItems:"center",cursor:"pointer",transition:"background 0.1s"}}
                className="row-hover" onClick={()=>setExpanded(isExp?null:p.id)}>
                <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
                  <span className={sm.dot} style={{width:5,height:5,borderRadius:"50%",flexShrink:0}}/>
                  <p style={{fontSize:13,fontWeight:500,color:"#111827",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",minWidth:0}}>{p.title}</p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{fontSize:13}}>{pm.emoji}</span>
                  <span style={{fontSize:11,color:"#6B7280"}}>{p.platform}</span>
                </div>
                <StatusTag status={p.status} small/>
                <span style={{fontSize:11,color:"#9CA3AF"}}>{relDate(p.date)}</span>
                <div style={{display:"flex",gap:1}}>
                  <button className="btn-ghost" style={{padding:4}} onClick={e=>{e.stopPropagation();setEdit(p);}}><Pencil style={{width:11,height:11}}/></button>
                  <button className="btn-ghost" style={{padding:4}} onClick={e=>{e.stopPropagation();deletePost(p.id);}}><Trash2 style={{width:11,height:11,color:"#EF4444"}}/></button>
                </div>
              </div>
              {isExp && (
                <div className="fade-in" style={{padding:"10px 16px 12px",background:"#F9FAFB",borderTop:"1px solid #F3F4F6"}}>
                  <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:14,marginBottom:10}}>
                    {p.notes    && <MiniField label="Notes"    value={p.notes}/>}
                    {p.caption  && <MiniField label="Caption"  value={p.caption}/>}
                    {p.feedback && <MiniField label="Feedback" value={p.feedback}/>}
                    {p.video_link && <div><p style={{fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>Video</p><a href={normUrl(p.video_link)} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#6366F1",display:"flex",alignItems:"center",gap:3}}><ExternalLink style={{width:10,height:10}}/>Open link</a></div>}
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {STATUSES.map(s=>(
                      <button key={s} onClick={()=>updateStatus(p.id,s)}
                        style={{padding:"3px 10px",borderRadius:6,border:"1px solid",borderColor:p.status===s?"#6366F1":"#E5E7EB",background:p.status===s?"#6366F1":"#fff",color:p.status===s?"#fff":"#6B7280",fontSize:11,fontWeight:500,cursor:"pointer",transition:"all 0.12s"}}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }) : <EmptyMsg icon="📋" text="No posts found. Try adjusting your filters."/>}
      </div>
    </div>
  );
}

// ─── Inbox ────────────────────────────────────────────────────────────────────
function InboxView() {
  const { db, addIdea, convertIdea } = useApp();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  async function capture() {
    if (!text.trim()||saving) return;
    setSaving(true); await addIdea(text); setText(""); setSaving(false);
  }
  return (
    <div style={{maxWidth:720}}>
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:20,fontWeight:700,color:"#111827",letterSpacing:"-0.3px"}}>Idea Inbox</h2>
        <p style={{fontSize:13,color:"#6B7280",marginTop:2}}>{db.ideas.length} ideas · Capture now, schedule later</p>
      </div>
      <div className="card" style={{padding:18,marginBottom:12}}>
        <p style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:8}}>Capture an idea</p>
        <textarea value={text} onChange={e=>setText(e.target.value)}
          placeholder="What's the hook? What angle? Drop it here before it disappears…"
          rows={3} className="field" style={{resize:"none",lineHeight:1.6,marginBottom:10}}
          onKeyDown={e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter")capture();}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <p style={{fontSize:11,color:"#9CA3AF"}}>⌘↵ to capture</p>
          <button onClick={capture} disabled={!text.trim()||saving} className="btn-primary" style={{opacity:!text.trim()?0.5:1}}>
            {saving?<Loader2 style={{width:12,height:12}} className="spin"/>:<Lightbulb style={{width:12,height:12}}/>}
            {saving?"Capturing…":"Capture idea"}
          </button>
        </div>
      </div>
      <div className="card" style={{overflow:"hidden"}}>
        <div style={{padding:"10px 16px",borderBottom:"1px solid #F3F4F6"}}>
          <p style={{fontSize:13,fontWeight:600,color:"#374151"}}>Saved ideas</p>
        </div>
        {db.ideas.length>0 ? db.ideas.map((idea,i)=>(
          <div key={idea.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",borderBottom:"1px solid #F9FAFB",transition:"background 0.1s",minWidth:0}} className="row-hover">
            <span style={{fontSize:11,fontWeight:700,color:"#D1D5DB",minWidth:18,flexShrink:0}}>{i+1}.</span>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:13,fontWeight:500,color:"#111827"}}>{idea.title}</p>
              {idea.notes && <p style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>{idea.notes}</p>}
            </div>
            <button onClick={()=>convertIdea(idea)}
              style={{flexShrink:0,display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:6,border:"1px solid #C7D2FE",background:"#EEF2FF",color:"#6366F1",fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.12s",whiteSpace:"nowrap"}}
              onMouseEnter={e=>e.currentTarget.style.background="#E0E7FF"}
              onMouseLeave={e=>e.currentTarget.style.background="#EEF2FF"}>
              Make post <ArrowRight style={{width:10,height:10}}/>
            </button>
          </div>
        )) : <EmptyMsg icon="💡" text="No ideas yet. Type above to capture your first."/>}
      </div>
    </div>
  );
}

// ─── Vault ────────────────────────────────────────────────────────────────────
function VaultView() {
  const { db, addVault, deleteVault } = useApp();
  const [text, setText]       = useState("");
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving]   = useState(false);
  async function save() {
    if (!text.trim()||saving) return;
    setSaving(true); await addVault(text); setText(""); setSaving(false);
  }
  return (
    <div style={{maxWidth:860}}>
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:20,fontWeight:700,color:"#111827",letterSpacing:"-0.3px"}}>Content Vault</h2>
        <p style={{fontSize:13,color:"#6B7280",marginTop:2}}>{db.vault.length} items · Hooks, CTAs, hashtags, frameworks</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"300px minmax(0,1fr)",gap:12,alignItems:"start"}}>
        <div className="card" style={{padding:18}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{width:26,height:26,borderRadius:7,background:"#ECFDF5",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Archive style={{width:12,height:12,color:"#10B981"}}/>
            </div>
            <p style={{fontSize:12,fontWeight:600,color:"#374151"}}>Save to vault</p>
          </div>
          <textarea value={text} onChange={e=>setText(e.target.value)}
            placeholder="Hook, CTA, hashtag group, caption framework…"
            rows={5} className="field" style={{resize:"none",lineHeight:1.6,marginBottom:10}}/>
          <button onClick={save} disabled={!text.trim()||saving} className="btn-primary"
            style={{width:"100%",justifyContent:"center",opacity:!text.trim()?0.5:1,background:"#10B981"}}
            onMouseEnter={e=>{if(text.trim())e.currentTarget.style.background="#059669";}}
            onMouseLeave={e=>e.currentTarget.style.background="#10B981"}>
            {saving?<Loader2 style={{width:12,height:12}} className="spin"/>:<Upload style={{width:12,height:12}}/>}
            {saving?"Saving…":"Save to vault"}
          </button>
        </div>
        {db.vault.length>0 ? (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10}}>
            {db.vault.map(item=>(
              <div key={item.id} className="card card-hover" style={{padding:14,position:"relative",minWidth:0}}>
                <div style={{width:22,height:22,borderRadius:6,background:"#ECFDF5",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>
                  <Layers style={{width:11,height:11,color:"#10B981"}}/>
                </div>
                <p style={{fontSize:11,fontWeight:600,color:"#374151",marginBottom:4}}>{item.title||"Saved Content"}</p>
                <p style={{fontSize:11,color:"#6B7280",lineHeight:1.6,wordBreak:"break-word"}}>{item.content}</p>
                {confirm===item.id ? (
                  <div style={{marginTop:10,display:"flex",alignItems:"center",gap:5}}>
                    <p style={{fontSize:10,color:"#EF4444",flex:1}}>Delete?</p>
                    <button onClick={()=>{deleteVault(item.id);setConfirm(null);}} style={{padding:"2px 8px",borderRadius:4,background:"#EF4444",color:"#fff",border:"none",fontSize:10,fontWeight:700,cursor:"pointer"}}>Yes</button>
                    <button onClick={()=>setConfirm(null)} style={{padding:"2px 8px",borderRadius:4,border:"1px solid #E5E7EB",background:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",color:"#6B7280"}}>No</button>
                  </div>
                ) : (
                  <button onClick={()=>setConfirm(item.id)} className="btn-ghost"
                    style={{position:"absolute",top:8,right:8,padding:4,color:"#D1D5DB"}}
                    onMouseEnter={e=>{e.currentTarget.style.color="#EF4444";e.currentTarget.style.background="#FEF2F2";}}
                    onMouseLeave={e=>{e.currentTarget.style.color="#D1D5DB";e.currentTarget.style.background="transparent";}}>
                    <Trash2 style={{width:11,height:11}}/>
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{padding:48,textAlign:"center",border:"1px dashed #E5E7EB",background:"#FAFAFA"}}>
            <EmptyMsg icon="🗄️" text="Vault is empty. Save hooks, CTAs, and frameworks here."/>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Activity ─────────────────────────────────────────────────────────────────
function ActivityView() {
  const { db } = useApp();
  const dotCls = {success:"dot-approved",warning:"dot-scheduled",info:"dot-posted",error:"dot-draft"};
  const tagCls = {success:"tag-approved",warning:"tag-scheduled",info:"tag-posted",error:"tag-draft"};
  return (
    <div style={{maxWidth:600}}>
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:20,fontWeight:700,color:"#111827",letterSpacing:"-0.3px"}}>Activity</h2>
        <p style={{fontSize:13,color:"#6B7280",marginTop:2}}>{db.notifications.length} events logged</p>
      </div>
      <div className="card" style={{overflow:"hidden"}}>
        {db.notifications.length>0 ? db.notifications.map((n,i)=>(
          <div key={n.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 16px",borderBottom:i<db.notifications.length-1?"1px solid #F9FAFB":"none",transition:"background 0.1s",minWidth:0}} className="row-hover">
            <div style={{width:24,height:24,borderRadius:"50%",background:"#F9FAFB",border:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
              <span className={dotCls[n.type]||"dot-draft"} style={{width:6,height:6,borderRadius:"50%"}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:13,color:"#374151",lineHeight:1.5}}>{n.message}</p>
              {n.created_at && <p style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>{new Date(n.created_at).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</p>}
            </div>
            <span className={`tag ${tagCls[n.type]||"tag-draft"}`} style={{fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>{n.type}</span>
          </div>
        )) : <EmptyMsg icon="🔔" text="No activity yet."/>}
      </div>
    </div>
  );
}

// ─── Quick Add bar ────────────────────────────────────────────────────────────
function QuickAddBar() {
  const { addPost, setQA } = useApp();
  const [title, setTitle]       = useState("");
  const [date, setDate]         = useState(fmt(new Date()));
  const [platform, setPlatform] = useState("Instagram");
  const [saving, setSaving]     = useState(false);
  const ref = useRef(null);
  useEffect(()=>{ ref.current?.focus(); },[]);
  async function submit() {
    if (!title.trim()||saving) return;
    setSaving(true);
    await addPost({ title:title.trim(), date, platform, status:"Draft", caption:"", notes:"", video_link:"", feedback:"" });
    setSaving(false); setQA(false);
  }
  const inp = { background:"#fff", border:"1px solid #E5E7EB", borderRadius:7, padding:"6px 10px", fontSize:13, color:"#111827", fontFamily:"'Inter',sans-serif", outline:"none" };
  return (
    <div className="fade-in" style={{background:"#F9FAFB",borderBottom:"1px solid #E5E7EB",padding:"10px 16px",display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",minWidth:0}}>
      <input ref={ref} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Post title *"
        style={{...inp,flex:2,minWidth:160}}
        onKeyDown={e=>{if(e.key==="Enter")submit();if(e.key==="Escape")setQA(false);}}
        onFocus={e=>e.target.style.borderColor="#6366F1"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
      <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{...inp,minWidth:130,flexShrink:0}}/>
      <select value={platform} onChange={e=>setPlatform(e.target.value)} style={{...inp,minWidth:120,flexShrink:0}}>
        {PLATFORMS.map(p=><option key={p} value={p}>{PLATFORM_META[p]?.emoji} {p}</option>)}
      </select>
      <button onClick={submit} disabled={!title.trim()||saving} className="btn-primary" style={{opacity:!title.trim()?0.5:1}}>
        {saving?<Loader2 style={{width:12,height:12}} className="spin"/>:<Plus style={{width:12,height:12}}/>}
        {saving?"Adding…":"Add"}
      </button>
      <button onClick={()=>setQA(false)} className="btn-ghost" style={{padding:5}}><X style={{width:13,height:13}}/></button>
    </div>
  );
}

// ─── Edit panel (autosave) ────────────────────────────────────────────────────
function EditPanel() {
  const { editPost:post, setEdit, updatePost, deletePost, updateStatus } = useApp();
  const [form, setForm] = useState({
    title:      post.title      || "",
    date:       post.date       || fmt(new Date()),
    platform:   post.platform   || "Instagram",
    status:     post.status     || "Draft",
    notes:      post.notes      || "",
    video_link: post.video_link || "",
    caption:    post.caption    || "",
    feedback:   post.feedback   || "",
  });
  const [saveState, setSaveState] = useState("idle");
  const timer   = useRef(null);
  const isFirst = useRef(true);

  useEffect(()=>{
    if (isFirst.current) { isFirst.current=false; return; }
    setSaveState("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(async()=>{
      setSaveState("saving");
      await updatePost(post.id, form);
      setSaveState("saved");
      setTimeout(()=>setSaveState("idle"), 2500);
    }, 1500);
    return ()=>clearTimeout(timer.current);
  }, [form]);

  const sf = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const handleStatus = async s => { setForm(f=>({...f,status:s})); await updateStatus(post.id,s); };

  useEffect(()=>{
    const fn=e=>{ if(e.key==="Escape") setEdit(null); };
    window.addEventListener("keydown",fn); return()=>window.removeEventListener("keydown",fn);
  },[setEdit]);

  const inp = { width:"100%", background:"#fff", border:"1.5px solid #E5E7EB", borderRadius:8, padding:"8px 11px", fontSize:13, color:"#111827", fontFamily:"'Inter',sans-serif", outline:"none", transition:"border-color .15s, box-shadow .15s" };
  const foc = { onFocus:e=>{e.target.style.borderColor="#6366F1";e.target.style.boxShadow="0 0 0 3px rgba(99,102,241,.1)";}, onBlur:e=>{e.target.style.borderColor="#E5E7EB";e.target.style.boxShadow="none";} };

  return (
    <>
      <div className="overlay fade-in" onClick={()=>setEdit(null)}/>
      <div className="slide-in" style={{position:"fixed",right:0,top:0,zIndex:50,height:"100%",width:"100%",maxWidth:480,display:"flex",flexDirection:"column",background:"#fff",boxShadow:"-4px 0 32px rgba(0,0,0,.1)",borderLeft:"1px solid #E5E7EB"}}>

        {/* Header */}
        <div style={{padding:"12px 16px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:"#FAFAFA"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:26,height:26,borderRadius:6,background:"#EEF2FF",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <FileText style={{width:12,height:12,color:"#6366F1"}}/>
            </div>
            <span style={{fontSize:13,fontWeight:600,color:"#111827"}}>Edit Post</span>
            <div style={{marginLeft:2,display:"flex",alignItems:"center",gap:4}}>
              {saveState==="dirty"  && <span style={{fontSize:10,color:"#9CA3AF",display:"flex",alignItems:"center",gap:3}}><span className="pulse-dot" style={{width:4,height:4,borderRadius:"50%",background:"#F59E0B",display:"inline-block"}}/>Editing</span>}
              {saveState==="saving" && <span style={{fontSize:10,color:"#9CA3AF",display:"flex",alignItems:"center",gap:3}}><Loader2 style={{width:9,height:9}} className="spin"/>Saving</span>}
              {saveState==="saved"  && <span style={{fontSize:10,color:"#10B981",display:"flex",alignItems:"center",gap:3}}><Check style={{width:9,height:9}}/>Saved</span>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:3}}>
            <button onClick={()=>deletePost(post.id)} className="btn-ghost" style={{color:"#EF4444",fontSize:11,padding:"3px 7px"}}>
              <Trash2 style={{width:11,height:11}}/>Delete
            </button>
            <button onClick={()=>setEdit(null)} className="btn-ghost" style={{padding:5}}><X style={{width:13,height:13}}/></button>
          </div>
        </div>

        {/* Autosave hint */}
        <div style={{padding:"4px 16px",background:"#F5F3FF",borderBottom:"1px solid #EDE9FE",flexShrink:0,display:"flex",alignItems:"center",gap:5}}>
          <Zap style={{width:9,height:9,color:"#8B5CF6"}}/>
          <p style={{fontSize:10,color:"#7C3AED",fontWeight:500}}>Auto-saves 1.5s after you stop typing · Esc to close</p>
        </div>

        {/* Form */}
        <div style={{flex:1,overflowY:"auto",padding:"18px 16px"}}>
          <input value={form.title} onChange={sf("title")} placeholder="Post title"
            style={{...inp,fontSize:18,fontWeight:700,marginBottom:18,letterSpacing:"-0.2px"}} {...foc}/>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <FieldRow label="Date"><input type="date" value={form.date} onChange={sf("date")} style={inp} {...foc}/></FieldRow>
            <FieldRow label="Platform">
              <select value={form.platform} onChange={sf("platform")} style={inp} {...foc}>
                {PLATFORMS.map(p=><option key={p} value={p}>{PLATFORM_META[p]?.emoji} {p}</option>)}
              </select>
            </FieldRow>
          </div>

          <FieldRow label="Status" style={{marginBottom:14}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:4}}>
              {STATUSES.map(s=>{
                const sm=STATUS_META[s], active=form.status===s;
                return (
                  <button key={s} onClick={()=>handleStatus(s)}
                    style={{display:"flex",alignItems:"center",gap:4,padding:"4px 12px",borderRadius:20,border:"1.5px solid",borderColor:active?"#6366F1":"#E5E7EB",background:active?"#EEF2FF":"#fff",color:active?"#6366F1":"#6B7280",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.12s",boxShadow:active?"0 0 0 3px rgba(99,102,241,.1)":"none"}}>
                    <span className={sm.dot} style={{width:5,height:5,borderRadius:"50%"}}/>{s}
                  </button>
                );
              })}
            </div>
          </FieldRow>

          <div style={{height:1,background:"#F3F4F6",margin:"2px 0 16px"}}/>

          <FieldRow label="Notes" style={{marginBottom:12}}>
            <textarea value={form.notes} onChange={sf("notes")} placeholder="Production notes, direction, context…" rows={3} style={{...inp,resize:"none",lineHeight:1.6}} {...foc}/>
          </FieldRow>
          <FieldRow label="Video Link" style={{marginBottom:12}}>
            <input value={form.video_link} onChange={sf("video_link")} placeholder="https://drive.google.com/…" style={inp} {...foc}/>
          </FieldRow>
          <FieldRow label="Caption for Approval" style={{marginBottom:12}}>
            <textarea value={form.caption} onChange={sf("caption")} placeholder="Full caption copy for client review…" rows={5} style={{...inp,resize:"none",lineHeight:1.6}} {...foc}/>
          </FieldRow>
          <FieldRow label="Feedback / Revisions" style={{marginBottom:12}}>
            <textarea value={form.feedback} onChange={sf("feedback")} placeholder="Client feedback or revision notes…" rows={3} style={{...inp,resize:"none",lineHeight:1.6}} {...foc}/>
          </FieldRow>
        </div>

        <div style={{padding:"10px 16px",borderTop:"1px solid #F3F4F6",flexShrink:0,display:"flex",justifyContent:"flex-end"}}>
          <button onClick={()=>setEdit(null)} className="btn-primary" style={{fontSize:12,padding:"6px 16px"}}>Done</button>
        </div>
      </div>
    </>
  );
}

// ─── Command palette ──────────────────────────────────────────────────────────
function CommandPalette() {
  const { db, setCmdOpen, setView, setEdit, setQA } = useApp();
  const [q, setQ]     = useState("");
  const [sel, setSel] = useState(0);
  const ref = useRef(null);
  useEffect(()=>{ ref.current?.focus(); },[]);

  const results = useMemo(()=>{
    const lq = q.toLowerCase();
    const cmds = [
      {type:"nav",label:"Home",          icon:Home,      action:()=>{setView("home");    setCmdOpen(false);}},
      {type:"nav",label:"Calendar",      icon:Calendar,  action:()=>{setView("calendar");setCmdOpen(false);}},
      {type:"nav",label:"Board",         icon:Columns,   action:()=>{setView("board");   setCmdOpen(false);}},
      {type:"nav",label:"All Posts",     icon:List,      action:()=>{setView("list");    setCmdOpen(false);}},
      {type:"nav",label:"Idea Inbox",    icon:Lightbulb, action:()=>{setView("inbox");   setCmdOpen(false);}},
      {type:"nav",label:"Content Vault", icon:Archive,   action:()=>{setView("vault");   setCmdOpen(false);}},
      {type:"nav",label:"New post",      icon:Plus,      action:()=>{setQA(true);        setCmdOpen(false);}},
    ];
    const hits = lq ? db.posts.filter(p=>(p.title||"").toLowerCase().includes(lq)).slice(0,5).map(p=>({type:"post",label:p.title,sub:`${p.platform} · ${relDate(p.date)}`,icon:FileText,action:()=>{setEdit(p);setCmdOpen(false);}})) : [];
    return [...(lq?cmds.filter(c=>c.label.toLowerCase().includes(lq)):cmds), ...hits];
  },[q, db.posts]);

  useEffect(()=>setSel(0),[results.length]);

  function handleKey(e) {
    if (e.key==="ArrowDown") { e.preventDefault(); setSel(s=>Math.min(s+1,results.length-1)); }
    if (e.key==="ArrowUp")   { e.preventDefault(); setSel(s=>Math.max(s-1,0)); }
    if (e.key==="Enter")     { e.preventDefault(); results[sel]?.action?.(); }
    if (e.key==="Escape")    { setCmdOpen(false); }
  }

  return (
    <div className="cmd-wrap fade-in" onClick={()=>setCmdOpen(false)}>
      <div className="scale-in card" style={{width:"100%",maxWidth:500,overflow:"hidden",boxShadow:"0 16px 48px rgba(0,0,0,.14)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:9,padding:"11px 14px",borderBottom:"1px solid #F3F4F6"}}>
          <Search style={{width:14,height:14,color:"#9CA3AF",flexShrink:0}}/>
          <input ref={ref} value={q} onChange={e=>setQ(e.target.value)} onKeyDown={handleKey}
            placeholder="Search or navigate…"
            style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:14,color:"#111827",fontFamily:"'Inter',sans-serif"}}/>
          <kbd style={{fontSize:10,background:"#F3F4F6",border:"1px solid #E5E7EB",borderRadius:4,padding:"1px 5px",color:"#9CA3AF",flexShrink:0}}>Esc</kbd>
        </div>
        <div style={{maxHeight:320,overflowY:"auto",padding:"4px 0"}}>
          {results.length>0 ? results.map((r,i)=>(
            <button key={i} onClick={r.action}
              style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"7px 14px",border:"none",cursor:"pointer",textAlign:"left",background:sel===i?"#EEF2FF":"transparent",transition:"background 0.1s",fontFamily:"'Inter',sans-serif"}}
              onMouseEnter={()=>setSel(i)}>
              <r.icon style={{width:13,height:13,color:sel===i?"#6366F1":"#9CA3AF",flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:13,color:sel===i?"#4F46E5":"#374151",fontWeight:sel===i?600:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.label}</p>
                {r.sub && <p style={{fontSize:10,color:"#9CA3AF",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.sub}</p>}
              </div>
              <span style={{fontSize:9,color:"#D1D5DB",textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>{r.type}</span>
            </button>
          )) : <div style={{padding:20,textAlign:"center",color:"#9CA3AF",fontSize:13}}>No results</div>}
        </div>
        <div style={{padding:"7px 14px",borderTop:"1px solid #F3F4F6",display:"flex",gap:12}}>
          {[["↑↓","Navigate"],["↵","Open"],["Esc","Close"]].map(([k,l])=>(
            <div key={k} style={{display:"flex",alignItems:"center",gap:4}}>
              <kbd style={{fontSize:10,background:"#F3F4F6",border:"1px solid #E5E7EB",borderRadius:3,padding:"1px 4px",color:"#9CA3AF"}}>{k}</kbd>
              <span style={{fontSize:10,color:"#9CA3AF"}}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────
function StatusTag({ status, small }) {
  const sm = STATUS_META[status]||STATUS_META.Draft;
  return (
    <span className={`tag ${sm.tagCls}`} style={{fontSize:small?10:11}}>
      <span className={sm.dot} style={{width:small?4:5,height:small?4:5,borderRadius:"50%"}}/>{status}
    </span>
  );
}
function MiniField({ label, value }) {
  return (
    <div style={{marginBottom:7}}>
      <p style={{fontSize:9,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>{label}</p>
      <p style={{fontSize:11,color:"#4B5563",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{value}</p>
    </div>
  );
}
function FieldRow({ label, children, style:s }) {
  return (
    <div style={{marginBottom:12,...s}}>
      <p style={{fontSize:10,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{label}</p>
      {children}
    </div>
  );
}
function EmptyMsg({ icon, text }) {
  return (
    <div style={{padding:"24px 16px",textAlign:"center"}}>
      <div style={{fontSize:24,marginBottom:6}}>{icon}</div>
      <p style={{fontSize:12,color:"#9CA3AF",lineHeight:1.5,maxWidth:240,margin:"0 auto"}}>{text}</p>
    </div>
  );
}
function LoadingState() {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:12}}>
      <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,boxShadow:"0 4px 14px rgba(99,102,241,.3)"}}>🌿</div>
      <div style={{display:"flex",alignItems:"center",gap:7,color:"#9CA3AF"}}>
        <Loader2 style={{width:14,height:14}} className="spin"/>
        <span style={{fontSize:13,fontWeight:500}}>Loading your workspace…</span>
      </div>
    </div>
  );
}
function ErrBanner() {
  const { err, setErr } = useApp();
  return (
    <div className="fade-in" style={{background:"#FEF2F2",borderBottom:"1px solid #FECACA",padding:"8px 16px",display:"flex",alignItems:"center",gap:9,flexShrink:0,minWidth:0}}>
      <AlertCircle style={{width:13,height:13,color:"#EF4444",flexShrink:0}}/>
      <p style={{flex:1,fontSize:12,color:"#DC2626",minWidth:0}}>{err}</p>
      <button onClick={()=>setErr("")} className="btn-ghost" style={{padding:3,color:"#EF4444",flexShrink:0}}><X style={{width:11,height:11}}/></button>
    </div>
  );
}
