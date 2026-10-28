import { useEffect, useState } from "react";
import { AlertCircle, Bell, Check, Clock3, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { api, errorMessage, getData } from "../../services/apiClient";

function dateRange() {
  const from = new Date();
  const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { dueFrom: from.toISOString(), dueTo: to.toISOString() };
}

export default function TaskFollowupBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [overdue, setOverdue] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);

  async function load() {
    setLoading(true); setError("");
    const range = dateRange();
    try {
      const [late, todo, active] = await Promise.all([
        getData("/tasks", { overdue: true, page: 0, size: 20 }),
        getData("/tasks", { ...range, status: "TODO", page: 0, size: 20 }),
        getData("/tasks", { ...range, status: "IN_PROGRESS", page: 0, size: 20 }),
      ]);
      setOverdue(late.content || []);
      setOverdueCount(late.totalElements || 0);
      setUpcoming([...(todo.content || []), ...(active.content || [])]
        .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
        .slice(0, 10));
      setUpcomingCount((todo.totalElements || 0) + (active.totalElements || 0));
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = event => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function complete(taskId) {
    try { await api.patch("/tasks/" + taskId + "/status", { status: "COMPLETED" }); await load(); }
    catch (requestError) { setError(errorMessage(requestError)); }
  }

  const count = overdueCount + upcomingCount;
  return <div className="relative">
    <button type="button" aria-label={"Task reminders, " + count + " items"}
      aria-expanded={open} aria-controls="task-followup-panel"
      onClick={() => { const next = !open; setOpen(next); if (next) void load(); }}
      className="relative grid h-9 w-9 place-items-center rounded-full border border-white/[.08] bg-white/[.035] text-[#bac3d9] hover:bg-white/[.08]">
      <Bell size={16}/>
      {count > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-400 px-1 text-center text-[9px] font-bold leading-4 text-slate-950">{count > 99 ? "99+" : count}</span>}
    </button>
    {open && <section id="task-followup-panel" aria-label="Task reminders"
      className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] rounded-2xl border border-white/10 bg-[#151a29] p-4 shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm font-bold">Task follow-ups</h2>
          <p className="mt-1 text-[10px] text-[#8993ab]">Overdue and due in the next 7 days</p>
        </div>
        <button type="button" aria-label="Refresh task reminders" disabled={loading}
          onClick={() => void load()} className="rounded-lg p-2 text-[#9ca6bd] hover:bg-white/[.06] disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>
        </button>
      </div>
      {error && <div role="alert" className="mb-3 rounded-lg border border-rose-300/10 bg-rose-300/[.05] p-2 text-xs text-rose-200">{error}</div>}
      {loading && <div role="status" className="py-4 text-center text-xs text-[#9aa3ba]">Loading reminders...</div>}
      {!loading && !error && !count && <div className="py-6 text-center text-xs text-[#929bb2]">No overdue or upcoming tasks.</div>}
      {!loading && overdue.length > 0 && <div className="mb-3">
        <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-rose-200"><AlertCircle size={12}/> Overdue</div>
        {overdue.slice(0, 5).map(task => <div key={task.id} className="flex items-center gap-2 border-b border-white/[.05] py-2">
          <button type="button" title="Mark task completed" aria-label={"Complete " + task.title}
            onClick={() => void complete(task.id)} className="text-[#7e8a9f] hover:text-emerald-200"><Check size={15}/></button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs text-[#e2e6f0]">{task.title}</div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-200"><Clock3 size={10}/>{new Date(task.dueAt).toLocaleString()}</div>
          </div>
        </div>)}
      </div>}
      {!loading && upcoming.length > 0 && <div>
        <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-indigo-200"><Clock3 size={12}/> Coming up</div>
        {upcoming.slice(0, 5).map(task => <div key={task.id} className="flex items-center gap-2 border-b border-white/[.05] py-2">
          <button type="button" title="Mark task completed" aria-label={"Complete " + task.title}
            onClick={() => void complete(task.id)} className="text-[#7e8a9f] hover:text-emerald-200"><Check size={15}/></button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs text-[#e2e6f0]">{task.title}</div>
            <div className="mt-1 text-[10px] text-[#8993ab]">{new Date(task.dueAt).toLocaleString()}</div>
          </div>
        </div>)}
      </div>}
      <Link to="/tasks" onClick={() => setOpen(false)} className="mt-3 block rounded-lg border border-white/[.08] px-3 py-2 text-center text-xs text-indigo-200 hover:bg-white/[.04]">View all tasks</Link>
    </section>}
  </div>;
}
