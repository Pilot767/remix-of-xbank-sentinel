import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { TelegramAlerts } from "./TelegramAlerts";
import { BackendStatus } from "./BackendStatus";

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <BackendStatus />
        <Outlet />
      </div>
      <TelegramAlerts />
    </div>
  );
}
