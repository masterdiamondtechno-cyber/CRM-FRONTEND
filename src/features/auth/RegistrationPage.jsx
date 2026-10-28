import { useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../../services/apiClient";

export default function RegistrationPage() {
  const [form, setForm] = useState({ companyName: "", fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/auth/register", form);
      setSent(true);
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
        <h1 className="mt-3 font-display text-2xl font-bold">{sent ? "Check your inbox" : "Create your workspace"}</h1>
        {sent ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-[#b9c1d7]">If this registration can be completed, the email address will receive a verification link. The workspace stays inaccessible until verification succeeds.</p>
            <Link className="primary-btn block text-center" to="/login">Continue to sign in</Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-[#9099b2]">Set up a company account and become its first owner.</p>
            <form className="mt-7 space-y-4" onSubmit={submit}>
              {[
                ["companyName", "Company name", "text"],
                ["fullName", "Your full name", "text"],
                ["email", "Work email", "email"],
                ["password", "Password (12+ characters)", "password"],
              ].map(([name, label, type]) => (
                <label key={name} className="block text-xs text-[#aab2c8]">
                  <span className="mb-1.5 block">{label}</span>
                  <input className="field w-full" name={name} type={type} value={form[name]} onChange={change}
                    required maxLength={name === "companyName" ? 200 : name === "fullName" ? 120 : name === "email" ? 255 : 72}
                    minLength={name === "password" ? 12 : undefined} autoComplete={name === "password" ? "new-password" : name === "email" ? "email" : "name"} />
                </label>
              ))}
              {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/[.07] p-3 text-xs text-rose-100">{error}</p>}
              <button className="primary-btn w-full disabled:opacity-50" disabled={busy}>{busy ? "Creating workspace..." : "Create workspace"}</button>
            </form>
          </>
        )}
        <p className="mt-5 text-center text-xs text-[#9099b2]">Already have an account? <Link className="text-indigo-200 hover:text-white" to="/login">Sign in</Link></p>
      </section>
    </main>
  );
}
