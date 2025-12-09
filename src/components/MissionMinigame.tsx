import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dices, Zap, Shield, Target, Trophy, Skull, Swords, Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Participant {
  id: string;
  character_id: string;
  characters: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

interface CharacterAttributes {
  prowess: number;
  coordination: number;
  vigor: number;
  intellect: number;
  attention: number;
  willpower: number;
}

interface SelectedBonus {
  participantId: string;
  characterName: string;
  attribute: string;
  value: number;
}

interface MissionMinigameProps {
  difficulty: string;
  participants?: Participant[];
  onComplete: (success: boolean) => void;
  onCancel: () => void;
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  prowess: "Proeza",
  coordination: "Coordenação",
  vigor: "Vigor",
  intellect: "Intelecto",
  attention: "Atenção",
  willpower: "Vontade",
};

export function MissionMinigame({ difficulty, participants = [], onComplete, onCancel }: MissionMinigameProps) {
  const [phase, setPhase] = useState<"setup" | "ready" | "rolling" | "result" | "finished">("setup");
  const [playerRoll, setPlayerRoll] = useState(0);
  const [enemyRoll, setEnemyRoll] = useState(0);
  const [displayPlayerRoll, setDisplayPlayerRoll] = useState(0);
  const [displayEnemyRoll, setDisplayEnemyRoll] = useState(0);
  const [victories, setVictories] = useState(0);
  const [defeats, setDefeats] = useState(0);
  const [round, setRound] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [roundResult, setRoundResult] = useState<"win" | "lose" | "draw" | null>(null);
  
  // Bonus selection state
  const [selectedBonuses, setSelectedBonuses] = useState<SelectedBonus[]>([]);
  const [participantAttributes, setParticipantAttributes] = useState<Record<string, CharacterAttributes>>({});
  const [selectedParticipant, setSelectedParticipant] = useState<string>("");
  const [selectedAttribute, setSelectedAttribute] = useState<string>("");
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);

  // Load participant attributes
  useEffect(() => {
    const loadAttributes = async () => {
      if (participants.length === 0) return;
      
      setIsLoadingAttributes(true);
      const attributesMap: Record<string, CharacterAttributes> = {};
      
      for (const participant of participants) {
        const { data } = await supabase
          .from("character_attributes")
          .select("prowess, coordination, vigor, intellect, attention, willpower")
          .eq("character_id", participant.character_id)
          .maybeSingle();
        
        if (data) {
          attributesMap[participant.character_id] = data as CharacterAttributes;
        }
      }
      
      setParticipantAttributes(attributesMap);
      setIsLoadingAttributes(false);
    };
    
    loadAttributes();
  }, [participants]);

  const getDifficultySettings = (diff: string) => {
    switch (diff) {
      case "Fácil": return { rounds: 3, requiredWins: 2, enemyBonus: 0, color: "neon-green" };
      case "Média": return { rounds: 3, requiredWins: 2, enemyBonus: 1, color: "neon-cyan" };
      case "Difícil": return { rounds: 5, requiredWins: 3, enemyBonus: 2, color: "neon-yellow" };
      case "Extrema": return { rounds: 5, requiredWins: 3, enemyBonus: 3, color: "neon-orange" };
      case "Lendária": return { rounds: 7, requiredWins: 4, enemyBonus: 4, color: "neon-magenta" };
      default: return { rounds: 3, requiredWins: 2, enemyBonus: 0, color: "neon-cyan" };
    }
  };

  const settings = getDifficultySettings(difficulty);
  const maxDefeats = settings.rounds - settings.requiredWins + 1;

  const totalBonus = selectedBonuses.reduce((sum, b) => sum + b.value, 0);

  const addBonus = () => {
    if (!selectedParticipant || !selectedAttribute) return;
    
    const participant = participants.find(p => p.character_id === selectedParticipant);
    const attributes = participantAttributes[selectedParticipant];
    
    if (!participant || !attributes) return;
    
    // Check if this participant already contributed
    const alreadyContributed = selectedBonuses.some(b => b.participantId === selectedParticipant);
    if (alreadyContributed) return;
    
    const attributeValue = attributes[selectedAttribute as keyof CharacterAttributes] || 0;
    
    setSelectedBonuses([...selectedBonuses, {
      participantId: selectedParticipant,
      characterName: participant.characters.name,
      attribute: selectedAttribute,
      value: attributeValue
    }]);
    
    setSelectedParticipant("");
    setSelectedAttribute("");
  };

  const removeBonus = (participantId: string) => {
    setSelectedBonuses(selectedBonuses.filter(b => b.participantId !== participantId));
  };

  const startGame = () => {
    setPhase("ready");
  };

  const rollDice = () => {
    setIsRolling(true);
    setPhase("rolling");
    setRoundResult(null);

    let rollCount = 0;
    const maxRolls = 15;
    
    const rollInterval = setInterval(() => {
      setDisplayPlayerRoll(Math.floor(Math.random() * 6) + 1);
      setDisplayEnemyRoll(Math.floor(Math.random() * 6) + 1);
      rollCount++;

      if (rollCount >= maxRolls) {
        clearInterval(rollInterval);
        
        const finalPlayerRoll = Math.floor(Math.random() * 6) + 1 + totalBonus;
        const finalEnemyRoll = Math.floor(Math.random() * 6) + 1 + settings.enemyBonus;
        
        setPlayerRoll(finalPlayerRoll);
        setEnemyRoll(finalEnemyRoll);
        setDisplayPlayerRoll(Math.min(finalPlayerRoll, 6));
        setDisplayEnemyRoll(Math.min(finalEnemyRoll, 6));
        setIsRolling(false);
        setPhase("result");

        if (finalPlayerRoll > finalEnemyRoll) {
          setRoundResult("win");
          setVictories(v => v + 1);
        } else if (finalPlayerRoll < finalEnemyRoll) {
          setRoundResult("lose");
          setDefeats(d => d + 1);
        } else {
          setRoundResult("draw");
        }
      }
    }, 80);
  };

  useEffect(() => {
    if (phase === "result") {
      const timer = setTimeout(() => {
        if (victories >= settings.requiredWins) {
          setPhase("finished");
        } else if (defeats >= maxDefeats) {
          setPhase("finished");
        } else if (roundResult !== "draw") {
          setRound(r => r + 1);
          setPhase("ready");
        } else {
          setPhase("ready");
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, victories, defeats, roundResult, settings.requiredWins, maxDefeats]);

  useEffect(() => {
    if (phase === "finished") {
      const timer = setTimeout(() => {
        onComplete(victories >= settings.requiredWins);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, victories, settings.requiredWins, onComplete]);

  const getDiceDisplay = (value: number) => {
    const displayValue = Math.min(Math.max(value, 1), 6);
    const dots: Record<number, JSX.Element> = {
      1: (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-current" />
        </div>
      ),
      2: (
        <div className="w-full h-full flex flex-col justify-between p-1">
          <div className="w-2.5 h-2.5 rounded-full bg-current self-end" />
          <div className="w-2.5 h-2.5 rounded-full bg-current self-start" />
        </div>
      ),
      3: (
        <div className="w-full h-full flex flex-col justify-between p-1">
          <div className="w-2.5 h-2.5 rounded-full bg-current self-end" />
          <div className="w-2.5 h-2.5 rounded-full bg-current self-center" />
          <div className="w-2.5 h-2.5 rounded-full bg-current self-start" />
        </div>
      ),
      4: (
        <div className="w-full h-full grid grid-cols-2 gap-1 p-1">
          <div className="w-2.5 h-2.5 rounded-full bg-current" />
          <div className="w-2.5 h-2.5 rounded-full bg-current justify-self-end" />
          <div className="w-2.5 h-2.5 rounded-full bg-current" />
          <div className="w-2.5 h-2.5 rounded-full bg-current justify-self-end" />
        </div>
      ),
      5: (
        <div className="w-full h-full grid grid-cols-2 gap-1 p-1 relative">
          <div className="w-2 h-2 rounded-full bg-current" />
          <div className="w-2 h-2 rounded-full bg-current justify-self-end" />
          <div className="w-2 h-2 rounded-full bg-current absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="w-2 h-2 rounded-full bg-current" />
          <div className="w-2 h-2 rounded-full bg-current justify-self-end" />
        </div>
      ),
      6: (
        <div className="w-full h-full grid grid-cols-2 gap-1 p-1">
          <div className="w-2 h-2 rounded-full bg-current" />
          <div className="w-2 h-2 rounded-full bg-current justify-self-end" />
          <div className="w-2 h-2 rounded-full bg-current" />
          <div className="w-2 h-2 rounded-full bg-current justify-self-end" />
          <div className="w-2 h-2 rounded-full bg-current" />
          <div className="w-2 h-2 rounded-full bg-current justify-self-end" />
        </div>
      ),
    };
    return dots[displayValue];
  };

  const isVictory = victories >= settings.requiredWins;
  const isDefeat = defeats >= maxDefeats;

  const availableParticipants = participants.filter(
    p => !selectedBonuses.some(b => b.participantId === p.character_id)
  );

  // Setup phase - select participant bonuses
  if (phase === "setup") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <Users className="w-6 h-6 text-neon-cyan" />
            Preparação do Desafio
          </h3>
          <p className="text-sm text-muted-foreground">
            Escolha quais participantes vão contribuir com seus atributos
          </p>
        </div>

        {/* Difficulty info */}
        <div className="p-3 rounded-lg bg-muted/30 border border-neon-cyan/30">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Dificuldade:</span>
            <span className="font-bold text-neon-cyan">{difficulty}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-muted-foreground">Bônus do Inimigo:</span>
            <span className="font-bold text-neon-red">+{settings.enemyBonus}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-muted-foreground">Vitórias Necessárias:</span>
            <span className="font-bold text-neon-green">{settings.requiredWins} de {settings.rounds}</span>
          </div>
        </div>

        {/* Bonus selector */}
        {participants.length > 0 && !isLoadingAttributes && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
                <SelectTrigger className="flex-1 border-neon-cyan/50">
                  <SelectValue placeholder="Escolher Participante" />
                </SelectTrigger>
                <SelectContent>
                  {availableParticipants.map(p => (
                    <SelectItem key={p.character_id} value={p.character_id}>
                      {p.characters.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={selectedAttribute} 
                onValueChange={setSelectedAttribute}
                disabled={!selectedParticipant}
              >
                <SelectTrigger className="flex-1 border-neon-cyan/50">
                  <SelectValue placeholder="Atributo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ATTRIBUTE_LABELS).map(([key, label]) => {
                    const value = selectedParticipant && participantAttributes[selectedParticipant]
                      ? participantAttributes[selectedParticipant][key as keyof CharacterAttributes]
                      : 0;
                    return (
                      <SelectItem key={key} value={key}>
                        {label} (+{value || 0})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Button
                onClick={addBonus}
                disabled={!selectedParticipant || !selectedAttribute}
                size="icon"
                className="bg-neon-cyan text-background hover:bg-neon-cyan/80"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Selected bonuses */}
            {selectedBonuses.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-bold text-neon-cyan">Bônus Selecionados:</div>
                {selectedBonuses.map(bonus => (
                  <div 
                    key={bonus.participantId}
                    className="flex items-center justify-between p-2 rounded bg-neon-cyan/10 border border-neon-cyan/30"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{bonus.characterName}</span>
                      <span className="text-xs text-muted-foreground">
                        ({ATTRIBUTE_LABELS[bonus.attribute]})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neon-green font-bold">+{bonus.value}</span>
                      <Button
                        onClick={() => removeBonus(bonus.participantId)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-neon-red hover:bg-neon-red/20"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total bonus */}
            <div className="flex justify-between items-center p-3 rounded-lg bg-neon-green/10 border border-neon-green/30">
              <span className="font-bold text-foreground">Bônus Total:</span>
              <span className="text-2xl font-bold text-neon-green">+{totalBonus}</span>
            </div>
          </div>
        )}

        {participants.length === 0 && (
          <div className="text-center p-4 text-muted-foreground text-sm">
            Nenhum participante na missão. O desafio será sem bônus.
          </div>
        )}

        {isLoadingAttributes && (
          <div className="text-center p-4 text-muted-foreground text-sm">
            Carregando atributos dos participantes...
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-muted-foreground"
          >
            Cancelar
          </Button>
          <Button
            onClick={startGame}
            className="flex-1 bg-neon-cyan text-background hover:bg-neon-cyan/80 font-bold"
          >
            <Swords className="mr-2 w-5 h-5" />
            Iniciar Desafio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
          <Swords className="w-6 h-6 text-neon-cyan" />
          Desafio de Combate
        </h3>
        <p className="text-sm text-muted-foreground">
          Vença {settings.requiredWins} de {settings.rounds} rodadas para completar a missão
        </p>
        <div className="flex justify-center gap-4 mt-2">
          {totalBonus > 0 && (
            <span className="text-xs text-neon-green">
              Seu bônus: +{totalBonus}
            </span>
          )}
          {settings.enemyBonus > 0 && (
            <span className="text-xs text-neon-red">
              Inimigo: +{settings.enemyBonus}
            </span>
          )}
        </div>
      </div>

      {/* Score */}
      <div className="flex justify-center gap-8">
        <div className="text-center">
          <div className="text-3xl font-bold text-neon-green">{victories}</div>
          <div className="text-xs text-muted-foreground">Vitórias</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-muted-foreground">Round {round}</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-neon-red">{defeats}</div>
          <div className="text-xs text-muted-foreground">Derrotas</div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-neon-green" />
          <Progress 
            value={(victories / settings.requiredWins) * 100} 
            className="h-3 bg-muted" 
          />
          <span className="text-xs text-neon-green">{victories}/{settings.requiredWins}</span>
        </div>
        <div className="flex items-center gap-2">
          <Skull className="w-4 h-4 text-neon-red" />
          <Progress 
            value={(defeats / maxDefeats) * 100} 
            className="h-3 bg-muted [&>div]:bg-neon-red" 
          />
          <span className="text-xs text-neon-red">{defeats}/{maxDefeats}</span>
        </div>
      </div>

      {/* Dice Arena */}
      {phase !== "finished" && (
        <div className="flex items-center justify-center gap-8 py-6">
          {/* Player */}
          <div className="text-center">
            <div className="text-sm font-bold text-neon-cyan mb-2 flex items-center justify-center gap-1">
              <Shield className="w-4 h-4" />
              Você
            </div>
            <div 
              className={cn(
                "w-16 h-16 rounded-lg border-2 text-neon-cyan transition-all duration-200",
                isRolling && "animate-pulse border-neon-cyan bg-neon-cyan/20",
                roundResult === "win" && "border-neon-green text-neon-green bg-neon-green/20 scale-110",
                roundResult === "lose" && "border-neon-red text-neon-red bg-neon-red/20 scale-90",
                roundResult === "draw" && "border-neon-yellow text-neon-yellow bg-neon-yellow/20",
                !isRolling && !roundResult && "border-neon-cyan/50 bg-background"
              )}
            >
              {(displayPlayerRoll > 0 || isRolling) && getDiceDisplay(displayPlayerRoll || 1)}
            </div>
            {phase === "result" && (
              <div className="text-lg font-bold mt-2">
                {playerRoll}
                {totalBonus > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({Math.max(playerRoll - totalBonus, 1)}+{totalBonus})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* VS */}
          <div className="text-center">
            <div className={cn(
              "text-2xl font-bold transition-all duration-300",
              isRolling && "animate-pulse text-neon-yellow",
              roundResult === "win" && "text-neon-green",
              roundResult === "lose" && "text-neon-red",
              roundResult === "draw" && "text-neon-yellow",
              !isRolling && !roundResult && "text-muted-foreground"
            )}>
              VS
            </div>
            {roundResult && (
              <div className={cn(
                "text-sm font-bold mt-1 animate-fade-in",
                roundResult === "win" && "text-neon-green",
                roundResult === "lose" && "text-neon-red",
                roundResult === "draw" && "text-neon-yellow"
              )}>
                {roundResult === "win" && "VITÓRIA!"}
                {roundResult === "lose" && "DERROTA!"}
                {roundResult === "draw" && "EMPATE!"}
              </div>
            )}
          </div>

          {/* Enemy */}
          <div className="text-center">
            <div className="text-sm font-bold text-neon-red mb-2 flex items-center justify-center gap-1">
              <Target className="w-4 h-4" />
              Inimigo
            </div>
            <div 
              className={cn(
                "w-16 h-16 rounded-lg border-2 text-neon-red transition-all duration-200",
                isRolling && "animate-pulse border-neon-red bg-neon-red/20",
                roundResult === "lose" && "border-neon-green text-neon-green bg-neon-green/20 scale-110",
                roundResult === "win" && "border-neon-red text-neon-red bg-neon-red/20 scale-90",
                roundResult === "draw" && "border-neon-yellow text-neon-yellow bg-neon-yellow/20",
                !isRolling && !roundResult && "border-neon-red/50 bg-background"
              )}
            >
              {(displayEnemyRoll > 0 || isRolling) && getDiceDisplay(displayEnemyRoll || 1)}
            </div>
            {phase === "result" && (
              <div className="text-lg font-bold mt-2">
                {enemyRoll}
                {settings.enemyBonus > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({Math.max(enemyRoll - settings.enemyBonus, 1)}+{settings.enemyBonus})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Final Result */}
      {phase === "finished" && (
        <div className={cn(
          "text-center py-8 animate-scale-in",
          isVictory ? "text-neon-green" : "text-neon-red"
        )}>
          {isVictory ? (
            <>
              <Trophy className="w-20 h-20 mx-auto mb-4 animate-pulse" />
              <h3 className="text-3xl font-bold mb-2">MISSÃO CONCLUÍDA!</h3>
              <p className="text-muted-foreground">Você venceu o desafio!</p>
            </>
          ) : (
            <>
              <Skull className="w-20 h-20 mx-auto mb-4 animate-pulse" />
              <h3 className="text-3xl font-bold mb-2">MISSÃO FALHADA!</h3>
              <p className="text-muted-foreground">O inimigo foi mais forte...</p>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      {phase !== "finished" && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isRolling}
            className="flex-1 border-muted-foreground"
          >
            Cancelar
          </Button>
          <Button
            onClick={rollDice}
            disabled={isRolling || phase === "result"}
            className="flex-1 bg-neon-cyan text-background hover:bg-neon-cyan/80 font-bold"
          >
            <Dices className="mr-2 w-5 h-5" />
            {isRolling ? "Rolando..." : "Rolar Dados"}
          </Button>
        </div>
      )}
    </div>
  );
}
