import { useCallback, useEffect, useState } from "react";
import { Download, FilePlus2, FileText, Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { api, errorMessage, getData } from "../../services/apiClient";

const endpoints = { clients: "clients", leads: "leads", projects: "projects" };
function currentUser() { try { return JSON.parse(sessionStorage.getItem("crm_user") || "null"); } catch { return null; } }
const canManage = () => ["OWNER", "ADMIN", "MANAGER"].includes(currentUser()?.role);

export default function AttachmentPanel({ recordType }) {
  const { id } = useParams();
  const [files, setFiles] = useState([]), [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useState(""), [notice, setNotice] = useState("");
  const base = `/${endpoints[recordType]}/${id}/attachments`;
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setFiles(await getData(base)); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setLoading(false); }
  }, [base]);
  useEffect(() => { void load(); }, [load]);

  async function upload(event) {
    event.preventDefault(); if (!selected) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const form = new FormData(); form.append("file", selected);
      await api.post(base, form, { headers: { "Content-Type": "multipart/form-data" } });
      setSelected(null); event.currentTarget.reset(); setNotice("File uploaded."); await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  }
  async function download(file) {
    setBusy(true); setError("");
    try {
      const response = await api.get(`/attachments/${file.id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data), link = document.createElement("a");
      link.href = url; link.download = file.fileName || "attachment"; document.body.appendChild(link); link.click(); link.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  }
  async function remove(file) {
    if (!window.confirm(`Delete “${file.fileName}”? This removes the stored file.`)) return;
    setBusy(true); setError(""); setNotice("");
    try { await api.delete(`/attachments/${file.id}`); setNotice("File deleted."); await load(); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  }
  const formatBytes = bytes => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  const user = currentUser();

  return <section className="glass mt-5 rounded-[18px] p-5 md:p-6">
    <header className="mb-4 flex items-center gap-2"><FileText size={17} className="text-indigo-200"/><h2 className="font-display text-sm font-bold">Files</h2><span className="ml-auto text-xs text-[#8791a9]">Private · up to 10 MB</span></header>
    {error && <div role="alert" className="mb-4 rounded-xl border border-rose-300/20 bg-rose-300/[.06] p-3 text-sm text-rose-100">{error}</div>}
    {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] p-3 text-sm text-emerald-100">{notice}</div>}
    {loading ? <div className="py-5 text-sm text-[#929bb2]">Loading files…</div> : files.length === 0 ?
      <div className="rounded-xl border border-dashed border-white/[.1] px-4 py-6 text-center text-sm text-[#929bb2]">No files attached to this record.</div> :
      <ul className="divide-y divide-white/[.06]">{files.map(file => <li key={file.id} className="flex items-center gap-3 py-3">
        <FileText size={16} className="shrink-0 text-[#929bb2]"/><div className="min-w-0 flex-1"><div className="truncate text-sm text-[#e1e5f0]">{file.fileName}</div>
          <div className="mt-1 text-[10px] text-[#7f89a0]">{formatBytes(file.sizeBytes)} · {new Date(file.createdAt).toLocaleString()}</div></div>
        <button type="button" className="secondary-btn !p-2" disabled={busy} aria-label={`Download ${file.fileName}`} onClick={() => download(file)}><Download size={14}/></button>
        {(canManage() || file.uploadedBy === user?.id) && <button type="button" className="secondary-btn !p-2 text-rose-200" disabled={busy} aria-label={`Delete ${file.fileName}`} onClick={() => remove(file)}><Trash2 size={14}/></button>}
      </li>)}</ul>}
    <form onSubmit={upload} className="mt-4 flex flex-col gap-3 border-t border-white/[.06] pt-4 sm:flex-row sm:items-end">
      <label className="min-w-0 flex-1 space-y-1.5 text-xs text-[#aab2c8]">Choose a file
        <input className="field file:mr-3 file:rounded-md file:border-0 file:bg-indigo-300/10 file:px-3 file:py-1 file:text-xs file:text-indigo-100" type="file" required onChange={event => setSelected(event.target.files?.[0] || null)}/>
      </label>
      <button className="primary-btn shrink-0" disabled={!selected || busy || selected.size > 10 * 1024 * 1024}><FilePlus2 size={15}/>{busy ? "Working…" : "Upload file"}</button>
    </form>
  </section>;
}
