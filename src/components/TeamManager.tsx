import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, X, Shield, Sword, Heart, Zap, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CooperativeMissions } from "@/components/CooperativeMissions";

interface Team {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  formation: string | null;
}

interface TeamMember {
  id: string;
  team_id: string;
  character_id: string;
  role: string | null;
  position: number | null;
  character?: {
    id: string;
    name: string;
    alias: string | null;
    image_url: string | null;
    classification: string;
  };
}

interface Character {
  id: string;
  name: string;
  alias: string | null;
  image_url: string | null;
  classification: string;
}

const FORMATIONS = [
  { value: "standard", label: "Padrão", icon: Users },
  { value: "offensive", label: "Ofensiva", icon: Sword },
  { value: "defensive", label: "Defensiva", icon: Shield },
  { value: "support", label: "Suporte", icon: Heart },
  { value: "balanced", label: "Balanceada", icon: Zap },
];

const ROLES = [
  { value: "leader", label: "Líder" },
  { value: "tank", label: "Tanque" },
  { value: "dps", label: "DPS" },
  { value: "support", label: "Suporte" },
  { value: "specialist", label: "Especialista" },
];

export function TeamManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState({ name: "", description: "", formation: "standard" });
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");
  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Team[];
    },
  });

  const { data: characters = [] } = useQuery({
    queryKey: ["characters-for-teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("characters")
        .select("id, name, alias, image_url, classification")
        .eq("type", "herói");
      if (error) throw error;
      return data as Character[];
    },
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members", selectedTeam?.id],
    queryFn: async () => {
      if (!selectedTeam) return [];
      const { data, error } = await supabase
        .from("team_members")
        .select("*, character:characters(id, name, alias, image_url, classification)")
        .eq("team_id", selectedTeam.id);
      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!selectedTeam,
  });

  const createTeamMutation = useMutation({
    mutationFn: async (team: typeof newTeam) => {
      const { data, error } = await supabase.from("teams").insert(team).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setIsCreateOpen(false);
      setNewTeam({ name: "", description: "", formation: "standard" });
      toast({ title: "Equipe criada!", description: "A equipe foi criada com sucesso." });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ teamId, characterId, role }: { teamId: string; characterId: string; role: string }) => {
      const { error } = await supabase.from("team_members").insert({ team_id: teamId, character_id: characterId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setSelectedCharacter("");
      setSelectedRole("member");
      toast({ title: "Membro adicionado!", description: "O personagem foi adicionado à equipe." });
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const { error } = await supabase.from("team_members").update({ role }).eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({ title: "Função atualizada!" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({ title: "Membro removido", description: "O personagem foi removido da equipe." });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", teamId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setSelectedTeam(null);
      toast({ title: "Equipe excluída", description: "A equipe foi excluída com sucesso." });
    },
  });

  const availableCharacters = characters.filter(
    (char) => !teamMembers.some((member) => member.character_id === char.id)
  );

  const handleAddMember = () => {
    if (selectedTeam && selectedCharacter) {
      addMemberMutation.mutate({
        teamId: selectedTeam.id,
        characterId: selectedCharacter,
        role: selectedRole,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Nova Equipe
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary">
            <DialogHeader>
              <DialogTitle className="text-primary font-space">Criar Nova Equipe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Nome da Equipe"
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                className="bg-muted border-primary/50"
              />
              <Textarea
                placeholder="Descrição"
                value={newTeam.description}
                onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                className="bg-muted border-primary/50"
              />
              <Select value={newTeam.formation} onValueChange={(v) => setNewTeam({ ...newTeam, formation: v })}>
                <SelectTrigger className="bg-muted border-primary/50">
                  <SelectValue placeholder="Formação" />
                </SelectTrigger>
                <SelectContent>
                  {FORMATIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <div className="flex items-center gap-2">
                        <f.icon className="w-4 h-4" />
                        {f.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => createTeamMutation.mutate(newTeam)}
                className="w-full btn-gradient-orange text-primary-foreground"
                disabled={!newTeam.name}
              >
                Criar Equipe
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => {
          const formation = FORMATIONS.find((f) => f.value === team.formation) || FORMATIONS[0];
          return (
            <Card
              key={team.id}
              className={`cyber-card-interactive cursor-pointer ${selectedTeam?.id === team.id ? "glow-border-cyan" : ""}`}
              onClick={() => setSelectedTeam(team)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-primary font-space">{team.name}</span>
                  <Badge variant="outline" className="border-neon-magenta text-neon-magenta">
                    <formation.icon className="w-3 h-3 mr-1" />
                    {formation.label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{team.description || "Sem descrição"}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedTeam && (
        <div className="space-y-6 animate-scale-in">
          <Card className="cyber-card-magenta">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-neon-magenta font-space">{selectedTeam.name} - Membros</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTeamMutation.mutate(selectedTeam.id)}
                  className="text-destructive hover:text-destructive/80"
                >
                  Excluir Equipe
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="relative group p-3 rounded-lg bg-muted/50 border border-primary/30">
                    <button
                      onClick={() => removeMemberMutation.mutate(member.id)}
                      className="absolute -top-2 -right-2 p-1 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {member.character?.image_url && (
                      <img
                        src={member.character.image_url}
                        alt={member.character.name}
                        className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border-2 border-primary"
                      />
                    )}
                    <p className="text-sm text-center font-medium text-primary">
                      {member.character?.alias || member.character?.name}
                    </p>
                    <Select
                      value={member.role || "member"}
                      onValueChange={(role) => updateMemberRoleMutation.mutate({ memberId: member.id, role })}
                    >
                      <SelectTrigger className="h-7 mt-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {availableCharacters.length > 0 && (
                <div className="pt-4 border-t border-primary/30">
                  <h4 className="text-sm font-medium text-neon-orange mb-3 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Adicionar Membro
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
                      <SelectTrigger className="bg-muted border-neon-orange/50 w-[200px]">
                        <SelectValue placeholder="Selecionar personagem" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCharacters.map((char) => (
                          <SelectItem key={char.id} value={char.id}>
                            {char.alias || char.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="bg-muted border-primary/50 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleAddMember}
                      disabled={!selectedCharacter}
                      className="btn-gradient-orange"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <CooperativeMissions teamId={selectedTeam.id} teamName={selectedTeam.name} />
        </div>
      )}
    </div>
  );
}