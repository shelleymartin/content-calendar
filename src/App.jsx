import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Bell, Calendar, ChevronLeft, ChevronRight, Inbox, Layers,
  Plus, Search, Sparkles, Trash2, Upload, Wand2, Link as LinkIcon,
  Pencil, X, Check, Loader2, AlertCircle, ArrowRight, ChevronDown,
} from "lucide-react";
import { supabase, supabaseConfigError } from "./lib/supabase";

// ─── Constants ────────────────────────────────────────────────────────────────

const VIEW_OPTIONS = [
  { id: "calendar",      label: "Calendar",      icon: Calendar },
  { id: "ideas",         label: "Idea Inbox",    icon: Inbox },
  { id: "vault",         label: "Content Vault", icon: Layers },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const STATUSES  = ["Draft", "Approved", "Scheduled", "Posted"];
const PLATFORMS = ["Instagram", "TikTok", "YouTube", "LinkedIn", "Facebook"];

const PLATFORM_STYLE = {
  Instagram: { pill: "bg-pink-50 text-pink-600 border-pink-100",       dot: "bg-pink-400"   },
  TikTok:    { pill: "bg-slate-100 text-slate-600 border-slate-200",   dot: "bg-slate-400"  },
  YouTube:   { pill: "bg-red-50 text-red-600 border-red-100",          dot: "bg-red-400"    },
  LinkedIn:  { pill: "bg-blue-50 text-blue-600 border-blue-100",       dot: "bg-blue-400"   },
  Facebook:  { pill: "bg-indigo-50 text-indigo-600 border-indigo-100", dot: "bg-indigo-400" },
};

const STATUS_STYLE = {
  Draft:     { pill: "bg-slate-100 text-slate-600 border-slate-200",    dot: "bg-slate-400",   ring: "ring-slate-200"   },
  Approved:  { pill: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  Scheduled: { pill: "bg-sky-50 text-sky-700 border-sky-100",           dot: "bg-sky-500",     ring: "ring-sky-200"     },
  Posted:    { pill: "bg-violet-50 text-violet-700 border-violet-100",  dot: "bg-violet-500",  ring: "ring-violet-200"  },
};

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatDate(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function normalizeUrl(v) {
  if (!v?.trim()) return "";
  const s = v.trim().startsWith("http") ? v.trim() : `https://${v.trim()}`;
  try {
    const u = new URL(s);
    return ["http:", "https:"].includes(u.protocol) ? u.toString() : "";
  } catch {
    return "";
  }
}

function buildGrid(date, posts) {
  const y = date.getFullYear(), m = date.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days  = new Date(y, m + 1, 0).getDate();
  const cells = Array(first).fill(null);
  for (let d = 1; d <= days; d++) {
    const key = formatDate(new Date(y, m, d));
    cells.push({ day: d, date: key, posts: posts.filter(p => p.date === key) });
  }
  return cells;
}

function seedDB() {
  return { ideas: [], posts: [], vault: [], notifications: [] };
}

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

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async (loader = false) => {
    if (!supabase) return;
    if (loader) setLoading(true);
    setAppErr("");
    try {
      const [p, i, v, n] = await Promise.all([
        supabase.from("posts").select("*").order("date", { ascending: true }),
        supabase.from("ideas").select("*").order("created_at", { ascending: false }),
        supabase.from("vault").select("*").order("created_at", { ascending: false }),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }),
      ]);
      if (p.error) throw p.error;
      if (i.error) throw i.error;
      if (v.error) throw v.error;
      if (n.error) throw n.error;
      setDB({
        posts: p.data ?? [],
        ideas: i.data ?? [],
        vault: v.data ?? [],
        notifications: n.data ?? [],
      });
    } catch (e) {
      setAppErr(e.message || "Could not load data.");
    } finally {
      if (loader) setLoading(false);
    }
  }, []);

  // ── Realtime subscriptions ────────────────────────────────────────────────

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let timer;
    const debounce = () => {
      clearTimeout(timer);
      timer = setTimeout(() => fetchAll(false), 180);
    };
    fetchAll(true);
    const ch = supabase
      .channel("dh-v3")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" },         debounce)
      .on("postgres_changes", { event: "*", schema: "public", table: "ideas" },         debounce)
      .on("postgres_changes", { event: "*", schema: "public", table: "vault" },         debounce)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, debounce)
      .subscribe();
    return () => { clearTimeout(timer); supabase.removeChannel(ch); };
  }, [fetchAll]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...db.posts]
      .filter(p =>
        ["title", "platform", "status", "caption", "notes", "feedback"]
          .some(k => (p[k] || "").toLowerCase().includes(q))
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [db.posts, search]);

  const upcoming = useMemo(() => {
    const t = formatDate(new Date());
    return filtered.filter(p => p.date >= t);
  }, [filtered]);

  const weekCount = useMemo(() => {
    const t = stripTime(new Date());
    const e = stripTime(new Date());
    e.setDate(e.getDate() + 7);
    return db.posts.filter(p => {
      if (!p.date) return false;
      const d = new Date(`${p.date}T00:00:00`);
      return d >= t && d <= e;
    }).length;
  }, [db.posts]);

  const grid = useMemo(
    () => buildGrid(selectedDate, db.posts),
    [selectedDate, db.posts]
  );

  // ── Notification helper ───────────────────────────────────────────────────

  async function notify(message, type = "info", related_post_id = null) {
    if (!supabase) return;
    await supabase.from("notifications").insert([{
      message, type, read: false, related_post_id,
      updated_at: new Date().toISOString(),
    }]);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async function addPost(post) {
    if (!supabase) return;
    const { data, error } = await supabase.from("posts").insert([{
      ...post,
      video_link: normalizeUrl(post.video_link || ""),
      status: post.status || "Draft",
      updated_at: new Date().toISOString(),
    }]).select();
    if (error) { setAppErr(error.message); return; }
    if (data?.[0]) await notify(`${data[0].title} added to calendar.`, "success", data[0].id);
    await fetchAll(false);
  }

  async function updatePost(id, fields) {
    if (!supabase) return false;
    const { data, error } = await supabase.from("posts")
      .update({
        ...fields,
        video_link: normalizeUrl(fields.video_link || ""),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();
    if (error) { setAppErr(error.message); return false; }
    if (data?.[0]) await notify(`${data[0].title} updated.`, "info", data[0].id);
    await fetchAll(false);
    return true;
  }

  async function deletePost(id) {
    if (!supabase) return;
    const post = db.posts.find(p => p.id === id);
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) { setAppErr(error.message); return; }
    if (post) await notify(`${post.title} deleted.`, "warning", id);
    setEditPost(prev => prev?.id === id ? null : prev);
    await fetchAll(false);
  }

  async function updateStatus(id, status) {
    if (!supabase) return;
    const { data, error } = await supabase.from("posts")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();
    if (error) { setAppErr(error.message); return; }
    if (data?.[0]) await notify(`${data[0].title} → ${status}.`, "info", data[0].id);
    setEditPost(prev => prev?.id === id ? { ...prev, status } : prev);
    await fetchAll(false);
  }

  async function addIdea(text) {
    if (!supabase || !text.trim()) return;
    const { error } = await supabase.from("ideas").insert([{
      title: text.trim(), platform: "Instagram", notes: "", status: "Idea",
      updated_at: new Date().toISOString(),
    }]);
    if (error) { setAppErr(error.message); return; }
    await fetchAll(false);
  }

  async function convertIdea(idea) {
    if (!supabase) return;
    const { data, error } = await supabase.from("posts").insert([{
      title: idea.title || "Untitled", date: formatDate(new Date()),
      platform: idea.platform || "Instagram", status: "Draft",
      caption: idea.notes || "", notes: "", video_link: "", feedback: "",
      updated_at: new Date().toISOString(),
    }]).select();
    if (error) { setAppErr(error.message); return; }
    const { error: de } = await supabase.from("ideas").delete().eq("id", idea.id);
    if (de) { setAppErr(de.message); return; }
    await notify(`Post created from idea: ${idea.title}`, "success", data?.[0]?.id ?? null);
    await fetchAll(false);
  }

  async function addVault(text) {
    if (!supabase || !text.trim()) return;
    const { error } = await supabase.from("vault").insert([{
      title: "Saved Content", platform: "General", content: text.trim(),
      media_url: "", tags: "", updated_at: new Date().toISOString(),
    }]);
    if (error) { setAppErr(error.message); return; }
    await fetchAll(false);
  }

  // ── Guard ─────────────────────────────────────────────────────────────────

  if (supabaseConfigError) {
    return (
      <Shell metrics={{ upcoming: 0, weekCount: 0, vaultCount: 0 }}>
        <Card className="mt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Supabase not configured</p>
              <p className="mt-1 text-sm text-slate-500">{supabaseConfigError}</p>
            </div>
          </div>
        </Card>
      </Shell>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Shell metrics={{ upcoming: upcoming.length, weekCount, vaultCount: db.vault.length }}>

      {/* Error banner */}
      {appErr && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="flex-1 text-sm text-red-700">{appErr}</p>
          <button onClick={() => setAppErr("")}>
            <X className="h-4 w-4 text-red-400 hover:text-red-600" />
          </button>
        </div>
      )}

      <div className="mt-5 flex gap-5 items-start">

        {/* ── Sidebar ────────────────────────────────────────────── */}
        <aside className="w-[252px] shrink-0 space-y-3">

          {/* Navigation */}
          <Panel>
            <SectionLabel>Menu</SectionLabel>
            <nav className="mt-2 space-y-0.5">
              {VIEW_OPTIONS.map(item => (
                <NavBtn
                  key={item.id}
                  active={view === item.id}
                  icon={item.icon}
                  onClick={() => setView(item.id)}
                >
                  {item.label}
                </NavBtn>
              ))}
            </nav>
          </Panel>

          {/* Fast add */}
          <Panel>
            <div className="flex items-center justify-between">
              <SectionLabel>Fast add</SectionLabel>
              <button
                onClick={() => setShowAdd(v => !v)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                  showAdd
                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    : "bg-slate-900 text-white hover:bg-slate-700"
                }`}
              >
                {showAdd
                  ? <><X className="h-3 w-3" /> Close</>
                  : <><Plus className="h-3 w-3" /> New</>
                }
              </button>
            </div>

            {showAdd ? (
              <QuickAdd addPost={addPost} onDone={() => setShowAdd(false)} />
            ) : (
              <button
                onClick={() => setShowAdd(true)}
                className="mt-3 w-full flex items-center justify-between rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-400 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-500 transition"
              >
                <span>Add a post…</span>
                <Plus className="h-4 w-4" />
              </button>
            )}
          </Panel>

          {/* Search */}
          <Panel>
            <SectionLabel>Search</SectionLabel>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Posts, captions, notes…"
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-slate-300 focus:bg-white transition placeholder:text-slate-300"
              />
            </div>
          </Panel>
        </aside>

        {/* ── Main ───────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <Card>
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            </Card>
          ) : (
            <>
              {view === "calendar" && (
                <CalendarView
                  posts={db.posts}
                  upcoming={upcoming}
                  deletePost={deletePost}
                  updateStatus={updateStatus}
                  selectedDate={selectedDate}
                  setSel={setSel}
                  grid={grid}
                  onEdit={setEditPost}
                />
              )}
              {view === "ideas" && (
                <IdeasView ideas={db.ideas} addIdea={addIdea} convertIdea={convertIdea} />
              )}
              {view === "vault" && (
                <VaultView vault={db.vault} addVault={addVault} />
              )}
              {view === "notifications" && (
                <NotificationsView notifications={db.notifications} />
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Slide-out edit panel ────────────────────────────────── */}
      {editPost && (
        <EditPanel
          post={editPost}
          onClose={() => setEditPost(null)}
          onSave={async (fields) => {
            const ok = await updatePost(editPost.id, fields);
            if (ok) setEditPost(null);
          }}
          onDelete={() => deletePost(editPost.id)}
          onStatusChange={(s) => updateStatus(editPost.id, s)}
        />
      )}
    </Shell>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function Shell({ children, metrics }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1400px] px-5 py-5">

        {/* Hero header */}
        <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-7 shadow-xl shadow-slate-900/20">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                <Sparkles className="h-3 w-3" />
                Content Workflow
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
                Deeper Healing
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Content calendar · Approval workflow · Copy library
              </p>
            </div>
            <div className="flex gap-3">
              {[
                { label: "Upcoming",   value: metrics.upcoming   },
                { label: "This week",  value: metrics.weekCount  },
                { label: "Vault items", value: metrics.vaultCount },
              ].map(m => (
                <div
                  key={m.label}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center backdrop-blur"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{m.label}</p>
                  <p className="mt-1 text-2xl font-bold text-white">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}

// ─── Calendar view ────────────────────────────────────────────────────────────

function CalendarView({ posts, upcoming, deletePost, updateStatus, selectedDate, setSel, grid, onEdit }) {
  const todayKey = formatDate(new Date());
  const selKey   = formatDate(selectedDate);
  const dayPosts = posts
    .filter(p => p.date === selKey)
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""));

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">

      {/* Calendar grid */}
      <Card>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <SectionLabel>Calendar</SectionLabel>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900">
              {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <IconBtn onClick={() => setSel(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </IconBtn>
            <button
              onClick={() => setSel(new Date())}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Today
            </button>
            <IconBtn onClick={() => setSel(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}>
              <ChevronRight className="h-4 w-4" />
            </IconBtn>
          </div>
        </div>

        {/* Day labels */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="py-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell, i) => {
            if (!cell) return (
              <div key={`b-${i}`} className="h-[96px] rounded-xl" />
            );
            const isSel   = cell.date === selKey;
            const isToday = cell.date === todayKey;
            return (
              <button
                key={cell.date}
                onClick={() => setSel(new Date(`${cell.date}T00:00:00`))}
                className={`h-[96px] rounded-xl border p-2 text-left transition-all ${
                  isSel
                    ? "border-slate-800 bg-slate-900 shadow-md"
                    : isToday
                    ? "border-blue-200 bg-blue-50"
                    : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                }`}
              >
                <span className={`text-xs font-bold ${
                  isSel ? "text-white" : isToday ? "text-blue-600" : "text-slate-700"
                }`}>
                  {cell.day}
                </span>
                {cell.posts.length > 0 && (
                  <div className="mt-1.5 space-y-0.5">
                    {cell.posts.slice(0, 2).map(p => (
                      <div
                        key={p.id}
                        className={`truncate rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                          isSel ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {p.title}
                      </div>
                    ))}
                    {cell.posts.length > 2 && (
                      <p className={`text-[9px] font-semibold ${isSel ? "text-white/50" : "text-slate-400"}`}>
                        +{cell.posts.length - 2} more
                      </p>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Right column */}
      <div className="space-y-4">

        {/* Day posts */}
        <Card>
          <SectionLabel>Selected day</SectionLabel>
          <h3 className="mt-0.5 mb-4 text-base font-bold text-slate-900">
            {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </h3>
          {dayPosts.length > 0 ? (
            <div className="space-y-2">
              {dayPosts.map(p => (
                <PostCard
                  key={p.id}
                  post={p}
                  onEdit={() => onEdit(p)}
                  onDelete={() => deletePost(p.id)}
                  onStatus={s => updateStatus(p.id, s)}
                />
              ))}
            </div>
          ) : (
            <Empty icon={Calendar} title="No posts" text="Nothing scheduled for this day." />
          )}
        </Card>

        {/* Upcoming queue */}
        <Card>
          <SectionLabel>Queue</SectionLabel>
          <h3 className="mt-0.5 mb-4 text-base font-bold text-slate-900">Coming up</h3>
          {upcoming.length > 0 ? (
            <div className="space-y-1.5">
              {upcoming.slice(0, 6).map(p => (
                <button
                  key={p.id}
                  onClick={() => onEdit(p)}
                  className="group w-full flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-left hover:border-slate-200 hover:bg-white hover:shadow-sm transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-slate-900">
                      {p.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.date}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusPill status={p.status} />
                    <Pencil className="h-3 w-3 text-slate-300 group-hover:text-slate-500 transition" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Empty icon={Calendar} title="Queue empty" text="No upcoming posts scheduled." />
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Post card (day panel) ────────────────────────────────────────────────────

function PostCard({ post, onEdit, onDelete, onStatus }) {
  const [open, setOpen] = useState(false);
  const safeUrl = normalizeUrl(post.video_link);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3.5 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold text-slate-900">{post.title}</span>
            <StatusPill status={post.status} />
            <PlatformPill platform={post.platform} />
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <IconBtn onClick={onEdit} title="Edit post">
            <Pencil className="h-3.5 w-3.5 text-slate-400 hover:text-slate-700" />
          </IconBtn>
          <IconBtn onClick={onDelete} title="Delete post" danger>
            <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
          </IconBtn>
          <IconBtn onClick={() => setOpen(o => !o)}>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </IconBtn>
        </div>
      </div>

      {/* Expandable details */}
      {open && (
        <div className="border-t border-slate-100 bg-slate-50 px-3.5 py-3.5 space-y-3">
          {post.notes && <InlineField label="Notes" value={post.notes} />}
          {safeUrl && (
            <div>
              <p className="field-label mb-1">Video</p>
              <a
                href={safeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
              >
                <LinkIcon className="h-3 w-3" />
                Open video
              </a>
            </div>
          )}
          {post.caption  && <InlineField label="Caption"  value={post.caption}  />}
          {post.feedback && <InlineField label="Feedback" value={post.feedback} />}

          <div>
            <p className="field-label mb-2">Move to status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => onStatus(s)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                    post.status === s
                      ? "bg-slate-800 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InlineField({ label, value }) {
  return (
    <div>
      <p className="field-label mb-1">{label}</p>
      <p className="text-xs leading-5 text-slate-600 whitespace-pre-wrap line-clamp-4">{value}</p>
    </div>
  );
}

// ─── Edit panel ───────────────────────────────────────────────────────────────

function EditPanel({ post, onClose, onSave, onDelete, onStatusChange }) {
  const [form, setForm] = useState({
    title:      post.title      || "",
    date:       post.date       || formatDate(new Date()),
    platform:   post.platform   || "Instagram",
    status:     post.status     || "Draft",
    notes:      post.notes      || "",
    video_link: post.video_link || "",
    caption:    post.caption    || "",
    feedback:   post.feedback   || "",
  });
  const [saving, setSaving] = useState(false);
  const [dirty,  setDirty]  = useState(false);

  function setField(k) {
    return e => { setForm(f => ({ ...f, [k]: e.target.value })); setDirty(true); };
  }

  async function handleSave() {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setDirty(false);
  }

  async function handleStatus(s) {
    setForm(f => ({ ...f, status: s }));
    setDirty(true);
    await onStatusChange(s);
  }

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const input = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white placeholder:text-slate-300";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-[480px] flex flex-col bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-800">Edit Post</span>
            {dirty && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                Unsaved
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          <div>
            <label className="panel-label">Title</label>
            <input
              value={form.title}
              onChange={setField("title")}
              placeholder="Post title"
              className={input}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="panel-label">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={setField("date")}
                className={input}
              />
            </div>
            <div>
              <label className="panel-label">Platform</label>
              <select
                value={form.platform}
                onChange={setField("platform")}
                className={input}
              >
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="panel-label">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => {
                const st = STATUS_STYLE[s];
                const active = form.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleStatus(s)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                      active
                        ? `${st.pill} ring-2 ${st.ring} ring-offset-1`
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="panel-label">Notes</label>
            <textarea
              value={form.notes}
              onChange={setField("notes")}
              placeholder="Production notes, direction, context…"
              rows={3}
              className={`${input} resize-none leading-6`}
            />
          </div>

          <div>
            <label className="panel-label">Video Link</label>
            <input
              value={form.video_link}
              onChange={setField("video_link")}
              placeholder="https://drive.google.com/…"
              className={input}
            />
          </div>

          <div>
            <label className="panel-label">Caption for Approval</label>
            <textarea
              value={form.caption}
              onChange={setField("caption")}
              placeholder="Full caption copy for client review…"
              rows={5}
              className={`${input} resize-none leading-6`}
            />
          </div>

          <div>
            <label className="panel-label">Feedback / Revision Requests</label>
            <textarea
              value={form.feedback}
              onChange={setField("feedback")}
              placeholder="Client feedback or requested changes…"
              rows={3}
              className={`${input} resize-none leading-6`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 shrink-0">
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-40 transition"
            >
              {saving
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Check className="h-3.5 w-3.5" />
              }
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Quick Add ────────────────────────────────────────────────────────────────

function QuickAdd({ addPost, onDone }) {
  const [title,     setTitle]     = useState("");
  const [date,      setDate]      = useState(formatDate(new Date()));
  const [platform,  setPlatform]  = useState("Instagram");
  const [notes,     setNotes]     = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [caption,   setCaption]   = useState("");
  const [feedback,  setFeedback]  = useState("");
  const [saving,    setSaving]    = useState(false);

  const row = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white placeholder:text-slate-300";

  async function submit() {
    if (!title.trim() || saving) return;
    setSaving(true);
    await addPost({
      title: title.trim(), date, platform,
      status: "Draft", caption, notes,
      video_link: videoLink, feedback,
    });
    setSaving(false);
    onDone();
  }

  return (
    <div className="mt-3 space-y-2">
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Post title *"
        autoFocus
        className={`${row} h-9`}
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className={`${row} h-9`}
        />
        <select
          value={platform}
          onChange={e => setPlatform(e.target.value)}
          className={`${row} h-9`}
        >
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Notes"
        rows={2}
        className={`${row} resize-none p-2.5 leading-5`}
      />

      <input
        value={videoLink}
        onChange={e => setVideoLink(e.target.value)}
        placeholder="Video link"
        className={`${row} h-9`}
      />

      <textarea
        value={caption}
        onChange={e => setCaption(e.target.value)}
        placeholder="Caption for approval"
        rows={3}
        className={`${row} resize-none p-2.5 leading-5`}
      />

      <textarea
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        placeholder="Feedback / revisions"
        rows={2}
        className={`${row} resize-none p-2.5 leading-5`}
      />

      <button
        onClick={submit}
        disabled={!title.trim() || saving}
        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-40 transition"
      >
        {saving
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Plus className="h-3.5 w-3.5" />
        }
        {saving ? "Adding…" : "Add post"}
      </button>
    </div>
  );
}

// ─── Ideas view ───────────────────────────────────────────────────────────────

function IdeasView({ ideas, addIdea, convertIdea }) {
  const [text, setText] = useState("");
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
      <Card>
        <SectionLabel>Idea inbox</SectionLabel>
        <h2 className="mt-0.5 mb-1 text-lg font-bold text-slate-900">Capture ideas</h2>
        <p className="mb-4 text-sm text-slate-500">Drop it before it disappears.</p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Hook, angle, caption direction…"
          rows={5}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm leading-6 outline-none focus:border-slate-300 focus:bg-white transition placeholder:text-slate-300"
        />
        <button
          onClick={() => { addIdea(text); setText(""); }}
          className="mt-3 flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition"
        >
          <Inbox className="h-3.5 w-3.5" />
          Capture idea
        </button>
      </Card>

      <Card>
        <SectionLabel>Stored ideas</SectionLabel>
        <h2 className="mt-0.5 mb-4 text-lg font-bold text-slate-900">Your idea queue</h2>
        <div className="space-y-2">
          {ideas.length > 0 ? ideas.map(idea => (
            <div
              key={idea.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="rounded-lg bg-white p-2 shadow-sm shrink-0">
                  <Wand2 className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <p className="truncate text-sm font-medium text-slate-700">{idea.title}</p>
              </div>
              <button
                onClick={() => convertIdea(idea)}
                className="shrink-0 flex items-center gap-1 rounded-lg border border-blue-100 bg-white px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition"
              >
                Post <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )) : (
            <Empty icon={Inbox} title="No ideas yet" text="Captured ideas will appear here." />
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Vault view ───────────────────────────────────────────────────────────────

function VaultView({ vault, addVault }) {
  const [text, setText] = useState("");
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
      <Card>
        <SectionLabel>Content vault</SectionLabel>
        <h2 className="mt-0.5 mb-1 text-lg font-bold text-slate-900">Save reusable copy</h2>
        <p className="mb-4 text-sm text-slate-500">Hooks, CTAs, hashtag sets, frameworks.</p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Hook, CTA, hashtag group…"
          rows={5}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm leading-6 outline-none focus:border-slate-300 focus:bg-white transition placeholder:text-slate-300"
        />
        <button
          onClick={() => { addVault(text); setText(""); }}
          className="mt-3 flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition"
        >
          <Upload className="h-3.5 w-3.5" />
          Save to vault
        </button>
      </Card>

      <Card>
        <SectionLabel>Saved items</SectionLabel>
        <h2 className="mt-0.5 mb-4 text-lg font-bold text-slate-900">Copy library</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {vault.length > 0 ? vault.map(item => (
            <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-2 inline-flex rounded-lg bg-white p-2 shadow-sm">
                <Layers className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-800">{item.title || "Saved Content"}</p>
              <p className="mt-1.5 text-xs leading-5 text-slate-600">{item.content}</p>
            </div>
          )) : (
            <div className="md:col-span-2">
              <Empty icon={Layers} title="Vault is empty" text="Saved hooks, CTAs, and frameworks will appear here." />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Notifications view ───────────────────────────────────────────────────────

function NotificationsView({ notifications }) {
  const colors = {
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    info:    "bg-sky-50 text-sky-600 border-sky-100",
    error:   "bg-red-50 text-red-600 border-red-100",
  };
  const icons = { success: "✓", warning: "!", info: "i", error: "×" };

  return (
    <Card>
      <SectionLabel>Notifications</SectionLabel>
      <h2 className="mt-0.5 mb-5 text-lg font-bold text-slate-900">Activity & reminders</h2>
      <div className="space-y-2">
        {notifications.length > 0 ? notifications.map(n => (
          <div
            key={n.id}
            className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${colors[n.type] || colors.info}`}>
              {icons[n.type] || "·"}
            </span>
            <p className="text-sm text-slate-600 leading-5">{n.message}</p>
          </div>
        )) : (
          <Empty icon={Bell} title="No notifications" text="Activity alerts will show here." />
        )}
      </div>
    </Card>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Draft;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${s.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function PlatformPill({ platform }) {
  const s = PLATFORM_STYLE[platform] || PLATFORM_STYLE.Instagram;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${s.pill}`}>
      {platform}
    </span>
  );
}

function Panel({ children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
      {children}
    </p>
  );
}

function NavBtn({ active, icon: Icon, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-slate-900 text-white"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {children}
    </button>
  );
}

function IconBtn({ onClick, children, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-lg p-1.5 transition ${danger ? "hover:bg-red-50" : "hover:bg-slate-100"}`}
    >
      {children}
    </button>
  );
}

function Empty({ icon: Icon, title, text }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <Icon className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-[220px] text-xs text-slate-400 leading-5">{text}</p>
    </div>
  );
}

// ─── Global utility styles ────────────────────────────────────────────────────

const _style = document.createElement("style");
_style.textContent = `
  .field-label  { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.12em; color:#94a3b8; }
  .panel-label  { display:block; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.12em; color:#94a3b8; margin-bottom:6px; }
`;
document.head.appendChild(_style);