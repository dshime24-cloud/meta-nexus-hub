import { useEffect, useState, useCallback } from "react";
import { Users, Plus, Search, Heart, Swords, UserCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RelationshipModal } from "@/components/RelationshipModal";
import { RelationshipGraph } from "@/components/RelationshipGraph";

interface Relationship {
  id: string;
  character_id: string;
  related_character_id: string | null;
  relationship_type: string;
  description: string | null;
  bonus: string | null;
  image_url: string | null;
  character?: any;
  related_character?: any;
}

const relationshipTypeColors: Record<string, { bg: string; text: string; icon: any }> = {
  aliado: { bg: "bg-neon-lime/20", text: "text-neon-lime", icon: UserCheck },
  rival: { bg: "bg-neon-orange/20", text: "text-neon-orange", icon: Swords },
  mentor: { bg: "bg-neon-blue/20", text: "text-neon-blue", icon: Shield },
  inimigo: { bg: "bg-neon-red/20", text: "text-neon-red", icon: Swords },
  amigo: { bg: "bg-neon-cyan/20", text: "text-neon-cyan", icon: Heart },
  familia: { bg: "bg-neon-magenta/20", text: "text-neon-magenta", icon: Heart },
};

export default function Relationships() {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "graph">("cards");
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [relRes, charRes] = await Promise.all([
        supabase.from("relationships").select("*"),
        supabase.from("characters").select("id, name, alias, image_url, type"),
      ]);

      if (relRes.error) throw relRes.error;
      if (charRes.error) throw charRes.error;

      const charMap = new Map(charRes.data.map((c) => [c.id, c]));
      const enrichedRelationships = relRes.data.map((rel) => ({
        ...rel,
        character: charMap.get(rel.character_id),
        related_character: rel.related_character_id ? charMap.get(rel.related_character_id) : null,
      }));

      setRelationships(enrichedRelationships);
      setCharacters(charRes.data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar relacionamentos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("relationships").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Relacionamento removido!" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const filteredRelationships = relationships.filter((rel) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      rel.character?.name?.toLowerCase().includes(searchLower) ||
      rel.related_character?.name?.toLowerCase().includes(searchLower) ||
      rel.relationship_type.toLowerCase().includes(searchLower)
    );
  });

  const getTypeConfig = (type: string) => {
    return relationshipTypeColors[type.toLowerCase()] || { bg: "bg-muted", text: "text-foreground", icon: Users };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-4xl font-bold glow-text-cyan mb-2"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          RELACIONAMENTOS
        </h1>
        <p className="text-muted-foreground" style={{ fontFamily: "Rajdhani, sans-serif" }}>
          Gerencie as conexões entre personagens
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="cyber-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="text-3xl font-bold text-neon-cyan">{relationships.length}</p>
        </Card>
        <Card className="cyber-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Aliados</p>
          <p className="text-3xl font-bold text-neon-lime">
            {relationships.filter((r) => r.relationship_type.toLowerCase() === "aliado").length}
          </p>
        </Card>
        <Card className="cyber-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Rivais</p>
          <p className="text-3xl font-bold text-neon-orange">
            {relationships.filter((r) => r.relationship_type.toLowerCase() === "rival").length}
          </p>
        </Card>
        <Card className="cyber-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Inimigos</p>
          <p className="text-3xl font-bold text-neon-red">
            {relationships.filter((r) => r.relationship_type.toLowerCase() === "inimigo").length}
          </p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setEditingRelationship(null);
              setIsModalOpen(true);
            }}
            className="bg-neon-cyan text-background hover:bg-neon-cyan/90 font-bold"
            style={{ fontFamily: "Rajdhani, sans-serif" }}
          >
            <Plus className="w-4 h-4 mr-2" />
            NOVO RELACIONAMENTO
          </Button>
          <div className="flex border border-neon-cyan rounded-sm overflow-hidden">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              onClick={() => setViewMode("cards")}
              className={viewMode === "cards" ? "bg-neon-cyan text-background" : "text-neon-cyan"}
              size="sm"
            >
              Cards
            </Button>
            <Button
              variant={viewMode === "graph" ? "default" : "ghost"}
              onClick={() => setViewMode("graph")}
              className={viewMode === "graph" ? "bg-neon-cyan text-background" : "text-neon-cyan"}
              size="sm"
            >
              Grafo
            </Button>
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neon-cyan w-4 h-4" />
          <Input
            placeholder="Buscar relacionamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black border-neon-cyan text-neon-cyan"
            style={{ fontFamily: "Rajdhani, sans-serif" }}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
        </div>
      ) : viewMode === "graph" ? (
        <RelationshipGraph relationships={relationships} characters={characters} />
      ) : filteredRelationships.length === 0 ? (
        <Card className="cyber-card p-12 text-center">
          <Users className="w-16 h-16 text-neon-cyan/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum relacionamento encontrado</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRelationships.map((rel) => {
            const typeConfig = getTypeConfig(rel.relationship_type);
            const Icon = typeConfig.icon;
            return (
              <Card
                key={rel.id}
                className="cyber-card-interactive p-4 cursor-pointer"
                onClick={() => {
                  setEditingRelationship(rel);
                  setIsModalOpen(true);
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {rel.character?.image_url ? (
                      <img
                        src={rel.character.image_url}
                        alt={rel.character.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-neon-cyan"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-neon-cyan/20 flex items-center justify-center border-2 border-neon-cyan">
                        <span className="text-neon-cyan font-bold">
                          {rel.character?.name?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-neon-cyan font-bold truncate">{rel.character?.name || "Desconhecido"}</p>
                    <div className="flex items-center gap-2 my-2">
                      <div className="flex-1 h-px bg-neon-cyan/30"></div>
                      <Badge className={`${typeConfig.bg} ${typeConfig.text} border-none`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {rel.relationship_type}
                      </Badge>
                      <div className="flex-1 h-px bg-neon-cyan/30"></div>
                    </div>
                    <p className="text-foreground font-bold truncate">
                      {rel.related_character?.name || "Personagem Externo"}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {rel.related_character?.image_url ? (
                      <img
                        src={rel.related_character.image_url}
                        alt={rel.related_character.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-neon-magenta"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-neon-magenta/20 flex items-center justify-center border-2 border-neon-magenta">
                        <span className="text-neon-magenta font-bold">
                          {rel.related_character?.name?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {rel.description && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{rel.description}</p>
                )}
                {rel.bonus && (
                  <div className="mt-3 p-2 bg-neon-lime/10 border border-neon-lime/30 rounded">
                    <p className="text-xs text-neon-lime font-bold">BÔNUS: {rel.bonus}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <RelationshipModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRelationship(null);
        }}
        characters={characters}
        relationship={editingRelationship}
        onSuccess={fetchData}
        onDelete={handleDelete}
      />
    </div>
  );
}