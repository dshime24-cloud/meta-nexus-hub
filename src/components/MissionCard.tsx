import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, PauseCircle, Target, Users, Award, MapPin, Edit, Eye } from "lucide-react";
import { MissionTimeline } from "./MissionTimeline";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MissionCardProps {
  mission: any;
  onEdit: (mission: any) => void;
  onUpdate: () => void;
}

export function MissionCard({ mission, onEdit, onUpdate }: MissionCardProps) {
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

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
        <Button
          onClick={() => setIsTimelineOpen(true)}
          variant="outline"
          className="w-full mt-4 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20"
        >
          <Eye className="mr-2 w-4 h-4" />
          Ver Timeline
        </Button>
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
    </>
  );
}