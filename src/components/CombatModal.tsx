import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Swords, Trophy, Zap, Shield, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Character = Tables<"characters"> & {
  character_attributes: Tables<"character_attributes"> | null;
};

interface CombatModalProps {
  isOpen: boolean;
  onClose: () => void;
  attackerId: string;
}

export function CombatModal({ isOpen, onClose, attackerId }: CombatModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [defenderId, setDefenderId] = useState<string>("");
  const [combatResult, setCombatResult] = useState<{
    attackerRoll: number;
    defenderRoll: number;
    winner: string;
    winnerId: string;
  } | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const { data: characters = [] } = useQuery({
    queryKey: ["characters-for-combat"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("characters")
        .select("*, character_attributes(*)")
        .neq("id", attackerId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Character[];
    },
    enabled: isOpen,
  });

  const { data: attacker } = useQuery({
    queryKey: ["character", attackerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("characters")
        .select("*, character_attributes(*)")
        .eq("id", attackerId)
        .single();
      if (error) throw error;
      return data as Character;
    },
    enabled: isOpen,
  });

  const saveCombatLogMutation = useMutation({
    mutationFn: async ({ attackerRoll, defenderRoll, winnerId }: {
      attackerRoll: number;
      defenderRoll: number;
      winnerId: string;
    }) => {
      const { error } = await supabase
        .from("combat_logs")
        .insert({
          attacker_id: attackerId,
          defender_id: defenderId,
          attacker_roll: attackerRoll,
          defender_roll: defenderRoll,
          winner_id: winnerId,
          details: {
            attacker_name: attacker?.name,
            defender_name: characters.find(c => c.id === defenderId)?.name,
          },
        });
      if (error) throw error;
    },
  });

  const rollDice = () => Math.floor(Math.random() * 6) + 1;

  const calculateCombatScore = (character: Character) => {
    const attrs = character.character_attributes;
    if (!attrs) return 0;
    return (attrs.coordination || 0) + (attrs.vigor || 0) + (attrs.prowess || 0);
  };

  const startCombat = async () => {
    if (!defenderId || !attacker) return;

    setIsRolling(true);
    setCombatResult(null);

    const defender = characters.find(c => c.id === defenderId);
    if (!defender) return;

    // Simulate rolling animation
    await new Promise(resolve => setTimeout(resolve, 1000));

    const attackerBase = calculateCombatScore(attacker);
    const defenderBase = calculateCombatScore(defender);

    const attackerDice = rollDice();
    const defenderDice = rollDice();

    const attackerTotal = attackerBase + attackerDice;
    const defenderTotal = defenderBase + defenderDice;

    const winnerId = attackerTotal >= defenderTotal ? attackerId : defenderId;
    const winnerName = attackerTotal >= defenderTotal ? attacker.name : defender.name;

    const result = {
      attackerRoll: attackerTotal,
      defenderRoll: defenderTotal,
      winner: winnerName,
      winnerId,
    };

    setCombatResult(result);
    setIsRolling(false);

    // Save combat log
    await saveCombatLogMutation.mutateAsync({
      attackerRoll: attackerTotal,
      defenderRoll: defenderTotal,
      winnerId,
    });

    toast({
      title: "Combate Concluído!",
      description: `${winnerName} venceu o combate!`,
    });
  };

  const defender = characters.find(c => c.id === defenderId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-background border-primary">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2 text-xl">
            <Swords className="w-6 h-6" />
            Sistema de Combate
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Character Selection */}
          {!combatResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Attacker */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-primary flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Atacante
                  </p>
                  <div className="p-4 bg-neon-cyan/10 border-2 border-neon-cyan rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="w-12 h-12 border-2 border-neon-cyan">
                        <AvatarImage src={attacker?.image_url || ""} />
                        <AvatarFallback>{attacker?.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-neon-cyan">{attacker?.name}</p>
                        <p className="text-xs text-muted-foreground">{attacker?.alias}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-neon-cyan text-neon-cyan">
                      <Zap className="w-3 h-3 mr-1" />
                      Base: {attacker ? calculateCombatScore(attacker) : 0}
                    </Badge>
                  </div>
                </div>

                {/* Defender Selection */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-primary flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Defensor
                  </p>
                  <Select value={defenderId} onValueChange={setDefenderId}>
                    <SelectTrigger className="cyber-input">
                      <SelectValue placeholder="Selecione o defensor" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-primary">
                      {characters.map((char) => (
                        <SelectItem key={char.id} value={char.id}>
                          {char.name} {char.alias && `(${char.alias})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {defender && (
                    <div className="p-4 bg-neon-orange/10 border-2 border-neon-orange rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="w-12 h-12 border-2 border-neon-orange">
                          <AvatarImage src={defender.image_url || ""} />
                          <AvatarFallback>{defender.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-neon-orange">{defender.name}</p>
                          <p className="text-xs text-muted-foreground">{defender.alias}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-neon-orange text-neon-orange">
                        <Shield className="w-3 h-3 mr-1" />
                        Base: {calculateCombatScore(defender)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={startCombat}
                disabled={!defenderId || isRolling}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Swords className="w-4 h-4 mr-2" />
                {isRolling ? "Rolando..." : "Iniciar Combate"}
              </Button>
            </div>
          )}

          {/* Combat Result */}
          {combatResult && (
            <div className="space-y-4">
              <div className={cn(
                "p-6 rounded-lg border-2 text-center",
                combatResult.winnerId === attackerId 
                  ? "bg-neon-cyan/10 border-neon-cyan" 
                  : "bg-neon-orange/10 border-neon-orange"
              )}>
                <Trophy className={cn(
                  "w-16 h-16 mx-auto mb-4",
                  combatResult.winnerId === attackerId ? "text-neon-cyan" : "text-neon-orange"
                )} />
                <h3 className="text-2xl font-bold text-primary mb-2">
                  {combatResult.winner} Venceu!
                </h3>
                <div className="flex items-center justify-center gap-8 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Atacante</p>
                    <p className="text-3xl font-bold text-neon-cyan">
                      {combatResult.attackerRoll}
                    </p>
                  </div>
                  <div className="text-2xl text-muted-foreground">VS</div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Defensor</p>
                    <p className="text-3xl font-bold text-neon-orange">
                      {combatResult.defenderRoll}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setCombatResult(null);
                    setDefenderId("");
                  }}
                  variant="outline"
                  className="flex-1 border-primary text-primary hover:bg-primary/10"
                >
                  Novo Combate
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
