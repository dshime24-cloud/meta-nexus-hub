import { useState } from "react";
import { Clock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StoryNarrativeTimelineProps {
  arcId: string;
  chapters: any[];
  timeline: any[];
  onUpdate: () => void;
}

const eventTypeConfig: Record<string, { label: string; color: string }> = {
  inicio: { label: "Início", color: "bg-neon-cyan/20 text-neon-cyan border-neon-cyan" },
  desenvolvimento: { label: "Desenvolvimento", color: "bg-neon-blue/20 text-neon-blue border-neon-blue" },
  reviravolta: { label: "Reviravolta", color: "bg-neon-orange/20 text-neon-orange border-neon-orange" },
  climax: { label: "Clímax", color: "bg-neon-red/20 text-neon-red border-neon-red" },
  resolucao: { label: "Resolução", color: "bg-neon-lime/20 text-neon-lime border-neon-lime" },
  epilogo: { label: "Epílogo", color: "bg-neon-magenta/20 text-neon-magenta border-neon-magenta" },
};

export function StoryNarrativeTimeline({ arcId, chapters, timeline, onUpdate }: StoryNarrativeTimelineProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const handleAddEvent = async (data: any) => {
    try {
      const { error } = await supabase.from("story_timeline").insert({
        story_arc_id: arcId,
        chapter_id: data.chapter_id || null,
        event_type: data.event_type,
        title: data.title,
        description: data.description || null,
        event_date: data.event_date || new Date().toISOString(),
      });
      if (error) throw error;
      toast({ title: "Evento adicionado!" });
      setIsModalOpen(false);
      onUpdate();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const { error } = await supabase.from("story_timeline").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Evento removido!" });
      onUpdate();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card className="cyber-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-neon-cyan flex items-center gap-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
          <Clock className="w-5 h-5" />
          LINHA DO TEMPO NARRATIVA
        </h2>
        <Button
          onClick={() => setIsModalOpen(true)}
          size="sm"
          className="bg-neon-cyan text-background hover:bg-neon-cyan/90"
        >
          <Plus className="w-4 h-4 mr-1" />
          Evento
        </Button>
      </div>

      {timeline.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-neon-cyan/30 mx-auto mb-2" />
          <p className="text-muted-foreground">Nenhum evento na linha do tempo</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-neon-cyan via-neon-magenta to-neon-cyan"></div>

          <div className="space-y-6">
            {timeline.map((event, index) => {
              const config = eventTypeConfig[event.event_type] || eventTypeConfig.desenvolvimento;
              const chapter = chapters.find((c) => c.id === event.chapter_id);
              return (
                <div key={event.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div
                    className="absolute left-2 top-2 w-5 h-5 rounded-full border-2 bg-black"
                    style={{
                      borderColor: config.color.includes("cyan")
                        ? "hsl(var(--neon-cyan))"
                        : config.color.includes("lime")
                        ? "hsl(var(--neon-lime))"
                        : config.color.includes("red")
                        ? "hsl(var(--neon-red))"
                        : config.color.includes("orange")
                        ? "hsl(var(--neon-orange))"
                        : config.color.includes("blue")
                        ? "hsl(var(--neon-blue))"
                        : "hsl(var(--neon-magenta))",
                    }}
                  ></div>

                  <div className="bg-black/50 border border-neon-cyan/30 rounded p-4 group hover:border-neon-cyan/60 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={config.color}>{config.label}</Badge>
                          {chapter && (
                            <span className="text-xs text-muted-foreground">Cap. {chapter.chapter_number}</span>
                          )}
                        </div>
                        <h4 className="font-bold text-foreground">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(event.event_date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="opacity-0 group-hover:opacity-100 text-neon-red hover:bg-neon-red/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <TimelineEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        chapters={chapters}
        onSave={handleAddEvent}
      />
    </Card>
  );
}

function TimelineEventModal({ isOpen, onClose, chapters, onSave }: any) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("desenvolvimento");
  const [chapterId, setChapterId] = useState("");
  const [eventDate, setEventDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      event_type: eventType,
      chapter_id: chapterId || null,
      event_date: eventDate || new Date().toISOString(),
    });
    setTitle("");
    setDescription("");
    setEventType("desenvolvimento");
    setChapterId("");
    setEventDate("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-black border-2" style={{ borderColor: "hsl(var(--neon-cyan))" }}>
        <DialogHeader>
          <DialogTitle className="text-neon-cyan" style={{ fontFamily: "Orbitron, sans-serif" }}>
            NOVO EVENTO NA TIMELINE
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
            <Label className="text-neon-cyan text-sm font-bold">TIPO DE EVENTO</Label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-black border border-neon-cyan text-neon-cyan rounded-sm"
            >
              {Object.entries(eventTypeConfig).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-neon-cyan text-sm font-bold">CAPÍTULO (opcional)</Label>
            <select
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-black border border-neon-cyan text-neon-cyan rounded-sm"
            >
              <option value="">Sem capítulo específico</option>
              {chapters.map((ch: any) => (
                <option key={ch.id} value={ch.id}>
                  Cap. {ch.chapter_number}: {ch.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-neon-cyan text-sm font-bold">DATA DO EVENTO</Label>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="mt-1 bg-black border-neon-cyan text-neon-cyan"
            />
          </div>
          <div>
            <Label className="text-neon-cyan text-sm font-bold">DESCRIÇÃO</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 bg-black border-neon-cyan text-neon-cyan min-h-[80px]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-neon-cyan text-neon-cyan">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-neon-cyan text-background hover:bg-neon-cyan/90">
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}