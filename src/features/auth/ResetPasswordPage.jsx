import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api, errorMessage } from "../../services/apiClient";

export default function ResetPasswordPage() {
  const location = useLocation();
  const token = new URLSearchParams(location.hash.slice(1)).get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!token) { setError("This reset link is missing its token. Request a new link."); return; }
    if (password !== confirm) { setError("The passwords do not match."); return; }
    setSaving(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      setDone(true);
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setSaving(false); }
  }

  return <main className="grid min-h-screen place-items-center p-5">
    <section className="glass w-full max-w-md rounded-[24px] p-7 md:p-9">
      <div className="mb-2 text-[10px] font-bold tracking-[.2em] text-[#969ffa]">ACCOUNT SECURITY</div>
      <h1 className="font-display text-2xl font-bold">Reset your password</h1>
      {!done ? <>
        <p className="mb-6 mt-2 text-sm text-[#929bb2]">Choose a new password with at least 12 characters.</p>
        {error&&<div role="alert" className="mb-4 rounded-xl border border-rose-300/20 bg-rose-300/[.06] p-3 text-sm text-rose-100">{error}</div>}
        <form className="space-y-4" onSubmit={submit}>
          <label className="block space-y-1.5 text-xs text-[#aab2c8]">New password<input className="field" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)}/></label>
          <label className="block space-y-1.5 text-xs text-[#aab2c8]">Confirm new password<input className="field" type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
          <button className="primary-btn w-full" disabled={saving}>{saving?"Updating…":"Update password"}</button>
        </form>
      </> : <div className="mt-4"><div role="status" className="rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] p-3 text-sm text-emerald-100">Password updated. Sign in with your new password.</div><Link className="primary-btn mt-5 w-full" to="/login">Return to sign in</Link></div>}
    </section>
  </main>;
}
