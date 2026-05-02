import { Navigate } from "react-router-dom";

export default function Index() {
  const authed = typeof window !== "undefined" && localStorage.getItem("sentinel_auth") === "1";
  return <Navigate to={authed ? "/dashboard" : "/login"} replace/>;
}
