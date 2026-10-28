import { useCallback, useEffect, useState } from "react";
import { MailPlus, RefreshCw, Search, Shield, UserRound, Users } from "lucide-react";
import { api, errorMessage, getData } from "../../services/apiClient";

const ROLES = ["ADMIN", "MANAGER", "EMPLOYEE"];
function sessionUser() { try { return JSON.parse(sessionStorage.getItem("crm_user") || "null"); } catch { return null; } }

export default function TeamPage() {
  const user = sessionUser();
  const canManage = ["OWNER", "ADMIN"].includes(user?.role);
  const [rows, setRows] = useState([]), [page, setPage] = useState(0), [pages, setPages] = useState(0);
  const [search, setSearch] = useState(""), [active, setActive] = useState("true");
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(""), [inviteOpen, setInviteOpen] = useState(false), [email, setEmail] = useState(""), [role, setRole] = useState("EMPLOYEE");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = { page, size: 10 };
      if (search.trim()) params.search = search.trim();
      params.active = active === "true";
      const data = await getData("/users", params);
      setRows(data?.content || []); setPages(data?.totalPages || 0);
    } catch (e) { setRows([]); setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, [active, page, search]);
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  async function invite(e) {
    e.preventDefault(); setBusy("invite"); setError(""); setNotice("");
    try {
      await api.post("/workspaces/invitations", { email: email.trim(), role });
      setInviteOpen(false); setEmail(""); setRole("EMPLOYEE");
      setNotice("Invitation sent. The member will appear after accepting it.");
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(""); }
  }
  async function updateMember(member, path, data) {
    setBusy(member.id); setError(""); setNotice("");
    try { await api.patch(path, data); setNotice("Member update saved."); await load(); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(""); }
  }
  return <div className="animate-rise">
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><div className="mb-2 text-[10px] font-bold tracking-[.2em] text-[#969ffa]">PEOPLE &amp; ACCESS</div><h1 className="font-display text-2xl font-bold md:text-[29px]">Team members</h1><p className="mt-1.5 text-sm text-[#9099b2]">Manage workspace memberships and invite people to your team.</p></div>
      {canManage && <button className="primary-btn" onClick={() => setInviteOpen(true)}><MailPlus size={16}/> Invite member</button>}
    </header>
    {error && <div role="alert" className="mb-4 rounded-xl border border-rose-300/20 bg-rose-300/[.06] p-3 text-sm text-rose-100">{error}</div>}
    {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] p-3 text-sm text-emerald-100">{notice}</div>}
    <section className="glass overflow-hidden rounded-[18px]">
      <div className="flex flex-wrap gap-3 border-b border-white/[.06] p-4">
        <label className="relative min-w-[220px] flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7f89a0]"/><input aria-label="Search team members" className="field !py-2 !pl-9" placeholder="Search name or email" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/></label>
        <select aria-label="Membership status" className="field !w-auto !py-2 text-sm" value={active} onChange={e=>{setActive(e.target.value);setPage(0);}}><option value="true">Active members</option><option value="false">Suspended members</option></select>
        <button aria-label="Refresh members" className="secondary-btn !p-2.5" disabled={loading} onClick={load}><RefreshCw size={15} className={loading?"animate-spin":""}/></button>
      </div>
      {loading ? <div className="grid min-h-48 place-items-center text-sm text-[#a4acc0]">Loading workspace members…</div> : error ? <div className="grid min-h-48 place-items-center"><button className="secondary-btn" onClick={load}>Retry loading members</button></div> : rows.length===0 ? <div className="grid min-h-48 place-items-center text-sm text-[#929bb2]"><div className="text-center"><Users className="mx-auto mb-2" size={23}/>No members found for this search.</div></div> :
      <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="text-[10px] uppercase tracking-wider text-[#7f89a0]"><tr><th className="px-5 py-3">Member</th><th className="px-5 py-3">Workspace role</th><th className="px-5 py-3">Membership</th>{canManage&&<th className="px-5 py-3 text-right">Actions</th>}</tr></thead><tbody>
        {rows.map(member=><tr className="table-row" key={member.id}><td className="px-5 py-4"><span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-white/[.07] bg-white/[.04] text-indigo-200"><UserRound size={16}/></span><span><b className="block font-medium text-[#e5e8f2]">{member.fullName}</b><span className="text-xs text-[#8c96ad]">{member.email}</span></span></span></td><td className="px-5 py-4"><span className="badge"><Shield size={11} className="mr-1.5"/>{member.role}</span></td><td className="px-5 py-4"><span className={member.active?"badge text-emerald-200":"badge text-amber-200"}>{member.active?"Active":"Suspended"}</span></td>{canManage&&<td className="px-5 py-4"><div className="flex justify-end gap-2">{["OWNER","ADMIN"].includes(user?.role)&&member.role!=="OWNER"&&<select aria-label={"Change "+member.fullName+" role"} className="field !w-auto !py-1.5 text-xs" disabled={busy===member.id} value={member.role} onChange={e=>updateMember(member,"/users/"+member.id,{role:e.target.value})}>{ROLES.map(r=><option key={r}>{r}</option>)}</select>}{member.role!=="OWNER"&&<button className="secondary-btn !px-3 !py-1.5 text-xs" disabled={busy===member.id} onClick={()=>updateMember(member,"/users/"+member.id+"/status",{active:!member.active})}>{busy===member.id?"Saving…":member.active?"Suspend":"Reactivate"}</button>}</div></td>}</tr>)}
      </tbody></table></div>}
      <div className="flex items-center justify-between border-t border-white/[.06] px-5 py-3 text-xs text-[#8791a9]"><span>Page {pages?page+1:0} of {pages}</span><div className="flex gap-2"><button className="secondary-btn !px-3 !py-1.5 text-xs" disabled={page===0||loading} onClick={()=>setPage(p=>p-1)}>Previous</button><button className="secondary-btn !px-3 !py-1.5 text-xs" disabled={page+1>=pages||loading} onClick={()=>setPage(p=>p+1)}>Next</button></div></div>
    </section>
    {inviteOpen&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm" onMouseDown={e=>e.target===e.currentTarget&&setInviteOpen(false)}><section className="glass w-full max-w-lg rounded-[18px] p-6"><h2 className="font-display text-lg font-bold">Invite to workspace</h2><p className="mb-5 mt-1 text-sm text-[#929bb2]">An invitation email will be sent through your configured mail service.</p><form className="space-y-4" onSubmit={invite}><label className="block space-y-1.5 text-xs text-[#aab2c8]">Work email<input className="field" type="email" maxLength={254} autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="block space-y-1.5 text-xs text-[#aab2c8]">Workspace role<select className="field" value={role} onChange={e=>setRole(e.target.value)}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></label><div className="flex justify-end gap-2"><button type="button" className="secondary-btn" onClick={()=>setInviteOpen(false)}>Cancel</button><button className="primary-btn" disabled={busy==="invite"}>{busy==="invite"?"Sending…":"Send invitation"}</button></div></form></section></div>}
  </div>;
}
