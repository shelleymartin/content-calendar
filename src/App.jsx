/**
 * DEEPER HEALING · CONTENT OS
 * Production-grade work operating system
 * Notion × Asana × Linear aesthetic
 * 
 * Architecture:
 *  ├── Shell (fixed layout: sidebar + topbar + content)
 *  ├── Sidebar (workspace nav, collapsible, spaces)
 *  ├── Views: Calendar · Board · List · Inbox · Vault · Activity
 *  ├── Command Palette (⌘K)
 *  ├── Edit Panel (slide-out, autosave)
 *  └── Quick Capture (global)
 */

import React, {
  useEffect, useMemo, useState, useCallback,
  useRef, createContext, useContext,
} from "react";
import {
  Activity, AlertCircle, Archive, ArrowRight, Bell,
  Calendar, Check, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, Circle, Clock, Command, ExternalLink,
  FileText, Filter, Grid3x3, Hash, Inbox, Layers, Lightbulb,
  Link as LinkIcon, List, Loader2, Menu, MoreHorizontal,
  Pencil, Plus, Search, SortAsc, Sparkles, Star, Tag,
  Trash2, Upload, Wand2, X, Zap, Layout, BarChart2,
  Target, Users, Settings, LogOut, Home, Columns,
} from "lucide-react";
import { supabase, supabaseConfigError } from "./lib/supabase";

// ─── Fonts ────────────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("dh-fonts")) return;
  const l = document.createElement("link");
  l.id = "dh-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400&display=swap";
  document.head.appendChild(l);
})();

// ─── Global CSS ───────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("dh-css")) return;
  const s = document.createElement("style");
  s.id = "dh-css";
  s.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; }
    body {
      font-family: 'Geist', system-ui, -apple-system, sans-serif;
      background: #0f0f0f; color: #e8e8e3;
      -webkit-font-smoothing: antialiased;
    }
    ::-webkit-scrollbar { width: 3px; height: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 99px; }

    /* Animations */
    @keyframes fadeUp   { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
    @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
    @keyframes slideIn  { from { transform:translateX(100%); } to { transform:none; } }
    @keyframes slideUp  { from { transform:translateY(100%); opacity:0; } to { transform:none; opacity:1; } }
    @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
    @keyframes spin     { to { transform: rotate(360deg); } }
    @keyframes scaleIn  { from{transform:scale(.96);opacity:0} to{transform:none;opacity:1} }

    .fade-up    { animation: fadeUp 0.2s ease both; }
    .fade-in    { animation: fadeIn 0.15s ease both; }
    .slide-in   { animation: slideIn 0.25s cubic-bezier(.32,.72,0,1) both; }
    .scale-in   { animation: scaleIn 0.18s ease both; }
    .spin       { animation: spin 0.8s linear infinite; }
    .pulse      { animation: pulse 1.5s ease infinite; }

    /* Utility */
    .truncate { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .serif    { font-family: 'Lora', Georgia, serif; }
    .mono     { font-family: 'Geist Mono', monospace; }

    /* Interactive states */
    .btn-ghost {
      background: transparent; border: none; cursor: pointer;
      border-radius: 6px; color: #888; transition: background 0.1s, color 0.1s;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .btn-ghost:hover { background: #1e1e1e; color: #e8e8e3; }

    .row-hover { transition: background 0.1s; cursor: pointer; }
    .row-hover:hover { background: #161616; }

    .nav-item {
      display: flex; align-items: center; gap: 8px;
      padding: 5px 8px; border-radius: 6px; border: none;
      background: transparent; cursor: pointer; width: 100%;
      font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 400;
      color: #888; transition: background 0.1s, color 0.1s; text-align: left;
    }
    .nav-item:hover { background: #1a1a1a; color: #e8e8e3; }
    .nav-item.active { background: #1e1e1e; color: #e8e8e3; font-weight: 500; }

    .tag {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;
      border: 1px solid transparent;
    }

    /* Card */
    .card {
      background: #141414; border: 1px solid #1f1f1f;
      border-radius: 12px; overflow: hidden;
    }

    /* Input */
    .field {
      width: 100%; background: #111; border: 1px solid #222;
      border-radius: 8px; padding: 9px 12px; font-size: 13px;
      color: #e8e8e3; font-family: 'Geist', sans-serif; outline: none;
      transition: border-color 0.15s;
    }
    .field:focus { border-color: #3b3bf5; }
    .field::placeholder { color: #444; }

    /* Command palette backdrop */
    .cmd-backdrop {
      position: fixed; inset: 0; z-index: 200;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      display: flex; align-items: flex-start; justify-content: center;
      padding-top: 15vh;
    }

    /* Kanban */
    .kanban-col {
      flex-shrink: 0; width: 280px;
      background: #111; border: 1px solid #1f1f1f; border-radius: 10px;
      display: flex; flex-direction: column;
    }
    .kanban-card {
      background: #161616; border: 1px solid #222; border-radius: 8px;
      padding: 12px; margin: 0 8px 6px; cursor: pointer;
      transition: border-color 0.15s, transform 0.1s;
    }
    .kanban-card:hover { border-color: #333; transform: translateY(-1px); }

    /* Timeline */
    .gantt-bar {
      height: 24px; border-radius: 6px; position: absolute;
      display: flex; align-items: center; padding: 0 8px;
      font-size: 11px; font-weight: 500; cursor: pointer;
      transition: opacity 0.15s;
    }
    .gantt-bar:hover { opacity: 0.85; }

    /* Status colors — dark mode palette */
    .s-draft     { background:#1a1a1a; color:#666; border-color:#222; }
    .s-approved  { background:#0d2318; color:#34d399; border-color:#064e3b; }
    .s-scheduled { background:#1c1506; color:#fbbf24; border-color:#451a03; }
    .s-posted    { background:#13102a; color:#a78bfa; border-color:#2e1065; }

    .dot-draft     { background:#444; }
    .dot-approved  { background:#34d399; }
    .dot-scheduled { background:#fbbf24; }
    .dot-posted    { background:#a78bfa; }

    .p-instagram { background:#3a0d1e; color:#f9a8d4; border-color:#9d174d; }
    .p-tiktok    { background:#111; color:#94a3b8; border-color:#1e293b; }
    .p-youtube   { background:#2d0a0a; color:#fca5a5; border-color:#7f1d1d; }
    .p-linkedin  { background:#0a1628; color:#93c5fd; border-color:#1e3a5f; }
    .p-facebook  { background:#0a1428; color:#6ee7b7; border-color:#064e3b; }
  `;
  document.head.appendChild(s);
})();

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES  = ["Draft", "Approved", "Scheduled", "Posted"];
const PLATFORMS = ["Instagram", "TikTok", "YouTube", "LinkedIn", "Facebook"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const STATUS_META = {
  Draft:     { label:"Draft",     cls:"s-draft",     dot:"dot-draft",     icon:"○" },
  Approved:  { label:"Approved",  cls:"s-approved",  dot:"dot-approved",  icon:"◉" },
  Scheduled: { label:"Scheduled", cls:"s-scheduled", dot:"dot-scheduled", icon:"◷" },
  Posted:    { label:"Posted",    cls:"s-posted",    dot:"dot-posted",    icon:"✓" },
};

const PLATFORM_META = {
  Instagram: { emoji:"📷", cls:"p-instagram" },
  TikTok:    { emoji:"🎵", cls:"p-tiktok"    },
  YouTube:   { emoji:"▶",  cls:"p-youtube"   },
  LinkedIn:  { emoji:"💼", cls:"p-linkedin"  },
  Facebook:  { emoji:"📘", cls:"p-facebook"  },
};

const PRIORITY_META = {
  Low:    { color:"#444",    label:"Low"    },
  Medium: { color:"#fbbf24", label:"Medium" },
  High:   { color:"#fb923c", label:"High"   },
  Urgent: { color:"#f87171", label:"Urgent" },
};

const NAV = [
  { id:"home",          label:"Home",          icon:Home       },
  { id:"calendar",      label:"Calendar",      icon:Calendar   },
  { id:"board",         label:"Board",         icon:Columns    },
  { id:"list",          label:"All Posts",     icon:List       },
  { id:"inbox",         label:"Idea Inbox",    icon:Lightbulb  },
  { id:"vault",         label:"Content Vault", icon:Archive    },
  { id:"activity",      label:"Activity",      icon:Activity   },
];

// ─── Utils ────────────────────────────────────────────────────────────────────
const fmt = d => [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");
const stripTime = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const normUrl = v => {
  if (!v?.trim()) return "";
  const s = v.trim().startsWith("http") ? v.trim() : `https://${v.trim()}`;
  try { const u=new URL(s); return ["http:","https:"].includes(u.protocol)?u.toString():""; } catch { return ""; }
};
const buildGrid = (date, posts) => {
  const y=date.getFullYear(), m=date.getMonth();
  const first=new Date(y,m,1).getDay(), days=new Date(y,m+1,0).getDate();
  const cells=Array(first).fill(null);
  for (let d=1;d<=days;d++) { const k=fmt(new Date(y,m,d)); cells.push({day:d,date:k,posts:posts.filter(p=>p.date===k)}); }
  return cells;
};
const relDate = s => {
  if (!s) return "";
  const diff = Math.round((new Date(`${s}T00:00:00`)-stripTime(new Date()))/(864e5));
  if (diff===0) return "Today"; if (diff===1) return "Tomorrow"; if (diff===-1) return "Yesterday";
  if (diff>0&&diff<8) return `In ${diff}d`; if (diff<0&&diff>-8) return `${Math.abs(diff)}d ago`;
  return new Date(`${s}T00:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric"});
};
const seedDB = () => ({ideas:[],posts:[],vault:[],notifications:[]});

// ─── Context ──────────────────────────────────────────────────────────────────
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [db, setDB]           = useState(seedDB());
  const [view, setView]       = useState("home");
  const [search, setSearch]   = useState("");
  const [selDate, setSelDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");
  const [editPost, setEdit]   = useState(null);
  const [sidebar, setSidebar] = useState(true);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [quickAdd, setQA]     = useState(false);
  const [filterStatus, setFS] = useState("all");
  const [filterPlatform, setFP] = useState("all");
  const [sortBy, setSortBy]   = useState("date");

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const fn = e => {
      if ((e.metaKey||e.ctrlKey) && e.key==="k") { e.preventDefault(); setCmdOpen(o=>!o); }
      if (e.key==="Escape") { setCmdOpen(false); setQA(false); }
      if ((e.metaKey||e.ctrlKey) && e.key==="n") { e.preventDefault(); setQA(true); }
    };
    window.addEventListener("keydown",fn);
    return () => window.removeEventListener("keydown",fn);
  },[]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
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
      if(p.error)throw p.error; if(i.error)throw i.error; if(v.error)throw v.error; if(n.error)throw n.error;
      setDB({posts:p.data??[],ideas:i.data??[],vault:v.data??[],notifications:n.data??[]});
    } catch(e) { setErr(e.message||"Could not load data."); }
    finally { if(loader) setLoading(false); }
  },[]);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let t;
    const deb = () => { clearTimeout(t); t=setTimeout(()=>fetchAll(false),200); };
    fetchAll(true);
    const ch = supabase.channel("dh-os-v1")
      .on("postgres_changes",{event:"*",schema:"public",table:"posts"},deb)
      .on("postgres_changes",{event:"*",schema:"public",table:"ideas"},deb)
      .on("postgres_changes",{event:"*",schema:"public",table:"vault"},deb)
      .on("postgres_changes",{event:"*",schema:"public",table:"notifications"},deb)
      .subscribe();
    return () => { clearTimeout(t); supabase.removeChannel(ch); };
  },[fetchAll]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q=search.toLowerCase();
    return db.posts
      .filter(p => {
        const matchQ = !q || ["title","platform","status","caption","notes","feedback"].some(k=>(p[k]||"").toLowerCase().includes(q));
        const matchS = filterStatus==="all" || p.status===filterStatus;
        const matchP = filterPlatform==="all" || p.platform===filterPlatform;
        return matchQ && matchS && matchP;
      })
      .sort((a,b) => {
        if (sortBy==="date")   return new Date(a.date)-new Date(b.date);
        if (sortBy==="title")  return (a.title||"").localeCompare(b.title||"");
        if (sortBy==="status") return STATUSES.indexOf(a.status)-STATUSES.indexOf(b.status);
        return 0;
      });
  },[db.posts, search, filterStatus, filterPlatform, sortBy]);

  const upcoming   = useMemo(() => { const t=fmt(new Date()); return filtered.filter(p=>p.date>=t); },[filtered]);
  const thisWeek   = useMemo(() => { const t=stripTime(new Date()),e=stripTime(new Date()); e.setDate(e.getDate()+7); return db.posts.filter(p=>{if(!p.date)return false;const d=new Date(`${p.date}T00:00:00`);return d>=t&&d<=e;}).length; },[db.posts]);
  const grid       = useMemo(() => buildGrid(selDate, db.posts),[selDate,db.posts]);
  const byStatus   = useMemo(() => Object.fromEntries(STATUSES.map(s=>[s,filtered.filter(p=>p.status===s)])),[filtered]);
  const completion = useMemo(() => db.posts.length ? Math.round((db.posts.filter(p=>p.status==="Posted").length/db.posts.length)*100) : 0,[db.posts]);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  async function notif(msg,type="info",rel=null) {
    if(!supabase)return;
    await supabase.from("notifications").insert([{message:msg,type,read:false,related_post_id:rel,updated_at:new Date().toISOString()}]);
  }
  async function addPost(post) {
    if(!supabase)return;
    const{data,error}=await supabase.from("posts").insert([{...post,video_link:normUrl(post.video_link||""),status:post.status||"Draft",priority:post.priority||"Medium",updated_at:new Date().toISOString()}]).select();
    if(error){setErr(error.message);return;}
    if(data?.[0])await notif(`"${data[0].title}" added to calendar.`,"success",data[0].id);
    await fetchAll(false);
  }
  async function updatePost(id,fields) {
    if(!supabase)return false;
    const{data,error}=await supabase.from("posts").update({...fields,video_link:normUrl(fields.video_link||""),updated_at:new Date().toISOString()}).eq("id",id).select();
    if(error){setErr(error.message);return false;}
    if(data?.[0])await notif(`"${data[0].title}" updated.`,"info",data[0].id);
    await fetchAll(false); return true;
  }
  async function deletePost(id) {
    if(!supabase)return;
    const post=db.posts.find(p=>p.id===id);
    await supabase.from("posts").delete().eq("id",id);
    if(post)await notif(`"${post.title}" deleted.`,"warning",id);
    setEdit(prev=>prev?.id===id?null:prev);
    await fetchAll(false);
  }
  async function updateStatus(id,status) {
    if(!supabase)return;
    const{data,error}=await supabase.from("posts").update({status,updated_at:new Date().toISOString()}).eq("id",id).select();
    if(error){setErr(error.message);return;}
    if(data?.[0])await notif(`"${data[0].title}" → ${status}.`,"info",data[0].id);
    setEdit(prev=>prev?.id===id?{...prev,status}:prev);
    await fetchAll(false);
  }
  async function addIdea(text) {
    if(!supabase||!text.trim())return;
    await supabase.from("ideas").insert([{title:text.trim(),platform:"Instagram",notes:"",status:"Idea",updated_at:new Date().toISOString()}]);
    await fetchAll(false);
  }
  async function convertIdea(idea) {
    if(!supabase)return;
    const{data,error}=await supabase.from("posts").insert([{title:idea.title||"Untitled",date:fmt(new Date()),platform:idea.platform||"Instagram",status:"Draft",caption:idea.notes||"",notes:"",video_link:"",feedback:"",priority:"Medium",updated_at:new Date().toISOString()}]).select();
    if(error){setErr(error.message);return;}
    await supabase.from("ideas").delete().eq("id",idea.id);
    await notif(`Post created from idea: "${idea.title}"`,"success",data?.[0]?.id??null);
    await fetchAll(false);
  }
  async function addVault(text) {
    if(!supabase||!text.trim())return;
    await supabase.from("vault").insert([{title:"Saved Content",platform:"General",content:text.trim(),media_url:"",tags:"",updated_at:new Date().toISOString()}]);
    await fetchAll(false);
  }
  async function deleteVault(id) {
    if(!supabase)return;
    await supabase.from("vault").delete().eq("id",id);
    await fetchAll(false);
  }

  const ctx = {
    db, filtered, upcoming, thisWeek, grid, byStatus, completion,
    selDate, setSelDate, view, setView, search, setSearch,
    editPost, setEdit, sidebar, setSidebar, cmdOpen, setCmdOpen,
    quickAdd, setQA, filterStatus, setFS, filterPlatform, setFP,
    sortBy, setSortBy,
    addPost, updatePost, deletePost, updateStatus,
    addIdea, convertIdea, addVault, deleteVault,
    loading, err, setErr,
  };

  return (
    <AppCtx.Provider value={ctx}>
      <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#0f0f0f"}}>
        <Sidebar/>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          <TopBar/>
          {quickAdd && <QuickAddBar/>}
          {err && <ErrBanner/>}
          <main style={{flex:1,overflowY:"auto",overflowX:"hidden"}}>
            {loading ? <LoadingState/> : <ViewRouter/>}
          </main>
        </div>
        {editPost && <EditPanel/>}
        {cmdOpen && <CommandPalette/>}
      </div>
    </AppCtx.Provider>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar() {
  const { view, setView, sidebar, setSidebar, db, upcoming } = useApp();

  return (
    <aside style={{
      width: sidebar?220:48, flexShrink:0,
      background:"#0a0a0a", borderRight:"1px solid #1a1a1a",
      display:"flex", flexDirection:"column",
      transition:"width 0.2s cubic-bezier(.32,.72,0,1)",
      overflow:"hidden", zIndex:20,
    }}>
      {/* Workspace */}
      <div style={{padding:"10px 8px 6px",borderBottom:"1px solid #161616",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"5px 6px",borderRadius:7,cursor:"pointer"}} className="row-hover">
          <div style={{width:26,height:26,borderRadius:6,background:"linear-gradient(135deg,#3b3bf5,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:13}}>🌿</div>
          {sidebar && (
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:12,fontWeight:600,color:"#e8e8e3",lineHeight:1.2}} className="truncate">Deeper Healing</p>
              <p style={{fontSize:10,color:"#444",marginTop:1}}>Content OS</p>
            </div>
          )}
          <button onClick={()=>setSidebar(o=>!o)} className="btn-ghost" style={{padding:4,flexShrink:0,marginLeft:"auto"}}>
            <Menu style={{width:13,height:13}}/>
          </button>
        </div>
      </div>

      {/* Nav */}
      <div style={{padding:"6px 6px",flex:1,overflowY:"auto"}}>
        {sidebar && <p style={{fontSize:10,fontWeight:600,color:"#333",textTransform:"uppercase",letterSpacing:"0.1em",padding:"6px 6px 3px"}}>Workspace</p>}
        {NAV.map(item => {
          const badge = item.id==="activity" ? db.notifications.filter(n=>!n.read).length : item.id==="inbox" ? db.ideas.length : 0;
          return (
            <button key={item.id} onClick={()=>setView(item.id)}
              className={`nav-item ${view===item.id?"active":""}`}
              title={item.label}
              style={{marginBottom:1, justifyContent:sidebar?"flex-start":"center", padding:sidebar?"5px 8px":"6px"}}
            >
              <item.icon style={{width:15,height:15,flexShrink:0,color:view===item.id?"#a78bfa":"inherit"}}/>
              {sidebar && <span style={{flex:1}} className="truncate">{item.label}</span>}
              {sidebar && badge>0 && <span style={{background:"#1e1e2e",color:"#a78bfa",fontSize:10,fontWeight:600,padding:"1px 5px",borderRadius:10,minWidth:18,textAlign:"center"}}>{badge}</span>}
            </button>
          );
        })}

        {sidebar && (
          <>
            <div style={{height:1,background:"#161616",margin:"8px 4px"}}/>
            <p style={{fontSize:10,fontWeight:600,color:"#333",textTransform:"uppercase",letterSpacing:"0.1em",padding:"0 6px 4px"}}>Quick Stats</p>
            <div style={{padding:"6px 8px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              {[
                {label:"Upcoming", value:upcoming.length, color:"#3b3bf5"},
                {label:"This week", value:0, color:"#fbbf24"},
                {label:"Posted", value:db.posts.filter(p=>p.status==="Posted").length, color:"#34d399"},
                {label:"Vault", value:db.vault.length, color:"#a78bfa"},
              ].map(s=>(
                <div key={s.label} style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:6,padding:"6px 8px"}}>
                  <p style={{fontSize:15,fontWeight:700,color:s.color,lineHeight:1}}>{s.value}</p>
                  <p style={{fontSize:9,color:"#444",marginTop:2,textTransform:"uppercase",letterSpacing:"0.08em"}}>{s.label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      {sidebar && (
        <div style={{padding:"8px",borderTop:"1px solid #161616",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:7}} className="row-hover">
            <div style={{width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#3b3bf5,#7c3aed)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:700}}>S</div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:11,fontWeight:500,color:"#aaa"}} className="truncate">Shelley Martin</p>
              <p style={{fontSize:9,color:"#444"}}>Admin</p>
            </div>
            <Settings style={{width:12,height:12,color:"#444"}}/>
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────
function TopBar() {
  const { view, setCmdOpen, setQA, filterStatus, setFS, filterPlatform, setFP, sortBy, setSortBy, search, setSearch } = useApp();
  const label = NAV.find(n=>n.id===view)?.label || "Home";

  return (
    <div style={{height:48,borderBottom:"1px solid #161616",background:"#0a0a0a",display:"flex",alignItems:"center",padding:"0 16px",gap:10,flexShrink:0,zIndex:10}}>

      {/* Breadcrumb */}
      <div style={{display:"flex",alignItems:"center",gap:6,flex:1,minWidth:0}}>
        <span style={{fontSize:11,color:"#444"}}>Deeper Healing</span>
        <ChevronRight style={{width:12,height:12,color:"#2a2a2a"}}/>
        <span style={{fontSize:13,fontWeight:600,color:"#e8e8e3"}}>{label}</span>
      </div>

      {/* Search */}
      <button onClick={()=>setCmdOpen(true)}
        style={{display:"flex",alignItems:"center",gap:8,background:"#111",border:"1px solid #1f1f1f",borderRadius:8,padding:"5px 12px",cursor:"pointer",color:"#555",fontSize:12,minWidth:160,transition:"border-color 0.15s"}}
        onMouseEnter={e=>e.currentTarget.style.borderColor="#2a2a2a"}
        onMouseLeave={e=>e.currentTarget.style.borderColor="#1f1f1f"}
      >
        <Search style={{width:12,height:12}}/>
        <span style={{flex:1,textAlign:"left"}}>Search…</span>
        <kbd style={{fontSize:10,background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:4,padding:"1px 5px",color:"#444"}}>⌘K</kbd>
      </button>

      {/* Filters (only on post views) */}
      {["calendar","board","list"].includes(view) && (
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <select value={filterStatus} onChange={e=>setFS(e.target.value)}
            style={{background:"#111",border:"1px solid #1f1f1f",borderRadius:7,padding:"4px 8px",fontSize:11,color:"#888",cursor:"pointer",outline:"none"}}>
            <option value="all">All status</option>
            {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterPlatform} onChange={e=>setFP(e.target.value)}
            style={{background:"#111",border:"1px solid #1f1f1f",borderRadius:7,padding:"4px 8px",fontSize:11,color:"#888",cursor:"pointer",outline:"none"}}>
            <option value="all">All platforms</option>
            {PLATFORMS.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
            style={{background:"#111",border:"1px solid #1f1f1f",borderRadius:7,padding:"4px 8px",fontSize:11,color:"#888",cursor:"pointer",outline:"none"}}>
            <option value="date">Sort: Date</option>
            <option value="title">Sort: Title</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>
      )}

      {/* New post */}
      <button onClick={()=>setQA(q=>!q)}
        style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:7,background:"#3b3bf5",color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",transition:"background 0.15s",flexShrink:0}}
        onMouseEnter={e=>e.currentTarget.style.background="#2d2dd4"}
        onMouseLeave={e=>e.currentTarget.style.background="#3b3bf5"}
      >
        <Plus style={{width:13,height:13}}/> New post
      </button>
    </div>
  );
}

// ─── View router ──────────────────────────────────────────────────────────────
function ViewRouter() {
  const { view } = useApp();
  return (
    <div className="fade-up" style={{padding:"20px 20px 40px"}}>
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
  const { db, upcoming, thisWeek, completion, setView, setEdit, filtered } = useApp();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour<12?"Good morning":"hour<17"?"Good afternoon":"Good evening";

  const recentPosts = [...db.posts].sort((a,b)=>new Date(b.updated_at||b.date)-new Date(a.updated_at||a.date)).slice(0,4);

  return (
    <div style={{maxWidth:900,margin:"0 auto"}}>
      {/* Hero */}
      <div style={{marginBottom:32}}>
        <p style={{fontSize:13,color:"#555",marginBottom:4}}>{now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
        <h1 className="serif" style={{fontSize:36,fontWeight:600,color:"#e8e8e3",lineHeight:1.1,marginBottom:8}}>
          {hour<12?"Good morning":"Good afternoon"}, Shelley 👋
        </h1>
        <p style={{fontSize:14,color:"#555"}}>Here's your content workspace overview.</p>
      </div>

      {/* KPI row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:24}}>
        {[
          {label:"Total posts",   value:db.posts.length,                                    color:"#3b3bf5", icon:FileText,     sub:"in calendar"},
          {label:"Upcoming",      value:upcoming.length,                                    color:"#a78bfa", icon:Calendar,     sub:"from today"},
          {label:"Posted",        value:db.posts.filter(p=>p.status==="Posted").length,    color:"#34d399", icon:CheckCircle2, sub:"completed"},
          {label:"Completion",    value:`${completion}%`,                                  color:"#fbbf24", icon:Target,       sub:"overall rate"},
        ].map(k=>(
          <div key={k.label} className="card" style={{padding:"16px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <p style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.08em"}}>{k.label}</p>
              <k.icon style={{width:14,height:14,color:k.color}}/>
            </div>
            <p style={{fontSize:28,fontWeight:700,color:k.color,lineHeight:1}}>{k.value}</p>
            <p style={{fontSize:11,color:"#444",marginTop:4}}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="card" style={{padding:16,marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <p style={{fontSize:13,fontWeight:600,color:"#aaa"}}>Content pipeline</p>
          <p style={{fontSize:12,color:"#555"}}>{completion}% complete</p>
        </div>
        <div style={{height:4,background:"#1a1a1a",borderRadius:99,overflow:"hidden",marginBottom:12}}>
          <div style={{height:"100%",width:`${completion}%`,background:"linear-gradient(90deg,#3b3bf5,#a78bfa)",borderRadius:99,transition:"width 0.6s ease"}}/>
        </div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {STATUSES.map(s=>{
            const count=db.posts.filter(p=>p.status===s).length;
            const sm=STATUS_META[s];
            return (
              <button key={s} onClick={()=>{setView("list");}} style={{display:"flex",alignItems:"center",gap:5,background:"transparent",border:"none",cursor:"pointer",padding:"2px 0"}}>
                <span className={`tag ${sm.cls}`}>{sm.icon} {s} <span style={{fontWeight:700}}>{count}</span></span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-col */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {/* Recent */}
        <div className="card">
          <div style={{padding:"14px 16px 10px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <p style={{fontSize:13,fontWeight:600,color:"#aaa"}}>Recent posts</p>
            <button onClick={()=>setView("list")} className="btn-ghost" style={{padding:"3px 8px",fontSize:11}}>View all</button>
          </div>
          {recentPosts.length>0 ? recentPosts.map(p=>(
            <div key={p.id} onClick={()=>setEdit(p)} style={{padding:"10px 16px",borderBottom:"1px solid #111",cursor:"pointer",transition:"background 0.1s"}} className="row-hover">
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:14}}>{PLATFORM_META[p.platform]?.emoji||"📄"}</span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:500,color:"#ddd"}} className="truncate">{p.title}</p>
                  <p style={{fontSize:11,color:"#444",marginTop:1}}>{relDate(p.date)}</p>
                </div>
                <StatusTag status={p.status} small/>
              </div>
            </div>
          )) : <div style={{padding:24,textAlign:"center",color:"#444",fontSize:13}}>No posts yet</div>}
        </div>

        {/* Upcoming */}
        <div className="card">
          <div style={{padding:"14px 16px 10px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <p style={{fontSize:13,fontWeight:600,color:"#aaa"}}>Coming up</p>
            <button onClick={()=>setView("calendar")} className="btn-ghost" style={{padding:"3px 8px",fontSize:11}}>Calendar</button>
          </div>
          {upcoming.length>0 ? upcoming.slice(0,5).map(p=>{
            const sc=STATUS_META[p.status]||STATUS_META.Draft;
            return (
              <div key={p.id} onClick={()=>setEdit(p)} style={{padding:"10px 16px",borderBottom:"1px solid #111",cursor:"pointer",transition:"background 0.1s",display:"flex",alignItems:"center",gap:10}} className="row-hover">
                <span style={{width:6,height:6,borderRadius:"50%",flexShrink:0}} className={sc.dot}/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:500,color:"#ddd"}} className="truncate">{p.title}</p>
                  <p style={{fontSize:11,color:"#444",marginTop:1}}>{relDate(p.date)} · {p.platform}</p>
                </div>
              </div>
            );
          }) : <div style={{padding:24,textAlign:"center",color:"#444",fontSize:13}}>Nothing upcoming</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Calendar view ────────────────────────────────────────────────────────────
function CalendarView() {
  const { db, filtered, upcoming, selDate, setSelDate, grid, setEdit, deletePost, updateStatus } = useApp();
  const todayKey=fmt(new Date()), selKey=fmt(selDate);
  const dayPosts=db.posts.filter(p=>p.date===selKey).sort((a,b)=>(a.title||"").localeCompare(b.title||""));

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16,height:"calc(100vh - 110px)"}}>
      {/* Grid */}
      <div className="card" style={{display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Cal header */}
        <div style={{padding:"14px 16px 10px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div>
            <p style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>Calendar</p>
            <h2 className="serif" style={{fontSize:20,color:"#e8e8e3",fontWeight:600}}>
              {selDate.toLocaleDateString("en-US",{month:"long",year:"numeric"})}
            </h2>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button className="btn-ghost" style={{padding:6}} onClick={()=>setSelDate(new Date(selDate.getFullYear(),selDate.getMonth()-1,1))}><ChevronLeft style={{width:14,height:14}}/></button>
            <button className="btn-ghost" style={{padding:"4px 10px",fontSize:11,fontWeight:500}} onClick={()=>setSelDate(new Date())}>Today</button>
            <button className="btn-ghost" style={{padding:6}} onClick={()=>setSelDate(new Date(selDate.getFullYear(),selDate.getMonth()+1,1))}><ChevronRight style={{width:14,height:14}}/></button>
          </div>
        </div>

        {/* Day labels */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"1px solid #161616",flexShrink:0}}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
            <div key={d} style={{padding:"8px 0",textAlign:"center",fontSize:10,fontWeight:600,color:"#333",textTransform:"uppercase",letterSpacing:"0.1em"}}>{d}</div>
          ))}
        </div>

        {/* Cells */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",flex:1,overflow:"auto"}}>
          {grid.map((cell,i)=>{
            if (!cell) return <div key={`b-${i}`} style={{minHeight:80,borderRight:"1px solid #161616",borderBottom:"1px solid #161616",background:"#0d0d0d"}}/>;
            const isSel=cell.date===selKey, isToday=cell.date===todayKey;
            return (
              <div key={cell.date} onClick={()=>setSelDate(new Date(`${cell.date}T00:00:00`))}
                style={{minHeight:80,borderRight:"1px solid #161616",borderBottom:"1px solid #161616",padding:"6px 6px 4px",cursor:"pointer",background:isSel?"#13102a":isToday?"#0f0f1a":"transparent",transition:"background 0.1s"}}
                className={!isSel?"row-hover":""}
              >
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{
                    fontSize:11,fontWeight:700,
                    color:isSel?"#a78bfa":isToday?"#6366f1":"#555",
                    background:isToday&&!isSel?"#1e1e2e":isSel?"#2e1065":"transparent",
                    borderRadius:4,padding:"1px 4px",display:"inline-block"
                  }}>{cell.day}</span>
                  {cell.posts.length>0&&<span style={{fontSize:9,color:"#444"}}>{cell.posts.length}</span>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:2}}>
                  {cell.posts.slice(0,2).map(p=>{
                    const sc=STATUS_META[p.status]||STATUS_META.Draft;
                    return (
                      <div key={p.id} onClick={e=>{e.stopPropagation();setEdit(p);}}
                        style={{fontSize:9,fontWeight:500,padding:"2px 5px",borderRadius:3,background:"#1a1a1a",border:"1px solid #2a2a2a",display:"flex",alignItems:"center",gap:3,cursor:"pointer"}}
                        className="row-hover"
                      >
                        <span className={sc.dot} style={{width:4,height:4,borderRadius:"50%",flexShrink:0}}/>
                        <span style={{color:"#aaa",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</span>
                      </div>
                    );
                  })}
                  {cell.posts.length>2&&<span style={{fontSize:8,color:"#444",paddingLeft:4}}>+{cell.posts.length-2}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div style={{display:"flex",flexDirection:"column",gap:10,overflowY:"auto"}}>
        <div className="card">
          <div style={{padding:"12px 14px 8px",borderBottom:"1px solid #1a1a1a"}}>
            <p style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>Selected</p>
            <p style={{fontSize:14,fontWeight:600,color:"#ddd"}}>{selDate.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}</p>
          </div>
          <div style={{padding:"6px 8px",maxHeight:240,overflowY:"auto"}}>
            {dayPosts.length>0 ? dayPosts.map(p=><MiniPostRow key={p.id} post={p}/>) : <div style={{padding:"16px",textAlign:"center",color:"#444",fontSize:12}}>Nothing here</div>}
          </div>
        </div>

        <div className="card" style={{flex:1}}>
          <div style={{padding:"12px 14px 8px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <p style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>Queue</p>
              <p style={{fontSize:14,fontWeight:600,color:"#ddd"}}>Coming up</p>
            </div>
            {upcoming.length>0&&<span style={{background:"#13102a",color:"#a78bfa",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20}}>{upcoming.length}</span>}
          </div>
          <div style={{overflowY:"auto",maxHeight:320}}>
            {upcoming.slice(0,8).map(p=>{
              const sc=STATUS_META[p.status]||STATUS_META.Draft;
              const pm=PLATFORM_META[p.platform]||PLATFORM_META.Instagram;
              return (
                <div key={p.id} onClick={()=>setEdit(p)} style={{padding:"8px 14px",borderBottom:"1px solid #111",display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} className="row-hover">
                  <span className={sc.dot} style={{width:6,height:6,borderRadius:"50%",flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12,fontWeight:500,color:"#ccc"}} className="truncate">{p.title}</p>
                    <p style={{fontSize:10,color:"#444",marginTop:1}}>{pm.emoji} {relDate(p.date)}</p>
                  </div>
                  <Pencil style={{width:10,height:10,color:"#333"}}/>
                </div>
              );
            })}
            {upcoming.length===0&&<div style={{padding:20,textAlign:"center",color:"#444",fontSize:12}}>Queue empty</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Board (Kanban) view ──────────────────────────────────────────────────────
function BoardView() {
  const { byStatus, setEdit, updateStatus } = useApp();

  return (
    <div>
      <div style={{marginBottom:16}}>
        <h2 className="serif" style={{fontSize:22,color:"#e8e8e3",fontWeight:600}}>Board</h2>
        <p style={{fontSize:12,color:"#555",marginTop:2}}>Drag posts across stages to update status</p>
      </div>
      <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:12,minHeight:"calc(100vh-200px)"}}>
        {STATUSES.map(status=>{
          const posts=byStatus[status]||[];
          const sm=STATUS_META[status];
          return (
            <div key={status} className="kanban-col">
              {/* Col header */}
              <div style={{padding:"12px 12px 8px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span className={sm.dot} style={{width:7,height:7,borderRadius:"50%"}}/>
                  <span style={{fontSize:12,fontWeight:600,color:"#aaa"}}>{status}</span>
                  <span style={{background:"#1a1a1a",color:"#555",fontSize:10,fontWeight:600,padding:"1px 6px",borderRadius:10}}>{posts.length}</span>
                </div>
                <button className="btn-ghost" style={{padding:3}}>
                  <Plus style={{width:12,height:12}}/>
                </button>
              </div>

              {/* Cards */}
              <div style={{flex:1,overflowY:"auto",padding:"6px 0 8px"}}>
                {posts.map(p=><KanbanCard key={p.id} post={p} onEdit={()=>setEdit(p)} onStatus={s=>updateStatus(p.id,s)}/>)}
                {posts.length===0&&(
                  <div style={{padding:"20px 12px",textAlign:"center",color:"#333",fontSize:12}}>No posts here</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({ post, onEdit, onStatus }) {
  const pm=PLATFORM_META[post.platform]||PLATFORM_META.Instagram;
  const pr=PRIORITY_META[post.priority]||PRIORITY_META.Medium;

  return (
    <div className="kanban-card" onClick={onEdit}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:8}}>
        <p style={{fontSize:13,fontWeight:500,color:"#ddd",lineHeight:1.4,flex:1}}>{post.title}</p>
        <span style={{fontSize:14,flexShrink:0}}>{pm.emoji}</span>
      </div>
      {post.notes&&<p style={{fontSize:11,color:"#555",lineHeight:1.5,marginBottom:8,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{post.notes}</p>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <span style={{width:5,height:5,borderRadius:"50%",background:pr.color,flexShrink:0}}/>
          <span style={{fontSize:10,color:"#555"}}>{post.priority||"Medium"}</span>
        </div>
        {post.date&&<span style={{fontSize:10,color:"#555"}}>{relDate(post.date)}</span>}
      </div>
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────
function ListView() {
  const { filtered, setEdit, updateStatus, deletePost } = useApp();
  const [expanded, setExpanded] = useState(null);

  return (
    <div>
      <div style={{marginBottom:16,display:"flex",alignItems:"baseline",gap:12}}>
        <h2 className="serif" style={{fontSize:22,color:"#e8e8e3",fontWeight:600}}>All Posts</h2>
        <span style={{fontSize:12,color:"#555"}}>{filtered.length} items</span>
      </div>

      <div className="card" style={{overflow:"hidden"}}>
        {/* Table header */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 100px 90px 80px 80px 40px",gap:8,padding:"8px 16px",borderBottom:"1px solid #1a1a1a",alignItems:"center"}}>
          {["Title","Platform","Status","Priority","Date",""].map(h=>(
            <p key={h} style={{fontSize:10,fontWeight:600,color:"#444",textTransform:"uppercase",letterSpacing:"0.08em"}}>{h}</p>
          ))}
        </div>

        {/* Rows */}
        {filtered.length>0 ? filtered.map(p=>{
          const pm=PLATFORM_META[p.platform]||PLATFORM_META.Instagram;
          const sm=STATUS_META[p.status]||STATUS_META.Draft;
          const pr=PRIORITY_META[p.priority]||PRIORITY_META.Medium;
          const isExp=expanded===p.id;
          return (
            <div key={p.id} style={{borderBottom:"1px solid #111"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 100px 90px 80px 80px 40px",gap:8,padding:"10px 16px",alignItems:"center",cursor:"pointer",transition:"background 0.1s"}} className="row-hover"
                onClick={()=>setExpanded(isExp?null:p.id)}>
                <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                  <span className={sm.dot} style={{width:6,height:6,borderRadius:"50%",flexShrink:0}}/>
                  <p style={{fontSize:13,fontWeight:500,color:"#ddd"}} className="truncate">{p.title}</p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:12}}>{pm.emoji}</span>
                  <span style={{fontSize:11,color:"#666"}}>{p.platform}</span>
                </div>
                <StatusTag status={p.status} small/>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:pr.color}}/>
                  <span style={{fontSize:11,color:"#666"}}>{p.priority||"Med"}</span>
                </div>
                <span style={{fontSize:11,color:"#555"}}>{relDate(p.date)}</span>
                <div style={{display:"flex",gap:2}}>
                  <button className="btn-ghost" style={{padding:4}} onClick={e=>{e.stopPropagation();setEdit(p);}}><Pencil style={{width:11,height:11}}/></button>
                  <button className="btn-ghost" style={{padding:4}} onClick={e=>{e.stopPropagation();deletePost(p.id);}}><Trash2 style={{width:11,height:11,color:"#f87171"}}/></button>
                </div>
              </div>

              {/* Expanded row */}
              {isExp && (
                <div className="fade-in" style={{padding:"10px 16px 14px",background:"#111",borderTop:"1px solid #1a1a1a"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,maxWidth:700}}>
                    {post.notes    && <MiniDetailBlock label="Notes"    value={p.notes}/>}
                    {p.caption     && <MiniDetailBlock label="Caption"  value={p.caption}/>}
                    {p.feedback    && <MiniDetailBlock label="Feedback" value={p.feedback}/>}
                    {p.video_link  && (
                      <div>
                        <p style={{fontSize:9,fontWeight:600,color:"#444",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Video</p>
                        <a href={normUrl(p.video_link)} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#6366f1",display:"flex",alignItems:"center",gap:4}}>
                          <ExternalLink style={{width:11,height:11}}/>Open link
                        </a>
                      </div>
                    )}
                  </div>
                  <div style={{marginTop:12,display:"flex",gap:6,flexWrap:"wrap"}}>
                    {STATUSES.map(s=>(
                      <button key={s} onClick={()=>updateStatus(p.id,s)}
                        style={{padding:"3px 10px",borderRadius:5,border:"1px solid #222",background:p.status===s?"#3b3bf5":"#141414",color:p.status===s?"#fff":"#666",fontSize:11,fontWeight:500,cursor:"pointer",transition:"all 0.1s"}}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <div style={{padding:48,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:10}}>📋</div>
            <p style={{fontSize:14,fontWeight:600,color:"#555",marginBottom:4}}>No posts found</p>
            <p style={{fontSize:12,color:"#333"}}>Try adjusting your filters or add a new post.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inbox view ───────────────────────────────────────────────────────────────
function InboxView() {
  const { db, addIdea, convertIdea } = useApp();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function capture() {
    if (!text.trim()||saving) return;
    setSaving(true);
    await addIdea(text);
    setText(""); setSaving(false);
  }

  return (
    <div style={{maxWidth:780}}>
      <div style={{marginBottom:20}}>
        <h2 className="serif" style={{fontSize:22,color:"#e8e8e3",fontWeight:600}}>Idea Inbox</h2>
        <p style={{fontSize:12,color:"#555",marginTop:3}}>{db.ideas.length} ideas · Capture now, convert later</p>
      </div>

      {/* Capture */}
      <div className="card" style={{padding:16,marginBottom:16}}>
        <p style={{fontSize:11,fontWeight:600,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Capture an idea</p>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="What's the hook? What angle? What format? Dump it here before it disappears…"
          rows={3} className="field" style={{resize:"none",lineHeight:1.6,marginBottom:10}}
          onKeyDown={e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter")capture();}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <p style={{fontSize:10,color:"#333"}}>⌘↵ to capture</p>
          <button onClick={capture} disabled={!text.trim()||saving}
            style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",borderRadius:7,background:"#3b3bf5",color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",opacity:!text.trim()?0.4:1,transition:"all 0.15s"}}>
            {saving?<Loader2 style={{width:12,height:12}} className="spin"/>:<Lightbulb style={{width:12,height:12}}/>}
            {saving?"Capturing…":"Capture idea"}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="card" style={{overflow:"hidden"}}>
        <div style={{padding:"10px 16px",borderBottom:"1px solid #1a1a1a"}}>
          <p style={{fontSize:12,fontWeight:600,color:"#888"}}>Captured ideas</p>
        </div>
        {db.ideas.length>0 ? db.ideas.map((idea,i)=>(
          <div key={idea.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:"1px solid #111",transition:"background 0.1s"}} className="row-hover">
            <span style={{fontSize:12,fontWeight:700,color:"#333",minWidth:20}}>{i+1}.</span>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:13,fontWeight:500,color:"#ddd"}}>{idea.title}</p>
              {idea.notes&&<p style={{fontSize:11,color:"#555",marginTop:2}}>{idea.notes}</p>}
            </div>
            <button onClick={()=>convertIdea(idea)}
              style={{flexShrink:0,display:"flex",alignItems:"center",gap:5,padding:"4px 12px",borderRadius:6,border:"1px solid #2d2d5e",background:"#13102a",color:"#a78bfa",fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.12s",whiteSpace:"nowrap"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#1e1b4b";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#13102a";}}>
              Make post <ArrowRight style={{width:10,height:10}}/>
            </button>
          </div>
        )) : (
          <div style={{padding:48,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:10}}>💡</div>
            <p style={{fontSize:14,fontWeight:600,color:"#555",marginBottom:4}}>No ideas yet</p>
            <p style={{fontSize:12,color:"#333"}}>Type above to capture your first idea.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Vault view ───────────────────────────────────────────────────────────────
function VaultView() {
  const { db, addVault, deleteVault } = useApp();
  const [text, setText] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!text.trim()||saving) return;
    setSaving(true);
    await addVault(text);
    setText(""); setSaving(false);
  }

  return (
    <div style={{maxWidth:900}}>
      <div style={{marginBottom:20}}>
        <h2 className="serif" style={{fontSize:22,color:"#e8e8e3",fontWeight:600}}>Content Vault</h2>
        <p style={{fontSize:12,color:"#555",marginTop:3}}>{db.vault.length} items · Reusable hooks, CTAs, frameworks</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"340px 1fr",gap:16,alignItems:"start"}}>
        {/* Add panel */}
        <div className="card" style={{padding:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{width:24,height:24,borderRadius:6,background:"#0d2318",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Archive style={{width:12,height:12,color:"#34d399"}}/>
            </div>
            <p style={{fontSize:13,fontWeight:600,color:"#aaa"}}>Save to vault</p>
          </div>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Hook, CTA, hashtag set, caption framework, brand voice note…"
            rows={6} className="field" style={{resize:"none",lineHeight:1.6,marginBottom:10}}/>
          <button onClick={save} disabled={!text.trim()||saving}
            style={{width:"100%",padding:"8px",borderRadius:7,background:"#064e3b",color:"#34d399",border:"1px solid #065f46",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,opacity:!text.trim()?0.4:1,transition:"all 0.15s"}}>
            {saving?<Loader2 style={{width:12,height:12}} className="spin"/>:<Upload style={{width:12,height:12}}/>}
            {saving?"Saving…":"Save to vault"}
          </button>
        </div>

        {/* Grid */}
        {db.vault.length>0 ? (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
            {db.vault.map(item=>(
              <div key={item.id} className="card" style={{padding:14,position:"relative",transition:"border-color 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#2a2a2a"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#1f1f1f"}>
                <div style={{width:22,height:22,borderRadius:5,background:"#0d2318",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>
                  <Layers style={{width:11,height:11,color:"#34d399"}}/>
                </div>
                <p style={{fontSize:11,fontWeight:600,color:"#888",marginBottom:5}}>{item.title||"Saved Content"}</p>
                <p style={{fontSize:12,color:"#555",lineHeight:1.6,wordBreak:"break-word"}}>{item.content}</p>

                {confirm===item.id ? (
                  <div style={{marginTop:10,display:"flex",gap:5,alignItems:"center"}}>
                    <p style={{fontSize:10,color:"#f87171",flex:1}}>Delete?</p>
                    <button onClick={()=>{deleteVault(item.id);setConfirm(null);}} style={{padding:"2px 8px",borderRadius:4,background:"#7f1d1d",color:"#fca5a5",border:"none",fontSize:10,fontWeight:700,cursor:"pointer"}}>Yes</button>
                    <button onClick={()=>setConfirm(null)} style={{padding:"2px 8px",borderRadius:4,background:"#1a1a1a",color:"#888",border:"1px solid #222",fontSize:10,fontWeight:700,cursor:"pointer"}}>No</button>
                  </div>
                ) : (
                  <button onClick={()=>setConfirm(item.id)} className="btn-ghost" style={{position:"absolute",top:10,right:10,padding:4,opacity:0}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                    <Trash2 style={{width:11,height:11,color:"#f87171"}}/>
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{padding:60,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:12}}>🗄️</div>
            <p style={{fontSize:14,fontWeight:600,color:"#555",marginBottom:4}}>Vault is empty</p>
            <p style={{fontSize:12,color:"#333"}}>Save hooks, CTAs, and frameworks here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Activity view ────────────────────────────────────────────────────────────
function ActivityView() {
  const { db } = useApp();
  const dotCls = { success:"dot-approved", warning:"dot-scheduled", info:"dot-posted", error:"dot-draft" };
  const bgCls  = { success:"s-approved",   warning:"s-scheduled",   info:"s-posted",   error:"s-draft"   };

  return (
    <div style={{maxWidth:640}}>
      <div style={{marginBottom:20}}>
        <h2 className="serif" style={{fontSize:22,color:"#e8e8e3",fontWeight:600}}>Activity</h2>
        <p style={{fontSize:12,color:"#555",marginTop:3}}>{db.notifications.length} events logged</p>
      </div>

      <div className="card" style={{overflow:"hidden"}}>
        {db.notifications.length>0 ? db.notifications.map((n,i)=>(
          <div key={n.id} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 16px",borderBottom:i<db.notifications.length-1?"1px solid #111":"none",transition:"background 0.1s"}} className="row-hover">
            <div style={{width:24,height:24,borderRadius:"50%",background:"#111",border:"1px solid #1f1f1f",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
              <span className={dotCls[n.type]||"dot-draft"} style={{width:6,height:6,borderRadius:"50%"}}/>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:13,color:"#ccc",lineHeight:1.5}}>{n.message}</p>
              {n.created_at&&<p style={{fontSize:10,color:"#444",marginTop:3}}>{new Date(n.created_at).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</p>}
            </div>
            <span className={`tag ${bgCls[n.type]||"s-draft"}`} style={{fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>{n.type}</span>
          </div>
        )) : (
          <div style={{padding:60,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:12}}>🔔</div>
            <p style={{fontSize:14,fontWeight:600,color:"#555"},marginBottom:4}>No activity yet</p>
            <p style={{fontSize:12,color:"#333"}}>Events will appear here as you work.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Quick Add bar ────────────────────────────────────────────────────────────
function QuickAddBar() {
  const { addPost, setQA } = useApp();
  const [title,setTitle]     = useState("");
  const [date,setDate]       = useState(fmt(new Date()));
  const [platform,setPlatform] = useState("Instagram");
  const [priority,setPriority] = useState("Medium");
  const [saving,setSaving]   = useState(false);
  const ref = useRef(null);
  useEffect(()=>{ ref.current?.focus(); },[]);

  async function submit() {
    if (!title.trim()||saving) return;
    setSaving(true);
    await addPost({title:title.trim(),date,platform,priority,status:"Draft",caption:"",notes:"",video_link:"",feedback:""});
    setSaving(false); setQA(false);
  }

  const inp={background:"#111",border:"1px solid #222",borderRadius:7,padding:"6px 10px",fontSize:13,color:"#e8e8e3",fontFamily:"'Geist',sans-serif",outline:"none",transition:"border-color 0.15s"};

  return (
    <div className="fade-in" style={{background:"#0d0d0d",borderBottom:"1px solid #1a1a1a",padding:"10px 16px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <input ref={ref} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Post title *"
        style={{...inp,flex:2,minWidth:180}} onKeyDown={e=>{if(e.key==="Enter")submit();if(e.key==="Escape")setQA(false);}}/>
      <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{...inp,minWidth:130}}/>
      <select value={platform} onChange={e=>setPlatform(e.target.value)} style={{...inp,minWidth:120}}>
        {PLATFORMS.map(p=><option key={p} value={p}>{PLATFORM_META[p]?.emoji} {p}</option>)}
      </select>
      <select value={priority} onChange={e=>setPriority(e.target.value)} style={{...inp,minWidth:100}}>
        {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
      </select>
      <button onClick={submit} disabled={!title.trim()||saving}
        style={{padding:"6px 16px",borderRadius:7,background:"#3b3bf5",color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5,opacity:!title.trim()?0.4:1,flexShrink:0}}>
        {saving?<Loader2 style={{width:12,height:12}} className="spin"/>:<Plus style={{width:12,height:12}}/>}
        {saving?"Adding…":"Add"}
      </button>
      <button onClick={()=>setQA(false)} className="btn-ghost" style={{padding:6,flexShrink:0}}><X style={{width:14,height:14}}/></button>
    </div>
  );
}

// ─── Edit Panel (slide-out, autosave) ─────────────────────────────────────────
function EditPanel() {
  const { editPost:post, setEdit, updatePost, deletePost, updateStatus } = useApp();
  const [form,setForm] = useState({
    title:      post.title      || "",
    date:       post.date       || fmt(new Date()),
    platform:   post.platform   || "Instagram",
    status:     post.status     || "Draft",
    priority:   post.priority   || "Medium",
    notes:      post.notes      || "",
    video_link: post.video_link || "",
    caption:    post.caption    || "",
    feedback:   post.feedback   || "",
  });
  const [saveState, setSaveState] = useState("idle");
  const timer = useRef(null);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) { isFirst.current=false; return; }
    setSaveState("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(async()=>{
      setSaveState("saving");
      await updatePost(post.id, form);
      setSaveState("saved");
      setTimeout(()=>setSaveState("idle"),2000);
    },1500);
    return ()=>clearTimeout(timer.current);
  },[form]);

  const sf = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const handleStatus = async s => { setForm(f=>({...f,status:s})); await updateStatus(post.id,s); };

  useEffect(()=>{
    const fn=e=>{if(e.key==="Escape")setEdit(null);};
    window.addEventListener("keydown",fn); return()=>window.removeEventListener("keydown",fn);
  },[setEdit]);

  const inp = {width:"100%",background:"#111",border:"1px solid #1f1f1f",borderRadius:8,padding:"9px 12px",fontSize:13,color:"#e8e8e3",fontFamily:"'Geist',sans-serif",outline:"none",transition:"border-color 0.15s"};
  const focusStyle = {borderColor:"#3b3bf5"};

  return (
    <>
      <div style={{position:"fixed",inset:0,zIndex:40,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(3px)"}} onClick={()=>setEdit(null)}/>
      <div className="slide-in" style={{position:"fixed",right:0,top:0,zIndex:50,height:"100%",width:"100%",maxWidth:500,display:"flex",flexDirection:"column",background:"#0d0d0d",borderLeft:"1px solid #1a1a1a",boxShadow:"-20px 0 60px rgba(0,0,0,0.5)"}}>

        {/* Header */}
        <div style={{padding:"12px 16px",borderBottom:"1px solid #1a1a1a",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:"#0a0a0a"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:26,height:26,borderRadius:6,background:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <FileEdit style={{width:13,height:13,color:"#6366f1"}}/>
            </div>
            <span style={{fontSize:13,fontWeight:600,color:"#aaa"}}>Edit Post</span>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              {saveState==="dirty"&&<span style={{fontSize:10,color:"#555",display:"flex",alignItems:"center",gap:3}}><span className="pulse" style={{width:4,height:4,borderRadius:"50%",background:"#fbbf24",display:"inline-block"}}/>Editing</span>}
              {saveState==="saving"&&<span style={{fontSize:10,color:"#555",display:"flex",alignItems:"center",gap:3}}><Loader2 style={{width:10,height:10}} className="spin"/>Saving</span>}
              {saveState==="saved"&&<span style={{fontSize:10,color:"#34d399",display:"flex",alignItems:"center",gap:3}}><Check style={{width:10,height:10}}/>Saved</span>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <button onClick={()=>deletePost(post.id)} className="btn-ghost" style={{padding:"4px 8px",fontSize:11,color:"#f87171",gap:4,display:"flex",alignItems:"center"}}>
              <Trash2 style={{width:11,height:11}}/>Delete
            </button>
            <button onClick={()=>setEdit(null)} className="btn-ghost" style={{padding:6}}>
              <X style={{width:14,height:14}}/>
            </button>
          </div>
        </div>

        {/* Autosave notice */}
        <div style={{padding:"5px 16px",background:"#0f0f1a",borderBottom:"1px solid #1a1a2e",flexShrink:0,display:"flex",alignItems:"center",gap:5}}>
          <Zap style={{width:10,height:10,color:"#6366f1"}}/>
          <p style={{fontSize:10,color:"#3b3bf5"}}>Auto-saves 1.5s after you stop typing · Esc to close</p>
        </div>

        {/* Form */}
        <div style={{flex:1,overflowY:"auto",padding:"18px 16px"}}>

          {/* Title */}
          <input value={form.title} onChange={sf("title")} placeholder="Post title"
            className="serif"
            style={{...inp,fontSize:20,fontWeight:600,background:"transparent",border:"none",borderBottom:"1px solid #1a1a1a",borderRadius:0,padding:"0 0 12px",marginBottom:18,color:"#e8e8e3"}}
            onFocus={e=>e.target.style.borderBottomColor="#3b3bf5"}
            onBlur={e=>e.target.style.borderBottomColor="#1a1a1a"}/>

          {/* Meta grid */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <PropRow label="Date">
              <input type="date" value={form.date} onChange={sf("date")} style={inp}
                onFocus={e=>e.target.style.borderColor="#3b3bf5"} onBlur={e=>e.target.style.borderColor="#1f1f1f"}/>
            </PropRow>
            <PropRow label="Platform">
              <select value={form.platform} onChange={sf("platform")} style={inp}
                onFocus={e=>e.target.style.borderColor="#3b3bf5"} onBlur={e=>e.target.style.borderColor="#1f1f1f"}>
                {PLATFORMS.map(p=><option key={p} value={p}>{PLATFORM_META[p]?.emoji} {p}</option>)}
              </select>
            </PropRow>
            <PropRow label="Priority">
              <select value={form.priority} onChange={sf("priority")} style={inp}
                onFocus={e=>e.target.style.borderColor="#3b3bf5"} onBlur={e=>e.target.style.borderColor="#1f1f1f"}>
                {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </PropRow>
          </div>

          {/* Status */}
          <PropRow label="Status" style={{marginBottom:16}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:4}}>
              {STATUSES.map(s=>{
                const sm=STATUS_META[s], active=form.status===s;
                return (
                  <button key={s} onClick={()=>handleStatus(s)}
                    style={{display:"flex",alignItems:"center",gap:5,padding:"4px 12px",borderRadius:20,border:"1px solid",borderColor:active?"#3b3bf5":"#222",background:active?"#1e1e2e":"#111",color:active?"#a78bfa":"#555",fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.12s"}}>
                    <span className={sm.dot} style={{width:5,height:5,borderRadius:"50%"}}/>
                    {s}
                  </button>
                );
              })}
            </div>
          </PropRow>

          <div style={{height:1,background:"#1a1a1a",margin:"4px 0 16px"}}/>

          <PropRow label="Notes" style={{marginBottom:12}}>
            <textarea value={form.notes} onChange={sf("notes")} placeholder="Production notes, direction, context…" rows={3}
              style={{...inp,resize:"none",lineHeight:1.6}}
              onFocus={e=>e.target.style.borderColor="#3b3bf5"} onBlur={e=>e.target.style.borderColor="#1f1f1f"}/>
          </PropRow>

          <PropRow label="Video Link" style={{marginBottom:12}}>
            <input value={form.video_link} onChange={sf("video_link")} placeholder="https://drive.google.com/…" style={inp}
              onFocus={e=>e.target.style.borderColor="#3b3bf5"} onBlur={e=>e.target.style.borderColor="#1f1f1f"}/>
          </PropRow>

          <PropRow label="Caption for Approval" style={{marginBottom:12}}>
            <textarea value={form.caption} onChange={sf("caption")} placeholder="Full caption copy for client review…" rows={5}
              style={{...inp,resize:"none",lineHeight:1.6}}
              onFocus={e=>e.target.style.borderColor="#3b3bf5"} onBlur={e=>e.target.style.borderColor="#1f1f1f"}/>
          </PropRow>

          <PropRow label="Feedback / Revisions" style={{marginBottom:12}}>
            <textarea value={form.feedback} onChange={sf("feedback")} placeholder="Client feedback or revision notes…" rows={3}
              style={{...inp,resize:"none",lineHeight:1.6}}
              onFocus={e=>e.target.style.borderColor="#3b3bf5"} onBlur={e=>e.target.style.borderColor="#1f1f1f"}/>
          </PropRow>
        </div>

        {/* Footer */}
        <div style={{padding:"10px 16px",borderTop:"1px solid #1a1a1a",flexShrink:0,display:"flex",justifyContent:"flex-end"}}>
          <button onClick={()=>setEdit(null)}
            style={{padding:"7px 20px",borderRadius:7,background:"#1a1a1a",color:"#aaa",border:"1px solid #2a2a2a",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="#3b3bf5";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#3b3bf5";}}
            onMouseLeave={e=>{e.currentTarget.style.background="#1a1a1a";e.currentTarget.style.color="#aaa";e.currentTarget.style.borderColor="#2a2a2a";}}>
            Done
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Command Palette (⌘K) ─────────────────────────────────────────────────────
function CommandPalette() {
  const { db, setCmdOpen, setView, setEdit, setQA } = useApp();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const ref = useRef(null);
  useEffect(()=>{ ref.current?.focus(); },[]);

  const results = useMemo(()=>{
    const lq=q.toLowerCase();
    const cmds=[
      {type:"nav",label:"Go to Home",       action:()=>{setView("home");    setCmdOpen(false);}, icon:Home},
      {type:"nav",label:"Go to Calendar",   action:()=>{setView("calendar");setCmdOpen(false);}, icon:Calendar},
      {type:"nav",label:"Go to Board",      action:()=>{setView("board");   setCmdOpen(false);}, icon:Columns},
      {type:"nav",label:"Go to All Posts",  action:()=>{setView("list");    setCmdOpen(false);}, icon:List},
      {type:"nav",label:"Go to Idea Inbox", action:()=>{setView("inbox");   setCmdOpen(false);}, icon:Lightbulb},
      {type:"nav",label:"Go to Vault",      action:()=>{setView("vault");   setCmdOpen(false);}, icon:Archive},
      {type:"nav",label:"New post (⌘N)",    action:()=>{setQA(true);        setCmdOpen(false);}, icon:Plus},
    ];
    const postHits=lq ? db.posts.filter(p=>(p.title||"").toLowerCase().includes(lq)).slice(0,5).map(p=>({type:"post",label:p.title,sub:p.platform+" · "+relDate(p.date),action:()=>{setEdit(p);setCmdOpen(false);},icon:FileText})) : [];
    return [...(lq?cmds.filter(c=>c.label.toLowerCase().includes(lq)):cmds), ...postHits];
  },[q,db.posts]);

  useEffect(()=>setSel(0),[results.length]);

  function handleKey(e) {
    if (e.key==="ArrowDown") { e.preventDefault(); setSel(s=>Math.min(s+1,results.length-1)); }
    if (e.key==="ArrowUp")   { e.preventDefault(); setSel(s=>Math.max(s-1,0)); }
    if (e.key==="Enter")     { e.preventDefault(); results[sel]?.action?.(); }
    if (e.key==="Escape")    { setCmdOpen(false); }
  }

  return (
    <div className="cmd-backdrop fade-in" onClick={()=>setCmdOpen(false)}>
      <div className="scale-in card" style={{width:"100%",maxWidth:520,overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,0.8)"}} onClick={e=>e.stopPropagation()}>
        {/* Search */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderBottom:"1px solid #1a1a1a"}}>
          <Search style={{width:15,height:15,color:"#555",flexShrink:0}}/>
          <input ref={ref} value={q} onChange={e=>setQ(e.target.value)} onKeyDown={handleKey}
            placeholder="Search posts, navigate, or run a command…"
            style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:14,color:"#e8e8e3",fontFamily:"'Geist',sans-serif"}}/>
          <kbd style={{fontSize:10,background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:4,padding:"2px 6px",color:"#555",flexShrink:0}}>Esc</kbd>
        </div>

        {/* Results */}
        <div style={{maxHeight:340,overflowY:"auto",padding:"6px 0"}}>
          {results.length>0 ? results.map((r,i)=>(
            <button key={i} onClick={r.action}
              style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"8px 14px",border:"none",cursor:"pointer",textAlign:"left",background:sel===i?"#1a1a1a":"transparent",transition:"background 0.1s"}}
              onMouseEnter={()=>setSel(i)}>
              <r.icon style={{width:14,height:14,color:sel===i?"#a78bfa":"#555",flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:13,color:sel===i?"#e8e8e3":"#aaa",fontWeight:sel===i?500:400}} className="truncate">{r.label}</p>
                {r.sub&&<p style={{fontSize:11,color:"#555",marginTop:1}} className="truncate">{r.sub}</p>}
              </div>
              <span style={{fontSize:9,color:"#333",textTransform:"uppercase",letterSpacing:"0.08em"}}>{r.type}</span>
            </button>
          )) : (
            <div style={{padding:"24px",textAlign:"center",color:"#444",fontSize:13}}>No results</div>
          )}
        </div>

        <div style={{padding:"8px 14px",borderTop:"1px solid #1a1a1a",display:"flex",gap:12}}>
          {[["↑↓","Navigate"],["↵","Select"],["Esc","Close"]].map(([k,l])=>(
            <div key={k} style={{display:"flex",alignItems:"center",gap:5}}>
              <kbd style={{fontSize:10,background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:4,padding:"1px 5px",color:"#555"}}>{k}</kbd>
              <span style={{fontSize:10,color:"#444"}}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────
function MiniPostRow({ post }) {
  const { setEdit, updateStatus } = useApp();
  const [open,setOpen] = useState(false);
  const sm=STATUS_META[post.status]||STATUS_META.Draft;
  const pm=PLATFORM_META[post.platform]||PLATFORM_META.Instagram;
  const url=normUrl(post.video_link);

  return (
    <div style={{borderBottom:"1px solid #111",marginBottom:2}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 6px",borderRadius:6,cursor:"pointer"}} className="row-hover">
        <span className={sm.dot} style={{width:5,height:5,borderRadius:"50%",flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}} onClick={()=>setEdit(post)}>
          <p style={{fontSize:12,fontWeight:500,color:"#ccc"}} className="truncate">{post.title}</p>
          <p style={{fontSize:10,color:"#444",marginTop:1}}>{pm.emoji} {post.platform}</p>
        </div>
        <button onClick={()=>setEdit(post)} className="btn-ghost" style={{padding:3}}><Pencil style={{width:11,height:11}}/></button>
        <button onClick={()=>setOpen(o=>!o)} className="btn-ghost" style={{padding:3}}><ChevronDown style={{width:11,height:11,transform:open?"rotate(180deg)":"none",transition:"transform 0.15s"}}/></button>
      </div>
      {open && (
        <div className="fade-in" style={{padding:"6px 10px 8px",background:"#111",borderRadius:6,marginBottom:4}}>
          {post.notes&&<MiniDetailBlock label="Notes" value={post.notes}/>}
          {url&&<p style={{marginBottom:6}}><span style={{fontSize:9,fontWeight:600,color:"#444",textTransform:"uppercase",letterSpacing:"0.1em"}}>Video · </span><a href={url} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#6366f1"}}>Open link</a></p>}
          {post.caption&&<MiniDetailBlock label="Caption" value={post.caption}/>}
          {post.feedback&&<MiniDetailBlock label="Feedback" value={post.feedback}/>}
          <div style={{marginTop:6,display:"flex",flexWrap:"wrap",gap:4}}>
            {STATUSES.map(s=>(
              <button key={s} onClick={()=>updateStatus(post.id,s)}
                style={{padding:"2px 8px",borderRadius:4,border:"1px solid",borderColor:post.status===s?"#3b3bf5":"#222",background:post.status===s?"#3b3bf5":"#141414",color:post.status===s?"#fff":"#555",fontSize:10,fontWeight:600,cursor:"pointer",transition:"all 0.1s"}}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniDetailBlock({label,value}) {
  return (
    <div style={{marginBottom:8}}>
      <p style={{fontSize:9,fontWeight:600,color:"#444",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>{label}</p>
      <p style={{fontSize:11,color:"#666",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{value}</p>
    </div>
  );
}

function StatusTag({ status, small }) {
  const sm=STATUS_META[status]||STATUS_META.Draft;
  return (
    <span className={`tag ${sm.cls}`} style={{fontSize:small?9:11}}>
      <span className={sm.dot} style={{width:small?4:5,height:small?4:5,borderRadius:"50%"}}/>{status}
    </span>
  );
}

function PropRow({ label, children, style:s }) {
  return (
    <div style={{marginBottom:12,...s}}>
      <p style={{fontSize:10,fontWeight:600,color:"#444",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:5}}>{label}</p>
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"50vh",gap:12}}>
      <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#3b3bf5,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🌿</div>
      <div style={{display:"flex",alignItems:"center",gap:8,color:"#555"}}>
        <Loader2 style={{width:14,height:14}} className="spin"/>
        <span style={{fontSize:13}}>Loading your workspace…</span>
      </div>
    </div>
  );
}

function ErrBanner() {
  const { err, setErr } = useApp();
  return (
    <div className="fade-in" style={{background:"#2d0a0a",borderBottom:"1px solid #7f1d1d",padding:"8px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
      <AlertCircle style={{width:13,height:13,color:"#f87171",flexShrink:0}}/>
      <p style={{flex:1,fontSize:12,color:"#fca5a5"}}>{err}</p>
      <button onClick={()=>setErr("")} className="btn-ghost" style={{padding:4}}><X style={{width:12,height:12,color:"#f87171"}}/></button>
    </div>
  );
}
