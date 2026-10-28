import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowUpRight } from "lucide-react";
import { getData, errorMessage } from "../../services/apiClient";

const paths = { clients: "/clients", contacts: "/contacts", leads: "/leads", tasks: "/tasks", projects: "/projects" };

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError("");
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    setError("");
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const found = await getData("/search", { q: query.trim() });
        if (!cancelled) { setResults(Array.isArray(found) ? found : []); setActive(0); }
      } catch (err) {
        if (!cancelled) setError(errorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [query]);

  useEffect(() => {
    function closeOutside(event) {
      if (!root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);

  function openResult(item) {
    const base = paths[item.entity];
    if (!base) return;
    setOpen(false);
    setQuery("");
    navigate(item.entity === "tasks" ? base : `${base}/${item.id}`);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") { setOpen(false); return; }
    if (event.key === "ArrowDown" && results.length) { event.preventDefault(); setActive((index) => (index + 1) % results.length); }
    if (event.key === "ArrowUp" && results.length) { event.preventDefault(); setActive((index) => (index - 1 + results.length) % results.length); }
    if (event.key === "Enter" && results[active]) { event.preventDefault(); openResult(results[active]); }
  }

  const showResults = open && query.trim().length >= 2;
  return (
    <div className="relative ml-auto hidden w-full max-w-[340px] sm:block" ref={root}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7e87a0]" />
      <input
        aria-label="Search CRM records"
        aria-expanded={showResults}
        aria-controls="global-search-results"
        className="field !py-2 !pl-9 !text-xs"
        placeholder="Search clients, leads, tasks…"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onKeyDown={handleKeyDown}
      />
      {showResults && <div id="global-search-results" role="listbox" className="absolute right-0 z-50 mt-2 max-h-[min(65vh,420px)] w-[min(92vw,420px)] overflow-y-auto rounded-2xl border border-white/10 bg-[#151a29] p-2 shadow-2xl shadow-black/50">
        {query.trim().length < 2 ? null : loading ? <div className="p-4 text-xs text-[#9ba4bb]">Searching this workspace…</div>
          : error ? <div role="alert" className="p-4 text-xs text-rose-200">{error}</div>
          : !results.length ? <div className="p-4 text-xs text-[#9ba4bb]">No matching records. Search checks records you are allowed to view.</div>
          : results.map((item, index) => <button
            type="button" role="option" aria-selected={index === active} key={`${item.entity}-${item.id}`}
            onMouseEnter={() => setActive(index)} onClick={() => openResult(item)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${index === active ? "bg-indigo-300/10" : "hover:bg-white/[.04]"}`}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[.05] text-[9px] font-bold uppercase text-indigo-200">{item.entity.slice(0, 2)}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-[#e2e5ef]">{item.title}</span><span className="mt-0.5 block truncate text-[10px] capitalize text-[#8790a7]">{item.entity.slice(0, -1)} · {String(item.subtitle || "").replaceAll("_", " ").toLowerCase()}</span></span>
            <ArrowUpRight size={14} className="shrink-0 text-[#7d87a1]" />
          </button>)}
        {!loading && !error && results.length > 0 && <div className="border-t border-white/[.06] px-3 pt-2 text-[10px] text-[#737e97]">Showing up to 50 accessible records · use ↑ ↓ and Enter</div>}
      </div>}
    </div>
  );
}
