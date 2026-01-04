import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Ideas from "./pages/Ideas";
import Roadmap from "./pages/Roadmap";
import Chat from "./pages/Chat";
import Decisions from "./pages/Decisions";
import Metrics from "./pages/Metrics";
import Reviews from "./pages/Reviews";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/ideas" element={<Ideas />} />
            <Route path="/dashboard/roadmap" element={<Roadmap />} />
            <Route path="/dashboard/chat" element={<Chat />} />
            <Route path="/dashboard/decisions" element={<Decisions />} />
            <Route path="/dashboard/metrics" element={<Metrics />} />
            <Route path="/dashboard/reviews" element={<Reviews />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
