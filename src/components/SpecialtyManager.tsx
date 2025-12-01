import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Award, Loader2 } from "lucide-react";

interface Specialty {
  id: string;
  name: string;
  attribute: string;
  bonus: number;
  description: string | null;
}

interface SpecialtyManagerProps {
  characterId: string;
  specialties: Specialty[];
  onUpdate: () => void;
}

const attributeOptions = [
  { value: "coordination", label: "Coordenação" },
  { value: "vigor", label: "Vigor" },
  { value: "intellect", label: "Intelecto" },
  { value: "attention", label: "Atenção" },
  { value: "willpower", label: "Vontade" },
  { value: "prowess", label: "Proeza" },
];

const bonusColors: Record<number, string> = {
  1: "bg-neon-cyan/20 text-neon-cyan border-neon-cyan",
  2: "bg-neon-lime/20 text-neon-lime border-neon-lime",
  3: "bg-neon-magenta/20 text-neon-magenta border-neon-magenta",
};

export function SpecialtyManager({ characterId, specialties, onUpdate }: SpecialtyManagerProps) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState({
    name: "",
    attribute: "coordination",
    bonus: 1,
    description: "",
  });

  const handleAddSpecialty = async () => {
    if (!newSpecialty.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para a especialidade",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("character_specialties")
        .insert({
          character_id: characterId,
          name: newSpecialty.name.trim(),
          attribute: newSpecialty.attribute,
          bonus: newSpecialty.bonus,
          description: newSpecialty.description.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Especialidade adicionada!",
        description: `${newSpecialty.name} foi adicionada ao personagem.`,
      });

      setNewSpecialty({
        name: "",
        attribute: "coordination",
        bonus: 1,
        description: "",
      });
      setIsModalOpen(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar especialidade",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveSpecialty = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from("character_specialties")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Especialidade removida",
        description: `${name} foi removida do personagem.`,
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Erro ao remover especialidade",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getAttributeLabel = (value: string) => {
    return attributeOptions.find(opt => opt.value === value)?.label || value;
  };

  return (
    <Card className="cyber-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-neon-lime flex items-center gap-2">
          <Award className="w-6 h-6" />
          Especialidades
        </h2>
        <Button
          onClick={() => setIsModalOpen(true)}
          size="sm"
          className="bg-neon-lime text-background hover:bg-neon-lime/90"
        >
          <Plus className="w-4 h-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {specialties.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">
          Nenhuma especialidade cadastrada
        </p>
      ) : (
        <div className="space-y-3">
          {specialties.map((specialty) => (
            <div
              key={specialty.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-muted"
            >
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={bonusColors[specialty.bonus]}>
                  +{specialty.bonus}
                </Badge>
                <div>
                  <p className="font-medium text-foreground">{specialty.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getAttributeLabel(specialty.attribute)}
                    {specialty.description && ` • ${specialty.description}`}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveSpecialty(specialty.id, specialty.name)}
                className="text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Specialty Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-background border-neon-lime">
          <DialogHeader>
            <DialogTitle className="text-neon-lime flex items-center gap-2">
              <Award className="w-5 h-5" />
              Nova Especialidade
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-primary">Nome *</Label>
              <Input
                value={newSpecialty.name}
                onChange={(e) => setNewSpecialty({ ...newSpecialty, name: e.target.value })}
                placeholder="Ex: Combate Corpo a Corpo, Hacking..."
                className="cyber-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-primary">Atributo Relacionado</Label>
              <Select
                value={newSpecialty.attribute}
                onValueChange={(value) => setNewSpecialty({ ...newSpecialty, attribute: value })}
              >
                <SelectTrigger className="cyber-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-primary">
                  {attributeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-primary">Bônus</Label>
              <Select
                value={newSpecialty.bonus.toString()}
                onValueChange={(value) => setNewSpecialty({ ...newSpecialty, bonus: parseInt(value) })}
              >
                <SelectTrigger className="cyber-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-primary">
                  <SelectItem value="1">+1</SelectItem>
                  <SelectItem value="2">+2</SelectItem>
                  <SelectItem value="3">+3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-primary">Descrição (opcional)</Label>
              <Input
                value={newSpecialty.description}
                onChange={(e) => setNewSpecialty({ ...newSpecialty, description: e.target.value })}
                placeholder="Breve descrição da especialidade..."
                className="cyber-input"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddSpecialty}
                disabled={isSubmitting}
                className="bg-neon-lime text-background hover:bg-neon-lime/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Adicionar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
