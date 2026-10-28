import { useEffect, useState } from "react";
import { getData, errorMessage } from "../services/apiClient";

function Select({ label, name, value, options, onChange, required = false, placeholder }) {
  return <label className="block space-y-1.5 text-xs font-medium text-[#aab2c8]">
    <span>{label}{required ? " *" : ""}</span>
    <select className="field" required={required} value={value || ""} onChange={e => onChange(name, e.target.value)}>
      <option value="">{placeholder || (required ? "Select..." : "No " + label.toLowerCase())}</option>
      {options.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
    </select>
  </label>;
}

export default function RelatedRecordFields({ kind, form, setForm }) {
  const [clients, setClients] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const role = (() => { try { return JSON.parse(sessionStorage.getItem("crm_user") || "{}").role; } catch { return ""; } })();
  const canAssign = ["ADMIN", "MANAGER"].includes(role);
  const needsClients = ["contacts", "leads", "tasks", "projects", "activity"].includes(kind);

  useEffect(() => {
    let alive = true;
    const requests = [getData("/clients", { page: 0, size: 100 })];
    if (["leads", "tasks", "activity"].includes(kind)) requests.push(getData("/leads", { page: 0, size: 100 }));
    if (kind === "tasks") requests.push(getData("/projects"));
    if (canAssign && ["leads", "tasks", "projects"].includes(kind)) requests.push(getData("/users", { page: 0, size: 100, active: true }));
    Promise.all(requests).then(values => {
      if (!alive) return;
      let i = 0;
      const clientData = values[i++];
      setClients((clientData.content || []).map(x => ({ id: x.id, label: x.companyName })));
      if (["leads", "tasks", "activity"].includes(kind)) {
        const leadData = values[i++];
        setLeads((leadData.content || []).map(x => ({ id: x.id, label: x.title + " · " + x.status, clientId: x.clientId })));
      }
      if (kind === "tasks") {
        const projectData = values[i++];
        setProjects((projectData || []).map(x => ({ id: x.id, label: x.name, clientId: x.client_id })));
      }
      if (canAssign && ["leads", "tasks", "projects"].includes(kind)) {
        const userData = values[i++];
        setUsers((userData.content || []).map(x => ({ id: x.id, label: x.fullName + " · " + x.email })));
      }
    }).catch(e => { if (alive) setError(errorMessage(e)); });
    return () => { alive = false; };
  }, [kind, canAssign]);

  useEffect(() => {
    let alive = true;
    setContacts([]);
    if (!form.clientId || !["leads", "tasks", "activity"].includes(kind)) return () => { alive = false; };
    getData("/clients/" + form.clientId + "/contacts", { page: 0, size: 100 })
      .then(data => { if (alive) setContacts((data.content || []).map(x => ({ id: x.id, label: x.fullName + (x.email ? " · " + x.email : "") }))); })
      .catch(e => { if (alive) setError(errorMessage(e)); });
    return () => { alive = false; };
  }, [form.clientId, kind]);

  if (!needsClients && !["leads", "tasks"].includes(kind)) return null;
  const set = (name, value) => setForm(previous => ({ ...previous, [name]: value }));
  const visibleLeads = leads.filter(x => !form.clientId || !x.clientId || x.clientId === form.clientId);
  const visibleProjects = projects.filter(x => !form.clientId || x.clientId === form.clientId);

  return <>
    {error && <div role="alert" className="sm:col-span-2 text-xs text-rose-200">{error}</div>}
    {needsClients && <Select label="Client" name="clientId" value={form.clientId} options={clients}
      required={["contacts", "projects", "activity"].includes(kind)}
      onChange={(name, value) => setForm(previous => ({ ...previous, [name]: value, contactId: "", leadId: "", projectId: "" }))}/>}
    {["leads", "tasks", "activity"].includes(kind) && form.clientId &&
      <Select label="Contact" name="contactId" value={form.contactId} options={contacts} onChange={set}/>}
    {["tasks", "activity"].includes(kind) &&
      <Select label="Lead" name="leadId" value={form.leadId} options={visibleLeads} onChange={set}/>}
    {kind === "tasks" && <Select label="Project" name="projectId" value={form.projectId} options={visibleProjects} onChange={set}/>}
    {canAssign && ["leads", "tasks", "projects"].includes(kind) &&
      <Select label={kind === "projects" ? "Owner" : "Assignee"} name={kind === "projects" ? "ownerId" : "assignedTo"}
        value={form[kind === "projects" ? "ownerId" : "assignedTo"]} options={users} placeholder="Default: me" onChange={set}/>}
  </>;
}
