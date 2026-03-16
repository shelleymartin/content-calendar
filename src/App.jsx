import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Layers,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "./lib/supabase";

const VIEW_OPTIONS = [
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "ideas", label: "Idea Inbox", icon: Inbox },
  { id: "vault", label: "Content Vault", icon: Layers },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const STATUSES = ["Draft", "Approved", "Scheduled", "Posted"];

const PLATFORM_COLORS = {
  Instagram: "bg-pink-50 text-pink-700 border-pink-200",
  TikTok: "bg-slate-100 text-slate-700 border-slate-200",
  YouTube: "bg-rose-50 text-rose-700 border-rose-200",
  LinkedIn: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Facebook: "bg-blue-50 text-blue-700 border-blue-200",
};

const STATUS_COLORS = {
  Draft: "bg-slate-100 text-slate-700 border-slate-200",
  Approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Scheduled: "bg-sky-100 text-sky-800 border-sky-200",
  Posted: "bg-violet-100 text-violet-800 border-violet-200",
};

function seedState() {
  return {
    ideas: [],
    posts: [],
    vault: [],
    notifications: [],
  };
}

export default function CreatorContentOS() {
  const [db, setDB] = useState(seedState());
  const [view, setView] = useState("calendar");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData(true);

    const channel = supabase
      .channel("shared-content-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => fetchAllData(false)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ideas" },
        () => fetchAllData(false)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vault" },
        () => fetchAllData(false)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => fetchAllData(false)
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchAllData(showLoader = false) {
    if (showLoader) setLoading(true);

    const [postsRes, ideasRes, vaultRes, notificationsRes] = await Promise.all([
      supabase.from("posts").select("*").order("date", { ascending: true }),
      supabase.from("ideas").select("*").order("created_at", { ascending: false }),
      supabase.from("vault").select("*").order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").order("created_at", { ascending: false }),
    ]);

    if (postsRes.error) console.error("Posts error:", postsRes.error);
    if (ideasRes.error) console.error("Ideas error:", ideasRes.error);
    if (vaultRes.error) console.error("Vault error:", vaultRes.error);
    if (notificationsRes.error) console.error("Notifications error:", notificationsRes.error);

    setDB({
      posts: postsRes.data || [],
      ideas: ideasRes.data || [],
      vault: vaultRes.data || [],
      notifications: notificationsRes.data || [],
    });

    if (showLoader) setLoading(false);
  }

  const filteredPosts = useMemo(() => {
    return [...db.posts]
      .filter((post) => {
        const query = search.toLowerCase();
        return (
          (post.title || "").toLowerCase().includes(query) ||
          (post.platform || "").toLowerCase().includes(query) ||
          (post.status || "").toLowerCase().includes(query) ||
          (post.caption || "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [db.posts, search]);

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return filteredPosts.filter((post) => post.date >= today);
  }, [filteredPosts]);

  const postsThisWeek = useMemo(() => {
    const today = new Date();
    const end = new Date();
    end.setDate(today.getDate() + 7);

    return db.posts.filter((post) => {
      if (!post.date) return false;
      const date = new Date(`${post.date}T00:00:00`);
      return date >= stripTime(today) && date <= stripTime(end);
    }).length;
  }, [db.posts]);

  const monthGrid = useMemo(() => {
    return buildCalendarGrid(selectedDate, db.posts);
  }, [selectedDate, db.posts]);

  async function addNotification(message, type = "info", relatedPostId = null) {
    const { error } = await supabase.from("notifications").insert([
      {
        message,
        type,
        read: false,
        related_post_id: relatedPostId,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Notification insert error:", error);
    }
  }

  async function addIdea(text) {
    if (!text.trim()) return;

    const payload = {
      title: text.trim(),
      platform: "Instagram",
      notes: "",
      status: "Idea",
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("ideas").insert([payload]);

    if (error) {
      console.error("Idea insert error:", error);
    }
  }

  async function convertIdeaToPost(idea) {
    const postPayload = {
      title: idea.title || "Untitled Idea",
      date: new Date().toISOString().slice(0, 10),
      platform: idea.platform || "Instagram",
      status: "Draft",
      caption: idea.notes || "",
      updated_at: new Date().toISOString(),
    };

    const { data: insertedPost, error: insertError } = await supabase
      .from("posts")
      .insert([postPayload])
      .select();

    if (insertError) {
      console.error("Convert idea insert error:", insertError);
      return;
    }

    const { error: deleteError } = await supabase.from("ideas").delete().eq("id", idea.id);

    if (deleteError) {
      console.error("Idea delete error:", deleteError);
    }

    await addNotification(
      `New post created from idea: ${idea.title}`,
      "success",
      insertedPost?.[0]?.id ?? null
    );
  }

  async function addPost(post) {
    const payload = {
      title: post.title,
      date: post.date,
      platform: post.platform,
      status: post.status || "Draft",
      caption: post.caption || "",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("posts").insert([payload]).select();

    if (error) {
      console.error("Post insert error:", error);
      return;
    }

    if (data?.[0]) {
      await addNotification(`${data[0].title} was added to your calendar.`, "success", data[0].id);
    }
  }

  async function deletePost(id) {
    const post = db.posts.find((item) => item.id === id);

    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) {
      console.error("Post delete error:", error);
      return;
    }

    if (post) {
      await addNotification(`${post.title} was deleted.`, "warning", id);
    }
  }

  async function updateStatus(id, status) {
    const { data, error } = await supabase
      .from("posts")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Post update error:", error);
      return;
    }

    const updatedPost = data?.[0];

    if (updatedPost) {
      await addNotification(`${updatedPost.title} was moved to ${status}.`, "info", updatedPost.id);
    }
  }

  async function addVaultItem(text) {
    if (!text.trim()) return;

    const payload = {
      title: "Saved Content",
      platform: "General",
      content: text.trim(),
      media_url: "",
      tags: "",
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("vault").insert([payload]);

    if (error) {
      console.error("Vault insert error:", error);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffffff,_#f8fafc_38%,_#e2e8f0_100%)] text-slate-900">
      <div className="mx-auto max-w-[1440px] p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[34px] border border-white/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white shadow-2xl shadow-slate-300/40"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200">
                <Sparkles className="h-3.5 w-3.5" /> Creator planning system
              </div>
              <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
                Creator Content OS
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                A polished space to capture ideas, plan content, store reusable copy, and keep your
                posting rhythm clear.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <HeroMetric label="Upcoming" value={upcoming.length} />
              <HeroMetric label="This Week" value={postsThisWeek} />
              <HeroMetric label="Vault Items" value={db.vault.length} />
            </div>
          </div>
        </motion.div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[260px_1fr]">
          <aside className="space-y-5">
            <CardShell>
              <div className="space-y-2">
                {VIEW_OPTIONS.map((item) => (
                  <NavButton
                    key={item.id}
                    active={view === item.id}
                    onClick={() => setView(item.id)}
                    icon={item.icon}
                  >
                    {item.label}
                  </NavButton>
                ))}
              </div>
            </CardShell>

            <CardShell>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Quick capture
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">Fast add</h3>
                </div>
                <button
                  onClick={() => setShowQuickAdd((value) => !value)}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  <Plus className="mr-1 inline h-4 w-4" /> New
                </button>
              </div>
              {showQuickAdd && <QuickAdd addPost={addPost} />}
            </CardShell>

            <CardShell>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Search
              </p>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search posts, captions, platform"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
                />
              </div>
            </CardShell>
          </aside>

          <main className="space-y-6">
            {loading ? (
              <CardShell>
                <p className="text-sm text-slate-500">Loading data from Supabase...</p>
              </CardShell>
            ) : (
              <>
                {view === "calendar" && (
                  <CalendarView
                    posts={db.posts}
                    upcoming={upcoming}
                    deletePost={deletePost}
                    updateStatus={updateStatus}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    monthGrid={monthGrid}
                  />
                )}

                {view === "ideas" && (
                  <IdeasView
                    ideas={db.ideas}
                    addIdea={addIdea}
                    convertIdea={convertIdeaToPost}
                  />
                )}

                {view === "vault" && (
                  <VaultView vault={db.vault} addVaultItem={addVaultItem} />
                )}

                {view === "notifications" && (
                  <NotificationsView notifications={db.notifications} />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function CalendarView({
  posts,
  upcoming,
  deletePost,
  updateStatus,
  selectedDate,
  setSelectedDate,
  monthGrid,
}) {
  const todayPosts = posts
    .filter((post) => post.date === formatDate(selectedDate))
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""));

  return (
    <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
      <CardShell className="overflow-hidden">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Calendar
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Monthly view</h2>
          </div>
          <CalendarHeader selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        </div>

        <div className="grid grid-cols-7 gap-3">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="rounded-2xl bg-slate-100 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
            >
              {day}
            </div>
          ))}

          {monthGrid.map((cell, index) => {
            if (!cell) {
              return (
                <div
                  key={`blank-${index}`}
                  className="min-h-[145px] rounded-3xl border border-dashed border-slate-200 bg-slate-50/80"
                />
              );
            }

            const isSelected = cell.date === formatDate(selectedDate);
            const isToday = cell.date === formatDate(new Date());

            return (
              <button
                key={cell.date}
                onClick={() => setSelectedDate(new Date(`${cell.date}T00:00:00`))}
                className={`min-h-[145px] rounded-3xl border p-3 text-left transition ${
                  isSelected
                    ? "border-slate-900 bg-gradient-to-br from-slate-50 to-white shadow-lg ring-2 ring-slate-900/10"
                    : isToday
                      ? "border-slate-300 bg-white shadow-sm"
                      : "border-slate-200 bg-white/90 shadow-sm hover:bg-white"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">{cell.day}</span>
                  {cell.posts.length > 0 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                      {cell.posts.length}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {cell.posts.slice(0, 2).map((post) => (
                    <div
                      key={post.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs"
                    >
                      <div className="truncate font-medium text-slate-800">{post.title}</div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                            PLATFORM_COLORS[post.platform] ||
                            "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {post.platform}
                        </span>
                      </div>
                    </div>
                  ))}

                  {cell.posts.length > 2 && (
                    <div className="text-[11px] font-medium text-slate-500">
                      +{cell.posts.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardShell>

      <div className="space-y-6">
        <CardShell>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Selected day
          </p>
          <h3 className="mt-1 text-xl font-semibold">
            {selectedDate.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h3>

          <div className="mt-4 space-y-3">
            {todayPosts.length > 0 ? (
              todayPosts.map((post) => (
                <PostRow
                  key={post.id}
                  post={post}
                  deletePost={deletePost}
                  updateStatus={updateStatus}
                />
              ))
            ) : (
              <EmptyState
                icon={Calendar}
                title="No posts for this day"
                text="Choose another date or add a new post from the quick capture panel."
              />
            )}
          </div>
        </CardShell>

        <CardShell>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Upcoming queue
          </p>
          <h3 className="mt-1 text-xl font-semibold">What’s coming next</h3>

          <div className="mt-4 space-y-3">
            {upcoming.slice(0, 5).map((post) => (
              <div key={post.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{post.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{post.date}</p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                      STATUS_COLORS[post.status] ||
                      "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardShell>
      </div>
    </div>
  );
}

function PostRow({ post, deletePost, updateStatus }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-slate-900">{post.title}</h4>
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                STATUS_COLORS[post.status] || "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {post.status}
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                PLATFORM_COLORS[post.platform] ||
                "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {post.platform}
            </span>
          </div>
          {post.caption && <p className="mt-2 text-sm leading-6 text-slate-600">{post.caption}</p>}
        </div>

        <button
          onClick={() => deletePost(post.id)}
          className="inline-flex items-center gap-1 self-start rounded-2xl px-3 py-2 text-sm text-rose-700 transition hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => updateStatus(post.id, status)}
            className={`rounded-2xl px-3 py-1.5 text-sm font-medium transition ${
              post.status === status
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}

function IdeasView({ ideas, addIdea, convertIdea }) {
  const [text, setText] = useState("");

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <CardShell>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Idea inbox
        </p>
        <h2 className="mt-1 text-2xl font-semibold">Capture ideas quickly</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Drop ideas here before they disappear. Turn any one of them into a post when you’re ready.
        </p>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a hook, angle, caption direction, or post idea"
            className="min-h-[140px] w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none transition focus:border-slate-300"
          />
          <button
            className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            onClick={() => {
              addIdea(text);
              setText("");
            }}
          >
            <Inbox className="h-4 w-4" /> Capture idea
          </button>
        </div>
      </CardShell>

      <CardShell>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Stored ideas
        </p>
        <h2 className="mt-1 text-2xl font-semibold">Your idea queue</h2>

        <div className="mt-5 space-y-3">
          {ideas.length > 0 ? (
            ideas.map((idea) => (
              <div
                key={idea.id}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <Wand2 className="h-4 w-4 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-sm leading-6 text-slate-700">{idea.title}</p>
                    {idea.notes && <p className="mt-1 text-xs text-slate-500">{idea.notes}</p>}
                  </div>
                </div>

                <button
                  className="rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                  onClick={() => convertIdea(idea)}
                >
                  Turn into post
                </button>
              </div>
            ))
          ) : (
            <EmptyState icon={Inbox} title="No ideas yet" text="Your saved ideas will show up here." />
          )}
        </div>
      </CardShell>
    </div>
  );
}

function VaultView({ vault, addVaultItem }) {
  const [text, setText] = useState("");

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <CardShell>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Content vault
        </p>
        <h2 className="mt-1 text-2xl font-semibold">Save reusable copy</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Store hooks, CTAs, hashtag sets, and reusable text so you can pull from it whenever you
          create content.
        </p>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Hook, CTA, caption framework, or hashtag group"
            className="min-h-[140px] w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none transition focus:border-slate-300"
          />
          <button
            onClick={() => {
              addVaultItem(text);
              setText("");
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Upload className="h-4 w-4" /> Save to vault
          </button>
        </div>
      </CardShell>

      <CardShell>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Saved items
        </p>
        <h2 className="mt-1 text-2xl font-semibold">Your copy library</h2>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {vault.length > 0 ? (
            vault.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm"
              >
                <div className="mb-3 inline-flex rounded-2xl bg-slate-100 p-2.5 text-slate-700">
                  <Layers className="h-4 w-4" />
                </div>
                <p className="font-medium text-slate-900">{item.title || "Saved Content"}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.content}</p>
              </div>
            ))
          ) : (
            <div className="md:col-span-2">
              <EmptyState
                icon={Layers}
                title="Nothing in your vault yet"
                text="Your saved hooks, CTAs, and copy frameworks will appear here."
              />
            </div>
          )}
        </div>
      </CardShell>
    </div>
  );
}

function NotificationsView({ notifications }) {
  return (
    <CardShell>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        Notifications
      </p>
      <h2 className="mt-1 text-2xl font-semibold">Activity and reminders</h2>

      <div className="mt-5 space-y-3">
        {notifications.length > 0 ? (
          notifications.map((note) => (
            <div
              key={note.id}
              className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="rounded-2xl bg-white p-3 shadow-sm">
                <Bell className="h-4 w-4 text-slate-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{note.type || "Notification"}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{note.message}</p>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            text="Reminders and activity alerts will show up here."
          />
        )}
      </div>
    </CardShell>
  );
}

function QuickAdd({ addPost }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [platform, setPlatform] = useState("Instagram");

  return (
    <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title"
        className="mb-3 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-300"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-300"
        />
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-300"
        >
          {Object.keys(PLATFORM_COLORS).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={() => {
          if (!title.trim()) return;
          addPost({
            title: title.trim(),
            date,
            platform,
            status: "Draft",
            caption: "",
          });
          setTitle("");
        }}
        className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        <Plus className="h-4 w-4" /> Add post
      </button>
    </div>
  );
}

function CalendarHeader({ selectedDate, setSelectedDate }) {
  const label = selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() =>
          setSelectedDate(
            new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
          )
        }
        className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 transition hover:bg-slate-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="min-w-[180px] rounded-2xl bg-slate-100 px-4 py-2 text-center text-sm font-semibold text-slate-700">
        {label}
      </div>

      <button
        onClick={() =>
          setSelectedDate(
            new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1)
          )
        }
        className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 transition hover:bg-slate-50"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function HeroMetric({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function CardShell({ children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur md:p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function NavButton({ active, children, icon: Icon, ...props }) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
      }`}
      {...props}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <div className="mx-auto mb-4 inline-flex rounded-3xl bg-white p-4 shadow-sm">
        <Icon className="h-5 w-5 text-slate-700" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function buildCalendarGrid(selectedDate, posts) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingBlanks = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const cells = [];

  for (let i = 0; i < leadingBlanks; i += 1) cells.push(null);

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month, day).toISOString().slice(0, 10);
    cells.push({
      day,
      date,
      posts: posts.filter((post) => post.date === date),
    });
  }

  return cells;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
