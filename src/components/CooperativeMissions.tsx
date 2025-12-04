import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users, Target, Plus, Trophy, Clock, MapPin } from "lucide-react";

interface Team {
  id: string;
  name: string;
}

interface Mission {
  id: string;
  title: string;
  description: string | null;
  status: string;
  difficulty: string;
  xp_reward: number;
  location: string | null;
  team_id: string | null;
  teams?: Team | null;
}

interface CooperativeMissionsProps {
  teamId: string;
  teamName: string;
}

export function CooperativeMissions({ teamId, teamName }: CooperativeMissionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newMission, setNewMission] = useState({
    title: "",
    description: "",
    difficulty: "normal",
    xp_reward: 100,
    location: "",
  });

  const { data: teamMissions = [] } = useQuery({
    queryKey: ["team-missions", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missions")
        .select("*, teams(id, name)")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Mission[];
    },
  });

  const { data: availableMissions = [] } = useQuery({
    queryKey: ["available-missions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missions")
        .select("*")
        .is("team_id", null)
        .eq("status", "ativa");
      if (error) throw error;
      return data as Mission[];
    },
  });

  const createMissionMutation = useMutation({
    mutationFn: async (mission: typeof newMission) => {
      const { error } = await supabase.from("missions").insert({
        ...mission,
        team_id: teamId,
        status: "ativa",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-missions"] });
      setIsCreateOpen(false);
      setNewMission({ title: "", description: "", difficulty: "normal", xp_reward: 100, location: "" });
      toast({ title: "Missão criada!", description: "Missão cooperativa criada para a equipe." });
    },
  });

  const assignMissionMutation = useMutation({
    mutationFn: async (missionId: string) => {
      const { error } = await supabase
        .from("missions")
        .update({ team_id: teamId })
        .eq("id", missionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-missions"] });
      queryClient.invalidateQueries({ queryKey: ["available-missions"] });
      toast({ title: "Missão atribuída!", description: `Missão atribuída à equipe ${teamName}.` });
    },
  });

  const completeMissionMutation = useMutation({
    mutationFn: async (missionId: string) => {
      const mission = teamMissions.find((m) => m.id === missionId);
      if (!mission) return;

      // Update mission status
      const { error: missionError } = await supabase
        .from("missions")
        .update({ status: "concluída", end_date: new Date().toISOString() })
        .eq("id", missionId);
      if (missionError) throw missionError;

      // Get team members
      const { data: members } = await supabase
        .from("team_members")
        .select("character_id, character:characters(id, xp, level)")
        .eq("team_id", teamId);

      if (members) {
        // Distribute XP to all team members
        const xpPerMember = Math.floor(mission.xp_reward / members.length);
        for (const member of members) {
          const char = member.character as any;
          if (char) {
            await supabase
              .from("characters")
              .update({ xp: (char.xp || 0) + xpPerMember })
              .eq("id", char.id);
          }
        }
      }

      return { mission, memberCount: members?.length || 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team-missions"] });
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      if (data) {
        toast({
          title: "Missão concluída!",
          description: `${data.mission.xp_reward} XP distribuídos entre ${data.memberCount} membros.`,
        });
      }
    },
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "fácil": return "bg-neon-lime/20 text-neon-lime border-neon-lime";
      case "normal": return "bg-primary/20 text-primary border-primary";
      case "difícil": return "bg-neon-orange/20 text-neon-orange border-neon-orange";
      case "extremo": return "bg-neon-magenta/20 text-neon-magenta border-neon-magenta";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativa": return "bg-neon-cyan/20 text-neon-cyan border-neon-cyan";
      case "concluída": return "bg-neon-lime/20 text-neon-lime border-neon-lime";
      case "falhada": return "bg-destructive/20 text-destructive border-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-primary flex items-center gap-2">
            <Target className="w-5 h-5" /> Missões Cooperativas
          </span>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="btn-gradient">
                <Plus className="w-4 h-4 mr-1" /> Nova Missão
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-primary">
              <DialogHeader>
                <DialogTitle className="text-primary">Nova Missão para {teamName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-primary">Título</Label>
                  <Input
                    value={newMission.title}
                    onChange={(e) => setNewMission({ ...newMission, title: e.target.value })}
                    className="cyber-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-primary">Descrição</Label>
                  <Textarea
                    value={newMission.description}
                    onChange={(e) => setNewMission({ ...newMission, description: e.target.value })}
                    className="cyber-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-primary">Dificuldade</Label>
                    <Select
                      value={newMission.difficulty}
                      onValueChange={(v) => setNewMission({ ...newMission, difficulty: v })}
                    >
                      <SelectTrigger className="cyber-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fácil">Fácil</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="difícil">Difícil</SelectItem>
                        <SelectItem value="extremo">Extremo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-primary">Recompensa XP</Label>
                    <Input
                      type="number"
                      value={newMission.xp_reward}
                      onChange={(e) => setNewMission({ ...newMission, xp_reward: parseInt(e.target.value) })}
                      className="cyber-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-primary">Localização</Label>
                  <Input
                    value={newMission.location}
                    onChange={(e) => setNewMission({ ...newMission, location: e.target.value })}
                    className="cyber-input"
                  />
                </div>
                <Button
                  className="w-full btn-gradient-orange"
                  onClick={() => createMissionMutation.mutate(newMission)}
                  disabled={!newMission.title}
                >
                  Criar Missão Cooperativa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Team Missions */}
        {teamMissions.length > 0 ? (
          <div className="space-y-3">
            {teamMissions.map((mission) => (
              <div
                key={mission.id}
                className="p-4 bg-muted/30 border border-primary/30 rounded-lg hover:border-primary/60 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-foreground">{mission.title}</h4>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={getDifficultyColor(mission.difficulty)}>
                      {mission.difficulty}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(mission.status)}>
                      {mission.status}
                    </Badge>
                  </div>
                </div>
                {mission.description && (
                  <p className="text-sm text-muted-foreground mb-2">{mission.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-neon-orange" /> {mission.xp_reward} XP
                    </span>
                    {mission.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {mission.location}
                      </span>
                    )}
                  </div>
                  {mission.status === "ativa" && (
                    <Button
                      size="sm"
                      onClick={() => completeMissionMutation.mutate(mission.id)}
                      className="bg-neon-lime/20 text-neon-lime border border-neon-lime hover:bg-neon-lime/30"
                    >
                      Concluir Missão
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            Nenhuma missão atribuída a esta equipe
          </p>
        )}

        {/* Assign Existing Mission */}
        {availableMissions.length > 0 && (
          <div className="pt-4 border-t border-primary/30">
            <h5 className="text-sm font-medium text-neon-orange mb-2">Atribuir Missão Existente</h5>
            <Select onValueChange={(id) => assignMissionMutation.mutate(id)}>
              <SelectTrigger className="cyber-input">
                <SelectValue placeholder="Selecionar missão disponível..." />
              </SelectTrigger>
              <SelectContent>
                {availableMissions.map((mission) => (
                  <SelectItem key={mission.id} value={mission.id}>
                    {mission.title} ({mission.xp_reward} XP)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
