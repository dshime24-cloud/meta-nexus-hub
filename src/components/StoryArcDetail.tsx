import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Book, Users, Target, Clock, Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StoryNarrativeTimeline } from "@/components/StoryNarrativeTimeline";

interface StoryArcDetailProps {
  arc: any;
  characters: any[];
  missions: any[];
  onBack: () => void;
  onUpdate: () => void;
}

const statusColors: Record<string, string> = {
  pendente: "bg-muted text-muted-foreground",
  em_andamento: "bg-neon-cyan/20 text-neon-cyan",
  concluido: "bg-neon-lime/20 text-neon-lime",
};

export function StoryArcDetail({ arc, characters, missions, onBack, onUpdate }: StoryArcDetailProps) {
  const [chapters, setChapters] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchChapters();
    fetchTimeline();
  }, [arc.id]);

  const fetchChapters = async () => {
    const { data, error } = await supabase
      .from("story_chapters")
      .select("*")
      .eq("story_arc_id", arc.id)
      .order("chapter_number", { ascending: true });
    if (!error) setChapters(data || []);
  };

  const fetchTimeline = async () => {
    const { data, error } = await supabase
      .from("story_timeline")
      .select("*")
      .eq("story_arc_id", arc.id)
      .order("event_date", { ascending: true });
    if (!error) setTimeline(data || []);
  };

  const handleDeleteArc = async () => {
    if (!confirm("Tem certeza que deseja excluir este arco?")) return;
    try {
      const { error } = await supabase.from("story_arcs").delete().eq("id", arc.id);
      if (error) throw error;
      toast({ title: "Arco excluído!" });
      onBack();
      onUpdate();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveChapter = async (data: any) => {
    try {
      if (editingChapter?.id) {
        const { error } = await supabase.from("story_chapters").update(data).eq("id", editingChapter.id);
        if (error) throw error;
        toast({ title: "Capítulo atualizado!" });
      } else {
        const { error } = await supabase.from("story_chapters").insert({
          ...data,
          story_arc_id: arc.id,
          chapter_number: chapters.length + 1,
        });
        if (error) throw error;
        toast({ title: "Capítulo criado!" });
      }
      setIsChapterModalOpen(false);
      setEditingChapter(null);
      fetchChapters();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteChapter = async (id: string) => {
    try {
      const { error } = await supabase.from("story_chapters").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Capítulo excluído!" });
      fetchChapters();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const progress = chapters.length > 0 ? (chapters.filter((c) => c.status === "concluido").length / chapters.length) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="text-neon-cyan hover:bg-neon-cyan/20">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDeleteArc} className="border-neon-red text-neon-red hover:bg-neon-red/20">
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Arc Info */}
      <Card className="cyber-card p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-48 h-48 bg-gradient-to-br from-neon-magenta/20 to-neon-cyan/20 rounded-lg flex items-center justify-center">
            {arc.image_url ? (
              <img src={arc.image_url} alt={arc.title} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <Book className="w-16 h-16 text-neon-magenta/50" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold glow-text-magenta mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
              {arc.title}
            </h1>
            {arc.description && <p className="text-muted-foreground mb-4">{arc.description}</p>}

            {/* Progress */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso Geral</span>
                <span className="text-neon-cyan">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Book className="w-4 h-4 text-neon-cyan" />
                <span className="text-foreground">{chapters.length} capítulos</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-neon-lime" />
                <span className="text-foreground">{arc.characters?.length || 0} personagens</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-neon-orange" />
                <span className="text-foreground">{arc.missions?.length || 0} missões</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {arc.start_date ? new Date(arc.start_date).toLocaleDateString("pt-BR") : "Sem data"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chapters */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-neon-cyan" style={{ fontFamily: "Orbitron, sans-serif" }}>
              CAPÍTULOS
            </h2>
            <Button
              onClick={() => {
                setEditingChapter(null);
                setIsChapterModalOpen(true);
              }}
              size="sm"
              className="bg-neon-cyan text-background hover:bg-neon-cyan/90"
            >
              <Plus className="w-4 h-4 mr-1" />
              Novo
            </Button>
          </div>

          {chapters.length === 0 ? (
            <Card className="cyber-card p-8 text-center">
              <Book className="w-12 h-12 text-neon-cyan/30 mx-auto mb-2" />
              <p className="text-muted-foreground">Nenhum capítulo ainda</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {chapters.map((chapter) => (
                <Card
                  key={chapter.id}
                  className="cyber-card overflow-hidden"
                >
                  <div
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center text-neon-cyan font-bold">
                        {chapter.chapter_number}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{chapter.title}</p>
                        <Badge className={statusColors[chapter.status]}>{chapter.status.replace("_", " ")}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingChapter(chapter);
                          setIsChapterModalOpen(true);
                        }}
                        className="text-neon-cyan hover:bg-neon-cyan/20"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChapter(chapter.id);
                        }}
                        className="text-neon-red hover:bg-neon-red/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {expandedChapter === chapter.id ? (
                        <ChevronUp className="w-4 h-4 text-neon-cyan" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neon-cyan" />
                      )}
                    </div>
                  </div>
                  {expandedChapter === chapter.id && chapter.description && (
                    <div className="px-4 pb-4 border-t border-neon-cyan/20 pt-3">
                      <p className="text-sm text-muted-foreground">{chapter.description}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Characters */}
          <Card className="cyber-card p-4">
            <h3 className="text-sm font-bold text-neon-lime mb-3 uppercase tracking-wider">Personagens</h3>
            {arc.characters && arc.characters.length > 0 ? (
              <div className="space-y-2">
                {arc.characters.map((char: any) => (
                  <div key={char.id} className="flex items-center gap-2 p-2 bg-black/50 rounded">
                    {char.image_url ? (
                      <img src={char.image_url} alt={char.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neon-lime/20 flex items-center justify-center text-neon-lime font-bold text-xs">
                        {char.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm text-foreground">{char.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum personagem</p>
            )}
          </Card>

          {/* Missions */}
          <Card className="cyber-card p-4">
            <h3 className="text-sm font-bold text-neon-orange mb-3 uppercase tracking-wider">Missões</h3>
            {arc.missions && arc.missions.length > 0 ? (
              <div className="space-y-2">
                {arc.missions.map((mission: any) => (
                  <div key={mission.id} className="flex items-center justify-between p-2 bg-black/50 rounded">
                    <span className="text-sm text-foreground truncate">{mission.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {mission.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma missão</p>
            )}
          </Card>
        </div>
      </div>

      {/* Narrative Timeline */}
      <div className="mt-8">
        <StoryNarrativeTimeline
          arcId={arc.id}
          chapters={chapters}
          timeline={timeline}
          onUpdate={fetchTimeline}
        />
      </div>

      {/* Chapter Modal */}
      <ChapterModal
        isOpen={isChapterModalOpen}
        onClose={() => {
          setIsChapterModalOpen(false);
          setEditingChapter(null);
        }}
        chapter={editingChapter}
        onSave={handleSaveChapter}
      />
    </div>
  );
}

function ChapterModal({ isOpen, onClose, chapter, onSave }: any) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pendente");

  useEffect(() => {
    if (chapter) {
      setTitle(chapter.title || "");
      setDescription(chapter.description || "");
      setStatus(chapter.status || "pendente");
    } else {
      setTitle("");
      setDescription("");
      setStatus("pendente");
    }
  }, [chapter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, description, status });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-black border-2" style={{ borderColor: "hsl(var(--neon-cyan))" }}>
        <DialogHeader>
          <DialogTitle className="text-neon-cyan" style={{ fontFamily: "Orbitron, sans-serif" }}>
            {chapter ? "EDITAR CAPÍTULO" : "NOVO CAPÍTULO"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-neon-cyan text-sm font-bold">TÍTULO *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 bg-black border-neon-cyan text-neon-cyan"
              required
            />
          </div>
          <div>
            <Label className="text-neon-cyan text-sm font-bold">DESCRIÇÃO</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 bg-black border-neon-cyan text-neon-cyan min-h-[100px]"
            />
          </div>
          <div>
            <Label className="text-neon-cyan text-sm font-bold">STATUS</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-black border border-neon-cyan text-neon-cyan rounded-sm"
            >
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Concluído</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-neon-cyan text-neon-cyan">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-neon-cyan text-background hover:bg-neon-cyan/90">
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}