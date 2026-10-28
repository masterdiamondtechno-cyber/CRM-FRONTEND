import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet } from "react-router-dom";
export function ProtectedRoute() { return sessionStorage.getItem("crm_token") ? _jsx(Outlet, {}) : _jsx(Navigate, { to: "/login", replace: true }); }
