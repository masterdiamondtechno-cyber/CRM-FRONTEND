import { api } from "../../services/apiClient";

function storeSession(auth) {
  sessionStorage.setItem("crm_token", auth.accessToken);
  sessionStorage.setItem("crm_refresh_token", auth.refreshToken);
  sessionStorage.setItem("crm_user", JSON.stringify(auth.user));
  if (auth.user?.activeTenantId) sessionStorage.setItem("crm_workspace_id", auth.user.activeTenantId);
}

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  const auth = data.data;
  storeSession(auth);
  return auth.user;
}

export async function registerWorkspace(payload) {
  const { data } = await api.post("/auth/register", payload);
  const auth = data.data;
  storeSession(auth);
  return auth.user;
}

export async function logout() {
  const refreshToken = sessionStorage.getItem("crm_refresh_token");
  try {
    await api.post("/auth/logout", refreshToken ? { refreshToken } : undefined);
  } catch {
    // Local sign-out still completes when the backend is unavailable.
  } finally {
    sessionStorage.removeItem("crm_token");
    sessionStorage.removeItem("crm_refresh_token");
    sessionStorage.removeItem("crm_user");
    sessionStorage.removeItem("crm_workspace_id");
  }
}
