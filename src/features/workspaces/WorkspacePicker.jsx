import { useEffect, useState } from "react";
import { getData, errorMessage } from "../../services/apiClient";

export default function WorkspacePicker() {
  const [workspaces, setWorkspaces] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getData("/workspaces/mine")
      .then((items) => { if (active) setWorkspaces(Array.isArray(items) ? items : []); })
      .catch((e) => { if (active) setError(errorMessage(e)); });
    return () => { active = false; };
  }, []);

  if (workspaces.length < 2) return null;

  const selectedId = sessionStorage.getItem("crm_workspace_id") || "";
  return (
    <label className="mt-4 block rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[.16em] text-[#929bb3]">Workspace</span>
      <select
        aria-label="Active workspace"
        className="field w-full !py-2 !text-xs"
        value={selectedId}
        onChange={(event) => {
          const workspace = workspaces.find((item) => item.id === event.target.value);
          if (!workspace) return;
          sessionStorage.setItem("crm_workspace_id", workspace.id);
          const user = JSON.parse(sessionStorage.getItem("crm_user") || "{}");
          user.activeTenantId = workspace.id;
          user.role = workspace.role;
          sessionStorage.setItem("crm_user", JSON.stringify(user));
          window.location.reload();
        }}
      >
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>{workspace.name} - {workspace.role}</option>
        ))}
      </select>
      {error && <span className="mt-1 block text-[10px] text-rose-200">{error}</span>}
    </label>
  );
}
