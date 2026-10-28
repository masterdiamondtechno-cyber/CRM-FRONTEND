import { useCallback, useEffect, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { api, errorMessage, getData } from "../../services/apiClient";
import { useParams } from "react-router-dom";

function role() { try { return JSON.parse(sessionStorage.getItem("crm_user") || "null")?.role; } catch { return null; } }

export default function ProjectMembersPanel() {
  const { id } = useParams();
  const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(role());
  const [members, setMembers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const project = await getData("/projects/" + id);
      setMembers(project.members || []);
      if (canManage) {
        const users = await getData("/users", { page: 0, size: 100, active: true });
        setCandidates((users.content || []).filter(user => !(project.members || []).some(member => member.id === user.id)));
      }
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setLoading(false); }
  }, [canManage, id]);
  useEffect(() => { load(); }, [load]);

  async function addMember(event) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await api.post("/projects/" + id + "/members", { userId: selected });
      setNotice("Project member added.");
      setSelected("");
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  }
  async function removeMember(member) {
    if (!window.confirm("Remove " + (member.full_name || member.email) + " from this project?")) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await api.delete("/projects/" + id + "/members/" + member.id);
      setNotice("Project member removed.");
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  }

  return <section className="glass mt-5 rounded-[18px] p-5 md:p-6">
    <header className="mb-4 flex items-center gap-2"><Users size={17} className="text-indigo-200"/><h2 className="font-display text-sm font-bold">Project team</h2></header>
    {error&&<div role="alert" className="mb-4 rounded-xl border border-rose-300/20 bg-rose-300/[.06] p-3 text-sm text-rose-100">{error}</div>}
    {notice&&<div role="status" className="mb-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] p-3 text-sm text-emerald-100">{notice}</div>}
    {loading?<div className="py-5 text-sm text-[#929bb2]">Loading project members…</div>:members.length===0?<div className="py-5 text-sm text-[#929bb2]">No project members assigned.</div>:
      <ul className="divide-y divide-white/[.06]">{members.map(member=><li className="flex items-center gap-3 py-3" key={member.id}><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[.04] text-indigo-200"><Users size={15}/></span><span className="min-w-0 flex-1"><span className="block truncate text-sm text-[#e1e5f0]">{member.full_name || member.fullName || member.email}</span><span className="block truncate text-xs text-[#8791a9]">{member.email}</span></span>{canManage&&<button className="secondary-btn !px-3 !py-1.5 text-xs" disabled={busy} onClick={()=>removeMember(member)}>Remove</button>}</li>)}</ul>}
    {canManage&&<form onSubmit={addMember} className="mt-4 flex flex-col gap-2 border-t border-white/[.06] pt-4 sm:flex-row"><label className="sr-only" htmlFor="project-member-select">Add team member</label><select id="project-member-select" className="field" value={selected} onChange={event=>setSelected(event.target.value)} disabled={loading||busy}><option value="">Choose an active workspace member</option>{candidates.map(member=><option key={member.id} value={member.id}>{member.fullName} — {member.email}</option>)}</select><button className="primary-btn shrink-0" disabled={!selected||busy||loading}><UserPlus size={15}/>{busy?"Saving…":"Add member"}</button></form>}
  </section>;
}
