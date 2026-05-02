import { Navigate, Outlet } from "react-router-dom";

export default function RequireAuth() {
  const authed = typeof window !== "undefined" && localStorage.getItem("sentinel_auth") === "1";
  if (!authed) return <Navigate to="/login" replace/>;
  return <Outlet/>;
}
