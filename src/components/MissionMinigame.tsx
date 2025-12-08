import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dices, Zap, Shield, Target, Trophy, Skull, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

interface MissionMinigameProps {
  difficulty: string;
  onComplete: (success: boolean) => void;
  onCancel: () => void;
}

export function MissionMinigame({ difficulty, onComplete, onCancel }: MissionMinigameProps) {
  const [phase, setPhase] = useState<"ready" | "rolling" | "result" | "finished">("ready");
  const [playerRoll, setPlayerRoll] = useState(0);
  const [enemyRoll, setEnemyRoll] = useState(0);
  const [displayPlayerRoll, setDisplayPlayerRoll] = useState(0);
  const [displayEnemyRoll, setDisplayEnemyRoll] = useState(0);
  const [victories, setVictories] = useState(0);
  const [defeats, setDefeats] = useState(0);
  const [round, setRound] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [roundResult, setRoundResult] = useState<"win" | "lose" | "draw" | null>(null);

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

  const rollDice = () => {
    setIsRolling(true);
    setPhase("rolling");
    setRoundResult(null);

    // Animate dice rolling
    let rollCount = 0;
    const maxRolls = 15;
    
    const rollInterval = setInterval(() => {
      setDisplayPlayerRoll(Math.floor(Math.random() * 6) + 1);
      setDisplayEnemyRoll(Math.floor(Math.random() * 6) + 1);
      rollCount++;

      if (rollCount >= maxRolls) {
        clearInterval(rollInterval);
        
        // Final results
        const finalPlayerRoll = Math.floor(Math.random() * 6) + 1;
        const finalEnemyRoll = Math.floor(Math.random() * 6) + 1 + settings.enemyBonus;
        
        setPlayerRoll(finalPlayerRoll);
        setEnemyRoll(finalEnemyRoll);
        setDisplayPlayerRoll(finalPlayerRoll);
        setDisplayEnemyRoll(finalEnemyRoll);
        setIsRolling(false);
        setPhase("result");

        // Determine winner
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

  // Check for game end
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
          // Draw - re-roll same round
          setPhase("ready");
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, victories, defeats, roundResult, settings.requiredWins, maxDefeats]);

  // Handle final result
  useEffect(() => {
    if (phase === "finished") {
      const timer = setTimeout(() => {
        onComplete(victories >= settings.requiredWins);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, victories, settings.requiredWins, onComplete]);

  const getDiceDisplay = (value: number) => {
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
    return dots[value] || dots[1];
  };

  const isVictory = victories >= settings.requiredWins;
  const isDefeat = defeats >= maxDefeats;

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
        {settings.enemyBonus > 0 && (
          <p className="text-xs text-neon-yellow mt-1">
            Inimigo tem +{settings.enemyBonus} de bônus (Dificuldade: {difficulty})
          </p>
        )}
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
              <div className="text-lg font-bold mt-2">{playerRoll}</div>
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
              {(displayEnemyRoll > 0 || isRolling) && getDiceDisplay(Math.min(displayEnemyRoll, 6) || 1)}
            </div>
            {phase === "result" && (
              <div className="text-lg font-bold mt-2">
                {enemyRoll}
                {settings.enemyBonus > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({Math.min(enemyRoll - settings.enemyBonus, 6)}+{settings.enemyBonus})
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