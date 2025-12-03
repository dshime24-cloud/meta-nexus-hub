import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Hammer, Plus, Package, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  type: string;
  cost: number;
  image_url: string | null;
}

interface CraftingRecipe {
  id: string;
  name: string;
  description: string | null;
  result_item_id: string | null;
  result_quantity: number | null;
  required_level: number | null;
  crafting_time: number | null;
  result_item?: ShopItem;
  ingredients?: CraftingIngredient[];
}

interface CraftingIngredient {
  id: string;
  recipe_id: string;
  item_id: string;
  quantity: number | null;
  item?: ShopItem;
}

interface InventoryItem {
  item_id: string;
  quantity: number;
  item?: ShopItem;
}

interface CraftingSystemProps {
  characterId: string;
  characterLevel: number;
}

export function CraftingSystem({ characterId, characterLevel }: CraftingSystemProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    name: "",
    description: "",
    result_item_id: "",
    result_quantity: 1,
    required_level: 1,
  });
  const [ingredients, setIngredients] = useState<{ item_id: string; quantity: number }[]>([]);
  const queryClient = useQueryClient();

  const { data: shopItems = [] } = useQuery({
    queryKey: ["shop-items-crafting"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shop_items").select("*");
      if (error) throw error;
      return data as ShopItem[];
    },
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ["crafting-recipes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crafting_recipes")
        .select("*, result_item:shop_items(*)")
        .order("required_level");
      if (error) throw error;
      return data as CraftingRecipe[];
    },
  });

  const { data: recipeIngredients = [] } = useQuery({
    queryKey: ["crafting-ingredients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crafting_ingredients")
        .select("*, item:shop_items(*)");
      if (error) throw error;
      return data as CraftingIngredient[];
    },
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["character-inventory-crafting", characterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("character_inventory")
        .select("item_id, quantity, item:shop_items(*)")
        .eq("character_id", characterId);
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  const createRecipeMutation = useMutation({
    mutationFn: async () => {
      const { data: recipe, error: recipeError } = await supabase
        .from("crafting_recipes")
        .insert({
          name: newRecipe.name,
          description: newRecipe.description,
          result_item_id: newRecipe.result_item_id || null,
          result_quantity: newRecipe.result_quantity,
          required_level: newRecipe.required_level,
        })
        .select()
        .single();
      if (recipeError) throw recipeError;

      if (ingredients.length > 0) {
        const ingredientsData = ingredients.map((ing) => ({
          recipe_id: recipe.id,
          item_id: ing.item_id,
          quantity: ing.quantity,
        }));
        const { error: ingError } = await supabase.from("crafting_ingredients").insert(ingredientsData);
        if (ingError) throw ingError;
      }

      return recipe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crafting-recipes"] });
      queryClient.invalidateQueries({ queryKey: ["crafting-ingredients"] });
      setIsCreateOpen(false);
      setNewRecipe({ name: "", description: "", result_item_id: "", result_quantity: 1, required_level: 1 });
      setIngredients([]);
      toast({ title: "Receita criada!", description: "A receita foi criada com sucesso." });
    },
  });

  const craftMutation = useMutation({
    mutationFn: async (recipe: CraftingRecipe) => {
      const recipeIngs = recipeIngredients.filter((ing) => ing.recipe_id === recipe.id);

      // Check inventory
      for (const ing of recipeIngs) {
        const invItem = inventory.find((i) => i.item_id === ing.item_id);
        if (!invItem || invItem.quantity < (ing.quantity || 1)) {
          throw new Error(`Ingrediente insuficiente: ${ing.item?.name}`);
        }
      }

      // Consume ingredients
      for (const ing of recipeIngs) {
        const invItem = inventory.find((i) => i.item_id === ing.item_id);
        const newQty = (invItem?.quantity || 0) - (ing.quantity || 1);
        
        if (newQty <= 0) {
          await supabase
            .from("character_inventory")
            .delete()
            .eq("character_id", characterId)
            .eq("item_id", ing.item_id);
        } else {
          await supabase
            .from("character_inventory")
            .update({ quantity: newQty })
            .eq("character_id", characterId)
            .eq("item_id", ing.item_id);
        }
      }

      // Add result item
      if (recipe.result_item_id) {
        const existingItem = inventory.find((i) => i.item_id === recipe.result_item_id);
        if (existingItem) {
          await supabase
            .from("character_inventory")
            .update({ quantity: existingItem.quantity + (recipe.result_quantity || 1) })
            .eq("character_id", characterId)
            .eq("item_id", recipe.result_item_id);
        } else {
          await supabase.from("character_inventory").insert({
            character_id: characterId,
            item_id: recipe.result_item_id,
            quantity: recipe.result_quantity || 1,
          });
        }
      }

      return recipe;
    },
    onSuccess: (recipe) => {
      queryClient.invalidateQueries({ queryKey: ["character-inventory-crafting"] });
      toast({
        title: "Item criado!",
        description: `Você criou ${recipe.result_quantity}x ${recipe.result_item?.name || recipe.name}`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const canCraft = (recipe: CraftingRecipe) => {
    if ((recipe.required_level || 1) > characterLevel) return false;
    
    const recipeIngs = recipeIngredients.filter((ing) => ing.recipe_id === recipe.id);
    return recipeIngs.every((ing) => {
      const invItem = inventory.find((i) => i.item_id === ing.item_id);
      return invItem && invItem.quantity >= (ing.quantity || 1);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text-fire font-space flex items-center gap-2">
          <Hammer className="w-6 h-6" /> Sistema de Crafting
        </h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient-orange text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Nova Receita
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-neon-orange max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-neon-orange font-space">Criar Nova Receita</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <Input
                placeholder="Nome da Receita"
                value={newRecipe.name}
                onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                className="bg-muted border-neon-orange/50"
              />
              <Textarea
                placeholder="Descrição"
                value={newRecipe.description}
                onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
                className="bg-muted border-neon-orange/50"
              />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={newRecipe.result_item_id}
                  onValueChange={(v) => setNewRecipe({ ...newRecipe, result_item_id: v })}
                >
                  <SelectTrigger className="bg-muted border-neon-orange/50">
                    <SelectValue placeholder="Item Resultado" />
                  </SelectTrigger>
                  <SelectContent>
                    {shopItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Quantidade"
                  value={newRecipe.result_quantity}
                  onChange={(e) => setNewRecipe({ ...newRecipe, result_quantity: parseInt(e.target.value) || 1 })}
                  className="bg-muted border-neon-orange/50"
                  min={1}
                />
              </div>
              <Input
                type="number"
                placeholder="Nível Requerido"
                value={newRecipe.required_level}
                onChange={(e) => setNewRecipe({ ...newRecipe, required_level: parseInt(e.target.value) || 1 })}
                className="bg-muted border-neon-orange/50"
                min={1}
                max={10}
              />

              <div className="border-t border-neon-orange/30 pt-4">
                <h4 className="text-sm font-medium text-neon-magenta mb-2">Ingredientes</h4>
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted-foreground flex-1">
                      {shopItems.find((i) => i.id === ing.item_id)?.name} x{ing.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))}
                      className="text-destructive"
                    >
                      Remover
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Select
                    onValueChange={(itemId) => {
                      if (!ingredients.find((i) => i.item_id === itemId)) {
                        setIngredients([...ingredients, { item_id: itemId, quantity: 1 }]);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-muted border-neon-magenta/50 flex-1">
                      <SelectValue placeholder="Adicionar ingrediente" />
                    </SelectTrigger>
                    <SelectContent>
                      {shopItems
                        .filter((item) => !ingredients.find((i) => i.item_id === item.id))
                        .map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={() => createRecipeMutation.mutate()}
                className="w-full btn-gradient-orange text-primary-foreground"
                disabled={!newRecipe.name}
              >
                Criar Receita
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((recipe) => {
          const recipeIngs = recipeIngredients.filter((ing) => ing.recipe_id === recipe.id);
          const craftable = canCraft(recipe);

          return (
            <Card
              key={recipe.id}
              className={`cyber-card-orange ${!craftable ? "opacity-60" : ""} animate-slide-up`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-neon-orange font-space text-lg">{recipe.name}</span>
                  <Badge
                    variant="outline"
                    className={`${
                      characterLevel >= (recipe.required_level || 1)
                        ? "border-neon-lime text-neon-lime"
                        : "border-destructive text-destructive"
                    }`}
                  >
                    Nv. {recipe.required_level}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recipe.description && (
                  <p className="text-sm text-muted-foreground">{recipe.description}</p>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-neon-magenta" />
                  <span className="text-muted-foreground">Ingredientes:</span>
                </div>
                <div className="pl-6 space-y-1">
                  {recipeIngs.map((ing) => {
                    const invItem = inventory.find((i) => i.item_id === ing.item_id);
                    const hasEnough = invItem && invItem.quantity >= (ing.quantity || 1);
                    return (
                      <div
                        key={ing.id}
                        className={`text-sm flex justify-between ${hasEnough ? "text-neon-lime" : "text-destructive"}`}
                      >
                        <span>{ing.item?.name}</span>
                        <span>
                          {invItem?.quantity || 0}/{ing.quantity || 1}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-neon-orange/30">
                  <ArrowRight className="w-4 h-4 text-neon-cyan" />
                  <span className="text-neon-cyan font-medium">
                    {recipe.result_quantity}x {recipe.result_item?.name || "???"}
                  </span>
                </div>

                <Button
                  onClick={() => craftMutation.mutate(recipe)}
                  disabled={!craftable}
                  className="w-full btn-gradient text-primary-foreground mt-2"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Criar Item
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}