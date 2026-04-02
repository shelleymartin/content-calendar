/**
 * DEEPER HEALING · CONTENT CALENDAR
 * Premium light-mode SaaS UI
 * Clean · Fast · Interactive · Professional
 */

import React, {
  useEffect, useMemo, useState, useCallback,
  useRef, createContext, useContext,
} from "react";
import {
  Activity, AlertCircle, Archive, ArrowRight, Bell,
  Calendar, Check, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, Clock, ExternalLink, FileText, Hash,
  Inbox, Layers, Lightbulb, Link as LinkIcon, List,
  Loader2, Menu, MoreHorizontal, Pencil, Plus, Search,
  Sparkles, Star, Trash2, Upload, Wand2, X, Zap,
  LayoutDashboard, Columns, Target, Home, Archive as ArchiveIcon,
  Command, Filter,
} from "lucide-react";
import { supabase, supabaseConfigError } from "./lib/supabase";

// ─── Fonts + Global CSS ───────────────────────────────────────────────────────
(() => {
  if (document.getElementById("dh-fonts")) return;
  const l = document.createElement("link");
  l.id = "dh-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap";
  document.head.appendChild(l);
})();

(() => {
  if (document.getElementById("dh-css")) return;
  const s = document.createElement("style");
  s.id = "dh-css";
  s.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #F8F9FA;
      color: #111827;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }

    @keyframes fadeIn   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
    @keyframes slideIn  { from{transform:translateX(100%)} to{transform:none} }
    @keyframes scaleIn  { from{transform:scale(.97);opacity:0} to{transform:none;opacity:1} }
    @keyframes spin     { to{transform:rotate(360deg)} }
    @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }

    .fade-in   { animation: fadeIn  0.2s ease both; }
    .slide-in  { animation: slideIn 0.28s cubic-bezier(.32,.72,0,1) both; }
    .scale-in  { animation: scaleIn 0.18s ease both; }
    .spin      { animation: spin 0.8s linear infinite; }
    .pulse-dot { animation: pulse 1.8s ease infinite; }

    .truncate { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

    /* Reusable interactive */
    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 8px;
      background: #111827; color: #fff;
      font-size: 13px; font-weight: 600;
      border: none; cursor: pointer;
      transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
      font-family: 'Inter', sans-serif;
    }
    .btn-primary:hover  { background: #1F2937; box-shadow: 0 4px 12px rgba(17,24,39,0.2); }
    .btn-primary:active { transform: scale(0.98); }

    .btn-secondary {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 8px;
      background: #fff; color: #374151;
      font-size: 13px; font-weight: 500;
      border: 1px solid #E5E7EB; cursor: pointer;
      transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
      font-family: 'Inter', sans-serif;
    }
    .btn-secondary:hover  { background: #F9FAFB; border-color: #D1D5DB; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .btn-secondary:active { transform: scale(0.98); }

    .btn-ghost {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 8px; border-radius: 6px;
      background: transparent; color: #6B7280;
      font-size: 12px; font-weight: 500;
      border: none; cursor: pointer;
      transition: background 0.12s, color 0.12s;
      font-family: 'Inter', sans-serif;
    }
    .btn-ghost:hover { background: #F3F4F6; color: #111827; }

    .card {
      background: #fff;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03);
    }

    .card-hover {
      transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
      cursor: pointer;
    }
    .card-hover:hover {
      border-color: #D1D5DB;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      transform: translateY(-1px);
    }

    .row-hover { transition: background 0.1s; cursor: pointer; }
    .row-hover:hover { background: #F9FAFB; }

    .nav-item {
      display: flex; align-items: center; gap: 9px;
      padding: 7px 10px; border-radius: 8px;
      background: transparent; color: #6B7280;
      font-size: 13px; font-weight: 500;
      border: none; cursor: pointer; width: 100%; text-align: left;
      transition: background 0.12s, color 0.12s;
      font-family: 'Inter', sans-serif;
    }
    .nav-item:hover { background: #F3F4F6; color: #111827; }
    .nav-item.active {
      background: #EEF2FF; color: #4F46E5; font-weight: 600;
    }
    .nav-item.active svg { color: #4F46E5; }

    /* Field */
    .field {
      width: 100%; background: #fff; border: 1.5px solid #E5E7EB;
      border-radius: 8px; padding: 9px 12px; font-size: 13px;
      color: #111827; font-family: 'Inter', sans-serif; outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .field:focus { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .field::placeholder { color: #9CA3AF; }

    /* Status tags */
    .tag { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid transparent; }
    .tag-draft     { background: #F3F4F6; color: #6B7280; border-color: #E5E7EB; }
    .tag-approved  { background: #ECFDF5; color: #065F46; border-color: #A7F3D0; }
    .tag-scheduled { background: #FFFBEB; color: #92400E; border-color: #FCD34D; }
    .tag-posted    { background: #EEF2FF; color: #3730A3; border-color: #C7D2FE; }

    .dot-draft     { background: #9CA3AF; }
    .dot-approved  { background: #10B981; }
    .dot-scheduled { background: #F59E0B; }
    .dot-posted    { background: #6366F1; }

    /* Platform tags */
    .plat-instagram { background: #FDF2F8; color: #9D174D; border-color: #FBCFE8; }
    .plat-tiktok    { background: #F9FAFB; color: #374151; border-color: #E5E7EB; }
    .plat-youtube   { background: #FEF2F2; color: #991B1B; border-color: #FECACA; }
    .plat-linkedin  { background: #EFF6FF; color: #1E40AF; border-color: #BFDBFE; }
    .plat-facebook  { background: #EFF6FF; color: #1E3A8A; border-color: #BFDBFE; }

    /* Kanban */
    .k-col { flex-shrink:0; width:272px; background:#F9FAFB; border:1px solid #E5E7EB; border-radius:12px; display:flex; flex-direction:column; }
    .k-card { background:#fff; border:1px solid #E5E7EB; border-radius:10px; padding:13px; margin:0 8px 8px; cursor:pointer; transition:border-color 0.15s, box-shadow 0.15s, transform 0.15s; }
    .k-card:hover { border-color:#C7D2FE; box-shadow:0 4px 14px rgba(99,102,241,0.1); transform:translateY(-1px); }

    /* Overlay */
    .overlay { position:fixed; inset:0; z-index:40; background:rgba(0,0,0,0.18); backdrop-filter:blur(3px); }

    /* Command palette */
    .cmd-wrap { position:fixed; inset:0; z-index:200; display:flex; align-items:flex-start; justify-content:center; padding-top:14vh; background:rgba(0,0,0,0.24); backdrop-filter:blur(4px); }
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
  Instagram: { emoji:"📷", cls:"plat-instagram" },
  TikTok:    { emoji:"🎵", cls:"plat-tiktok"    },
  YouTube:   { emoji:"▶",  cls:"plat-youtube"   },
  LinkedIn:  { emoji:"💼", cls:"plat-linkedin"  },
  Facebook:  { emoji:"📘", cls:"plat-facebook"  },
};

const PRIORITY_COLOR = { Low:"#9CA3AF", Medium:"#F59E0B", High:"#F97316", Urgent:"#EF4444" };

const NAV_ITEMS = [
  { id:"home",     label:"Home",          icon:Home          },
  { id:"calendar", label:"Calendar",      icon:Calendar      },
  { id:"board",    label:"Board",         icon:Columns       },
  { id:"list",     label:"All Posts",     icon:List          },
  { id:"inbox",    label:"Idea Inbox",    icon:Lightbulb     },
  { id:"vault",    label:"Content Vault", icon:Archive       },
  { id:"activity", label:"Activity",      icon:Activity      },
];

// ─── Utils ────────────────────────────────────────────────────────────────────
const fmt = d => [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
const stripTime = d => new Date(d.getFullYear(),d.getMonth(),d.getDate());
const normUrl = v => {
  if (!v?.trim()) return "";
  const s = v.trim().startsWith("http") ? v.trim() : `https://${v.trim()}`;
  try { const u=new URL(s); return ["http:","https:"].includes(u.protocol)?u.toString():""; } catch { return ""; }
};
const buildGrid = (date,posts) => {
  const y=date.getFullYear(),m=date.getMonth();
  const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  const cells=Array(first).fill(null);
  for(let d=1;d<=days;d++){const k=fmt(new Date(y,m,d));cells.push({day:d,date:k,posts:posts.filter(p=>p.date===k)});}
  return cells;
};
const relDate = s => {
  if(!s) return "";
  const diff=Math.round((new Date(`${s}T00:00:00`)-stripTime(new Date()))/(864e5));
  if(diff===0)return"Today";if(diff===1)return"Tomorrow";if(diff===-1)return"Yesterday";
  if(diff>0&&diff<8)return`In ${diff}d`;if(diff<0&&diff>-8)return`${Math.abs(diff)}d ago`;
  return new Date(`${s}T00:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric"});
};
const seedDB = () => ({ideas:[],posts:[],vault:[],notifications:[]});

// ─── Context ──────────────────────────────────────────────────────────────────
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [db,setDB]           = useState(seedDB());
  const [view,setView]       = useState("home");
  const [search,setSearch]   = useState("");
  const [selDate,setSelDate] = useState(new Date());
  const [loading,setLoading] = useState(true);
  const [err,setErr]         = useState("");
  const [editPost,setEdit]   = useState(null);
  const [sidebar,setSidebar] = useState(true);
  const [cmdOpen,setCmdOpen] = useState(false);
  const [quickAdd,setQA]     = useState(false);
  const [filterStatus,setFS] = useState("all");
  const [filterPlatform,setFP] = useState("all");
  const [sortBy,setSort]     = useState("date");

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
      const[p,i,v,n]=await Promise.all([
        supabase.from("posts").select("*").order("date",{ascending:true}),
        supabase.from("ideas").select("*").order("created_at",{ascending:false}),
        supabase.from("vault").select("*").order("created_at",{ascending:false}),
        supabase.from("notifications").select("*").order("created_at",{ascending:false}),
      ]);
      if(p.error)throw p.error;if(i.error)throw i.error;if(v.error)throw v.error;if(n.error)throw n.error;
      setDB({posts:p.data??[],ideas:i.data??[],vault:v.data??[],notifications:n.data??[]});
    }catch(e){setErr(e.message||"Could not load data.");}
    finally{if(loader)setLoading(false);}
  },[]);

  useEffect(()=>{
    if(!supabase){setLoading(false);return;}
    let t;
    const deb=()=>{clearTimeout(t);t=setTimeout(()=>fetchAll(false),200);};
    fetchAll(true);
    const ch=supabase.channel("dh-light-v1")
      .on("postgres_changes",{event:"*",schema:"public",table:"posts"},deb)
      .on("postgres_changes",{event:"*",schema:"public",table:"ideas"},deb)
      .on("postgres_changes",{event:"*",schema:"public",table:"vault"},deb)
      .on("postgres_changes",{event:"*",schema:"public",table:"notifications"},deb)
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

  const upcoming=useMemo(()=>{const t=fmt(new Date());return filtered.filter(p=>p.date>=t);},[filtered]);
  const grid=useMemo(()=>buildGrid(selDate,db.posts),[selDate,db.posts]);
  const byStatus=useMemo(()=>Object.fromEntries(STATUSES.map(s=>[s,filtered.filter(p=>p.status===s)])),[filtered]);
  const completion=useMemo(()=>db.posts.length?Math.round(db.posts.filter(p=>p.status==="Posted").length/db.posts.length*100):0,[db.posts]);

  async function notif(msg,type="info",rel=null){
    if(!supabase)return;
    await supabase.from("notifications").insert([{message:msg,type,read:false,related_post_id:rel,updated_at:new Date().toISOString()}]);
  }
  async function addPost(post){
    if(!supabase)return;
    const{data,error}=await supabase.from("posts").insert([{...post,video_link:normUrl(post.video_link||""),status:post.status||"Draft",updated_at:new Date().toISOString()}]).select();
    if(error){setErr(error.message);return;}
    if(data?.[0])await notif(`"${data[0].title}" added.`,"success",data[0].id);
    await fetchAll(false);
  }
  async function updatePost(id,fields){
    if(!supabase)return false;
    const{data,error}=await supabase.from("posts").update({...fields,video_link:normUrl(fields.video_link||""),updated_at:new Date().toISOString()}).eq("id",id).select();
    if(error){setErr(error.message);return false;}
    if(data?.[0])await notif(`"${data[0].title}" updated.`,"info",data[0].id);
    await fetchAll(false);return true;
  }
  async function deletePost(id){
    if(!supabase)return;
    const post=db.posts.find(p=>p.id===id);
    await supabase.from("posts").delete().eq("id",id);
    if(post)await notif(`"${post.title}" deleted.`,"warning",id);
    setEdit(prev=>prev?.id===id?null:prev);
    await fetchAll(false);
  }
  async function updateStatus(id,status){
    if(!supabase)return;
    const{data,error}=await supabase.from("posts").update({status,updated_at:new Date().toISOString()}).eq("id",id).select();
    if(error){setErr(error.message);return;}
    if(data?.[0])await notif(`"${data[0].title}" moved to ${status}.`,"info",data[0].id);
    setEdit(prev=>prev?.id===id?{...prev,status}:prev);
    await fetchAll(false);
  }
  async function addIdea(text){
    if(!supabase||!text.trim())return;
    await supabase.from("ideas").insert([{title:text.trim(),platform:"Instagram",notes:"",status:"Idea",updated_at:new Date().toISOString()}]);
    await fetchAll(false);
  }
  async function convertIdea(idea){
    if(!supabase)return;
    const{data,error}=await supabase.from("posts").insert([{title:idea.title||"Untitled",date:fmt(new Date()),platform:idea.platform||"Instagram",status:"Draft",caption:idea.notes||"",notes:"",video_link:"",feedback:"",updated_at:new Date().toISOString()}]).select();
    if(error){setErr(error.message);return;}
    await supabase.from("ideas").delete().eq("id",idea.id);
    await notif(`Post created from idea: "${idea.title}"`,"success",data?.[0]?.id??null);
    await fetchAll(false);
  }
  async function addVault(text){
    if(!supabase||!text.trim())return;
    await supabase.from("vault").insert([{title:"Saved Content",platform:"General",content:text.trim(),media_url:"",tags:"",updated_at:new Date().toISOString()}]);
    await fetchAll(false);
  }
  async function deleteVault(id){
    if(!supabase)return;
    await supabase.from("vault").delete().eq("id",id);
    await fetchAll(false);
  }

  const ctx={
    db,filtered,upcoming,grid,byStatus,completion,
    selDate,setSelDate,view,setView,search,setSearch,
    editPost,setEdit,sidebar,setSidebar,cmdOpen,setCmdOpen,
    quickAdd,setQA,filterStatus,setFS,filterPlatform,setFP,sortBy,setSort,
    addPost,updatePost,deletePost,updateStatus,
    addIdea,convertIdea,addVault,deleteVault,
    loading,err,setErr,
  };

  if(supabaseConfigError){
    return(
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#F8F9FA"}}>
        <div className="card" style={{padding:32,maxWidth:440,width:"100%"}}>
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

  return(
    <Ctx.Provider value={ctx}>
      <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#F8F9FA"}}>
        <Sidebar/>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          <TopBar/>
          {quickAdd&&<QuickAddBar/>}
          {err&&<ErrBanner/>}
          <main style={{flex:1,overflowY:"auto"}}>
            {loading?<LoadingState/>:<ViewRouter/>}
          </main>
        </div>
        {editPost&&<EditPanel/>}
        {cmdOpen&&<CommandPalette/>}
      </div>
    </Ctx.Provider>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar(){
  const{view,setView,sidebar,setSidebar,db,upcoming}=useApp();
  return(
    <aside style={{width:sidebar?220:52,flexShrink:0,background:"#fff",borderRight:"1px solid #E5E7EB",display:"flex",flexDirection:"column",transition:"width 0.2s cubic-bezier(.32,.72,0,1)",overflow:"hidden",zIndex:20}}>
      {/* Logo */}
      <div style={{padding:"14px 10px 10px",borderBottom:"1px solid #F3F4F6",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:9,padding:"5px 6px",borderRadius:8}}>
          <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14,boxShadow:"0 2px 8px rgba(99,102,241,0.3)"}}>🌿</div>
          {sidebar&&(
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:13,fontWeight:700,color:"#111827"}} className="truncate">Deeper Healing</p>
              <p style={{fontSize:10,color:"#9CA3AF",marginTop:1}}>Content OS</p>
            </div>
          )}
          <button onClick={()=>setSidebar(o=>!o)} className="btn-ghost" style={{padding:5,marginLeft:"auto",flexShrink:0}}>
            <Menu style={{width:14,height:14}}/>
          </button>
        </div>
      </div>

      {/* Nav */}
      <div style={{padding:"8px 8px",flex:1,overflowY:"auto"}}>
        {sidebar&&<p style={{fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.1em",padding:"4px 8px 6px"}}>Navigation</p>}
        {NAV_ITEMS.map(item=>{
          const badge=item.id==="inbox"?db.ideas.length:0;
          return(
            <button key={item.id} onClick={()=>setView(item.id)} className={`nav-item ${view===item.id?"active":""}`}
              title={item.label} style={{marginBottom:2,justifyContent:sidebar?"flex-start":"center",padding:sidebar?"7px 10px":"7px"}}>
              <item.icon style={{width:15,height:15,flexShrink:0,color:view===item.id?"#6366F1":"#9CA3AF"}}/>
              {sidebar&&<span style={{flex:1}} className="truncate">{item.label}</span>}
              {sidebar&&badge>0&&<span style={{background:"#EEF2FF",color:"#6366F1",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:10}}>{badge}</span>}
            </button>
          );
        })}

        {sidebar&&(
          <>
            <div style={{height:1,background:"#F3F4F6",margin:"10px 4px"}}/>
            <p style={{fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.1em",padding:"0 8px 6px"}}>Overview</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,padding:"0 2px"}}>
              {[
                {label:"Upcoming",value:upcoming.length,   color:"#6366F1",bg:"#EEF2FF"},
                {label:"Posted",  value:db.posts.filter(p=>p.status==="Posted").length,color:"#10B981",bg:"#ECFDF5"},
                {label:"Ideas",   value:db.ideas.length,   color:"#F59E0B",bg:"#FFFBEB"},
                {label:"Vault",   value:db.vault.length,   color:"#8B5CF6",bg:"#F5F3FF"},
              ].map(s=>(
                <div key={s.label} style={{background:s.bg,borderRadius:8,padding:"8px 10px",border:"1px solid "+s.color+"20"}}>
                  <p style={{fontSize:18,fontWeight:700,color:s.color,lineHeight:1}}>{s.value}</p>
                  <p style={{fontSize:9,color:"#9CA3AF",marginTop:3,textTransform:"uppercase",letterSpacing:"0.08em"}}>{s.label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* User footer */}
      {sidebar&&(
        <div style={{padding:"10px",borderTop:"1px solid #F3F4F6",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:8}} className="row-hover">
            <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#6366F1,#8B5CF6)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:700}}>S</div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:12,fontWeight:600,color:"#374151"}} className="truncate">Shelley Martin</p>
              <p style={{fontSize:10,color:"#9CA3AF"}}>Admin</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────
function TopBar(){
  const{view,setCmdOpen,setQA,filterStatus,setFS,filterPlatform,setFP,sortBy,setSort}=useApp();
  const label=NAV_ITEMS.find(n=>n.id===view)?.label||"Home";
  const showFilters=["calendar","board","list"].includes(view);

  return(
    <div style={{height:52,borderBottom:"1px solid #E5E7EB",background:"#fff",display:"flex",alignItems:"center",padding:"0 20px",gap:10,flexShrink:0,boxShadow:"0 1px 3px rgba(0,0,0,0.03)"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,flex:1,minWidth:0}}>
        <span style={{fontSize:11,color:"#9CA3AF"}}>Deeper Healing</span>
        <ChevronRight style={{width:12,height:12,color:"#D1D5DB"}}/>
        <span style={{fontSize:13,fontWeight:600,color:"#111827"}}>{label}</span>
      </div>

      {showFilters&&(
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {[
            {val:filterStatus,  set:setFS,  opts:["all",...STATUSES],  prefix:"Status"},
            {val:filterPlatform,set:setFP,  opts:["all",...PLATFORMS], prefix:"Platform"},
            {val:sortBy,        set:setSort,opts:["date","title","status"],prefix:"Sort"},
          ].map((f,i)=>(
            <select key={i} value={f.val} onChange={e=>f.set(e.target.value)}
              style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:7,padding:"5px 8px",fontSize:12,color:"#374151",cursor:"pointer",outline:"none",fontFamily:"'Inter',sans-serif"}}>
              {f.opts.map(o=><option key={o} value={o}>{o==="all"?`All ${f.prefix}`:o}</option>)}
            </select>
          ))}
        </div>
      )}

      <button onClick={()=>setCmdOpen(true)} style={{display:"flex",alignItems:"center",gap:8,background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:8,padding:"5px 12px",cursor:"pointer",color:"#9CA3AF",fontSize:12,minWidth:160,fontFamily:"'Inter',sans-serif",transition:"border-color 0.15s"}}
        onMouseEnter={e=>e.currentTarget.style.borderColor="#D1D5DB"}
        onMouseLeave={e=>e.currentTarget.style.borderColor="#E5E7EB"}>
        <Search style={{width:12,height:12}}/><span style={{flex:1,textAlign:"left"}}>Search…</span>
        <kbd style={{fontSize:10,background:"#F3F4F6",border:"1px solid #E5E7EB",borderRadius:4,padding:"1px 5px",color:"#9CA3AF"}}>⌘K</kbd>
      </button>

      <button onClick={()=>setQA(q=>!q)} className="btn-primary" style={{flexShrink:0}}>
        <Plus style={{width:13,height:13}}/>New post
      </button>
    </div>
  );
}

// ─── View router ──────────────────────────────────────────────────────────────
function ViewRouter(){
  const{view}=useApp();
  return(
    <div className="fade-in" style={{padding:"24px 24px 48px"}}>
      {view==="home"     &&<HomeView/>}
      {view==="calendar" &&<CalendarView/>}
      {view==="board"    &&<BoardView/>}
      {view==="list"     &&<ListView/>}
      {view==="inbox"    &&<InboxView/>}
      {view==="vault"    &&<VaultView/>}
      {view==="activity" &&<ActivityView/>}
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────
function HomeView(){
  const{db,upcoming,completion,setView,setEdit,filtered}=useApp();
  const recent=[...db.posts].sort((a,b)=>new Date(b.updated_at||b.date)-new Date(a.updated_at||a.date)).slice(0,5);

  return(
    <div style={{maxWidth:960,margin:"0 auto"}}>
      {/* Page title */}
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:26,fontWeight:700,color:"#111827",marginBottom:4,letterSpacing:"-0.3px"}}>Deeper Healing Content Calendar</h1>
        <p style={{fontSize:13,color:"#6B7280"}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</p>
      </div>

      {/* KPI cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[
          {label:"Total posts",  value:db.posts.length,                                 accent:"#6366F1",bg:"#EEF2FF",icon:FileText    },
          {label:"Upcoming",     value:upcoming.length,                                 accent:"#8B5CF6",bg:"#F5F3FF",icon:Calendar    },
          {label:"Posted",       value:db.posts.filter(p=>p.status==="Posted").length, accent:"#10B981",bg:"#ECFDF5",icon:CheckCircle2 },
          {label:"Completion",   value:`${completion}%`,                               accent:"#F59E0B",bg:"#FFFBEB",icon:Target       },
        ].map(k=>(
          <div key={k.label} className="card" style={{padding:"18px 20px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <p style={{fontSize:11,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em"}}>{k.label}</p>
              <div style={{width:28,height:28,borderRadius:8,background:k.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <k.icon style={{width:13,height:13,color:k.accent}}/>
              </div>
            </div>
            <p style={{fontSize:30,fontWeight:700,color:k.accent,lineHeight:1,letterSpacing:"-0.5px"}}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="card" style={{padding:"18px 20px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <p style={{fontSize:13,fontWeight:600,color:"#374151"}}>Content pipeline</p>
          <p style={{fontSize:12,color:"#9CA3AF"}}>{completion}% complete</p>
        </div>
        <div style={{height:6,background:"#F3F4F6",borderRadius:99,overflow:"hidden",marginBottom:14}}>
          <div style={{height:"100%",width:`${completion}%`,background:"linear-gradient(90deg,#6366F1,#8B5CF6)",borderRadius:99,transition:"width 0.8s cubic-bezier(.34,1.56,.64,1)"}}/>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {STATUSES.map(s=>{
            const count=db.posts.filter(p=>p.status===s).length;
            const sm=STATUS_META[s];
            return(
              <button key={s} onClick={()=>setView("list")} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
                <span className={`tag ${sm.tagCls}`}><span className={sm.dot} style={{width:5,height:5,borderRadius:"50%"}}/>{s} {count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two col */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div className="card" style={{overflow:"hidden"}}>
          <div style={{padding:"14px 18px 12px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <p style={{fontSize:13,fontWeight:600,color:"#374151"}}>Recent posts</p>
            <button onClick={()=>setView("list")} className="btn-ghost">View all</button>
          </div>
          {recent.length>0?recent.map(p=>(
            <div key={p.id} onClick={()=>setEdit(p)} style={{padding:"11px 18px",borderBottom:"1px solid #F9FAFB",display:"flex",alignItems:"center",gap:10,cursor:"pointer",transition:"background 0.1s"}} className="row-hover">
              <span style={{fontSize:16,flexShrink:0}}>{PLATFORM_META[p.platform]?.emoji||"📄"}</span>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:13,fontWeight:500,color:"#111827"}} className="truncate">{p.title}</p>
                <p style={{fontSize:11,color:"#9CA3AF",marginTop:1}}>{relDate(p.date)}</p>
              </div>
              <StatusTag status={p.status} small/>
            </div>
          )):<EmptyMsg icon="📋" text="No posts yet"/>}
        </div>

        <div className="card" style={{overflow:"hidden"}}>
          <div style={{padding:"14px 18px 12px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <p style={{fontSize:13,fontWeight:600,color:"#374151"}}>Coming up</p>
            <button onClick={()=>setView("calendar")} className="btn-ghost">Calendar</button>
          </div>
          {upcoming.length>0?upcoming.slice(0,5).map(p=>{
            const sm=STATUS_META[p.status]||STATUS_META.Draft;
            return(
              <div key={p.id} onClick={()=>setEdit(p)} style={{padding:"11px 18px",borderBottom:"1px solid #F9FAFB",display:"flex",alignItems:"center",gap:10,cursor:"pointer",transition:"background 0.1s"}} className="row-hover">
                <span className={sm.dot} style={{width:7,height:7,borderRadius:"50%",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:500,color:"#111827"}} className="truncate">{p.title}</p>
                  <p style={{fontSize:11,color:"#9CA3AF",marginTop:1}}>{relDate(p.date)} · {p.platform}</p>
                </div>
                <Pencil style={{width:12,height:12,color:"#D1D5DB"}}/>
              </div>
            );
          }):<EmptyMsg icon="📅" text="Nothing upcoming"/>}
        </div>
      </div>
    </div>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
function CalendarView(){
  const{db,upcoming,selDate,setSelDate,grid,setEdit,updateStatus}=useApp();
  const todayKey=fmt(new Date()),selKey=fmt(selDate);
  const dayPosts=db.posts.filter(p=>p.date===selKey).sort((a,b)=>(a.title||"").localeCompare(b.title||""));

  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16,height:"calc(100vh-120px)"}}>
      <div className="card" style={{display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"16px 20px 12px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <h2 style={{fontSize:18,fontWeight:700,color:"#111827",letterSpacing:"-0.2px"}}>
            {selDate.toLocaleDateString("en-US",{month:"long",year:"numeric"})}
          </h2>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button className="btn-secondary" style={{padding:"5px 8px"}} onClick={()=>setSelDate(new Date(selDate.getFullYear(),selDate.getMonth()-1,1))}><ChevronLeft style={{width:14,height:14}}/></button>
            <button className="btn-secondary" style={{padding:"5px 12px",fontSize:12}} onClick={()=>setSelDate(new Date())}>Today</button>
            <button className="btn-secondary" style={{padding:"5px 8px"}} onClick={()=>setSelDate(new Date(selDate.getFullYear(),selDate.getMonth()+1,1))}><ChevronRight style={{width:14,height:14}}/></button>
          </div>
        </div>

        {/* Day labels */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"1px solid #F3F4F6",flexShrink:0}}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
            <div key={d} style={{padding:"8px 0",textAlign:"center",fontSize:11,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em"}}>{d}</div>
          ))}
        </div>

        {/* Cells */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",flex:1,overflowY:"auto"}}>
          {grid.map((cell,i)=>{
            if(!cell)return<div key={`b-${i}`} style={{minHeight:90,borderRight:"1px solid #F9FAFB",borderBottom:"1px solid #F9FAFB",background:"#FAFAFA"}}/>;
            const isSel=cell.date===selKey,isToday=cell.date===todayKey;
            return(
              <div key={cell.date} onClick={()=>setSelDate(new Date(`${cell.date}T00:00:00`))}
                style={{minHeight:90,borderRight:"1px solid #F3F4F6",borderBottom:"1px solid #F3F4F6",padding:"7px 7px 5px",cursor:"pointer",background:isSel?"#EEF2FF":isToday?"#FFFBEB":"#fff",transition:"background 0.1s"}}
                className={!isSel?"row-hover":""}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:700,color:isSel?"#6366F1":isToday?"#D97706":"#374151",background:isSel?"#C7D2FE":isToday?"#FDE68A":"transparent",borderRadius:5,padding:"1px 5px",display:"inline-block"}}>{cell.day}</span>
                  {cell.posts.length>0&&<span style={{fontSize:9,color:"#9CA3AF",fontWeight:600}}>{cell.posts.length}</span>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:2}}>
                  {cell.posts.slice(0,2).map(p=>{
                    const sm=STATUS_META[p.status]||STATUS_META.Draft;
                    return(
                      <div key={p.id} onClick={e=>{e.stopPropagation();setEdit(p);}}
                        style={{fontSize:10,fontWeight:500,padding:"3px 6px",borderRadius:5,background:"#fff",border:"1px solid #E5E7EB",display:"flex",alignItems:"center",gap:4,cursor:"pointer",transition:"border-color 0.12s,box-shadow 0.12s"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor="#C7D2FE";e.currentTarget.style.boxShadow="0 2px 6px rgba(99,102,241,0.12)";}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor="#E5E7EB";e.currentTarget.style.boxShadow="none";}}>
                        <span className={sm.dot} style={{width:4,height:4,borderRadius:"50%",flexShrink:0}}/>
                        <span style={{color:"#374151",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{p.title}</span>
                      </div>
                    );
                  })}
                  {cell.posts.length>2&&<span style={{fontSize:9,color:"#9CA3AF",paddingLeft:6}}>+{cell.posts.length-2} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div style={{display:"flex",flexDirection:"column",gap:12,overflowY:"auto"}}>
        <div className="card" style={{overflow:"hidden"}}>
          <div style={{padding:"14px 16px 12px",borderBottom:"1px solid #F3F4F6"}}>
            <p style={{fontSize:11,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:2}}>Selected</p>
            <p style={{fontSize:15,fontWeight:700,color:"#111827"}}>{selDate.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}</p>
          </div>
          <div style={{padding:"8px",maxHeight:260,overflowY:"auto"}}>
            {dayPosts.length>0?dayPosts.map(p=><CalPostRow key={p.id} post={p}/>):<EmptyMsg icon="📅" text="Nothing here"/>}
          </div>
        </div>

        <div className="card" style={{flex:1,overflow:"hidden"}}>
          <div style={{padding:"14px 16px 12px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <p style={{fontSize:11,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:2}}>Queue</p>
              <p style={{fontSize:15,fontWeight:700,color:"#111827"}}>Coming up</p>
            </div>
            {upcoming.length>0&&<span style={{background:"#EEF2FF",color:"#6366F1",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20}}>{upcoming.length}</span>}
          </div>
          <div style={{overflowY:"auto",maxHeight:360}}>
            {upcoming.slice(0,8).map(p=>{
              const sm=STATUS_META[p.status]||STATUS_META.Draft;
              return(
                <div key={p.id} onClick={()=>setEdit(p)} style={{padding:"10px 16px",borderBottom:"1px solid #F9FAFB",display:"flex",alignItems:"center",gap:10,cursor:"pointer",transition:"background 0.1s"}} className="row-hover">
                  <span className={sm.dot} style={{width:7,height:7,borderRadius:"50%",flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:13,fontWeight:500,color:"#111827"}} className="truncate">{p.title}</p>
                    <p style={{fontSize:11,color:"#9CA3AF",marginTop:1}}>{PLATFORM_META[p.platform]?.emoji} {relDate(p.date)}</p>
                  </div>
                  <Pencil style={{width:11,height:11,color:"#D1D5DB"}}/>
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
    <div style={{borderBottom:"1px solid #F9FAFB",marginBottom:1}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 8px",borderRadius:8,cursor:"pointer",transition:"background 0.1s"}} className="row-hover">
        <span className={sm.dot} style={{width:6,height:6,borderRadius:"50%",flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}} onClick={()=>setEdit(post)}>
          <p style={{fontSize:12,fontWeight:600,color:"#111827"}} className="truncate">{post.title}</p>
          <p style={{fontSize:10,color:"#9CA3AF",marginTop:1}}>{pm.emoji} {post.platform}</p>
        </div>
        <button onClick={()=>setEdit(post)} className="btn-ghost" style={{padding:4}}><Pencil style={{width:11,height:11}}/></button>
        <button onClick={()=>setOpen(o=>!o)} className="btn-ghost" style={{padding:4}}><ChevronDown style={{width:11,height:11,transform:open?"rotate(180deg)":"none",transition:"transform 0.15s"}}/></button>
      </div>
      {open&&(
        <div className="fade-in" style={{padding:"6px 10px 10px",background:"#F9FAFB",borderRadius:8,marginBottom:4}}>
          {post.notes&&<MiniField label="Notes" value={post.notes}/>}
          {url&&<div style={{marginBottom:6}}><p style={{fontSize:9,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>Video</p><a href={url} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#6366F1",display:"flex",alignItems:"center",gap:4}}><ExternalLink style={{width:10,height:10}}/>Open link</a></div>}
          {post.caption&&<MiniField label="Caption" value={post.caption}/>}
          {post.feedback&&<MiniField label="Feedback" value={post.feedback}/>}
          <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:4}}>
            {STATUSES.map(s=>(
              <button key={s} onClick={()=>updateStatus(post.id,s)}
                style={{padding:"3px 10px",borderRadius:6,border:"1px solid",borderColor:post.status===s?"#6366F1":"#E5E7EB",background:post.status===s?"#6366F1":"#fff",color:post.status===s?"#fff":"#6B7280",fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.12s"}}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Board (Kanban) ───────────────────────────────────────────────────────────
function BoardView(){
  const{byStatus,setEdit,updateStatus}=useApp();
  return(
    <div>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:22,fontWeight:700,color:"#111827",letterSpacing:"-0.3px"}}>Board</h2>
        <p style={{fontSize:13,color:"#6B7280",marginTop:2}}>Manage posts across stages</p>
      </div>
      <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:16,minHeight:"calc(100vh - 220px)"}}>
        {STATUSES.map(status=>{
          const posts=byStatus[status]||[];
          const sm=STATUS_META[status];
          return(
            <div key={status} className="k-col">
              <div style={{padding:"12px 14px 10px",borderBottom:"1px solid #E5E7EB",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span className={sm.dot} style={{width:7,height:7,borderRadius:"50%"}}/>
                  <span style={{fontSize:13,fontWeight:600,color:"#374151"}}>{status}</span>
                  <span style={{background:"#F3F4F6",color:"#9CA3AF",fontSize:11,fontWeight:600,padding:"1px 7px",borderRadius:10}}>{posts.length}</span>
                </div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"8px 0 10px"}}>
                {posts.map(p=>{
                  const pm=PLATFORM_META[p.platform]||PLATFORM_META.Instagram;
                  const pr=PRIORITY_COLOR[p.priority]||PRIORITY_COLOR.Medium;
                  return(
                    <div key={p.id} className="k-card" onClick={()=>setEdit(p)}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:8}}>
                        <p style={{fontSize:13,fontWeight:600,color:"#111827",lineHeight:1.4,flex:1}}>{p.title}</p>
                        <span style={{fontSize:16,flexShrink:0}}>{pm.emoji}</span>
                      </div>
                      {p.notes&&<p style={{fontSize:11,color:"#6B7280",lineHeight:1.5,marginBottom:8,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.notes}</p>}
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          <span style={{width:5,height:5,borderRadius:"50%",background:pr}}/>
                          <span style={{fontSize:10,color:"#9CA3AF"}}>{p.priority||"Medium"}</span>
                        </div>
                        {p.date&&<span style={{fontSize:10,color:"#9CA3AF"}}>{relDate(p.date)}</span>}
                      </div>
                    </div>
                  );
                })}
                {posts.length===0&&<div style={{padding:"20px 14px",textAlign:"center",color:"#D1D5DB",fontSize:12}}>No posts</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────
function ListView(){
  const{filtered,setEdit,updateStatus,deletePost}=useApp();
  const[expanded,setExpanded]=useState(null);
  return(
    <div>
      <div style={{marginBottom:20,display:"flex",alignItems:"baseline",gap:12}}>
        <h2 style={{fontSize:22,fontWeight:700,color:"#111827",letterSpacing:"-0.3px"}}>All Posts</h2>
        <span style={{fontSize:13,color:"#9CA3AF"}}>{filtered.length} items</span>
      </div>
      <div className="card" style={{overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 110px 100px 80px 90px 48px",gap:8,padding:"9px 18px",borderBottom:"1px solid #F3F4F6"}}>
          {["Title","Platform","Status","Priority","Date",""].map(h=>(
            <p key={h} style={{fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em"}}>{h}</p>
          ))}
        </div>
        {filtered.length>0?filtered.map(p=>{
          const pm=PLATFORM_META[p.platform]||PLATFORM_META.Instagram;
          const sm=STATUS_META[p.status]||STATUS_META.Draft;
          const pr=PRIORITY_COLOR[p.priority]||PRIORITY_COLOR.Medium;
          const isExp=expanded===p.id;
          return(
            <div key={p.id} style={{borderBottom:"1px solid #F9FAFB"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 110px 100px 80px 90px 48px",gap:8,padding:"11px 18px",alignItems:"center",cursor:"pointer",transition:"background 0.1s"}} className="row-hover"
                onClick={()=>setExpanded(isExp?null:p.id)}>
                <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                  <span className={sm.dot} style={{width:6,height:6,borderRadius:"50%",flexShrink:0}}/>
                  <p style={{fontSize:13,fontWeight:500,color:"#111827"}} className="truncate">{p.title}</p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:14}}>{pm.emoji}</span>
                  <span style={{fontSize:12,color:"#6B7280"}}>{p.platform}</span>
                </div>
                <StatusTag status={p.status} small/>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:pr,flexShrink:0}}/>
                  <span style={{fontSize:12,color:"#6B7280"}}>{p.priority||"Med"}</span>
                </div>
                <span style={{fontSize:12,color:"#9CA3AF"}}>{relDate(p.date)}</span>
                <div style={{display:"flex",gap:1}}>
                  <button className="btn-ghost" style={{padding:5}} onClick={e=>{e.stopPropagation();setEdit(p);}}><Pencil style={{width:12,height:12}}/></button>
                  <button className="btn-ghost" style={{padding:5}} onClick={e=>{e.stopPropagation();deletePost(p.id);}}><Trash2 style={{width:12,height:12,color:"#EF4444"}}/></button>
                </div>
              </div>
              {isExp&&(
                <div className="fade-in" style={{padding:"10px 18px 14px",background:"#F9FAFB",borderTop:"1px solid #F3F4F6"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,maxWidth:680,marginBottom:12}}>
                    {p.notes&&<MiniField label="Notes" value={p.notes}/>}
                    {p.caption&&<MiniField label="Caption" value={p.caption}/>}
                    {p.feedback&&<MiniField label="Feedback" value={p.feedback}/>}
                    {p.video_link&&<div><p style={{fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Video</p><a href={normUrl(p.video_link)} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#6366F1",display:"flex",alignItems:"center",gap:4}}><ExternalLink style={{width:11,height:11}}/>Open link</a></div>}
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {STATUSES.map(s=>(
                      <button key={s} onClick={()=>updateStatus(p.id,s)}
                        style={{padding:"4px 12px",borderRadius:6,border:"1px solid",borderColor:p.status===s?"#6366F1":"#E5E7EB",background:p.status===s?"#6366F1":"#fff",color:p.status===s?"#fff":"#6B7280",fontSize:12,fontWeight:500,cursor:"pointer",transition:"all 0.12s"}}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }):<EmptyMsg icon="📋" text="No posts found. Try adjusting your filters."/>}
      </div>
    </div>
  );
}

// ─── Inbox ────────────────────────────────────────────────────────────────────
function InboxView(){
  const{db,addIdea,convertIdea}=useApp();
  const[text,setText]=useState("");
  const[saving,setSaving]=useState(false);
  async function capture(){
    if(!text.trim()||saving)return;
    setSaving(true);await addIdea(text);setText("");setSaving(false);
  }
  return(
    <div style={{maxWidth:760}}>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:22,fontWeight:700,color:"#111827",letterSpacing:"-0.3px"}}>Idea Inbox</h2>
        <p style={{fontSize:13,color:"#6B7280",marginTop:2}}>{db.ideas.length} ideas · Capture now, schedule later</p>
      </div>
      <div className="card" style={{padding:20,marginBottom:14}}>
        <p style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:10}}>Capture an idea</p>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="What's the hook? What angle? Dump it here before it disappears…" rows={3} className="field" style={{resize:"none",lineHeight:1.6,marginBottom:10}}
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
        <div style={{padding:"12px 18px",borderBottom:"1px solid #F3F4F6"}}>
          <p style={{fontSize:13,fontWeight:600,color:"#374151"}}>Saved ideas</p>
        </div>
        {db.ideas.length>0?db.ideas.map((idea,i)=>(
          <div key={idea.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",borderBottom:"1px solid #F9FAFB",transition:"background 0.1s"}} className="row-hover">
            <span style={{fontSize:12,fontWeight:700,color:"#D1D5DB",minWidth:20}}>{i+1}.</span>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:13,fontWeight:500,color:"#111827"}}>{idea.title}</p>
              {idea.notes&&<p style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>{idea.notes}</p>}
            </div>
            <button onClick={()=>convertIdea(idea)}
              style={{flexShrink:0,display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:7,border:"1px solid #C7D2FE",background:"#EEF2FF",color:"#6366F1",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.12s",whiteSpace:"nowrap"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#E0E7FF";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#EEF2FF";}}>
              Make post<ArrowRight style={{width:11,height:11}}/>
            </button>
          </div>
        )):<EmptyMsg icon="💡" text="No ideas yet. Type above to capture your first idea."/>}
      </div>
    </div>
  );
}

// ─── Vault ────────────────────────────────────────────────────────────────────
function VaultView(){
  const{db,addVault,deleteVault}=useApp();
  const[text,setText]=useState("");
  const[confirm,setConfirm]=useState(null);
  const[saving,setSaving]=useState(false);
  async function save(){
    if(!text.trim()||saving)return;
    setSaving(true);await addVault(text);setText("");setSaving(false);
  }
  return(
    <div style={{maxWidth:900}}>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:22,fontWeight:700,color:"#111827",letterSpacing:"-0.3px"}}>Content Vault</h2>
        <p style={{fontSize:13,color:"#6B7280",marginTop:2}}>{db.vault.length} items · Hooks, CTAs, hashtags, frameworks</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:14,alignItems:"start"}}>
        <div className="card" style={{padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={{width:28,height:28,borderRadius:8,background:"#ECFDF5",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Archive style={{width:13,height:13,color:"#10B981"}}/>
            </div>
            <p style={{fontSize:13,fontWeight:600,color:"#374151"}}>Save to vault</p>
          </div>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Hook, CTA, caption framework, hashtag group…" rows={5} className="field" style={{resize:"none",lineHeight:1.6,marginBottom:10}}/>
          <button onClick={save} disabled={!text.trim()||saving} className="btn-primary" style={{width:"100%",justifyContent:"center",opacity:!text.trim()?0.5:1,background:"#10B981"}}
            onMouseEnter={e=>{if(text.trim())e.currentTarget.style.background="#059669";}}
            onMouseLeave={e=>e.currentTarget.style.background="#10B981"}>
            {saving?<Loader2 style={{width:12,height:12}} className="spin"/>:<Upload style={{width:12,height:12}}/>}
            {saving?"Saving…":"Save to vault"}
          </button>
        </div>
        {db.vault.length>0?(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
            {db.vault.map(item=>(
              <div key={item.id} className="card card-hover" style={{padding:16,position:"relative"}}>
                <div style={{width:24,height:24,borderRadius:6,background:"#ECFDF5",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}>
                  <Layers style={{width:12,height:12,color:"#10B981"}}/>
                </div>
                <p style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:6}}>{item.title||"Saved Content"}</p>
                <p style={{fontSize:12,color:"#6B7280",lineHeight:1.6}}>{item.content}</p>
                {confirm===item.id?(
                  <div style={{marginTop:10,display:"flex",alignItems:"center",gap:6}}>
                    <p style={{fontSize:11,color:"#EF4444",flex:1}}>Delete?</p>
                    <button onClick={()=>{deleteVault(item.id);setConfirm(null);}} style={{padding:"2px 10px",borderRadius:5,background:"#EF4444",color:"#fff",border:"none",fontSize:11,fontWeight:700,cursor:"pointer"}}>Yes</button>
                    <button onClick={()=>setConfirm(null)} style={{padding:"2px 10px",borderRadius:5,border:"1px solid #E5E7EB",background:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",color:"#6B7280"}}>No</button>
                  </div>
                ):(
                  <button onClick={()=>setConfirm(item.id)} className="btn-ghost" style={{position:"absolute",top:10,right:10,padding:5,color:"#D1D5DB"}}
                    onMouseEnter={e=>{e.currentTarget.style.color="#EF4444";e.currentTarget.style.background="#FEF2F2";}}
                    onMouseLeave={e=>{e.currentTarget.style.color="#D1D5DB";e.currentTarget.style.background="transparent";}}>
                    <Trash2 style={{width:12,height:12}}/>
                  </button>
                )}
              </div>
            ))}
          </div>
        ):(
          <div className="card" style={{padding:60,textAlign:"center",border:"1px dashed #E5E7EB",background:"#FAFAFA"}}>
            <EmptyMsg icon="🗄️" text="Vault is empty. Save hooks, CTAs, and frameworks here."/>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Activity ─────────────────────────────────────────────────────────────────
function ActivityView(){
  const{db}=useApp();
  const dot={success:"dot-approved",warning:"dot-scheduled",info:"dot-posted",error:"dot-draft"};
  const tag={success:"tag-approved",warning:"tag-scheduled",info:"tag-posted",error:"tag-draft"};
  return(
    <div style={{maxWidth:640}}>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:22,fontWeight:700,color:"#111827",letterSpacing:"-0.3px"}}>Activity</h2>
        <p style={{fontSize:13,color:"#6B7280",marginTop:2}}>{db.notifications.length} events logged</p>
      </div>
      <div className="card" style={{overflow:"hidden"}}>
        {db.notifications.length>0?db.notifications.map((n,i)=>(
          <div key={n.id} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"13px 18px",borderBottom:i<db.notifications.length-1?"1px solid #F9FAFB":"none",transition:"background 0.1s"}} className="row-hover">
            <div style={{width:26,height:26,borderRadius:"50%",background:"#F9FAFB",border:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
              <span className={dot[n.type]||"dot-draft"} style={{width:7,height:7,borderRadius:"50%"}}/>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:13,color:"#374151",lineHeight:1.5}}>{n.message}</p>
              {n.created_at&&<p style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>{new Date(n.created_at).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</p>}
            </div>
            <span className={`tag ${tag[n.type]||"tag-draft"}`} style={{fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>{n.type}</span>
          </div>
        )):<EmptyMsg icon="🔔" text="No activity yet. Events will appear here as you work."/>}
      </div>
    </div>
  );
}

// ─── Quick Add bar ────────────────────────────────────────────────────────────
function QuickAddBar(){
  const{addPost,setQA}=useApp();
  const[title,setTitle]=useState("");
  const[date,setDate]=useState(fmt(new Date()));
  const[platform,setPlatform]=useState("Instagram");
  const[priority,setPriority]=useState("Medium");
  const[saving,setSaving]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{ref.current?.focus();},[]);
  async function submit(){
    if(!title.trim()||saving)return;
    setSaving(true);
    await addPost({title:title.trim(),date,platform,priority,status:"Draft",caption:"",notes:"",video_link:"",feedback:""});
    setSaving(false);setQA(false);
  }
  const inp={background:"#fff",border:"1px solid #E5E7EB",borderRadius:8,padding:"7px 12px",fontSize:13,color:"#111827",fontFamily:"'Inter',sans-serif",outline:"none",transition:"border-color 0.15s, box-shadow 0.15s"};
  return(
    <div className="fade-in" style={{background:"#F9FAFB",borderBottom:"1px solid #E5E7EB",padding:"12px 20px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <input ref={ref} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Post title *"
        style={{...inp,flex:2,minWidth:200}} onKeyDown={e=>{if(e.key==="Enter")submit();if(e.key==="Escape")setQA(false);}}
        onFocus={e=>{e.target.style.borderColor="#6366F1";e.target.style.boxShadow="0 0 0 3px rgba(99,102,241,0.1)";}}
        onBlur={e=>{e.target.style.borderColor="#E5E7EB";e.target.style.boxShadow="none";}}/>
      <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{...inp,minWidth:140}}/>
      <select value={platform} onChange={e=>setPlatform(e.target.value)} style={{...inp,minWidth:130}}>
        {PLATFORMS.map(p=><option key={p} value={p}>{PLATFORM_META[p]?.emoji} {p}</option>)}
      </select>
      <select value={priority} onChange={e=>setPriority(e.target.value)} style={{...inp,minWidth:110}}>
        {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
      </select>
      <button onClick={submit} disabled={!title.trim()||saving} className="btn-primary" style={{flexShrink:0,opacity:!title.trim()?0.5:1}}>
        {saving?<Loader2 style={{width:12,height:12}} className="spin"/>:<Plus style={{width:12,height:12}}/>}
        {saving?"Adding…":"Add post"}
      </button>
      <button onClick={()=>setQA(false)} className="btn-ghost" style={{padding:6,flexShrink:0}}><X style={{width:14,height:14}}/></button>
    </div>
  );
}

// ─── Edit Panel (slide-out, autosave) ─────────────────────────────────────────
function EditPanel(){
  const{editPost:post,setEdit,updatePost,deletePost,updateStatus}=useApp();
  const[form,setForm]=useState({
    title:post.title||"",date:post.date||fmt(new Date()),
    platform:post.platform||"Instagram",status:post.status||"Draft",
    notes:post.notes||"",
    video_link:post.video_link||"",caption:post.caption||"",feedback:post.feedback||"",
  });
  const[saveState,setSaveState]=useState("idle");
  const timer=useRef(null);
  const isFirst=useRef(true);

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

  const inp={width:"100%",background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:9,padding:"9px 12px",fontSize:13,color:"#111827",fontFamily:"'Inter',sans-serif",outline:"none",transition:"border-color 0.15s,box-shadow 0.15s"};
  const focus={onFocus:e=>{e.target.style.borderColor="#6366F1";e.target.style.boxShadow="0 0 0 3px rgba(99,102,241,0.1)";},onBlur:e=>{e.target.style.borderColor="#E5E7EB";e.target.style.boxShadow="none";}};

  return(
    <>
      <div className="overlay fade-in" onClick={()=>setEdit(null)}/>
      <div className="slide-in" style={{position:"fixed",right:0,top:0,zIndex:50,height:"100%",width:"100%",maxWidth:500,display:"flex",flexDirection:"column",background:"#fff",boxShadow:"-4px 0 40px rgba(0,0,0,0.1)",borderLeft:"1px solid #E5E7EB"}}>

        {/* Header */}
        <div style={{padding:"14px 18px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:"#FAFAFA"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:28,height:28,borderRadius:7,background:"#EEF2FF",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <FileText style={{width:13,height:13,color:"#6366F1"}}/>
            </div>
            <span style={{fontSize:14,fontWeight:600,color:"#111827"}}>Edit Post</span>
            <div style={{display:"flex",alignItems:"center",gap:5,marginLeft:4}}>
              {saveState==="dirty"&&<span style={{fontSize:11,color:"#9CA3AF",display:"flex",alignItems:"center",gap:3}}><span className="pulse-dot" style={{width:5,height:5,borderRadius:"50%",background:"#F59E0B",display:"inline-block"}}/>Editing</span>}
              {saveState==="saving"&&<span style={{fontSize:11,color:"#9CA3AF",display:"flex",alignItems:"center",gap:3}}><Loader2 style={{width:10,height:10}} className="spin"/>Saving</span>}
              {saveState==="saved"&&<span style={{fontSize:11,color:"#10B981",display:"flex",alignItems:"center",gap:3}}><Check style={{width:10,height:10}}/>Saved</span>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <button onClick={()=>deletePost(post.id)} className="btn-ghost" style={{color:"#EF4444",fontSize:12,padding:"4px 8px"}}>
              <Trash2 style={{width:12,height:12}}/>Delete
            </button>
            <button onClick={()=>setEdit(null)} className="btn-ghost" style={{padding:6}}><X style={{width:14,height:14}}/></button>
          </div>
        </div>

        {/* Autosave hint */}
        <div style={{padding:"5px 18px",background:"#F5F3FF",borderBottom:"1px solid #EDE9FE",flexShrink:0,display:"flex",alignItems:"center",gap:5}}>
          <Zap style={{width:10,height:10,color:"#8B5CF6"}}/>
          <p style={{fontSize:11,color:"#7C3AED",fontWeight:500}}>Auto-saves 1.5s after you stop typing · Esc to close</p>
        </div>

        {/* Form */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 18px"}}>
          {/* Title */}
          <input value={form.title} onChange={sf("title")} placeholder="Post title"
            style={{...inp,fontSize:19,fontWeight:700,marginBottom:20,letterSpacing:"-0.2px"}} {...focus}/>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <FieldRow label="Date"><input type="date" value={form.date} onChange={sf("date")} style={inp} {...focus}/></FieldRow>
            <FieldRow label="Platform">
              <select value={form.platform} onChange={sf("platform")} style={inp} {...focus}>
                {PLATFORMS.map(p=><option key={p} value={p}>{PLATFORM_META[p]?.emoji} {p}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Priority">
              <select value={form.priority} onChange={sf("priority")} style={inp} {...focus}>
                {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </FieldRow>
          </div>

          <FieldRow label="Status" style={{marginBottom:16}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:4}}>
              {STATUSES.map(s=>{
                const sm=STATUS_META[s],active=form.status===s;
                return(
                  <button key={s} onClick={()=>handleStatus(s)}
                    style={{display:"flex",alignItems:"center",gap:5,padding:"5px 14px",borderRadius:20,border:"1.5px solid",borderColor:active?"#6366F1":"#E5E7EB",background:active?"#EEF2FF":"#fff",color:active?"#6366F1":"#6B7280",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.12s",boxShadow:active?"0 0 0 3px rgba(99,102,241,0.12)":"none"}}>
                    <span className={sm.dot} style={{width:6,height:6,borderRadius:"50%"}}/>{s}
                  </button>
                );
              })}
            </div>
          </FieldRow>

          <div style={{height:1,background:"#F3F4F6",margin:"6px 0 18px"}}/>

          <FieldRow label="Notes" style={{marginBottom:14}}>
            <textarea value={form.notes} onChange={sf("notes")} placeholder="Production notes, direction, context…" rows={3} style={{...inp,resize:"none",lineHeight:1.6}} {...focus}/>
          </FieldRow>
          <FieldRow label="Video Link" style={{marginBottom:14}}>
            <input value={form.video_link} onChange={sf("video_link")} placeholder="https://drive.google.com/…" style={inp} {...focus}/>
          </FieldRow>
          <FieldRow label="Caption for Approval" style={{marginBottom:14}}>
            <textarea value={form.caption} onChange={sf("caption")} placeholder="Full caption copy for client review…" rows={5} style={{...inp,resize:"none",lineHeight:1.6}} {...focus}/>
          </FieldRow>
          <FieldRow label="Feedback / Revisions" style={{marginBottom:14}}>
            <textarea value={form.feedback} onChange={sf("feedback")} placeholder="Client feedback or revision notes…" rows={3} style={{...inp,resize:"none",lineHeight:1.6}} {...focus}/>
          </FieldRow>
        </div>

        <div style={{padding:"12px 18px",borderTop:"1px solid #F3F4F6",flexShrink:0,display:"flex",justifyContent:"flex-end"}}>
          <button onClick={()=>setEdit(null)} className="btn-primary">Done</button>
        </div>
      </div>
    </>
  );
}

// ─── Command Palette ──────────────────────────────────────────────────────────
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
      {type:"nav",label:"New post ⌘N",   icon:Plus,      action:()=>{setQA(true);        setCmdOpen(false);}},
    ];
    const postHits=lq?db.posts.filter(p=>(p.title||"").toLowerCase().includes(lq)).slice(0,5).map(p=>({type:"post",label:p.title,sub:`${p.platform} · ${relDate(p.date)}`,icon:FileText,action:()=>{setEdit(p);setCmdOpen(false);}})):[];
    return [...(lq?cmds.filter(c=>c.label.toLowerCase().includes(lq)):cmds),...postHits];
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
      <div className="scale-in card" style={{width:"100%",maxWidth:520,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.15),0 1px 3px rgba(0,0,0,0.06)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"13px 16px",borderBottom:"1px solid #F3F4F6"}}>
          <Search style={{width:15,height:15,color:"#9CA3AF",flexShrink:0}}/>
          <input ref={ref} value={q} onChange={e=>setQ(e.target.value)} onKeyDown={handleKey}
            placeholder="Search or navigate…"
            style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:14,color:"#111827",fontFamily:"'Inter',sans-serif"}}/>
          <kbd style={{fontSize:10,background:"#F3F4F6",border:"1px solid #E5E7EB",borderRadius:5,padding:"2px 6px",color:"#9CA3AF",flexShrink:0}}>Esc</kbd>
        </div>
        <div style={{maxHeight:340,overflowY:"auto",padding:"6px 0"}}>
          {results.length>0?results.map((r,i)=>(
            <button key={i} onClick={r.action}
              style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"8px 16px",border:"none",cursor:"pointer",textAlign:"left",background:sel===i?"#EEF2FF":"transparent",transition:"background 0.1s",fontFamily:"'Inter',sans-serif"}}
              onMouseEnter={()=>setSel(i)}>
              <r.icon style={{width:14,height:14,color:sel===i?"#6366F1":"#9CA3AF",flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:13,color:sel===i?"#4F46E5":"#374151",fontWeight:sel===i?600:400}} className="truncate">{r.label}</p>
                {r.sub&&<p style={{fontSize:11,color:"#9CA3AF",marginTop:1}} className="truncate">{r.sub}</p>}
              </div>
              <span style={{fontSize:9,color:"#D1D5DB",textTransform:"uppercase",letterSpacing:"0.08em"}}>{r.type}</span>
            </button>
          )):<div style={{padding:24,textAlign:"center",color:"#9CA3AF",fontSize:13}}>No results</div>}
        </div>
        <div style={{padding:"8px 16px",borderTop:"1px solid #F3F4F6",display:"flex",gap:14}}>
          {[["↑↓","Navigate"],["↵","Open"],["Esc","Close"]].map(([k,l])=>(
            <div key={k} style={{display:"flex",alignItems:"center",gap:5}}>
              <kbd style={{fontSize:10,background:"#F3F4F6",border:"1px solid #E5E7EB",borderRadius:4,padding:"1px 5px",color:"#9CA3AF"}}>{k}</kbd>
              <span style={{fontSize:10,color:"#9CA3AF"}}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function StatusTag({status,small}){
  const sm=STATUS_META[status]||STATUS_META.Draft;
  return(
    <span className={`tag ${sm.tagCls}`} style={{fontSize:small?10:11}}>
      <span className={sm.dot} style={{width:small?5:6,height:small?5:6,borderRadius:"50%"}}/>{status}
    </span>
  );
}
function MiniField({label,value}){
  return(
    <div style={{marginBottom:8}}>
      <p style={{fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>{label}</p>
      <p style={{fontSize:12,color:"#4B5563",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{value}</p>
    </div>
  );
}
function FieldRow({label,children,style:s}){
  return(
    <div style={{marginBottom:14,...s}}>
      <p style={{fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>{label}</p>
      {children}
    </div>
  );
}
function EmptyMsg({icon,text}){
  return(
    <div style={{padding:"32px 20px",textAlign:"center"}}>
      <div style={{fontSize:28,marginBottom:8}}>{icon}</div>
      <p style={{fontSize:13,color:"#9CA3AF",lineHeight:1.5,maxWidth:260,margin:"0 auto"}}>{text}</p>
    </div>
  );
}
function LoadingState(){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:14}}>
      <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 4px 16px rgba(99,102,241,0.3)"}}>🌿</div>
      <div style={{display:"flex",alignItems:"center",gap:8,color:"#9CA3AF"}}>
        <Loader2 style={{width:15,height:15}} className="spin"/>
        <span style={{fontSize:13,fontWeight:500}}>Loading your workspace…</span>
      </div>
    </div>
  );
}
function ErrBanner(){
  const{err,setErr}=useApp();
  return(
    <div className="fade-in" style={{background:"#FEF2F2",borderBottom:"1px solid #FECACA",padding:"9px 20px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
      <AlertCircle style={{width:14,height:14,color:"#EF4444",flexShrink:0}}/>
      <p style={{flex:1,fontSize:13,color:"#DC2626"}}>{err}</p>
      <button onClick={()=>setErr("")} className="btn-ghost" style={{padding:4,color:"#EF4444"}}><X style={{width:12,height:12}}/></button>
    </div>
  );
}
