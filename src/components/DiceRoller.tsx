import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dices, Zap, Star, Plus, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Specialty {
  id: string;
  name: string;
  attribute: string;
  bonus: number;
  power_id?: string | null;
}

interface Power {
  id: string;
  custom_name: string | null;
  level: number;
  powers_library: {
    name: string;
  } | null;
}

interface DiceRollerProps {
  isOpen: boolean;
  onClose: () => void;
  characterName: string;
  characterId: string;
  attributes: {
    coordination: number;
    vigor: number;
    intellect: number;
    attention: number;
    willpower: number;
    prowess: number;
  };
  powers: Power[];
  specialties: Specialty[];
  currentDetermination: number;
}

interface RollResult {
  type: "attribute" | "power";
  name: string;
  baseValue: number;
  diceRoll: number;
  specialtyBonus: number;
  specialtyName: string | null;
  total: number;
}

const attributeLabels: Record<string, string> = {
  coordination: "Coordenação",
  vigor: "Vigor",
  intellect: "Intelecto",
  attention: "Atenção",
  willpower: "Vontade",
  prowess: "Proeza",
};

export function DiceRoller({ 
  isOpen, 
  onClose, 
  characterName, 
  characterId,
  attributes, 
  powers, 
  specialties,
  currentDetermination 
}: DiceRollerProps) {
  const [rollResult, setRollResult] = useState<RollResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [useDetermination, setUseDetermination] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const rollDice = () => Math.floor(Math.random() * 6) + 1;

  const performRoll = async (type: "attribute" | "power", name: string, baseValue: number, attributeKey?: string, powerId?: string) => {
    setIsRolling(true);
    
    // Find applicable specialty
    let specialtyBonus = 0;
    let specialtyName: string | null = null;
    
    if (selectedSpecialty) {
      const specialty = specialties.find(s => s.id === selectedSpecialty);
      if (specialty) {
        // Check if specialty matches the attribute or power
        const matchesAttribute = type === "attribute" && specialty.attribute === attributeKey && !specialty.power_id;
        const matchesPower = type === "power" && specialty.power_id === powerId;
        
        if (matchesAttribute || matchesPower) {
          specialtyBonus = specialty.bonus;
          specialtyName = specialty.name;
        }
      }
    }

    // Determination bonus
    let determinationBonus = 0;
    if (useDetermination && currentDetermination > 0) {
      determinationBonus = 2;
      // Deduct determination point
      const { error } = await supabase
        .from("characters")
        .update({ determination_points: currentDetermination - 1 })
        .eq("id", characterId);
      
      if (!error) {
        queryClient.invalidateQueries({ queryKey: ["character", characterId] });
      }
    }

    // Animate dice
    let count = 0;
    const interval = setInterval(() => {
      const tempRoll = rollDice();
      setRollResult({
        type,
        name,
        baseValue,
        diceRoll: tempRoll,
        specialtyBonus,
        specialtyName,
        total: baseValue + tempRoll + specialtyBonus + determinationBonus,
      });
      count++;
      if (count >= 10) {
        clearInterval(interval);
        const finalRoll = rollDice();
        setRollResult({
          type,
          name,
          baseValue,
          diceRoll: finalRoll,
          specialtyBonus,
          specialtyName,
          total: baseValue + finalRoll + specialtyBonus + determinationBonus,
        });
        setIsRolling(false);
        setSelectedSpecialty(null);
        setUseDetermination(false);

        if (determinationBonus > 0) {
          toast({
            title: "Determinação Gasta!",
            description: "Você gastou 1 ponto de determinação para +2 no teste.",
          });
        }
      }
    }, 80);
  };

  const handleAttributeRoll = (key: string, value: number) => {
    performRoll("attribute", attributeLabels[key], value, key);
  };

  const handlePowerRoll = (power: Power) => {
    const name = power.custom_name || power.powers_library?.name || "Poder";
    performRoll("power", name, power.level, undefined, power.id);
  };

  const getSpecialtiesForAttribute = (attributeKey: string) => {
    return specialties.filter(s => s.attribute === attributeKey && !s.power_id);
  };

  const getSpecialtiesForPower = (powerId: string) => {
    return specialties.filter(s => s.power_id === powerId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-background border-primary max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2 text-xl">
            <Dices className="w-6 h-6" />
            Rolagem de Dados - {characterName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Roll Result Display */}
          {rollResult && (
            <div className={cn(
              "p-6 rounded-lg border-2 text-center transition-all",
              isRolling ? "border-primary/50 bg-primary/5" : "border-primary bg-primary/10"
            )}>
              <p className="text-sm text-muted-foreground mb-2">
                {rollResult.type === "attribute" ? "Atributo" : "Poder"}: {rollResult.name}
              </p>
              <div className="flex items-center justify-center gap-3 text-2xl font-bold">
                <span className="text-primary">{rollResult.baseValue}</span>
                <Plus className="w-5 h-5 text-muted-foreground" />
                <span className={cn(
                  "text-4xl transition-transform",
                  isRolling && "animate-bounce"
                )}>
                  🎲 {rollResult.diceRoll}
                </span>
                {rollResult.specialtyBonus > 0 && (
                  <>
                    <Plus className="w-5 h-5 text-muted-foreground" />
                    <span className="text-neon-lime">+{rollResult.specialtyBonus}</span>
                  </>
                )}
                <span className="text-muted-foreground">=</span>
                <span className="text-3xl text-neon-cyan">{rollResult.total}</span>
              </div>
              {rollResult.specialtyName && (
                <p className="text-sm text-neon-lime mt-2">
                  Especialidade: {rollResult.specialtyName} (+{rollResult.specialtyBonus})
                </p>
              )}
            </div>
          )}

          {/* Determination & Specialty Selection */}
          <div className="space-y-4 p-4 bg-muted/20 border border-primary/30 rounded-lg">
            {/* Determination Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-neon-orange" />
                <Label htmlFor="use-determination" className="text-sm font-medium text-primary">
                  Gastar Determinação (+2)
                </Label>
                <Badge variant="outline" className="border-neon-orange text-neon-orange">
                  {currentDetermination} FH
                </Badge>
              </div>
              <Switch
                id="use-determination"
                checked={useDetermination}
                onCheckedChange={setUseDetermination}
                disabled={currentDetermination <= 0 || isRolling}
              />
            </div>

            {/* Specialty Selection */}
            {specialties.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-primary">Especialidade (opcional):</p>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "cursor-pointer transition-all",
                      !selectedSpecialty 
                        ? "bg-primary/20 border-primary text-primary" 
                        : "hover:bg-primary/10"
                    )}
                    onClick={() => setSelectedSpecialty(null)}
                  >
                    Nenhuma
                  </Badge>
                  {specialties.map((spec) => (
                    <Badge
                      key={spec.id}
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-all",
                        selectedSpecialty === spec.id 
                          ? "bg-neon-lime/20 border-neon-lime text-neon-lime" 
                          : "hover:bg-neon-lime/10"
                      )}
                      onClick={() => setSelectedSpecialty(spec.id)}
                    >
                      {spec.name} (+{spec.bonus})
                      {spec.power_id ? " [Poder]" : ` ${attributeLabels[spec.attribute]}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Attributes Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <Star className="w-5 h-5" />
              Atributos
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(attributes).map(([key, value]) => {
                const attrSpecialties = getSpecialtiesForAttribute(key);
                return (
                  <Button
                    key={key}
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-1 border-primary/50 hover:border-primary hover:bg-primary/10"
                    onClick={() => handleAttributeRoll(key, value)}
                    disabled={isRolling}
                  >
                    <span className="text-sm text-muted-foreground">{attributeLabels[key]}</span>
                    <span className="text-xl font-bold text-primary">{value}</span>
                    {attrSpecialties.length > 0 && (
                      <div className="flex gap-1">
                        {attrSpecialties.map(s => (
                          <span key={s.id} className="text-xs text-neon-lime">+{s.bonus}</span>
                        ))}
                      </div>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Powers Section */}
          {powers.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-neon-magenta flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Poderes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {powers.map((power) => {
                  const powerSpecialties = getSpecialtiesForPower(power.id);
                  return (
                    <Button
                      key={power.id}
                      variant="outline"
                      className="h-auto py-3 flex flex-col items-center gap-1 border-neon-magenta/50 hover:border-neon-magenta hover:bg-neon-magenta/10"
                      onClick={() => handlePowerRoll(power)}
                      disabled={isRolling}
                    >
                      <span className="text-sm text-muted-foreground">
                        {power.custom_name || power.powers_library?.name}
                      </span>
                      <span className="text-xl font-bold text-neon-magenta">Nível {power.level}</span>
                      {powerSpecialties.length > 0 && (
                        <div className="flex gap-1">
                          {powerSpecialties.map(s => (
                            <span key={s.id} className="text-xs text-neon-lime">+{s.bonus}</span>
                          ))}
                        </div>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
