import { useState, useEffect } from "react";
import { Plus, Search, Filter, Database, Shield, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CharacterCard } from "@/components/CharacterCard";
import { CreateCharacterModal } from "@/components/CreateCharacterModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchCharacters();
  }, []);

  // Realtime subscription for character changes
  useEffect(() => {
    const channel = supabase
      .channel('characters-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'characters',
        },
        () => {
          fetchCharacters();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCharacters = async () => {
    try {
      const { data: charactersData, error: charactersError } = await supabase
        .from("characters")
        .select("*")
        .order("created_at", { ascending: false });

      if (charactersError) throw charactersError;

      // Buscar atributos para cada personagem
      const charactersWithAttributes = await Promise.all(
        (charactersData || []).map(async (char) => {
          const { data: attrData } = await supabase
            .from("character_attributes")
            .select("*")
            .eq("character_id", char.id)
            .single();
          return {
            ...char,
            attributes: attrData || {
              coordination: 1,
              vigor: 1,
              intellect: 1,
              attention: 1,
              willpower: 1,
              prowess: 1,
            },
          };
        })
      );

      // Sort: owned characters first, then others
      if (user) {
        charactersWithAttributes.sort((a, b) => {
          if (a.owner_id === user.id && b.owner_id !== user.id) return -1;
          if (a.owner_id !== user.id && b.owner_id === user.id) return 1;
          return 0;
        });
      }

      setCharacters(charactersWithAttributes);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar personagens",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCharacters = characters.filter(
    (char) =>
      char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      char.alias?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const heroCount = characters.filter((c) => c.type === "hero").length;
  const villainCount = characters.filter((c) => c.type === "villain").length;
  const myCharactersCount = user ? characters.filter((c) => c.owner_id === user.id).length : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold glow-text-cyan mb-2 text-primary-foreground">
            <Database className="inline-block mr-3 w-10 h-10" />
            Banco de Dados Meta-Humano
          </h1>
          <p className="text-muted-foreground">
            Sistema A.R.C.A. - Arquivo de Registro de Capacidades Anômalas
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="cyber-card p-4 flex items-center gap-3">
          <Database className="w-8 h-8 text-neon-cyan" />
          <div>
            <p className="text-2xl font-bold text-neon-cyan">{characters.length}</p>
            <p className="text-xs text-muted-foreground">Total de Fichas</p>
          </div>
        </div>
        <div className="cyber-card p-4 flex items-center gap-3">
          <Shield className="w-8 h-8 text-neon-lime" />
          <div>
            <p className="text-2xl font-bold text-neon-lime">{heroCount}</p>
            <p className="text-xs text-muted-foreground">Heróis</p>
          </div>
        </div>
        <div className="cyber-card p-4 flex items-center gap-3">
          <Skull className="w-8 h-8 text-neon-red" />
          <div>
            <p className="text-2xl font-bold text-neon-red">{villainCount}</p>
            <p className="text-xs text-muted-foreground">Vilões</p>
          </div>
        </div>
        {user && (
          <div className="cyber-card p-4 flex items-center gap-3 ring-2 ring-neon-lime/50">
            <div className="w-8 h-8 rounded-full bg-neon-lime/20 flex items-center justify-center">
              <span className="text-neon-lime font-bold">👤</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-neon-lime">{myCharactersCount}</p>
              <p className="text-xs text-muted-foreground">Suas Fichas</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="text-black glow-border-cyan font-bold bg-[#01c4e7]"
        >
          <Plus className="mr-2 w-4 h-4" />
          Nova Ficha
        </Button>
        <Button
          variant="outline"
          className="border-neon-magenta text-neon-magenta hover:bg-neon-magenta/20"
        >
          <Plus className="mr-2 w-4 h-4" />
          Criar em Lote
        </Button>

        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar personagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-neon-cyan/50 focus:border-neon-cyan"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20"
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Characters Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
          <p className="mt-4 text-muted-foreground">Carregando fichas...</p>
        </div>
      ) : filteredCharacters.length === 0 ? (
        <div className="text-center py-12 cyber-card">
          <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {searchTerm
              ? "Nenhum personagem encontrado."
              : "Nenhuma ficha cadastrada ainda."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCharacters.map((character) => (
            <CharacterCard
              key={character.id}
              id={character.id}
              name={character.name}
              alias={character.alias}
              classification={character.classification}
              threatLevel={character.threat_level}
              type={character.type}
              imageUrl={character.image_url}
              ownerId={character.owner_id}
              attributes={character.attributes}
              onOwnershipChange={fetchCharacters}
            />
          ))}
        </div>
      )}

      <CreateCharacterModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={fetchCharacters}
      />
    </div>
  );
}