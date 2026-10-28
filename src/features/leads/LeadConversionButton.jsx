import { useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../../services/apiClient";

const fields = [
  ["companyName", "Company name", true, "text"],
  ["industry", "Industry", false, "text"],
  ["website", "Website", false, "url"],
  ["email", "Company email", false, "email"],
  ["phone", "Company phone", false, "tel"],
  ["address", "Address", false, "text"],
  ["notes", "Notes", false, "text"],
  ["contactFullName", "Contact name", false, "text"],
  ["contactJobTitle", "Contact job title", false, "text"],
  ["contactEmail", "Contact email", false, "email"],
  ["contactPhone", "Contact phone", false, "tel"],
  ["contactNotes", "Contact notes", false, "text"],
];

export default function LeadConversionButton({ lead, onConverted }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ companyName: lead.title || "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clientId, setClientId] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const { data } = await api.post(`/leads/${lead.id}/convert`, form);
      setClientId(data.data.clientId);
      setOpen(false);
      onConverted();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally { setBusy(false); }
  }

  return <>
    {clientId ? <Link className="text-xs text-emerald-200 underline" to={`/clients/${clientId}`}>Open converted client</Link>
      : lead.status === "WON" && !lead.clientId && <button type="button" className="primary-btn" onClick={() => { setError(""); setOpen(true); }}>Convert to client</button>}
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="lead-convert-title" className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#171b29] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="lead-convert-title" className="font-display text-lg font-bold">Convert won lead to client</h2>
          <button type="button" aria-label="Close dialog" className="secondary-btn" onClick={() => setOpen(false)}>Close</button>
        </div>
        <p className="mb-4 text-xs text-[#9aa3ba]">The client will be assigned to the lead owner. Add a contact name to create a primary contact.</p>
        {error && <p role="alert" className="mb-3 text-sm text-rose-200">{error}</p>}
        <form onSubmit={submit}>
          <div className="grid max-h-[55vh] gap-3 overflow-y-auto p-1 sm:grid-cols-2">
            {fields.map(([name, label, required, type]) => <label key={name} className="space-y-1.5 text-xs text-[#aab2c8]">
              <span>{label}{required ? " *" : ""}</span>
              {name.endsWith("Notes") || name === "address"
                ? <textarea className="field min-h-20" name={name} required={required} maxLength={10000} value={form[name] || ""} onChange={e => setForm({ ...form, [name]: e.target.value })}/>
                : <input className="field" name={name} type={type} required={required} maxLength={name === "companyName" ? 200 : 255} value={form[name] || ""} onChange={e => setForm({ ...form, [name]: e.target.value })}/>}
            </label>)}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="secondary-btn" onClick={() => setOpen(false)}>Cancel</button>
            <button disabled={busy} className="primary-btn disabled:opacity-50">{busy ? "Converting..." : "Create client"}</button>
          </div>
        </form>
      </section>
    </div>}
  </>;
}
