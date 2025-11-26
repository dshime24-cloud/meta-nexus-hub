import { Link, useLocation } from "react-router-dom";
import { Database, ShoppingCart, Zap, Users, BookOpen, Target, Map, Clock, Timer } from "lucide-react";

const navItems = [
  { name: "Fichas", path: "/", icon: Database },
  { name: "Loja", path: "/loja", icon: ShoppingCart },
  { name: "Poderes", path: "/poderes", icon: Zap },
  { name: "Relações", path: "/relacoes", icon: Users },
  { name: "Histórias", path: "/historias", icon: BookOpen },
  { name: "Missões", path: "/missoes", icon: Target },
  { name: "Mapas", path: "/mapas", icon: Map },
  { name: "Linha do Tempo", path: "/linha-tempo", icon: Clock },
  { name: "Tempo", path: "/tempo", icon: Timer },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="border-b border-neon-cyan bg-black/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold glow-text-cyan">A.R.C.A.</div>
            <div className="text-xs text-neon-green">v2.0.1</div>
          </div>
          
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-sm transition-all whitespace-nowrap
                    ${isActive 
                      ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan glow-border-cyan" 
                      : "text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10 border border-transparent"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
