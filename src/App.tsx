import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoadmapProvider } from "@/contexts/RoadmapContext";
import HomePage from "@/pages/HomePage";
import QuestionsPage from "@/pages/QuestionsPage";
import RoadmapPage from "@/pages/RoadmapPage";
import RoadmapsPage from "@/pages/RoadmapsPage";
import NotFound from "@/pages/NotFound";
import SignUpPage from "@/pages/SignUpPage";
import LoginPage from "@/pages/LoginPage";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Header from "@/components/Header";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RoadmapProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/questions" element={<QuestionsPage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route path="/roadmaps" element={<RoadmapsPage />} />
              <Route path="/roadmap/:id" element={<RoadmapPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </RoadmapProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
