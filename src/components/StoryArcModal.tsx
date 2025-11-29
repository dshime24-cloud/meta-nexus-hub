import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const storyArcSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200),
  description: z.string().optional(),
  status: z.string().default("em_andamento"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

type FormData = z.infer<typeof storyArcSchema>;

interface StoryArcModalProps {
  isOpen: boolean;
  onClose: () => void;
  arc?: any | null;
  characters: any[];
  missions: any[];
  onSuccess: () => void;
}

export function StoryArcModal({ isOpen, onClose, arc, characters, missions, onSuccess }: StoryArcModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [selectedMissions, setSelectedMissions] = useState<string[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(storyArcSchema),
    defaultValues: { status: "em_andamento" },
  });

  useEffect(() => {
    if (arc) {
      reset({
        title: arc.title,
        description: arc.description || "",
        status: arc.status,
        start_date: arc.start_date ? arc.start_date.split("T")[0] : "",
        end_date: arc.end_date ? arc.end_date.split("T")[0] : "",
      });
      setSelectedCharacters(arc.characters?.map((c: any) => c.id) || []);
      setSelectedMissions(arc.missions?.map((m: any) => m.id) || []);
    } else {
      reset({ title: "", description: "", status: "em_andamento", start_date: "", end_date: "" });
      setSelectedCharacters([]);
      setSelectedMissions([]);
    }
  }, [arc, reset]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      let arcId = arc?.id;

      if (arcId) {
        const { error } = await supabase
          .from("story_arcs")
          .update({
            title: data.title,
            description: data.description || null,
            status: data.status,
            start_date: data.start_date || null,
            end_date: data.end_date || null,
          })
          .eq("id", arcId);
        if (error) throw error;

        // Update characters
        await supabase.from("story_arc_characters").delete().eq("story_arc_id", arcId);
        if (selectedCharacters.length > 0) {
          await supabase.from("story_arc_characters").insert(
            selectedCharacters.map((charId) => ({ story_arc_id: arcId, character_id: charId }))
          );
        }

        // Update missions
        await supabase.from("story_arc_missions").delete().eq("story_arc_id", arcId);
        if (selectedMissions.length > 0) {
          await supabase.from("story_arc_missions").insert(
            selectedMissions.map((missionId, i) => ({ story_arc_id: arcId, mission_id: missionId, sequence_order: i + 1 }))
          );
        }

        toast({ title: "Arco atualizado!" });
      } else {
        const { data: newArc, error } = await supabase
          .from("story_arcs")
          .insert({
            title: data.title,
            description: data.description || null,
            status: data.status,
            start_date: data.start_date || null,
            end_date: data.end_date || null,
          })
          .select()
          .single();
        if (error) throw error;
        arcId = newArc.id;

        // Add characters
        if (selectedCharacters.length > 0) {
          await supabase.from("story_arc_characters").insert(
            selectedCharacters.map((charId) => ({ story_arc_id: arcId, character_id: charId }))
          );
        }

        // Add missions
        if (selectedMissions.length > 0) {
          await supabase.from("story_arc_missions").insert(
            selectedMissions.map((missionId, i) => ({ story_arc_id: arcId, mission_id: missionId, sequence_order: i + 1 }))
          );
        }

        toast({ title: "Arco criado!" });
      }

      onClose();
      onSuccess();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCharacter = (id: string) => {
    setSelectedCharacters((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const toggleMission = (id: string) => {
    setSelectedMissions((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black border-2 scrollbar-hide"
        style={{ borderColor: "hsl(var(--neon-magenta))", boxShadow: "0 0 30px rgba(255, 0, 255, 0.4)" }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-neon-magenta glow-text-magenta" style={{ fontFamily: "Orbitron, sans-serif" }}>
            {arc ? "EDITAR ARCO NARRATIVO" : "NOVO ARCO NARRATIVO"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div>
            <Label className="text-neon-cyan text-sm font-bold">TÍTULO *</Label>
            <Input {...register("title")} className="mt-1 bg-black border-neon-cyan text-neon-cyan" />
            {errors.title && <p className="text-neon-red text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <Label className="text-neon-cyan text-sm font-bold">DESCRIÇÃO</Label>
            <Textarea
              {...register("description")}
              className="mt-1 bg-black border-neon-cyan text-neon-cyan min-h-[100px]"
              placeholder="Descreva o arco narrativo..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-neon-cyan text-sm font-bold">STATUS</Label>
              <select {...register("status")} className="mt-1 w-full px-3 py-2 bg-black border border-neon-cyan text-neon-cyan rounded-sm">
                <option value="planejado">Planejado</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="pausado">Pausado</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
            <div>
              <Label className="text-neon-cyan text-sm font-bold">DATA INÍCIO</Label>
              <Input type="date" {...register("start_date")} className="mt-1 bg-black border-neon-cyan text-neon-cyan" />
            </div>
          </div>

          {/* Characters Selection */}
          <div>
            <Label className="text-neon-cyan text-sm font-bold mb-2 block">PERSONAGENS ENVOLVIDOS</Label>
            <div className="max-h-40 overflow-y-auto border border-neon-cyan/30 rounded p-2 space-y-1">
              {characters.map((char) => (
                <label key={char.id} className="flex items-center gap-2 p-2 hover:bg-neon-cyan/10 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCharacters.includes(char.id)}
                    onChange={() => toggleCharacter(char.id)}
                    className="w-4 h-4 accent-neon-cyan"
                  />
                  <span className="text-foreground text-sm">{char.name}</span>
                  {char.alias && <span className="text-muted-foreground text-xs">({char.alias})</span>}
                </label>
              ))}
            </div>
          </div>

          {/* Missions Selection */}
          <div>
            <Label className="text-neon-cyan text-sm font-bold mb-2 block">MISSÕES RELACIONADAS</Label>
            <div className="max-h-40 overflow-y-auto border border-neon-cyan/30 rounded p-2 space-y-1">
              {missions.map((mission) => (
                <label key={mission.id} className="flex items-center gap-2 p-2 hover:bg-neon-cyan/10 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMissions.includes(mission.id)}
                    onChange={() => toggleMission(mission.id)}
                    className="w-4 h-4 accent-neon-cyan"
                  />
                  <span className="text-foreground text-sm">{mission.title}</span>
                  <span className="text-muted-foreground text-xs">({mission.difficulty})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-neon-magenta text-background hover:bg-neon-magenta/90 font-bold">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}