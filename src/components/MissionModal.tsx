import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const missionSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200),
  description: z.string().optional(),
  difficulty: z.enum(["Fácil", "Média", "Difícil", "Extrema", "Lendária"]),
  status: z.enum(["ativa", "concluída", "falhada", "pausada"]),
  xpReward: z.number().min(0),
  location: z.string().optional(),
  threatLevel: z.number().min(0).max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type MissionFormData = z.infer<typeof missionSchema>;

interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission?: any;
  onSuccess: () => void;
}

export function MissionModal({ isOpen, onClose, mission, onSuccess }: MissionModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<MissionFormData>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      difficulty: "Média",
      status: "ativa",
      xpReward: 100,
    },
  });

  const difficultyValue = watch("difficulty");
  const statusValue = watch("status");

  useEffect(() => {
    if (isOpen) {
      fetchCharacters();
      if (mission) {
        loadMissionData();
      } else {
        reset({
          difficulty: "Média",
          status: "ativa",
          xpReward: 100,
        });
        setSelectedCharacters([]);
      }
    }
  }, [isOpen, mission]);

  const fetchCharacters = async () => {
    const { data } = await supabase
      .from("characters")
      .select("id, name, alias, image_url")
      .order("name");
    setCharacters(data || []);
  };

  const loadMissionData = async () => {
    if (!mission) return;

    setValue("title", mission.title);
    setValue("description", mission.description || "");
    setValue("difficulty", mission.difficulty);
    setValue("status", mission.status);
    setValue("xpReward", mission.xp_reward);
    setValue("location", mission.location || "");
    setValue("threatLevel", mission.threat_level || undefined);
    setValue("startDate", mission.start_date ? mission.start_date.split('T')[0] : "");
    setValue("endDate", mission.end_date ? mission.end_date.split('T')[0] : "");

    // Load participants
    const { data: participants } = await supabase
      .from("mission_participants")
      .select("character_id")
      .eq("mission_id", mission.id);

    setSelectedCharacters(participants?.map(p => p.character_id) || []);
  };

  const toggleCharacter = (characterId: string) => {
    setSelectedCharacters(prev =>
      prev.includes(characterId)
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    );
  };

  const onSubmit = async (data: MissionFormData) => {
    setIsSubmitting(true);

    try {
      if (mission) {
        // Update existing mission
        const { error: missionError } = await supabase
          .from("missions")
          .update({
            title: data.title,
            description: data.description || null,
            difficulty: data.difficulty,
            status: data.status,
            xp_reward: data.xpReward,
            location: data.location || null,
            threat_level: data.threatLevel || null,
            start_date: data.startDate || null,
            end_date: data.endDate || null,
          })
          .eq("id", mission.id);

        if (missionError) throw missionError;

        // Update participants
        await supabase
          .from("mission_participants")
          .delete()
          .eq("mission_id", mission.id);

        if (selectedCharacters.length > 0) {
          const { error: participantsError } = await supabase
            .from("mission_participants")
            .insert(
              selectedCharacters.map(charId => ({
                mission_id: mission.id,
                character_id: charId,
              }))
            );

          if (participantsError) throw participantsError;
        }

        toast({
          title: "Missão atualizada!",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        // Create new mission
        const { data: newMission, error: missionError } = await supabase
          .from("missions")
          .insert({
            title: data.title,
            description: data.description || null,
            difficulty: data.difficulty,
            status: data.status,
            xp_reward: data.xpReward,
            location: data.location || null,
            threat_level: data.threatLevel || null,
            start_date: data.startDate || null,
            end_date: data.endDate || null,
          })
          .select()
          .single();

        if (missionError) throw missionError;

        // Add timeline event
        await supabase
          .from("mission_timeline")
          .insert({
            mission_id: newMission.id,
            event_type: "criação",
            description: `Missão "${data.title}" foi criada`,
          });

        // Add participants
        if (selectedCharacters.length > 0) {
          await supabase
            .from("mission_participants")
            .insert(
              selectedCharacters.map(charId => ({
                mission_id: newMission.id,
                character_id: charId,
              }))
            );
        }

        toast({
          title: "Missão criada!",
          description: "A missão foi adicionada ao sistema.",
        });
      }

      reset();
      setSelectedCharacters([]);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: mission ? "Erro ao atualizar missão" : "Erro ao criar missão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCharacters = characters.filter(char =>
    char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    char.alias?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto cyber-card border-neon-cyan">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold glow-text-cyan">
            {mission ? "Editar Missão" : "Nova Missão"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title" className="text-neon-cyan">Título *</Label>
              <Input {...register("title")} className="cyber-input" />
              {errors.title && <p className="text-xs text-neon-red">{errors.title.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="text-neon-cyan">Descrição</Label>
              <Textarea {...register("description")} rows={3} className="cyber-input" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-neon-cyan">Dificuldade *</Label>
              <Select onValueChange={(value) => setValue("difficulty", value as any)} value={difficultyValue}>
                <SelectTrigger className="cyber-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-neon-cyan">
                  <SelectItem value="Fácil">Fácil</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Difícil">Difícil</SelectItem>
                  <SelectItem value="Extrema">Extrema</SelectItem>
                  <SelectItem value="Lendária">Lendária</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-neon-cyan">Status *</Label>
              <Select onValueChange={(value) => setValue("status", value as any)} value={statusValue}>
                <SelectTrigger className="cyber-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-neon-cyan">
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="concluída">Concluída</SelectItem>
                  <SelectItem value="falhada">Falhada</SelectItem>
                  <SelectItem value="pausada">Pausada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="xpReward" className="text-neon-cyan">Recompensa XP *</Label>
              <Input type="number" {...register("xpReward", { valueAsNumber: true })} className="cyber-input" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="threatLevel" className="text-neon-cyan">Nível de Ameaça</Label>
              <Input type="number" min="0" max="100" {...register("threatLevel", { valueAsNumber: true })} className="cyber-input" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-neon-cyan">Localização</Label>
              <Input {...register("location")} className="cyber-input" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-neon-cyan">Data de Início</Label>
              <Input type="date" {...register("startDate")} className="cyber-input" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-neon-cyan">Data de Término</Label>
              <Input type="date" {...register("endDate")} className="cyber-input" />
            </div>
          </div>

          {/* Character Selection */}
          <div className="space-y-4">
            <Label className="text-neon-cyan">Participantes</Label>
            <Input
              placeholder="Buscar personagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="cyber-input"
            />
            
            <div className="max-h-48 overflow-y-auto space-y-2 cyber-card p-4 bg-muted/20">
              {filteredCharacters.map(char => (
                <div
                  key={char.id}
                  onClick={() => toggleCharacter(char.id)}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${
                    selectedCharacters.includes(char.id)
                      ? "bg-neon-cyan/20 border border-neon-cyan"
                      : "bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center text-xs font-bold">
                    {char.image_url ? (
                      <img src={char.image_url} alt={char.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      char.name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{char.name}</p>
                    {char.alias && <p className="text-xs text-muted-foreground">{char.alias}</p>}
                  </div>
                  {selectedCharacters.includes(char.id) && (
                    <Badge className="bg-neon-cyan text-background">Selecionado</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-neon-cyan hover:bg-neon-cyan/20"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-neon-cyan text-background hover:bg-neon-cyan/90 font-bold glow-cyan"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : mission ? (
                "Salvar Alterações"
              ) : (
                "Criar Missão"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}