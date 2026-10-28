import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { api, errorMessage } from "../../services/apiClient";

export default function ClientExportButton() {
  const input = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function download() {
    setLoading(true); setError(""); setNotice("");
    try {
      const response = await api.get("/clients/export", { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url; link.download = "crm-clients.csv";
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setNotice("Client export downloaded.");
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setLoading(false); }
  }

  async function importFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setLoading(true); setError(""); setNotice("");
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post("/clients/import", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const result = data.data;
      const duplicates = result.duplicateRows?.length
        ? ` Duplicate CSV rows skipped: ${result.duplicateRows.join(", ")}.` : "";
      setNotice(`Imported ${result.imported} clients; skipped ${result.skippedDuplicates} duplicates.${duplicates}`);
      window.dispatchEvent(new CustomEvent("crm:clients-imported"));
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setLoading(false); }
  }

  return <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
    <input ref={input} type="file" accept=".csv,text/csv" className="sr-only"
      aria-label="Choose a client CSV file" onChange={importFile} />
    {error && <span role="alert" className="text-xs text-rose-200">{error}</span>}
    {notice && <span role="status" className="text-xs text-emerald-200">{notice}</span>}
    <button type="button" className="secondary-btn" disabled={loading} onClick={() => input.current?.click()}>
      <Upload size={15}/>{loading ? "Importing..." : "Import clients CSV"}
    </button>
    <button type="button" className="secondary-btn" disabled={loading} onClick={download}>
      <Download size={15}/>{loading ? "Working..." : "Export clients CSV"}
    </button>
  </div>;
}
