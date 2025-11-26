import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import Index from "./pages/Index";
import CharacterDetail from "./pages/CharacterDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/character/:id" element={<CharacterDetail />} />
          <Route path="/loja" element={<div className="p-8 text-center text-muted-foreground">Loja em desenvolvimento...</div>} />
          <Route path="/poderes" element={<div className="p-8 text-center text-muted-foreground">Poderes em desenvolvimento...</div>} />
          <Route path="/relacoes" element={<div className="p-8 text-center text-muted-foreground">Relações em desenvolvimento...</div>} />
          <Route path="/historias" element={<div className="p-8 text-center text-muted-foreground">Histórias em desenvolvimento...</div>} />
          <Route path="/missoes" element={<div className="p-8 text-center text-muted-foreground">Missões em desenvolvimento...</div>} />
          <Route path="/mapas" element={<div className="p-8 text-center text-muted-foreground">Mapas em desenvolvimento...</div>} />
          <Route path="/linha-tempo" element={<div className="p-8 text-center text-muted-foreground">Linha do Tempo em desenvolvimento...</div>} />
          <Route path="/tempo" element={<div className="p-8 text-center text-muted-foreground">Tempo em desenvolvimento...</div>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
