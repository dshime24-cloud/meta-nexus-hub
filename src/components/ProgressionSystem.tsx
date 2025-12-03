import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Star, Zap, Shield, Plus, Lock, Unlock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

interface LevelThreshold {
  id: string;
  level: number;
  xp_required: number;
  attribute_points: number | null;
  ability_slots: number | null;
  description: string | null;
}

interface CharacterAbility {
  id: string;
  character_id: string;
  name: string;
  description: string | null;
  unlock_level: number | null;
  is_unlocked: boolean | null;
  ability_type: string | null;
  effect: string | null;
}

interface ProgressionSystemProps {
  character: Tables<"characters">;
  attributes: Tables<"character_attributes"> | null;
}

const ABILITY_TYPES = [
  { value: "passive", label: "Passiva" },
  { value: "active", label: "Ativa" },
  { value: "ultimate", label: "Ultimate" },
];

const ATTRIBUTES = [
  { key: "prowess", label: "Proeza", icon: Zap },
  { key: "coordination", label: "Coordenação", icon: TrendingUp },
  { key: "vigor", label: "Vigor", icon: Shield },
  { key: "intellect", label: "Intelecto", icon: Star },
  { key: "attention", label: "Atenção", icon: Star },
  { key: "willpower", label: "Vontade", icon: Star },
];

export function ProgressionSystem({ character, attributes }: ProgressionSystemProps) {
  const [isAddAbilityOpen, setIsAddAbilityOpen] = useState(false);
  const [newAbility, setNewAbility] = useState({
    name: "",
    description: "",
    unlock_level: 1,
    ability_type: "passive",
    effect: "",
  });
  const queryClient = useQueryClient();

  const { data: levelThresholds = [] } = useQuery({
    queryKey: ["level-thresholds"],
    queryFn: async () => {
      const { data, error } = await supabase.from("level_thresholds").select("*").order("level");
      if (error) throw error;
      return data as LevelThreshold[];
    },
  });

  const { data: abilities = [] } = useQuery({
    queryKey: ["character-abilities", character.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("character_abilities")
        .select("*")
        .eq("character_id", character.id)
        .order("unlock_level");
      if (error) throw error;
      return data as CharacterAbility[];
    },
  });

  const currentLevel = character.level || 1;
  const currentXP = character.xp || 0;
  const currentThreshold = levelThresholds.find((t) => t.level === currentLevel);
  const nextThreshold = levelThresholds.find((t) => t.level === currentLevel + 1);

  const xpForCurrentLevel = currentThreshold?.xp_required || 0;
  const xpForNextLevel = nextThreshold?.xp_required || currentXP + 100;
  const xpProgress = Math.min(((currentXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100, 100);

  const levelUpMutation = useMutation({
    mutationFn: async () => {
      if (!nextThreshold || currentXP < nextThreshold.xp_required) {
        throw new Error("XP insuficiente para subir de nível");
      }

      const { error } = await supabase
        .from("characters")
        .update({ level: currentLevel + 1 })
        .eq("id", character.id);

      if (error) throw error;

      // Unlock abilities at new level
      const { error: abilitiesError } = await supabase
        .from("character_abilities")
        .update({ is_unlocked: true })
        .eq("character_id", character.id)
        .lte("unlock_level", currentLevel + 1);

      if (abilitiesError) throw abilitiesError;

      return currentLevel + 1;
    },
    onSuccess: (newLevel) => {
      queryClient.invalidateQueries({ queryKey: ["character", character.id] });
      queryClient.invalidateQueries({ queryKey: ["character-abilities"] });
      toast({
        title: "Level Up!",
        description: `${character.name} subiu para o nível ${newLevel}!`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const upgradeAttributeMutation = useMutation({
    mutationFn: async (attributeKey: string) => {
      if (!attributes) throw new Error("Atributos não encontrados");

      const currentValue = (attributes as any)[attributeKey] || 1;
      const cost = currentValue * 50; // Cost increases with level

      if (currentXP < cost) {
        throw new Error(`XP insuficiente. Custo: ${cost} XP`);
      }

      // Deduct XP
      const { error: xpError } = await supabase
        .from("characters")
        .update({ xp: currentXP - cost })
        .eq("id", character.id);

      if (xpError) throw xpError;

      // Upgrade attribute
      const { error: attrError } = await supabase
        .from("character_attributes")
        .update({ [attributeKey]: currentValue + 1 })
        .eq("character_id", character.id);

      if (attrError) throw attrError;

      return { attributeKey, newValue: currentValue + 1, cost };
    },
    onSuccess: ({ attributeKey, newValue, cost }) => {
      queryClient.invalidateQueries({ queryKey: ["character", character.id] });
      queryClient.invalidateQueries({ queryKey: ["character-attributes"] });
      const attr = ATTRIBUTES.find((a) => a.key === attributeKey);
      toast({
        title: "Atributo Melhorado!",
        description: `${attr?.label} aumentou para ${newValue} (-${cost} XP)`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const addAbilityMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("character_abilities").insert({
        character_id: character.id,
        name: newAbility.name,
        description: newAbility.description,
        unlock_level: newAbility.unlock_level,
        ability_type: newAbility.ability_type,
        effect: newAbility.effect,
        is_unlocked: newAbility.unlock_level <= currentLevel,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character-abilities"] });
      setIsAddAbilityOpen(false);
      setNewAbility({ name: "", description: "", unlock_level: 1, ability_type: "passive", effect: "" });
      toast({ title: "Habilidade adicionada!", description: "A habilidade foi criada com sucesso." });
    },
  });

  return (
    <div className="space-y-6">
      <Card className="cyber-card animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="gradient-text font-space flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Progressão de Nível
            </span>
            <Badge className="bg-neon-magenta text-primary-foreground text-lg px-3 py-1">
              Nível {currentLevel}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">XP: {currentXP}</span>
              <span className="text-neon-cyan">Próximo: {xpForNextLevel} XP</span>
            </div>
            <Progress value={xpProgress} className="h-3 bg-muted" />
            {currentThreshold && (
              <p className="text-sm text-neon-orange text-center font-medium">
                {currentThreshold.description}
              </p>
            )}
          </div>

          {nextThreshold && currentXP >= nextThreshold.xp_required && (
            <Button
              onClick={() => levelUpMutation.mutate()}
              className="w-full btn-gradient-orange text-primary-foreground animate-glow-pulse"
            >
              <Star className="w-4 h-4 mr-2" /> Subir para Nível {currentLevel + 1}!
            </Button>
          )}

          {nextThreshold && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/30">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Pontos de Atributo</p>
                <p className="text-lg font-bold text-neon-cyan">+{nextThreshold.attribute_points || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Slots de Habilidade</p>
                <p className="text-lg font-bold text-neon-magenta">+{nextThreshold.ability_slots || 0}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="cyber-card-magenta animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <CardHeader>
          <CardTitle className="text-neon-magenta font-space flex items-center gap-2">
            <Zap className="w-5 h-5" /> Evolução de Atributos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ATTRIBUTES.map((attr) => {
              const value = attributes ? (attributes as any)[attr.key] || 1 : 1;
              const cost = value * 50;
              return (
                <div
                  key={attr.key}
                  className="p-3 rounded-lg bg-muted/50 border border-neon-magenta/30 hover:border-neon-magenta transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neon-cyan">{attr.label}</span>
                    <Badge variant="outline" className="border-neon-orange text-neon-orange">
                      {value}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => upgradeAttributeMutation.mutate(attr.key)}
                    disabled={currentXP < cost}
                    className="w-full text-xs border-neon-magenta/50 hover:bg-neon-magenta/20"
                  >
                    +1 ({cost} XP)
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="cyber-card-orange animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-neon-orange font-space flex items-center gap-2">
              <Star className="w-5 h-5" /> Habilidades
            </span>
            <Dialog open={isAddAbilityOpen} onOpenChange={setIsAddAbilityOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="btn-gradient-orange text-primary-foreground">
                  <Plus className="w-4 h-4 mr-1" /> Nova
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-neon-orange">
                <DialogHeader>
                  <DialogTitle className="text-neon-orange font-space">Adicionar Habilidade</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Nome da Habilidade"
                    value={newAbility.name}
                    onChange={(e) => setNewAbility({ ...newAbility, name: e.target.value })}
                    className="bg-muted border-neon-orange/50"
                  />
                  <Textarea
                    placeholder="Descrição"
                    value={newAbility.description}
                    onChange={(e) => setNewAbility({ ...newAbility, description: e.target.value })}
                    className="bg-muted border-neon-orange/50"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Nível para Desbloquear"
                      value={newAbility.unlock_level}
                      onChange={(e) => setNewAbility({ ...newAbility, unlock_level: parseInt(e.target.value) || 1 })}
                      className="bg-muted border-neon-orange/50"
                      min={1}
                      max={10}
                    />
                    <Select
                      value={newAbility.ability_type}
                      onValueChange={(v) => setNewAbility({ ...newAbility, ability_type: v })}
                    >
                      <SelectTrigger className="bg-muted border-neon-orange/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ABILITY_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder="Efeito da Habilidade"
                    value={newAbility.effect}
                    onChange={(e) => setNewAbility({ ...newAbility, effect: e.target.value })}
                    className="bg-muted border-neon-orange/50"
                  />
                  <Button
                    onClick={() => addAbilityMutation.mutate()}
                    className="w-full btn-gradient-orange text-primary-foreground"
                    disabled={!newAbility.name}
                  >
                    Adicionar Habilidade
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {abilities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma habilidade adicionada ainda.
              </p>
            ) : (
              abilities.map((ability) => (
                <div
                  key={ability.id}
                  className={`p-3 rounded-lg border ${
                    ability.is_unlocked
                      ? "bg-neon-orange/10 border-neon-orange"
                      : "bg-muted/30 border-muted-foreground/30 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {ability.is_unlocked ? (
                        <Unlock className="w-4 h-4 text-neon-lime" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-primary">{ability.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {ABILITY_TYPES.find((t) => t.value === ability.ability_type)?.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          ability.is_unlocked ? "border-neon-lime text-neon-lime" : "border-muted-foreground"
                        }`}
                      >
                        Nv. {ability.unlock_level}
                      </Badge>
                    </div>
                  </div>
                  {ability.description && (
                    <p className="text-sm text-muted-foreground">{ability.description}</p>
                  )}
                  {ability.effect && ability.is_unlocked && (
                    <p className="text-sm text-neon-cyan mt-1">Efeito: {ability.effect}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}