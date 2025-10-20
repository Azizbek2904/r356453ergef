import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Employees from "./pages/dashboard/Employees";
import Leads from "./pages/dashboard/Leads";
import LeadAssign from "./pages/dashboard/LeadAssign";
import Clients from "./pages/dashboard/Clients";
import MainPayment from "./pages/dashboard/MainPayment";
import Finance from "./pages/dashboard/Finance";
import Documents from "./pages/dashboard/Documents";
import Reception from "./pages/dashboard/Reception";
import NotFound from "./pages/NotFound";
import PerformancePage from "./pages/dashboard/performance/PerformancePage";
import KanbanBoardPage from "@/pages/dashboard/KanbanBoardPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path="employees" element={<Employees />} />
            <Route path="leads" element={<Leads />} />
            <Route path="lead-assign" element={<LeadAssign />} />
            <Route path="clients" element={<Clients />} />
            <Route path="main-payment" element={<MainPayment />} />
            <Route path="finance" element={<Finance />} />
            <Route path="performance" element={<PerformancePage />} />
            <Route path="documents" element={<Documents />} />
            <Route path="reception" element={<Reception />} />
              <Route path="/dashboard/kanban" element={<KanbanBoardPage />} />

          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
