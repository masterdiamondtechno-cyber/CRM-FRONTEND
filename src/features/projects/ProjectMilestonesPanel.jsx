import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Flag, Plus, Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { api, errorMessage, getData } from "../../services/apiClient";

function canManageMilestones() {
  try { return ["OWNER", "ADMIN", "MANAGER"].includes(JSON.parse(sessionStorage.getItem("crm_user") || "null")?.role); }
  catch { return false; }
}

const statusLabels = { PLANNED: "Planned", IN_PROGRESS: "In progress", COMPLETED: "Completed" };

export default function ProjectMilestonesPanel() {
  const { id } = useParams();
  const canManage = canManageMilestones();
  const [milestones, setMilestones] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", dueDate: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setMilestones(await getData(`/projects/${id}/milestones`)); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);
  const completedCount = useMemo(() => milestones.filter(item => item.status === "COMPLETED").length, [milestones]);
  const progress = milestones.length ? Math.round((completedCount / milestones.length) * 100) : 0;

  async function create(event) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      await api.post(`/projects/${id}/milestones`, { ...form, dueDate: form.dueDate || null });
      setForm({ name: "", description: "", dueDate: "" });
      setNotice("Milestone added.");
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setSaving(false); }
  }

  async function changeStatus(milestone, status) {
    setError(""); setNotice("");
    try {
      await api.patch(`/projects/${id}/milestones/${milestone.id}/status`, { status });
      setNotice("Milestone status updated.");
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
  }

  async function remove(milestone) {
    if (!window.confirm(`Remove milestone “${milestone.name}”?`)) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await api.delete(`/projects/${id}/milestones/${milestone.id}`);
      setNotice("Milestone removed.");
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setSaving(false); }
  }

  return <section className="glass mt-5 rounded-[18px] p-5 md:p-6">
    <header className="mb-4 flex flex-wrap items-center gap-3">
      <Flag size={17} className="text-indigo-200" />
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-sm font-bold">Milestones</h2>
        <p className="mt-1 text-xs text-[#8993aa]">{completedCount} of {milestones.length} completed</p>
      </div>
      <span className="text-xs text-[#aeb7cd]">{progress}%</span>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/[.08]" aria-label={`Project milestone progress ${progress}%`}>
        <div className="h-full rounded-full bg-indigo-300 transition-all" style={{ width: `${progress}%` }} />
      </div>
    </header>
    {error && <div role="alert" className="mb-4 rounded-xl border border-rose-300/20 bg-rose-300/[.06] p-3 text-sm text-rose-100">{error}</div>}
    {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] p-3 text-sm text-emerald-100">{notice}</div>}
    {loading ? <div className="py-5 text-sm text-[#929bb2]">Loading milestones…</div> : milestones.length === 0 ?
      <div className="rounded-xl border border-dashed border-white/[.1] px-4 py-6 text-center text-sm text-[#929bb2]">No milestones have been planned for this project.</div> :
      <ol className="divide-y divide-white/[.06]">{milestones.map(milestone => <li key={milestone.id} className="flex flex-wrap items-center gap-3 py-3">
        <CheckCircle2 size={17} className={milestone.status === "COMPLETED" ? "text-emerald-300" : "text-[#707a94]"} />
        <div className="min-w-0 flex-1">
          <div className={`text-sm ${milestone.status === "COMPLETED" ? "text-[#7f89a0] line-through" : "text-[#e1e5f0]"}`}>{milestone.name}</div>
          {milestone.description && <p className="mt-1 whitespace-pre-wrap text-xs text-[#929bb2]">{milestone.description}</p>}
          <div className="mt-1 flex items-center gap-1 text-[10px] text-[#7f89a0]">
            <CalendarDays size={11} /> {milestone.due_date ? new Date(`${milestone.due_date}T00:00:00`).toLocaleDateString() : "No due date"}
          </div>
        </div>
        <label className="sr-only" htmlFor={`milestone-status-${milestone.id}`}>Status for {milestone.name}</label>
        <select id={`milestone-status-${milestone.id}`} className="field !w-auto !py-2 !text-xs" value={milestone.status} onChange={event => changeStatus(milestone, event.target.value)}>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {canManage && <button type="button" className="secondary-btn !px-3 !py-2 text-xs" disabled={saving} aria-label={`Remove ${milestone.name}`} onClick={() => remove(milestone)}><Trash2 size={14} /></button>}
      </li>)}</ol>}
    {canManage && <form onSubmit={create} className="mt-4 grid gap-3 border-t border-white/[.06] pt-4 sm:grid-cols-2">
      <label className="space-y-1.5 text-xs text-[#aab2c8]">Milestone name
        <input className="field" maxLength={200} required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />
      </label>
      <label className="space-y-1.5 text-xs text-[#aab2c8]">Due date
        <input className="field" type="date" value={form.dueDate} onChange={event => setForm({ ...form, dueDate: event.target.value })} />
      </label>
      <label className="space-y-1.5 text-xs text-[#aab2c8] sm:col-span-2">Description
        <textarea className="field min-h-16" maxLength={10000} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} />
      </label>
      <div className="sm:col-span-2"><button className="primary-btn" disabled={saving || !form.name.trim()}><Plus size={15} />{saving ? "Saving…" : "Add milestone"}</button></div>
    </form>}
  </section>;
}
