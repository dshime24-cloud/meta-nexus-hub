import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, PauseCircle, Target, Users, Award, MapPin, Edit, Eye, Trophy, Skull } from "lucide-react";
import { MissionTimeline } from "./MissionTimeline";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MissionCardProps {
  mission: any;
  onEdit: (mission: any) => void;
  onUpdate: () => void;
}

export function MissionCard({ mission, onEdit, onUpdate }: MissionCardProps) {
  const { toast } = useToast();
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"complete" | "fail" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativa": return "bg-neon-cyan/20 text-neon-cyan border-neon-cyan";
      case "concluída": return "bg-neon-green/20 text-neon-green border-neon-green";
      case "falhada": return "bg-neon-red/20 text-neon-red border-neon-red";
      case "pausada": return "bg-neon-yellow/20 text-neon-yellow border-neon-yellow";
      default: return "bg-muted/20 text-foreground border-muted";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Fácil": return "bg-neon-green/20 text-neon-green border-neon-green";
      case "Média": return "bg-neon-cyan/20 text-neon-cyan border-neon-cyan";
      case "Difícil": return "bg-neon-yellow/20 text-neon-yellow border-neon-yellow";
      case "Extrema": return "bg-neon-orange/20 text-neon-orange border-neon-orange";
      case "Lendária": return "bg-neon-magenta/20 text-neon-magenta border-neon-magenta";
      default: return "bg-muted/20 text-foreground border-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ativa": return <Clock className="w-4 h-4" />;
      case "concluída": return <CheckCircle className="w-4 h-4" />;
      case "falhada": return <XCircle className="w-4 h-4" />;
      case "pausada": return <PauseCircle className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const handleMissionAction = (action: "complete" | "fail") => {
    setConfirmAction(action);
    setIsConfirmOpen(true);
  };

  const processAction = async () => {
    if (!confirmAction) return;
    
    setIsProcessing(true);
    try {
      const newStatus = confirmAction === "complete" ? "concluída" : "falhada";
      
      // Update mission status
      const { error: missionError } = await supabase
        .from("missions")
        .update({ 
          status: newStatus,
          end_date: new Date().toISOString()
        })
        .eq("id", mission.id);

      if (missionError) throw missionError;

      // If completed, distribute XP to participants
      if (confirmAction === "complete" && mission.mission_participants?.length > 0) {
        const xpPerParticipant = Math.floor(mission.xp_reward / mission.mission_participants.length);
        
        for (const participant of mission.mission_participants) {
          const { data: charData } = await supabase
            .from("characters")
            .select("xp, level")
            .eq("id", participant.character_id)
            .single();

          if (charData) {
            const newXp = (charData.xp || 0) + xpPerParticipant;
            
            // Check for level up
            const { data: thresholds } = await supabase
              .from("level_thresholds")
              .select("*")
              .order("level", { ascending: true });

            let newLevel = charData.level || 1;
            if (thresholds) {
              for (const threshold of thresholds) {
                if (newXp >= threshold.xp_required && threshold.level > newLevel) {
                  newLevel = threshold.level;
                }
              }
            }

            await supabase
              .from("characters")
              .update({ xp: newXp, level: newLevel })
              .eq("id", participant.character_id);

            // Create notification if leveled up
            if (newLevel > (charData.level || 1)) {
              await supabase.from("notifications").insert({
                title: "Subiu de Nível!",
                message: `${participant.characters?.name} subiu para o nível ${newLevel}!`,
                type: "level_up",
                character_id: participant.character_id
              });
            }
          }
        }

        toast({
          title: "Missão Concluída!",
          description: `${xpPerParticipant} XP distribuído para cada participante.`,
        });
      } else if (confirmAction === "fail") {
        toast({
          title: "Missão Falhada",
          description: "A missão foi marcada como falhada.",
          variant: "destructive",
        });
      }

      // Add timeline event
      await supabase.from("mission_timeline").insert({
        mission_id: mission.id,
        event_type: confirmAction === "complete" ? "conclusão" : "falha",
        description: confirmAction === "complete" 
          ? `Missão concluída com sucesso! ${mission.xp_reward} XP distribuído entre os participantes.`
          : "A missão falhou.",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsConfirmOpen(false);
      setConfirmAction(null);
    }
  };

  const isActive = mission.status === "ativa";

  return (
    <>
      <Card className="cyber-card p-6 hover:scale-105 transition-all duration-300 group relative">
        {/* Edit Button */}
        <Button
          onClick={() => onEdit(mission)}
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-neon-cyan/20 text-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit className="w-4 h-4" />
        </Button>

        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-foreground mb-2">{mission.title}</h3>
          <div className="flex flex-wrap gap-2">
            <Badge className={`${getStatusColor(mission.status)} font-bold flex items-center gap-1`}>
              {getStatusIcon(mission.status)}
              {mission.status}
            </Badge>
            <Badge className={`${getDifficultyColor(mission.difficulty)} font-bold`}>
              {mission.difficulty}
            </Badge>
            {mission.threat_level && (
              <Badge className="bg-neon-red/20 text-neon-red border-neon-red font-bold">
                Ameaça: {mission.threat_level}
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {mission.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {mission.description}
          </p>
        )}

        {/* Info Grid */}
        <div className="space-y-3 mb-4">
          {mission.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-neon-cyan" />
              <span className="text-muted-foreground">{mission.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Award className="w-4 h-4 text-neon-yellow" />
            <span className="text-muted-foreground">Recompensa:</span>
            <span className="text-neon-yellow font-bold">{mission.xp_reward} XP</span>
          </div>

          {mission.mission_participants && mission.mission_participants.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-neon-cyan" />
              <span className="text-muted-foreground">
                {mission.mission_participants.length} participante(s)
              </span>
            </div>
          )}
        </div>

        {/* Participants Preview */}
        {mission.mission_participants && mission.mission_participants.length > 0 && (
          <div className="flex -space-x-2 mb-4">
            {mission.mission_participants.slice(0, 5).map((participant: any) => (
              <div
                key={participant.id}
                className="w-8 h-8 rounded-full border-2 border-background bg-neon-cyan/20 flex items-center justify-center text-xs font-bold text-neon-cyan"
                title={participant.characters?.name}
              >
                {participant.characters?.image_url ? (
                  <img
                    src={participant.characters.image_url}
                    alt={participant.characters.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  participant.characters?.name?.charAt(0)
                )}
              </div>
            ))}
            {mission.mission_participants.length > 5 && (
              <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold">
                +{mission.mission_participants.length - 5}
              </div>
            )}
          </div>
        )}

        {/* Dates */}
        <div className="text-xs text-muted-foreground space-y-1 pt-3 border-t border-neon-cyan/30">
          <div className="flex justify-between">
            <span>Início:</span>
            <span>{format(new Date(mission.start_date), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
          {mission.end_date && (
            <div className="flex justify-between">
              <span>Fim:</span>
              <span>{format(new Date(mission.end_date), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-2">
          {isActive && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleMissionAction("complete")}
                className="bg-neon-green/20 text-neon-green border border-neon-green hover:bg-neon-green/30 font-bold"
                disabled={isProcessing}
              >
                <Trophy className="mr-2 w-4 h-4" />
                Vitória
              </Button>
              <Button
                onClick={() => handleMissionAction("fail")}
                className="bg-neon-red/20 text-neon-red border border-neon-red hover:bg-neon-red/30 font-bold"
                disabled={isProcessing}
              >
                <Skull className="mr-2 w-4 h-4" />
                Derrota
              </Button>
            </div>
          )}
          <Button
            onClick={() => setIsTimelineOpen(true)}
            variant="outline"
            className="w-full border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20"
          >
            <Eye className="mr-2 w-4 h-4" />
            Ver Timeline
          </Button>
        </div>
      </Card>

      {/* Timeline Modal */}
      <Dialog open={isTimelineOpen} onOpenChange={setIsTimelineOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto cyber-card border-neon-cyan">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold glow-text-cyan">{mission.title}</DialogTitle>
          </DialogHeader>
          <MissionTimeline missionId={mission.id} onUpdate={onUpdate} />
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="cyber-card border-neon-cyan">
          <DialogHeader>
            <DialogTitle className={`text-xl font-bold ${confirmAction === "complete" ? "text-neon-green" : "text-neon-red"}`}>
              {confirmAction === "complete" ? (
                <span className="flex items-center gap-2">
                  <Trophy className="w-6 h-6" />
                  Confirmar Vitória
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Skull className="w-6 h-6" />
                  Confirmar Derrota
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-4">
              {confirmAction === "complete" ? (
                <>
                  <p className="mb-2">Ao concluir esta missão:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>O status será alterado para "Concluída"</li>
                    <li><span className="text-neon-yellow font-bold">{mission.xp_reward} XP</span> serão distribuídos entre os {mission.mission_participants?.length || 0} participantes</li>
                    <li>Cada participante receberá aproximadamente <span className="text-neon-yellow font-bold">{Math.floor(mission.xp_reward / (mission.mission_participants?.length || 1))} XP</span></li>
                  </ul>
                </>
              ) : (
                <>
                  <p className="mb-2">Ao falhar esta missão:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>O status será alterado para "Falhada"</li>
                    <li>Nenhum XP será distribuído</li>
                    <li>Esta ação não pode ser desfeita</li>
                  </ul>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isProcessing}
              className="border-muted-foreground"
            >
              Cancelar
            </Button>
            <Button
              onClick={processAction}
              disabled={isProcessing}
              className={confirmAction === "complete" 
                ? "bg-neon-green text-background hover:bg-neon-green/80" 
                : "bg-neon-red text-background hover:bg-neon-red/80"
              }
            >
              {isProcessing ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}