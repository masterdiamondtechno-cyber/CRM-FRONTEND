import { useEffect, useState } from "react";
import { BarChart3, Download, RefreshCw } from "lucide-react";
import { errorMessage, getData } from "../../services/apiClient";

function dateString(date) { return String(date.getFullYear()) + "-" + String(date.getMonth()+1).padStart(2,"0") + "-" + String(date.getDate()).padStart(2,"0"); }
function csvCell(value) {
  let text = value == null ? "" : String(value);
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
function downloadCsv(data) {
  const rows = [
    ["Section", "From", "To", "Status", "Records", "Value"],
    ...((data.leads || []).map(row => ["Leads", data.from, data.to, row.status, row.total, row.value])),
    ...((data.tasks || []).map(row => ["Tasks", data.from, data.to, row.status, row.total, ""])),
  ];
  const csv = "\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `crm-report-${data.from}-to-${data.to}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
function defaultRange() {
  const end = new Date(), start = new Date();
  start.setDate(start.getDate() - 29);
  return { from: dateString(start), to: dateString(end) };
}
export default function ReportsPage() {
  const [range, setRange] = useState(defaultRange);
  const [workload, setWorkload] = useState(null), [workloadError, setWorkloadError] = useState("");
  let canViewWorkload = false;
  try { canViewWorkload = ["OWNER", "ADMIN", "MANAGER"].includes(JSON.parse(sessionStorage.getItem("crm_user") || "null")?.role); } catch { canViewWorkload = false; }
  useEffect(() => { if (canViewWorkload) getData("/dashboard/workload").then(setWorkload).catch(e => setWorkloadError(errorMessage(e))); }, [canViewWorkload]);
  const [data, setData] = useState(null), [loading, setLoading] = useState(false), [error, setError] = useState("");
  async function load(event) {
    event?.preventDefault();
    setError("");
    if (range.from > range.to) { setError("Start date must be on or before end date."); return; }
    setLoading(true);
    try { setData(await getData("/dashboard/reports", range)); }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }
  const leads = data?.leads || [], tasks = data?.tasks || [];
  const leadTotal = leads.reduce((n, row) => n + Number(row.total || 0), 0);
  const taskTotal = tasks.reduce((n, row) => n + Number(row.total || 0), 0);
  return <div className="animate-rise">
    <header className="mb-7"><div className="mb-2 text-[10px] font-bold tracking-[.2em] text-[#969ffa]">WORKSPACE INSIGHTS</div><h1 className="font-display text-2xl font-bold md:text-[29px]">Reports</h1><p className="mt-1.5 text-sm text-[#9099b2]">Tenant-scoped lead and task records created in a selected date range.</p></header>
    <form onSubmit={load} className="glass mb-5 flex flex-wrap items-end gap-3 rounded-[18px] p-4">
      <label className="block min-w-[160px] flex-1 space-y-1.5 text-xs text-[#aab2c8]">From<input className="field" type="date" required value={range.from} onChange={e=>setRange(v=>({...v,from:e.target.value}))}/></label>
      <label className="block min-w-[160px] flex-1 space-y-1.5 text-xs text-[#aab2c8]">To<input className="field" type="date" required value={range.to} onChange={e=>setRange(v=>({...v,to:e.target.value}))}/></label>
      {data&&<button type="button" className="secondary-btn" onClick={()=>downloadCsv(data)}><Download size={15}/> Export CSV</button>}
      <button className="primary-btn" disabled={loading}>{loading?<RefreshCw className="animate-spin" size={15}/>:<BarChart3 size={15}/>} {loading?"Loading…":"Run report"}</button>
    </form>
    {error&&<div role="alert" className="mb-5 rounded-xl border border-rose-300/20 bg-rose-300/[.06] p-4 text-sm text-rose-100">{error}</div>}
    {!data&&!loading&&!error&&<div className="glass grid min-h-48 place-items-center rounded-[18px] p-6 text-center text-sm text-[#929bb2]">Choose dates and run the report to load workspace data.</div>}
    {loading&&!data&&<div className="glass grid min-h-48 place-items-center rounded-[18px] text-sm text-[#a4acc0]">Loading report…</div>}
    {canViewWorkload&&<section className="glass mb-5 overflow-hidden rounded-[18px]">
      <div className="border-b border-white/[.06] px-5 py-4"><h2 className="font-display text-sm font-bold">Team workload</h2><p className="mt-1 text-xs text-[#8993aa]">Open leads and tasks across active members in this workspace.</p></div>
      {workloadError?<div role="alert" className="p-5 text-sm text-rose-100">Could not load team workload: {workloadError}</div>:workload===null?<div className="p-5 text-sm text-[#929bb2]">Loading workload…</div>:workload.length===0?<div className="p-5 text-sm text-[#929bb2]">No active workspace members.</div>:<div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="text-[10px] uppercase tracking-wider text-[#7f89a0]"><tr><th className="px-5 py-3">Member</th><th className="px-5 py-3">Role</th><th className="px-5 py-3 text-right">Open leads</th><th className="px-5 py-3 text-right">Open tasks</th><th className="px-5 py-3 text-right">Overdue</th></tr></thead><tbody>{workload.map(row=><tr className="table-row" key={row.id}><td className="px-5 py-3 text-[#dce0ec]">{row.full_name}</td><td className="px-5 py-3 text-[#929bb2]">{row.role}</td><td className="px-5 py-3 text-right">{row.open_leads}</td><td className="px-5 py-3 text-right">{row.open_tasks}</td><td className={`px-5 py-3 text-right ${Number(row.overdue_tasks)>0?"text-amber-200":"text-[#929bb2]"}`}>{row.overdue_tasks}</td></tr>)}</tbody></table></div>}
    </section>}    {data&&<><div className="mb-5 grid gap-4 sm:grid-cols-2"><section className="glass rounded-[18px] p-5"><div className="text-xs text-[#929bb2]">Leads created in range</div><div className="mt-2 font-display text-3xl font-bold">{leadTotal}</div></section><section className="glass rounded-[18px] p-5"><div className="text-xs text-[#929bb2]">Tasks created in range</div><div className="mt-2 font-display text-3xl font-bold">{taskTotal}</div></section></div>
      <div className="grid gap-5 xl:grid-cols-2">{[["Lead records by current status",leads],["Task records by current status",tasks]].map(([title,rows])=><section className="glass overflow-hidden rounded-[18px]" key={title}><h2 className="border-b border-white/[.06] px-5 py-4 font-display text-sm font-bold">{title}</h2>{rows.length===0?<div className="p-5 text-sm text-[#929bb2]">No records in this range.</div>:<table className="w-full text-left text-sm"><thead className="text-[10px] uppercase tracking-wider text-[#7f89a0]"><tr><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Records</th>{title.startsWith("Lead")&&<th className="px-5 py-3 text-right">Value</th>}</tr></thead><tbody>{rows.map(row=><tr className="table-row" key={row.status}><td className="px-5 py-3 text-[#dce0ec]">{String(row.status).replaceAll("_"," ")}</td><td className="px-5 py-3 text-right">{row.total}</td>{title.startsWith("Lead")&&<td className="px-5 py-3 text-right">{Number(row.value||0).toLocaleString()}</td>}</tr>)}</tbody></table>}</section>)}</div>
      <p className="mt-4 text-[11px] text-[#7f89a0]">The date range filters record creation dates. Lead values reflect current stage totals from the API.</p></>}
  </div>;
}





