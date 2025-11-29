import { useEffect, useState, useCallback } from "react";
import { Book, Plus, Search, ChevronRight, Users, Target, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StoryArcModal } from "@/components/StoryArcModal";
import { StoryArcDetail } from "@/components/StoryArcDetail";

interface StoryArc {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
  chapters?: any[];
  characters?: any[];
  missions?: any[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
  em_andamento: { label: "Em Andamento", color: "bg-neon-cyan/20 text-neon-cyan border-neon-cyan" },
  concluido: { label: "Concluído", color: "bg-neon-lime/20 text-neon-lime border-neon-lime" },
  pausado: { label: "Pausado", color: "bg-neon-orange/20 text-neon-orange border-neon-orange" },
  planejado: { label: "Planejado", color: "bg-neon-blue/20 text-neon-blue border-neon-blue" },
};

export default function StoryArcs() {
  const [storyArcs, setStoryArcs] = useState<StoryArc[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArc, setSelectedArc] = useState<StoryArc | null>(null);
  const [detailArc, setDetailArc] = useState<StoryArc | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [arcsRes, chaptersRes, arcCharsRes, arcMissionsRes, charsRes, missionsRes] = await Promise.all([
        supabase.from("story_arcs").select("*").order("created_at", { ascending: false }),
        supabase.from("story_chapters").select("*"),
        supabase.from("story_arc_characters").select("*"),
        supabase.from("story_arc_missions").select("*"),
        supabase.from("characters").select("id, name, alias, image_url, type"),
        supabase.from("missions").select("id, title, status, difficulty"),
      ]);

      if (arcsRes.error) throw arcsRes.error;

      const enrichedArcs = arcsRes.data.map((arc) => ({
        ...arc,
        chapters: chaptersRes.data?.filter((c) => c.story_arc_id === arc.id) || [],
        characters: arcCharsRes.data
          ?.filter((ac) => ac.story_arc_id === arc.id)
          .map((ac) => charsRes.data?.find((c) => c.id === ac.character_id))
          .filter(Boolean) || [],
        missions: arcMissionsRes.data
          ?.filter((am) => am.story_arc_id === arc.id)
          .map((am) => missionsRes.data?.find((m) => m.id === am.mission_id))
          .filter(Boolean) || [],
      }));

      setStoryArcs(enrichedArcs);
      setCharacters(charsRes.data || []);
      setMissions(missionsRes.data || []);
    } catch (error: any) {
      toast({ title: "Erro ao carregar histórias", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredArcs = storyArcs.filter((arc) =>
    arc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChapterProgress = (arc: StoryArc) => {
    if (!arc.chapters || arc.chapters.length === 0) return 0;
    const completed = arc.chapters.filter((c) => c.status === "concluido").length;
    return (completed / arc.chapters.length) * 100;
  };

  if (detailArc) {
    return (
      <StoryArcDetail
        arc={detailArc}
        characters={characters}
        missions={missions}
        onBack={() => setDetailArc(null)}
        onUpdate={fetchData}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-4xl font-bold glow-text-cyan mb-2"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          ARCOS NARRATIVOS
        </h1>
        <p className="text-muted-foreground" style={{ fontFamily: "Rajdhani, sans-serif" }}>
          Gerencie histórias e campanhas épicas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="cyber-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="text-3xl font-bold text-neon-cyan">{storyArcs.length}</p>
        </Card>
        <Card className="cyber-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Em Andamento</p>
          <p className="text-3xl font-bold text-neon-lime">
            {storyArcs.filter((a) => a.status === "em_andamento").length}
          </p>
        </Card>
        <Card className="cyber-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Concluídos</p>
          <p className="text-3xl font-bold text-neon-blue">
            {storyArcs.filter((a) => a.status === "concluido").length}
          </p>
        </Card>
        <Card className="cyber-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Capítulos</p>
          <p className="text-3xl font-bold text-neon-magenta">
            {storyArcs.reduce((acc, a) => acc + (a.chapters?.length || 0), 0)}
          </p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <Button
          onClick={() => {
            setSelectedArc(null);
            setIsModalOpen(true);
          }}
          className="bg-neon-cyan text-background hover:bg-neon-cyan/90 font-bold"
          style={{ fontFamily: "Rajdhani, sans-serif" }}
        >
          <Plus className="w-4 h-4 mr-2" />
          NOVO ARCO NARRATIVO
        </Button>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neon-cyan w-4 h-4" />
          <Input
            placeholder="Buscar histórias..."
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
      ) : filteredArcs.length === 0 ? (
        <Card className="cyber-card p-12 text-center">
          <Book className="w-16 h-16 text-neon-cyan/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum arco narrativo encontrado</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArcs.map((arc) => {
            const progress = getChapterProgress(arc);
            const config = statusConfig[arc.status] || statusConfig.em_andamento;
            return (
              <Card
                key={arc.id}
                className="cyber-card-interactive overflow-hidden cursor-pointer"
                onClick={() => setDetailArc(arc)}
              >
                <div className="h-32 bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 relative">
                  {arc.image_url && (
                    <img src={arc.image_url} alt={arc.title} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                  <Badge className={`absolute top-3 right-3 ${config.color}`}>{config.label}</Badge>
                </div>
                <div className="p-4">
                  <h3
                    className="text-xl font-bold text-neon-cyan mb-2 truncate"
                    style={{ fontFamily: "Orbitron, sans-serif" }}
                  >
                    {arc.title}
                  </h3>
                  {arc.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{arc.description}</p>
                  )}

                  {/* Progress */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="text-neon-cyan">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Book className="w-4 h-4" />
                      <span>{arc.chapters?.length || 0} capítulos</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{arc.characters?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Target className="w-4 h-4" />
                      <span>{arc.missions?.length || 0}</span>
                    </div>
                  </div>

                  {/* Characters preview */}
                  {arc.characters && arc.characters.length > 0 && (
                    <div className="flex -space-x-2 mt-4">
                      {arc.characters.slice(0, 5).map((char: any) => (
                        <div
                          key={char.id}
                          className="w-8 h-8 rounded-full border-2 border-neon-cyan bg-black flex items-center justify-center"
                          title={char.name}
                        >
                          {char.image_url ? (
                            <img src={char.image_url} alt={char.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-xs text-neon-cyan font-bold">{char.name.charAt(0)}</span>
                          )}
                        </div>
                      ))}
                      {arc.characters.length > 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-neon-cyan bg-black flex items-center justify-center">
                          <span className="text-xs text-neon-cyan">+{arc.characters.length - 5}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="px-4 py-3 border-t border-neon-cyan/30 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {arc.start_date ? new Date(arc.start_date).toLocaleDateString("pt-BR") : "Sem data"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-neon-cyan" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <StoryArcModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedArc(null);
        }}
        arc={selectedArc}
        characters={characters}
        missions={missions}
        onSuccess={fetchData}
      />
    </div>
  );
}