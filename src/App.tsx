import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Overview from "./pages/Overview.tsx";
import Traffic from "./pages/Traffic.tsx";
import Alerts from "./pages/Alerts.tsx";
import UserBehavior from "./pages/UserBehavior.tsx";
import Anomaly from "./pages/Anomaly.tsx";
import Health from "./pages/Health.tsx";
import Settings from "./pages/Settings.tsx";
import XBank from "./pages/XBank.tsx";
import AdminLayout from "./components/AdminLayout.tsx";
import RequireAuth from "./components/RequireAuth.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/xbank" element={<XBank />} />

          <Route element={<RequireAuth />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<Overview />} />
              <Route path="/traffic" element={<Traffic />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/users" element={<UserBehavior />} />
              <Route path="/anomaly" element={<Anomaly />} />
              <Route path="/health" element={<Health />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
