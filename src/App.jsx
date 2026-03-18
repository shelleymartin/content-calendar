import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const PLATFORM_OPTIONS = [
  "Instagram",
  "Facebook",
  "LinkedIn",
  "TikTok",
  "YouTube",
  "General",
];

const STATUS_OPTIONS = ["Draft", "Approved", "Scheduled", "Posted"];

const STATUS_STYLES = {
  Draft: "bg-slate-900 text-white border-slate-900",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Scheduled: "bg-amber-50 text-amber-700 border-amber-200",
  Posted: "bg-sky-50 text-sky-700 border-sky-200",
};

const PLATFORM_STYLES = {
  Instagram: "bg-pink-50 text-pink-700 border-pink-200",
  Facebook: "bg-blue-50 text-blue-700 border-blue-200",
  LinkedIn: "bg-indigo-50 text-indigo-700 border-indigo-200",
  TikTok: "bg-slate-100 text-slate-700 border-slate-200",
  YouTube: "bg-red-50 text-red-700 border-red-200",
  General: "bg-violet-50 text-violet-700 border-violet-200",
};

const todayISO = new Date().toISOString().slice(0, 10);

function App() {
  const [posts, setPosts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [quickForm, setQuickForm] = useState({
    title: "",
    date: todayISO,
    platform: "Instagram",
    notes: "",
    video_link: "",
    caption: "",
    feedback: "",
    revision_notes: "",
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Fetch posts error:", error);
      setErrorMessage(error.message || "Could not load posts.");
      setLoading(false);
      return;
    }

    setPosts(data || []);
    setLoading(false);
  }

  async function addPost(e) {
    e.preventDefault();
    setErrorMessage("");

    if (!quickForm.title.trim()) {
      setErrorMessage("Please add a post title.");
      return;
    }

    const payload = {
      title: quickForm.title.trim(),
      date: quickForm.date,
      platform: quickForm.platform,
      status: "Draft",
      notes: quickForm.notes.trim(),
      video_link: quickForm.video_link.trim(),
      caption: quickForm.caption.trim(),
      feedback: quickForm.feedback.trim(),
      revision_notes: quickForm.revision_notes.trim(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("posts")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Add post error:", error);
      setErrorMessage(error.message || "Could not create post.");
      return;
    }

    setPosts((prev) =>
      [...prev, data].sort((a, b) => {
        if (a.date === b.date) return (a.created_at || "").localeCompare(b.created_at || "");
        return a.date.localeCompare(b.date);
      })
    );

    setQuickForm({
      title: "",
      date: quickForm.date,
      platform: quickForm.platform,
      notes: "",
      video_link: "",
      caption: "",
      feedback: "",
      revision_notes: "",
    });

    setSelectedDate(payload.date);
  }

  async function deletePost(id) {
    setErrorMessage("");

    const existing = posts.find((post) => post.id === id);

    setPosts((prev) => prev.filter((post) => post.id !== id));

    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) {
      console.error("Delete post error:", error);
      setErrorMessage(error.message || "Could not delete post.");
      if (existing) {
        setPosts((prev) => [...prev, existing].sort((a, b) => a.date.localeCompare(b.date)));
      }
    }
  }

  async function updateStatus(id, status) {
    await updatePost(id, "status", status);
  }

  async function updatePost(id, field, value) {
    setSavingId(id);
    setErrorMessage("");

    const previousPosts = posts;

    setPosts((prev) =>
      prev.map((post) =>
        post.id === id ? { ...post, [field]: value, updated_at: new Date().toISOString() } : post
      )
    );

    const { data, error } = await supabase
      .from("posts")
      .update({
        [field]: value,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    setSavingId(null);

    if (error) {
      console.error("Update post error:", error);
      setErrorMessage(error.message || "Could not update post.");
      setPosts(previousPosts);
      return;
    }

    setPosts((prev) => prev.map((post) => (post.id === id ? data : post)));
  }

  const selectedDateLabel = useMemo(() => {
    return formatDisplayDate(selectedDate);
  }, [selectedDate]);

  const monthLabel = useMemo(() => {
    return currentMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [currentMonth]);

  const calendarDays = useMemo(() => {
    return buildCalendarDays(currentMonth);
  }, [currentMonth]);

  const postsByDate = useMemo(() => {
    const map = new Map();

    for (const post of posts) {
      const key = post.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(post);
    }

    return map;
  }, [posts]);

  const todayPosts = useMemo(() => {
    return (postsByDate.get(selectedDate) || []).sort((a, b) =>
      (a.created_at || "").localeCompare(b.created_at || "")
    );
  }, [postsByDate, selectedDate]);

  const upcoming = useMemo(() => {
    return [...posts]
      .filter((post) => post.date >= todayISO)
      .sort((a, b) => {
        if (a.date === b.date) return (a.created_at || "").localeCompare(b.created_at || "");
        return a.date.localeCompare(b.date);
      })
      .slice(0, 5);
  }, [posts]);

  const monthStats = useMemo(() => {
    const visibleMonth = currentMonth.getMonth();
    const visibleYear = currentMonth.getFullYear();

    const inMonth = posts.filter((post) => {
      const date = new Date(`${post.date}T00:00:00`);
      return date.getMonth() === visibleMonth && date.getFullYear() === visibleYear;
    });

    return {
      upcoming: posts.filter((post) => post.date >= todayISO).length,
      thisWeek: posts.filter((post) => isInThisWeek(post.date)).length,
      vaultItems: 0,
      inMonth: inMonth.length,
    };
  }, [posts, currentMonth]);

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-8 py-8 text-white shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                Deeper Healing Content Calendar
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-200">
                A polished space to plan content, organize approvals, store reusable copy,
                and keep your marketing workflow clear.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Upcoming" value={monthStats.upcoming} />
              <StatCard label="This Week" value={monthStats.thisWeek} />
              <StatCard label="Vault Items" value={monthStats.vaultItems} />
            </div>
          </div>
        </header>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_400px]">
          <aside className="space-y-6">
            <CardShell>
              <div className="space-y-3">
                <SidebarButton active>Calendar</SidebarButton>
                <SidebarButton>Idea Inbox</SidebarButton>
                <SidebarButton>Content Vault</SidebarButton>
                <SidebarButton>Notifications</SidebarButton>
              </div>
            </CardShell>

            <CardShell>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Quick Capture
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">Fast add</h2>
                </div>
              </div>

              <form onSubmit={addPost} className="mt-5 space-y-3">
                <input
                  type="text"
                  value={quickForm.title}
                  onChange={(e) => setQuickForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Post title"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                />

                <div className="grid grid-cols-[1fr_1fr] gap-3">
                  <input
                    type="date"
                    value={quickForm.date}
                    onChange={(e) => setQuickForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  />

                  <select
                    value={quickForm.platform}
                    onChange={(e) =>
                      setQuickForm((prev) => ({ ...prev, platform: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  >
                    {PLATFORM_OPTIONS.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  value={quickForm.notes}
                  onChange={(e) => setQuickForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Notes"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                />

                <input
                  type="text"
                  value={quickForm.video_link}
                  onChange={(e) =>
                    setQuickForm((prev) => ({ ...prev, video_link: e.target.value }))
                  }
                  placeholder="Video link"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                />

                <textarea
                  value={quickForm.caption}
                  onChange={(e) => setQuickForm((prev) => ({ ...prev, caption: e.target.value }))}
                  rows={4}
                  placeholder="Caption for approval"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                />

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  + New
                </button>
              </form>
            </CardShell>
          </aside>

          <CardShell>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Calendar
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Monthly view</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                >
                  ‹
                </button>
                <div className="min-w-[180px] rounded-full bg-slate-100 px-5 py-2 text-center text-sm font-medium">
                  {monthLabel}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-3">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="rounded-full bg-slate-100 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-7 gap-3">
              {calendarDays.map((day) => {
                const dateKey = toISODate(day.date);
                const dayPosts = postsByDate.get(dateKey) || [];
                const isSelected = dateKey === selectedDate;
                const inCurrentMonth = day.inCurrentMonth;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDate(dateKey)}
                    className={`min-h-[132px] rounded-[28px] border p-3 text-left transition ${
                      isSelected
                        ? "border-slate-900 bg-white shadow-sm"
                        : inCurrentMonth
                        ? "border-slate-200 bg-white hover:border-slate-300"
                        : "border-slate-200 bg-slate-50 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-medium">{day.date.getDate()}</span>
                      {dayPosts.length > 0 ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                          {dayPosts.length}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 space-y-2">
                      {dayPosts.slice(0, 2).map((post) => (
                        <div key={post.id} className="space-y-1">
                          <p className="truncate text-sm font-medium text-slate-700">
                            {post.title}
                          </p>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                              PLATFORM_STYLES[post.platform] || "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {post.platform}
                          </span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardShell>

          <div className="space-y-6">
            <CardShell>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Selected Day
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{selectedDateLabel}</h2>

              <div className="mt-5 space-y-4">
                {loading ? (
                  <EmptyState
                    title="Loading posts"
                    text="Please wait while your calendar data loads."
                  />
                ) : todayPosts.length > 0 ? (
                  todayPosts.map((post) => (
                    <PostRow
                      key={post.id}
                      post={post}
                      deletePost={deletePost}
                      updateStatus={updateStatus}
                      updatePost={updatePost}
                      isSaving={savingId === post.id}
                    />
                  ))
                ) : (
                  <EmptyState
                    title="No posts for this day"
                    text="Choose another date or add a new post from the quick capture panel."
                  />
                )}
              </div>
            </CardShell>

            <CardShell>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Upcoming Queue
              </p>
              <h2 className="mt-2 text-2xl font-semibold">What’s coming next</h2>

              <div className="mt-5 space-y-3">
                {upcoming.length > 0 ? (
                  upcoming.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{post.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{post.date}</p>
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                            STATUS_STYLES[post.status] || "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="Nothing in queue"
                    text="Add a few posts and your upcoming queue will show here."
                  />
                )}
              </div>
            </CardShell>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostRow({ post, deletePost, updateStatus, updatePost, isSaving }) {
  const safeVideoUrl = normalizeUrl(post.video_link);

  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="w-full">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">{post.title}</h3>

            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                STATUS_STYLES[post.status] || "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {post.status}
            </span>

            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                PLATFORM_STYLES[post.platform] || "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {post.platform}
            </span>

            {isSaving ? (
              <span className="text-xs font-medium text-slate-500">Saving…</span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => deletePost(post.id)}
          className="text-sm font-medium text-red-500 hover:text-red-600"
        >
          Delete
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <EditableField
          label="Notes"
          value={post.notes || ""}
          onChange={(value) => updatePost(post.id, "notes", value)}
          multiline
          rows={3}
          placeholder="Add internal notes..."
        />

        <EditableField
          label="Video Link"
          value={post.video_link || ""}
          onChange={(value) => updatePost(post.id, "video_link", value)}
          placeholder="Paste the video link here..."
        />

        {safeVideoUrl ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Open Video
            </p>
            <a
              href={safeVideoUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all text-sm font-medium text-blue-700 underline"
            >
              {post.video_link}
            </a>
          </div>
        ) : null}

        <EditableField
          label="Caption for Approval"
          value={post.caption || ""}
          onChange={(value) => updatePost(post.id, "caption", value)}
          multiline
          rows={5}
          placeholder="Write or edit the caption here..."
        />

        <EditableField
          label="Feedback / Revision Requests"
          value={post.feedback || ""}
          onChange={(value) => updatePost(post.id, "feedback", value)}
          multiline
          rows={4}
          placeholder="Add feedback or requested changes..."
        />

        <EditableField
          label="Revision Notes"
          value={post.revision_notes || ""}
          onChange={(value) => updatePost(post.id, "revision_notes", value)}
          multiline
          rows={3}
          placeholder="Track what was updated after review..."
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((status) => {
          const active = post.status === status;

          return (
            <button
              key={status}
              type="button"
              onClick={() => updateStatus(post.id, status)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {status}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  placeholder = "",
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </label>

      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400"
        />
      )}
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
      <p className="font-medium text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function CardShell({ children }) {
  return <section className="rounded-[32px] bg-white p-6 shadow-sm">{children}</section>;
}

function SidebarButton({ children, active = false }) {
  return (
    <button
      type="button"
      className={`flex w-full items-center rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
        active ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">{label}</p>
      <p className="mt-2 text-4xl font-semibold text-white">{value}</p>
    </div>
  );
}

function normalizeUrl(value) {
  if (!value || !value.trim()) return "";
  const trimmed = value.trim();

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function formatDisplayDate(isoDate) {
  if (!isoDate) return "";
  const date = new Date(`${isoDate}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function buildCalendarDays(monthDate) {
  const firstDay = startOfMonth(monthDate);
  const startDayIndex = firstDay.getDay();
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - startDayIndex);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    return {
      date,
      inCurrentMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
}

function isInThisWeek(isoDate) {
  const input = new Date(`${isoDate}T00:00:00`);
  const now = new Date();

  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() - now.getDay());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return input >= weekStart && input <= weekEnd;
}

export default App;
