import { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { errorMessage, getData } from "../../services/apiClient";

export default function AuditPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await getData("/audit-logs", { page, size: 25 })); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setLoading(false); }
  }, [page]);
  useEffect(() => { load(); }, [load]);
  const rows = data?.content || [];
  return <div className="animate-rise">
    <header className="mb-7"><div className="mb-2 text-[10px] font-bold tracking-[.2em] text-[#969ffa]">SECURITY &amp; GOVERNANCE</div><h1 className="font-display text-2xl font-bold md:text-[29px]">Audit log</h1><p className="mt-1.5 text-sm text-[#9099b2]">Workspace administrative actions recorded by the server.</p></header>
    {error&&<div role="alert" className="mb-4 rounded-xl border border-rose-300/20 bg-rose-300/[.06] p-4 text-sm text-rose-100">{error}</div>}
    <section className="glass overflow-hidden rounded-[18px]">
      <div className="flex items-center justify-between border-b border-white/[.06] p-4"><span className="text-xs text-[#929bb2]">{data?.totalElements ?? "—"} events</span><button className="secondary-btn !p-2.5" aria-label="Refresh audit events" disabled={loading} onClick={load}><RefreshCw size={15} className={loading?"animate-spin":""}/></button></div>
      {loading&&!data?<div className="grid min-h-48 place-items-center text-sm text-[#a4acc0]">Loading audit events…</div>:error&&!data?<div className="grid min-h-48 place-items-center"><button className="secondary-btn" onClick={load}>Retry loading audit events</button></div>:data&&rows.length===0?<div className="grid min-h-48 place-items-center px-5 text-center"><div><Activity className="mx-auto mb-3 text-[#8c96ad]" size={24}/><div className="text-sm font-semibold">No audit events</div><p className="mt-1 text-xs text-[#8791a9]">Administrative changes will appear here when recorded.</p></div></div>:
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-[10px] uppercase tracking-wider text-[#7f89a0]"><tr><th className="px-5 py-3">Action</th><th className="px-5 py-3">Record</th><th className="px-5 py-3">Actor</th><th className="px-5 py-3">When</th></tr></thead><tbody>{rows.map(row=><tr className="table-row" key={row.id}><td className="px-5 py-4"><span className="badge text-indigo-200">{row.action}</span></td><td className="px-5 py-4"><div className="font-medium text-[#e3e7f2]">{row.entity_type}</div><div className="mt-1 max-w-[260px] truncate font-mono text-[10px] text-[#8791a9]">{row.entity_id || "—"}</div></td><td className="px-5 py-4 font-mono text-xs text-[#b5bdd0]">{row.actor_id || "System"}</td><td className="px-5 py-4 text-xs text-[#a6afc4]">{row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</td></tr>)}</tbody></table></div>}
      <div className="flex items-center justify-between border-t border-white/[.06] px-5 py-3 text-xs text-[#8791a9]"><span>Page {data ? page+1 : 0} of {data?.totalPages || 0}</span><div className="flex gap-2"><button className="secondary-btn !px-3 !py-1.5 text-xs" disabled={page<=0||loading} onClick={()=>setPage(p=>p-1)}>Previous</button><button className="secondary-btn !px-3 !py-1.5 text-xs" disabled={page+1>=(data?.totalPages||0)||loading} onClick={()=>setPage(p=>p+1)}>Next</button></div></div>
    </section>
  </div>;
}
