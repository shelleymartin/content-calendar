import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Bell, Calendar, ChevronLeft, ChevronRight, Inbox, Layers,
  Plus, Search, Trash2, Upload, Wand2, Link as LinkIcon,
  Pencil, X, Check, Loader2, AlertCircle, ArrowRight,
  ChevronDown, Menu, CheckCircle2, Clock, Zap, FileEdit,
  Hash, Star, MoreHorizontal, Filter, SortAsc, Grid3x3,
  List, LayoutDashboard, ChevronRight as Chevron, Circle,
  BookOpen, Lightbulb, Archive, Activity,
} from "lucide-react";
import { supabase, supabaseConfigError } from "./lib/supabase";

// ─── Google Fonts ─────────────────────────────────────────────────────────────
const _font = document.createElement("link");
_font.rel = "stylesheet";
_font.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap";
document.head.appendChild(_font);

// ─── Global styles ────────────────────────────────────────────────────────────
const _style = document.createElement("style");
_style.textContent = `
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: 'DM Sans', system-ui, sans-serif; background: #f7f7f5; color: #1a1a1a; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d4d4d0; border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: #a8a8a0; }
  * { -webkit-font-smoothing: antialiased; }
  .dh-serif { font-family: 'DM Serif Display', Georgia, serif; }
  .lbl { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #9b9b94; }
  .panel-lbl { display: block; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #9b9b94; margin-bottom: 6px; }
  .fade-in { animation: fadeIn 0.18s ease; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }
  .slide-in { animation: slideIn 0.22s cubic-bezier(.32,.72,0,1); }
  @keyframes slideIn { from { transform:translateX(100%); } to { transform:none; } }
  .hover-row:hover { background: #f0efeb; }
  .task-check:hover .check-inner { border-color: #6366f1; }
  input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.4; cursor: pointer; }
`;
document.head.appendChild(_style);

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES  = ["Draft", "Approved", "Scheduled", "Posted"];
const PLATFORMS = ["Instagram", "TikTok", "YouTube", "LinkedIn", "Facebook"];

const STATUS_CFG = {
  Draft:     { bg:"#f3f3f1", text:"#6b6b63", border:"#e4e4e0", dot:"#c4c4bc", activeBg:"#f3f3f1", activeText:"#6b6b63" },
  Approved:  { bg:"#edfaf4", text:"#1a7a4a", border:"#b3e6cc", dot:"#34c270", activeBg:"#d1f5e4", activeText:"#0f5c36" },
  Scheduled: { bg:"#fff8e7", text:"#8a6200", border:"#f0d78a", dot:"#f0b429", activeBg:"#fef3c7", activeText:"#6d4c00" },
  Posted:    { bg:"#f0eeff", text:"#5b3ec8", border:"#ccc4f5", dot:"#7c6ff7", activeBg:"#e5e0ff", activeText:"#3d2d9e" },
};

const PLATFORM_CFG = {
  Instagram: { emoji:"📷", color:"#e1306c", light:"#fce7f3", text:"#9d174d" },
  TikTok:    { emoji:"🎵", color:"#010101", light:"#f4f4f4", text:"#374151" },
  YouTube:   { emoji:"▶️", color:"#ff0000", light:"#fef2f2", text:"#991b1b" },
  LinkedIn:  { emoji:"💼", color:"#0077b5", light:"#eff6ff", text:"#1e3a5f" },
  Facebook:  { emoji:"📘", color:"#1877f2", light:"#eff6ff", text:"#1e40af" },
};

const NAV_ITEMS = [
  { id:"calendar",      label:"Calendar",      icon:Calendar,      desc:"Monthly planner" },
  { id:"ideas",         label:"Idea Inbox",    icon:Lightbulb,     desc:"Capture & convert" },
  { id:"vault",         label:"Content Vault", icon:Archive,       desc:"Reusable copy" },
  { id:"notifications", label:"Activity",      icon:Activity,      desc:"Updates & alerts" },
];

// ─── Utils ────────────────────────────────────────────────────────────────────
function fmt(d) {
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");
}
function stripTime(d) { return new Date(d.getFullYear(),d.getMonth(),d.getDate()); }
function safeUrl(v) {
  if (!v?.trim()) return "";
  const s = v.trim().startsWith("http") ? v.trim() : `https://${v.trim()}`;
  try { const u=new URL(s); return ["http:","https:"].includes(u.protocol)?u.toString():""; } catch { return ""; }
}
function buildGrid(date, posts) {
  const y=date.getFullYear(), m=date.getMonth();
  const first=new Date(y,m,1).getDay(), days=new Date(y,m+1,0).getDate();
  const cells=Array(first).fill(null);
  for (let d=1;d<=days;d++) { const key=fmt(new Date(y,m,d)); cells.push({day:d,date:key,posts:posts.filter(p=>p.date===key)}); }
  return cells;
}
function relativeDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  const today = stripTime(new Date());
  const diff = Math.round((d-today)/(1000*60*60*24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 0 && diff < 7) return `In ${diff} days`;
  if (diff < 0 && diff > -7) return `${Math.abs(diff)} days ago`;
  return d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
}
function seedDB() { return {ideas:[],posts:[],vault:[],notifications:[]}; }

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [db, setDB]             = useState(seedDB());
  const [view, setView]         = useState("calendar");
  const [search, setSearch]     = useState("");
  const [selectedDate, setSel]  = useState(new Date());
  const [showAdd, setShowAdd]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [appErr, setAppErr]     = useState("");
  const [editPost, setEditPost] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);

  const fetchAll = useCallback(async (loader=false) => {
    if (!supabase) return;
    if (loader) setLoading(true);
    setAppErr("");
    try {
      const [p,i,v,n] = await Promise.all([
        supabase.from("posts").select("*").order("date",{ascending:true}),
        supabase.from("ideas").select("*").order("created_at",{ascending:false}),
        supabase.from("vault").select("*").order("created_at",{ascending:false}),
        supabase.from("notifications").select("*").order("created_at",{ascending:false}),
      ]);
      if(p.error)throw p.error; if(i.error)throw i.error; if(v.error)throw v.error; if(n.error)throw n.error;
      setDB({posts:p.data??[],ideas:i.data??[],vault:v.data??[],notifications:n.data??[]});
    } catch(e) { setAppErr(e.message||"Could not load data."); }
    finally { if(loader) setLoading(false); }
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let timer;
    const debounce=()=>{ clearTimeout(timer); timer=setTimeout(()=>fetchAll(false),180); };
    fetchAll(true);
    const ch=supabase.channel("dh-v5")
      .on("postgres_changes",{event:"*",schema:"public",table:"posts"},debounce)
      .on("postgres_changes",{event:"*",schema:"public",table:"ideas"},debounce)
      .on("postgres_changes",{event:"*",schema:"public",table:"vault"},debounce)
      .on("postgres_changes",{event:"*",schema:"public",table:"notifications"},debounce)
      .subscribe();
    return ()=>{ clearTimeout(timer); supabase.removeChannel(ch); };
  },[fetchAll]);

  const filtered = useMemo(()=>{
    const q=search.toLowerCase();
    return [...db.posts].filter(p=>["title","platform","status","caption","notes","feedback"].some(k=>(p[k]||"").toLowerCase().includes(q))).sort((a,b)=>new Date(a.date)-new Date(b.date));
  },[db.posts,search]);

  const upcoming = useMemo(()=>{ const t=fmt(new Date()); return filtered.filter(p=>p.date>=t); },[filtered]);
  const weekCount = useMemo(()=>{
    const t=stripTime(new Date()),e=stripTime(new Date()); e.setDate(e.getDate()+7);
    return db.posts.filter(p=>{ if(!p.date)return false; const d=new Date(`${p.date}T00:00:00`); return d>=t&&d<=e; }).length;
  },[db.posts]);
  const grid = useMemo(()=>buildGrid(selectedDate,db.posts),[selectedDate,db.posts]);

  async function notify(message,type="info",related_post_id=null) {
    if(!supabase)return;
    await supabase.from("notifications").insert([{message,type,read:false,related_post_id,updated_at:new Date().toISOString()}]);
  }
  async function addPost(post) {
    if(!supabase)return;
    const{data,error}=await supabase.from("posts").insert([{...post,video_link:safeUrl(post.video_link||""),status:post.status||"Draft",updated_at:new Date().toISOString()}]).select();
    if(error){setAppErr(error.message);return;}
    if(data?.[0])await notify(`${data[0].title} added.`,"success",data[0].id);
    await fetchAll(false);
  }
  async function updatePost(id,fields) {
    if(!supabase)return false;
    const{data,error}=await supabase.from("posts").update({...fields,video_link:safeUrl(fields.video_link||""),updated_at:new Date().toISOString()}).eq("id",id).select();
    if(error){setAppErr(error.message);return false;}
    if(data?.[0])await notify(`${data[0].title} updated.`,"info",data[0].id);
    await fetchAll(false); return true;
  }
  async function deletePost(id) {
    if(!supabase)return;
    const post=db.posts.find(p=>p.id===id);
    const{error}=await supabase.from("posts").delete().eq("id",id);
    if(error){setAppErr(error.message);return;}
    if(post)await notify(`${post.title} deleted.`,"warning",id);
    setEditPost(prev=>prev?.id===id?null:prev);
    await fetchAll(false);
  }
  async function updateStatus(id,status) {
    if(!supabase)return;
    const{data,error}=await supabase.from("posts").update({status,updated_at:new Date().toISOString()}).eq("id",id).select();
    if(error){setAppErr(error.message);return;}
    if(data?.[0])await notify(`${data[0].title} → ${status}.`,"info",data[0].id);
    setEditPost(prev=>prev?.id===id?{...prev,status}:prev);
    await fetchAll(false);
  }
  async function addIdea(text) {
    if(!supabase||!text.trim())return;
    await supabase.from("ideas").insert([{title:text.trim(),platform:"Instagram",notes:"",status:"Idea",updated_at:new Date().toISOString()}]);
    await fetchAll(false);
  }
  async function convertIdea(idea) {
    if(!supabase)return;
    const{data,error}=await supabase.from("posts").insert([{title:idea.title||"Untitled",date:fmt(new Date()),platform:idea.platform||"Instagram",status:"Draft",caption:idea.notes||"",notes:"",video_link:"",feedback:"",updated_at:new Date().toISOString()}]).select();
    if(error){setAppErr(error.message);return;}
    await supabase.from("ideas").delete().eq("id",idea.id);
    await notify(`Post created from idea: ${idea.title}`,"success",data?.[0]?.id??null);
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

  if (supabaseConfigError) {
    return (
      <AppFrame sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} view={view} setView={setView} search={search} setSearch={setSearch} searchFocused={searchFocused} setSearchFocused={setSearchFocused} metrics={{upcoming:0,weekCount:0,vaultCount:0}}>
        <div className="fade-in p-8">
          <div style={{background:"#fff",borderRadius:16,border:"1px solid #e8e8e4",padding:24,display:"flex",gap:16}}>
            <AlertCircle style={{color:"#f59e0b",width:20,height:20,flexShrink:0,marginTop:2}}/>
            <div>
              <p style={{fontWeight:600,color:"#1a1a1a",marginBottom:4}}>Supabase not configured</p>
              <p style={{fontSize:13,color:"#6b6b63",lineHeight:1.6}}>{supabaseConfigError}</p>
            </div>
          </div>
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame
      sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
      view={view} setView={setView}
      search={search} setSearch={setSearch}
      searchFocused={searchFocused} setSearchFocused={setSearchFocused}
      metrics={{upcoming:upcoming.length,weekCount,vaultCount:db.vault.length}}
      showAdd={showAdd} setShowAdd={setShowAdd}
      addPost={addPost}
    >
      {appErr && (
        <div className="fade-in" style={{margin:"12px 24px 0",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
          <AlertCircle style={{color:"#ef4444",width:14,height:14,flexShrink:0}}/>
          <p style={{flex:1,fontSize:13,color:"#991b1b"}}>{appErr}</p>
          <button onClick={()=>setAppErr("")}><X style={{width:14,height:14,color:"#f87171"}}/></button>
        </div>
      )}

      <div style={{padding:"16px 24px 24px"}}>
        {loading ? (
          <div style={{display:"flex",alignItems:"center",gap:8,color:"#9b9b94",padding:32}}>
            <Loader2 style={{width:16,height:16,animation:"spin 1s linear infinite"}}/>
            <span style={{fontSize:13}}>Loading your workspace…</span>
          </div>
        ) : (
          <>
            {view==="calendar"      && <CalendarView posts={db.posts} upcoming={upcoming} deletePost={deletePost} updateStatus={updateStatus} selectedDate={selectedDate} setSel={setSel} grid={grid} onEdit={setEditPost}/>}
            {view==="ideas"         && <IdeasView ideas={db.ideas} addIdea={addIdea} convertIdea={convertIdea}/>}
            {view==="vault"         && <VaultView vault={db.vault} addVault={addVault} deleteVault={deleteVault}/>}
            {view==="notifications" && <NotificationsView notifications={db.notifications}/>}
          </>
        )}
      </div>

      {editPost && (
        <EditPanel
          post={editPost}
          onClose={()=>setEditPost(null)}
          onSave={async(fields)=>{ const ok=await updatePost(editPost.id,fields); if(ok)setEditPost(null); }}
          onDelete={()=>deletePost(editPost.id)}
          onStatusChange={s=>updateStatus(editPost.id,s)}
        />
      )}
    </AppFrame>
  );
}

// ─── App frame (Notion-style layout) ─────────────────────────────────────────
function AppFrame({ children, sidebarOpen, setSidebarOpen, view, setView, search, setSearch, searchFocused, setSearchFocused, metrics, showAdd, setShowAdd, addPost }) {
  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#f7f7f5"}}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside style={{
        width: sidebarOpen?240:52,
        flexShrink:0,
        background:"#ffffff",
        borderRight:"1px solid #e8e8e4",
        display:"flex",
        flexDirection:"column",
        transition:"width 0.2s cubic-bezier(.32,.72,0,1)",
        overflow:"hidden",
        zIndex:10,
      }}>
        {/* Workspace header */}
        <div style={{padding:"12px 10px 8px",borderBottom:"1px solid #f0f0ec",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 6px",borderRadius:8,cursor:"pointer"}}
            className="hover-row">
            <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{fontSize:13}}>🌿</span>
            </div>
            {sidebarOpen && (
              <div style={{minWidth:0,flex:1}}>
                <p style={{fontSize:13,fontWeight:600,color:"#1a1a1a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Deeper Healing</p>
                <p style={{fontSize:10,color:"#9b9b94",marginTop:1}}>Content workspace</p>
              </div>
            )}
            <button onClick={()=>setSidebarOpen(o=>!o)} style={{background:"none",border:"none",padding:4,borderRadius:6,cursor:"pointer",color:"#9b9b94",flexShrink:0,display:"flex",marginLeft:"auto"}} className="hover-row">
              <Menu style={{width:15,height:15}}/>
            </button>
          </div>
        </div>

        {/* Search */}
        {sidebarOpen && (
          <div style={{padding:"8px 10px",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,background:searchFocused?"#fff":"#f7f7f5",border:`1px solid ${searchFocused?"#d4d4f7":"#e8e8e4"}`,borderRadius:8,padding:"5px 8px",transition:"all 0.15s"}}>
              <Search style={{width:13,height:13,color:"#b0b0a8",flexShrink:0}}/>
              <input
                value={search}
                onChange={e=>setSearch(e.target.value)}
                onFocus={()=>setSearchFocused(true)}
                onBlur={()=>setSearchFocused(false)}
                placeholder="Search…"
                style={{border:"none",outline:"none",background:"transparent",fontSize:13,color:"#1a1a1a",width:"100%"}}
              />
              {search && <button onClick={()=>setSearch("")}><X style={{width:12,height:12,color:"#9b9b94"}}/></button>}
            </div>
          </div>
        )}

        {/* Nav */}
        <div style={{padding:"4px 8px",flex:1,overflowY:"auto"}}>
          {sidebarOpen && <p className="lbl" style={{padding:"8px 6px 4px"}}>Views</p>}
          {NAV_ITEMS.map(item=>(
            <button key={item.id} onClick={()=>setView(item.id)} title={item.label}
              style={{
                width:"100%",display:"flex",alignItems:"center",gap:8,
                padding: sidebarOpen?"6px 8px":"6px",
                borderRadius:8,border:"none",cursor:"pointer",textAlign:"left",
                background: view===item.id?"#f0effe":"transparent",
                color: view===item.id?"#6366f1":"#4a4a42",
                marginBottom:2, transition:"all 0.12s",
                justifyContent: sidebarOpen?"flex-start":"center",
              }}
              className={view===item.id?"":"hover-row"}
            >
              <item.icon style={{width:16,height:16,flexShrink:0,color:view===item.id?"#6366f1":"#6b6b63"}}/>
              {sidebarOpen && (
                <div>
                  <p style={{fontSize:13,fontWeight:view===item.id?600:400,lineHeight:1.2}}>{item.label}</p>
                </div>
              )}
            </button>
          ))}

          {sidebarOpen && (
            <>
              <div style={{height:1,background:"#f0f0ec",margin:"12px 4px"}}/>
              <p className="lbl" style={{padding:"0 6px 4px"}}>Quick add</p>
              <button onClick={()=>setShowAdd&&setShowAdd(v=>!v)}
                style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:8,border:"1px dashed #d4d4d0",cursor:"pointer",background:"transparent",color:"#9b9b94",fontSize:13,marginBottom:2,transition:"all 0.12s"}}
                className="hover-row"
              >
                <Plus style={{width:14,height:14}}/>
                New post
              </button>
            </>
          )}
        </div>

        {/* Sidebar metrics footer */}
        {sidebarOpen && (
          <div style={{padding:"10px 12px",borderTop:"1px solid #f0f0ec",flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              {[{label:"Queue",value:metrics.upcoming,color:"#6366f1"},{label:"Week",value:metrics.weekCount,color:"#f59e0b"},{label:"Vault",value:metrics.vaultCount,color:"#10b981"}].map(m=>(
                <div key={m.label} style={{textAlign:"center"}}>
                  <p style={{fontSize:18,fontWeight:700,color:m.color,lineHeight:1}}>{m.value}</p>
                  <p style={{fontSize:9,color:"#9b9b94",marginTop:2,textTransform:"uppercase",letterSpacing:"0.08em"}}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>

        {/* Top bar */}
        <div style={{height:52,borderBottom:"1px solid #e8e8e4",background:"#fff",display:"flex",alignItems:"center",padding:"0 24px",gap:12,flexShrink:0}}>
          {/* Breadcrumb */}
          <div style={{display:"flex",alignItems:"center",gap:6,flex:1}}>
            <span style={{fontSize:12,color:"#9b9b94"}}>Deeper Healing</span>
            <Chevron style={{width:12,height:12,color:"#c4c4bc"}}/>
            <span style={{fontSize:12,fontWeight:600,color:"#1a1a1a"}}>
              {NAV_ITEMS.find(n=>n.id===view)?.label}
            </span>
          </div>

          {/* Actions */}
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {view==="calendar" && (
              <button
                onClick={()=>setShowAdd&&setShowAdd(v=>!v)}
                style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:8,background:"#6366f1",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#5254cc"}
                onMouseLeave={e=>e.currentTarget.style.background="#6366f1"}
              >
                <Plus style={{width:14,height:14}}/> New post
              </button>
            )}
          </div>
        </div>

        {/* Quick Add drawer (inline below topbar) */}
        {showAdd && (
          <div className="fade-in" style={{background:"#fafaf8",borderBottom:"1px solid #e8e8e4",padding:"16px 24px"}}>
            <QuickAdd addPost={addPost} onDone={()=>setShowAdd&&setShowAdd(false)}/>
          </div>
        )}

        {/* Page content */}
        <div style={{flex:1,overflowY:"auto"}}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Calendar view ────────────────────────────────────────────────────────────
function CalendarView({ posts, upcoming, deletePost, updateStatus, selectedDate, setSel, grid, onEdit }) {
  const todayKey=fmt(new Date()), selKey=fmt(selectedDate);
  const dayPosts=posts.filter(p=>p.date===selKey).sort((a,b)=>(a.title||"").localeCompare(b.title||""));
  const [listView, setListView] = useState(false);

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16,height:"100%"}}>

      {/* Calendar */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>

        {/* Page header */}
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",paddingTop:4}}>
          <div>
            <h1 className="dh-serif" style={{fontSize:28,color:"#1a1a1a",marginBottom:2,lineHeight:1.1}}>
              {selectedDate.toLocaleDateString("en-US",{month:"long",year:"numeric"})}
            </h1>
            <p style={{fontSize:13,color:"#9b9b94"}}>{upcoming.length} posts upcoming</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={()=>setSel(new Date(selectedDate.getFullYear(),selectedDate.getMonth()-1,1))}
              style={{width:28,height:28,borderRadius:7,border:"1px solid #e8e8e4",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#6b6b63"}}
              className="hover-row">
              <ChevronLeft style={{width:14,height:14}}/>
            </button>
            <button onClick={()=>setSel(new Date())}
              style={{padding:"4px 12px",borderRadius:7,border:"1px solid #e8e8e4",background:"#fff",fontSize:12,fontWeight:600,color:"#4a4a42",cursor:"pointer"}}
              className="hover-row">Today</button>
            <button onClick={()=>setSel(new Date(selectedDate.getFullYear(),selectedDate.getMonth()+1,1))}
              style={{width:28,height:28,borderRadius:7,border:"1px solid #e8e8e4",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#6b6b63"}}
              className="hover-row">
              <ChevronRight style={{width:14,height:14}}/>
            </button>
            <div style={{width:1,height:20,background:"#e8e8e4",margin:"0 4px"}}/>
            <button onClick={()=>setListView(false)} title="Grid view"
              style={{width:28,height:28,borderRadius:7,border:"1px solid",borderColor:!listView?"#6366f1":"#e8e8e4",background:!listView?"#f0effe":"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:!listView?"#6366f1":"#6b6b63"}}>
              <Grid3x3 style={{width:13,height:13}}/>
            </button>
            <button onClick={()=>setListView(true)} title="List view"
              style={{width:28,height:28,borderRadius:7,border:"1px solid",borderColor:listView?"#6366f1":"#e8e8e4",background:listView?"#f0effe":"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:listView?"#6366f1":"#6b6b63"}}>
              <List style={{width:13,height:13}}/>
            </button>
          </div>
        </div>

        {!listView ? (
          /* Grid calendar */
          <div style={{background:"#fff",borderRadius:16,border:"1px solid #e8e8e4",overflow:"hidden",flex:1}}>
            {/* Day headers */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"1px solid #f0f0ec"}}>
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
                <div key={d} style={{padding:"10px 12px",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#9b9b94",textAlign:"center"}}>{d}</div>
              ))}
            </div>
            {/* Cells */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
              {grid.map((cell,i)=>{
                if(!cell) return <div key={`b-${i}`} style={{minHeight:110,borderRight:"1px solid #f0f0ec",borderBottom:"1px solid #f0f0ec",background:"#fafaf8"}}/>;
                const isSel=cell.date===selKey, isToday=cell.date===todayKey;
                return (
                  <button key={cell.date} onClick={()=>setSel(new Date(`${cell.date}T00:00:00`))}
                    style={{
                      minHeight:110,borderRight:"1px solid #f0f0ec",borderBottom:"1px solid #f0f0ec",
                      padding:"8px 8px 6px",textAlign:"left",cursor:"pointer",border:"none",
                      background: isSel?"#f5f3ff":isToday?"#fffbeb":"#fff",
                      position:"relative",transition:"background 0.12s",
                    }}
                    className={!isSel?"hover-row":""}
                  >
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{
                        fontSize:12,fontWeight:700,
                        color: isSel?"#6366f1":isToday?"#d97706":"#4a4a42",
                        background: isToday&&!isSel?"#fef3c7":isSel?"#ede9fe":"transparent",
                        borderRadius:6,padding:"1px 5px",display:"inline-block"
                      }}>{cell.day}</span>
                      {cell.posts.length>0&&<span style={{fontSize:9,color:"#9b9b94",fontWeight:600}}>{cell.posts.length}</span>}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:2}}>
                      {cell.posts.slice(0,3).map(p=>{
                        const pc=PLATFORM_CFG[p.platform]||PLATFORM_CFG.Instagram;
                        const sc=STATUS_CFG[p.status]||STATUS_CFG.Draft;
                        return (
                          <div key={p.id} style={{
                            background:sc.bg,border:`1px solid ${sc.border}`,
                            borderRadius:5,padding:"2px 6px",
                            display:"flex",alignItems:"center",gap:4,
                            borderLeft:`3px solid ${sc.dot}`,
                          }}>
                            <span style={{fontSize:8}}>{pc.emoji}</span>
                            <span style={{fontSize:10,fontWeight:500,color:sc.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1}}>{p.title}</span>
                          </div>
                        );
                      })}
                      {cell.posts.length>3&&<span style={{fontSize:9,color:"#9b9b94",paddingLeft:6}}>+{cell.posts.length-3} more</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* List view */
          <div style={{background:"#fff",borderRadius:16,border:"1px solid #e8e8e4",overflow:"hidden",flex:1}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #f0f0ec",display:"grid",gridTemplateColumns:"1fr 110px 100px 90px",gap:8}}>
              {["Title","Platform","Status","Date"].map(h=>(
                <p key={h} className="lbl">{h}</p>
              ))}
            </div>
            {posts.length>0 ? posts.map(p=>{
              const pc=PLATFORM_CFG[p.platform]||PLATFORM_CFG.Instagram;
              const sc=STATUS_CFG[p.status]||STATUS_CFG.Draft;
              return (
                <div key={p.id} onClick={()=>onEdit(p)}
                  style={{display:"grid",gridTemplateColumns:"1fr 110px 100px 90px",gap:8,padding:"10px 16px",borderBottom:"1px solid #f7f7f5",cursor:"pointer",alignItems:"center",transition:"background 0.1s"}}
                  className="hover-row">
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{width:3,height:28,background:sc.dot,borderRadius:2,flexShrink:0}}/>
                    <div>
                      <p style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{p.title}</p>
                      {p.notes&&<p style={{fontSize:11,color:"#9b9b94",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:300}}>{p.notes}</p>}
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontSize:12}}>{pc.emoji}</span>
                    <span style={{fontSize:12,color:"#4a4a42"}}>{p.platform}</span>
                  </div>
                  <StatusBadge status={p.status}/>
                  <p style={{fontSize:12,color:"#9b9b94"}}>{relativeDate(p.date)}</p>
                </div>
              );
            }) : (
              <div style={{padding:40,textAlign:"center",color:"#9b9b94",fontSize:13}}>No posts yet. Add one above.</div>
            )}
          </div>
        )}
      </div>

      {/* Right panel */}
      <div style={{display:"flex",flexDirection:"column",gap:12,paddingTop:4}}>

        {/* Selected day */}
        <div style={{background:"#fff",borderRadius:16,border:"1px solid #e8e8e4",overflow:"hidden"}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid #f0f0ec"}}>
            <p className="lbl" style={{marginBottom:2}}>Selected</p>
            <p style={{fontSize:15,fontWeight:700,color:"#1a1a1a"}}>
              {selectedDate.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}
            </p>
          </div>
          <div style={{padding:"10px 12px",maxHeight:320,overflowY:"auto"}}>
            {dayPosts.length>0 ? dayPosts.map(p=>(
              <PostRow key={p.id} post={p} onEdit={()=>onEdit(p)} onDelete={()=>deletePost(p.id)} onStatus={s=>updateStatus(p.id,s)}/>
            )) : (
              <div style={{textAlign:"center",padding:"24px 12px",color:"#9b9b94",fontSize:13}}>Nothing here yet</div>
            )}
          </div>
        </div>

        {/* Upcoming */}
        <div style={{background:"#fff",borderRadius:16,border:"1px solid #e8e8e4",flex:1,overflow:"hidden"}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid #f0f0ec",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <p className="lbl" style={{marginBottom:2}}>Queue</p>
              <p style={{fontSize:15,fontWeight:700,color:"#1a1a1a"}}>Coming up</p>
            </div>
            {upcoming.length>0&&<span style={{background:"#f0effe",color:"#6366f1",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20}}>{upcoming.length}</span>}
          </div>
          <div style={{overflowY:"auto",maxHeight:340}}>
            {upcoming.length>0 ? upcoming.slice(0,8).map(p=>{
              const sc=STATUS_CFG[p.status]||STATUS_CFG.Draft;
              const pc=PLATFORM_CFG[p.platform]||PLATFORM_CFG.Instagram;
              return (
                <button key={p.id} onClick={()=>onEdit(p)}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 16px",border:"none",borderBottom:"1px solid #f7f7f5",background:"transparent",cursor:"pointer",textAlign:"left",transition:"background 0.1s"}}
                  className="hover-row">
                  <span style={{width:8,height:8,borderRadius:"50%",background:sc.dot,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:13,fontWeight:500,color:"#1a1a1a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.title}</p>
                    <p style={{fontSize:11,color:"#9b9b94",marginTop:1}}>{pc.emoji} {relativeDate(p.date)}</p>
                  </div>
                  <Pencil style={{width:11,height:11,color:"#c4c4bc",flexShrink:0}}/>
                </button>
              );
            }) : (
              <div style={{padding:24,textAlign:"center",color:"#9b9b94",fontSize:13}}>Queue is empty</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Post row (day panel) ─────────────────────────────────────────────────────
function PostRow({ post, onEdit, onDelete, onStatus }) {
  const [open,setOpen]=useState(false);
  const sc=STATUS_CFG[post.status]||STATUS_CFG.Draft;
  const pc=PLATFORM_CFG[post.platform]||PLATFORM_CFG.Instagram;
  const url=safeUrl(post.video_link);

  return (
    <div style={{borderBottom:"1px solid #f7f7f5",marginBottom:2}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 4px",borderRadius:8,cursor:"pointer"}} className="hover-row">
        <span style={{width:3,height:32,borderRadius:2,background:sc.dot,flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}} onClick={onEdit}>
          <p style={{fontSize:13,fontWeight:600,color:"#1a1a1a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{post.title}</p>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
            <StatusBadge status={post.status} small/>
            <span style={{fontSize:10,color:"#9b9b94"}}>{pc.emoji} {post.platform}</span>
          </div>
        </div>
        <button onClick={onEdit} style={{padding:4,borderRadius:6,border:"none",background:"transparent",cursor:"pointer",color:"#c4c4bc"}} className="hover-row">
          <Pencil style={{width:12,height:12}}/>
        </button>
        <button onClick={()=>setOpen(o=>!o)} style={{padding:4,borderRadius:6,border:"none",background:"transparent",cursor:"pointer",color:"#c4c4bc"}} className="hover-row">
          <ChevronDown style={{width:12,height:12,transform:open?"rotate(180deg)":"none",transition:"transform 0.15s"}}/>
        </button>
      </div>

      {open && (
        <div className="fade-in" style={{padding:"6px 12px 10px",background:"#fafaf8",borderRadius:8,marginBottom:4}}>
          {post.notes && <MiniField label="Notes" value={post.notes}/>}
          {url && <div style={{marginBottom:8}}><p className="lbl" style={{marginBottom:3}}>Video</p><a href={url} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#6366f1",display:"flex",alignItems:"center",gap:4}}><LinkIcon style={{width:11,height:11}}/>Open video</a></div>}
          {post.caption && <MiniField label="Caption" value={post.caption}/>}
          {post.feedback && <MiniField label="Feedback" value={post.feedback}/>}
          <div>
            <p className="lbl" style={{marginBottom:6}}>Move to</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {STATUSES.map(s=>{
                const c=STATUS_CFG[s]; const active=post.status===s;
                return <button key={s} onClick={()=>onStatus(s)} style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${active?c.dot:c.border}`,background:active?c.dot:"#fff",color:active?"#fff":c.text,fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.1s"}}>{s}</button>;
              })}
            </div>
          </div>
          <button onClick={onDelete} style={{marginTop:10,display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#f87171",background:"none",border:"none",cursor:"pointer",padding:"2px 0"}}><Trash2 style={{width:10,height:10}}/>Delete post</button>
        </div>
      )}
    </div>
  );
}

function MiniField({label,value}) {
  return (
    <div style={{marginBottom:8}}>
      <p className="lbl" style={{marginBottom:3}}>{label}</p>
      <p style={{fontSize:12,color:"#4a4a42",lineHeight:1.5,whiteSpace:"pre-wrap",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{value}</p>
    </div>
  );
}

// ─── Edit panel (Notion-style, autosave) ──────────────────────────────────────
function EditPanel({ post, onClose, onSave, onDelete, onStatusChange }) {
  const [form,setForm]=useState({title:post.title||"",date:post.date||fmt(new Date()),platform:post.platform||"Instagram",status:post.status||"Draft",notes:post.notes||"",video_link:post.video_link||"",caption:post.caption||"",feedback:post.feedback||""});
  const [saving,setSaving]=useState(false);
  const [saveState,setSaveState]=useState("idle"); // idle | saving | saved
  const autoTimer=useRef(null);

  useEffect(()=>{
    if(saveState!=="idle") return;
    clearTimeout(autoTimer.current);
    autoTimer.current=setTimeout(async()=>{
      setSaveState("saving"); setSaving(true);
      await onSave(form);
      setSaving(false); setSaveState("saved");
      setTimeout(()=>setSaveState("idle"),2000);
    },1500);
    return()=>clearTimeout(autoTimer.current);
  },[form]);

  function sf(k){return e=>{setForm(f=>({...f,[k]:e.target.value}));setSaveState("idle");}}
  async function handleStatus(s){setForm(f=>({...f,status:s}));setSaveState("idle");await onStatusChange(s);}

  useEffect(()=>{
    const fn=e=>{if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",fn); return()=>window.removeEventListener("keydown",fn);
  },[onClose]);

  const inp = {
    width:"100%",border:"1px solid #e8e8e4",borderRadius:8,
    padding:"8px 12px",fontSize:13,color:"#1a1a1a",background:"#fff",
    outline:"none",fontFamily:"'DM Sans',system-ui,sans-serif",
    transition:"border-color 0.15s",
  };

  const pc=PLATFORM_CFG[form.platform]||PLATFORM_CFG.Instagram;

  return (
    <>
      <div style={{position:"fixed",inset:0,zIndex:40,background:"rgba(0,0,0,0.18)",backdropFilter:"blur(2px)"}} onClick={onClose}/>
      <div className="slide-in" style={{position:"fixed",right:0,top:0,zIndex:50,height:"100%",width:"100%",maxWidth:520,display:"flex",flexDirection:"column",background:"#fff",boxShadow:"-8px 0 40px rgba(0,0,0,0.12)"}}>

        {/* Panel header */}
        <div style={{padding:"14px 20px",borderBottom:"1px solid #f0f0ec",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:"#fafaf8"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,borderRadius:7,background:pc.light,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:14}}>{pc.emoji}</span>
            </div>
            <span style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>Edit Post</span>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              {saveState==="saving"&&<span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#9b9b94"}}><Loader2 style={{width:11,height:11,animation:"spin 1s linear infinite"}}/>Saving</span>}
              {saveState==="saved"&&<span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#10b981"}}><Check style={{width:11,height:11}}/>Saved</span>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <button onClick={onDelete} style={{padding:"5px 10px",borderRadius:7,border:"1px solid #fecaca",background:"#fff",color:"#f87171",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}} className="hover-row">
              <Trash2 style={{width:12,height:12}}/>Delete
            </button>
            <button onClick={onClose} style={{padding:6,borderRadius:7,border:"1px solid #e8e8e4",background:"#fff",cursor:"pointer",display:"flex",color:"#6b6b63"}} className="hover-row">
              <X style={{width:14,height:14}}/>
            </button>
          </div>
        </div>

        {/* Autosave badge */}
        <div style={{padding:"6px 20px",background:"#f5f3ff",borderBottom:"1px solid #ede9fe",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <Zap style={{width:11,height:11,color:"#8b5cf6"}}/>
          <p style={{fontSize:11,color:"#7c3aed",fontWeight:500}}>Auto-saves 1.5 s after you stop typing · Press Esc to close</p>
        </div>

        {/* Form */}
        <div style={{flex:1,overflowY:"auto",padding:"20px"}}>

          {/* Title — Notion-style large input */}
          <input
            value={form.title} onChange={sf("title")} placeholder="Untitled post"
            style={{...inp,fontSize:22,fontWeight:700,border:"none",borderBottom:"2px solid #f0f0ec",borderRadius:0,padding:"0 0 10px",marginBottom:20,color:"#1a1a1a",fontFamily:"'DM Serif Display',Georgia,serif"}}
            onFocus={e=>e.target.style.borderBottomColor="#6366f1"}
            onBlur={e=>e.target.style.borderBottomColor="#f0f0ec"}
          />

          {/* Meta row */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
            <PropField label="Date">
              <input type="date" value={form.date} onChange={sf("date")}
                style={{...inp,fontSize:13}}
                onFocus={e=>e.target.style.borderColor="#6366f1"}
                onBlur={e=>e.target.style.borderColor="#e8e8e4"}/>
            </PropField>
            <PropField label="Platform">
              <select value={form.platform} onChange={sf("platform")}
                style={{...inp,fontSize:13}}
                onFocus={e=>e.target.style.borderColor="#6366f1"}
                onBlur={e=>e.target.style.borderColor="#e8e8e4"}>
                {PLATFORMS.map(p=><option key={p} value={p}>{PLATFORM_CFG[p].emoji} {p}</option>)}
              </select>
            </PropField>
          </div>

          {/* Status — Asana-style pill selector */}
          <PropField label="Status" style={{marginBottom:20}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:4}}>
              {STATUSES.map(s=>{
                const c=STATUS_CFG[s], active=form.status===s;
                return (
                  <button key={s} onClick={()=>handleStatus(s)}
                    style={{
                      padding:"5px 14px",borderRadius:20,border:`1.5px solid ${active?c.dot:c.border}`,
                      background:active?c.bg:"#fff",color:active?c.activeText:c.text,
                      fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.12s",
                      display:"flex",alignItems:"center",gap:5,
                      boxShadow:active?"0 0 0 3px "+c.border+"80":"none",
                    }}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:c.dot}}/>
                    {s}
                  </button>
                );
              })}
            </div>
          </PropField>

          <div style={{height:1,background:"#f0f0ec",margin:"4px 0 20px"}}/>

          <PropField label="Notes" style={{marginBottom:16}}>
            <textarea value={form.notes} onChange={sf("notes")} placeholder="Production notes, direction, context…" rows={3}
              style={{...inp,resize:"none",lineHeight:1.6}}
              onFocus={e=>e.target.style.borderColor="#6366f1"}
              onBlur={e=>e.target.style.borderColor="#e8e8e4"}/>
          </PropField>

          <PropField label="Video Link" style={{marginBottom:16}}>
            <input value={form.video_link} onChange={sf("video_link")} placeholder="https://drive.google.com/…"
              style={{...inp}}
              onFocus={e=>e.target.style.borderColor="#6366f1"}
              onBlur={e=>e.target.style.borderColor="#e8e8e4"}/>
          </PropField>

          <PropField label="Caption for Approval" style={{marginBottom:16}}>
            <textarea value={form.caption} onChange={sf("caption")} placeholder="Full caption copy ready for client review…" rows={5}
              style={{...inp,resize:"none",lineHeight:1.6}}
              onFocus={e=>e.target.style.borderColor="#6366f1"}
              onBlur={e=>e.target.style.borderColor="#e8e8e4"}/>
          </PropField>

          <PropField label="Feedback / Revision Requests" style={{marginBottom:16}}>
            <textarea value={form.feedback} onChange={sf("feedback")} placeholder="Client feedback or revision notes…" rows={3}
              style={{...inp,resize:"none",lineHeight:1.6}}
              onFocus={e=>e.target.style.borderColor="#6366f1"}
              onBlur={e=>e.target.style.borderColor="#e8e8e4"}/>
          </PropField>
        </div>

        {/* Footer */}
        <div style={{padding:"12px 20px",borderTop:"1px solid #f0f0ec",flexShrink:0,display:"flex",justifyContent:"flex-end"}}>
          <button onClick={onClose}
            style={{padding:"8px 24px",borderRadius:8,background:"#6366f1",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer"}}
            onMouseEnter={e=>e.currentTarget.style.background="#5254cc"}
            onMouseLeave={e=>e.currentTarget.style.background="#6366f1"}>
            Done
          </button>
        </div>
      </div>
    </>
  );
}

function PropField({label,children,style:s}) {
  return (
    <div style={{marginBottom:16,...s}}>
      <p className="panel-lbl">{label}</p>
      {children}
    </div>
  );
}

// ─── Quick Add ────────────────────────────────────────────────────────────────
function QuickAdd({ addPost, onDone }) {
  const [title,setTitle]=useState("");
  const [date,setDate]=useState(fmt(new Date()));
  const [platform,setPlatform]=useState("Instagram");
  const [saving,setSaving]=useState(false);

  async function submit() {
    if(!title.trim()||saving)return;
    setSaving(true);
    await addPost({title:title.trim(),date,platform,status:"Draft",caption:"",notes:"",video_link:"",feedback:""});
    setSaving(false); onDone();
  }

  const inp={border:"1px solid #e8e8e4",borderRadius:8,padding:"7px 12px",fontSize:13,outline:"none",background:"#fff",fontFamily:"'DM Sans',system-ui,sans-serif",transition:"border-color 0.15s"};

  return (
    <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Post title *" autoFocus
        style={{...inp,flex:2,minWidth:200}}
        onFocus={e=>e.target.style.borderColor="#6366f1"} onBlur={e=>e.target.style.borderColor="#e8e8e4"}
        onKeyDown={e=>{if(e.key==="Enter")submit();}}/>
      <input type="date" value={date} onChange={e=>setDate(e.target.value)}
        style={{...inp,flex:1,minWidth:130}}
        onFocus={e=>e.target.style.borderColor="#6366f1"} onBlur={e=>e.target.style.borderColor="#e8e8e4"}/>
      <select value={platform} onChange={e=>setPlatform(e.target.value)}
        style={{...inp,flex:1,minWidth:130}}
        onFocus={e=>e.target.style.borderColor="#6366f1"} onBlur={e=>e.target.style.borderColor="#e8e8e4"}>
        {PLATFORMS.map(p=><option key={p} value={p}>{PLATFORM_CFG[p].emoji} {p}</option>)}
      </select>
      <button onClick={submit} disabled={!title.trim()||saving}
        style={{padding:"7px 20px",borderRadius:8,background:"#6366f1",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,opacity:(!title.trim()||saving)?0.5:1,transition:"all 0.15s"}}
        onMouseEnter={e=>{ if(title.trim()&&!saving)e.currentTarget.style.background="#5254cc"; }}
        onMouseLeave={e=>e.currentTarget.style.background="#6366f1"}>
        {saving?<Loader2 style={{width:13,height:13,animation:"spin 1s linear infinite"}}/>:<Plus style={{width:13,height:13}}/>}
        {saving?"Adding…":"Add post"}
      </button>
      <button onClick={onDone} style={{padding:"7px 12px",borderRadius:8,border:"1px solid #e8e8e4",background:"#fff",color:"#6b6b63",fontSize:13,cursor:"pointer"}} className="hover-row">
        <X style={{width:13,height:13}}/>
      </button>
    </div>
  );
}

// ─── Ideas view ───────────────────────────────────────────────────────────────
function IdeasView({ ideas, addIdea, convertIdea }) {
  const [text,setText]=useState("");

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h1 className="dh-serif" style={{fontSize:28,color:"#1a1a1a",marginBottom:4}}>Idea Inbox</h1>
        <p style={{fontSize:13,color:"#9b9b94"}}>{ideas.length} ideas captured</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"380px 1fr",gap:16,alignItems:"start"}}>
        {/* Capture */}
        <div style={{background:"#fff",borderRadius:16,border:"1px solid #e8e8e4",padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={{width:28,height:28,borderRadius:8,background:"#fef9c3",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Lightbulb style={{width:14,height:14,color:"#d97706"}}/>
            </div>
            <p style={{fontWeight:700,fontSize:14,color:"#1a1a1a"}}>Capture an idea</p>
          </div>
          <textarea value={text} onChange={e=>setText(e.target.value)}
            placeholder="What's the hook? What angle? Drop the raw idea here before it disappears…"
            rows={5}
            style={{width:"100%",border:"1px solid #e8e8e4",borderRadius:10,padding:"10px 12px",fontSize:13,color:"#1a1a1a",resize:"none",outline:"none",lineHeight:1.6,fontFamily:"'DM Sans',system-ui,sans-serif",transition:"border-color 0.15s"}}
            onFocus={e=>e.target.style.borderColor="#6366f1"} onBlur={e=>e.target.style.borderColor="#e8e8e4"}/>
          <button onClick={()=>{ addIdea(text); setText(""); }} disabled={!text.trim()}
            style={{marginTop:10,width:"100%",padding:"9px",borderRadius:9,background:"#1a1a1a",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,opacity:!text.trim()?0.4:1,transition:"all 0.15s"}}
            onMouseEnter={e=>{ if(text.trim())e.currentTarget.style.background="#374151"; }}
            onMouseLeave={e=>e.currentTarget.style.background="#1a1a1a"}>
            <Inbox style={{width:13,height:13}}/>Capture idea
          </button>
        </div>

        {/* List */}
        <div style={{background:"#fff",borderRadius:16,border:"1px solid #e8e8e4",overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid #f0f0ec",display:"grid",gridTemplateColumns:"1fr auto"}}>
            <p className="lbl">Your ideas</p>
            <p className="lbl">{ideas.length} total</p>
          </div>
          {ideas.length>0 ? ideas.map((idea,idx)=>(
            <div key={idea.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:"1px solid #f7f7f5",transition:"background 0.1s"}} className="hover-row">
              <span style={{fontSize:16,color:"#d97706",flexShrink:0,fontWeight:700}}>{idx+1}.</span>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{idea.title}</p>
                {idea.notes&&<p style={{fontSize:11,color:"#9b9b94",marginTop:2}}>{idea.notes}</p>}
              </div>
              <button onClick={()=>convertIdea(idea)}
                style={{flexShrink:0,display:"flex",alignItems:"center",gap:4,padding:"5px 12px",borderRadius:7,border:"1px solid #ddd6fe",background:"#f5f3ff",color:"#6366f1",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.12s",whiteSpace:"nowrap"}}
                onMouseEnter={e=>{ e.currentTarget.style.background="#ede9fe"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="#f5f3ff"; }}>
                Make post <ArrowRight style={{width:11,height:11}}/>
              </button>
            </div>
          )) : (
            <div style={{padding:40,textAlign:"center"}}>
              <p style={{fontSize:32,marginBottom:8}}>💡</p>
              <p style={{fontSize:14,fontWeight:600,color:"#4a4a42",marginBottom:4}}>No ideas yet</p>
              <p style={{fontSize:12,color:"#9b9b94"}}>Captured ideas will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Vault view ───────────────────────────────────────────────────────────────
function VaultView({ vault, addVault, deleteVault }) {
  const [text,setText]=useState("");
  const [confirm,setConfirm]=useState(null);

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h1 className="dh-serif" style={{fontSize:28,color:"#1a1a1a",marginBottom:4}}>Content Vault</h1>
        <p style={{fontSize:13,color:"#9b9b94"}}>{vault.length} items saved</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"380px 1fr",gap:16,alignItems:"start"}}>
        {/* Add */}
        <div style={{background:"#fff",borderRadius:16,border:"1px solid #e8e8e4",padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={{width:28,height:28,borderRadius:8,background:"#d1fae5",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Archive style={{width:14,height:14,color:"#059669"}}/>
            </div>
            <p style={{fontWeight:700,fontSize:14,color:"#1a1a1a"}}>Save to vault</p>
          </div>
          <textarea value={text} onChange={e=>setText(e.target.value)}
            placeholder="Hook, CTA, hashtag set, caption framework — anything reusable…"
            rows={5}
            style={{width:"100%",border:"1px solid #e8e8e4",borderRadius:10,padding:"10px 12px",fontSize:13,color:"#1a1a1a",resize:"none",outline:"none",lineHeight:1.6,fontFamily:"'DM Sans',system-ui,sans-serif",transition:"border-color 0.15s"}}
            onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e8e8e4"}/>
          <button onClick={()=>{ addVault(text); setText(""); }} disabled={!text.trim()}
            style={{marginTop:10,width:"100%",padding:"9px",borderRadius:9,background:"#059669",color:"#fff",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,opacity:!text.trim()?0.4:1,transition:"all 0.15s"}}
            onMouseEnter={e=>{ if(text.trim())e.currentTarget.style.background="#047857"; }}
            onMouseLeave={e=>e.currentTarget.style.background="#059669"}>
            <Upload style={{width:13,height:13}}/>Save to vault
          </button>
        </div>

        {/* Grid */}
        <div>
          {vault.length>0 ? (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
              {vault.map(item=>(
                <div key={item.id} style={{background:"#fff",borderRadius:14,border:"1px solid #e8e8e4",padding:16,position:"relative",transition:"box-shadow 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.06)"}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                  <div style={{width:28,height:28,borderRadius:8,background:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}>
                    <Layers style={{width:13,height:13,color:"#059669"}}/>
                  </div>
                  <p style={{fontSize:12,fontWeight:700,color:"#1a1a1a",marginBottom:6}}>{item.title||"Saved Content"}</p>
                  <p style={{fontSize:12,color:"#4a4a42",lineHeight:1.6}}>{item.content}</p>

                  {confirm===item.id ? (
                    <div style={{marginTop:12,display:"flex",alignItems:"center",gap:6}}>
                      <p style={{fontSize:11,color:"#f87171",flex:1}}>Delete this?</p>
                      <button onClick={()=>{ deleteVault(item.id); setConfirm(null); }}
                        style={{padding:"3px 10px",borderRadius:6,background:"#ef4444",color:"#fff",border:"none",fontSize:11,fontWeight:700,cursor:"pointer"}}>Yes</button>
                      <button onClick={()=>setConfirm(null)}
                        style={{padding:"3px 10px",borderRadius:6,border:"1px solid #e8e8e4",background:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",color:"#6b6b63"}}>No</button>
                    </div>
                  ) : (
                    <button onClick={()=>setConfirm(item.id)}
                      style={{position:"absolute",top:12,right:12,padding:5,borderRadius:6,border:"none",background:"transparent",cursor:"pointer",color:"#c4c4bc",transition:"all 0.12s"}}
                      onMouseEnter={e=>{ e.currentTarget.style.background="#fef2f2"; e.currentTarget.style.color="#f87171"; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#c4c4bc"; }}>
                      <Trash2 style={{width:13,height:13}}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{background:"#fff",borderRadius:16,border:"1px dashed #e8e8e4",padding:60,textAlign:"center"}}>
              <p style={{fontSize:36,marginBottom:12}}>🗄️</p>
              <p style={{fontSize:14,fontWeight:600,color:"#4a4a42",marginBottom:4}}>Vault is empty</p>
              <p style={{fontSize:12,color:"#9b9b94"}}>Save hooks, CTAs, and frameworks here for reuse</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Notifications view ───────────────────────────────────────────────────────
function NotificationsView({ notifications }) {
  const cfg={
    success:{bg:"#f0fdf4",border:"#bbf7d0",dot:"#22c55e",text:"#15803d"},
    warning:{bg:"#fffbeb",border:"#fde68a",dot:"#f59e0b",text:"#92400e"},
    info:   {bg:"#eff6ff",border:"#bfdbfe",dot:"#3b82f6",text:"#1e40af"},
    error:  {bg:"#fef2f2",border:"#fecaca",dot:"#ef4444",text:"#991b1b"},
  };

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h1 className="dh-serif" style={{fontSize:28,color:"#1a1a1a",marginBottom:4}}>Activity</h1>
        <p style={{fontSize:13,color:"#9b9b94"}}>{notifications.length} events</p>
      </div>

      <div style={{background:"#fff",borderRadius:16,border:"1px solid #e8e8e4",overflow:"hidden",maxWidth:680}}>
        {notifications.length>0 ? notifications.map((n,i)=>{
          const c=cfg[n.type]||cfg.info;
          return (
            <div key={n.id} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"14px 20px",borderBottom:i<notifications.length-1?"1px solid #f7f7f5":"none",transition:"background 0.1s"}} className="hover-row">
              <span style={{width:8,height:8,borderRadius:"50%",background:c.dot,flexShrink:0,marginTop:5}}/>
              <div style={{flex:1}}>
                <p style={{fontSize:13,color:"#1a1a1a",lineHeight:1.5}}>{n.message}</p>
                {n.created_at&&<p style={{fontSize:11,color:"#9b9b94",marginTop:3}}>{new Date(n.created_at).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</p>}
              </div>
              <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",padding:"2px 8px",borderRadius:20,background:c.bg,color:c.text,border:`1px solid ${c.border}`}}>{n.type}</span>
            </div>
          );
        }) : (
          <div style={{padding:60,textAlign:"center"}}>
            <p style={{fontSize:36,marginBottom:12}}>🔔</p>
            <p style={{fontSize:14,fontWeight:600,color:"#4a4a42",marginBottom:4}}>No activity yet</p>
            <p style={{fontSize:12,color:"#9b9b94"}}>Updates will appear here as you work</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────
function StatusBadge({ status, small }) {
  const c=STATUS_CFG[status]||STATUS_CFG.Draft;
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:4,
      padding:small?"2px 7px":"3px 9px",
      borderRadius:20,border:`1px solid ${c.border}`,
      background:c.bg,color:c.text,
      fontSize:small?10:11,fontWeight:600,whiteSpace:"nowrap",
    }}>
      <span style={{width:5,height:5,borderRadius:"50%",background:c.dot}}/>
      {status}
    </span>
  );
}
