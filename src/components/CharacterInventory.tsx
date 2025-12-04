import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, Trash2, Star, Zap, Heart, TrendingUp } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type InventoryItem = Tables<"character_inventory"> & {
  shop_items: Tables<"shop_items"> | null;
};

interface CharacterInventoryProps {
  characterId: string;
  currentXp: number;
  currentEnergy: number;
  currentDetermination: number;
}

export function CharacterInventory({ 
  characterId, 
  currentXp, 
  currentEnergy, 
  currentDetermination 
}: CharacterInventoryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modifiers, setModifiers] = useState<Record<string, number>>({
    xp: 0,
    energy: 0,
    determination: 0,
  });
  const [localXp, setLocalXp] = useState(currentXp);
  const [localEnergy, setLocalEnergy] = useState(currentEnergy);
  const [localDetermination, setLocalDetermination] = useState(currentDetermination);

  // Update local state when props change
  useEffect(() => {
    setLocalXp(currentXp);
    setLocalEnergy(currentEnergy);
    setLocalDetermination(currentDetermination);
  }, [currentXp, currentEnergy, currentDetermination]);

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["character-inventory", characterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("character_inventory")
        .select("*, shop_items(*)")
        .eq("character_id", characterId)
        .order("acquired_at", { ascending: false });
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  // Realtime subscription for inventory changes
  useEffect(() => {
    const channel = supabase
      .channel(`inventory-${characterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_inventory',
          filter: `character_id=eq.${characterId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["character-inventory", characterId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId, queryClient]);

  // Realtime subscription for character changes
  useEffect(() => {
    const channel = supabase
      .channel(`character-stats-${characterId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
          filter: `id=eq.${characterId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          setLocalXp(newData.xp || 0);
          setLocalEnergy(newData.energy || 100);
          setLocalDetermination(newData.determination_points || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("character_inventory")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character-inventory", characterId] });
      toast({
        title: "Item removido",
        description: "O item foi removido do inventário.",
      });
    },
  });

  const applyModifiersMutation = useMutation({
    mutationFn: async () => {
      const newXp = Math.max(0, currentXp + modifiers.xp);
      const newEnergy = Math.max(0, currentEnergy + modifiers.energy);
      const newDetermination = Math.max(0, currentDetermination + modifiers.determination);

      const { error } = await supabase
        .from("characters")
        .update({
          xp: newXp,
          energy: newEnergy,
          determination_points: newDetermination,
        })
        .eq("id", characterId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character", characterId] });
      setModifiers({ xp: 0, energy: 0, determination: 0 });
      toast({
        title: "Atributos atualizados!",
        description: "Os valores foram aplicados com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao aplicar modificadores",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleModifierChange = (key: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setModifiers(prev => ({ ...prev, [key]: numValue }));
  };

  const hasModifiers = modifiers.xp !== 0 || modifiers.energy !== 0 || modifiers.determination !== 0;

  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Package className="w-5 h-5" />
          Inventário
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Manual Modifiers */}
        <div className="p-4 bg-muted/30 border border-primary/30 rounded-lg space-y-3">
          <h4 className="text-sm font-bold text-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Modificar Atributos
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Star className="w-3 h-3" /> XP
              </Label>
              <Input
                type="number"
                value={modifiers.xp || ""}
                onChange={(e) => handleModifierChange("xp", e.target.value)}
                placeholder="+/- XP"
                className="cyber-input h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3" /> Energia
              </Label>
              <Input
                type="number"
                value={modifiers.energy || ""}
                onChange={(e) => handleModifierChange("energy", e.target.value)}
                placeholder="+/- EH"
                className="cyber-input h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Heart className="w-3 h-3" /> Determinação
              </Label>
              <Input
                type="number"
                value={modifiers.determination || ""}
                onChange={(e) => handleModifierChange("determination", e.target.value)}
                placeholder="+/- FH"
                className="cyber-input h-8 text-sm"
              />
            </div>
          </div>
          {hasModifiers && (
            <div className="flex items-center justify-between pt-2 border-t border-primary/20">
              <div className="text-xs text-muted-foreground space-y-1">
                {modifiers.xp !== 0 && <div>XP: {localXp} → {localXp + modifiers.xp}</div>}
                {modifiers.energy !== 0 && <div>EH: {localEnergy} → {localEnergy + modifiers.energy}</div>}
                {modifiers.determination !== 0 && <div>FH: {localDetermination} → {localDetermination + modifiers.determination}</div>}
              </div>
              <Button
                size="sm"
                onClick={() => applyModifiersMutation.mutate()}
                disabled={applyModifiersMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Aplicar
              </Button>
            </div>
          )}
        </div>

        {/* Inventory Items */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando inventário...</div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Inventário vazio</p>
          </div>
        ) : (
          <div className="space-y-2">
            {inventory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-muted/20 border border-primary/20 rounded hover:border-primary/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-primary truncate">
                      {item.shop_items?.name}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      x{item.quantity}
                    </Badge>
                  </div>
                  {item.shop_items?.effect && (
                    <p className="text-xs text-neon-lime">{item.shop_items.effect}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItemMutation.mutate(item.id)}
                  disabled={removeItemMutation.isPending}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
