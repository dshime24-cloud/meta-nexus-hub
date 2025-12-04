import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import Index from "./pages/Index";
import CharacterDetail from "./pages/CharacterDetail";
import PowersLibrary from "./pages/PowersLibrary";
import Missions from "./pages/Missions";
import Relationships from "./pages/Relationships";
import StoryArcs from "./pages/StoryArcs";
import Shop from "./pages/Shop";
import Maps from "./pages/Maps";
import Teams from "./pages/Teams";
import Crafting from "./pages/Crafting";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <Navigation />
    <main className="container mx-auto px-4 py-8">
      {children}
    </main>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Layout><Index /></Layout>} />
            <Route path="/character/:id" element={<Layout><CharacterDetail /></Layout>} />
            <Route path="/loja" element={<Layout><Shop /></Layout>} />
            <Route path="/poderes" element={<Layout><PowersLibrary /></Layout>} />
            <Route path="/relacoes" element={<Layout><Relationships /></Layout>} />
            <Route path="/historias" element={<Layout><StoryArcs /></Layout>} />
            <Route path="/missoes" element={<Layout><Missions /></Layout>} />
            <Route path="/mapas" element={<Layout><Maps /></Layout>} />
            <Route path="/equipes" element={<Layout><Teams /></Layout>} />
            <Route path="/crafting" element={<Layout><Crafting /></Layout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
