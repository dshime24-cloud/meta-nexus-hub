import { Link, useLocation } from "react-router-dom";
import { Database, ShoppingCart, Zap, Users, BookOpen, Target, Map, Clock, Timer } from "lucide-react";

const navItems = [
  { name: "FICHAS", path: "/", icon: Database },
  { name: "LOJA", path: "/loja", icon: ShoppingCart },
  { name: "PODERES", path: "/poderes", icon: Zap },
  { name: "RELAÇÕES", path: "/relacoes", icon: Users },
  { name: "HISTÓRIAS", path: "/historias", icon: BookOpen },
  { name: "MISSÕES", path: "/missoes", icon: Target },
  { name: "MAPAS", path: "/mapas", icon: Map },
  { name: "LINHA DO TEMPO", path: "/linha-tempo", icon: Clock },
  { name: "TEMPO", path: "/tempo", icon: Timer },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="border-b border-neon-cyan bg-black sticky top-0 z-50" style={{
      boxShadow: '0 2px 10px rgba(0, 255, 255, 0.3)'
    }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-neon-cyan glow-text-cyan" />
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-neon-cyan glow-text-cyan tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                A.R.C.A.
              </span>
              <span className="text-xs text-neon-lime px-2 py-0.5 border border-neon-lime rounded" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                SYSTEM V2.0-RTX
              </span>
            </div>
          </div>
          
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-3 py-2 transition-all whitespace-nowrap text-sm tracking-wide
                    ${isActive 
                      ? "text-neon-cyan border-b-2 border-neon-cyan glow-text-cyan" 
                      : "text-neon-cyan/60 hover:text-neon-cyan hover:border-b-2 hover:border-neon-cyan/50"
                    }
                  `}
                  style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}
                >
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
