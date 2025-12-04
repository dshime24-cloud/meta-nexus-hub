import { Link, useLocation } from "react-router-dom";
import { Database, ShoppingCart, Zap, Users, BookOpen, Target, Map, UsersRound, Hammer, LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const navItems = [
  { name: "FICHAS", path: "/", icon: Database },
  { name: "LOJA", path: "/loja", icon: ShoppingCart },
  { name: "PODERES", path: "/poderes", icon: Zap },
  { name: "RELAÇÕES", path: "/relacoes", icon: Users },
  { name: "EQUIPES", path: "/equipes", icon: UsersRound },
  { name: "CRAFTING", path: "/crafting", icon: Hammer },
  { name: "HISTÓRIAS", path: "/historias", icon: BookOpen },
  { name: "MISSÕES", path: "/missoes", icon: Target },
  { name: "MAPAS", path: "/mapas", icon: Map },
];

export const Navigation = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <nav className="border-b border-neon-cyan bg-black sticky top-0 z-50" style={{
      boxShadow: '0 2px 10px rgba(0, 255, 255, 0.3)'
    }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Database className="w-6 h-6 text-neon-cyan glow-text-cyan" />
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-neon-cyan glow-text-cyan tracking-wider font-orbitron">
                A.R.C.A.
              </span>
              <span className="text-xs text-neon-lime px-2 py-0.5 border border-neon-lime rounded font-rajdhani hidden sm:block">
                SYSTEM V2.0-RTX
              </span>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-1.5 px-2 md:px-3 py-2 transition-all whitespace-nowrap text-xs md:text-sm tracking-wide font-rajdhani font-semibold
                      ${isActive 
                        ? "text-neon-cyan border-b-2 border-neon-cyan glow-text-cyan" 
                        : "text-neon-cyan/60 hover:text-neon-cyan hover:border-b-2 hover:border-neon-cyan/50"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 hidden md:block" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2 ml-2 border-l border-primary/30 pl-2">
              {user && <NotificationBell />}
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-primary">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-primary">
                    <DropdownMenuItem className="text-muted-foreground text-xs">
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" /> Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                    <LogIn className="w-4 h-4 mr-1" /> Entrar
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
