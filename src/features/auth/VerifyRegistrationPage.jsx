import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api, errorMessage } from "../../services/apiClient";

export default function VerifyRegistrationPage() {
  const location = useLocation();
  const [state, setState] = useState({ loading: true, error: "", verified: false });

  useEffect(() => {
    let active = true;
    const token = new URLSearchParams(location.hash.slice(1)).get("token");
    if (!token) {
      setState({ loading: false, error: "Verification token is missing.", verified: false });
      return () => { active = false; };
    }
    api.post("/auth/verify-registration", { token })
      .then(() => { if (active) setState({ loading: false, error: "", verified: true }); })
      .catch((e) => { if (active) setState({ loading: false, error: errorMessage(e), verified: false }); });
    return () => { active = false; };
  }, [location.hash]);

  return (
    <main className="grid min-h-screen place-items-center px-4 text-[#f4f5fb]">
      <section className="glass w-full max-w-md rounded-[24px] p-8 text-center">
        <p className="text-[10px] font-bold tracking-[.2em] text-[#969ffa]">NORTHSTAR CRM</p>
        <h1 className="mt-3 font-display text-2xl font-bold">{state.loading ? "Verifying email..." : state.verified ? "Email verified" : "Verification failed"}</h1>
        {state.error && <p role="alert" className="mt-3 text-sm text-rose-100">{state.error}</p>}
        {state.verified && <p className="mt-3 text-sm text-[#b9c1d7]">Your workspace is ready. Sign in to continue.</p>}
        {!state.loading && <Link className="primary-btn mt-6 inline-block" to="/login">Go to sign in</Link>}
      </section>
    </main>
  );
}
