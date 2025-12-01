import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Plus, X, Search } from "lucide-react";

interface LibraryPower {
  id: string;
  name: string;
  description: string | null;
  category: string;
  base_level: number;
}

interface SelectedPower {
  power_id: string;
  custom_name: string;
  level: number;
  description: string;
  extras: string;
  limitations: string;
}

interface PowerSelectorSimpleProps {
  selectedPowers: SelectedPower[];
  onPowersChange: (powers: SelectedPower[]) => void;
}

export function PowerSelectorSimple({ selectedPowers, onPowersChange }: PowerSelectorSimpleProps) {
  const [libraryPowers, setLibraryPowers] = useState<LibraryPower[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPowerId, setSelectedPowerId] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [level, setLevel] = useState(1);
  const [description, setDescription] = useState("");
  const [extras, setExtras] = useState("");
  const [limitations, setLimitations] = useState("");

  useEffect(() => {
    fetchLibraryPowers();
  }, []);

  const fetchLibraryPowers = async () => {
    const { data } = await supabase
      .from("powers_library")
      .select("*")
      .order("name");
    if (data) setLibraryPowers(data);
  };

  const filteredPowers = libraryPowers.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLibraryPower = libraryPowers.find((p) => p.id === selectedPowerId);

  const handleAddPower = () => {
    if (!selectedPowerId) return;

    const newPower: SelectedPower = {
      power_id: selectedPowerId,
      custom_name: customName || selectedLibraryPower?.name || "",
      level: level,
      description: description || selectedLibraryPower?.description || "",
      extras: extras,
      limitations: limitations,
    };

    onPowersChange([...selectedPowers, newPower]);
    resetForm();
  };

  const handleRemovePower = (index: number) => {
    const updated = selectedPowers.filter((_, i) => i !== index);
    onPowersChange(updated);
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

  const getPowerName = (power: SelectedPower) => {
    if (power.custom_name) return power.custom_name;
    const lib = libraryPowers.find((p) => p.id === power.power_id);
    return lib?.name || "Poder";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-neon-magenta" />
        <Label className="text-neon-magenta font-bold text-lg">Poderes Iniciais</Label>
      </div>

      {/* Selected Powers */}
      {selectedPowers.length > 0 && (
        <div className="space-y-2 mb-4">
          {selectedPowers.map((power, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-neon-magenta/10 border border-neon-magenta/30 rounded"
            >
              <div>
                <span className="font-medium text-foreground">{getPowerName(power)}</span>
                <Badge variant="outline" className="ml-2 text-neon-magenta border-neon-magenta">
                  Nível {power.level}
                </Badge>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemovePower(index)}
                className="text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Power Form */}
      <div className="p-4 border border-neon-magenta/30 rounded-lg space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar poder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-primary/30"
          />
        </div>

        <Select value={selectedPowerId} onValueChange={setSelectedPowerId}>
          <SelectTrigger className="bg-background border-primary/30">
            <SelectValue placeholder="Selecione um poder" />
          </SelectTrigger>
          <SelectContent className="bg-background border-primary max-h-60">
            {filteredPowers.map((power) => (
              <SelectItem key={power.id} value={power.id}>
                <div className="flex items-center gap-2">
                  <span>{power.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {power.category}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedPowerId && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Nome Customizado</Label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={selectedLibraryPower?.name}
                  className="bg-background border-primary/30"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Nível</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
                  className="bg-background border-primary/30"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={selectedLibraryPower?.description || "Descrição do poder..."}
                className="bg-background border-primary/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Extras</Label>
                <Input
                  value={extras}
                  onChange={(e) => setExtras(e.target.value)}
                  placeholder="Extras opcionais..."
                  className="bg-background border-primary/30"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Limitações</Label>
                <Input
                  value={limitations}
                  onChange={(e) => setLimitations(e.target.value)}
                  placeholder="Limitações opcionais..."
                  className="bg-background border-primary/30"
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={handleAddPower}
              className="w-full bg-neon-magenta text-background hover:bg-neon-magenta/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Poder
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
