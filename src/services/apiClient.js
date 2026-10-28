import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  headers: { "Content-Type": "application/json" },
});

let refreshRequest = null;
const clearSession = () => {
  sessionStorage.removeItem("crm_token");
  sessionStorage.removeItem("crm_refresh_token");
  sessionStorage.removeItem("crm_user");
  sessionStorage.removeItem("crm_workspace_id");
  if (window.location.pathname !== "/login") window.location.assign("/login");
};

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("crm_token");
  const workspaceId = sessionStorage.getItem("crm_workspace_id");
  const publicAuthRoute = ["/auth/login", "/auth/register", "/auth/verify-registration", "/auth/invitations/accept", "/auth/forgot-password", "/auth/reset-password"].some((path) => config.url?.includes(path));
  if (!publicAuthRoute) {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (workspaceId) config.headers["X-Workspace-Id"] = workspaceId;
  }
  return config;
});

api.interceptors.response.use((response) => response, async (error) => {
  const config = error.config;
  const isAuthRoute = ["/auth/login", "/auth/register", "/auth/verify-registration", "/auth/invitations/accept", "/auth/forgot-password", "/auth/reset-password", "/auth/refresh", "/auth/logout"].some((path) => config?.url?.includes(path));
  if (error.response?.status === 401 && config && !config._crmRetried && !isAuthRoute) {
    const refreshToken = sessionStorage.getItem("crm_refresh_token");
    if (refreshToken) {
      config._crmRetried = true;
      try {
        refreshRequest ??= axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken }, {
          headers: {
            "Content-Type": "application/json",
            ...(sessionStorage.getItem("crm_workspace_id") ? { "X-Workspace-Id": sessionStorage.getItem("crm_workspace_id") } : {}),
          },
        }).then(({ data }) => {
          const tokens = data.data;
          sessionStorage.setItem("crm_token", tokens.accessToken);
          sessionStorage.setItem("crm_refresh_token", tokens.refreshToken);
          if (tokens.user) sessionStorage.setItem("crm_user", JSON.stringify(tokens.user));
          return tokens.accessToken;
        }).finally(() => { refreshRequest = null; });
        const token = await refreshRequest;
        config.headers.Authorization = `Bearer ${token}`;
        return api(config);
      } catch {
        clearSession();
      }
    } else {
      clearSession();
    }
  }
  const message = error.response?.data?.safeMessage || error.response?.data?.message || error.message || "Request failed";
  const validationErrors = error.response?.data?.validationErrors || {};
  const fieldDetails = Object.entries(validationErrors).map(([field, detail]) => `${field}: ${detail}`).join("; ");
  const requestError = new Error(fieldDetails ? `${message}  ${fieldDetails}` : message);
  requestError.status = error.response?.status;
  requestError.validationErrors = validationErrors;
  throw requestError;
});

export async function getData(url, params) {
  return (await api.get(url, { params })).data.data;
}

export async function sendData(url, body, method = "post") {
  return (await api.request({ url, method, data: body })).data.data;
}

export function errorMessage(error) {
  return error instanceof Error ? error.message : "Something went wrong";
}
