import { useEffect } from "react";
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
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

const relationshipSchema = z.object({
  character_id: z.string().min(1, "Personagem é obrigatório"),
  related_character_id: z.string().optional(),
  relationship_type: z.string().min(1, "Tipo é obrigatório"),
  description: z.string().optional(),
  bonus: z.string().optional(),
});

type FormData = z.infer<typeof relationshipSchema>;

interface RelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: any[];
  relationship?: any | null;
  onSuccess: () => void;
  onDelete?: (id: string) => void;
}

const relationshipTypes = [
  { value: "aliado", label: "Aliado" },
  { value: "rival", label: "Rival" },
  { value: "mentor", label: "Mentor" },
  { value: "inimigo", label: "Inimigo" },
  { value: "amigo", label: "Amigo" },
  { value: "familia", label: "Família" },
];

export function RelationshipModal({
  isOpen,
  onClose,
  characters,
  relationship,
  onSuccess,
  onDelete,
}: RelationshipModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(relationshipSchema),
    defaultValues: {
      relationship_type: "aliado",
    },
  });

  useEffect(() => {
    if (relationship) {
      reset({
        character_id: relationship.character_id,
        related_character_id: relationship.related_character_id || "",
        relationship_type: relationship.relationship_type,
        description: relationship.description || "",
        bonus: relationship.bonus || "",
      });
    } else {
      reset({
        character_id: "",
        related_character_id: "",
        relationship_type: "aliado",
        description: "",
        bonus: "",
      });
    }
  }, [relationship, reset]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        character_id: data.character_id,
        related_character_id: data.related_character_id || null,
        relationship_type: data.relationship_type,
        description: data.description || null,
        bonus: data.bonus || null,
      };

      if (relationship?.id) {
        const { error } = await supabase
          .from("relationships")
          .update(payload)
          .eq("id", relationship.id);
        if (error) throw error;
        toast({ title: "Relacionamento atualizado!" });
      } else {
        const { error } = await supabase.from("relationships").insert(payload);
        if (error) throw error;
        toast({ title: "Relacionamento criado!" });
      }

      onClose();
      onSuccess();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-lg bg-black border-2"
        style={{
          borderColor: "hsl(var(--neon-cyan))",
          boxShadow: "0 0 30px rgba(0, 255, 255, 0.4)",
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-xl font-bold text-neon-cyan glow-text-cyan"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            {relationship ? "EDITAR RELACIONAMENTO" : "NOVO RELACIONAMENTO"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div>
            <Label className="text-neon-cyan text-sm font-bold">PERSONAGEM PRINCIPAL *</Label>
            <select
              {...register("character_id")}
              className="mt-1 w-full px-3 py-2 bg-black border border-neon-cyan text-neon-cyan rounded-sm"
            >
              <option value="">Selecione...</option>
              {characters.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name} {char.alias ? `(${char.alias})` : ""}
                </option>
              ))}
            </select>
            {errors.character_id && (
              <p className="text-neon-red text-xs mt-1">{errors.character_id.message}</p>
            )}
          </div>

          <div>
            <Label className="text-neon-cyan text-sm font-bold">TIPO DE RELACIONAMENTO *</Label>
            <select
              {...register("relationship_type")}
              className="mt-1 w-full px-3 py-2 bg-black border border-neon-cyan text-neon-cyan rounded-sm"
            >
              {relationshipTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-neon-cyan text-sm font-bold">PERSONAGEM RELACIONADO</Label>
            <select
              {...register("related_character_id")}
              className="mt-1 w-full px-3 py-2 bg-black border border-neon-cyan text-neon-cyan rounded-sm"
            >
              <option value="">Personagem externo...</option>
              {characters.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name} {char.alias ? `(${char.alias})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-neon-cyan text-sm font-bold">DESCRIÇÃO</Label>
            <Textarea
              {...register("description")}
              className="mt-1 bg-black border-neon-cyan text-neon-cyan min-h-[80px]"
              placeholder="Descreva a natureza deste relacionamento..."
            />
          </div>

          <div>
            <Label className="text-neon-cyan text-sm font-bold">BÔNUS</Label>
            <Input
              {...register("bonus")}
              className="mt-1 bg-black border-neon-cyan text-neon-cyan"
              placeholder="Ex: +2 Proeza em missões conjuntas"
            />
          </div>

          <div className="flex gap-3 pt-4">
            {relationship && onDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onDelete(relationship.id);
                  onClose();
                }}
                className="border-neon-red text-neon-red hover:bg-neon-red/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-neon-cyan text-background hover:bg-neon-cyan/90 font-bold"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}