import { useState, useEffect } from "react";
import { Plus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Power {
  id: string;
  power_id?: string;
  custom_name?: string;
  level: number;
  description?: string;
  extras?: string;
  limitations?: string;
  powers_library?: {
    id: string;
    name: string;
    category: string;
    description?: string;
  };
}

interface PowerSelectorProps {
  characterId: string;
  existingPowers: Power[];
  onUpdate: () => void;
}

export function PowerSelector({ characterId, existingPowers, onUpdate }: PowerSelectorProps) {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [libraryPowers, setLibraryPowers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPowerId, setSelectedPowerId] = useState("");
  const [customName, setCustomName] = useState("");
  const [level, setLevel] = useState(1);
  const [description, setDescription] = useState("");
  const [extras, setExtras] = useState("");
  const [limitations, setLimitations] = useState("");

  useEffect(() => {
    if (isAddModalOpen) {
      fetchLibraryPowers();
    }
  }, [isAddModalOpen]);

  const fetchLibraryPowers = async () => {
    const { data } = await supabase
      .from("powers_library")
      .select("*")
      .order("name");
    setLibraryPowers(data || []);
  };

  const handleAddPower = async () => {
    if (!selectedPowerId) {
      toast({
        title: "Selecione um poder",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("character_powers")
        .insert({
          character_id: characterId,
          power_id: selectedPowerId,
          custom_name: customName || null,
          level: level,
          description: description || null,
          extras: extras || null,
          limitations: limitations || null,
        });

      if (error) throw error;

      toast({
        title: "Poder adicionado!",
        description: "O poder foi adicionado ao personagem.",
      });

      resetForm();
      setIsAddModalOpen(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar poder",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemovePower = async (powerId: string) => {
    try {
      const { error } = await supabase
        .from("character_powers")
        .delete()
        .eq("id", powerId);

      if (error) throw error;

      toast({
        title: "Poder removido",
        description: "O poder foi removido do personagem.",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Erro ao remover poder",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedPowerId("");
    setCustomName("");
    setLevel(1);
    setDescription("");
    setExtras("");
    setLimitations("");
    setSearchTerm("");
  };

  const filteredLibraryPowers = libraryPowers.filter(power =>
    power.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPower = libraryPowers.find(p => p.id === selectedPowerId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-neon-cyan">Poderes</h3>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-neon-cyan text-background hover:bg-neon-cyan/90 font-bold">
              <Plus className="mr-2 w-4 h-4" />
              Adicionar Poder
            </Button>
          </DialogTrigger>
          <DialogContent className="cyber-card border-neon-cyan max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold glow-text-cyan">Adicionar Poder</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {/* Search Library */}
              <div className="space-y-2">
                <Label className="text-neon-cyan">Buscar na Biblioteca</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neon-cyan w-4 h-4" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar poder..."
                    className="pl-10 cyber-input"
                  />
                </div>
              </div>

              {/* Select Power */}
              <div className="space-y-2">
                <Label className="text-neon-cyan">Poder da Biblioteca *</Label>
                <Select value={selectedPowerId} onValueChange={setSelectedPowerId}>
                  <SelectTrigger className="cyber-input">
                    <SelectValue placeholder="Selecione um poder" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-neon-cyan max-h-64">
                    {filteredLibraryPowers.map(power => (
                      <SelectItem key={power.id} value={power.id}>
                        {power.name} - {power.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPower && (
                  <p className="text-xs text-muted-foreground">{selectedPower.description}</p>
                )}
              </div>

              {/* Custom Name */}
              <div className="space-y-2">
                <Label className="text-neon-cyan">Nome Personalizado (opcional)</Label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ex: Super Força Aprimorada"
                  className="cyber-input"
                />
              </div>

              {/* Level */}
              <div className="space-y-2">
                <Label className="text-neon-cyan">Nível (1-10)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value))}
                  className="cyber-input"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-neon-cyan">Descrição Personalizada</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Como este poder funciona para este personagem..."
                  className="cyber-input"
                />
              </div>

              {/* Extras */}
              <div className="space-y-2">
                <Label className="text-neon-cyan">Extras</Label>
                <Textarea
                  value={extras}
                  onChange={(e) => setExtras(e.target.value)}
                  rows={2}
                  placeholder="Habilidades ou efeitos adicionais..."
                  className="cyber-input"
                />
              </div>

              {/* Limitations */}
              <div className="space-y-2">
                <Label className="text-neon-cyan">Limitações</Label>
                <Textarea
                  value={limitations}
                  onChange={(e) => setLimitations(e.target.value)}
                  rows={2}
                  placeholder="Restrições ou custos do poder..."
                  className="cyber-input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    resetForm();
                    setIsAddModalOpen(false);
                  }}
                  className="text-neon-cyan hover:bg-neon-cyan/20"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddPower}
                  className="bg-neon-cyan text-background hover:bg-neon-cyan/90 font-bold"
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Powers List */}
      <div className="space-y-3">
        {existingPowers.map((power) => (
          <div key={power.id} className="p-4 bg-muted/50 rounded border border-neon-cyan/30 hover:border-neon-cyan/60 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-foreground">
                    {power.custom_name || power.powers_library?.name}
                  </h4>
                  <Badge className="bg-neon-magenta/20 text-neon-magenta border-neon-magenta">
                    Nível {power.level}
                  </Badge>
                </div>
                {power.description && (
                  <p className="text-sm text-muted-foreground">{power.description}</p>
                )}
                {power.extras && (
                  <p className="text-xs text-neon-green mt-2">
                    <strong>Extras:</strong> {power.extras}
                  </p>
                )}
                {power.limitations && (
                  <p className="text-xs text-neon-red mt-1">
                    <strong>Limitações:</strong> {power.limitations}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemovePower(power.id)}
                className="text-neon-red hover:bg-neon-red/20 ml-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {existingPowers.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum poder cadastrado</p>
        )}
      </div>
    </div>
  );
}
