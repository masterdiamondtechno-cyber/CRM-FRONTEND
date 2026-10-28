import { useState } from "react";
import { Download } from "lucide-react";
import { api, errorMessage } from "../services/apiClient";

export default function RecordExportButton({ kind, search, status }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search) params.search = search;
      if (kind === "leads" && status) params.status = status;
      const { data } = await api.get(`/${kind}/export`, { params, responseType: "blob" });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `crm-${kind}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return <div className="mb-4 flex justify-end gap-3">
    {error && <span role="alert" className="self-center text-xs text-rose-200">{error}</span>}
    <button type="button" className="secondary-btn" disabled={loading} onClick={download}>
      <Download size={15} />{loading ? "Exporting…" : `Export ${kind} CSV`}
    </button>
  </div>;
}
