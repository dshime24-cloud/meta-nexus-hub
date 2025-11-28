import { useState, useEffect } from "react";
import { Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MissionTimelineProps {
  missionId: string;
  onUpdate?: () => void;
}

const EVENT_TYPES = [
  { value: "criação", label: "Criação", color: "text-neon-cyan" },
  { value: "início", label: "Início", color: "text-neon-green" },
  { value: "progresso", label: "Progresso", color: "text-neon-blue" },
  { value: "conclusão", label: "Conclusão", color: "text-neon-green" },
  { value: "falha", label: "Falha", color: "text-neon-red" },
  { value: "pausa", label: "Pausa", color: "text-neon-yellow" },
  { value: "retomada", label: "Retomada", color: "text-neon-cyan" },
  { value: "participante_adicionado", label: "Participante Adicionado", color: "text-neon-magenta" },
  { value: "participante_removido", label: "Participante Removido", color: "text-neon-orange" },
];

export function MissionTimeline({ missionId, onUpdate }: MissionTimelineProps) {
  const { toast } = useToast();
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newEventType, setNewEventType] = useState("");
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    fetchTimeline();
  }, [missionId]);

  const fetchTimeline = async () => {
    try {
      const { data, error } = await supabase
        .from("mission_timeline")
        .select("*")
        .eq("mission_id", missionId)
        .order("event_date", { ascending: false });

      if (error) throw error;
      setTimeline(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar timeline",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!newEventType || !newDescription) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o tipo e descrição do evento",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("mission_timeline")
        .insert({
          mission_id: missionId,
          event_type: newEventType,
          description: newDescription,
        });

      if (error) throw error;

      toast({
        title: "Evento adicionado!",
        description: "O evento foi adicionado à timeline.",
      });

      setNewEventType("");
      setNewDescription("");
      setIsAdding(false);
      fetchTimeline();
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar evento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getEventColor = (eventType: string) => {
    const event = EVENT_TYPES.find(e => e.value === eventType);
    return event?.color || "text-foreground";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-cyan"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Event Form */}
      {isAdding ? (
        <div className="cyber-card p-4 space-y-4 bg-muted/30">
          <div className="space-y-2">
            <Label className="text-neon-cyan">Tipo de Evento *</Label>
            <Select value={newEventType} onValueChange={setNewEventType}>
              <SelectTrigger className="cyber-input">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-background border-neon-cyan">
                {EVENT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-neon-cyan">Descrição *</Label>
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              placeholder="Descreva o que aconteceu..."
              className="cyber-input"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAddEvent}
              className="bg-neon-cyan text-background hover:bg-neon-cyan/90 font-bold"
            >
              Adicionar Evento
            </Button>
            <Button
              onClick={() => {
                setIsAdding(false);
                setNewEventType("");
                setNewDescription("");
              }}
              variant="ghost"
              className="text-neon-cyan hover:bg-neon-cyan/20"
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsAdding(true)}
          className="bg-neon-cyan text-background hover:bg-neon-cyan/90 font-bold"
        >
          <Plus className="mr-2 w-4 h-4" />
          Adicionar Evento
        </Button>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neon-cyan/30"></div>

        {/* Events */}
        <div className="space-y-6">
          {timeline.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum evento registrado ainda</p>
            </div>
          ) : (
            timeline.map((event, index) => (
              <div key={event.id} className="relative pl-12">
                {/* Dot */}
                <div
                  className={`absolute left-2.5 w-3 h-3 rounded-full ${getEventColor(event.event_type).replace('text-', 'bg-')} border-2 border-background`}
                  style={{ top: '0.5rem' }}
                ></div>

                {/* Content */}
                <div className="cyber-card p-4 bg-muted/30">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-sm font-bold ${getEventColor(event.event_type)}`}>
                      {EVENT_TYPES.find(t => t.value === event.event_type)?.label || event.event_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(event.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{event.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}