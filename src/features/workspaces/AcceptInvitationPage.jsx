import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, errorMessage } from "../../services/apiClient";

export default function AcceptInvitationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ fullName: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const token = new URLSearchParams(location.hash.slice(1)).get("token") || "";
      const { data } = await api.post("/auth/invitations/accept", {
        token,
        fullName: form.fullName || undefined,
        password: form.password || undefined,
      });
      const auth = data.data;
      sessionStorage.setItem("crm_token", auth.accessToken);
      sessionStorage.setItem("crm_refresh_token", auth.refreshToken);
      sessionStorage.setItem("crm_user", JSON.stringify(auth.user));
      if (auth.user?.activeTenantId) sessionStorage.setItem("crm_workspace_id", auth.user.activeTenantId);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10 text-[#f4f5fb]">
      <section className="glass w-full max-w-md rounded-[24px] p-7 md:p-9">
        <p className="text-[10px] font-bold tracking-[.2em] text-[#969ffa]">NORTHSTAR CRM</p>
        <h1 className="mt-3 font-display text-2xl font-bold">Join a workspace</h1>
        <p className="mt-2 text-sm text-[#9099b2]">If you already have an account, leave the fields blank. Otherwise, set up your name and password.</p>
        <form className="mt-7 space-y-4" onSubmit={submit}>
          <label className="block text-xs text-[#aab2c8]"><span className="mb-1.5 block">Full name (new accounts)</span>
            <input className="field w-full" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} maxLength={120} autoComplete="name" />
          </label>
          <label className="block text-xs text-[#aab2c8]"><span className="mb-1.5 block">Password (new accounts, 12+ characters)</span>
            <input className="field w-full" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={12} maxLength={72} autoComplete="new-password" />
          </label>
          {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/[.07] p-3 text-xs text-rose-100">{error}</p>}
          <button className="primary-btn w-full disabled:opacity-50" disabled={busy}>{busy ? "Accepting..." : "Accept invitation"}</button>
        </form>
        <p className="mt-5 text-center text-xs text-[#9099b2]"><Link className="text-indigo-200 hover:text-white" to="/login">Back to sign in</Link></p>
      </section>
    </main>
  );
}
