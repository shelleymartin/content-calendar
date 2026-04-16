// DEEPER HEALING - CONTENT CALENDAR
// Clean rebuild - drag and drop with optimistic updates

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
  Columns, Target, Home, GripVertical,
  Link, Copy, Play, Image, Film, BookOpen,
  Globe, Wifi, WifiOff, Send, Clock, CheckCircle,
  AlertTriangle, Settings, RefreshCw, Share2,
} from "lucide-react";
import { supabase, supabaseConfigError } from "./lib/supabase";

if (!document.getElementById("dh-fonts")) {
  const _f = document.createElement("link");
  _f.id = "dh-fonts"; _f.rel = "stylesheet";
  _f.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap";
  document.head.appendChild(_f);
}

if (!document.getElementById("dh-css")) {
const _s = document.createElement("style");
_s.id = "dh-css";
_s.textContent = [
  "*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }",
  "html, body, #root { height: 100%; overflow: hidden; }",
  "body { font-family: 'Inter', -apple-system, sans-serif; background: #F8F9FA; color: #111827; -webkit-font-smoothing: antialiased; }",
  "::-webkit-scrollbar { width: 4px; height: 4px; }",
  "::-webkit-scrollbar-track { background: transparent; }",
  "::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }",
  "@keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }",
  "@keyframes slideIn { from{transform:translateX(100%)} to{transform:none} }",
  "@keyframes scaleIn { from{transform:scale(.97);opacity:0} to{transform:none;opacity:1} }",
  "@keyframes spin { to{transform:rotate(360deg)} }",
  "@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }",
  "@keyframes dropPulse { 0%,100%{opacity:.5} 50%{opacity:1} }",
  ".fade-in { animation: fadeIn 0.18s ease both; }",
  ".slide-in { animation: slideIn 0.26s cubic-bezier(.32,.72,0,1) both; }",
  ".scale-in { animation: scaleIn 0.16s ease both; }",
  ".spin { animation: spin 0.8s linear infinite; }",
  ".pulse-dot { animation: pulse 1.8s ease infinite; }",
  ".truncate { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }",
  ".btn-primary { display:inline-flex; align-items:center; gap:6px; flex-shrink:0; padding:7px 15px; border-radius:8px; background:#111827; color:#fff; font-size:13px; font-weight:600; font-family:Inter,sans-serif; border:none; cursor:pointer; transition:background .15s,box-shadow .15s,transform .1s; white-space:nowrap; }",
  ".btn-primary:hover { background:#1F2937; box-shadow:0 4px 12px rgba(17,24,39,.18); }",
  ".btn-primary:active { transform:scale(.98); }",
  ".btn-secondary { display:inline-flex; align-items:center; gap:5px; flex-shrink:0; padding:6px 12px; border-radius:7px; background:#fff; color:#374151; font-size:12px; font-weight:500; font-family:Inter,sans-serif; border:1px solid #E5E7EB; cursor:pointer; transition:background .12s,border-color .12s; white-space:nowrap; }",
  ".btn-secondary:hover { background:#F9FAFB; border-color:#D1D5DB; }",
  ".btn-secondary:active { transform:scale(.98); }",
  ".btn-ghost { display:inline-flex; align-items:center; gap:4px; flex-shrink:0; padding:4px 7px; border-radius:6px; background:transparent; color:#6B7280; font-size:12px; font-weight:500; font-family:Inter,sans-serif; border:none; cursor:pointer; transition:background .1s,color .1s; }",
  ".btn-ghost:hover { background:#F3F4F6; color:#111827; }",
  ".card { background:#fff; border:1px solid #E5E7EB; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,.04); }",
  ".card-hover { transition:border-color .15s,box-shadow .15s,transform .15s; cursor:pointer; }",
  ".card-hover:hover { border-color:#C7D2FE; box-shadow:0 4px 16px rgba(99,102,241,.1); transform:translateY(-1px); }",
  ".row-hover { transition:background .1s; cursor:pointer; }",
  ".row-hover:hover { background:#F9FAFB; }",
  ".nav-item { display:flex; align-items:center; gap:9px; padding:7px 10px; border-radius:8px; background:transparent; color:#6B7280; font-size:13px; font-weight:500; font-family:Inter,sans-serif; border:none; cursor:pointer; width:100%; text-align:left; transition:background .12s,color .12s; }",
  ".nav-item:hover { background:#F3F4F6; color:#111827; }",
  ".nav-item.active { background:#EEF2FF; color:#4F46E5; font-weight:600; }",
  ".field { width:100%; background:#fff; border:1.5px solid #E5E7EB; border-radius:8px; padding:9px 12px; font-size:13px; color:#111827; font-family:Inter,sans-serif; outline:none; transition:border-color .15s,box-shadow .15s; }",
  ".field:focus { border-color:#6366F1; box-shadow:0 0 0 3px rgba(99,102,241,.1); }",
  ".field::placeholder { color:#9CA3AF; }",
  ".tag { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:600; border:1px solid transparent; white-space:nowrap; flex-shrink:0; }",
  ".tag-draft { background:#F3F4F6; color:#6B7280; border-color:#E5E7EB; }",
  ".tag-approved { background:#ECFDF5; color:#065F46; border-color:#A7F3D0; }",
  ".tag-scheduled { background:#FFFBEB; color:#92400E; border-color:#FCD34D; }",
  ".tag-posted { background:#EEF2FF; color:#3730A3; border-color:#C7D2FE; }",
  ".tag-review { background:#FFF7ED; color:#92400E; border-color:#FED7AA; }",
  ".dot-draft { background:#9CA3AF; flex-shrink:0; }",
  ".dot-review { background:#F97316; flex-shrink:0; }",
  ".dot-approved { background:#10B981; flex-shrink:0; }",
  ".dot-scheduled { background:#F59E0B; flex-shrink:0; }",
  ".dot-posted { background:#6366F1; flex-shrink:0; }",
  ".checklist-item { display:flex; align-items:center; gap:9px; padding:7px 0; border-bottom:1px solid #F9FAFB; cursor:pointer; transition:background .1s; }",
  ".checklist-item:last-child { border-bottom:none; }",
  ".checklist-item:hover { background:#F9FAFB; }",
  ".checklist-check { width:16px; height:16px; border-radius:4px; border:1.5px solid #D1D5DB; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .15s; }",
  ".checklist-check.done { background:#6366F1; border-color:#6366F1; }",
  ".checklist-label { font-size:12px; color:#374151; flex:1; line-height:1.4; }",
  ".checklist-label.done { text-decoration:line-through; color:#9CA3AF; }",
  ".status-flow { display:flex; align-items:center; gap:0; margin-top:4px; }",
  ".status-step { display:flex; align-items:center; gap:4px; padding:5px 10px; border-radius:0; font-size:11px; font-weight:600; cursor:pointer; border:1px solid #E5E7EB; background:#fff; color:#6B7280; transition:all .12s; position:relative; }",
  ".status-step:first-child { border-radius:8px 0 0 8px; }",
  ".status-step:last-child { border-radius:0 8px 8px 0; }",
  ".status-step.active { background:#EEF2FF; color:#4F46E5; border-color:#6366F1; z-index:1; }",
  ".status-step.done { background:#F0FDF4; color:#16A34A; border-color:#86EFAC; }",
  ".progress-bar { height:4px; background:#F3F4F6; border-radius:99px; overflow:hidden; margin-top:8px; }",
  ".progress-fill { height:100%; background:linear-gradient(90deg,#6366F1,#8B5CF6); border-radius:99px; transition:width .5s ease; }",
  ".overlay { position:fixed; inset:0; z-index:40; background:rgba(0,0,0,.16); backdrop-filter:blur(3px); }",
  ".cmd-wrap { position:fixed; inset:0; z-index:200; display:flex; align-items:flex-start; justify-content:center; padding-top:12vh; background:rgba(0,0,0,.22); backdrop-filter:blur(4px); }",
  ".cal-grid { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); width:100%; min-width:0; overflow:hidden; }",
  ".cal-dow { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); width:100%; min-width:0; border-bottom:1px solid #F3F4F6; background:#FAFAFA; flex-shrink:0; }",
  ".cal-cell { height:108px; display:flex; flex-direction:column; min-width:0; overflow:hidden; border-right:1px solid #F3F4F6; border-bottom:1px solid #F3F4F6; cursor:pointer; transition:background .1s; background:#fff; }",
  ".cal-cell:hover { background:#FAFAFA; }",
  ".cal-cell.selected { background:#EEF2FF; }",
  ".cal-cell.today { background:#FFFBEB; }",
  ".cal-cell.blank { background:#FAFAFA; cursor:default; pointer-events:none; }",
  ".cal-head { flex-shrink:0; height:26px; display:flex; align-items:center; justify-content:space-between; padding:0 6px; gap:4px; min-width:0; }",
  ".cal-day-num { font-size:11px; font-weight:700; color:#6B7280; width:20px; height:20px; display:flex; align-items:center; justify-content:center; border-radius:5px; flex-shrink:0; }",
  ".cal-day-num.is-today { background:#FDE68A; color:#92400E; }",
  ".cal-day-num.is-selected { background:#C7D2FE; color:#4338CA; }",
  ".cal-day-num.is-both { background:#6366F1; color:#fff; }",
  ".cal-count { font-size:9px; font-weight:600; color:#C4B5FD; margin-left:auto; flex-shrink:0; }",
  ".cal-body { flex:1; min-width:0; overflow:hidden; display:flex; flex-direction:column; gap:2px; padding:0 4px 4px; }",
  ".cal-chip { display:flex; align-items:center; gap:4px; padding:2px 5px; border-radius:4px; background:#fff; border:1px solid #E5E7EB; cursor:pointer; transition:border-color .12s,background .12s; min-width:0; overflow:hidden; width:100%; flex-shrink:0; }",
  ".cal-chip:hover { border-color:#A5B4FC; background:#EEF2FF; }",
  ".cal-chip-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }",
  ".cal-chip-title { font-size:10px; font-weight:500; color:#374151; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; flex:1; }",
  ".cal-overflow { font-size:9px; font-weight:600; color:#9CA3AF; padding:1px 5px; flex-shrink:0; }",
  ".k-board { display:flex; gap:12px; height:100%; overflow-x:auto; overflow-y:hidden; padding-bottom:8px; }",
  ".k-col { flex-shrink:0; width:272px; background:#F9FAFB; border:1px solid #E5E7EB; border-radius:12px; display:flex; flex-direction:column; transition:border-color .15s,background .15s; }",
  ".k-col.drag-over { border-color:#6366F1; background:#EEF2FF; box-shadow:0 0 0 2px rgba(99,102,241,.15); }",
  ".k-col-header { padding:12px 14px 10px; border-bottom:1px solid #E5E7EB; display:flex; align-items:center; gap:7px; flex-shrink:0; border-radius:12px 12px 0 0; }",
  ".k-col-body { flex:1; overflow-y:auto; padding:8px 8px 10px; min-height:80px; }",
  ".k-card { background:#fff; border:1px solid #E5E7EB; border-radius:10px; padding:13px; margin-bottom:8px; cursor:grab; transition:border-color .15s,box-shadow .15s,transform .15s,opacity .15s; user-select:none; }",
  ".k-card:hover { border-color:#C7D2FE; box-shadow:0 4px 14px rgba(99,102,241,.1); transform:translateY(-1px); }",
  ".k-card.dragging { opacity:.35; cursor:grabbing; transform:scale(.97); box-shadow:none; }",
  ".k-grip { color:#D1D5DB; flex-shrink:0; cursor:grab; transition:color .1s; }",
  ".k-card:hover .k-grip { color:#9CA3AF; }",
  ".k-drop-ph { height:56px; border:2px dashed #C7D2FE; border-radius:10px; background:#EEF2FF; margin-bottom:8px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; color:#A5B4FC; animation:dropPulse 1s ease infinite; }",
  ".media-card { background:#F9FAFB; border:1.5px solid #E5E7EB; border-radius:10px; overflow:hidden; transition:border-color .15s,box-shadow .15s; }",
  ".media-card:hover { border-color:#C7D2FE; box-shadow:0 2px 10px rgba(99,102,241,.08); }",
  ".media-card-preview { width:100%; display:flex; align-items:center; justify-content:center; background:#F9FAFB; position:relative; overflow:hidden; border-radius:10px 10px 0 0; }",
  ".media-card-body { padding:10px 12px; }",
  ".media-card-actions { display:flex; gap:6px; padding:8px 12px; border-top:1px solid #F3F4F6; background:#FAFAFA; }",
  ".media-btn { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer; border:1px solid #E5E7EB; background:#fff; color:#374151; transition:all .12s; font-family:Inter,sans-serif; white-space:nowrap; }",
  ".media-btn:hover { background:#F3F4F6; border-color:#D1D5DB; }",
  ".media-btn.primary { background:#EEF2FF; color:#4F46E5; border-color:#C7D2FE; }",
  ".media-btn.primary:hover { background:#E0E7FF; }",
  ".media-btn.danger { background:#FEF2F2; color:#DC2626; border-color:#FECACA; }",
  ".media-btn.danger:hover { background:#FEE2E2; }",
  ".media-empty { border:1.5px dashed #E5E7EB; border-radius:10px; padding:20px; text-align:center; cursor:pointer; transition:all .15s; }",
  ".media-empty:hover { border-color:#A5B4FC; background:#F5F7FF; }",
  ".media-input-wrap { position:relative; margin-top:10px; }",
  ".copy-confirm { position:absolute; top:-28px; right:0; background:#111827; color:#fff; font-size:10px; padding:3px 8px; border-radius:5px; pointer-events:none; white-space:nowrap; }",
  /* Social / publishing */
  ".platform-badge { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:20px; font-size:11px; font-weight:600; border:1px solid transparent; }",
  ".account-card { background:#fff; border:1px solid #E5E7EB; border-radius:12px; padding:16px; display:flex; align-items:center; gap:14px; transition:border-color .15s,box-shadow .15s; }",
  ".account-card:hover { border-color:#D1D5DB; box-shadow:0 2px 8px rgba(0,0,0,.05); }",
  ".account-icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }",
  ".connect-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 14px; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid; transition:all .15s; font-family:Inter,sans-serif; white-space:nowrap; }",
  ".connect-btn.connected { background:#ECFDF5; color:#065F46; border-color:#A7F3D0; }",
  ".connect-btn.disconnected { background:#F9FAFB; color:#374151; border-color:#E5E7EB; }",
  ".connect-btn.disconnected:hover { background:#F3F4F6; border-color:#D1D5DB; }",
  ".publish-row { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid #F9FAFB; }",
  ".publish-row:last-child { border-bottom:none; }",
  ".publish-toggle { width:36px; height:20px; border-radius:10px; border:none; cursor:pointer; transition:background .2s; position:relative; flex-shrink:0; }",
  ".publish-toggle-thumb { position:absolute; top:2px; width:16px; height:16px; border-radius:50%; background:#fff; transition:left .2s; box-shadow:0 1px 3px rgba(0,0,0,.2); }",
  ".status-pill { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:20px; font-size:10px; font-weight:600; white-space:nowrap; }",
].join("\n");
document.head.appendChild(_s);
}

const STATUSES = ["Draft","In Review","Approved","Scheduled","Posted"];
const PLATFORMS = ["Instagram","TikTok","YouTube","LinkedIn","Facebook"];

const STATUS_META = {
  Draft:      { tagCls:"tag-draft",      dot:"dot-draft",      label:"Draft"      },
  "In Review":{ tagCls:"tag-review",     dot:"dot-review",     label:"In Review"  },
  Approved:   { tagCls:"tag-approved",   dot:"dot-approved",   label:"Approved"   },
  Scheduled:  { tagCls:"tag-scheduled",  dot:"dot-scheduled",  label:"Scheduled"  },
  Posted:     { tagCls:"tag-posted",     dot:"dot-posted",     label:"Posted"     },
};

// Workflow order for status progression
const STATUS_ORDER = ["Draft","In Review","Approved","Scheduled","Posted"];

// Content checklist defaults — shown in the detail drawer
const DEFAULT_CHECKLIST = [
  { id:"caption",   label:"Caption written",   done:false },
  { id:"creative",  label:"Creative ready",    done:false },
  { id:"reviewed",  label:"Reviewed",          done:false },
  { id:"approved",  label:"Client approved",   done:false },
  { id:"hashtags",  label:"Hashtags added",    done:false },
  { id:"links",     label:"Links checked",     done:false },
  { id:"scheduled", label:"Scheduled in app",  done:false },
  { id:"qa",        label:"Final QA done",     done:false },
];

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

// Social platform configuration
// Each platform has different capabilities, limits, and requirements.
// This drives both the UI and (later) the publishing logic.
const SOCIAL_PLATFORMS = {
  instagram: {
    id: "instagram",
    label: "Instagram",
    emoji: "📷",
    color: "#E1306C",
    bg: "#FDF2F8",
    border: "#FBCFE8",
    textColor: "#9D174D",
    // Platform constraints
    captionLimit: 2200,
    hashtagLimit: 30,
    mediaRequired: true,
    supportsVideo: true,
    supportsCarousel: true,
    // Auth requirements
    requiresPage: true,   // needs a Facebook Page linked to Instagram Business
    authNote: "Requires Instagram Business or Creator account connected to a Facebook Page",
    // Publishing capability
    canPublish: true,     // backend Edge Function is live
    publishNote: "Instagram publishing requires Meta Graph API setup",
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    emoji: "📘",
    color: "#1877F2",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    textColor: "#1E40AF",
    captionLimit: 63206,
    mediaRequired: false,
    supportsVideo: true,
    requiresPage: true,
    authNote: "Connect your Facebook Page (not personal profile)",
    canPublish: false,
    publishNote: "Facebook publishing requires Meta Graph API setup",
  },
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    emoji: "💼",
    color: "#0A66C2",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    textColor: "#1E3A8A",
    captionLimit: 3000,
    mediaRequired: false,
    supportsVideo: true,
    requiresPage: false,
    authNote: "Connect your personal profile or company page",
    canPublish: false,
    publishNote: "LinkedIn publishing requires LinkedIn API setup",
  },
  youtube: {
    id: "youtube",
    label: "YouTube",
    emoji: "▶",
    color: "#FF0000",
    bg: "#FEF2F2",
    border: "#FECACA",
    textColor: "#991B1B",
    captionLimit: 5000,   // description
    mediaRequired: true,   // video required
    supportsVideo: true,
    requiresPage: false,
    authNote: "Connect your YouTube channel via Google account",
    canPublish: false,
    publishNote: "YouTube publishing requires YouTube Data API v3 setup",
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    emoji: "🎵",
    color: "#010101",
    bg: "#F9FAFB",
    border: "#E5E7EB",
    textColor: "#374151",
    captionLimit: 2200,
    mediaRequired: true,
    supportsVideo: true,
    requiresPage: false,
    authNote: "Connect your TikTok creator account",
    canPublish: false,
    publishNote: "TikTok publishing requires TikTok for Developers API setup",
  },
};

const PUBLISH_STATUS_META = {
  draft:       { label:"Draft",       color:"#9CA3AF", bg:"#F3F4F6", icon:FileText    },
  queued:      { label:"Queued",      color:"#6366F1", bg:"#EEF2FF", icon:Clock       },
  scheduled:   { label:"Scheduled",   color:"#F59E0B", bg:"#FFFBEB", icon:Clock       },
  publishing:  { label:"Publishing",  color:"#8B5CF6", bg:"#F5F3FF", icon:Loader2     },
  published:   { label:"Published",   color:"#10B981", bg:"#ECFDF5", icon:CheckCircle },
  failed:      { label:"Failed",      color:"#EF4444", bg:"#FEF2F2", icon:AlertTriangle},
  cancelled:   { label:"Cancelled",   color:"#9CA3AF", bg:"#F3F4F6", icon:X          },
};

const NAV_ITEMS = [
  { id:"home",     label:"Home",          icon:Home      },
  { id:"calendar", label:"Calendar",      icon:Calendar  },
  { id:"board",    label:"Board",         icon:Columns   },
  { id:"list",     label:"All Posts",     icon:List      },
  { id:"inbox",    label:"Idea Inbox",    icon:Lightbulb },
  { id:"vault",    label:"Content Vault", icon:Archive   },
  { id:"publish",  label:"Publishing",    icon:Share2    },
  { id:"activity", label:"Activity",      icon:Activity  },
];

const fmt = d =>
  [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
const stripTime = d => new Date(d.getFullYear(),d.getMonth(),d.getDate());
const normUrl = v => {
  if (!v?.trim()) return "";
  const s = v.trim().startsWith("http") ? v.trim() : "https://"+v.trim();
  try { const u=new URL(s); return ["http:","https:"].includes(u.protocol)?u.toString():""; }
  catch { return ""; }
};
const buildGrid = (date,posts) => {
  const y=date.getFullYear(),m=date.getMonth();
  const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  const cells=Array(first).fill(null);
  for(let d=1;d<=days;d++){const k=fmt(new Date(y,m,d));cells.push({day:d,date:k,posts:posts.filter(p=>p.date===k)});}
  return cells;
};
const relDate = s => {
  if(!s)return"";
  const diff=Math.round((new Date(s+"T00:00:00")-stripTime(new Date()))/864e5);
  if(diff===0)return"Today";if(diff===1)return"Tomorrow";if(diff===-1)return"Yesterday";
  if(diff>0&&diff<8)return"In "+diff+"d";if(diff<0&&diff>-8)return Math.abs(diff)+"d ago";
  return new Date(s+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});
};
const seedDB=()=>({ideas:[],posts:[],vault:[],notifications:[],connected_accounts:[],publishing_records:[]});

const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

export default function App() {
  const [db,setDB]             = useState(seedDB());
  const [view,setView]         = useState("home");
  const [search,setSearch]     = useState("");
  const [selDate,setSelDate]   = useState(new Date());
  const [loading,setLoading]   = useState(true);
  const [err,setErr]           = useState("");
  const [editPost,setEdit]     = useState(null);
  const [sidebar,setSidebar]   = useState(true);
  const [cmdOpen,setCmdOpen]   = useState(false);
  const [quickAdd,setQA]       = useState(false);
  const [filterStatus,setFS]   = useState("all");
  const [filterPlatform,setFP] = useState("all");
  const [sortBy,setSort]       = useState("date");

  useEffect(()=>{
    const fn=e=>{
      if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();setCmdOpen(o=>!o);}
      if((e.metaKey||e.ctrlKey)&&e.key==="n"){e.preventDefault();setQA(true);}
      if(e.key==="Escape"){setCmdOpen(false);setQA(false);}
    };
    window.addEventListener("keydown",fn);
    return()=>window.removeEventListener("keydown",fn);
  },[]);

  const fetchAll=useCallback(async(loader=false)=>{
    if(!supabase)return;
    if(loader)setLoading(true);
    setErr("");
    try{
      const[p,i,v,n,ca,pr]=await Promise.all([
        supabase.from("posts").select("*").order("date",{ascending:true}),
        supabase.from("ideas").select("*").order("created_at",{ascending:false}),
        supabase.from("vault").select("*").order("created_at",{ascending:false}),
        supabase.from("notifications").select("*").order("created_at",{ascending:false}),
        supabase.from("connected_accounts").select("*").order("connected_at",{ascending:false}),
        supabase.from("publishing_records").select("*").order("created_at",{ascending:false}),
      ]);
      if(p.error)throw p.error;if(i.error)throw i.error;
      if(v.error)throw v.error;if(n.error)throw n.error;
      // connected_accounts and publishing_records are optional — tables may not exist yet
      setDB({
        posts:p.data??[],ideas:i.data??[],vault:v.data??[],notifications:n.data??[],
        connected_accounts: ca.error ? [] : (ca.data??[]),
        publishing_records: pr.error ? [] : (pr.data??[]),
      });
    }catch(e){setErr(e.message||"Could not load data.");}
    finally{if(loader)setLoading(false);}
  },[]);

  useEffect(()=>{
    if(!supabase){setLoading(false);return;}
    let t;
    // 3 second debounce so realtime never races with optimistic updates
    const deb=()=>{clearTimeout(t);t=setTimeout(()=>fetchAll(false),3000);};
    fetchAll(true);
    const ch=supabase.channel("dh-v6")
      .on("postgres_changes",{event:"*",schema:"public",table:"posts"},deb)
      .on("postgres_changes",{event:"*",schema:"public",table:"ideas"},deb)
      .on("postgres_changes",{event:"*",schema:"public",table:"vault"},deb)
      .on("postgres_changes",{event:"*",schema:"public",table:"notifications"},deb)
      .on("postgres_changes",{event:"*",schema:"public",table:"connected_accounts"},deb)
      .on("postgres_changes",{event:"*",schema:"public",table:"publishing_records"},deb)
      .subscribe();
    return()=>{clearTimeout(t);supabase.removeChannel(ch);};
  },[fetchAll]);

  const filtered=useMemo(()=>{
    const q=search.toLowerCase();
    return db.posts
      .filter(p=>{
        const mQ=!q||["title","platform","status","caption","notes","feedback"].some(k=>(p[k]||"").toLowerCase().includes(q));
        const mS=filterStatus==="all"||p.status===filterStatus;
        const mP=filterPlatform==="all"||p.platform===filterPlatform;
        return mQ&&mS&&mP;
      })
      .sort((a,b)=>{
        if(sortBy==="date")return new Date(a.date)-new Date(b.date);
        if(sortBy==="title")return(a.title||"").localeCompare(b.title||"");
        if(sortBy==="status")return STATUSES.indexOf(a.status)-STATUSES.indexOf(b.status);
        return 0;
      });
  },[db.posts,search,filterStatus,filterPlatform,sortBy]);

  // Use db.posts so upcoming count is not affected by active filters
  const upcoming=useMemo(()=>{const t=fmt(new Date());return db.posts.filter(p=>p.date>=t&&p.status!=="Posted");},[db.posts]);
  const grid=useMemo(()=>buildGrid(selDate,db.posts),[selDate,db.posts]);
  // Use db.posts (not filtered) so dropped cards always appear in target column
  const byStatus=useMemo(()=>Object.fromEntries(STATUSES.map(s=>[s,db.posts.filter(p=>p.status===s).sort((a,b)=>new Date(a.date)-new Date(b.date))])),[db.posts]);
  const completion=useMemo(()=>db.posts.length?Math.round(db.posts.filter(p=>p.status==="Posted").length/db.posts.length*100):0,[db.posts]);

  async function notif(msg,type,rel){
    if(!supabase)return;
    await supabase.from("notifications").insert([{message:msg,type:type||"info",read:false,related_post_id:rel||null,updated_at:new Date().toISOString()}]);
  }
  async function addPost(post){
    if(!supabase)return;
    const payload={title:post.title,date:post.date,platform:post.platform,status:post.status||"Draft",caption:post.caption||"",notes:post.notes||"",video_link:normUrl(post.video_link||""),feedback:post.feedback||"",checklist:post.checklist??[],updated_at:new Date().toISOString()};
    const{data,error}=await supabase.from("posts").insert([payload]).select();
    if(error){setErr(error.message);return;}
    if(data?.[0])await notif('"'+data[0].title+'" added.',"success",data[0].id);
    await fetchAll(false);
  }
  async function updatePost(id,fields){
    if(!supabase)return false;
    const payload={title:fields.title,date:fields.date,platform:fields.platform,status:fields.status,notes:fields.notes||"",video_link:normUrl(fields.video_link||""),caption:fields.caption||"",feedback:fields.feedback||"",checklist:fields.checklist??[],updated_at:new Date().toISOString()};
    const{data,error}=await supabase.from("posts").update(payload).eq("id",id).select();
    if(error){setErr(error.message);return false;}
    if(data?.[0])await notif('"'+data[0].title+'" updated.',"info",data[0].id);
    // Sync editPost so the panel shows fresh data after autosave
    if(data?.[0]) setEdit(prev=>prev?.id===id ? {...prev,...data[0]} : prev);
    await fetchAll(false);return true;
  }
  async function deletePost(id){
    if(!supabase)return;
    const post=db.posts.find(p=>String(p.id)===String(id));
    const{error}=await supabase.from("posts").delete().eq("id",id);
    if(error){setErr(error.message);return;}
    if(post)await notif('"'+post.title+'" deleted.',"warning",id);
    setEdit(prev=>prev?.id===id?null:prev);
    await fetchAll(false);
  }

  // KEY FIX: optimistic-first, no notif call (notif triggers realtime which races)
  async function updateStatus(id,status){
    if(!supabase)return;
    // Step 1: update local state immediately — UI reflects change instantly
    setDB(prev=>({...prev,posts:prev.posts.map(p=>p.id===id?{...p,status}:p)}));
    setEdit(prev=>prev?.id===id?{...prev,status}:prev);
    // Step 2: write to Supabase
    const{error}=await supabase.from("posts")
      .update({status,updated_at:new Date().toISOString()})
      .eq("id",id);
    // Step 3: only refetch on error
    if(error){setErr(error.message);await fetchAll(false);}
    // No fetchAll on success — realtime will sync after 3s debounce
    // The 3s window is much longer than the Supabase write (~100ms)
    // so the optimistic state is already stable when realtime fires
  }

  async function disconnectAccount(accountId){
    if(!supabase)return;
    const{error}=await supabase.from("connected_accounts")
      .update({is_connected:false,updated_at:new Date().toISOString()})
      .eq("id",accountId);
    if(error){setErr(error.message);return;}
    await fetchAll(false);
  }

  async function addIdea(text){
    if(!supabase||!text.trim())return;
    const{error}=await supabase.from("ideas").insert([{title:text.trim(),platform:"Instagram",notes:"",status:"Idea",updated_at:new Date().toISOString()}]);
    if(error){setErr(error.message);return;}
    await fetchAll(false);
  }
  async function convertIdea(idea){
    if(!supabase)return;
    const{data,error}=await supabase.from("posts").insert([{title:idea.title||"Untitled",date:fmt(new Date()),platform:idea.platform||"Instagram",status:"Draft",caption:idea.notes||"",notes:"",video_link:"",feedback:"",checklist:DEFAULT_CHECKLIST.map(i=>({...i})),updated_at:new Date().toISOString()}]).select();
    if(error){setErr(error.message);return;}
    await supabase.from("ideas").delete().eq("id",idea.id);
    await notif('Post from idea: "'+idea.title+'"',"success",data?.[0]?.id||null);
    await fetchAll(false);
  }
  async function addVault(text){
    if(!supabase||!text.trim())return;
    const{error}=await supabase.from("vault").insert([{title:"Saved Content",platform:"General",content:text.trim(),media_url:"",tags:"",updated_at:new Date().toISOString()}]);
    if(error){setErr(error.message);return;}
    await fetchAll(false);
  }
  async function deleteVault(id){
    if(!supabase)return;
    await supabase.from("vault").delete().eq("id",id);
    await fetchAll(false);
  }

  if(supabaseConfigError){
    return(
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

  const ctx={
    db,filtered,upcoming,grid,byStatus,completion,
    selDate,setSelDate,view,setView,search,setSearch,
    editPost,setEdit,sidebar,setSidebar,cmdOpen,setCmdOpen,
    quickAdd,setQA,filterStatus,setFS,filterPlatform,setFP,sortBy,setSort,
    addPost,updatePost,deletePost,updateStatus,
    addIdea,convertIdea,addVault,deleteVault,disconnectAccount,
    loading,err,setErr,
  };

  return(
    <Ctx.Provider value={ctx}>
      <div style={{display:"flex",height:"100vh",width:"100vw",overflow:"hidden",background:"#F8F9FA"}}>
        <Sidebar/>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          <TopBar/>
          {quickAdd&&<QuickAddBar/>}
          {err&&<ErrBanner/>}
          <main style={{flex:1,overflowY:"auto",overflowX:"hidden",minWidth:0}}>
            {loading?<LoadingState/>:<ViewRouter/>}
          </main>
        </div>
        {editPost&&<EditPanel/>}
        {cmdOpen&&<CommandPalette/>}
      </div>
    </Ctx.Provider>
  );
}

function Sidebar(){
  const{view,setView,sidebar,setSidebar,db,upcoming}=useApp();
  return(
    <aside style={{width:sidebar?210:48,flexShrink:0,background:"#fff",borderRight:"1px solid #E5E7EB",display:"flex",flexDirection:"column",transition:"width 0.2s cubic-bezier(.32,.72,0,1)",overflow:"hidden",zIndex:20}}>
      <div style={{padding:"12px 8px 8px",borderBottom:"1px solid #F3F4F6",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 6px",borderRadius:8}}>
          <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14,boxShadow:"0 2px 8px rgba(99,102,241,.25)"}}>🌿</div>
          {sidebar&&(
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
      <div style={{padding:"6px",flex:1,overflowY:"auto"}}>
        {sidebar&&<p style={{fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.1em",padding:"4px 8px 4px"}}>Navigation</p>}
        {NAV_ITEMS.map(item=>{
          const badge=item.id==="inbox"?db.ideas.length:0;
          return(
            <button key={item.id} onClick={()=>setView(item.id)}
              className={"nav-item"+(view===item.id?" active":"")}
              title={item.label}
              style={{marginBottom:1,justifyContent:sidebar?"flex-start":"center",padding:sidebar?"6px 10px":"7px"}}>
              <item.icon style={{width:15,height:15,flexShrink:0,color:view===item.id?"#6366F1":"#9CA3AF"}}/>
              {sidebar&&<span style={{flex:1,minWidth:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.label}</span>}
              {sidebar&&badge>0&&<span style={{background:"#EEF2FF",color:"#6366F1",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:10,flexShrink:0}}>{badge}</span>}
            </button>
          );
        })}
        {sidebar&&(
          <>
            <div style={{height:1,background:"#F3F4F6",margin:"8px 2px"}}/>
            <p style={{fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.1em",padding:"0 8px 4px"}}>Overview</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,padding:"0 2px"}}>
              {[
                {label:"Upcoming",value:upcoming.length,color:"#6366F1",bg:"#EEF2FF"},
                {label:"Posted",value:db.posts.filter(p=>p.status==="Posted").length,color:"#10B981",bg:"#ECFDF5"},
                {label:"Ideas",value:db.ideas.length,color:"#F59E0B",bg:"#FFFBEB"},
                {label:"Vault",value:db.vault.length,color:"#8B5CF6",bg:"#F5F3FF"},
              ].map(s=>(
                <div key={s.label} style={{background:s.bg,borderRadius:7,padding:"7px 8px",border:"1px solid "+s.color+"20"}}>
                  <p style={{fontSize:17,fontWeight:700,color:s.color,lineHeight:1}}>{s.value}</p>
                  <p style={{fontSize:9,color:"#9CA3AF",marginTop:2,textTransform:"uppercase",letterSpacing:"0.08em"}}>{s.label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {sidebar&&(
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

function TopBar(){
  const{view,setCmdOpen,setQA,filterStatus,setFS,filterPlatform,setFP,sortBy,setSort}=useApp();
  const label=NAV_ITEMS.find(n=>n.id===view)?.label||"Home";
  const showFilters=["calendar","board","list"].includes(view);
  return(
    <div style={{height:48,borderBottom:"1px solid #E5E7EB",background:"#fff",display:"flex",alignItems:"center",padding:"0 16px",gap:8,flexShrink:0,minWidth:0,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:5,flex:"0 0 auto"}}>
        <span style={{fontSize:11,color:"#9CA3AF",whiteSpace:"nowrap"}}>Deeper Healing</span>
        <ChevronRight style={{width:11,height:11,color:"#D1D5DB",flexShrink:0}}/>
        <span style={{fontSize:13,fontWeight:600,color:"#111827",whiteSpace:"nowrap"}}>{label}</span>
      </div>
      <div style={{flex:1}}/>
      {showFilters&&(
        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          {[
            {val:filterStatus,set:setFS,opts:["all",...STATUSES],lbl:"Status"},
            {val:filterPlatform,set:setFP,opts:["all",...PLATFORMS],lbl:"Platform"},
            {val:sortBy,set:setSort,opts:["date","title","status"],lbl:"Sort"},
          ].map((f,i)=>(
            <select key={i} value={f.val} onChange={e=>f.set(e.target.value)}
              style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:6,padding:"4px 7px",fontSize:11,color:"#374151",cursor:"pointer",outline:"none",fontFamily:"Inter,sans-serif",flexShrink:0}}>
              {f.opts.map(o=><option key={o} value={o}>{o==="all"?"All "+f.lbl:o}</option>)}
            </select>
          ))}
        </div>
      )}
      <button onClick={()=>setCmdOpen(true)}
        style={{display:"flex",alignItems:"center",gap:7,background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:7,padding:"4px 10px",cursor:"pointer",color:"#9CA3AF",fontSize:12,width:150,fontFamily:"Inter,sans-serif",flexShrink:0}}
        onMouseEnter={e=>e.currentTarget.style.borderColor="#D1D5DB"}
        onMouseLeave={e=>e.currentTarget.style.borderColor="#E5E7EB"}>
        <Search style={{width:11,height:11,flexShrink:0}}/>
        <span style={{flex:1,textAlign:"left"}}>Search...</span>
        <kbd style={{fontSize:10,background:"#F3F4F6",border:"1px solid #E5E7EB",borderRadius:4,padding:"1px 4px",color:"#9CA3AF",flexShrink:0}}>K</kbd>
      </button>
      <button onClick={()=>setQA(q=>!q)} className="btn-primary" style={{fontSize:12,padding:"6px 12px"}}>
        <Plus style={{width:12,height:12}}/>New post
      </button>
    </div>
  );
}

function ViewRouter(){
  const{view}=useApp();
  return(
    <div className="fade-in" style={{padding:"16px",width:"100%",minWidth:0,boxSizing:"border-box"}}>
      {view==="home"     &&<HomeView/>}
      {view==="calendar" &&<CalendarView/>}
      {view==="board"    &&<BoardView/>}
      {view==="publish"   &&<PublishingView/>}
      {view==="list"     &&<ListView/>}
      {view==="inbox"    &&<InboxView/>}
      {view==="vault"    &&<VaultView/>}
      {view==="activity" &&<ActivityView/>}
    </div>
  );
}

function HomeView(){
  const{db,upcoming,completion,setView,setEdit}=useApp();
  const recent=[...db.posts].sort((a,b)=>new Date(b.updated_at||b.date)-new Date(a.updated_at||a.date)).slice(0,5);
  return(
    <div style={{maxWidth:900,margin:"0 auto"}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:24,fontWeight:700,color:"#111827",marginBottom:4,letterSpacing:"-0.3px"}}>Deeper Healing Content Calendar</h1>
        <p style={{fontSize:13,color:"#6B7280"}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:10,marginBottom:14}}>
        {[
          {label:"Total posts",value:db.posts.length,accent:"#6366F1",bg:"#EEF2FF",icon:FileText},
          {label:"Upcoming",value:upcoming.length,accent:"#8B5CF6",bg:"#F5F3FF",icon:Calendar},
          {label:"Posted",value:db.posts.filter(p=>p.status==="Posted").length,accent:"#10B981",bg:"#ECFDF5",icon:CheckCircle2},
          {label:"Completion",value:completion+"%",accent:"#F59E0B",bg:"#FFFBEB",icon:Target},
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
      <div className="card" style={{padding:"16px 18px",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <p style={{fontSize:13,fontWeight:600,color:"#374151"}}>Content pipeline</p>
          <p style={{fontSize:12,color:"#9CA3AF"}}>{completion}% complete</p>
        </div>
        <div style={{height:5,background:"#F3F4F6",borderRadius:99,overflow:"hidden",marginBottom:12}}>
          <div style={{height:"100%",width:completion+"%",background:"linear-gradient(90deg,#6366F1,#8B5CF6)",borderRadius:99,transition:"width 0.8s ease"}}/>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {STATUSES.map(s=>{
            const count=db.posts.filter(p=>p.status===s).length;
            const sm=STATUS_META[s];
            return(
              <button key={s} onClick={()=>setView("list")} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
                <span className={"tag "+sm.tagCls}><span className={sm.dot} style={{width:5,height:5,borderRadius:"50%"}}/>{s} {count}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:12}}>
        <div className="card" style={{overflow:"hidden",minWidth:0}}>
          <div style={{padding:"12px 16px 10px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <p style={{fontSize:13,fontWeight:600,color:"#374151"}}>Recent posts</p>
            <button onClick={()=>setView("list")} className="btn-ghost">View all</button>
          </div>
          {recent.length>0?recent.map(p=>(
            <div key={p.id} onClick={()=>setEdit(p)} style={{padding:"10px 16px",borderBottom:"1px solid #F9FAFB",display:"flex",alignItems:"center",gap:8,cursor:"pointer",transition:"background 0.1s",minWidth:0}} className="row-hover">
              <span style={{fontSize:15,flexShrink:0}}>{PLATFORM_META[p.platform]?.emoji||"📄"}</span>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:13,fontWeight:500,color:"#111827",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.title}</p>
                <p style={{fontSize:11,color:"#9CA3AF",marginTop:1}}>{relDate(p.date)}</p>
              </div>
              <StatusTag status={p.status} small/>
            </div>
          )):<EmptyMsg icon="📋" text="No posts yet"/>}
        </div>
        <div className="card" style={{overflow:"hidden",minWidth:0}}>
          <div style={{padding:"12px 16px 10px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <p style={{fontSize:13,fontWeight:600,color:"#374151"}}>Coming up</p>
            <button onClick={()=>setView("calendar")} className="btn-ghost">Calendar</button>
          </div>
          {upcoming.length>0?upcoming.slice(0,5).map(p=>{
            const sm=STATUS_META[p.status]||STATUS_META.Draft;
            return(
              <div key={p.id} onClick={()=>setEdit(p)} style={{padding:"10px 16px",borderBottom:"1px solid #F9FAFB",display:"flex",alignItems:"center",gap:8,cursor:"pointer",transition:"background 0.1s",minWidth:0}} className="row-hover">
                <span className={sm.dot} style={{width:7,height:7,borderRadius:"50%",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:500,color:"#111827",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.title}</p>
                  <p style={{fontSize:11,color:"#9CA3AF",marginTop:1}}>{relDate(p.date)} · {p.platform}</p>
                </div>
                <Pencil style={{width:11,height:11,color:"#D1D5DB",flexShrink:0}}/>
              </div>
            );
          }):<EmptyMsg icon="📅" text="Nothing upcoming"/>}
        </div>
      </div>
    </div>
  );
}

function CalendarView(){
  const{db,upcoming,selDate,setSelDate,grid,setEdit,updateStatus}=useApp();
  const todayKey=fmt(new Date()),selKey=fmt(selDate);
  const dayPosts=db.posts.filter(p=>p.date===selKey).sort((a,b)=>(a.title||"").localeCompare(b.title||""));
  return(
    <div style={{width:"100%",minWidth:0,overflow:"hidden",display:"grid",gridTemplateColumns:"minmax(0,1fr) 240px",gap:12,alignItems:"start"}}>
      <div className="card" style={{width:"100%",minWidth:0,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"12px 16px 10px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <h2 style={{fontSize:16,fontWeight:700,color:"#111827"}}>{selDate.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</h2>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <button className="btn-secondary" style={{padding:"4px 7px"}} onClick={()=>setSelDate(new Date(selDate.getFullYear(),selDate.getMonth()-1,1))}><ChevronLeft style={{width:13,height:13}}/></button>
            <button className="btn-secondary" style={{padding:"4px 10px",fontSize:11}} onClick={()=>setSelDate(new Date())}>Today</button>
            <button className="btn-secondary" style={{padding:"4px 7px"}} onClick={()=>setSelDate(new Date(selDate.getFullYear(),selDate.getMonth()+1,1))}><ChevronRight style={{width:13,height:13}}/></button>
          </div>
        </div>
        <div className="cal-dow">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
            <div key={d} style={{padding:"7px 0",textAlign:"center",fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em",minWidth:0,overflow:"hidden"}}>{d}</div>
          ))}
        </div>
        <div className="cal-grid">
          {grid.map((cell,i)=>{
            if(!cell)return<div key={"b-"+i} className="cal-cell blank"/>;
            const isToday=cell.date===todayKey,isSel=cell.date===selKey,isBoth=isToday&&isSel;
            const visible=cell.posts.slice(0,2),overflow=cell.posts.length-visible.length;
            let cellCls="cal-cell";
            if(isSel&&!isToday)cellCls+=" selected";
            if(isToday&&!isSel)cellCls+=" today";
            let numCls="cal-day-num";
            if(isBoth)numCls+=" is-both";
            else if(isSel)numCls+=" is-selected";
            else if(isToday)numCls+=" is-today";
            return(
              <div key={cell.date} className={cellCls} onClick={()=>setSelDate(new Date(cell.date+"T00:00:00"))}>
                <div className="cal-head">
                  <span className={numCls}>{cell.day}</span>
                  {cell.posts.length>0&&<span className="cal-count">{cell.posts.length}</span>}
                </div>
                <div className="cal-body">
                  {visible.map(p=>{
                    const sm=STATUS_META[p.status]||STATUS_META.Draft;
                    return(
                      <div key={p.id} className="cal-chip" onClick={e=>{e.stopPropagation();setEdit(p);}}>
                        <span className={"cal-chip-dot "+sm.dot}/>
                        <span className="cal-chip-title">{p.title}</span>
                      </div>
                    );
                  })}
                  {overflow>0&&<span className="cal-overflow">+{overflow} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10,minWidth:0}}>
        <div className="card" style={{overflow:"hidden",minWidth:0}}>
          <div style={{padding:"11px 13px 9px",borderBottom:"1px solid #F3F4F6"}}>
            <p style={{fontSize:9,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600,marginBottom:2}}>Selected</p>
            <p style={{fontSize:13,fontWeight:700,color:"#111827"}}>{selDate.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}</p>
          </div>
          <div style={{padding:"5px 6px",maxHeight:220,overflowY:"auto"}}>
            {dayPosts.length>0?dayPosts.map(p=><CalPostRow key={p.id} post={p}/>):<EmptyMsg icon="📅" text="Nothing here"/>}
          </div>
        </div>
        <div className="card" style={{overflow:"hidden",minWidth:0}}>
          <div style={{padding:"11px 13px 9px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <p style={{fontSize:9,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600,marginBottom:2}}>Queue</p>
              <p style={{fontSize:13,fontWeight:700,color:"#111827"}}>Coming up</p>
            </div>
            {upcoming.length>0&&<span style={{background:"#EEF2FF",color:"#6366F1",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,flexShrink:0}}>{upcoming.length}</span>}
          </div>
          <div style={{overflowY:"auto",maxHeight:320}}>
            {upcoming.slice(0,8).map(p=>{
              const sm=STATUS_META[p.status]||STATUS_META.Draft;
              return(
                <div key={p.id} onClick={()=>setEdit(p)} style={{padding:"9px 13px",borderBottom:"1px solid #F9FAFB",display:"flex",alignItems:"center",gap:7,cursor:"pointer",transition:"background 0.1s",minWidth:0}} className="row-hover">
                  <span className={sm.dot} style={{width:6,height:6,borderRadius:"50%",flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12,fontWeight:500,color:"#111827",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.title}</p>
                    <p style={{fontSize:10,color:"#9CA3AF",marginTop:1}}>{PLATFORM_META[p.platform]?.emoji} {relDate(p.date)}</p>
                  </div>
                  <Pencil style={{width:10,height:10,color:"#D1D5DB",flexShrink:0}}/>
                </div>
              );
            })}
            {upcoming.length===0&&<EmptyMsg icon="📭" text="Queue is empty"/>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CalPostRow({post}){
  const{setEdit,updateStatus}=useApp();
  const[open,setOpen]=useState(false);
  const sm=STATUS_META[post.status]||STATUS_META.Draft;
  const pm=PLATFORM_META[post.platform]||PLATFORM_META.Instagram;
  const url=normUrl(post.video_link);
  return(
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
      {open&&(
        <div className="fade-in" style={{padding:"5px 8px 8px",background:"#F9FAFB",borderRadius:7,marginBottom:3,minWidth:0}}>
          {post.notes&&<MiniField label="Notes" value={post.notes}/>}
          {url&&<div style={{marginBottom:6}}><p style={{fontSize:9,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Video</p><a href={url} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#6366F1",display:"flex",alignItems:"center",gap:3}}><ExternalLink style={{width:9,height:9}}/>Open</a></div>}
          {post.caption&&<MiniField label="Caption" value={post.caption}/>}
          {post.feedback&&<MiniField label="Feedback" value={post.feedback}/>}
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

function BoardView(){
  const{byStatus,setEdit,updateStatus,db}=useApp();

  // Track drag state in a ref — avoids stale closure issues that plague useState
  const draggingIdRef = useRef(null);
  const [draggingId, setDraggingId]   = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  // Count of active drag-enters per column — lets us ignore child leave events
  const enterCountRef = useRef({});

  // ── Drag handlers ────────────────────────────────────────────────────────
  function handleDragStart(e, postId){
    // Set both ref (sync, no stale closure) and state (for rendering)
    draggingIdRef.current = postId;
    setDraggingId(postId);
    e.dataTransfer.effectAllowed = "move";
    // Set the data — use both formats for maximum browser compatibility
    e.dataTransfer.setData("text/plain", String(postId));
    e.dataTransfer.setData("application/json", JSON.stringify({postId}));
    // Without this the whole card renders as the drag ghost on some browsers
    e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
  }

  function handleDragEnd(){
    draggingIdRef.current = null;
    setDraggingId(null);
    setDragOverCol(null);
    enterCountRef.current = {};
  }

  function handleDragOver(e, status){
    // Must preventDefault to allow drop
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  }

  // Use enter/leave counting instead of contains() check —
  // more reliable because relatedTarget can be null between children
  function handleDragEnter(e, status){
    e.preventDefault();
    const key = status;
    enterCountRef.current[key] = (enterCountRef.current[key] || 0) + 1;
    setDragOverCol(status);
  }

  function handleDragLeave(e, status){
    const key = status;
    enterCountRef.current[key] = (enterCountRef.current[key] || 1) - 1;
    if(enterCountRef.current[key] <= 0){
      enterCountRef.current[key] = 0;
      setDragOverCol(prev => prev === status ? null : prev);
    }
  }

  async function handleDrop(e, status){
    e.preventDefault();
    e.stopPropagation();

    // Reset visual state
    setDragOverCol(null);
    enterCountRef.current = {};

    // Read raw id — ref is sync-safe, dataTransfer is the fallback
    const rawId = draggingIdRef.current ?? e.dataTransfer.getData("text/plain");

    // Debug: log types so we can catch any future id mismatch
    console.log("DnD drop", {
      rawId,
      rawIdType: typeof rawId,
      targetStatus: status,
      postIds: db.posts.map(p=>[p.id, typeof p.id]).slice(0,10),
    });

    // Coerce both sides to string for comparison — fixes numeric vs string id mismatch
    const post = db.posts.find(p => String(p.id) === String(rawId));

    if(!post){
      console.warn("DnD: post not found", {
        rawId,
        rawIdType: typeof rawId,
        postIds: db.posts.map(p=>[p.id, typeof p.id]).slice(0,10),
      });
      // Clear state even on failure
      draggingIdRef.current = null;
      setDraggingId(null);
      return;
    }

    // Clear drag state AFTER post is confirmed found
    draggingIdRef.current = null;
    setDraggingId(null);

    if(post.status === status) return; // no change needed

    console.log("DnD: moving", post.title, "from", post.status, "to", status);

    // Use post.id (the real typed id from Supabase) not rawId
    await updateStatus(post.id, status);
  }

  return(
    <div style={{height:"calc(100vh - 100px)",display:"flex",flexDirection:"column"}}>
      <div style={{marginBottom:12,flexShrink:0}}>
        <h2 style={{fontSize:20,fontWeight:700,color:"#111827",letterSpacing:"-0.3px"}}>Board</h2>
        <p style={{fontSize:13,color:"#6B7280",marginTop:2}}>Drag cards between columns to update their status</p>
      </div>

      {/* Hint */}
      <div style={{display:"flex",alignItems:"center",gap:8,background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:8,padding:"8px 14px",marginBottom:12,flexShrink:0}}>
        <GripVertical style={{width:14,height:14,color:"#8B5CF6",flexShrink:0}}/>
        <p style={{fontSize:12,color:"#7C3AED",fontWeight:500}}>Click and drag any card to a different column to change its status.</p>
      </div>

      {/* Columns */}
      <div className="k-board" style={{flex:1}}>
        {STATUSES.map(status=>{
          const posts = byStatus[status] || [];
          const sm    = STATUS_META[status];
          const isOver    = dragOverCol === status;
          // Use ref for current dragging id — state can lag 1 render behind ref
          const liveDragId = draggingIdRef.current ?? draggingId;
          const dragPost  = liveDragId ? db.posts.find(p=>String(p.id)===String(liveDragId)) : null;
          const willMove  = liveDragId && dragPost && dragPost.status !== status;

          return(
            <div
              key={status}
              className={"k-col" + (isOver && willMove ? " drag-over" : "")}
              onDragOver={e=>handleDragOver(e,status)}
              onDragEnter={e=>handleDragEnter(e,status)}
              onDragLeave={e=>handleDragLeave(e,status)}
              onDrop={e=>handleDrop(e,status)}
              // Prevent text selection during drag
              style={{userSelect:"none"}}
            >
              {/* Column header */}
              <div className="k-col-header">
                <span className={sm.dot} style={{width:8,height:8,borderRadius:"50%"}}/>
                <span style={{fontSize:13,fontWeight:600,color:"#374151"}}>{status}</span>
                <span style={{background:"#F3F4F6",color:"#9CA3AF",fontSize:11,fontWeight:600,padding:"1px 7px",borderRadius:10,marginLeft:2}}>{posts.length}</span>
                {isOver && willMove && (
                  <span style={{marginLeft:"auto",fontSize:10,fontWeight:600,color:"#6366F1",background:"#EEF2FF",padding:"2px 8px",borderRadius:10}}>
                    Drop here
                  </span>
                )}
              </div>

              {/* Cards */}
              <div className="k-col-body">
                {/* Drop target indicator */}
                {isOver && willMove && (
                  <div className="k-drop-ph">Move to {status}</div>
                )}

                {posts.map(p=>{
                  const pm = PLATFORM_META[p.platform] || PLATFORM_META.Instagram;
                  const pr = PRIORITY_COLOR[p.priority] || PRIORITY_COLOR.Medium;
                  const isDragging = draggingId != null && String(p.id) === String(draggingId);

                  return(
                    <DragCard
                      key={p.id}
                      post={p}
                      pm={pm}
                      pr={pr}
                      isDragging={isDragging}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onEdit={()=>setEdit(p)}
                    />
                  );
                })}

                {posts.length === 0 && !isOver && (
                  <div style={{padding:"24px 12px",textAlign:"center",color:"#D1D5DB",fontSize:12}}>
                    No posts · drag one here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Separate component so drag handlers are stable (not recreated on each render)
function DragCard({ post, pm, pr, isDragging, onDragStart, onDragEnd, onEdit }){
  const cardRef = useRef(null);

  return(
    <div
      ref={cardRef}
      className={"k-card" + (isDragging ? " dragging" : "")}
      draggable={true}
      onDragStart={e => {
        // Prevent child buttons from interfering
        e.stopPropagation();
        onDragStart(e, post.id);
      }}
      onDragEnd={e => {
        e.stopPropagation();
        onDragEnd();
      }}
    >
      {/* Top row: grip handle + title + platform emoji */}
      <div style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:8}}>
        <GripVertical
          className="k-grip"
          style={{width:14,height:14,marginTop:2,flexShrink:0,cursor:"grab"}}
        />
        <p style={{fontSize:13,fontWeight:600,color:"#111827",lineHeight:1.4,flex:1,minWidth:0}}>
          {post.title}
        </p>
        <span style={{fontSize:14,flexShrink:0}}>{pm.emoji}</span>
      </div>

      {/* Notes preview */}
      {post.notes && (
        <p style={{fontSize:11,color:"#6B7280",lineHeight:1.5,marginBottom:8,
          display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",
          paddingLeft:20}}>
          {post.notes}
        </p>
      )}

      {/* Footer: priority + date + edit button */}
      <div style={{display:"flex",alignItems:"center",gap:6,paddingLeft:20}}>
        <span style={{width:5,height:5,borderRadius:"50%",background:pr,flexShrink:0}}/>
        <span style={{fontSize:10,color:"#9CA3AF"}}>{post.priority||"Medium"}</span>
        {post.date && <span style={{fontSize:10,color:"#9CA3AF"}}>{relDate(post.date)}</span>}
        <button
          className="btn-ghost"
          style={{marginLeft:"auto",padding:"2px 6px",fontSize:11,color:"#9CA3AF"}}
          onClick={e=>{
            e.stopPropagation();
            e.preventDefault();
            onEdit();
          }}
          // Prevent mousedown from starting a drag on the button
          onMouseDown={e=>e.stopPropagation()}
          onDragStart={e=>e.preventDefault()}
        >
          <Pencil style={{width:10,height:10}}/>Edit
        </button>
      </div>
    </div>
  );
}

function ListView(){
  const{filtered,setEdit,updateStatus,deletePost}=useApp();
  const[expanded,setExpanded]=useState(null);
  return(
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
        {filtered.length>0?filtered.map(p=>{
          const pm=PLATFORM_META[p.platform]||PLATFORM_META.Instagram;
          const sm=STATUS_META[p.status]||STATUS_META.Draft;
          const isExp=expanded===p.id;
          return(
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
              {isExp&&(
                <div className="fade-in" style={{padding:"10px 16px 12px",background:"#F9FAFB",borderTop:"1px solid #F3F4F6"}}>
                  <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:14,marginBottom:10}}>
                    {p.notes&&<MiniField label="Notes" value={p.notes}/>}
                    {p.caption&&<MiniField label="Caption" value={p.caption}/>}
                    {p.feedback&&<MiniField label="Feedback" value={p.feedback}/>}
                    {p.video_link&&<div><p style={{fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>Video</p><a href={normUrl(p.video_link)} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#6366F1",display:"flex",alignItems:"center",gap:3}}><ExternalLink style={{width:10,height:10}}/>Open link</a></div>}
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
        }):<EmptyMsg icon="📋" text="No posts found."/>}
      </div>
    </div>
  );
}

function InboxView(){
  const{db,addIdea,convertIdea}=useApp();
  const[text,setText]=useState("");
  const[saving,setSaving]=useState(false);
  async function capture(){if(!text.trim()||saving)return;setSaving(true);await addIdea(text);setText("");setSaving(false);}
  return(
    <div style={{maxWidth:720}}>
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:20,fontWeight:700,color:"#111827",letterSpacing:"-0.3px"}}>Idea Inbox</h2>
        <p style={{fontSize:13,color:"#6B7280",marginTop:2}}>{db.ideas.length} ideas</p>
      </div>
      <div className="card" style={{padding:18,marginBottom:12}}>
        <p style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:8}}>Capture an idea</p>
        <textarea value={text} onChange={e=>setText(e.target.value)}
          placeholder="What's the hook? What angle? Drop it here before it disappears..."
          rows={3} className="field" style={{resize:"none",lineHeight:1.6,marginBottom:10}}
          onKeyDown={e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter")capture();}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <p style={{fontSize:11,color:"#9CA3AF"}}>Cmd+Enter to capture</p>
          <button onClick={capture} disabled={!text.trim()||saving} className="btn-primary" style={{opacity:!text.trim()?0.5:1}}>
            {saving?<Loader2 style={{width:12,height:12}} className="spin"/>:<Lightbulb style={{width:12,height:12}}/>}
            {saving?"Capturing...":"Capture idea"}
          </button>
        </div>
      </div>
      <div className="card" style={{overflow:"hidden"}}>
        <div style={{padding:"10px 16px",borderBottom:"1px solid #F3F4F6"}}>
          <p style={{fontSize:13,fontWeight:600,color:"#374151"}}>Saved ideas</p>
        </div>
        {db.ideas.length>0?db.ideas.map((idea,i)=>(
          <div key={idea.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",borderBottom:"1px solid #F9FAFB",transition:"background 0.1s",minWidth:0}} className="row-hover">
            <span style={{fontSize:11,fontWeight:700,color:"#D1D5DB",minWidth:18,flexShrink:0}}>{i+1}.</span>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:13,fontWeight:500,color:"#111827"}}>{idea.title}</p>
              {idea.notes&&<p style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>{idea.notes}</p>}
            </div>
            <button onClick={()=>convertIdea(idea)}
              style={{flexShrink:0,display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:6,border:"1px solid #C7D2FE",background:"#EEF2FF",color:"#6366F1",fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.12s",whiteSpace:"nowrap"}}
              onMouseEnter={e=>e.currentTarget.style.background="#E0E7FF"}
              onMouseLeave={e=>e.currentTarget.style.background="#EEF2FF"}>
              Make post<ArrowRight style={{width:10,height:10}}/>
            </button>
          </div>
        )):<EmptyMsg icon="💡" text="No ideas yet."/>}
      </div>
    </div>
  );
}

function VaultView(){
  const{db,addVault,deleteVault}=useApp();
  const[text,setText]=useState("");
  const[confirm,setConfirm]=useState(null);
  const[saving,setSaving]=useState(false);
  async function save(){if(!text.trim()||saving)return;setSaving(true);await addVault(text);setText("");setSaving(false);}
  return(
    <div style={{maxWidth:860}}>
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:20,fontWeight:700,color:"#111827",letterSpacing:"-0.3px"}}>Content Vault</h2>
        <p style={{fontSize:13,color:"#6B7280",marginTop:2}}>{db.vault.length} items</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"300px minmax(0,1fr)",gap:12,alignItems:"start"}}>
        <div className="card" style={{padding:18}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{width:26,height:26,borderRadius:7,background:"#ECFDF5",display:"flex",alignItems:"center",justifyContent:"center"}}><Archive style={{width:12,height:12,color:"#10B981"}}/></div>
            <p style={{fontSize:12,fontWeight:600,color:"#374151"}}>Save to vault</p>
          </div>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Hook, CTA, hashtag group..." rows={5} className="field" style={{resize:"none",lineHeight:1.6,marginBottom:10}}/>
          <button onClick={save} disabled={!text.trim()||saving} className="btn-primary" style={{width:"100%",justifyContent:"center",opacity:!text.trim()?0.5:1,background:"#10B981"}}
            onMouseEnter={e=>{if(text.trim())e.currentTarget.style.background="#059669";}}
            onMouseLeave={e=>e.currentTarget.style.background="#10B981"}>
            {saving?<Loader2 style={{width:12,height:12}} className="spin"/>:<Upload style={{width:12,height:12}}/>}
            {saving?"Saving...":"Save to vault"}
          </button>
        </div>
        {db.vault.length>0?(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10}}>
            {db.vault.map(item=>(
              <div key={item.id} className="card card-hover" style={{padding:14,position:"relative",minWidth:0}}>
                <div style={{width:22,height:22,borderRadius:6,background:"#ECFDF5",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}><Layers style={{width:11,height:11,color:"#10B981"}}/></div>
                <p style={{fontSize:11,fontWeight:600,color:"#374151",marginBottom:4}}>{item.title||"Saved Content"}</p>
                <p style={{fontSize:11,color:"#6B7280",lineHeight:1.6,wordBreak:"break-word"}}>{item.content}</p>
                {confirm===item.id?(
                  <div style={{marginTop:10,display:"flex",alignItems:"center",gap:5}}>
                    <p style={{fontSize:10,color:"#EF4444",flex:1}}>Delete?</p>
                    <button onClick={()=>{deleteVault(item.id);setConfirm(null);}} style={{padding:"2px 8px",borderRadius:4,background:"#EF4444",color:"#fff",border:"none",fontSize:10,fontWeight:700,cursor:"pointer"}}>Yes</button>
                    <button onClick={()=>setConfirm(null)} style={{padding:"2px 8px",borderRadius:4,border:"1px solid #E5E7EB",background:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",color:"#6B7280"}}>No</button>
                  </div>
                ):(
                  <button onClick={()=>setConfirm(item.id)} className="btn-ghost" style={{position:"absolute",top:8,right:8,padding:4,color:"#D1D5DB"}}
                    onMouseEnter={e=>{e.currentTarget.style.color="#EF4444";e.currentTarget.style.background="#FEF2F2";}}
                    onMouseLeave={e=>{e.currentTarget.style.color="#D1D5DB";e.currentTarget.style.background="transparent";}}>
                    <Trash2 style={{width:11,height:11}}/>
                  </button>
                )}
              </div>
            ))}
          </div>
        ):(
          <div className="card" style={{padding:48,textAlign:"center",border:"1px dashed #E5E7EB",background:"#FAFAFA"}}>
            <EmptyMsg icon="🗄️" text="Vault is empty."/>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Publishing View ─────────────────────────────────────────────────────────
// Phase 1: Connected Accounts management + publishing records.
// OAuth and actual publishing requires backend (Supabase Edge Functions).
// This view sets up the full UI scaffold ready for when backend is available.

function PublishingView(){
  const{db,disconnectAccount,setErr}=useApp();
  const[activeTab,setActiveTab]=useState("accounts"); // "accounts" | "records"

  const accounts = db.connected_accounts || [];
  const records  = db.publishing_records || [];

  const connectedCount = accounts.filter(a=>a.is_connected).length;

  async function handleConnectClick(platformId){
    if(platformId === "instagram"){
      // Call our Edge Function to get the Meta OAuth URL
      try{
        const res = await fetch(
          "https://ilezaspkmjyxwxfacebw.supabase.co/functions/v1/meta-auth/login"
        );
        const data = await res.json();
        if(data.url){
          // Redirect user to Meta login page
          window.location.href = data.url;
        } else {
          setErr("Could not start Instagram login. Please try again.");
        }
      }catch(e){
        setErr("Could not connect to Instagram. Check your internet connection.");
      }
      return;
    }
    // Other platforms coming soon
    const platform = SOCIAL_PLATFORMS[platformId];
    setErr(
      platform.label + " integration coming soon. " +
      platform.publishNote
    );
  }

  return(
    <div style={{maxWidth:860}}>
      {/* Header */}
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:22,fontWeight:700,color:"#111827",letterSpacing:"-0.3px",marginBottom:4}}>
          Publishing
        </h2>
        <p style={{fontSize:13,color:"#6B7280"}}>
          Connect social accounts, schedule posts, and track publishing status.
        </p>
      </div>

      {/* Status banner */}
      <div style={{background:"#FFFBEB",border:"1px solid #FCD34D",borderRadius:10,
        padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"flex-start",gap:10}}>
        <AlertTriangle style={{width:15,height:15,color:"#D97706",flexShrink:0,marginTop:1}}/>
        <div>
          <p style={{fontSize:13,fontWeight:600,color:"#92400E",marginBottom:2}}>
            Publishing integrations — Phase 1 ready
          </p>
          <p style={{fontSize:12,color:"#B45309",lineHeight:1.6}}>
            The UI, data model, and architecture are in place.
            Actual publishing requires connecting Supabase Edge Functions to each platform's API.
            Connect accounts below to plan and prepare — publishing will activate once the backend is wired.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:"1px solid #E5E7EB"}}>
        {[
          {id:"accounts",label:"Connected Accounts",count:connectedCount},
          {id:"records", label:"Publishing Records", count:records.length},
        ].map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
            style={{padding:"10px 18px",border:"none",background:"transparent",cursor:"pointer",
              fontSize:13,fontWeight:activeTab===tab.id?600:400,
              color:activeTab===tab.id?"#4F46E5":"#6B7280",
              borderBottom:activeTab===tab.id?"2px solid #6366F1":"2px solid transparent",
              marginBottom:-1,fontFamily:"Inter,sans-serif",display:"flex",alignItems:"center",gap:6,
              transition:"color .15s"}}>
            {tab.label}
            {tab.count > 0 && (
              <span style={{background:activeTab===tab.id?"#EEF2FF":"#F3F4F6",
                color:activeTab===tab.id?"#6366F1":"#9CA3AF",
                fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:10}}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Connected Accounts tab */}
      {activeTab === "accounts" && (
        <div>
          <p style={{fontSize:12,color:"#9CA3AF",marginBottom:14}}>
            Connect your social accounts to enable scheduling and publishing.
            Priority order: Instagram → Facebook → LinkedIn → YouTube → TikTok.
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {Object.values(SOCIAL_PLATFORMS).map(platform=>{
              const account = accounts.find(
                a => a.platform === platform.id && a.is_connected
              );
              const isConnected = !!account;

              return(
                <div key={platform.id} className="account-card">
                  {/* Platform icon */}
                  <div className="account-icon"
                    style={{background:platform.bg,border:`1px solid ${platform.border}`}}>
                    <span style={{fontSize:20}}>{platform.emoji}</span>
                  </div>

                  {/* Platform info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                      <p style={{fontSize:14,fontWeight:600,color:"#111827"}}>{platform.label}</p>
                      {isConnected ? (
                        <span style={{display:"flex",alignItems:"center",gap:3,
                          fontSize:10,fontWeight:600,color:"#10B981",
                          background:"#ECFDF5",padding:"2px 7px",borderRadius:20,
                          border:"1px solid #A7F3D0"}}>
                          <Wifi style={{width:9,height:9}}/>Connected
                        </span>
                      ) : (
                        <span style={{display:"flex",alignItems:"center",gap:3,
                          fontSize:10,fontWeight:600,color:"#9CA3AF",
                          background:"#F3F4F6",padding:"2px 7px",borderRadius:20}}>
                          <WifiOff style={{width:9,height:9}}/>Not connected
                        </span>
                      )}
                    </div>
                    {isConnected ? (
                      <p style={{fontSize:12,color:"#6B7280"}}>
                        {account.account_name || account.account_id || "Connected account"}
                        {account.expires_at && (
                          <span style={{color:"#9CA3AF",marginLeft:8,fontSize:11}}>
                            · Token expires {new Date(account.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p style={{fontSize:11,color:"#9CA3AF",lineHeight:1.5}}>
                        {platform.authNote}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    {isConnected ? (
                      <>
                        <button
                          onClick={()=>disconnectAccount(account.id)}
                          style={{display:"flex",alignItems:"center",gap:4,
                            padding:"6px 12px",borderRadius:7,
                            border:"1px solid #E5E7EB",background:"#fff",
                            color:"#6B7280",fontSize:12,fontWeight:500,cursor:"pointer",
                            fontFamily:"Inter,sans-serif",transition:"all .12s"}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor="#EF4444";e.currentTarget.style.color="#EF4444";}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor="#E5E7EB";e.currentTarget.style.color="#6B7280";}}>
                          Disconnect
                        </button>
                        <button
                          onClick={()=>handleConnectClick(platform.id)}
                          style={{display:"flex",alignItems:"center",gap:4,
                            padding:"6px 12px",borderRadius:7,
                            border:"1px solid #E5E7EB",background:"#F9FAFB",
                            color:"#374151",fontSize:12,fontWeight:500,cursor:"pointer",
                            fontFamily:"Inter,sans-serif"}}>
                          <RefreshCw style={{width:11,height:11}}/>Reconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={()=>handleConnectClick(platform.id)}
                        style={{display:"flex",alignItems:"center",gap:5,
                          padding:"7px 16px",borderRadius:7,
                          border:"1px solid",borderColor:platform.border,
                          background:platform.bg,
                          color:platform.textColor,
                          fontSize:12,fontWeight:600,cursor:"pointer",
                          fontFamily:"Inter,sans-serif",transition:"all .15s",
                          whiteSpace:"nowrap"}}
                        onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
                        onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                        <Plus style={{width:12,height:12}}/>Connect {platform.label}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Architecture note */}
          <div style={{marginTop:24,background:"#F9FAFB",border:"1px solid #F3F4F6",
            borderRadius:10,padding:"16px 18px"}}>
            <p style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:8}}>
              Integration roadmap
            </p>
            {[
              {platform:"Instagram + Facebook",status:"next",note:"Meta Graph API — requires business account verification"},
              {platform:"LinkedIn",status:"planned",note:"LinkedIn Marketing API — requires LinkedIn app approval"},
              {platform:"YouTube",status:"planned",note:"YouTube Data API v3 — via Google OAuth"},
              {platform:"TikTok",status:"later",note:"TikTok for Developers API — requires app review"},
            ].map(item=>(
              <div key={item.platform} style={{display:"flex",alignItems:"flex-start",
                gap:10,padding:"8px 0",borderBottom:"1px solid #F3F4F6"}}>
                <span style={{
                  fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20,
                  flexShrink:0,marginTop:2,textTransform:"uppercase",letterSpacing:"0.05em",
                  ...(item.status==="next"
                    ? {background:"#EEF2FF",color:"#4F46E5",border:"1px solid #C7D2FE"}
                    : item.status==="planned"
                    ? {background:"#FFFBEB",color:"#92400E",border:"1px solid #FCD34D"}
                    : {background:"#F3F4F6",color:"#9CA3AF",border:"1px solid #E5E7EB"}
                  )
                }}>{item.status}</span>
                <div>
                  <p style={{fontSize:12,fontWeight:600,color:"#374151"}}>{item.platform}</p>
                  <p style={{fontSize:11,color:"#9CA3AF",marginTop:1}}>{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publishing Records tab */}
      {activeTab === "records" && (
        <div>
          {records.length > 0 ? (
            <div className="card" style={{overflow:"hidden"}}>
              <div style={{display:"grid",
                gridTemplateColumns:"minmax(0,1fr) 90px 90px 90px 80px",
                gap:8,padding:"8px 16px",borderBottom:"1px solid #F3F4F6"}}>
                {["Post","Platform","Status","Scheduled","Published"].map(h=>(
                  <p key={h} style={{fontSize:10,fontWeight:600,color:"#9CA3AF",
                    textTransform:"uppercase",letterSpacing:"0.08em"}}>{h}</p>
                ))}
              </div>
              {records.map(r=>{
                const statusMeta = PUBLISH_STATUS_META[r.status] || PUBLISH_STATUS_META.draft;
                const post = db.posts.find(p=>p.id===r.post_id);
                const platform = SOCIAL_PLATFORMS[r.platform];
                const StatusIcon = statusMeta.icon;
                return(
                  <div key={r.id} style={{display:"grid",
                    gridTemplateColumns:"minmax(0,1fr) 90px 90px 90px 80px",
                    gap:8,padding:"10px 16px",borderBottom:"1px solid #F9FAFB",
                    alignItems:"center"}}>
                    <p style={{fontSize:13,fontWeight:500,color:"#111827",
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {post?.title || "Unknown post"}
                    </p>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span>{platform?.emoji}</span>
                      <span style={{fontSize:11,color:"#6B7280"}}>{platform?.label||r.platform}</span>
                    </div>
                    <span style={{display:"inline-flex",alignItems:"center",gap:4,
                      padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:600,
                      background:statusMeta.bg,color:statusMeta.color}}>
                      <StatusIcon style={{width:9,height:9}}/>{statusMeta.label}
                    </span>
                    <span style={{fontSize:11,color:"#9CA3AF"}}>
                      {r.scheduled_at
                        ? new Date(r.scheduled_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})
                        : "—"}
                    </span>
                    <span style={{fontSize:11,color:"#9CA3AF"}}>
                      {r.published_at
                        ? new Date(r.published_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})
                        : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyMsg icon="📡" text="No publishing records yet. Connect accounts and start scheduling posts."/>
          )}
        </div>
      )}
    </div>
  );
}


function ActivityView(){
  const{db}=useApp();
  const dotCls={success:"dot-approved",warning:"dot-scheduled",info:"dot-posted",error:"dot-draft"};
  const tagCls={success:"tag-approved",warning:"tag-scheduled",info:"tag-posted",error:"tag-draft"};
  return(
    <div style={{maxWidth:600}}>
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:20,fontWeight:700,color:"#111827",letterSpacing:"-0.3px"}}>Activity</h2>
        <p style={{fontSize:13,color:"#6B7280",marginTop:2}}>{db.notifications.length} events</p>
      </div>
      <div className="card" style={{overflow:"hidden"}}>
        {db.notifications.length>0?db.notifications.map((n,i)=>(
          <div key={n.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 16px",borderBottom:i<db.notifications.length-1?"1px solid #F9FAFB":"none",transition:"background 0.1s",minWidth:0}} className="row-hover">
            <div style={{width:24,height:24,borderRadius:"50%",background:"#F9FAFB",border:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
              <span className={dotCls[n.type]||"dot-draft"} style={{width:6,height:6,borderRadius:"50%"}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:13,color:"#374151",lineHeight:1.5}}>{n.message}</p>
              {n.created_at&&<p style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>{new Date(n.created_at).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</p>}
            </div>
            <span className={"tag "+(tagCls[n.type]||"tag-draft")} style={{fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>{n.type}</span>
          </div>
        )):<EmptyMsg icon="🔔" text="No activity yet."/>}
      </div>
    </div>
  );
}

function QuickAddBar(){
  const{addPost,setQA}=useApp();
  const[title,setTitle]=useState("");
  const[date,setDate]=useState(fmt(new Date()));
  const[platform,setPlatform]=useState("Instagram");
  const[saving,setSaving]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{ref.current?.focus();},[]);
  async function submit(){
    if(!title.trim()||saving)return;
    setSaving(true);
    await addPost({title:title.trim(),date,platform,status:"Draft",caption:"",notes:"",video_link:"",feedback:"",checklist:DEFAULT_CHECKLIST.map(i=>({...i}))});
    setSaving(false);setQA(false);
  }
  const inp={background:"#fff",border:"1px solid #E5E7EB",borderRadius:7,padding:"6px 10px",fontSize:13,color:"#111827",fontFamily:"Inter,sans-serif",outline:"none"};
  return(
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
        {saving?"Adding...":"Add"}
      </button>
      <button onClick={()=>setQA(false)} className="btn-ghost" style={{padding:5}}><X style={{width:13,height:13}}/></button>
    </div>
  );
}

function EditPanel(){
  const{editPost:post,setEdit,updatePost,deletePost,updateStatus}=useApp();
  const[form,setForm]=useState({
    title:post.title||"",date:post.date||fmt(new Date()),
    platform:post.platform||"Instagram",status:post.status||"Draft",
    notes:post.notes||"",video_link:post.video_link||"",
    caption:post.caption||"",feedback:post.feedback||"",
    checklist: Array.isArray(post.checklist) && post.checklist.length > 0
      ? post.checklist
      : DEFAULT_CHECKLIST.map(i=>({...i})),
  });
  const[saveState,setSaveState]=useState("idle");
  const timer=useRef(null);
  const isFirst=useRef(true);

  // Sync form.status if the post is updated externally (e.g. drag-and-drop while panel is open)
  useEffect(()=>{
    setForm(f=>f.status!==post.status ? {...f,status:post.status} : f);
  },[post.status]);

  useEffect(()=>{
    if(isFirst.current){isFirst.current=false;return;}
    setSaveState("dirty");
    clearTimeout(timer.current);
    timer.current=setTimeout(async()=>{
      setSaveState("saving");
      await updatePost(post.id,form);
      setSaveState("saved");
      setTimeout(()=>setSaveState("idle"),2500);
    },1500);
    return()=>clearTimeout(timer.current);
  },[form]);

  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const handleStatus=async s=>{setForm(f=>({...f,status:s}));await updateStatus(post.id,s);};

  useEffect(()=>{
    const fn=e=>{if(e.key==="Escape")setEdit(null);};
    window.addEventListener("keydown",fn);return()=>window.removeEventListener("keydown",fn);
  },[setEdit]);

  const inp={width:"100%",background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:8,padding:"8px 11px",fontSize:13,color:"#111827",fontFamily:"Inter,sans-serif",outline:"none",transition:"border-color .15s,box-shadow .15s"};
  const foc={onFocus:e=>{e.target.style.borderColor="#6366F1";e.target.style.boxShadow="0 0 0 3px rgba(99,102,241,.1)";},onBlur:e=>{e.target.style.borderColor="#E5E7EB";e.target.style.boxShadow="none";}};

  return(
    <>
      <div className="overlay fade-in" onClick={()=>setEdit(null)}/>
      <div className="slide-in" style={{position:"fixed",right:0,top:0,zIndex:50,height:"100%",width:"100%",maxWidth:480,display:"flex",flexDirection:"column",background:"#fff",boxShadow:"-4px 0 32px rgba(0,0,0,.1)",borderLeft:"1px solid #E5E7EB"}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:"#FAFAFA"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:26,height:26,borderRadius:6,background:"#EEF2FF",display:"flex",alignItems:"center",justifyContent:"center"}}><FileText style={{width:12,height:12,color:"#6366F1"}}/></div>
            <span style={{fontSize:13,fontWeight:600,color:"#111827"}}>Edit Post</span>
            <div style={{marginLeft:2,display:"flex",alignItems:"center",gap:4}}>
              {saveState==="dirty"&&<span style={{fontSize:10,color:"#9CA3AF",display:"flex",alignItems:"center",gap:3}}><span className="pulse-dot" style={{width:4,height:4,borderRadius:"50%",background:"#F59E0B",display:"inline-block"}}/>Editing</span>}
              {saveState==="saving"&&<span style={{fontSize:10,color:"#9CA3AF",display:"flex",alignItems:"center",gap:3}}><Loader2 style={{width:9,height:9}} className="spin"/>Saving</span>}
              {saveState==="saved"&&<span style={{fontSize:10,color:"#10B981",display:"flex",alignItems:"center",gap:3}}><Check style={{width:9,height:9}}/>Saved</span>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:3}}>
            <button onClick={()=>deletePost(post.id)} className="btn-ghost" style={{color:"#EF4444",fontSize:11,padding:"3px 7px"}}><Trash2 style={{width:11,height:11}}/>Delete</button>
            <button onClick={()=>setEdit(null)} className="btn-ghost" style={{padding:5}}><X style={{width:13,height:13}}/></button>
          </div>
        </div>
        <div style={{padding:"4px 16px",background:"#F5F3FF",borderBottom:"1px solid #EDE9FE",flexShrink:0,display:"flex",alignItems:"center",gap:5}}>
          <Zap style={{width:9,height:9,color:"#8B5CF6"}}/>
          <p style={{fontSize:10,color:"#7C3AED",fontWeight:500}}>Auto-saves 1.5s after you stop typing</p>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"22px 20px"}}>

          {/* ── Title — large, underline on focus ── */}
          <input value={form.title} onChange={sf("title")} placeholder="Post title"
            style={{...inp,width:"100%",fontSize:18,fontWeight:700,marginBottom:22,
              letterSpacing:"-0.3px",border:"none",borderBottom:"2px solid #F3F4F6",
              borderRadius:0,padding:"0 0 10px 0",boxShadow:"none"}}
            onFocus={e=>{e.target.style.borderBottomColor="#6366F1";}}
            onBlur={e=>{e.target.style.borderBottomColor="#F3F4F6";}}/>

          {/* ── Date + Platform ── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
            <FieldRow label="Date">
              <input type="date" value={form.date} onChange={sf("date")} style={inp} {...foc}/>
            </FieldRow>
            <FieldRow label="Platform">
              <select value={form.platform} onChange={sf("platform")} style={inp} {...foc}>
                {PLATFORMS.map(p=><option key={p} value={p}>{PLATFORM_META[p]?.emoji} {p}</option>)}
              </select>
            </FieldRow>
          </div>

          {/* ── Status ── */}
          <FieldRow label="Status" style={{marginBottom:22}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>
              {STATUS_ORDER.map((s,i) => {
                const sm = STATUS_META[s] || STATUS_META.Draft;
                const isActive = form.status === s;
                const isDone   = STATUS_ORDER.indexOf(form.status) > i;
                return (
                  <button key={s} onClick={()=>handleStatus(s)}
                    style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",
                      borderRadius:20,border:"1.5px solid",
                      borderColor: isActive ? "#6366F1" : isDone ? "#86EFAC" : "#E5E7EB",
                      background:  isActive ? "#EEF2FF" : isDone ? "#F0FDF4" : "#fff",
                      color:       isActive ? "#4F46E5" : isDone ? "#16A34A" : "#9CA3AF",
                      fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s",
                      boxShadow: isActive ? "0 0 0 3px rgba(99,102,241,.1)" : "none",
                      fontFamily:"Inter,sans-serif"}}>
                    <span className={sm.dot} style={{width:5,height:5,borderRadius:"50%",flexShrink:0}}/>
                    {s}
                    {isDone && <span style={{fontSize:9,marginLeft:1}}>✓</span>}
                  </button>
                );
              })}
            </div>
          </FieldRow>

          {/* ── Divider ── */}
          <div style={{height:1,background:"#F3F4F6",margin:"0 0 22px"}}/>

          {/* ── Caption — most important content field, goes first ── */}
          <FieldRow label="Caption" style={{marginBottom:18}}>
            <textarea value={form.caption} onChange={sf("caption")}
              placeholder="Write the caption for this post..." rows={5}
              style={{...inp,resize:"none",lineHeight:1.75}} {...foc}/>
          </FieldRow>

          {/* ── Notes ── */}
          <FieldRow label="Notes" style={{marginBottom:18}}>
            <textarea value={form.notes} onChange={sf("notes")}
              placeholder="Creative direction, production notes, context..." rows={3}
              style={{...inp,resize:"none",lineHeight:1.75}} {...foc}/>
          </FieldRow>

          {/* ── Attached media ── */}
          <FieldRow label="Attached media" style={{marginBottom:18}}>
            <MediaAttachment
              value={form.video_link}
              onChange={url=>setForm(f=>({...f,video_link:url}))}
            />
          </FieldRow>

          {/* ── Feedback ── */}
          <FieldRow label="Feedback" style={{marginBottom:22}}>
            <textarea value={form.feedback} onChange={sf("feedback")}
              placeholder="Client feedback or revision notes..." rows={3}
              style={{...inp,resize:"none",lineHeight:1.75}} {...foc}/>
          </FieldRow>

          {/* ── Divider ── */}
          <div style={{height:1,background:"#F3F4F6",margin:"0 0 20px"}}/>

          {/* ── Publish targets ── */}
          <PublishTargets post={post}/>

        </div>
        <div style={{padding:"12px 20px",borderTop:"1px solid #F3F4F6",flexShrink:0,display:"flex",justifyContent:"flex-end"}}>
          <button onClick={()=>setEdit(null)} className="btn-primary" style={{fontSize:12,padding:"7px 20px"}}>Done</button>
        </div>
      </div>
    </>
  );
}

function CommandPalette(){
  const{db,setCmdOpen,setView,setEdit,setQA}=useApp();
  const[q,setQ]=useState("");
  const[sel,setSel]=useState(0);
  const ref=useRef(null);
  useEffect(()=>{ref.current?.focus();},[]);
  const results=useMemo(()=>{
    const lq=q.toLowerCase();
    const cmds=[
      {type:"nav",label:"Home",          icon:Home,      action:()=>{setView("home");    setCmdOpen(false);}},
      {type:"nav",label:"Calendar",      icon:Calendar,  action:()=>{setView("calendar");setCmdOpen(false);}},
      {type:"nav",label:"Board",         icon:Columns,   action:()=>{setView("board");   setCmdOpen(false);}},
      {type:"nav",label:"All Posts",     icon:List,      action:()=>{setView("list");    setCmdOpen(false);}},
      {type:"nav",label:"Idea Inbox",    icon:Lightbulb, action:()=>{setView("inbox");   setCmdOpen(false);}},
      {type:"nav",label:"Content Vault", icon:Archive,   action:()=>{setView("vault");   setCmdOpen(false);}},
      {type:"nav",label:"New post",      icon:Plus,      action:()=>{setQA(true);        setCmdOpen(false);}},
    ];
    const hits=lq?db.posts.filter(p=>(p.title||"").toLowerCase().includes(lq)).slice(0,5).map(p=>({type:"post",label:p.title,sub:p.platform+" · "+relDate(p.date),icon:FileText,action:()=>{setEdit(p);setCmdOpen(false);}})):[];
    return[...(lq?cmds.filter(c=>c.label.toLowerCase().includes(lq)):cmds),...hits];
  },[q,db.posts]);
  useEffect(()=>setSel(0),[results.length]);
  function handleKey(e){
    if(e.key==="ArrowDown"){e.preventDefault();setSel(s=>Math.min(s+1,results.length-1));}
    if(e.key==="ArrowUp")  {e.preventDefault();setSel(s=>Math.max(s-1,0));}
    if(e.key==="Enter")    {e.preventDefault();results[sel]?.action?.();}
    if(e.key==="Escape")   {setCmdOpen(false);}
  }
  return(
    <div className="cmd-wrap fade-in" onClick={()=>setCmdOpen(false)}>
      <div className="scale-in card" style={{width:"100%",maxWidth:500,overflow:"hidden",boxShadow:"0 16px 48px rgba(0,0,0,.14)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:9,padding:"11px 14px",borderBottom:"1px solid #F3F4F6"}}>
          <Search style={{width:14,height:14,color:"#9CA3AF",flexShrink:0}}/>
          <input ref={ref} value={q} onChange={e=>setQ(e.target.value)} onKeyDown={handleKey}
            placeholder="Search or navigate..."
            style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:14,color:"#111827",fontFamily:"Inter,sans-serif"}}/>
          <kbd style={{fontSize:10,background:"#F3F4F6",border:"1px solid #E5E7EB",borderRadius:4,padding:"1px 5px",color:"#9CA3AF",flexShrink:0}}>Esc</kbd>
        </div>
        <div style={{maxHeight:320,overflowY:"auto",padding:"4px 0"}}>
          {results.length>0?results.map((r,i)=>(
            <button key={i} onClick={r.action}
              style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"7px 14px",border:"none",cursor:"pointer",textAlign:"left",background:sel===i?"#EEF2FF":"transparent",transition:"background 0.1s",fontFamily:"Inter,sans-serif"}}
              onMouseEnter={()=>setSel(i)}>
              <r.icon style={{width:13,height:13,color:sel===i?"#6366F1":"#9CA3AF",flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:13,color:sel===i?"#4F46E5":"#374151",fontWeight:sel===i?600:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.label}</p>
                {r.sub&&<p style={{fontSize:10,color:"#9CA3AF",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.sub}</p>}
              </div>
              <span style={{fontSize:9,color:"#D1D5DB",textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>{r.type}</span>
            </button>
          )):<div style={{padding:20,textAlign:"center",color:"#9CA3AF",fontSize:13}}>No results</div>}
        </div>
        <div style={{padding:"7px 14px",borderTop:"1px solid #F3F4F6",display:"flex",gap:12}}>
          {[["Up/Down","Navigate"],["Enter","Open"],["Esc","Close"]].map(([k,l])=>(
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

// ─── PublishTargets ───────────────────────────────────────────────────────────
// Shows in the EditPanel — lets the user see per-platform publish status
// and toggle which platforms this post is targeted for.

function PublishTargets({ post }){
  const{db,setErr}=useApp();
  const records = (db.publishing_records||[]).filter(r=>r.post_id===post.id);
  const connectedAccounts = db.connected_accounts||[];

  function handlePublishClick(platformId){
    const platform = SOCIAL_PLATFORMS[platformId];
    setErr(
      `Publishing to ${platform.label} coming soon. ` +
      "Activate publishing by connecting a ${platform.label} account in the Publishing tab."
    );
  }

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <p style={{fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.08em"}}>
          Publish to
        </p>
        <a href="#" onClick={e=>{e.preventDefault();}}
          style={{fontSize:11,color:"#6366F1",textDecoration:"none",fontWeight:500}}>
          Manage accounts →
        </a>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {Object.values(SOCIAL_PLATFORMS).map(platform=>{
          const record = records.find(r=>r.platform===platform.id);
          const account = connectedAccounts.find(a=>a.platform===platform.id&&a.is_connected);
          const statusMeta = record ? (PUBLISH_STATUS_META[record.status]||PUBLISH_STATUS_META.draft) : null;
          const StatusIcon = statusMeta?.icon;

          return(
            <div key={platform.id} style={{display:"flex",alignItems:"center",gap:10,
              padding:"8px 10px",borderRadius:8,background:"#FAFAFA",border:"1px solid #F3F4F6"}}>
              {/* Platform */}
              <span style={{fontSize:15,flexShrink:0}}>{platform.emoji}</span>
              <span style={{fontSize:12,fontWeight:500,color:"#374151",flex:1,minWidth:0}}>
                {platform.label}
              </span>

              {/* Status or connect prompt */}
              {record ? (
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {record.external_post_url ? (
                    <a href={record.external_post_url} target="_blank" rel="noreferrer"
                      style={{display:"flex",alignItems:"center",gap:3,
                        fontSize:10,color:"#6366F1",textDecoration:"none",fontWeight:600}}>
                      <ExternalLink style={{width:9,height:9}}/>View
                    </a>
                  ) : null}
                  <span style={{display:"inline-flex",alignItems:"center",gap:3,
                    padding:"2px 7px",borderRadius:20,fontSize:10,fontWeight:600,
                    background:statusMeta.bg,color:statusMeta.color}}>
                    {StatusIcon&&<StatusIcon style={{width:8,height:8}}/>}
                    {statusMeta.label}
                  </span>
                </div>
              ) : account ? (
                <button onClick={()=>handlePublishClick(platform.id)}
                  style={{display:"flex",alignItems:"center",gap:4,
                    padding:"4px 10px",borderRadius:6,
                    border:"1px solid",borderColor:platform.border,
                    background:platform.bg,color:platform.textColor,
                    fontSize:11,fontWeight:600,cursor:"pointer",
                    fontFamily:"Inter,sans-serif",transition:"all .12s",whiteSpace:"nowrap"}}>
                  <Send style={{width:9,height:9}}/>Publish
                </button>
              ) : (
                <span style={{fontSize:10,color:"#D1D5DB",fontStyle:"italic"}}>
                  Not connected
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── Media Attachment Component ───────────────────────────────────────────────
// Detects media type, shows preview card, one-click open/copy/remove.
// Keeps the existing video_link data model — just upgrades the UX.

function detectMediaType(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be"))          return "youtube";
  if (u.includes("drive.google.com"))                                return "gdrive";
  if (u.includes("loom.com"))                                        return "loom";
  // Extension-based image detection
  if (/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|#|$)/.test(u))       return "image";
  // Common image CDN patterns (Cloudinary, S3, Imgur, Unsplash, etc.)
  if (u.includes("res.cloudinary.com"))                              return "image";
  if (u.includes("images.unsplash.com"))                             return "image";
  if (u.includes("imgur.com"))                                       return "image";
  if (u.includes("i.imgur.com"))                                     return "image";
  if (/s3\.amazonaws\.com.*\.(jpg|jpeg|png|gif|webp)/.test(u))    return "image";
  // Video files
  if (/\.(mp4|mov|avi|webm|mkv)(\?|#|$)/.test(u))                 return "video";
  // Docs
  if (/\.(pdf|doc|docx|ppt|pptx)(\?|#|$)/.test(u))               return "doc";
  return "link";
}

function getMediaMeta(url) {
  const type = detectMediaType(url);
  const meta = {
    youtube:  { label:"YouTube video",      icon:Play,      color:"#EF4444", bg:"#FEF2F2",   canPreview:true  },
    gdrive:   { label:"Google Drive file",  icon:BookOpen,  color:"#1A73E8", bg:"#EFF6FF",   canPreview:false },
    loom:     { label:"Loom recording",     icon:Film,      color:"#8B5CF6", bg:"#F5F3FF",   canPreview:false },
    image:    { label:"Image",              icon:Image,     color:"#10B981", bg:"#ECFDF5",   canPreview:true  },
    video:    { label:"Video file",         icon:Film,      color:"#F97316", bg:"#FFF7ED",   canPreview:false },
    doc:      { label:"Document",           icon:FileText,  color:"#6366F1", bg:"#EEF2FF",   canPreview:false },
    link:     { label:"Asset link",         icon:Link,      color:"#6B7280", bg:"#F3F4F6",   canPreview:false },
  };
  return type ? meta[type] : null;
}

function getYouTubeThumbnail(url) {
  // Extract video id from various YouTube URL formats
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
}

function getDomain(url) {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return ""; }
}

function MediaAttachment({ value, onChange }) {
  const [inputVal, setInputVal]     = useState(value || "");
  const [showInput, setShowInput]   = useState(!value);
  const [copied, setCopied]         = useState(false);
  const [imgError, setImgError]     = useState(false);
  const [urlError, setUrlError]     = useState(false);  // shows inline error on bad paste
  const inputRef = useRef(null);

  // Keep in sync if external value changes (e.g. loading a post)
  useEffect(() => {
    setInputVal(value || "");
    setShowInput(!value);
    setImgError(false);
    setUrlError(false);
  }, [value]);

  const type = detectMediaType(value);
  const meta = getMediaMeta(value);
  const validUrl = normUrl(value);

  function handlePaste(e) {
    // Auto-submit on paste — most common workflow
    const pasted = e.clipboardData?.getData("text") || "";
    const cleaned = normUrl(pasted.trim());
    if (cleaned) {
      setUrlError(false);
      setInputVal(cleaned);
      onChange(cleaned);
      setShowInput(false);
    }
  }

  function handleInputChange(e) {
    setUrlError(false);
    setInputVal(e.target.value);
  }

  function handleInputBlur() {
    const cleaned = normUrl(inputVal.trim());
    if (cleaned) {
      setUrlError(false);
      onChange(cleaned);
      setShowInput(false);
    } else if (!inputVal.trim()) {
      // Empty — hide input and show existing card or empty state
      setUrlError(false);
      setShowInput(false);
    } else {
      // User typed something invalid — show error, don't silently revert
      setUrlError(true);
    }
  }

  function handleInputKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInputBlur();
    }
    if (e.key === "Escape") {
      setUrlError(false);
      setShowInput(false);
      setInputVal(value || "");
    }
  }

  function handleCopy() {
    if (!validUrl) return;
    navigator.clipboard.writeText(validUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function handleRemove() {
    onChange("");
    setInputVal("");
    setShowInput(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!value && !showInput) {
    return (
      <div className="media-empty" onClick={() => { setShowInput(true); setTimeout(() => inputRef.current?.focus(), 50); }}>
        <div style={{width:32,height:32,borderRadius:8,background:"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px"}}>
          <Link style={{width:14,height:14,color:"#9CA3AF"}}/>
        </div>
        <p style={{fontSize:12,fontWeight:600,color:"#6B7280",marginBottom:3}}>Attach media or asset</p>
        <p style={{fontSize:11,color:"#9CA3AF"}}>YouTube, Google Drive, image URL, video file</p>
      </div>
    );
  }

  // ── Input state ──────────────────────────────────────────────────────────
  if (showInput || !value) {
    return (
      <div>
        <input
          ref={inputRef}
          value={inputVal}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onPaste={handlePaste}
          placeholder="Paste a YouTube, Drive, image, or asset link..."
          style={{width:"100%",background:"#fff",
            border: urlError ? "1.5px solid #EF4444" : "1.5px solid #6366F1",
            borderRadius:8,padding:"9px 12px",fontSize:13,color:"#111827",
            fontFamily:"Inter,sans-serif",outline:"none",
            boxShadow: urlError
              ? "0 0 0 3px rgba(239,68,68,.1)"
              : "0 0 0 3px rgba(99,102,241,.1)"}}
          autoFocus
        />
        {urlError && (
          <p style={{fontSize:11,color:"#EF4444",marginTop:5}}>
            That doesn't look like a valid URL. Try pasting the full link.
          </p>
        )}
        {!urlError && (
          <div style={{display:"flex",gap:14,marginTop:7,padding:"0 1px"}}>
            {["▶ YouTube","📁 Drive","🖼 Image","🔗 Link"].map(ex=>(
              <span key={ex} style={{fontSize:10,color:"#9CA3AF"}}>{ex}</span>
            ))}
          </div>
        )}
        {value && !urlError && (
          <button onClick={() => { setShowInput(false); setInputVal(value); setUrlError(false); }}
            className="btn-ghost" style={{marginTop:5,fontSize:11,color:"#9CA3AF"}}>
            Cancel
          </button>
        )}
      </div>
    );
  }

  // ── Attachment card state ────────────────────────────────────────────────
  const ytThumb = type === "youtube" ? getYouTubeThumbnail(value) : null;
  const domain  = getDomain(value);
  const isImageType = (type === "image" || type === "youtube");

  return (
    <div className="media-card">

      {/* ── Visual preview ── */}
      {type === "youtube" && ytThumb && !imgError ? (
        // YouTube: thumbnail with play button overlay
        <div style={{position:"relative",borderRadius:"10px 10px 0 0",overflow:"hidden",lineHeight:0}}>
          <img src={ytThumb} alt="YouTube thumbnail"
            onError={() => setImgError(true)}
            style={{width:"100%",display:"block",objectFit:"cover",maxHeight:180}}/>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
            justifyContent:"center",background:"rgba(0,0,0,.22)"}}>
            <div style={{width:40,height:40,borderRadius:"50%",
              background:"rgba(255,255,255,.92)",
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:"0 2px 12px rgba(0,0,0,.18)"}}>
              <Play style={{width:15,height:15,color:"#EF4444",marginLeft:2}}/>
            </div>
          </div>
        </div>
      ) : type === "image" && !imgError ? (
        // Image: natural height, no cropping, rounded top corners
        <div style={{borderRadius:"10px 10px 0 0",overflow:"hidden",
          background:"#F9FAFB",lineHeight:0,
          borderBottom:"1px solid #F3F4F6"}}>
          <img
            src={value}
            alt="Attached image"
            onError={() => setImgError(true)}
            style={{
              width:"100%",
              maxHeight:260,
              objectFit:"contain",  // no cropping — show full image
              display:"block",
              background:"#F9FAFB",
            }}
          />
        </div>
      ) : (
        // Non-image: compact icon card
        <div style={{display:"flex",alignItems:"center",gap:12,
          padding:"14px 14px",borderBottom:"1px solid #F3F4F6"}}>
          <div style={{width:38,height:38,borderRadius:9,
            background:meta?.bg||"#F3F4F6",flexShrink:0,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            {meta && React.createElement(meta.icon,{style:{width:18,height:18,color:meta.color}})}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:13,fontWeight:600,color:"#111827",
              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {meta?.label || "Attached file"}
            </p>
            <p style={{fontSize:11,color:"#9CA3AF",marginTop:2,
              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {domain || value.slice(0,48)}
            </p>
          </div>
        </div>
      )}

      {/* ── Info row (for image/youtube — non-image has it inline above) ── */}
      {isImageType && !imgError && (
        <div style={{padding:"9px 12px",borderBottom:"1px solid #F3F4F6"}}>
          <p style={{fontSize:11,fontWeight:600,color:"#374151",
            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
            {meta?.label || "Image"}
          </p>
          <p style={{fontSize:10,color:"#9CA3AF",marginTop:1,
            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
            {domain || value.slice(0,48)}
          </p>
        </div>
      )}

      {/* ── Fallback info when image fails to load ── */}
      {imgError && (
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",
          borderBottom:"1px solid #F3F4F6"}}>
          <div style={{width:36,height:36,borderRadius:8,background:"#FEF2F2",
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <AlertCircle style={{width:16,height:16,color:"#EF4444"}}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:12,fontWeight:600,color:"#374151"}}>Preview unavailable</p>
            <p style={{fontSize:10,color:"#9CA3AF",marginTop:2,
              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {domain || value.slice(0,48)}
            </p>
          </div>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="media-card-actions">
        <a href={validUrl} target="_blank" rel="noreferrer" className="media-btn primary"
          style={{textDecoration:"none"}}>
          <ExternalLink style={{width:10,height:10}}/>Open
        </a>
        <div style={{position:"relative"}}>
          {copied && <div className="copy-confirm">Copied!</div>}
          <button onClick={handleCopy} className="media-btn">
            <Copy style={{width:10,height:10}}/>Copy link
          </button>
        </div>
        <button onClick={() => setShowInput(true)} className="media-btn" style={{marginLeft:"auto"}}>
          <Pencil style={{width:10,height:10}}/>Edit
        </button>
        <button onClick={handleRemove} className="media-btn danger">
          <X style={{width:10,height:10}}/>Remove
        </button>
      </div>
    </div>
  );
}


function StatusTag({status,small}){
  const sm=STATUS_META[status]||STATUS_META.Draft;
  return(
    <span className={"tag "+sm.tagCls} style={{fontSize:small?10:11}}>
      <span className={sm.dot} style={{width:small?4:5,height:small?4:5,borderRadius:"50%"}}/>{status}
    </span>
  );
}
function MiniField({label,value}){
  return(
    <div style={{marginBottom:7}}>
      <p style={{fontSize:9,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>{label}</p>
      <p style={{fontSize:11,color:"#4B5563",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{value}</p>
    </div>
  );
}
function FieldRow({label,children,style:s}){
  return(
    <div style={{marginBottom:12,...s}}>
      <p style={{fontSize:10,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{label}</p>
      {children}
    </div>
  );
}
function EmptyMsg({icon,text}){
  return(
    <div style={{padding:"24px 16px",textAlign:"center"}}>
      <div style={{fontSize:24,marginBottom:6}}>{icon}</div>
      <p style={{fontSize:12,color:"#9CA3AF",lineHeight:1.5,maxWidth:240,margin:"0 auto"}}>{text}</p>
    </div>
  );
}
function LoadingState(){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:12}}>
      <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,boxShadow:"0 4px 14px rgba(99,102,241,.3)"}}>🌿</div>
      <div style={{display:"flex",alignItems:"center",gap:7,color:"#9CA3AF"}}>
        <Loader2 style={{width:14,height:14}} className="spin"/>
        <span style={{fontSize:13,fontWeight:500}}>Loading your workspace...</span>
      </div>
    </div>
  );
}
function ErrBanner(){
  const{err,setErr}=useApp();
  return(
    <div className="fade-in" style={{background:"#FEF2F2",borderBottom:"1px solid #FECACA",padding:"8px 16px",display:"flex",alignItems:"center",gap:9,flexShrink:0,minWidth:0}}>
      <AlertCircle style={{width:13,height:13,color:"#EF4444",flexShrink:0}}/>
      <p style={{flex:1,fontSize:12,color:"#DC2626",minWidth:0}}>{err}</p>
      <button onClick={()=>setErr("")} className="btn-ghost" style={{padding:3,color:"#EF4444",flexShrink:0}}><X style={{width:11,height:11}}/></button>
    </div>
  );
}
